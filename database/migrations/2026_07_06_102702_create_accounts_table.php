<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();

            // Relasi ke user, agar setiap user punya data account masing-masing
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Sesuai input AddAccountModal.jsx
            $table->string('name', 100);
            $table->enum('type', [
                'bank',
                'cash',
                'credit_card',
                'e_wallet',
                'investment',
            ])->default('bank');

            $table->char('currency', 3)->default('USD');

            // Bisa positif untuk aset, negatif untuk hutang kartu kredit
            $table->decimal('balance', 18, 2)->default(0);

            $table->char('color', 7)->default('#2563EB');
            $table->text('notes')->nullable();

            $table->timestamps();

            // Agar 1 user tidak punya nama account yang sama
            // User lain tetap boleh memakai nama account yang sama
            $table->unique(['user_id', 'name']);

            // Mempercepat filter account berdasarkan user dan tipe
            $table->index(['user_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};