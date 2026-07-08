<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Goal extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'target_amount',
        'deadline',
        'icon',
        'color',
        'notes',
        'status',
    ];

    protected $casts = [
        'target_amount' => 'decimal:2',
        'deadline' => 'date:Y-m-d',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function goalAccounts()
    {
        return $this->hasMany(GoalAccount::class);
    }

    public function accounts()
    {
        return $this->belongsToMany(Account::class, 'goal_accounts')
            ->withPivot(['amount', 'notes'])
            ->withTimestamps();
    }
}