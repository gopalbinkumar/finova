<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Goal;
use App\Models\GoalAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class GoalController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()
            ->goals()
            ->with([
                'goalAccounts.account:id,name,type,currency,balance,color',
            ])
            ->latest();

        if ($request->filled('status') && in_array($request->status, ['active', 'completed', 'paused'])) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $goals = $query->get();

        return response()->json([
            'data' => $goals->map(fn ($goal) => $this->formatGoal($goal)),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateGoal($request);

        $goal = DB::transaction(function () use ($request, $validated) {
            $goal = Goal::create([
                'user_id' => $request->user()->id,
                'name' => trim($validated['name']),
                'target_amount' => $validated['target_amount'],
                'deadline' => $validated['deadline'],
                'icon' => $validated['icon'] ?? '🎯',
                'color' => $validated['color'] ?? '#2563EB',
                'notes' => $validated['notes'] ?? null,
                'status' => $validated['status'] ?? 'active',
            ]);

            if (!empty($validated['allocations'])) {
                $this->syncAllocations($request, $goal, $validated['allocations']);
            }

            return $goal->load([
                'goalAccounts.account:id,name,type,currency,balance,color',
            ]);
        });

        return response()->json([
            'message' => 'Goal created successfully',
            'data' => $this->formatGoal($goal),
        ], 201);
    }

    public function show(Request $request, Goal $goal)
    {
        abort_unless($goal->user_id === $request->user()->id, 403);

        $goal->load([
            'goalAccounts.account:id,name,type,currency,balance,color',
        ]);

        return response()->json([
            'data' => $this->formatGoal($goal),
        ]);
    }

    public function update(Request $request, Goal $goal)
    {
        abort_unless($goal->user_id === $request->user()->id, 403);

        $validated = $this->validateGoal($request, $goal);

        $goal = DB::transaction(function () use ($request, $goal, $validated) {
            $goal->update([
                'name' => trim($validated['name']),
                'target_amount' => $validated['target_amount'],
                'deadline' => $validated['deadline'],
                'icon' => $validated['icon'] ?? $goal->icon,
                'color' => $validated['color'] ?? $goal->color,
                'notes' => $validated['notes'] ?? null,
                'status' => $validated['status'] ?? $goal->status,
            ]);

            if (array_key_exists('allocations', $validated)) {
                $this->syncAllocations($request, $goal, $validated['allocations'] ?? []);
            }

            return $goal->fresh()->load([
                'goalAccounts.account:id,name,type,currency,balance,color',
            ]);
        });

        return response()->json([
            'message' => 'Goal updated successfully',
            'data' => $this->formatGoal($goal),
        ]);
    }

    public function destroy(Request $request, Goal $goal)
    {
        abort_unless($goal->user_id === $request->user()->id, 403);

        $goal->delete();

        return response()->json([
            'message' => 'Goal deleted successfully',
        ]);
    }

    public function updateAllocations(Request $request, Goal $goal)
    {
        abort_unless($goal->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'allocations' => ['nullable', 'array'],
            'allocations.*.account_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('accounts', 'id')
                    ->where(fn ($query) => $query->where('user_id', $request->user()->id)),
            ],
            'allocations.*.amount' => [
                'required',
                'numeric',
                'gte:0',
            ],
            'allocations.*.notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        $goal = DB::transaction(function () use ($request, $goal, $validated) {
            $this->syncAllocations($request, $goal, $validated['allocations'] ?? []);

            return $goal->fresh()->load([
                'goalAccounts.account:id,name,type,currency,balance,color',
            ]);
        });

        return response()->json([
            'message' => 'Goal allocations updated successfully',
            'data' => $this->formatGoal($goal),
        ]);
    }

    private function validateGoal(Request $request, ?Goal $goal = null): array
    {
        return $request->validate([
            'name' => [
                'required',
                'string',
                'max:150',
                Rule::unique('goals', 'name')
                    ->where(fn ($query) => $query->where('user_id', $request->user()->id))
                    ->ignore($goal?->id),
            ],

            // Frontend AddGoalModal mengirim target dan target_amount.
            // Backend pakai target_amount sebagai field utama.
            'target_amount' => [
                'required_without:target',
                'numeric',
                'gt:0',
            ],
            'target' => [
                'nullable',
                'numeric',
                'gt:0',
            ],

            'deadline' => [
                'required',
                'date',
            ],
            'icon' => [
                'nullable',
                'string',
                'max:20',
            ],
            'color' => [
                'nullable',
                'regex:/^#[0-9A-Fa-f]{6}$/',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'status' => [
                'nullable',
                Rule::in(['active', 'completed', 'paused']),
            ],

            // Optional saat create/update goal.
            // Untuk UI sekarang, alokasi biasanya diedit lewat GoalAllocationsModal.
            'allocations' => [
                'nullable',
                'array',
            ],
            'allocations.*.account_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('accounts', 'id')
                    ->where(fn ($query) => $query->where('user_id', $request->user()->id)),
            ],
            'allocations.*.amount' => [
                'required',
                'numeric',
                'gte:0',
            ],
            'allocations.*.notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);
    }

    private function syncAllocations(Request $request, Goal $goal, array $allocations): void
    {
        $accountIds = collect($allocations)
            ->pluck('account_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->values();

        if ($accountIds->duplicates()->isNotEmpty()) {
            throw ValidationException::withMessages([
                'allocations' => 'Each account can only be selected once for a goal.',
            ]);
        }

        $validAccountCount = Account::where('user_id', $request->user()->id)
            ->whereIn('id', $accountIds)
            ->count();

        if ($validAccountCount !== $accountIds->count()) {
            throw ValidationException::withMessages([
                'allocations' => 'One or more selected accounts are invalid.',
            ]);
        }

        // Ini hanya sinkronisasi catatan alokasi.
        // Tidak ada update saldo account.
        $goal->goalAccounts()->delete();

        foreach ($allocations as $allocation) {
            if (empty($allocation['account_id'])) {
                continue;
            }

            GoalAccount::create([
                'user_id' => $request->user()->id,
                'goal_id' => $goal->id,
                'account_id' => $allocation['account_id'],
                'amount' => $allocation['amount'] ?? 0,
                'notes' => $allocation['notes'] ?? null,
            ]);
        }
    }

    private function formatGoal(Goal $goal): array
    {
        $allocations = $goal->goalAccounts ?? collect();

        $current = (float) $allocations->sum(fn ($allocation) => (float) $allocation->amount);
        $target = (float) $goal->target_amount;
        $progress = $target > 0 ? ($current / $target) * 100 : 0;
        $remaining = max($target - $current, 0);

        $computedStatus = $goal->status;

        if ($current >= $target && $target > 0) {
            $computedStatus = 'completed';
        } elseif ($goal->status === 'completed' && $current < $target) {
            $computedStatus = 'active';
        }

        return [
            'id' => $goal->id,
            'user_id' => $goal->user_id,

            'name' => $goal->name,
            'icon' => $goal->icon,
            'color' => $goal->color,

            // Format untuk GoalsPage.jsx
            'target' => $target,
            'target_amount' => $target,
            'current' => $current,
            'current_amount' => $current,
            'remaining' => $remaining,
            'progress' => round($progress, 2),

            'deadline' => optional($goal->deadline)->format('Y-m-d'),
            'notes' => $goal->notes,
            'status' => $computedStatus,

            // Dua nama field agar cocok dengan normalizer di GoalAllocationsModal.jsx
            'allocations' => $allocations->map(fn ($allocation) => $this->formatAllocation($allocation))->values(),
            'goal_accounts' => $allocations->map(fn ($allocation) => $this->formatAllocation($allocation))->values(),

            'created_at' => $goal->created_at,
            'updated_at' => $goal->updated_at,
        ];
    }

    private function formatAllocation(GoalAccount $allocation): array
    {
        return [
            'id' => $allocation->id,
            'goal_id' => $allocation->goal_id,
            'account_id' => $allocation->account_id,
            'amount' => (float) $allocation->amount,
            'notes' => $allocation->notes,

            'account' => $allocation->account
                ? [
                    'id' => $allocation->account->id,
                    'name' => $allocation->account->name,
                    'type' => $allocation->account->type,
                    'currency' => $allocation->account->currency,
                    'balance' => (float) $allocation->account->balance,
                    'color' => $allocation->account->color,
                ]
                : null,
        ];
    }
}