<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use Illuminate\Http\Request;

class AdminClassController extends Controller
{

    // Get all classes
    public function index()
    {

        $classes = SchoolClass::with([
            'teacherAssignments.teacher',
            'teacherSubjectAssignments.subject',
            'teacherSubjectAssignments.teacher',
            'students.user',
            'students.studentParent.user'
        ])->get();


        return response()->json([
            'classes'=>$classes
        ]);

    }



    // Create class
    public function store(Request $request)
    {

        $request->validate([

            'name'=>'required',

            'grade_level'=>'required',

            'academic_year'=>'required'

        ]);



        $class = SchoolClass::create([

            'name'=>$request->name,

            'grade_level'=>$request->grade_level,

            'stream'=>$request->stream ?? 'general',

            'academic_year'=>$request->academic_year

        ]);



        return response()->json([

            'message'=>'Class created successfully',

            'class'=>$class

        ],201);

    }




    // Show one class
    public function show(
        SchoolClass $class
    )
    {

        return response()->json([

            'class'=>$class

        ]);

    }




    // Update class
    public function update(
        Request $request,
        SchoolClass $class
    )
    {

        $class->update([

            'name'=>$request->name,

            'grade_level'=>$request->grade_level,

            'stream'=>$request->stream ?? $class->stream ?? 'general',

            'academic_year'=>$request->academic_year

        ]);



        return response()->json([

            'message'=>'Class updated successfully',

            'class'=>$class

        ]);

    }





    // Delete class
    public function destroy(
        SchoolClass $class
    )
    {

        $class->delete();


        return response()->json([

            'message'=>'Class deleted successfully'

        ]);

    }


}