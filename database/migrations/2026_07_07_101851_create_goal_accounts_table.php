<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('goal_accounts', function (Blueprint $table) {
            $table->id();

            // Tetap simpan user_id agar query dan validasi multi-user lebih aman
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('goal_id')
                ->constrained('goals')
                ->cascadeOnDelete();

            $table->foreignId('account_id')
                ->constrained('accounts')
                ->cascadeOnDelete();

            // Ini hanya catatan alokasi, bukan perubahan saldo account
            $table->decimal('amount', 18, 2)->default(0);

            $table->text('notes')->nullable();

            $table->timestamps();

            // Satu account hanya boleh muncul sekali dalam goal yang sama
            $table->unique(['goal_id', 'account_id']);

            $table->index(['user_id', 'goal_id']);
            $table->index(['user_id', 'account_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goal_accounts');
    }
};