<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();

            // Setiap budget milik user tertentu
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Budget hanya untuk kategori expense
            $table->foreignId('category_id')
                ->constrained('categories')
                ->cascadeOnDelete();

            // Periode bulan budget.
            // Simpan sebagai tanggal awal bulan, misalnya 2026-07-01.
            $table->date('period_month');

            // Limit budget bulanan
            $table->decimal('limit_amount', 18, 2);

            // Alert threshold, misalnya 80 berarti alert saat pemakaian 80%
            $table->unsignedTinyInteger('alert_at')->default(80);

            $table->text('notes')->nullable();

            $table->timestamps();

            // 1 user tidak boleh punya 2 budget untuk kategori yang sama di bulan yang sama
            $table->unique(['user_id', 'category_id', 'period_month']);

            $table->index(['user_id', 'period_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};