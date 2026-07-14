<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('transactions')
            ->where('source_type', 'investment_performance')
            ->where('type', 'expense')
            ->where('amount', '<', 0)
            ->update([
                'amount' => DB::raw('ABS(amount)'),
            ]);
    }

    public function down(): void
    {
        DB::table('transactions')
            ->where('source_type', 'investment_performance')
            ->where('type', 'expense')
            ->where('amount', '>', 0)
            ->update([
                'amount' => DB::raw('-ABS(amount)'),
            ]);
    }
};
