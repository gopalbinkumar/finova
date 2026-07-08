<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Budget extends Model
{
    protected $fillable = [
        'user_id',
        'category_id',
        'period_month',
        'limit_amount',
        'alert_at',
        'notes',
    ];

    protected $casts = [
        'period_month' => 'date:Y-m-d',
        'limit_amount' => 'decimal:2',
        'alert_at' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}