<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\Assessment;
use App\Models\StudentScore;
use App\Models\TeacherClassAssignment;
use App\Models\TeacherSubjectAssignment;
use App\Models\Attendance;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class FullSchoolDataSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Ensure Roles exist
        $teacherRole = Role::firstOrCreate(['name' => 'teacher']);
        $studentRole = Role::firstOrCreate(['name' => 'student']);

        // 1. Academic Years & Semesters
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

        // 2. Classes (with Grade 12 Science & Social Science streams)
        $c12a = SchoolClass::firstOrCreate(
            ['name' => '12A'],
            ['grade_level' => '12', 'stream' => 'science', 'academic_year' => '2026-2027']
        );

        $c12b = SchoolClass::firstOrCreate(
            ['name' => '12B'],
            ['grade_level' => '12', 'stream' => 'social_science', 'academic_year' => '2026-2027']
        );

        $c11a = SchoolClass::firstOrCreate(
            ['name' => '11A'],
            ['grade_level' => '11', 'stream' => 'science', 'academic_year' => '2026-2027']
        );

        $c7a = SchoolClass::firstOrCreate(
            ['name' => '7A'],
            ['grade_level' => '7', 'stream' => 'general', 'academic_year' => '2026-2027']
        );

        // 3. Core High School Subjects
        $subjectsList = [
            ['name' => 'គណិតវិទ្យា', 'code' => 'MATH-12'],
            ['name' => 'រូបវិទ្យា', 'code' => 'PHYS-12'],
            ['name' => 'គីមីវិទ្យា', 'code' => 'CHEM-12'],
            ['name' => 'ជីវវិទ្យា', 'code' => 'BIO-12'],
            ['name' => 'ភាសាខ្មែរ', 'code' => 'KHM-12'],
            ['name' => 'ភាសាអង់គ្លេស', 'code' => 'ENG-12'],
            ['name' => 'ប្រវត្តិវិទ្យា', 'code' => 'HIS-12'],
            ['name' => 'ភូមិវិទ្យា', 'code' => 'GEO-12']
        ];

        $subjectModels = [];
        foreach ($subjectsList as $s) {
            $subjectModels[] = Subject::firstOrCreate(['code' => $s['code']], $s);
        }

        // 4. Teachers (User accounts with teacher role)
        $teachersData = [
            ['name' => 'អ៊ឹង ហ្គេចហៀក', 'email' => 'eng.gechheak@school.com', 'gender' => 'Female', 'phone' => '012987654'],
            ['name' => 'សុខ ចាន់ថន', 'email' => 'sok.chanthorn@school.com', 'gender' => 'Male', 'phone' => '012345678'],
            ['name' => 'លី សុខា', 'email' => 'ly.sokha@school.com', 'gender' => 'Female', 'phone' => '011223344'],
            ['name' => 'គង់ វណ្ណៈ', 'email' => 'kong.vannak@school.com', 'gender' => 'Male', 'phone' => '015556677']
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

        // Homeroom teacher assignments
        TeacherClassAssignment::firstOrCreate(
            ['teacher_id' => $teacherUsers[0]->id, 'class_id' => $c12a->id, 'academic_year' => '2026-2027']
        );
        TeacherClassAssignment::firstOrCreate(
            ['teacher_id' => $teacherUsers[1]->id, 'class_id' => $c12b->id, 'academic_year' => '2026-2027']
        );

        // Subject teacher assignments
        foreach ($subjectModels as $sub) {
            TeacherSubjectAssignment::firstOrCreate(
                ['teacher_id' => $teacherUsers[0]->id, 'class_id' => $c12a->id, 'subject_id' => $sub->id],
                ['academic_year' => '2026-2027']
            );
            TeacherSubjectAssignment::firstOrCreate(
                ['teacher_id' => $teacherUsers[1]->id, 'class_id' => $c12b->id, 'subject_id' => $sub->id],
                ['academic_year' => '2026-2027']
            );
        }

        // 5. Assessments
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

        // 6. 20 Realistic Cambodian Students
        $studentsList = [
            ['name' => 'ឈន ស្រីណុច', 'code' => 'STU-0001', 'gender' => 'Female', 'class_id' => $c12a->id, 'position' => 'Class Monitor', 'dob' => '2008-05-12'],
            ['name' => 'សុខ ចាន់ដារ៉ា', 'code' => 'STU-0002', 'gender' => 'Male', 'class_id' => $c12a->id, 'position' => 'Vice Monitor', 'dob' => '2008-03-20'],
            ['name' => 'លី ម៉េងហុង', 'code' => 'STU-0003', 'gender' => 'Male', 'class_id' => $c12a->id, 'position' => 'Member', 'dob' => '2008-08-15'],
            ['name' => 'គង់ សុភ័ក្រ', 'code' => 'STU-0004', 'gender' => 'Female', 'class_id' => $c12a->id, 'position' => 'Member', 'dob' => '2008-11-02'],
            ['name' => 'មាស ពិសិដ្ឋ', 'code' => 'STU-0005', 'gender' => 'Male', 'class_id' => $c12a->id, 'position' => 'Member', 'dob' => '2008-01-25'],
            ['name' => 'អ៊ឹម សុជាតា', 'code' => 'STU-0006', 'gender' => 'Female', 'class_id' => $c12a->id, 'position' => 'Member', 'dob' => '2008-06-18'],
            ['name' => 'ហេង រតនៈ', 'code' => 'STU-0007', 'gender' => 'Male', 'class_id' => $c12a->id, 'position' => 'Member', 'dob' => '2008-09-30'],
            ['name' => 'កែវ បញ្ញា', 'code' => 'STU-0008', 'gender' => 'Female', 'class_id' => $c12a->id, 'position' => 'Member', 'dob' => '2008-04-14'],
            ['name' => 'ឆាយ រិទ្ធី', 'code' => 'STU-0009', 'gender' => 'Male', 'class_id' => $c12a->id, 'position' => 'Member', 'dob' => '2008-12-05'],
            ['name' => 'ថៃ ស្រីលក្ខណ៍', 'code' => 'STU-0010', 'gender' => 'Female', 'class_id' => $c12a->id, 'position' => 'Member', 'dob' => '2008-07-22'],

            ['name' => 'នួន សុខជា', 'code' => 'STU-0011', 'gender' => 'Male', 'class_id' => $c12b->id, 'position' => 'Class Monitor', 'dob' => '2008-02-10'],
            ['name' => 'យិន ស្រីម៉េច', 'code' => 'STU-0012', 'gender' => 'Female', 'class_id' => $c12b->id, 'position' => 'Vice Monitor', 'dob' => '2008-10-18'],
            ['name' => 'រ៉ន វិចិត្រ', 'code' => 'STU-0013', 'gender' => 'Male', 'class_id' => $c12b->id, 'position' => 'Member', 'dob' => '2008-03-08'],
            ['name' => 'សំ ផល្លី', 'code' => 'STU-0014', 'gender' => 'Female', 'class_id' => $c12b->id, 'position' => 'Member', 'dob' => '2008-09-12'],
            ['name' => 'អ៊ុក វិបុល', 'code' => 'STU-0015', 'gender' => 'Male', 'class_id' => $c12b->id, 'position' => 'Member', 'dob' => '2008-05-27'],
            ['name' => 'សុវណ្ណ គឹមសួរ', 'code' => 'STU-0016', 'gender' => 'Female', 'class_id' => $c12b->id, 'position' => 'Member', 'dob' => '2008-11-19'],
            ['name' => 'ពៅ បូរិន', 'code' => 'STU-0017', 'gender' => 'Male', 'class_id' => $c12b->id, 'position' => 'Member', 'dob' => '2008-04-03'],
            ['name' => 'ឡាយ សុធារី', 'code' => 'STU-0018', 'gender' => 'Female', 'class_id' => $c12b->id, 'position' => 'Member', 'dob' => '2008-08-28'],
            ['name' => 'ម៉ម សុវណ្ណារ៉ា', 'code' => 'STU-0019', 'gender' => 'Male', 'class_id' => $c12b->id, 'position' => 'Member', 'dob' => '2008-06-11'],
            ['name' => 'សុខ ស្រីនាង', 'code' => 'STU-0020', 'gender' => 'Female', 'class_id' => $c12b->id, 'position' => 'Member', 'dob' => '2008-12-24']
        ];

        foreach ($studentsList as $index => $sData) {
            $user = User::firstOrCreate(
                ['email' => strtolower(str_replace(' ', '', $sData['code'])) . '@student.com'],
                [
                    'name' => $sData['name'],
                    'password' => Hash::make('password'),
                    'role_id' => $studentRole->id,
                    'gender' => $sData['gender']
                ]
            );

            $student = Student::updateOrCreate(
                ['student_code' => $sData['code']],
                [
                    'user_id' => $user->id,
                    'gender' => $sData['gender'],
                    'date_of_birth' => $sData['dob'],
                    'class_id' => $sData['class_id'],
                    'class_position' => $sData['position'],
                    'phone' => '097' . rand(1000000, 9999999),
                    'address' => 'ស្រុកចំការលើ ខេត្តកំពង់ចាម',
                    'father_name' => 'សុខ ប៊ុនធឿន',
                    'mother_name' => 'មាស សុផល',
                    'max_leave_days' => 10
                ]
            );

            // Generate realistic scores for each student across subjects & assessments
            foreach ($subjectModels as $subIndex => $sub) {
                foreach ($assessments as $assIndex => $ass) {
                    $baseScore = 60 + (($index * 7 + $subIndex * 5 + $assIndex * 3) % 36);
                    $percentage = min(100, max(45, $baseScore));
                    
                    $grade = 'F';
                    if ($percentage >= 85) $grade = 'A';
                    elseif ($percentage >= 75) $grade = 'B';
                    elseif ($percentage >= 65) $grade = 'C';
                    elseif ($percentage >= 50) $grade = 'D';

                    StudentScore::updateOrCreate(
                        [
                            'student_id' => $student->id,
                            'subject_id' => $sub->id,
                            'assessment_id' => $ass->id
                        ],
                        [
                            'score' => $percentage,
                            'max_score' => 100,
                            'percentage' => $percentage,
                            'grade' => $grade,
                            'remark' => $percentage >= 50 ? 'Good Effort' : 'Needs Support'
                        ]
                    );
                }
            }

            // Create sample attendance records for student
            Attendance::firstOrCreate(
                ['student_id' => $student->id, 'date' => '2026-08-01'],
                ['class_id' => $sData['class_id'], 'teacher_id' => $teacherUsers[0]->id, 'subject_id' => $subjectModels[0]->id, 'status' => 'present', 'note' => 'On time']
            );
            Attendance::firstOrCreate(
                ['student_id' => $student->id, 'date' => '2026-08-02'],
                ['class_id' => $sData['class_id'], 'teacher_id' => $teacherUsers[0]->id, 'subject_id' => $subjectModels[0]->id, 'status' => 'present', 'note' => 'On time']
            );
        }

        // Seed Notifications for Admin
        $adminUser = User::where('email', 'admin@school.com')->first();
        $adminId = $adminUser ? $adminUser->id : 1;

        \App\Models\Notification::firstOrCreate(
            ['title' => '👨‍🎓 សិស្សថ្មីបានចុះឈ្មោះក្នុងប្រព័ន្ធ'],
            [
                'message' => 'សិស្ស គង់ សុភ័ក្រ (អត្តលេខ ៖ STU-0021) បានចុះឈ្មោះចូលរៀនថ្នាក់ទី១២A ដោយជោគជ័យ។',
                'type' => 'student_registration',
                'user_id' => $adminId,
                'is_read' => false,
            ]
        );

        \App\Models\Notification::firstOrCreate(
            ['title' => '🔑 សំណើស្នើសុំផ្លាស់ប្តូរពាក្យសម្ងាត់'],
            [
                'message' => 'គ្រូបង្រៀន លី ម៉េងហុង (email: teacher1@school.com) បានស្នើសុំផ្លាស់ប្តូរពាក្យសម្ងាត់ថ្មី។',
                'type' => 'password_reset',
                'user_id' => $adminId,
                'is_read' => false,
            ]
        );

        \App\Models\Notification::firstOrCreate(
            ['title' => '📝 សំណើសុំច្បាប់សម្រាកថ្មី'],
            [
                'message' => 'សិស្ស ឈន ស្រីណុច បានផ្ញើសំណើសុំច្បាប់សម្រាកចំនួន ២ ថ្ងៃ (មានធុរៈគ្រួសារ)។',
                'type' => 'leave_request',
                'user_id' => $adminId,
                'is_read' => false,
            ]
        );

        \App\Models\Notification::firstOrCreate(
            ['title' => '🎓 ប្រព័ន្ធដំឡើងថ្នាក់សិស្សចុងឆ្នាំ'],
            [
                'message' => 'ទិន្នន័យពិន្ទុ និង វត្តមានប្រចាំឆ្នាំសិក្សា ២០២៦-២០២៧ ត្រូវបានគណនារួចរាល់សម្រាប់ការដំឡើងថ្នាក់។',
                'type' => 'system',
                'user_id' => $adminId,
                'is_read' => false,
            ]
        );
    }
}
