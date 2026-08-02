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
                'grade_level'=>$class->grade_level,
                'is_registration_open'=>(bool)($class->is_registration_open ?? true)
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

    // Toggle class registration status (Open/Close student self-registration for this class)
    public function toggleRegistration(Request $request, $class_id)
    {
        $teacher = $request->user();

        // Check if authorized (Admin or Homeroom Teacher for this class)
        $isAuthorized = ($teacher->role_id == 1) || TeacherClassAssignment::where('teacher_id', $teacher->id)->where('class_id', $class_id)->exists();

        if (!$isAuthorized) {
            return response()->json([
                'message' => 'អ្នកមិនមានសិទ្ធិកំណត់ការចុះឈ្មោះសម្រាប់ថ្នាក់នេះទេ! (មានសិទ្ធិតែគ្រូបន្ទុកថ្នាក់ ឬ Admin)'
            ], 403);
        }

        $class = SchoolClass::findOrFail($class_id);
        
        if ($request->has('is_open')) {
            $class->is_registration_open = (bool)$request->is_open;
        } else {
            $class->is_registration_open = !$class->is_registration_open;
        }
        
        $class->save();

        $statusText = $class->is_registration_open ? 'បើក' : 'បិទ';

        return response()->json([
            'message' => "បាន{$statusText}ការចុះឈ្មោះសិស្សសម្រាប់ថ្នាក់ {$class->name} ដោយជោគជ័យ!",
            'is_registration_open' => (bool)$class->is_registration_open,
            'class' => $class
        ]);
    }
}