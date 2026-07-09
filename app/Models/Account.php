<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Goal;
use App\Models\GoalAccount;

class Account extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'type',
        'currency',
        'balance',
        'color',
        'notes',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function incomingTransfers()
    {
        return $this->hasMany(Transaction::class, 'to_account_id');
    }

    public function investments()
    {
        return $this->hasMany(Investment::class);
    }

    public function investmentTransactions()
    {
        return $this->hasMany(InvestmentTransaction::class);
    }

    public function goalAccounts()
    {
        return $this->hasMany(GoalAccount::class);
    }

    public function goals()
    {
        return $this->belongsToMany(Goal::class, 'goal_accounts')
            ->withPivot(['amount', 'notes'])
            ->withTimestamps();
    }
}
