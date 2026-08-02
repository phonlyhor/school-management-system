<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SchoolClass;
use App\Models\TeacherClassAssignment;
use App\Models\TeacherSubjectAssignment;
use App\Models\Student;


class TeacherClassController extends Controller
{

    public function show(Request $request, $class_id)
    {

        $teacher = $request->user();


        // Check teacher assigned this class (Admin, Homeroom, Subject, Legacy, or Schedule)
        if ($teacher->role_id == 1) {
            $assigned = true;
        } else {
            $assigned = TeacherClassAssignment::where('teacher_id', $teacher->id)->where('class_id', $class_id)->exists()
                || TeacherSubjectAssignment::where('teacher_id', $teacher->id)->where('class_id', $class_id)->exists()
                || \App\Models\TeacherAssignment::where('teacher_id', $teacher->id)->where('class_id', $class_id)->exists()
                || \App\Models\Schedule::where('class_id', $class_id)->where(function($q) use ($teacher) {
                    $q->where('teacher_id', $teacher->id)->orWhere('secondary_teacher_id', $teacher->id);
                })->exists();
        }

        if (!$assigned) {
            return response()->json([
                'message' => 'You are not assigned to this class'
            ], 403);
        }



        $class = SchoolClass::findOrFail($class_id);



        // Get students
        $students = Student::with('user')
            ->where(
                'class_id',
                $class_id
            )
            ->get();



        // Get subjects teacher teaches in this class
        $subjects = TeacherSubjectAssignment::with('subject')
            ->where(
                'teacher_id',
                $teacher->id
            )
            ->where(
                'class_id',
                $class_id
            )
            ->get();



        return response()->json([

            'class'=>[
                'id'=>$class->id,
                'name'=>$class->name,
                'grade_level'=>$class->grade_level
            ],


            'students'=>$students->map(function($student){

                return [

                    'id'=>$student->id,
                    'name'=>$student->user->name,
                    'student_code'=>$student->student_code

                ];

            }),


            'subjects'=>$subjects->map(function($item){

                return [

                    'id'=>$item->subject->id,
                    'name'=>$item->subject->name,
                    'code'=>$item->subject->code

                ];

            })

        ]);

    }

}