<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Category;
use App\Models\Investment;
use App\Models\InvestmentTransaction;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class InvestmentController extends Controller
{
    private const TYPES = [
        'stock',
        'crypto',
        'gold',
        'mutual_fund',
        'bonds',
        'etf',
        'property',
    ];

    public function index(Request $request)
    {
        $query = Investment::query()
            ->with('account:id,name,type,currency,balance,color')
            ->where('user_id', $request->user()->id)
            ->latest('purchase_date')
            ->latest('id');

        if ($request->filled('account_id')) {
            $query->where('account_id', $request->integer('account_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($builder) use ($search) {
                $builder->where('symbol', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhereHas('account', fn ($account) => $account->where('name', 'like', "%{$search}%"));
            });
        }

        return response()->json([
            'data' => $query->get()->map(fn (Investment $investment) => $this->formatInvestment($investment)),
        ]);
    }

    public function pnl(Request $request)
    {
        $performanceTransactions = Transaction::query()
            ->with('category:id,name,type')
            ->where('user_id', $request->user()->id)
            ->where('affects_balance', false)
            ->where(function ($query) {
                $query->where('source_type', 'investment_performance')
                    ->orWhereHas('category', function ($category) {
                        $category->whereIn('name', ['Investment Gain', 'Investment Loss']);
                    });
            })
            ->orderBy('date')
            ->orderBy('id')
            ->get(['id', 'category_id', 'type', 'amount', 'date']);

        $signedAmount = fn (Transaction $transaction): float => $this->signedInvestmentPerformanceAmount($transaction);

        $realizedGain = (float) $performanceTransactions
            ->filter(fn (Transaction $transaction) => $signedAmount($transaction) > 0)
            ->sum(fn (Transaction $transaction) => $signedAmount($transaction));
        $realizedLoss = (float) $performanceTransactions
            ->filter(fn (Transaction $transaction) => $signedAmount($transaction) < 0)
            ->sum(fn (Transaction $transaction) => $signedAmount($transaction));
        $realizedPnl = $realizedGain + $realizedLoss;

        $unrealizedPnl = (float) Investment::query()
            ->where('user_id', $request->user()->id)
            ->get(['qty', 'buy_price', 'current_price'])
            ->sum(function (Investment $investment) {
                $currentPrice = (float) ($investment->current_price ?? $investment->buy_price);

                return ($currentPrice - (float) $investment->buy_price) * (float) $investment->qty;
            });

        $monthlyRealizedPnl = $performanceTransactions
            ->groupBy(fn (Transaction $transaction) => $transaction->date->format('Y-m'))
            ->map(function ($transactions) use ($signedAmount) {
                return (float) $transactions->sum(
                    fn (Transaction $transaction) => $signedAmount($transaction)
                );
            });

        $history = collect(range(5, 0))
            ->map(function (int $monthsAgo) use ($monthlyRealizedPnl) {
                $month = now()->startOfMonth()->subMonths($monthsAgo);

                return [
                    'month' => $month->format('M Y'),
                    'realizedPnl' => (float) ($monthlyRealizedPnl[$month->format('Y-m')] ?? 0),
                ];
            })
            ->values();

        return response()->json([
            'data' => [
                'realizedPnl' => $realizedPnl,
                'realizedGain' => $realizedGain,
                'realizedLoss' => $realizedLoss,
                'unrealizedPnl' => $unrealizedPnl,
                'totalPnl' => $realizedPnl + $unrealizedPnl,
                'realizedCount' => $performanceTransactions->count(),
                'winningTrades' => $performanceTransactions
                    ->filter(fn (Transaction $transaction) => $signedAmount($transaction) > 0)
                    ->count(),
                'losingTrades' => $performanceTransactions
                    ->filter(fn (Transaction $transaction) => $signedAmount($transaction) < 0)
                    ->count(),
                'history' => $history,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateInvestment($request);
        $account = $this->getInvestmentAccount($request, (int) $data['account_id']);
        $symbol = strtoupper(trim($data['symbol']));

        if ($this->duplicateExists($account->id, $symbol, $data['type'])) {
            throw ValidationException::withMessages([
                'symbol' => ['Asset already exists in this investment account. Use Buy button to add more quantity.'],
            ]);
        }

        $investment = Investment::create([
            ...$data,
            'user_id' => $request->user()->id,
            'account_id' => $account->id,
            'symbol' => $symbol,
            'current_price' => $data['current_price'] ?? $data['buy_price'],
            'purchase_date' => $data['purchase_date'] ?? now()->toDateString(),
        ])->load('account:id,name,type,currency,balance,color');

        return response()->json([
            'message' => 'Investment created successfully.',
            'data' => $this->formatInvestment($investment),
        ], 201);
    }

    public function show(Request $request, Investment $investment)
    {
        $this->ensureOwner($request, $investment);
        $investment->load('account:id,name,type,currency,balance,color');

        return response()->json(['data' => $this->formatInvestment($investment)]);
    }

    public function update(Request $request, Investment $investment)
    {
        $this->ensureOwner($request, $investment);
        $data = $this->validateInvestment($request, true);

        $accountId = (int) ($data['account_id'] ?? $investment->account_id);
        $account = $this->getInvestmentAccount($request, $accountId);
        $symbol = strtoupper(trim($data['symbol'] ?? $investment->symbol));
        $type = $data['type'] ?? $investment->type;

        if ($this->duplicateExists($account->id, $symbol, $type, $investment->id)) {
            throw ValidationException::withMessages([
                'symbol' => ['Asset already exists in this investment account. Use Buy button to add more quantity.'],
            ]);
        }

        $data['account_id'] = $account->id;
        $data['symbol'] = $symbol;

        if (array_key_exists('current_price', $data) && $data['current_price'] === null) {
            $data['current_price'] = $data['buy_price'] ?? $investment->buy_price;
        }

        $investment->update($data);
        $investment->load('account:id,name,type,currency,balance,color');

        return response()->json([
            'message' => 'Investment updated successfully.',
            'data' => $this->formatInvestment($investment->fresh()->load('account:id,name,type,currency,balance,color')),
        ]);
    }

    public function destroy(Request $request, Investment $investment)
    {
        $this->ensureOwner($request, $investment);
        $investment->delete();

        return response()->json([
            'message' => 'Investment archived successfully. Its transaction history was preserved.',
        ]);
    }

    public function buy(Request $request, Investment $investment)
    {
        $this->ensureOwner($request, $investment);
        $validated = $this->validateTrade($request, true);

        $investment = DB::transaction(function () use ($request, $investment, $validated) {
            $locked = Investment::query()->lockForUpdate()->findOrFail($investment->id);
            $account = $this->lockInvestmentAccount($request, (int) $locked->account_id);

            $oldQty = (float) $locked->qty;
            $oldBuyPrice = (float) $locked->buy_price;
            $addedQty = (float) $validated['qty'];
            $price = (float) $validated['price'];
            $fee = (float) ($validated['fee'] ?? 0);
            $grossAmount = round($addedQty * $price, 8);
            $netAmount = round($grossAmount + $fee, 8);

            if ((float) $account->balance < $netAmount) {
                throw ValidationException::withMessages([
                    'account' => ['Insufficient investment account balance.'],
                ]);
            }

            $newQty = $oldQty + $addedQty;
            $newBuyPrice = (($oldQty * $oldBuyPrice) + ($addedQty * $price)) / $newQty;
            $date = $validated['purchase_date'] ?? now()->toDateString();

            $updates = [
                'qty' => $newQty,
                'buy_price' => $newBuyPrice,
                'current_price' => $validated['current_price'] ?? $price,
            ];
            if (array_key_exists('purchase_date', $validated)) $updates['purchase_date'] = $date;
            if (array_key_exists('notes', $validated)) $updates['notes'] = $validated['notes'];
            $locked->update($updates);

            $history = InvestmentTransaction::create([
                'user_id' => $request->user()->id,
                'investment_id' => $locked->id,
                'account_id' => $account->id,
                'type' => 'buy',
                'qty' => $addedQty,
                'price' => $price,
                'fee' => $fee,
                'gross_amount' => $grossAmount,
                'net_amount' => $netAmount,
                'cost_basis' => null,
                'realized_gain_loss' => 0,
                'transaction_date' => $date,
                'notes' => $validated['notes'] ?? null,
            ]);

            Transaction::create([
                'user_id' => $request->user()->id,
                'account_id' => $account->id,
                'category_id' => null,
                'type' => 'expense',
                'amount' => $netAmount,
                'affects_balance' => true,
                'source_type' => 'investment_buy',
                'source_id' => $history->id,
                'investment_id' => $locked->id,
                'date' => $date,
                'description' => "Buy {$locked->symbol}",
                'notes' => $validated['notes'] ?? null,
            ]);

            $account->decrement('balance', $netAmount);

            return $locked->fresh()->load('account:id,name,type,currency,balance,color');
        });

        return response()->json([
            'message' => 'Investment purchased successfully.',
            'mode' => 'buy',
            'data' => $this->formatInvestment($investment),
        ]);
    }

    public function sell(Request $request, Investment $investment)
    {
        $this->ensureOwner($request, $investment);
        $validated = $this->validateTrade($request);

        $result = DB::transaction(function () use ($request, $investment, $validated) {
            $locked = Investment::query()->lockForUpdate()->findOrFail($investment->id);
            $account = $this->lockInvestmentAccount($request, (int) $locked->account_id);
            $availableQty = (float) $locked->qty;
            $soldQty = (float) $validated['qty'];

            if ($soldQty > $availableQty) {
                throw ValidationException::withMessages([
                    'qty' => ['Sell quantity cannot exceed available quantity.'],
                ]);
            }

            $price = (float) $validated['price'];
            $fee = (float) ($validated['fee'] ?? 0);
            $grossAmount = round($soldQty * $price, 8);
            $netAmount = round($grossAmount - $fee, 8);
            if ($netAmount < 0) {
                throw ValidationException::withMessages([
                    'fee' => ['Fee cannot exceed gross sell amount.'],
                ]);
            }

            $costBasis = round($soldQty * (float) $locked->buy_price, 8);
            $realizedGainLoss = round($netAmount - $costBasis, 8);
            $remainingQty = $availableQty - $soldQty;
            $date = $validated['purchase_date'] ?? now()->toDateString();

            $history = InvestmentTransaction::create([
                'user_id' => $request->user()->id,
                'investment_id' => $locked->id,
                'account_id' => $account->id,
                'type' => 'sell',
                'qty' => $soldQty,
                'price' => $price,
                'fee' => $fee,
                'gross_amount' => $grossAmount,
                'net_amount' => $netAmount,
                'cost_basis' => $costBasis,
                'realized_gain_loss' => $realizedGainLoss,
                'transaction_date' => $date,
                'notes' => $validated['notes'] ?? null,
            ]);

            $performanceType = $realizedGainLoss >= 0 ? 'income' : 'expense';
            $performanceName = $realizedGainLoss >= 0 ? 'Investment Gain' : 'Investment Loss';
            $category = Category::firstOrCreate(
                ['user_id' => $request->user()->id, 'name' => $performanceName, 'type' => $performanceType],
                ['icon' => '$', 'color' => $realizedGainLoss >= 0 ? '#10B981' : '#EF4444']
            );

            Transaction::create([
                'user_id' => $request->user()->id,
                'account_id' => $account->id,
                'category_id' => $category->id,
                'type' => $performanceType,
                'amount' => abs($realizedGainLoss),
                'affects_balance' => false,
                'source_type' => 'investment_performance',
                'source_id' => $history->id,
                'investment_id' => $locked->id,
                'date' => $date,
                'description' => "{$performanceName}: {$locked->symbol}",
                'notes' => $validated['notes'] ?? null,
            ]);

            $account->increment('balance', $netAmount);

            if ($remainingQty <= 0) {
                $locked->delete();
                return ['mode' => 'sold_all', 'data' => null];
            }

            $updates = ['qty' => $remainingQty, 'current_price' => $price];
            if (array_key_exists('purchase_date', $validated)) $updates['purchase_date'] = $date;
            if (array_key_exists('notes', $validated)) $updates['notes'] = $validated['notes'];
            $locked->update($updates);

            return [
                'mode' => 'partial_sell',
                'data' => $this->formatInvestment($locked->fresh()->load('account:id,name,type,currency,balance,color')),
            ];
        });

        return response()->json([
            'message' => $result['mode'] === 'sold_all'
                ? 'Investment sold completely and archived.'
                : 'Investment sold successfully.',
            'mode' => $result['mode'],
            'data' => $result['data'],
        ]);
    }

    private function signedInvestmentPerformanceAmount(Transaction $transaction): float
    {
        $amount = (float) $transaction->amount;

        if ($transaction->type === 'expense' || $transaction->category?->type === 'expense') {
            return -abs($amount);
        }

        return abs($amount);
    }

    private function validateInvestment(Request $request, bool $partial = false): array
    {
        $payload = $this->normalizePayload($request);
        $required = $partial ? 'sometimes' : 'required';

        return Validator::make($payload, [
            'account_id' => [$required, 'integer'],
            'symbol' => [$required, 'string', 'max:20'],
            'name' => [$required, 'string', 'max:255'],
            'type' => [$required, Rule::in(self::TYPES)],
            'qty' => [$required, 'numeric', 'gt:0'],
            'buy_price' => [$required, 'numeric', 'gt:0'],
            'current_price' => ['nullable', 'numeric', 'gte:0'],
            'purchase_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ])->validate();
    }

    private function validateTrade(Request $request, bool $includeCurrentPrice = false): array
    {
        $payload = $this->normalizeTradePayload($request, $includeCurrentPrice);
        $rules = [
            'qty' => ['required', 'numeric', 'gt:0'],
            'price' => ['required', 'numeric', 'gt:0'],
            'fee' => ['nullable', 'numeric', 'gte:0'],
            'purchase_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
        if ($includeCurrentPrice) $rules['current_price'] = ['nullable', 'numeric', 'gte:0'];

        return Validator::make($payload, $rules)->validate();
    }

    private function normalizePayload(Request $request): array
    {
        return $this->mapRequest($request, [
            'accountId' => 'account_id', 'account_id' => 'account_id',
            'symbol' => 'symbol', 'name' => 'name', 'type' => 'type', 'qty' => 'qty',
            'buyPrice' => 'buy_price', 'buy_price' => 'buy_price',
            'currentPrice' => 'current_price', 'current_price' => 'current_price',
            'date' => 'purchase_date', 'purchaseDate' => 'purchase_date', 'purchase_date' => 'purchase_date',
            'notes' => 'notes',
        ]);
    }

    private function normalizeTradePayload(Request $request, bool $includeCurrentPrice): array
    {
        $map = [
            'qty' => 'qty', 'price' => 'price', 'fee' => 'fee', 'notes' => 'notes',
            'date' => 'purchase_date', 'purchaseDate' => 'purchase_date', 'purchase_date' => 'purchase_date',
        ];
        if ($includeCurrentPrice) {
            $map['currentPrice'] = 'current_price';
            $map['current_price'] = 'current_price';
        }

        return $this->mapRequest($request, $map);
    }

    private function mapRequest(Request $request, array $map): array
    {
        $payload = [];
        foreach ($map as $input => $output) {
            if ($request->exists($input)) $payload[$output] = $request->input($input);
        }
        return $payload;
    }

    private function getInvestmentAccount(Request $request, int $accountId): Account
    {
        $account = Account::query()
            ->where('user_id', $request->user()->id)
            ->whereKey($accountId)
            ->first();

        if (!$account || $account->type !== 'investment') {
            throw ValidationException::withMessages([
                'account_id' => ['The selected account must be an investment account.'],
            ]);
        }

        return $account;
    }

    private function lockInvestmentAccount(Request $request, int $accountId): Account
    {
        $account = Account::query()
            ->where('user_id', $request->user()->id)
            ->whereKey($accountId)
            ->lockForUpdate()
            ->first();

        if (!$account || $account->type !== 'investment') {
            throw ValidationException::withMessages([
                'account' => ['Investment must belong to an investment account.'],
            ]);
        }

        return $account;
    }

    private function duplicateExists(int $accountId, string $symbol, string $type, ?int $ignoreId = null): bool
    {
        return Investment::query()
            ->where('account_id', $accountId)
            ->whereRaw('UPPER(symbol) = ?', [$symbol])
            ->where('type', $type)
            ->when($ignoreId, fn ($query) => $query->where('id', '<>', $ignoreId))
            ->exists();
    }

    private function ensureOwner(Request $request, Investment $investment): void
    {
        abort_unless((int) $investment->user_id === (int) $request->user()->id, 403);
    }

    private function formatInvestment(Investment $investment): array
    {
        $qty = (float) $investment->qty;
        $buyPrice = (float) $investment->buy_price;
        $currentPrice = (float) ($investment->current_price ?? $investment->buy_price);
        $totalCost = $qty * $buyPrice;
        $totalValue = $qty * $currentPrice;
        $gain = $totalValue - $totalCost;

        return [
            'id' => $investment->id,
            'accountId' => $investment->account_id,
            'accountName' => $investment->account?->name,
            'accountBalance' => $investment->account ? (float) $investment->account->balance : null,
            'accountCurrency' => $investment->account?->currency,
            'symbol' => $investment->symbol,
            'name' => $investment->name,
            'type' => $investment->type,
            'qty' => $qty,
            'buyPrice' => $buyPrice,
            'currentPrice' => $currentPrice,
            'date' => optional($investment->purchase_date)->format('Y-m-d'),
            'notes' => $investment->notes,
            'totalCost' => $totalCost,
            'totalValue' => $totalValue,
            'gain' => $gain,
            'gainPct' => $totalCost > 0 ? ($gain / $totalCost) * 100 : 0,
            'createdAt' => optional($investment->created_at)->toDateTimeString(),
            'updatedAt' => optional($investment->updated_at)->toDateTimeString(),
        ];
    }
}
