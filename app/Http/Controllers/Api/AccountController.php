<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()
            ->accounts()
            ->latest();

        if ($request->filled('type') && in_array($request->type, [
            'bank',
            'cash',
            'credit_card',
            'e_wallet',
            'investment',
        ])) {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('accounts', 'name')
                    ->where(fn ($query) => $query->where('user_id', $request->user()->id)),
            ],
            'type' => [
                'required',
                Rule::in([
                    'bank',
                    'cash',
                    'credit_card',
                    'e_wallet',
                    'investment',
                ]),
            ],
            'currency' => [
                'required',
                'string',
                'size:3',
                Rule::in([
                    'USD',
                    'EUR',
                    'GBP',
                    'IDR',
                    'JPY',
                    'SGD',
                ]),
            ],
            'balance' => [
                'required',
                'numeric',
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
        ]);

        $account = $request->user()->accounts()->create([
            'name' => trim($validated['name']),
            'type' => $validated['type'],
            'currency' => strtoupper($validated['currency']),
            'balance' => $validated['balance'],
            'color' => $validated['color'] ?? '#2563EB',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Account created successfully',
            'data' => $account,
        ], 201);
    }

    public function show(Request $request, Account $account)
    {
        abort_unless($account->user_id === $request->user()->id, 403);

        return response()->json([
            'data' => $account,
        ]);
    }

    public function update(Request $request, Account $account)
    {
        abort_unless($account->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('accounts', 'name')
                    ->where(fn ($query) => $query->where('user_id', $request->user()->id))
                    ->ignore($account->id),
            ],
            'type' => [
                'required',
                Rule::in([
                    'bank',
                    'cash',
                    'credit_card',
                    'e_wallet',
                    'investment',
                ]),
            ],
            'currency' => [
                'required',
                'string',
                'size:3',
                Rule::in([
                    'USD',
                    'EUR',
                    'GBP',
                    'IDR',
                    'JPY',
                    'SGD',
                ]),
            ],
            'balance' => [
                'required',
                'numeric',
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
        ]);

        if (
            $account->type === 'investment'
            && $validated['type'] !== 'investment'
            && $account->investments()->withTrashed()->exists()
        ) {
            throw ValidationException::withMessages([
                'type' => ['An account containing investments must remain an investment account.'],
            ]);
        }

        $account->update([
            'name' => trim($validated['name']),
            'type' => $validated['type'],
            'currency' => strtoupper($validated['currency']),
            'balance' => $validated['balance'],
            'color' => $validated['color'] ?? '#2563EB',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Account updated successfully',
            'data' => $account,
        ]);
    }

    public function destroy(Request $request, Account $account)
    {
        abort_unless($account->user_id === $request->user()->id, 403);

        if ($account->investments()->withTrashed()->exists() || $account->investmentTransactions()->exists()) {
            throw ValidationException::withMessages([
                'account' => ['This investment account has asset history and cannot be deleted.'],
            ]);
        }

        $account->delete();

        return response()->json([
            'message' => 'Account deleted successfully',
        ]);
    }
}
