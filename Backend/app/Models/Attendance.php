<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;


    protected $fillable = [
        'student_id',
        'teacher_id',
        'class_id',
        'subject_id',
        'date',
        'status',
        'note',
    ];


    public function student()
    {
        return $this->belongsTo(Student::class);
    }


    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }


    public function schoolClass()
    {
        return $this->belongsTo(
            SchoolClass::class,
            'class_id'
        );
    }


    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
}