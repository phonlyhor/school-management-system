<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Get Roles
        $adminRole = Role::where('name', 'admin')->firstOrFail();
        $teacherRole = Role::where('name', 'teacher')->firstOrFail();
        $studentRole = Role::where('name', 'student')->firstOrFail();
        $parentRole = Role::where('name', 'parent')->firstOrFail();


        // Create Admin
        User::updateOrCreate(
            [
                'email' => 'admin@school.com',
            ],
            [
                'name' => 'School Admin',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
            ]
        );


        // Create Teacher
        User::updateOrCreate(
            [
                'email' => 'teacher@school.com',
            ],
            [
                'name' => 'Dara Teacher',
                'password' => Hash::make('password'),
                'role_id' => $teacherRole->id,
            ]
        );


        // Create Student
        User::updateOrCreate(
            [
                'email' => 'student@school.com',
            ],
            [
                'name' => 'Sokha Student',
                'password' => Hash::make('password'),
                'role_id' => $studentRole->id,
            ]
        );


        // Create Parent
        User::updateOrCreate(
            [
                'email' => 'parent@school.com',
            ],
            [
                'name' => 'Vanna Parent',
                'password' => Hash::make('password'),
                'role_id' => $parentRole->id,
            ]
        );
    }
}