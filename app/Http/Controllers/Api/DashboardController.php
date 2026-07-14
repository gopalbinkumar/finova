<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Budget;
use App\Models\Debt;
use App\Models\Goal;
use App\Models\Investment;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $now = now();
        $periodStart = $now->copy()->startOfMonth();
        $periodEnd = $now->copy()->endOfMonth();
        $previousStart = $now->copy()->subMonthNoOverflow()->startOfMonth();
        $previousEnd = $now->copy()->subMonthNoOverflow()->endOfMonth();
        $sixMonthStart = $now->copy()->subMonthsNoOverflow(5)->startOfMonth();

        $accounts = Account::query()
            ->where('user_id', $userId)
            ->get(['id', 'name', 'type', 'currency', 'balance', 'color']);

        $transactions = Transaction::query()
            ->with([
                'category:id,name,icon,color,type',
                'account:id,name,type,currency,color',
                'toAccount:id,name,type,currency,color',
            ])
            ->where('user_id', $userId)
            ->whereDate('date', '>=', $sixMonthStart->toDateString())
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        $recent = Transaction::query()
            ->with([
                'category:id,name,icon,color,type',
                'account:id,name,type,currency,color',
                'toAccount:id,name,type,currency,color',
            ])
            ->where('user_id', $userId)
            ->latest('date')
            ->latest('id')
            ->limit(6)
            ->get()
            ->map(fn (Transaction $transaction) => $this->formatTransaction($transaction))
            ->values();

        $budgets = $this->currentBudgets($userId, $periodStart, $periodEnd);
        $goals = $this->goalStats($userId);
        $debts = $this->debtStats($userId);

        $accountInvestmentTotal = (float) $accounts
            ->filter(fn (Account $account) => $account->type === 'investment')
            ->sum(fn (Account $account) => (float) $account->balance);

        $directInvestmentTotal = (float) Investment::query()
            ->where('user_id', $userId)
            ->get(['qty', 'current_price', 'buy_price'])
            ->sum(function (Investment $investment) {
                $price = (float) ($investment->current_price ?? $investment->buy_price);

                return (float) $investment->qty * $price;
            });

        $investmentTotal = max($accountInvestmentTotal, $directInvestmentTotal);
        $totalBalance = (float) $accounts
            ->filter(fn (Account $account) => $account->type !== 'investment')
            ->sum(fn (Account $account) => (float) $account->balance);

        $monthlyStats = $this->monthlyStats($transactions, $periodStart, $periodEnd, $previousStart, $previousEnd);
        $monthlyChartData = $this->monthlyChartData($transactions, $now);
        $cashFlowData = $this->cashFlowData($transactions, $accounts, $now);
        $expenseCategoryData = $this->expenseCategoryData($transactions, $periodStart, $periodEnd);

        return response()->json([
            'data' => [
                'userName' => $request->user()->name,
                'period' => $periodStart->format('Y-m'),
                'periodLabel' => $now->format('F Y'),
                'currentMonthShort' => $now->format('M'),
                'summaryStats' => [
                    'netWorth' => $totalBalance + $investmentTotal - $debts['totalDebt'],
                    'totalBalance' => $totalBalance,
                    'totalInvestment' => $investmentTotal,
                    'monthlyIncome' => $monthlyStats['current']['income'],
                    'monthlyExpense' => $monthlyStats['current']['expense'],
                    'activeGoals' => $goals['activeCount'],
                    'activeDebts' => $debts['activeCount'],
                ],
                'monthlyStats' => $monthlyStats,
                'completedGoalsCount' => $goals['completedCount'],
                'debtDueThisWeek' => $debts['dueThisWeek'],
                'monthlyChartData' => $monthlyChartData,
                'expenseCategoryData' => $expenseCategoryData,
                'expenseChartData' => $expenseCategoryData->isNotEmpty()
                    ? $expenseCategoryData
                    : collect([['name' => 'No spending', 'value' => 0, 'color' => '#94A3B8']]),
                'cashFlowData' => $cashFlowData,
                'recent' => $recent,
                'topBudgets' => $budgets,
                'upcomingBills' => $debts['upcomingBills'],
            ],
        ]);
    }

    private function currentBudgets(int $userId, Carbon $periodStart, Carbon $periodEnd): Collection
    {
        $categorySpent = Transaction::query()
            ->where('user_id', $userId)
            ->where('type', 'expense')
            ->whereBetween('date', [$periodStart->toDateString(), $periodEnd->toDateString()])
            ->selectRaw('category_id, SUM(amount) as total')
            ->groupBy('category_id')
            ->pluck('total', 'category_id');

        return Budget::query()
            ->with('category:id,name,icon,color')
            ->where('user_id', $userId)
            ->whereDate('period_month', $periodStart->toDateString())
            ->get()
            ->map(function (Budget $budget) use ($categorySpent) {
                $limit = (float) $budget->limit_amount;
                $spent = (float) ($categorySpent[$budget->category_id] ?? 0);

                return [
                    'id' => $budget->id,
                    'category' => $budget->category?->name ?? 'Budget',
                    'icon' => $budget->category?->icon ?? '📊',
                    'color' => $budget->category?->color ?? '#2563EB',
                    'spent' => $spent,
                    'limit' => $limit,
                ];
            })
            ->sortByDesc(fn (array $budget) => $budget['limit'] > 0 ? $budget['spent'] / $budget['limit'] : 0)
            ->take(4)
            ->values();
    }

    private function goalStats(int $userId): array
    {
        $goals = Goal::query()
            ->with('goalAccounts:id,goal_id,amount')
            ->where('user_id', $userId)
            ->get(['id', 'target_amount', 'status']);

        $active = 0;
        $completed = 0;

        foreach ($goals as $goal) {
            $target = (float) $goal->target_amount;
            $current = (float) $goal->goalAccounts->sum(fn ($allocation) => (float) $allocation->amount);

            if ($target > 0 && $current >= $target) {
                $completed++;
            } elseif ($target > 0) {
                $active++;
            }
        }

        return [
            'activeCount' => $active,
            'completedCount' => $completed,
        ];
    }

    private function debtStats(int $userId): array
    {
        $debts = Debt::query()
            ->where('user_id', $userId)
            ->orderByRaw('remaining_balance <= 0')
            ->orderBy('due_date')
            ->get();

        $active = $debts->filter(fn (Debt $debt) => (float) $debt->remaining_balance > 0);

        return [
            'activeCount' => $active->count(),
            'totalDebt' => (float) $active->sum(fn (Debt $debt) => (float) $debt->remaining_balance),
            'dueThisWeek' => (float) $active->sum(function (Debt $debt) {
                $daysLeft = $this->daysLeft($debt->due_date);

                return $daysLeft !== null && $daysLeft >= 0 && $daysLeft <= 7
                    ? (float) $debt->remaining_balance
                    : 0;
            }),
            'upcomingBills' => $active
                ->filter(fn (Debt $debt) => ($this->daysLeft($debt->due_date) ?? 0) >= 0)
                ->sortBy(fn (Debt $debt) => $debt->due_date?->timestamp ?? PHP_INT_MAX)
                ->take(4)
                ->map(fn (Debt $debt) => [
                    'name' => $debt->borrower ?? 'Debt',
                    'dueDate' => $debt->due_date ? $debt->due_date->format('M j') : '-',
                    'amount' => (float) $debt->remaining_balance,
                    'icon' => '💳',
                    'color' => '#F59E0B',
                ])
                ->values(),
        ];
    }

    private function monthlyStats(
        Collection $transactions,
        Carbon $periodStart,
        Carbon $periodEnd,
        Carbon $previousStart,
        Carbon $previousEnd
    ): array {
        $current = $this->sumIncomeExpenseBetween($transactions, $periodStart, $periodEnd);
        $last = $this->sumIncomeExpenseBetween($transactions, $previousStart, $previousEnd);

        return [
            'current' => $current,
            'last' => $last,
            'incomeTrend' => $this->calculateTrend($current['income'], $last['income']),
            'expenseTrend' => $this->calculateTrend($current['expense'], $last['expense']),
        ];
    }

    private function monthlyChartData(Collection $transactions, Carbon $now): Collection
    {
        return collect(range(5, 0))
            ->map(function (int $monthsAgo) use ($transactions, $now) {
                $month = $now->copy()->subMonthsNoOverflow($monthsAgo)->startOfMonth();
                $totals = $this->sumIncomeExpenseBetween(
                    $transactions,
                    $month,
                    $month->copy()->endOfMonth()
                );

                return [
                    'key' => $month->format('Y-m'),
                    'month' => $month->format('M'),
                    'income' => $totals['income'],
                    'expense' => $totals['expense'],
                ];
            })
            ->values();
    }

    private function expenseCategoryData(Collection $transactions, Carbon $periodStart, Carbon $periodEnd): Collection
    {
        return $transactions
            ->filter(fn (Transaction $transaction) => $transaction->type === 'expense'
                && $this->dateBetween($transaction->date, $periodStart, $periodEnd))
            ->groupBy(fn (Transaction $transaction) => $transaction->category?->name ?? 'Uncategorized')
            ->map(function (Collection $items, string $name) {
                $category = $items->first()?->category;

                return [
                    'name' => $name,
                    'value' => (float) $items->sum(fn (Transaction $transaction) => (float) $transaction->amount),
                    'color' => $category?->color ?? '#94A3B8',
                ];
            })
            ->sortByDesc('value')
            ->take(6)
            ->values();
    }

    private function cashFlowData(Collection $transactions, Collection $accounts, Carbon $now): Collection
    {
        $today = (int) $now->format('j');
        $periodStart = $now->copy()->startOfMonth();
        $periodEnd = $now->copy()->endOfMonth();
        $dailyNet = array_fill(1, $today, 0);

        $transactions
            ->filter(fn (Transaction $transaction) => $this->dateBetween($transaction->date, $periodStart, $periodEnd))
            ->each(function (Transaction $transaction) use (&$dailyNet) {
                if (! in_array($transaction->type, ['income', 'expense'], true)) {
                    return;
                }

                $day = (int) $transaction->date->format('j');

                if (! array_key_exists($day, $dailyNet)) {
                    return;
                }

                $amount = (float) $transaction->amount;
                $dailyNet[$day] += $transaction->type === 'income' ? $amount : -$amount;
            });

        $cashBalance = (float) $accounts
            ->filter(fn (Account $account) => $account->type !== 'investment')
            ->sum(fn (Account $account) => (float) $account->balance);

        $running = $cashBalance - array_sum($dailyNet);

        return collect($dailyNet)
            ->map(function (float $net, int $day) use (&$running) {
                $running += $net;

                return [
                    'day' => $day,
                    'balance' => $running,
                ];
            })
            ->values();
    }

    private function sumIncomeExpenseBetween(Collection $transactions, Carbon $start, Carbon $end): array
    {
        $filtered = $transactions->filter(fn (Transaction $transaction) => $this->dateBetween($transaction->date, $start, $end));

        return [
            'income' => (float) $filtered
                ->filter(fn (Transaction $transaction) => $transaction->type === 'income')
                ->sum(fn (Transaction $transaction) => (float) $transaction->amount),
            'expense' => (float) $filtered
                ->filter(fn (Transaction $transaction) => $transaction->type === 'expense')
                ->sum(fn (Transaction $transaction) => (float) $transaction->amount),
        ];
    }

    private function formatTransaction(Transaction $transaction): array
    {
        $category = $transaction->category?->name ?? 'Uncategorized';

        if ($transaction->type === 'transfer') {
            $from = $transaction->account?->name ?? 'Account';
            $to = $transaction->toAccount?->name ?? 'Account';
            $category = "{$from} → {$to}";
        }

        return [
            'id' => $transaction->id,
            'type' => $transaction->type,
            'amount' => (float) $transaction->amount,
            'date' => optional($transaction->date)->format('Y-m-d'),
            'description' => $transaction->description ?? 'Transaction',
            'category' => $category,
            'category_color' => $transaction->category?->color ?? '#94A3B8',
            'category_icon' => $transaction->category?->icon ?? '',
        ];
    }

    private function calculateTrend(float $current, float $previous): float
    {
        if ($previous == 0.0 && $current > 0) {
            return 100;
        }

        if ($previous == 0.0) {
            return 0;
        }

        return (($current - $previous) / $previous) * 100;
    }

    private function dateBetween(?Carbon $date, Carbon $start, Carbon $end): bool
    {
        return $date && $date->betweenIncluded($start, $end);
    }

    private function daysLeft(?Carbon $date): ?int
    {
        return $date
            ? now()->startOfDay()->diffInDays($date->copy()->startOfDay(), false)
            : null;
    }
}
