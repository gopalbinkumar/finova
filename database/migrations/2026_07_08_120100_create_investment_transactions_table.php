<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('investment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('investment_id')->constrained()->restrictOnDelete();
            $table->foreignId('account_id')->constrained()->restrictOnDelete();
            $table->enum('type', ['buy', 'sell']);
            $table->decimal('qty', 20, 8);
            $table->decimal('price', 20, 8);
            $table->decimal('fee', 20, 8)->default(0);
            $table->decimal('gross_amount', 20, 8);
            $table->decimal('net_amount', 20, 8);
            $table->decimal('cost_basis', 20, 8)->nullable();
            $table->decimal('realized_gain_loss', 20, 8)->nullable();
            $table->date('transaction_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'transaction_date']);
            $table->index(['investment_id', 'type']);
            $table->index(['account_id', 'transaction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('investment_transactions');
    }
};
