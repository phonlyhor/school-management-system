<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherSubjectAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'subject_id',
        'class_id',
        'academic_year',
    ];


    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }


 public function subject()
{
    return $this->belongsTo(Subject::class);
}


public function schoolClass()
{
    return $this->belongsTo(
        SchoolClass::class,
        'class_id'
    );
}
}