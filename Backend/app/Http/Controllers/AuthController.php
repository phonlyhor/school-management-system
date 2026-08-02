<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Student;
use App\Models\Role;

class AuthController extends Controller
{
    // Login
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::with('role')
            ->where('email', $request->email)
            ->first();

        // Check email and password
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password',
            ], 401);
        }

        // Create Access Token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',

            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->name,
            ],

            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    // Public Student Self-Registration (Includes Complete Family & Personal Info)
    public function registerStudent(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email:rfc',
                'regex:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',
                'unique:users,email'
            ],
            'password' => 'required|string|min:6',
            'gender' => 'nullable|string',
            'date_of_birth' => 'nullable|date',
            'class_id' => 'nullable|exists:school_classes,id',
            'phone' => ['nullable', 'string', 'regex:/^(0|\+855)[1-9][0-9]{7,8}$/'],
            'address' => 'nullable|string',
            'place_of_birth' => 'nullable|string',
            'father_name' => 'nullable|string',
            'father_phone' => ['nullable', 'string', 'regex:/^(0|\+855)[1-9][0-9]{7,8}$/'],
            'mother_name' => 'nullable|string',
            'mother_phone' => ['nullable', 'string', 'regex:/^(0|\+855)[1-9][0-9]{7,8}$/'],
        ], [
            'email.email' => 'អាសយដ្ឋានអ៊ីមែលមិនត្រឹមត្រូវទេ! (ឧទាហរណ៍ ៖ student@gmail.com)',
            'email.regex' => 'ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវទេ! (ឧទាហរណ៍ ៖ student@gmail.com)',
            'email.unique' => 'អ៊ីមែលនេះមានក្នុងប្រព័ន្ធរួចហើយ! សូមប្រើប្រាស់អ៊ីមែលផ្សេងទៀត។',
            'phone.regex' => 'លេខទូរស័ព្ទសិស្សមិនត្រឹមត្រូវទេ! (ឧទាហរណ៍ ៖ 012345678 ឬ 0971234567)',
            'father_phone.regex' => 'លេខទូរស័ព្ទឪពុកមិនត្រឹមត្រូវទេ! (ឧទាហរណ៍ ៖ 012345678)',
            'mother_phone.regex' => 'លេខទូរស័ព្ទម្តាយមិនត្រឹមត្រូវទេ! (ឧទាហរណ៍ ៖ 012345678)',
        ]);

        $studentRole = Role::where('name', 'student')->first();

        // Photo Upload Handling
        $photoUrl = null;
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('students', 'public');
            $photoUrl = '/storage/' . $path;
        }

        // 1. Create User Account
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $studentRole?->id ?? 3,
        ]);

        // Auto-generate student code STU-XXXX
        $lastStudent = Student::latest('id')->first();
        $nextId = ($lastStudent ? $lastStudent->id : 0) + 1;
        $studentCode = 'STU-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

        // 2. Create Student Record (Includes Class, Parents & Photo)
        $student = Student::create([
            'user_id' => $user->id,
            'student_code' => $studentCode,
            'gender' => $request->gender ?? 'Male',
            'date_of_birth' => $request->date_of_birth,
            'class_id' => $request->class_id,
            'phone' => $request->phone,
            'photo' => $photoUrl,
            'address' => $request->address ?? 'ស្រុកចំការលើ ខេត្តកំពង់ចាម',
            'place_of_birth' => $request->place_of_birth,
            'father_name' => $request->father_name,
            'father_phone' => $request->father_phone,
            'mother_name' => $request->mother_name,
            'mother_phone' => $request->mother_phone,
            'class_position' => 'Member',
            'max_leave_days' => 10,
        ]);

        // 3. Create Admin Notification for New Student Registration
        $adminUser = User::where('role_id', 1)->orWhere('email', 'admin@school.com')->first();
        \App\Models\Notification::create([
            'title' => '👨‍🎓 សិស្សថ្មីបានចុះឈ្មោះក្នុងប្រព័ន្ធ',
            'message' => 'សិស្សឈ្មោះ ' . $user->name . ' (អត្តលេខ ៖ ' . $studentCode . ') បានចុះឈ្មោះក្នុងប្រព័ន្ធដោយជោគជ័យ។',
            'type' => 'student_registration',
            'user_id' => $adminUser ? $adminUser->id : 1,
            'is_read' => false,
        ]);

        // 4. Issue Token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'បានចុះឈ្មោះសិស្សថ្មីដោយជោគជ័យ!',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => 'student',
                'student_code' => $studentCode,
            ]
        ], 201);
    }

    // Get current logged-in user
    public function me(Request $request)
    {
        $user = $request->user()->load('role');

        $student = Student::with('schoolClass')->where('user_id', $user->id)->first();
        $teacher = \App\Models\Teacher::where('user_id', $user->id)->first();

        $photo = $student?->photo ?? $teacher?->photo ?? null;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->name,
                'photo' => $photo,
                'student_code' => $student?->student_code,
                'class' => $student?->schoolClass?->name,
                'grade_level' => $student?->schoolClass?->grade_level,
                'gender' => $student?->gender,
                'dob' => $student?->dob,
                'phone' => $student?->phone ?? $teacher?->phone
            ],
        ]);
    }

    // Update Profile (Only Admin can edit)
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        if (intval($user->role_id) !== 1) {
            return response()->json([
                'message' => 'Only School Administrators can modify user profile information.'
            ], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|min:6',
        ]);

        $userData = [
            'name' => $request->name,
            'email' => $request->email,
        ];

        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }

        $user->update($userData);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->name ?? 'User',
            ]
        ]);
    }

    // Logout
    public function logout(Request $request)
    {
        // Delete current access token
        $request->user()
            ->currentAccessToken()
            ->delete();

        return response()->json([
            'message' => 'Logout successful',
        ]);
    }
}