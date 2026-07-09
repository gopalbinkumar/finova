<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()
            ->transactions()
            ->with([
                'account:id,name,type,currency,color',
                'toAccount:id,name,type,currency,color',
                'category:id,name,type,icon,color',
            ])
            ->latest('date')
            ->latest('id');

        if ($request->filled('type') && in_array($request->type, ['income', 'expense', 'transfer'])) {
            $query->where('type', $request->type);
        }

        if ($request->filled('account_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('account_id', $request->account_id)
                    ->orWhere('to_account_id', $request->account_id);
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $search = '%' . $request->search . '%';

                $q->where('description', 'like', $search)
                    ->orWhere('notes', 'like', $search)
                    ->orWhereHas('category', function ($categoryQuery) use ($search) {
                        $categoryQuery->where('name', 'like', $search);
                    })
                    ->orWhereHas('account', function ($accountQuery) use ($search) {
                        $accountQuery->where('name', 'like', $search);
                    });
            });
        }

        $transactions = $query->get();

        return response()->json([
            'data' => $transactions->map(fn($transaction) => $this->formatTransaction($transaction)),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateTransaction($request);

        $transaction = DB::transaction(function () use ($request, $validated) {
            $account = $this->getUserAccount($request, $validated['account_id']);

            $toAccount = null;
            if ($validated['type'] === 'transfer') {
                $toAccount = $this->getUserAccount($request, $validated['to_account_id']);
            }

            $category = null;
            if ($validated['type'] !== 'transfer') {
                $category = $this->getUserCategory(
                    $request,
                    $validated['category_id'],
                    $validated['type']
                );
            }

            $transaction = Transaction::create([
                'user_id' => $request->user()->id,
                'account_id' => $account->id,
                'to_account_id' => $toAccount?->id,
                'category_id' => $category?->id,
                'type' => $validated['type'],
                'amount' => $validated['amount'],
                'date' => $validated['date'],
                'description' => trim($validated['description']),
                'notes' => $validated['notes'] ?? null,
            ]);

            $this->applyTransactionToBalance($transaction);

            return $transaction->load([
                'account:id,name,type,currency,color',
                'toAccount:id,name,type,currency,color',
                'category:id,name,type,icon,color',
            ]);
        });

        return response()->json([
            'message' => 'Transaction created successfully',
            'data' => $this->formatTransaction($transaction),
        ], 201);
    }

    public function show(Request $request, Transaction $transaction)
    {
        abort_unless($transaction->user_id === $request->user()->id, 403);

        $transaction->load([
            'account:id,name,type,currency,color',
            'toAccount:id,name,type,currency,color',
            'category:id,name,type,icon,color',
        ]);

        return response()->json([
            'data' => $this->formatTransaction($transaction),
        ]);
    }

    public function update(Request $request, Transaction $transaction)
    {
        abort_unless($transaction->user_id === $request->user()->id, 403);

        if ($transaction->source_type) {
            throw ValidationException::withMessages([
                'transaction' => ['Investment-generated transactions must be managed from the Investment page.'],
            ]);
        }

        $validated = $this->validateTransaction($request);

        $transaction = DB::transaction(function () use ($request, $transaction, $validated) {
            // Kembalikan efek saldo transaksi lama
            $this->reverseTransactionFromBalance($transaction);

            $account = $this->getUserAccount($request, $validated['account_id']);

            $toAccount = null;
            if ($validated['type'] === 'transfer') {
                $toAccount = $this->getUserAccount($request, $validated['to_account_id']);
            }

            $category = null;
            if ($validated['type'] !== 'transfer') {
                $category = $this->getUserCategory(
                    $request,
                    $validated['category_id'],
                    $validated['type']
                );
            }

            $transaction->update([
                'account_id' => $account->id,
                'to_account_id' => $toAccount?->id,
                'category_id' => $category?->id,
                'type' => $validated['type'],
                'amount' => $validated['amount'],
                'date' => $validated['date'],
                'description' => trim($validated['description']),
                'notes' => $validated['notes'] ?? null,
            ]);

            // Terapkan efek saldo transaksi baru
            $this->applyTransactionToBalance($transaction->fresh());

            return $transaction->fresh()->load([
                'account:id,name,type,currency,color',
                'toAccount:id,name,type,currency,color',
                'category:id,name,type,icon,color',
            ]);
        });

        return response()->json([
            'message' => 'Transaction updated successfully',
            'data' => $this->formatTransaction($transaction),
        ]);
    }

    public function destroy(Request $request, Transaction $transaction)
    {
        abort_unless($transaction->user_id === $request->user()->id, 403);

        if ($transaction->source_type) {
            throw ValidationException::withMessages([
                'transaction' => ['Investment-generated transactions must be managed from the Investment page.'],
            ]);
        }

        DB::transaction(function () use ($transaction) {
            // Kembalikan saldo sebelum transaksi dihapus
            $this->reverseTransactionFromBalance($transaction);

            $transaction->delete();
        });

        return response()->json([
            'message' => 'Transaction deleted successfully',
        ]);
    }

    private function validateTransaction(Request $request): array
    {
        $validated = $request->validate([
            'type' => [
                'required',
                Rule::in(['income', 'expense', 'transfer']),
            ],
            'account_id' => [
                'required',
                'integer',
                Rule::exists('accounts', 'id')
                    ->where(fn($query) => $query->where('user_id', $request->user()->id)),
            ],
            'to_account_id' => [
                'nullable',
                'integer',
                'different:account_id',
                Rule::requiredIf(fn() => $request->type === 'transfer'),
                Rule::exists('accounts', 'id')
                    ->where(fn($query) => $query->where('user_id', $request->user()->id)),
            ],
            'category_id' => [
                'nullable',
                'integer',
                Rule::requiredIf(fn() => $request->type !== 'transfer'),
                Rule::exists('categories', 'id')
                    ->where(fn($query) => $query->where('user_id', $request->user()->id)),
            ],
            'amount' => [
                'required',
                'numeric',
                'gt:0',
            ],
            'date' => [
                'required',
                'date',
            ],
            'description' => [
                'required',
                'string',
                'max:255',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        if ($validated['type'] === 'transfer') {
            $validated['category_id'] = null;
        }

        return $validated;
    }

    private function getUserAccount(Request $request, int $accountId): Account
    {
        return Account::where('user_id', $request->user()->id)
            ->where('id', $accountId)
            ->firstOrFail();
    }

    private function getUserCategory(Request $request, int $categoryId, string $type): Category
    {
        $category = Category::where('user_id', $request->user()->id)
            ->where('id', $categoryId)
            ->firstOrFail();

        if ($category->type !== $type) {
            throw ValidationException::withMessages([
                'category_id' => "Selected category does not match transaction type.",
            ]);
        }

        return $category;
    }

    private function applyTransactionToBalance(Transaction $transaction): void
    {
        if (!$transaction->affects_balance) {
            return;
        }

        $amount = (float) $transaction->amount;

        if ($transaction->type === 'income') {
            Account::where('id', $transaction->account_id)
                ->increment('balance', $amount);

            return;
        }

        if ($transaction->type === 'expense') {
            Account::where('id', $transaction->account_id)
                ->decrement('balance', $amount);

            return;
        }

        if ($transaction->type === 'transfer') {
            Account::where('id', $transaction->account_id)
                ->decrement('balance', $amount);

            Account::where('id', $transaction->to_account_id)
                ->increment('balance', $amount);
        }
    }

    private function reverseTransactionFromBalance(Transaction $transaction): void
    {
        if (!$transaction->affects_balance) {
            return;
        }

        $amount = (float) $transaction->amount;

        if ($transaction->type === 'income') {
            Account::where('id', $transaction->account_id)
                ->decrement('balance', $amount);

            return;
        }

        if ($transaction->type === 'expense') {
            Account::where('id', $transaction->account_id)
                ->increment('balance', $amount);

            return;
        }

        if ($transaction->type === 'transfer') {
            Account::where('id', $transaction->account_id)
                ->increment('balance', $amount);

            Account::where('id', $transaction->to_account_id)
                ->decrement('balance', $amount);
        }
    }

    private function formatTransaction(Transaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'user_id' => $transaction->user_id,

            'type' => $transaction->type,
            'amount' => (float) $transaction->amount,
            'affects_balance' => (bool) $transaction->affects_balance,
            'source_type' => $transaction->source_type,
            'source_id' => $transaction->source_id,
            'investment_id' => $transaction->investment_id,
            'date' => optional($transaction->date)->format('Y-m-d'),

            'description' => $transaction->description,
            'notes' => $transaction->notes,

            'account_id' => $transaction->account_id,
            'account' => $transaction->account?->name,
            'account_data' => $transaction->account,

            'to_account_id' => $transaction->to_account_id,
            'to_account' => $transaction->toAccount?->name,
            'to_account_data' => $transaction->toAccount,

            'category_id' => $transaction->category_id,
            'category' => $transaction->category?->name ?? '-',
            'category_data' => $transaction->category,

            'created_at' => $transaction->created_at,
            'updated_at' => $transaction->updated_at,
        ];
    }
}
