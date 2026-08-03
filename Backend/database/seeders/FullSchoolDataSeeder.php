<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Student;
use App\Models\StudentParent;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\Assessment;
use App\Models\StudentScore;
use App\Models\TeacherClassAssignment;
use App\Models\TeacherSubjectAssignment;
use App\Models\Schedule;
use App\Models\Attendance;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class FullSchoolDataSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Ensure Roles exist
        $adminRole   = Role::firstOrCreate(['name' => 'admin'], ['description' => 'System Administrator']);
        $teacherRole = Role::firstOrCreate(['name' => 'teacher'], ['description' => 'School Teacher']);
        $studentRole = Role::firstOrCreate(['name' => 'student'], ['description' => 'School Student']);
        $parentRole  = Role::firstOrCreate(['name' => 'parent'], ['description' => 'Student Parent']);

        // Clear existing schedules & assignments
        Schedule::query()->delete();
        TeacherClassAssignment::query()->delete();
        TeacherSubjectAssignment::query()->delete();

        // 1. Seed Admin User
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@school.com'],
            [
                'name' => 'នាយកសាលា (Administrator)',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
                'gender' => 'Male',
                'phone' => '012345678'
            ]
        );

        // 2. Academic Years & Semesters
        $academicYear2026 = AcademicYear::firstOrCreate(
            ['name' => '2026-2027'],
            ['start_date' => '2026-10-01', 'end_date' => '2027-07-31', 'status' => true]
        );

        $academicYear2025 = AcademicYear::firstOrCreate(
            ['name' => '2025-2026'],
            ['start_date' => '2025-10-01', 'end_date' => '2026-07-31', 'status' => false]
        );

        $sem1 = Semester::firstOrCreate(
            ['academic_year_id' => $academicYear2026->id, 'name' => 'ឆមាសទី ១ (Semester 1)'],
            ['start_date' => '2026-10-01', 'end_date' => '2027-02-28']
        );

        $sem2 = Semester::firstOrCreate(
            ['academic_year_id' => $academicYear2026->id, 'name' => 'ឆមាសទី ២ (Semester 2)'],
            ['start_date' => '2027-03-01', 'end_date' => '2027-07-31']
        );

        // 3. COMPLETE Classes Definition (Grades 1 to 12 - BOTH A and B for every grade!)
        $classDefinitions = [
            ['name' => '1A',  'grade_level' => '1',  'stream' => 'general'],
            ['name' => '1B',  'grade_level' => '1',  'stream' => 'general'],
            ['name' => '2A',  'grade_level' => '2',  'stream' => 'general'],
            ['name' => '2B',  'grade_level' => '2',  'stream' => 'general'],
            ['name' => '3A',  'grade_level' => '3',  'stream' => 'general'],
            ['name' => '3B',  'grade_level' => '3',  'stream' => 'general'],
            ['name' => '4A',  'grade_level' => '4',  'stream' => 'general'],
            ['name' => '4B',  'grade_level' => '4',  'stream' => 'general'],
            ['name' => '5A',  'grade_level' => '5',  'stream' => 'general'],
            ['name' => '5B',  'grade_level' => '5',  'stream' => 'general'],
            ['name' => '6A',  'grade_level' => '6',  'stream' => 'general'],
            ['name' => '6B',  'grade_level' => '6',  'stream' => 'general'],
            ['name' => '7A',  'grade_level' => '7',  'stream' => 'general'],
            ['name' => '7B',  'grade_level' => '7',  'stream' => 'general'],
            ['name' => '8A',  'grade_level' => '8',  'stream' => 'general'],
            ['name' => '8B',  'grade_level' => '8',  'stream' => 'general'],
            ['name' => '9A',  'grade_level' => '9',  'stream' => 'general'],
            ['name' => '9B',  'grade_level' => '9',  'stream' => 'general'],
            ['name' => '10A', 'grade_level' => '10', 'stream' => 'general'],
            ['name' => '10B', 'grade_level' => '10', 'stream' => 'general'],
            ['name' => '11A', 'grade_level' => '11', 'stream' => 'science'],
            ['name' => '11B', 'grade_level' => '11', 'stream' => 'social_science'],
            ['name' => '12A', 'grade_level' => '12', 'stream' => 'science'],
            ['name' => '12B', 'grade_level' => '12', 'stream' => 'social_science']
        ];

        $allClasses = [];
        foreach ($classDefinitions as $cDef) {
            $allClasses[] = SchoolClass::firstOrCreate(
                ['name' => $cDef['name']],
                [
                    'grade_level' => $cDef['grade_level'],
                    'stream' => $cDef['stream'],
                    'academic_year' => '2026-2027'
                ]
            );
        }

        // 4. Core MoEYS Cambodian Subjects
        $subjectsList = [
            ['name' => 'ភាសាខ្មែរ', 'code' => 'KHM-101'],
            ['name' => 'គណិតវិទ្យា', 'code' => 'MATH-101'],
            ['name' => 'រូបវិទ្យា', 'code' => 'PHYS-101'],
            ['name' => 'គីមីវិទ្យា', 'code' => 'CHEM-101'],
            ['name' => 'ជីវវិទ្យា', 'code' => 'BIO-101'],
            ['name' => 'ភាសាអង់គ្លេស', 'code' => 'ENG-101'],
            ['name' => 'ប្រវត្តិវិទ្យា', 'code' => 'HIS-101'],
            ['name' => 'ភូមិវិទ្យា', 'code' => 'GEO-101'],
            ['name' => 'ពលរដ្ឋវិទ្យា', 'code' => 'MOR-101'],
            ['name' => 'ផែនដីវិទ្យា', 'code' => 'EARTH-101'],
            ['name' => 'គូររូប/សិល្បៈ', 'code' => 'ART-101'],
            ['name' => 'អប់រំកាយ', 'code' => 'PE-101'],
            ['name' => 'បច្ចេកវិទ្យា (ICT)', 'code' => 'ICT-101'],
            ['name' => 'តន្ត្រី', 'code' => 'MUSIC-101']
        ];

        $subjectModels = [];
        foreach ($subjectsList as $s) {
            $subjectModels[] = Subject::firstOrCreate(['code' => $s['code']], $s);
        }

        // 5. Teachers (24 Teachers for 24 Classes - Exactly 1 Homeroom Teacher per Class!)
        $teachersData = [
            ['name' => 'អ៊ឹង ហ្គេចហៀក', 'email' => 'teacher1@school.com', 'gender' => 'Female', 'phone' => '012987601'],
            ['name' => 'សុខ ចាន់ថន', 'email' => 'teacher2@school.com', 'gender' => 'Male', 'phone' => '012987602'],
            ['name' => 'លី សុខា', 'email' => 'teacher3@school.com', 'gender' => 'Female', 'phone' => '012987603'],
            ['name' => 'គង់ វណ្ណៈ', 'email' => 'teacher4@school.com', 'gender' => 'Male', 'phone' => '012987604'],
            ['name' => 'ម៉េង គីមហុង', 'email' => 'teacher5@school.com', 'gender' => 'Male', 'phone' => '012987605'],
            ['name' => 'ថង សុវណ្ណ', 'email' => 'teacher6@school.com', 'gender' => 'Female', 'phone' => '012987606'],
            ['name' => 'ហេង សុភា', 'email' => 'teacher7@school.com', 'gender' => 'Female', 'phone' => '012987607'],
            ['name' => 'ចាន់ ស្រីពៅ', 'email' => 'teacher8@school.com', 'gender' => 'Female', 'phone' => '012987608'],
            ['name' => 'ស៊ិន សុជាតិ', 'email' => 'teacher9@school.com', 'gender' => 'Male', 'phone' => '012987609'],
            ['name' => 'ឈឹម រតនា', 'email' => 'teacher10@school.com', 'gender' => 'Male', 'phone' => '012987610'],
            ['name' => 'ឡុង វិបុល', 'email' => 'teacher11@school.com', 'gender' => 'Male', 'phone' => '012987611'],
            ['name' => 'កែវ ស្រីណែត', 'email' => 'teacher12@school.com', 'gender' => 'Female', 'phone' => '012987612'],
            ['name' => 'ប៉ែន ពិសិដ្ឋ', 'email' => 'teacher13@school.com', 'gender' => 'Male', 'phone' => '012987613'],
            ['name' => 'ឈន ស្រីម៉ុំ', 'email' => 'teacher14@school.com', 'gender' => 'Female', 'phone' => '012987614'],
            ['name' => 'មាស រិទ្ធី', 'email' => 'teacher15@school.com', 'gender' => 'Male', 'phone' => '012987615'],
            ['name' => 'នួន សុខជា', 'email' => 'teacher16@school.com', 'gender' => 'Male', 'phone' => '012987616'],
            ['name' => 'រ៉ន វិចិត្រ', 'email' => 'teacher17@school.com', 'gender' => 'Male', 'phone' => '012987617'],
            ['name' => 'យិន ស្រីម៉េច', 'email' => 'teacher18@school.com', 'gender' => 'Female', 'phone' => '012987618'],
            ['name' => 'សំ ផល្លី', 'email' => 'teacher19@school.com', 'gender' => 'Female', 'phone' => '012987619'],
            ['name' => 'អ៊ុក វិបុល', 'email' => 'teacher20@school.com', 'gender' => 'Male', 'phone' => '012987620'],
            ['name' => 'សុវណ្ណ គឹមសួរ', 'email' => 'teacher21@school.com', 'gender' => 'Female', 'phone' => '012987621'],
            ['name' => 'ពៅ បូរិន', 'email' => 'teacher22@school.com', 'gender' => 'Male', 'phone' => '012987622'],
            ['name' => 'ឡាយ សុធារី', 'email' => 'teacher23@school.com', 'gender' => 'Female', 'phone' => '012987623'],
            ['name' => 'ម៉ម សុវណ្ណារ៉ា', 'email' => 'teacher24@school.com', 'gender' => 'Male', 'phone' => '012987624']
        ];

        $teacherUsers = [];
        foreach ($teachersData as $t) {
            $u = User::firstOrCreate(
                ['email' => $t['email']],
                [
                    'name' => $t['name'], 
                    'password' => Hash::make('password'), 
                    'role_id' => $teacherRole->id,
                    'gender' => $t['gender'],
                    'phone' => $t['phone']
                ]
            );
            $teacherUsers[] = $u;
        }

        // Rule: Each teacher is Homeroom Teacher for EXACTLY 1 Class (1 Class = 1 Homeroom Teacher)
        foreach ($allClasses as $clsIndex => $cls) {
            $assignedHomeroomTeacher = $teacherUsers[$clsIndex % count($teacherUsers)];
            TeacherClassAssignment::updateOrCreate(
                ['class_id' => $cls->id, 'academic_year' => '2026-2027'],
                ['teacher_id' => $assignedHomeroomTeacher->id]
            );
        }

        // Subject Assignments for Teachers across all 24 classes
        foreach ($allClasses as $clsIndex => $cls) {
            foreach ($subjectModels as $subIndex => $sub) {
                $assignedTeacher = $teacherUsers[($clsIndex + $subIndex) % count($teacherUsers)];
                TeacherSubjectAssignment::updateOrCreate(
                    [
                        'class_id' => $cls->id,
                        'subject_id' => $sub->id,
                        'academic_year' => '2026-2027'
                    ],
                    [
                        'teacher_id' => $assignedTeacher->id
                    ]
                );
            }
        }

        // 6. Timetables / Schedules for ALL 24 Classes (1A to 12B)
        // Morning Session: 07:00 - 11:00 (2 periods per morning)
        // Afternoon Session: 14:00 - 16:00 (Mon/Wed/Fri -> 2 periods, Tue/Thu -> 1 period)
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        foreach ($allClasses as $clsIndex => $cls) {
            foreach ($days as $dayIndex => $day) {
                // Morning Session: 07:00 - 11:00 (EXACTLY 2 Teachers / Periods)
                // Period 1: 07:00 - 09:00
                $subMorning1 = $subjectModels[($clsIndex + $dayIndex) % count($subjectModels)];
                $teacherMorning1 = $teacherUsers[($clsIndex + $dayIndex) % count($teacherUsers)];

                Schedule::create([
                    'class_id' => $cls->id,
                    'subject_id' => $subMorning1->id,
                    'teacher_id' => $teacherMorning1->id,
                    'day' => $day,
                    'session' => 'morning',
                    'start_time' => '07:00:00',
                    'end_time' => '09:00:00',
                    'room' => "បន្ទប់ {$cls->name}",
                    'academic_year' => '2026-2027'
                ]);

                // Period 2: 09:00 - 11:00
                $subMorning2 = $subjectModels[($clsIndex + $dayIndex + 1) % count($subjectModels)];
                $teacherMorning2 = $teacherUsers[($clsIndex + $dayIndex + 1) % count($teacherUsers)];

                Schedule::create([
                    'class_id' => $cls->id,
                    'subject_id' => $subMorning2->id,
                    'teacher_id' => $teacherMorning2->id,
                    'day' => $day,
                    'session' => 'morning',
                    'start_time' => '09:00:00',
                    'end_time' => '11:00:00',
                    'room' => "បន្ទប់ {$cls->name}",
                    'academic_year' => '2026-2027'
                ]);

                // Afternoon Session: 14:00 - 16:00
                // Mon, Wed, Fri -> 2 teachers (14:00-15:00 and 15:00-16:00)
                // Tue, Thu -> 1 teacher (14:00-16:00)
                if (in_array($day, ['Monday', 'Wednesday', 'Friday'])) {
                    // Afternoon Period 1: 14:00 - 15:00
                    $subAfternoon1 = $subjectModels[($clsIndex + $dayIndex + 2) % count($subjectModels)];
                    $teacherAfternoon1 = $teacherUsers[($clsIndex + $dayIndex + 2) % count($teacherUsers)];

                    Schedule::create([
                        'class_id' => $cls->id,
                        'subject_id' => $subAfternoon1->id,
                        'teacher_id' => $teacherAfternoon1->id,
                        'day' => $day,
                        'session' => 'afternoon',
                        'start_time' => '14:00:00',
                        'end_time' => '15:00:00',
                        'room' => "បន្ទប់ {$cls->name}",
                        'academic_year' => '2026-2027'
                    ]);

                    // Afternoon Period 2: 15:00 - 16:00
                    $subAfternoon2 = $subjectModels[($clsIndex + $dayIndex + 3) % count($subjectModels)];
                    $teacherAfternoon2 = $teacherUsers[($clsIndex + $dayIndex + 3) % count($teacherUsers)];

                    Schedule::create([
                        'class_id' => $cls->id,
                        'subject_id' => $subAfternoon2->id,
                        'teacher_id' => $teacherAfternoon2->id,
                        'day' => $day,
                        'session' => 'afternoon',
                        'start_time' => '15:00:00',
                        'end_time' => '16:00:00',
                        'room' => "បន្ទប់ {$cls->name}",
                        'academic_year' => '2026-2027'
                    ]);
                } else {
                    // Tue, Thu -> Single Afternoon Period: 14:00 - 16:00
                    $subAfternoonSingle = $subjectModels[($clsIndex + $dayIndex + 4) % count($subjectModels)];
                    $teacherAfternoonSingle = $teacherUsers[($clsIndex + $dayIndex + 4) % count($teacherUsers)];

                    Schedule::create([
                        'class_id' => $cls->id,
                        'subject_id' => $subAfternoonSingle->id,
                        'teacher_id' => $teacherAfternoonSingle->id,
                        'day' => $day,
                        'session' => 'afternoon',
                        'start_time' => '14:00:00',
                        'end_time' => '16:00:00',
                        'room' => "បន្ទប់ {$cls->name}",
                        'academic_year' => '2026-2027'
                    ]);
                }
            }
        }

        // 7. Assessments
        $assessments = [
            Assessment::firstOrCreate(
                ['semester_id' => $sem1->id, 'name' => 'ប្រឡងប្រចាំខែ តុលា (October Quiz)'],
                ['type' => 'monthly', 'month' => '10', 'max_score' => 100, 'date' => '2026-10-25']
            ),
            Assessment::firstOrCreate(
                ['semester_id' => $sem1->id, 'name' => 'ប្រឡងប្រចាំខែ វិច្ឆិកា (November Quiz)'],
                ['type' => 'monthly', 'month' => '11', 'max_score' => 100, 'date' => '2026-11-25']
            ),
            Assessment::firstOrCreate(
                ['semester_id' => $sem1->id, 'name' => 'ប្រឡងឆមាសទី ១ (Semester 1 Exam)'],
                ['type' => 'final', 'month' => '02', 'max_score' => 100, 'date' => '2027-02-20']
            )
        ];

        // 8. 20 Cambodian Students & 20 Parents
        $c12aModel = SchoolClass::where('name', '12A')->first() ?? $allClasses[0];
        $c12bModel = SchoolClass::where('name', '12B')->first() ?? $allClasses[1];

        $studentsData = [
            ['name' => 'ឈន ស្រីណុច', 'code' => 'STU-0001', 'gender' => 'Female', 'class_id' => $c12aModel->id, 'position' => 'Class Monitor', 'dob' => '2008-05-12', 'parent' => 'ឈន ប៊ុនធឿន'],
            ['name' => 'សុខ ចាន់ដារ៉ា', 'code' => 'STU-0002', 'gender' => 'Male', 'class_id' => $c12aModel->id, 'position' => 'Vice Monitor', 'dob' => '2008-03-20', 'parent' => 'សុខ សុផល'],
            ['name' => 'លី ម៉េងហុង', 'code' => 'STU-0003', 'gender' => 'Male', 'class_id' => $c12aModel->id, 'position' => 'Member', 'dob' => '2008-08-15', 'parent' => 'លី សំអាត'],
            ['name' => 'គង់ សុភ័ក្រ', 'code' => 'STU-0004', 'gender' => 'Female', 'class_id' => $c12aModel->id, 'position' => 'Member', 'dob' => '2008-11-02', 'parent' => 'គង់ វ៉ាន់នី'],
            ['name' => 'មាស ពិសិដ្ឋ', 'code' => 'STU-0005', 'gender' => 'Male', 'class_id' => $c12aModel->id, 'position' => 'Member', 'dob' => '2008-01-25', 'parent' => 'មាស ហេង'],
            ['name' => 'អ៊ឹម សុជាតា', 'code' => 'STU-0006', 'gender' => 'Female', 'class_id' => $c12aModel->id, 'position' => 'Member', 'dob' => '2008-06-18', 'parent' => 'អ៊ឹម វណ្ណឌី'],
            ['name' => 'ហេង រតនៈ', 'code' => 'STU-0007', 'gender' => 'Male', 'class_id' => $c12aModel->id, 'position' => 'Member', 'dob' => '2008-09-30', 'parent' => 'ហេង រិទ្ធី'],
            ['name' => 'កែវ បញ្ញា', 'code' => 'STU-0008', 'gender' => 'Female', 'class_id' => $c12aModel->id, 'position' => 'Member', 'dob' => '2008-04-14', 'parent' => 'កែវ សម្បត្តិ'],
            ['name' => 'ឆាយ រិទ្ធី', 'code' => 'STU-0009', 'gender' => 'Male', 'class_id' => $c12aModel->id, 'position' => 'Member', 'dob' => '2008-12-05', 'parent' => 'ឆាយ វុធ'],
            ['name' => 'ថៃ ស្រីលក្ខណ៍', 'code' => 'STU-0010', 'gender' => 'Female', 'class_id' => $c12aModel->id, 'position' => 'Member', 'dob' => '2008-07-22', 'parent' => 'ថៃ វិបុល'],

            ['name' => 'នួន សុខជា', 'code' => 'STU-0011', 'gender' => 'Male', 'class_id' => $c12bModel->id, 'position' => 'Class Monitor', 'dob' => '2008-02-10', 'parent' => 'នួន គឹមសួរ'],
            ['name' => 'យិន ស្រីម៉េច', 'code' => 'STU-0012', 'gender' => 'Female', 'class_id' => $c12bModel->id, 'position' => 'Vice Monitor', 'dob' => '2008-10-18', 'parent' => 'យិន សុខា'],
            ['name' => 'រ៉ន វិចិត្រ', 'code' => 'STU-0013', 'gender' => 'Male', 'class_id' => $c12bModel->id, 'position' => 'Member', 'dob' => '2008-03-08', 'parent' => 'រ៉ន សម្បត្តិ'],
            ['name' => 'សំ ផល្លី', 'code' => 'STU-0014', 'gender' => 'Female', 'class_id' => $c12bModel->id, 'position' => 'Member', 'dob' => '2008-09-12', 'parent' => 'សំ ប៊ុនណា'],
            ['name' => 'អ៊ុក វិបុល', 'code' => 'STU-0015', 'gender' => 'Male', 'class_id' => $c12bModel->id, 'position' => 'Member', 'dob' => '2008-05-27', 'parent' => 'អ៊ុក វ៉ាន់ណា'],
            ['name' => 'សុវណ្ណ គឹមសួរ', 'code' => 'STU-0016', 'gender' => 'Female', 'class_id' => $c12bModel->id, 'position' => 'Member', 'dob' => '2008-11-19', 'parent' => 'សុវណ្ណ ពិសិដ្ឋ'],
            ['name' => 'ពៅ បូរិន', 'code' => 'STU-0017', 'gender' => 'Male', 'class_id' => $c12bModel->id, 'position' => 'Member', 'dob' => '2008-04-03', 'parent' => 'ពៅ ម៉ាលី'],
            ['name' => 'ឡាយ សុធារី', 'code' => 'STU-0018', 'gender' => 'Female', 'class_id' => $c12bModel->id, 'position' => 'Member', 'dob' => '2008-08-28', 'parent' => 'ឡាយ ម៉េងហួរ'],
            ['name' => 'ម៉ម សុវណ្ណារ៉ា', 'code' => 'STU-0019', 'gender' => 'Male', 'class_id' => $c12bModel->id, 'position' => 'Member', 'dob' => '2008-06-11', 'parent' => 'ម៉ម សុភី'],
            ['name' => 'សុខ ស្រីនាង', 'code' => 'STU-0020', 'gender' => 'Female', 'class_id' => $c12bModel->id, 'position' => 'Member', 'dob' => '2008-12-24', 'parent' => 'សុខ គីមសាន']
        ];

        foreach ($studentsData as $idx => $sData) {
            $numStr = sprintf('%02d', $idx + 1);

            // Create Student User
            $stuUser = User::firstOrCreate(
                ['email' => "student{$numStr}@school.com"],
                [
                    'name' => $sData['name'],
                    'password' => Hash::make('password'),
                    'role_id' => $studentRole->id,
                    'gender' => $sData['gender'],
                    'phone' => '097' . rand(1000000, 9999999)
                ]
            );

            // Create Student Profile Record
            $studentModel = Student::updateOrCreate(
                ['student_code' => $sData['code']],
                [
                    'user_id' => $stuUser->id,
                    'gender' => $sData['gender'],
                    'date_of_birth' => $sData['dob'],
                    'class_id' => $sData['class_id'],
                    'class_position' => $sData['position'],
                    'phone' => $stuUser->phone,
                    'address' => 'ស្រុកចំការលើ ខេត្តកំពង់ចាម',
                    'father_name' => $sData['parent'],
                    'mother_name' => 'មាស សុផល',
                    'max_leave_days' => 10
                ]
            );

            // Create Parent User Account
            $parentUser = User::firstOrCreate(
                ['email' => "parent{$numStr}@school.com"],
                [
                    'name' => $sData['parent'],
                    'password' => Hash::make('password'),
                    'role_id' => $parentRole->id,
                    'gender' => 'Male',
                    'phone' => '012' . rand(1000000, 9999999)
                ]
            );

            // Link Parent to Student
            StudentParent::updateOrCreate(
                [
                    'user_id' => $parentUser->id,
                    'student_id' => $studentModel->id
                ],
                [
                    'phone' => $parentUser->phone,
                    'address' => 'ស្រុកចំការលើ ខេត្តកំពង់ចាម'
                ]
            );

            // Generate realistic student subject scores
            foreach ($subjectModels as $subIdx => $sub) {
                foreach ($assessments as $assIdx => $ass) {
                    $scoreVal = 55 + (($idx * 11 + $subIdx * 7 + $assIdx * 5) % 45);
                    $gradeVal = 'F';
                    if ($scoreVal >= 90) $gradeVal = 'A';
                    elseif ($scoreVal >= 80) $gradeVal = 'B';
                    elseif ($scoreVal >= 70) $gradeVal = 'C';
                    elseif ($scoreVal >= 60) $gradeVal = 'D';
                    elseif ($scoreVal >= 50) $gradeVal = 'E';

                    StudentScore::updateOrCreate(
                        [
                            'student_id' => $studentModel->id,
                            'subject_id' => $sub->id,
                            'assessment_id' => $ass->id
                        ],
                        [
                            'score' => $scoreVal,
                            'max_score' => 100,
                            'percentage' => $scoreVal,
                            'grade' => $gradeVal,
                            'remark' => $scoreVal >= 50 ? 'ខិតខំរៀនសូត្រ' : 'ត្រូវខិតខំเพิ่มเติม'
                        ]
                    );
                }
            }

            // Attendance entries
            Attendance::firstOrCreate(
                ['student_id' => $studentModel->id, 'date' => '2026-08-01'],
                ['class_id' => $sData['class_id'], 'teacher_id' => $teacherUsers[0]->id, 'subject_id' => $subjectModels[0]->id, 'status' => 'present', 'note' => 'វត្តមាន']
            );
            Attendance::firstOrCreate(
                ['student_id' => $studentModel->id, 'date' => '2026-08-02'],
                ['class_id' => $sData['class_id'], 'teacher_id' => $teacherUsers[0]->id, 'subject_id' => $subjectModels[0]->id, 'status' => 'present', 'note' => 'វត្តមាន']
            );
        }
    }
}
