<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_manage_accounts(): void
    {
        $user = User::create([
            'name' => 'Account Owner',
            'email' => 'owner@example.com',
            'password' => 'password123',
        ]);

        $this->actingAs($user)
            ->withHeader('Referer', config('app.url'));

        $created = $this->postJson('/api/accounts', [
            'name' => 'BCA Savings',
            'type' => 'bank',
            'currency' => 'IDR',
            'balance' => 1500000,
            'color' => '#2563EB',
            'notes' => 'Primary account',
        ])->assertCreated()
            ->assertJsonPath('data.name', 'BCA Savings')
            ->json('data');

        $this->getJson('/api/accounts')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $created['id']);

        $this->putJson("/api/accounts/{$created['id']}", [
            'name' => 'BCA Main',
            'type' => 'bank',
            'currency' => 'IDR',
            'balance' => 2000000,
            'color' => '#14B8A6',
            'notes' => null,
        ])->assertOk()
            ->assertJsonPath('data.name', 'BCA Main');

        $this->deleteJson("/api/accounts/{$created['id']}")
            ->assertOk();

        $this->assertDatabaseMissing('accounts', ['id' => $created['id']]);
    }
}
