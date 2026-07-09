<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Investment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'account_id',
        'symbol',
        'name',
        'type',
        'qty',
        'buy_price',
        'current_price',
        'purchase_date',
        'notes',
    ];

    protected $casts = [
        'qty' => 'decimal:8',
        'buy_price' => 'decimal:8',
        'current_price' => 'decimal:8',
        'purchase_date' => 'date',
    ];

    protected $appends = [
        'total_cost',
        'total_value',
        'gain',
        'gain_percentage',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function investmentTransactions(): HasMany
    {
        return $this->hasMany(InvestmentTransaction::class);
    }

    public function getTotalCostAttribute(): float
    {
        return (float) $this->qty * (float) $this->buy_price;
    }

    public function getTotalValueAttribute(): float
    {
        $currentPrice = $this->current_price ?? $this->buy_price;

        return (float) $this->qty * (float) $currentPrice;
    }

    public function getGainAttribute(): float
    {
        return $this->total_value - $this->total_cost;
    }

    public function getGainPercentageAttribute(): float
    {
        if ($this->total_cost <= 0) {
            return 0;
        }

        return ($this->gain / $this->total_cost) * 100;
    }
}
