<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'code',
        'description',
        'max_score',
        'stream'
    ];
    // Subject has many TeacherSubjectAssignments
    public function teacherAssignments()
{
    return $this->hasMany(
        TeacherSubjectAssignment::class
    );
}
}
