<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Assessment extends Model
{

    protected $fillable = [

        'semester_id',
        'name',
        'type',
        'month',
        'max_score',
        'date'

    ];



    public function semester()
    {
        return $this->belongsTo(
            Semester::class
        );
    }



    public function scores()
    {
        return $this->hasMany(
            StudentScore::class
        );
    }

}