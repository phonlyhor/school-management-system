<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'class_id',
        'is_class_teacher',
    ];


    // Assignment belongs to Teacher(User)
    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }


    // Assignment belongs to Class
    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }
}