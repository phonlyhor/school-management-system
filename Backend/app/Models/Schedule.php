<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    protected $fillable = [
        'teacher_id',
        'secondary_teacher_id',
        'class_id',
        'subject_id',
        'day',
        'session',
        'start_time',
        'end_time',
        'room',
        'academic_year'
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function secondaryTeacher()
    {
        return $this->belongsTo(User::class, 'secondary_teacher_id');
    }

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
}