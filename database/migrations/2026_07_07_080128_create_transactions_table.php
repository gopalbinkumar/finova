<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();

            // Setiap transaksi wajib milik user
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Account utama
            // Untuk income/expense: account ini yang digunakan
            // Untuk transfer: account ini adalah rekening asal
            $table->foreignId('account_id')
                ->constrained('accounts')
                ->cascadeOnDelete();

            // Account tujuan, hanya dipakai untuk transfer
            $table->foreignId('to_account_id')
                ->nullable()
                ->constrained('accounts')
                ->cascadeOnDelete();

            // Category hanya wajib untuk income/expense
            // Transfer tidak perlu category
            $table->foreignId('category_id')
                ->nullable()
                ->constrained('categories')
                ->nullOnDelete();

            $table->enum('type', [
                'income',
                'expense',
                'transfer',
            ])->default('expense');

            // Amount selalu positif.
            // Tanda plus/minus ditentukan dari type.
            $table->decimal('amount', 18, 2);

            $table->date('date');

            $table->string('description', 255);
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'date']);
            $table->index(['account_id', 'date']);
            $table->index(['category_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};