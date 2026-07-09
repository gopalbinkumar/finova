<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Debt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class DebtController extends Controller
{
    private const TYPES = [
        'debt',
        'receivable',
    ];

    public function index(Request $request)
    {
        $query = Debt::query()
            ->orderByRaw('remaining_balance <= 0')
            ->orderBy('due_date')
            ->latest('id');

        if ($request->user()) {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $status = $request->status;

            if ($status === 'paid') {
                $query->where('remaining_balance', '<=', 0);
            }

            if ($status === 'active') {
                $query->where('remaining_balance', '>', 0)
                    ->where('due_date', '>', now()->addDays(14)->toDateString());
            }

            if ($status === 'due_soon') {
                $query->where('remaining_balance', '>', 0)
                    ->whereBetween('due_date', [
                        now()->toDateString(),
                        now()->addDays(14)->toDateString(),
                    ]);
            }

            if ($status === 'overdue') {
                $query->where('remaining_balance', '>', 0)
                    ->where('due_date', '<', now()->toDateString());
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('borrower', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        $debts = $query->get();

        return response()->json([
            'data' => $debts->map(fn ($debt) => $this->formatDebt($debt)),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateDebt($request);

        $data['remaining_balance'] = $data['remaining_balance'] ?? $data['amount'];

        if ($request->user()) {
            $data['user_id'] = $request->user()->id;
        }

        $debt = Debt::create($data);

        return response()->json([
            'message' => 'Debt record created successfully.',
            'data' => $this->formatDebt($debt),
        ], 201);
    }

    public function show(Request $request, Debt $debt)
    {
        $this->ensureOwner($request, $debt);

        return response()->json([
            'data' => $this->formatDebt($debt),
        ]);
    }

    public function update(Request $request, Debt $debt)
    {
        $this->ensureOwner($request, $debt);

        $data = $this->validateDebt($request, true, $debt);

        if (
            array_key_exists('amount', $data)
            && !array_key_exists('remaining_balance', $data)
            && (float) $debt->remaining_balance > (float) $data['amount']
        ) {
            $data['remaining_balance'] = $data['amount'];
        }

        $debt->update($data);

        return response()->json([
            'message' => 'Debt record updated successfully.',
            'data' => $this->formatDebt($debt->fresh()),
        ]);
    }

    public function destroy(Request $request, Debt $debt)
    {
        $this->ensureOwner($request, $debt);

        $debt->delete();

        return response()->json([
            'message' => 'Debt record deleted successfully.',
        ]);
    }

    private function validateDebt(Request $request, bool $partial = false, ?Debt $debt = null): array
    {
        $payload = $this->normalizePayload($request);

        $required = $partial ? 'sometimes' : 'required';

        $validator = Validator::make($payload, [
            'type' => [$required, Rule::in(self::TYPES)],
            'borrower' => [$required, 'string', 'max:255'],
            'amount' => [$required, 'numeric', 'gt:0'],
            'remaining_balance' => ['nullable', 'numeric', 'gte:0'],
            'due_date' => [$required, 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $validator->after(function ($validator) use ($payload, $debt) {
            $amount = array_key_exists('amount', $payload)
                ? (float) $payload['amount']
                : (float) ($debt?->amount ?? 0);

            $remaining = array_key_exists('remaining_balance', $payload)
                ? (float) $payload['remaining_balance']
                : (float) ($debt?->remaining_balance ?? $amount);

            if ($amount > 0 && $remaining > $amount) {
                $validator->errors()->add(
                    'remaining_balance',
                    'Remaining balance cannot exceed total amount.'
                );
            }
        });

        return $validator->validate();
    }

    private function normalizePayload(Request $request): array
    {
        $map = [
            'type' => 'type',
            'borrower' => 'borrower',

            'amount' => 'amount',

            'remaining' => 'remaining_balance',
            'remainingBalance' => 'remaining_balance',
            'remaining_balance' => 'remaining_balance',

            'dueDate' => 'due_date',
            'due_date' => 'due_date',

            'notes' => 'notes',
        ];

        $payload = [];

        foreach ($map as $inputKey => $dbKey) {
            if ($request->exists($inputKey)) {
                $payload[$dbKey] = $request->input($inputKey);
            }
        }

        return $payload;
    }

    private function ensureOwner(Request $request, Debt $debt): void
    {
        if (
            $request->user()
            && $debt->user_id
            && $debt->user_id !== $request->user()->id
        ) {
            abort(403, 'Unauthorized.');
        }
    }

    private function formatDebt(Debt $debt): array
    {
        $amount = (float) $debt->amount;
        $remaining = (float) $debt->remaining_balance;
        $paidAmount = max($amount - $remaining, 0);
        $paidPct = $amount > 0 ? min(($paidAmount / $amount) * 100, 100) : 0;

        $daysLeft = $debt->due_date
            ? now()->startOfDay()->diffInDays($debt->due_date->copy()->startOfDay(), false)
            : null;

        if ($remaining <= 0) {
            $status = 'paid';
        } elseif ($daysLeft !== null && $daysLeft < 0) {
            $status = 'overdue';
        } elseif ($daysLeft !== null && $daysLeft <= 14) {
            $status = 'due_soon';
        } else {
            $status = 'active';
        }

        return [
            'id' => $debt->id,
            'type' => $debt->type,
            'borrower' => $debt->borrower,
            'amount' => $amount,
            'remaining' => $remaining,
            'remainingBalance' => $remaining,
            'paidAmount' => $paidAmount,
            'paidPct' => $paidPct,
            'dueDate' => optional($debt->due_date)->format('Y-m-d'),
            'daysLeft' => $daysLeft,
            'status' => $status,
            'notes' => $debt->notes,
            'createdAt' => optional($debt->created_at)->toDateTimeString(),
            'updatedAt' => optional($debt->updated_at)->toDateTimeString(),
        ];
    }
}