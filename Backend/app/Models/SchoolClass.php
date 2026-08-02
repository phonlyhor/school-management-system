<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'grade_level',
        'stream',
        'academic_year',
        'is_registration_open',
    ];

    protected $casts = [
        'is_registration_open' => 'boolean',
    ];
    // SchoolClass has many students
 public function students()
{
    return $this->hasMany(
        Student::class,
        'class_id'
    );
}
    // SchoolClass has many teacher assignments
    public function teacherAssignments()
    {
        return $this->hasMany(TeacherClassAssignment::class, 'class_id');   
    } 

    // SchoolClass has many teacher subject assignments
    public function teacherSubjectAssignments()
{
    return $this->hasMany(
        TeacherSubjectAssignment::class,
        'class_id'
    );
}  
}
