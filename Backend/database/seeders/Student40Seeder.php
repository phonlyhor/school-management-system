<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\Attendance;
use App\Models\StudentScore;
use App\Models\Subject;
use App\Models\Assessment;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class Student40Seeder extends Seeder
{
    public function run(): void
    {
        // 1. Prepare/Ensure clean target classes
        $classList = [
            ['name' => 'Class 7A', 'grade_level' => 'Grade 7', 'academic_year' => '2026-2027'],
            ['name' => 'Class 8A', 'grade_level' => 'Grade 8', 'academic_year' => '2026-2027'],
            ['name' => 'Class 9A', 'grade_level' => 'Grade 9', 'academic_year' => '2026-2027'],
            ['name' => 'Class 10A', 'grade_level' => 'Grade 10', 'academic_year' => '2026-2027'],
            ['name' => 'Class 11A', 'grade_level' => 'Grade 11', 'academic_year' => '2026-2027'],
            ['name' => 'Class 12A', 'grade_level' => 'Grade 12', 'academic_year' => '2026-2027'],
        ];

        $classes = [];
        foreach ($classList as $cData) {
            $c = SchoolClass::firstOrCreate(
                ['name' => $cData['name']],
                ['grade_level' => $cData['grade_level'], 'academic_year' => $cData['academic_year']]
            );
            $classes[] = $c;
        }

        // 2. Array of 40 Realistic Khmer Student Names & Details
        $studentsData = [
            // Males (20)
            ['name' => 'Sok Chetra', 'gender' => 'Male', 'pob' => 'Phnom Penh', 'father' => 'Sok Bunna', 'mother' => 'Chan Navy'],
            ['name' => 'Heng Vissal', 'gender' => 'Male', 'pob' => 'Siem Reap', 'father' => 'Heng Samnang', 'mother' => 'Keo Sophea'],
            ['name' => 'Chan Dara', 'gender' => 'Male', 'pob' => 'Battambang', 'father' => 'Chan Chhay', 'mother' => 'Meas Sothy'],
            ['name' => 'Meas Rithy', 'gender' => 'Male', 'pob' => 'Kandal', 'father' => 'Meas Vibol', 'mother' => 'Ung Rachana'],
            ['name' => 'Khorn Sokheng', 'gender' => 'Male', 'pob' => 'Kampong Cham', 'father' => 'Khorn Sovann', 'mother' => 'Nhem Kounnea'],
            ['name' => 'Seng Panha', 'gender' => 'Male', 'pob' => 'Takeo', 'father' => 'Seng Chanthy', 'mother' => 'Mom Kolap'],
            ['name' => 'Som Piseth', 'gender' => 'Male', 'pob' => 'Kampot', 'father' => 'Som Vanna', 'mother' => 'Prak Davy'],
            ['name' => 'Tep Vatanak', 'gender' => 'Male', 'pob' => 'Prey Veng', 'father' => 'Tep Sophal', 'mother' => 'Touch Chanthea'],
            ['name' => 'Chim Sambath', 'gender' => 'Male', 'pob' => 'Svay Rieng', 'father' => 'Chim Bunthen', 'mother' => 'Sin Thida'],
            ['name' => 'Chea Vanna', 'gender' => 'Male', 'pob' => 'Phnom Penh', 'father' => 'Chea Kimheng', 'mother' => 'Lay Monineath'],
            ['name' => 'Long Sopheak', 'gender' => 'Male', 'pob' => 'Siem Reap', 'father' => 'Long Borith', 'mother' => 'Yun Sophal'],
            ['name' => 'Ouk Chamroeun', 'gender' => 'Male', 'pob' => 'Kandal', 'father' => 'Ouk Pich', 'mother' => 'Lim Sreynet'],
            ['name' => 'Nhek Rattanak', 'gender' => 'Male', 'pob' => 'Battambang', 'father' => 'Nhek Chansorphea', 'mother' => 'Ung Neary'],
            ['name' => 'Sun Vira', 'gender' => 'Male', 'pob' => 'Kampong Cham', 'father' => 'Sun Vireak', 'mother' => 'Pich Leakhena'],
            ['name' => 'Chhim Muny', 'gender' => 'Male', 'pob' => 'Takeo', 'father' => 'Chhim Vatanak', 'mother' => 'Sovann Sotheara'],
            ['name' => 'Huy Vireak', 'gender' => 'Male', 'pob' => 'Kampot', 'father' => 'Huy Samnang', 'mother' => 'Touch Chantha'],
            ['name' => 'Ros Kimheng', 'gender' => 'Male', 'pob' => 'Prey Veng', 'father' => 'Ros Chetra', 'mother' => 'Chhay Kunthea'],
            ['name' => 'Keo Borith', 'gender' => 'Male', 'pob' => 'Phnom Penh', 'father' => 'Keo Sopheak', 'mother' => 'Ly Sreypov'],
            ['name' => 'Suon Pich', 'gender' => 'Male', 'pob' => 'Siem Reap', 'father' => 'Suon Vissal', 'mother' => 'Seng Bopha'],
            ['name' => 'Try Bunthen', 'gender' => 'Male', 'pob' => 'Battambang', 'father' => 'Try Dara', 'mother' => 'Prak Davy'],

            // Females (20)
            ['name' => 'Touch Chantha', 'gender' => 'Female', 'pob' => 'Phnom Penh', 'father' => 'Touch Sophal', 'mother' => 'Keo Neary'],
            ['name' => 'Chhay Kunthea', 'gender' => 'Female', 'pob' => 'Kandal', 'father' => 'Chhay Vibol', 'mother' => 'Ung Rachana'],
            ['name' => 'Ly Sreypov', 'gender' => 'Female', 'pob' => 'Siem Reap', 'father' => 'Ly Samnang', 'mother' => 'Pich Leakhena'],
            ['name' => 'Seng Bopha', 'gender' => 'Female', 'pob' => 'Battambang', 'father' => 'Seng Chanthy', 'mother' => 'Tep Sophea'],
            ['name' => 'Lim Sreynet', 'gender' => 'Female', 'pob' => 'Kampong Cham', 'father' => 'Lim Bunna', 'mother' => 'Heng Chanda'],
            ['name' => 'Prak Davy', 'gender' => 'Female', 'pob' => 'Takeo', 'father' => 'Prak Sovann', 'mother' => 'Khieu Chansorphea'],
            ['name' => 'Keo Neary', 'gender' => 'Female', 'pob' => 'Kampot', 'father' => 'Keo Chhay', 'mother' => 'Pen Chanthea'],
            ['name' => 'Ung Rachana', 'gender' => 'Female', 'pob' => 'Prey Veng', 'father' => 'Ung Vanna', 'mother' => 'Lay Monineath'],
            ['name' => 'Pich Leakhena', 'gender' => 'Female', 'pob' => 'Svay Rieng', 'father' => 'Pich Kimheng', 'mother' => 'Mok Sreymom'],
            ['name' => 'Tep Sophea', 'gender' => 'Female', 'pob' => 'Phnom Penh', 'father' => 'Tep Borith', 'mother' => 'Sin Thida'],
            ['name' => 'Heng Chanda', 'gender' => 'Female', 'pob' => 'Siem Reap', 'father' => 'Heng Pich', 'mother' => 'Nhem Kounnea'],
            ['name' => 'Khieu Chansorphea', 'gender' => 'Female', 'pob' => 'Kandal', 'father' => 'Khieu Vireak', 'mother' => 'Mom Kolap'],
            ['name' => 'Pen Chanthea', 'gender' => 'Female', 'pob' => 'Battambang', 'father' => 'Pen Vatanak', 'mother' => 'Sovann Sotheara'],
            ['name' => 'Lay Monineath', 'gender' => 'Female', 'pob' => 'Kampong Cham', 'father' => 'Lay Chetra', 'mother' => 'Yun Sophal'],
            ['name' => 'Mok Sreymom', 'gender' => 'Female', 'pob' => 'Takeo', 'father' => 'Mok Vissal', 'mother' => 'Touch Chantha'],
            ['name' => 'Sin Thida', 'gender' => 'Female', 'pob' => 'Kampot', 'father' => 'Sin Dara', 'mother' => 'Chhay Kunthea'],
            ['name' => 'Nhem Kounnea', 'gender' => 'Female', 'pob' => 'Prey Veng', 'father' => 'Nhem Rithy', 'mother' => 'Ly Sreypov'],
            ['name' => 'Mom Kolap', 'gender' => 'Female', 'pob' => 'Phnom Penh', 'father' => 'Mom Sokheng', 'mother' => 'Seng Bopha'],
            ['name' => 'Sovann Sotheara', 'gender' => 'Female', 'pob' => 'Siem Reap', 'father' => 'Sovann Piseth', 'mother' => 'Lim Sreynet'],
            ['name' => 'Yun Sophal', 'gender' => 'Female', 'pob' => 'Battambang', 'father' => 'Yun Vatanak', 'mother' => 'Prak Davy']
        ];

        // Positions sequence per class
        $positions = ['Class Monitor', 'Vice Monitor', 'Treasurer', 'Secretary', 'Member'];

        $createdStudents = [];

        foreach ($studentsData as $idx => $sData) {
            $num = $idx + 1;
            $code = 'STU-' . str_pad($num + 100, 4, '0', STR_PAD_LEFT);
            $email = 'student' . ($num + 100) . '@school.com';

            // Create User account
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $sData['name'],
                    'password' => Hash::make('password123'),
                    'role_id' => 3
                ]
            );

            // Assign class (cycle through 6 classes)
            $classObj = $classes[$idx % count($classes)];

            // Determine class position
            $classStudentIndex = floor($idx / count($classes));
            $position = $positions[$classStudentIndex] ?? 'Member';

            // Calculate age and DOB (ages 13 - 18)
            $age = 13 + ($idx % 5);
            $dob = Carbon::now()->subYears($age)->subDays($idx * 7)->format('Y-m-d');

            // Create Student profile
            $student = Student::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'class_id' => $classObj->id,
                    'student_code' => $code,
                    'gender' => $sData['gender'],
                    'date_of_birth' => $dob,
                    'place_of_birth' => $sData['pob'],
                    'father_name' => $sData['father'],
                    'mother_name' => $sData['mother'],
                    'class_position' => $position
                ]
            );

            $createdStudents[] = $student;
        }

        // 3. Seed Sample Attendance & Assessment Scores for seeded students
        $subjects = Subject::all();
        $assessments = Assessment::all();

        $statuses = ['present', 'present', 'present', 'present', 'absent', 'late'];

        $firstSubject = Subject::first();
        $subjectId = $firstSubject ? $firstSubject->id : 1;

        foreach ($createdStudents as $st) {
            // Seed 3 attendance records per student
            for ($d = 0; $d < 3; $d++) {
                Attendance::create([
                    'student_id' => $st->id,
                    'class_id' => $st->class_id,
                    'teacher_id' => 2,
                    'subject_id' => $subjectId,
                    'date' => Carbon::now()->subDays($d)->format('Y-m-d'),
                    'status' => $statuses[array_rand($statuses)]
                ]);
            }

            // Seed scores if subjects and assessments exist
            if ($subjects->count() > 0 && $assessments->count() > 0) {
                foreach ($subjects->take(2) as $subj) {
                    $scoreVal = rand(65, 98);
                    $grade = $scoreVal >= 90 ? 'A' : ($scoreVal >= 80 ? 'B' : ($scoreVal >= 70 ? 'C' : 'D'));

                    StudentScore::create([
                        'student_id' => $st->id,
                        'subject_id' => $subj->id,
                        'assessment_id' => $assessments->first()->id,
                        'score' => $scoreVal,
                        'max_score' => 100,
                        'percentage' => $scoreVal,
                        'grade' => $grade
                    ]);
                }
            }
        }
    }
}
