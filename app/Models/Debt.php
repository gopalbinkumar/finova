<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Debt extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'borrower',
        'amount',
        'remaining_balance',
        'due_date',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'remaining_balance' => 'decimal:2',
        'due_date' => 'date',
    ];

    protected $appends = [
        'paid_amount',
        'paid_pct',
        'days_left',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getPaidAmountAttribute(): float
    {
        return max((float) $this->amount - (float) $this->remaining_balance, 0);
    }

    public function getPaidPctAttribute(): float
    {
        $amount = (float) $this->amount;

        if ($amount <= 0) {
            return 0;
        }

        return min(($this->paid_amount / $amount) * 100, 100);
    }

    public function getDaysLeftAttribute(): ?int
    {
        if (!$this->due_date) {
            return null;
        }

        return now()->startOfDay()->diffInDays($this->due_date->startOfDay(), false);
    }

    public function getStatusAttribute(): string
    {
        if ((float) $this->remaining_balance <= 0) {
            return 'paid';
        }

        if ($this->days_left !== null && $this->days_left < 0) {
            return 'overdue';
        }

        if ($this->days_left !== null && $this->days_left <= 14) {
            return 'due_soon';
        }

        return 'active';
    }
}