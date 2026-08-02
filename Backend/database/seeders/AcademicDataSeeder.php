<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\Assessment;
use App\Models\GradeScale;


class AcademicDataSeeder extends Seeder
{

    public function run(): void
    {


        // Academic Year

        $year = AcademicYear::create([

            'name'=>'2026-2027',

            'start_date'=>'2026-08-01',

            'end_date'=>'2027-07-31',

            'status'=>true

        ]);



        // Semester 1

        $semester1 = Semester::create([

            'academic_year_id'=>$year->id,

            'name'=>'Semester 1',

            'start_date'=>'2026-08-01',

            'end_date'=>'2027-01-15'

        ]);



        // Semester 2

        Semester::create([

            'academic_year_id'=>$year->id,

            'name'=>'Semester 2',

            'start_date'=>'2027-01-16',

            'end_date'=>'2027-07-31'

        ]);




        // Monthly + Exam Assessment


        Assessment::create([

            'semester_id'=>$semester1->id,

            'name'=>'September Test',

            'type'=>'monthly',

            'month'=>'September',

            'max_score'=>100,

            'date'=>'2026-09-30'

        ]);



        Assessment::create([

            'semester_id'=>$semester1->id,

            'name'=>'October Test',

            'type'=>'monthly',

            'month'=>'October',

            'max_score'=>100,

            'date'=>'2026-10-31'

        ]);



        Assessment::create([

            'semester_id'=>$semester1->id,

            'name'=>'Midterm Exam',

            'type'=>'midterm',

            'max_score'=>100,

            'date'=>'2026-12-15'

        ]);



        Assessment::create([

            'semester_id'=>$semester1->id,

            'name'=>'Final Exam',

            'type'=>'final',

            'max_score'=>100,

            'date'=>'2027-01-10'

        ]);




        // Grade Scale


        GradeScale::insert([

            [
                'min_score'=>90,
                'max_score'=>100,
                'grade'=>'A',
                'description'=>'Excellent'
            ],

            [
                'min_score'=>80,
                'max_score'=>89,
                'grade'=>'B',
                'description'=>'Very Good'
            ],

            [
                'min_score'=>70,
                'max_score'=>79,
                'grade'=>'C',
                'description'=>'Good'
            ],

            [
                'min_score'=>60,
                'max_score'=>69,
                'grade'=>'D',
                'description'=>'Average'
            ],

            [
                'min_score'=>0,
                'max_score'=>59,
                'grade'=>'F',
                'description'=>'Fail'
            ]

        ]);


    }

}