<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeScale extends Model
{

    protected $fillable = [

        'min_score',
        'max_score',
        'grade',
        'description'

    ];

}