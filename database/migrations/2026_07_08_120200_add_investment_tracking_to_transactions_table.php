<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->boolean('affects_balance')->default(true)->after('amount');
            $table->string('source_type', 50)->nullable()->after('affects_balance');
            $table->unsignedBigInteger('source_id')->nullable()->after('source_type');
            $table->foreignId('investment_id')
                ->nullable()
                ->after('source_id')
                ->constrained('investments')
                ->nullOnDelete();

            $table->index(['source_type', 'source_id']);
            $table->index(['investment_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['source_type', 'source_id']);
            $table->dropIndex(['investment_id', 'date']);
            $table->dropConstrainedForeignId('investment_id');
            $table->dropColumn(['affects_balance', 'source_type', 'source_id']);
        });
    }
};
