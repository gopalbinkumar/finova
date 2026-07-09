<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $attributes = [
        'affects_balance' => true,
    ];

    protected $fillable = [
        'user_id',
        'account_id',
        'to_account_id',
        'category_id',
        'type',
        'amount',
        'affects_balance',
        'source_type',
        'source_id',
        'investment_id',
        'date',
        'description',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'affects_balance' => 'boolean',
        'date' => 'date:Y-m-d',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function toAccount()
    {
        return $this->belongsTo(Account::class, 'to_account_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function investment()
    {
        return $this->belongsTo(Investment::class)->withTrashed();
    }
}
