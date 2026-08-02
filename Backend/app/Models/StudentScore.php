<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentScore extends Model
{

    protected $fillable = [

        'student_id',
        'subject_id',
        'assessment_id',
        'score',
        'grade',
        'remark',
        'max_score',
        'percentage'

    ];



    public function student()
    {
        return $this->belongsTo(
            Student::class
        );
    }



    public function subject()
    {
        return $this->belongsTo(
            Subject::class
        );
    }



    public function assessment()
    {
        return $this->belongsTo(
            Assessment::class
        );
    }


}