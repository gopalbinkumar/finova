<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('goals', function (Blueprint $table) {
            $table->id();

            // Setiap goal milik user tertentu
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('name', 150);
            $table->decimal('target_amount', 18, 2);
            $table->date('deadline');

            $table->string('icon', 20)->default('🎯');
            $table->char('color', 7)->default('#2563EB');

            $table->text('notes')->nullable();

            // Status bisa dipakai nanti, tetapi progress tetap dihitung dari allocation.
            $table->enum('status', ['active', 'completed', 'paused'])
                ->default('active');

            $table->timestamps();

            // 1 user tidak boleh punya nama goal yang sama
            $table->unique(['user_id', 'name']);

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'deadline']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goals');
    }
};