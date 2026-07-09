<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvestmentTransaction extends Model
{
    protected $fillable = [
        'user_id',
        'investment_id',
        'account_id',
        'type',
        'qty',
        'price',
        'fee',
        'gross_amount',
        'net_amount',
        'cost_basis',
        'realized_gain_loss',
        'transaction_date',
        'notes',
    ];

    protected $casts = [
        'qty' => 'decimal:8',
        'price' => 'decimal:8',
        'fee' => 'decimal:8',
        'gross_amount' => 'decimal:8',
        'net_amount' => 'decimal:8',
        'cost_basis' => 'decimal:8',
        'realized_gain_loss' => 'decimal:8',
        'transaction_date' => 'date:Y-m-d',
    ];

    public function investment(): BelongsTo
    {
        return $this->belongsTo(Investment::class)->withTrashed();
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
