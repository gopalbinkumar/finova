<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Category;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BudgetController extends Controller
{
    public function index(Request $request)
    {
        $periodMonth = $this->resolvePeriodMonth(
            $request->input('period', now()->format('Y-m'))
        );

        $budgets = $request->user()
            ->budgets()
            ->with('category:id,name,type,icon,color')
            ->whereDate('period_month', $periodMonth->toDateString())
            ->latest()
            ->get();

        return response()->json([
            'data' => $budgets->map(fn ($budget) => $this->formatBudget($budget)),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateBudget($request);

        $category = $this->getExpenseCategory($request, $validated['category_id']);
        $periodMonth = $this->resolvePeriodMonth($validated['period']);

        $exists = Budget::where('user_id', $request->user()->id)
            ->where('category_id', $category->id)
            ->whereDate('period_month', $periodMonth->toDateString())
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'category_id' => 'Budget for this category and period already exists.',
            ]);
        }

        $budget = Budget::create([
            'user_id' => $request->user()->id,
            'category_id' => $category->id,
            'period_month' => $periodMonth->toDateString(),
            'limit_amount' => $validated['limit'],
            'alert_at' => $validated['alert_at'] ?? 80,
            'notes' => $validated['notes'] ?? null,
        ]);

        $budget->load('category:id,name,type,icon,color');

        return response()->json([
            'message' => 'Budget created successfully',
            'data' => $this->formatBudget($budget),
        ], 201);
    }

    public function show(Request $request, Budget $budget)
    {
        abort_unless($budget->user_id === $request->user()->id, 403);

        $budget->load('category:id,name,type,icon,color');

        return response()->json([
            'data' => $this->formatBudget($budget),
        ]);
    }

    public function update(Request $request, Budget $budget)
    {
        abort_unless($budget->user_id === $request->user()->id, 403);

        $validated = $this->validateBudget($request);

        $category = $this->getExpenseCategory($request, $validated['category_id']);
        $periodMonth = $this->resolvePeriodMonth($validated['period']);

        $exists = Budget::where('user_id', $request->user()->id)
            ->where('category_id', $category->id)
            ->whereDate('period_month', $periodMonth->toDateString())
            ->where('id', '!=', $budget->id)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'category_id' => 'Budget for this category and period already exists.',
            ]);
        }

        $budget->update([
            'category_id' => $category->id,
            'period_month' => $periodMonth->toDateString(),
            'limit_amount' => $validated['limit'],
            'alert_at' => $validated['alert_at'] ?? 80,
            'notes' => $validated['notes'] ?? null,
        ]);

        $budget->load('category:id,name,type,icon,color');

        return response()->json([
            'message' => 'Budget updated successfully',
            'data' => $this->formatBudget($budget),
        ]);
    }

    public function destroy(Request $request, Budget $budget)
    {
        abort_unless($budget->user_id === $request->user()->id, 403);

        $budget->delete();

        return response()->json([
            'message' => 'Budget deleted successfully',
        ]);
    }

    private function validateBudget(Request $request): array
    {
        return $request->validate([
            'category_id' => [
                'required',
                'integer',
                Rule::exists('categories', 'id')
                    ->where(fn ($query) => $query
                        ->where('user_id', $request->user()->id)
                        ->where('type', 'expense')
                    ),
            ],
            'limit' => [
                'required',
                'numeric',
                'gt:0',
            ],
            'period' => [
                'required',
                'string',
            ],
            'alert_at' => [
                'nullable',
                'integer',
                'min:50',
                'max:100',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);
    }

    private function getExpenseCategory(Request $request, int $categoryId): Category
    {
        $category = Category::where('user_id', $request->user()->id)
            ->where('id', $categoryId)
            ->firstOrFail();

        if ($category->type !== 'expense') {
            throw ValidationException::withMessages([
                'category_id' => 'Budget can only be created for expense categories.',
            ]);
        }

        return $category;
    }

    private function resolvePeriodMonth(string $period): Carbon
    {
        try {
            // Format yang disarankan dari frontend: 2026-07
            if (preg_match('/^\d{4}-\d{2}$/', $period)) {
                return Carbon::createFromFormat('Y-m-d', $period . '-01')->startOfMonth();
            }

            // Kompatibel dengan format dummy lama: July 2024
            return Carbon::parse('1 ' . $period)->startOfMonth();
        } catch (\Throwable $e) {
            throw ValidationException::withMessages([
                'period' => 'Invalid period format.',
            ]);
        }
    }

    private function calculateSpent(Budget $budget): float
    {
        $start = Carbon::parse($budget->period_month)->startOfMonth();
        $end = Carbon::parse($budget->period_month)->endOfMonth();

        return (float) Transaction::where('user_id', $budget->user_id)
            ->where('category_id', $budget->category_id)
            ->where('type', 'expense')
            ->whereBetween('date', [
                $start->toDateString(),
                $end->toDateString(),
            ])
            ->sum('amount');
    }

    private function formatBudget(Budget $budget): array
    {
        $spent = $this->calculateSpent($budget);
        $limit = (float) $budget->limit_amount;
        $remaining = $limit - $spent;
        $percentage = $limit > 0 ? ($spent / $limit) * 100 : 0;

        return [
            'id' => $budget->id,
            'user_id' => $budget->user_id,

            'category_id' => $budget->category_id,
            'category' => $budget->category?->name,
            'icon' => $budget->category?->icon ?? '🏷️',
            'color' => $budget->category?->color ?? '#8B5CF6',
            'category_data' => $budget->category,

            // Field yang dipakai BudgetPage.jsx
            'limit' => $limit,
            'spent' => $spent,
            'period' => Carbon::parse($budget->period_month)->format('F Y'),
            'period_month' => Carbon::parse($budget->period_month)->format('Y-m'),
            'alertAt' => $budget->alert_at,

            // Field tambahan untuk analisis
            'remaining' => $remaining,
            'percentage' => round($percentage, 2),
            'is_over_budget' => $spent > $limit,
            'is_warning' => $percentage >= $budget->alert_at && $spent <= $limit,

            'notes' => $budget->notes,

            'created_at' => $budget->created_at,
            'updated_at' => $budget->updated_at,
        ];
    }
}