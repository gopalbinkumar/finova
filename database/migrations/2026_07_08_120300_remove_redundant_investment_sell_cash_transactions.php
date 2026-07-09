<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Gross/net proceeds remain in investment_transactions. Removing this
        // derived row prevents sell proceeds from being counted as income in
        // addition to the realized gain/loss performance transaction.
        DB::table('transactions')
            ->where('source_type', 'investment_sell')
            ->delete();
    }

    public function down(): void
    {
        // The redundant rows cannot be reconstructed losslessly here. Their
        // complete source data remains available in investment_transactions.
    }
};
