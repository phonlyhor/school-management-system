<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TeacherAssignment;

class TeacherController extends Controller
{

    public function myClass(Request $request)
    {
        $teacher = $request->user();

        $classes = TeacherAssignment::with([
            'schoolClass.students.user'
        ])
        ->where('teacher_id', $teacher->id)
        ->where('is_class_teacher', true)
        ->get();


        return response()->json([
            'classes' => $classes
        ]);
    }

}