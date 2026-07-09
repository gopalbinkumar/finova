<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('investments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();

            $table->string('symbol', 20);
            $table->string('name');

            $table->enum('type', [
                'stock',
                'crypto',
                'gold',
                'mutual_fund',
                'bonds',
                'etf',
                'property',
            ])->default('stock');

            $table->decimal('qty', 20, 8);
            $table->decimal('buy_price', 20, 8);
            $table->decimal('current_price', 20, 8)->nullable();

            $table->date('purchase_date')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'symbol']);
            $table->index('purchase_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('investments');
    }
};