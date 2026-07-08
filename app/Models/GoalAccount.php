<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoalAccount extends Model
{
    protected $fillable = [
        'user_id',
        'goal_id',
        'account_id',
        'amount',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function goal()
    {
        return $this->belongsTo(Goal::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}