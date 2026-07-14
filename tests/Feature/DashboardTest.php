<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_endpoint_returns_aggregated_data(): void
    {
        $user = User::create([
            'name' => 'Dashboard User',
            'email' => 'dashboard@example.com',
            'password' => 'password123',
        ]);

        $account = Account::create([
            'user_id' => $user->id,
            'name' => 'Main Wallet',
            'type' => 'cash',
            'currency' => 'USD',
            'balance' => 1000,
            'color' => '#2563EB',
        ]);

        $incomeCategory = Category::create([
            'user_id' => $user->id,
            'name' => 'Salary',
            'type' => 'income',
            'icon' => 'S',
            'color' => '#2563EB',
        ]);

        Transaction::create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $incomeCategory->id,
            'type' => 'income',
            'amount' => 500,
            'date' => now()->toDateString(),
            'description' => 'Monthly salary',
        ]);

        $this->actingAs($user)
            ->withHeader('Referer', config('app.url'))
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.summaryStats.totalBalance', 1000)
            ->assertJsonPath('data.summaryStats.monthlyIncome', 500)
            ->assertJsonPath('data.recent.0.description', 'Monthly salary')
            ->assertJsonCount(6, 'data.monthlyChartData')
            ->assertJsonStructure([
                'data' => [
                    'period',
                    'periodLabel',
                    'summaryStats',
                    'monthlyStats',
                    'monthlyChartData',
                    'expenseChartData',
                    'cashFlowData',
                    'recent',
                    'topBudgets',
                    'upcomingBills',
                ],
            ]);
    }
}
