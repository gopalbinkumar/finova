<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();

            // Setiap kategori wajib milik satu user
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Sesuai input AddCategoryModal.jsx
            $table->string('name', 100);
            $table->enum('type', ['income', 'expense'])->default('expense');
            $table->string('icon', 20)->default('🍔');
            $table->char('color', 7)->default('#F59E0B');

            $table->timestamps();

            // Agar 1 user tidak membuat nama kategori yang sama pada tipe yang sama
            // Contoh: user A tidak bisa punya dua "Food" expense
            // Tapi user lain tetap boleh punya "Food" expense juga
            $table->unique(['user_id', 'name', 'type']);

            // Mempercepat filter income / expense per user
            $table->index(['user_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};