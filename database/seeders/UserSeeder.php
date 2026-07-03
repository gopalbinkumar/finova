<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create the demo user
        User::firstOrCreate(
            ['email' => 'demo@finova.app'],
            [
                'name'              => 'Demo User',
                'email'             => 'demo@finova.app',
                'password'          => Hash::make('password'),
                'email_verified_at' => now(),
                'phone'             => '+1 (555) 000-0000',
                'currency'          => 'USD',
                'timezone'          => 'UTC',
                'theme'             => 'system',
            ]
        );

        // Create additional fake users for development
        User::factory(9)->create();
    }
}
