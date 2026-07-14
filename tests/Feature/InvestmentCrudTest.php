<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvestmentCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_buy_and_sell_an_existing_investment_without_creating_duplicates(): void
    {
        $user = User::create([
            'name' => 'Investment Owner',
            'email' => 'investor@example.com',
            'password' => 'password123',
        ]);

        $this->actingAs($user)
            ->withHeader('Referer', config('app.url'));

        $account = Account::create([
            'user_id' => $user->id,
            'name' => 'Stocks',
            'type' => 'investment',
            'currency' => 'USD',
            'balance' => 10000,
            'color' => '#2563EB',
        ]);

        $investment = $this->postJson('/api/investments', [
            'accountId' => $account->id,
            'symbol' => 'AAPL',
            'name' => 'Apple Inc.',
            'type' => 'stock',
            'qty' => 10,
            'buyPrice' => 100,
            'currentPrice' => 110,
            'date' => '2026-07-01',
        ])->assertCreated()
            ->assertJsonPath('data.buyPrice', 100)
            ->json('data');

        $this->postJson('/api/investments', [
            'accountId' => $account->id,
            'symbol' => 'aapl',
            'name' => 'Apple Inc.',
            'type' => 'stock',
            'qty' => 1,
            'buyPrice' => 120,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('symbol')
            ->assertJsonPath(
                'message',
                'Asset already exists in this investment account. Use Buy button to add more quantity.'
            );

        $this->postJson("/api/investments/{$investment['id']}/buy", [
            'qty' => 10,
            'price' => 120,
            'fee' => 2,
            'date' => '2026-07-02',
        ])->assertOk()
            ->assertJsonPath('mode', 'buy')
            ->assertJsonPath('data.qty', 20)
            ->assertJsonPath('data.buyPrice', 110)
            ->assertJsonPath('data.currentPrice', 120);

        $this->assertDatabaseHas('accounts', ['id' => $account->id, 'balance' => 8798]);
        $this->assertDatabaseHas('investment_transactions', [
            'investment_id' => $investment['id'],
            'type' => 'buy',
            'net_amount' => 1202,
        ]);
        $this->assertDatabaseHas('transactions', [
            'investment_id' => $investment['id'],
            'source_type' => 'investment_buy',
            'affects_balance' => true,
        ]);

        $this->postJson("/api/investments/{$investment['id']}/sell", [
            'qty' => 21,
            'price' => 130,
            'fee' => 1,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('qty');

        $this->postJson("/api/investments/{$investment['id']}/sell", [
            'qty' => 5,
            'price' => 130,
            'fee' => 1,
        ])->assertOk()
            ->assertJsonPath('mode', 'partial_sell')
            ->assertJsonPath('data.qty', 15)
            ->assertJsonPath('data.buyPrice', 110)
            ->assertJsonPath('data.currentPrice', 130);

        $this->assertDatabaseHas('accounts', ['id' => $account->id, 'balance' => 9447]);
        $this->assertDatabaseHas('investment_transactions', [
            'investment_id' => $investment['id'],
            'type' => 'sell',
            'realized_gain_loss' => 99,
        ]);
        $this->assertDatabaseHas('transactions', [
            'investment_id' => $investment['id'],
            'source_type' => 'investment_performance',
            'amount' => 99,
            'affects_balance' => false,
        ]);

        $this->getJson('/api/investments/pnl')
            ->assertOk()
            ->assertJsonPath('data.realizedPnl', 99)
            ->assertJsonPath('data.realizedGain', 99)
            ->assertJsonPath('data.realizedLoss', 0)
            ->assertJsonPath('data.unrealizedPnl', 300)
            ->assertJsonPath('data.totalPnl', 399)
            ->assertJsonPath('data.realizedCount', 1)
            ->assertJsonPath('data.winningTrades', 1)
            ->assertJsonPath('data.losingTrades', 0)
            ->assertJsonCount(6, 'data.history')
            ->assertJsonPath('data.history.5.realizedPnl', 99);
        $this->assertDatabaseMissing('transactions', [
            'investment_id' => $investment['id'],
            'source_type' => 'investment_sell',
        ]);

        $this->postJson("/api/investments/{$investment['id']}/sell", [
            'qty' => 15,
            'price' => 100,
        ])->assertOk()
            ->assertJsonPath('mode', 'sold_all')
            ->assertJsonPath('data', null);

        $this->assertSoftDeleted('investments', ['id' => $investment['id']]);
        $this->assertDatabaseCount('investment_transactions', 3);
        $this->assertDatabaseCount('transactions', 3);
        $this->assertDatabaseHas('transactions', [
            'investment_id' => $investment['id'],
            'source_type' => 'investment_performance',
            'type' => 'expense',
            'amount' => 150,
            'affects_balance' => false,
        ]);

        $this->getJson('/api/investments/pnl')
            ->assertOk()
            ->assertJsonPath('data.realizedPnl', -51)
            ->assertJsonPath('data.realizedGain', 99)
            ->assertJsonPath('data.realizedLoss', -150)
            ->assertJsonPath('data.unrealizedPnl', 0)
            ->assertJsonPath('data.totalPnl', -51)
            ->assertJsonPath('data.realizedCount', 2)
            ->assertJsonPath('data.winningTrades', 1)
            ->assertJsonPath('data.losingTrades', 1)
            ->assertJsonCount(6, 'data.history')
            ->assertJsonPath('data.history.5.realizedPnl', -51);
    }

    public function test_buy_rejects_insufficient_balance_and_non_investment_accounts(): void
    {
        $user = User::create([
            'name' => 'Careful Investor',
            'email' => 'careful@example.com',
            'password' => 'password123',
        ]);
        $investmentAccount = Account::create([
            'user_id' => $user->id,
            'name' => 'Small Portfolio',
            'type' => 'investment',
            'currency' => 'USD',
            'balance' => 50,
            'color' => '#2563EB',
        ]);
        $bankAccount = Account::create([
            'user_id' => $user->id,
            'name' => 'Bank',
            'type' => 'bank',
            'currency' => 'USD',
            'balance' => 1000,
            'color' => '#2563EB',
        ]);

        $this->actingAs($user)->withHeader('Referer', config('app.url'));

        $this->postJson('/api/investments', [
            'accountId' => $bankAccount->id,
            'symbol' => 'MSFT',
            'name' => 'Microsoft',
            'type' => 'stock',
            'qty' => 1,
            'buyPrice' => 100,
        ])->assertUnprocessable()->assertJsonValidationErrors('account_id');

        $investment = $this->postJson('/api/investments', [
            'accountId' => $investmentAccount->id,
            'symbol' => 'MSFT',
            'name' => 'Microsoft',
            'type' => 'stock',
            'qty' => 1,
            'buyPrice' => 100,
        ])->assertCreated()->json('data');

        $this->postJson("/api/investments/{$investment['id']}/buy", [
            'qty' => 1,
            'price' => 50,
            'fee' => 1,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('account')
            ->assertJsonPath('message', 'Insufficient investment account balance.');

        $this->assertDatabaseHas('accounts', ['id' => $investmentAccount->id, 'balance' => 50]);
        $this->assertDatabaseCount('investment_transactions', 0);
        $this->assertDatabaseCount('transactions', 0);
    }
}
