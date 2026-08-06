<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'class_id',
        'civil_servant_id',
        'position',
        'civil_service_framework',
        'education_level',
        'qualification',
        'specialization_1',
        'specialization_2',
        'specialization_3',
        'teaching_level',
        'activity_status',
        'civil_service_date',
        'service_duration',
        'awards',
        'honors',
        'grades_taught',
        'technology_usage',
    ];

    /**
     * Get the user account for the teacher.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the homeroom class assigned to the teacher.
     */
    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    /**
     * Get all subject/class teaching assignments for the teacher.
     */
    public function teacherAssignments()
    {
        return $this->hasMany(TeacherAssignment::class, 'teacher_id', 'user_id');
    }
}
