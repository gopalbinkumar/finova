<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('investments', function (Blueprint $table) {
            // Nullable keeps existing portfolios migratable. New/updated records
            // are required to select an investment account by the controller.
            $table->foreignId('account_id')
                ->nullable()
                ->after('user_id')
                ->constrained('accounts')
                ->restrictOnDelete();
            $table->softDeletes();
            $table->index(['account_id', 'symbol', 'type']);
        });
    }

    public function down(): void
    {
        Schema::table('investments', function (Blueprint $table) {
            $table->dropIndex(['account_id', 'symbol', 'type']);
            $table->dropConstrainedForeignId('account_id');
            $table->dropSoftDeletes();
        });
    }
};
