<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | 1. Create Permissions
        |--------------------------------------------------------------------------
        */

        $permissions = [
            // Users
            [
                'name' => 'users.view',
                'description' => 'View Users',
            ],
            [
                'name' => 'users.create',
                'description' => 'Create Users',
            ],
            [
                'name' => 'users.update',
                'description' => 'Update Users',
            ],
            [
                'name' => 'users.delete',
                'description' => 'Delete Users',
            ],

            // Students
            [
                'name' => 'students.view',
                'description' => 'View Students',
            ],
            [
                'name' => 'students.create',
                'description' => 'Create Students',
            ],
            [
                'name' => 'students.update',
                'description' => 'Update Students',
            ],
            [
                'name' => 'students.delete',
                'description' => 'Delete Students',
            ],

            // Attendance
            [
                'name' => 'attendance.view',
                'description' => 'View Attendance',
            ],
            [
                'name' => 'attendance.create',
                'description' => 'Create Attendance',
            ],
            [
                'name' => 'attendance.update',
                'description' => 'Update Attendance',
            ],

            // Grades
            [
                'name' => 'grades.view',
                'description' => 'View Grades',
            ],
            [
                'name' => 'grades.create',
                'description' => 'Create Grades',
            ],
            [
                'name' => 'grades.update',
                'description' => 'Update Grades',
            ],

            // Class Teacher
            [
                'name' => 'class_students.view',
                'description' => 'View Students in Assigned Class',
            ],
            [
                'name' => 'class_students.update',
                'description' => 'Update Students in Assigned Class',
            ],
            [
                'name' => 'class_attendance.view',
                'description' => 'View Attendance of Assigned Class',
            ],
            [
                'name' => 'class_attendance.create',
                'description' => 'Create Attendance for Assigned Class',
            ],
            [
                'name' => 'class_attendance.update',
                'description' => 'Update Attendance of Assigned Class',
            ],
            [
                'name' => 'class_reports.view',
                'description' => 'View Reports of Assigned Class',
            ],

            // Class Teacher Assignment
            // Admin only
            [
                'name' => 'class_teachers.view',
                'description' => 'View Class Teacher Assignments',
            ],
            [
                'name' => 'class_teachers.create',
                'description' => 'Assign Teacher to Class',
            ],
            [
                'name' => 'class_teachers.update',
                'description' => 'Update Class Teacher Assignment',
            ],
            [
                'name' => 'class_teachers.delete',
                'description' => 'Remove Teacher from Class',
            ],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                [
                    'name' => $permission['name']
                ],
                $permission
            );
        }


        /*
        |--------------------------------------------------------------------------
        | 2. Create Roles
        |--------------------------------------------------------------------------
        */

        $admin = Role::updateOrCreate(
            [
                'name' => 'admin'
            ],
            [
                'description' => 'System Administrator',
            ]
        );

        $teacher = Role::updateOrCreate(
            [
                'name' => 'teacher'
            ],
            [
                'description' => 'School Teacher',
            ]
        );

        $student = Role::updateOrCreate(
            [
                'name' => 'student'
            ],
            [
                'description' => 'School Student',
            ]
        );

        $parent = Role::updateOrCreate(
            [
                'name' => 'parent'
            ],
            [
                'description' => 'Student Parent',
            ]
        );


        /*
        |--------------------------------------------------------------------------
        | 3. Admin Permissions
        |--------------------------------------------------------------------------
        */

        $adminPermissions = Permission::all();


        /*
        |--------------------------------------------------------------------------
        | 4. Teacher Permissions
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | Teacher ធម្មតា និង Class Teacher
        | មាន Role ដូចគ្នា = teacher
        |
        | Class Teacher នឹងទទួលបានសិទ្ធិ
        | បន្ថែមតាម Class Assignment
        |
        */

        $teacherPermissions = Permission::whereIn('name', [

            // Students
            'students.view',

            // Attendance
            'attendance.view',
            'attendance.create',
            'attendance.update',

            // Grades
            'grades.view',
            'grades.create',
            'grades.update',

            // Class Teacher
            'class_students.view',
            'class_students.update',

            'class_attendance.view',
            'class_attendance.create',
            'class_attendance.update',

            'class_reports.view',

        ])->get();


        /*
        |--------------------------------------------------------------------------
        | 5. Student Permissions
        |--------------------------------------------------------------------------
        */

        $studentPermissions = Permission::whereIn('name', [

            'students.view',

            'attendance.view',

            'grades.view',

        ])->get();


        /*
        |--------------------------------------------------------------------------
        | 6. Parent Permissions
        |--------------------------------------------------------------------------
        */

        $parentPermissions = Permission::whereIn('name', [

            'attendance.view',

            'grades.view',

        ])->get();


        /*
        |--------------------------------------------------------------------------
        | 7. Assign Permissions to Roles
        |--------------------------------------------------------------------------
        */

        // Admin → All Permissions
        $admin->permissions()->sync(
            $adminPermissions->pluck('id')
        );


        // Teacher → Teacher Permissions
        $teacher->permissions()->sync(
            $teacherPermissions->pluck('id')
        );


        // Student → Student Permissions
        $student->permissions()->sync(
            $studentPermissions->pluck('id')
        );


        // Parent → Parent Permissions
        $parent->permissions()->sync(
            $parentPermissions->pluck('id')
        );
    }
}