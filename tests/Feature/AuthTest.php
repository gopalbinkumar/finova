<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeader('Referer', config('app.url'));
    }

    public function test_user_can_register_and_receive_their_data(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Budi Santoso',
            'email' => 'BUDI@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.user.name', 'Budi Santoso')
            ->assertJsonPath('data.user.email', 'budi@example.com');

        $this->assertDatabaseHas('users', ['email' => 'budi@example.com']);
        $this->assertAuthenticated();
    }

    public function test_user_can_login_and_fetch_their_data(): void
    {
        $user = User::create([
            'name' => 'Siti Aminah',
            'email' => 'siti@example.com',
            'password' => 'password123',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'SITI@example.com',
            'password' => 'password123',
        ])->assertOk()->assertJsonPath('data.user.id', $user->id);

        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.email', 'siti@example.com');
    }

    public function test_invalid_password_is_rejected(): void
    {
        User::create([
            'name' => 'Siti Aminah',
            'email' => 'siti@example.com',
            'password' => 'password123',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'siti@example.com',
            'password' => 'salah-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->assertGuest('web');
    }

    public function test_user_can_update_profile_preferences(): void
    {
        $user = User::create([
            'name' => 'Siti Aminah',
            'email' => 'siti@example.com',
            'password' => 'password123',
        ]);

        $this->actingAs($user)
            ->putJson('/api/auth/profile', [
                'name' => 'Siti Nur Aminah',
                'email' => 'siti.nur@example.com',
                'phone' => '+628123456789',
                'currency' => 'IDR',
                'number_format' => 'id-ID',
                'show_decimals' => false,
                'timezone' => 'Asia/Jakarta',
                'theme' => 'dark',
            ])
            ->assertOk()
            ->assertJsonPath('data.user.currency', 'IDR')
            ->assertJsonPath('data.user.number_format', 'id-ID')
            ->assertJsonPath('data.user.show_decimals', false);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => 'siti.nur@example.com',
            'currency' => 'IDR',
            'number_format' => 'id-ID',
            'show_decimals' => false,
            'theme' => 'dark',
        ]);
    }

    public function test_user_can_change_password(): void
    {
        $user = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'password' => 'password123',
        ]);

        $this->actingAs($user)
            ->postJson('/api/auth/change-password', [
                'current_password' => 'password123',
                'password' => 'new-password123',
                'password_confirmation' => 'new-password123',
            ])
            ->assertOk();

        $this->assertTrue(Hash::check('new-password123', $user->fresh()->password));
    }

    public function test_user_can_logout(): void
    {
        $user = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'password' => 'password123',
        ]);

        $this->actingAs($user)
            ->postJson('/api/auth/logout')
            ->assertOk();

        $this->assertGuest('web');
    }
}
