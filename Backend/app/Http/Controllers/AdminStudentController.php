<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AdminStudentController extends Controller
{
    // View all students with class & homeroom teacher info
    public function index()
    {
        $students = Student::with([
            'user', 
            'schoolClass.teacherAssignments.teacher', 
            'studentParent.user'
        ])->get();

        return response()->json([
            'students' => $students
        ]);
    }

    // Create student
    public function store(Request $request)
    {
        // Auto-generate student_code if empty
        if (!$request->filled('student_code')) {
            $latestStudent = Student::latest('id')->first();
            $nextId = $latestStudent ? ($latestStudent->id + 1) : 1;
            $request->merge([
                'student_code' => 'STU-' . str_pad($nextId, 4, '0', STR_PAD_LEFT)
            ]);
        }

        if ($request->has('date_of_birth') && empty($request->date_of_birth)) {
            $request->merge(['date_of_birth' => null]);
        }

        if ($request->has('class_id') && empty($request->class_id)) {
            $request->merge(['class_id' => null]);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'student_code' => 'required|string|unique:students,student_code',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string',
            'class_id' => 'nullable|exists:school_classes,id',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'father_name' => 'nullable|string',
            'mother_name' => 'nullable|string',
            'place_of_birth' => 'nullable|string',
            'class_position' => 'nullable|string',
            'photo' => 'nullable',
        ]);

        try {
            DB::beginTransaction();

            $photoPath = null;
            if ($request->hasFile('photo')) {
                try {
                    $uploaded = \CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary::upload(
                        $request->file('photo')->getRealPath(),
                        ['folder' => 'school-management']
                    );
                    $photoPath = $uploaded->getSecurePath();
                } catch (\Throwable $e) {
                    Log::warning("Cloudinary Upload Fallback to Local Storage: " . $e->getMessage());
                    $file = $request->file('photo');
                    $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    $file->storeAs('public/students', $filename);
                    $photoPath = 'storage/students/' . $filename;
                }
            } elseif ($request->filled('photo') && is_string($request->photo)) {
                $photoPath = $request->photo;
            }

            // 1. Create the User (Role 3 = Student)
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role_id' => 3, 
            ]);

            $position = $request->filled('class_position') ? $request->class_position : 'Member';
            $classId = $request->filled('class_id') ? $request->class_id : null;

            if ($position !== 'Member' && $classId) {
                Student::where('class_id', $classId)
                    ->where('class_position', $position)
                    ->update(['class_position' => 'Member']);
            }

            // 2. Create the Student Profile
            $student = Student::create([
                'user_id' => $user->id,
                'student_code' => $request->student_code,
                'date_of_birth' => $request->filled('date_of_birth') ? $request->date_of_birth : null,
                'gender' => $request->filled('gender') ? $request->gender : null,
                'class_id' => $classId,
                'phone' => $request->filled('phone') ? $request->phone : null,
                'address' => $request->filled('address') ? $request->address : null,
                'father_name' => $request->filled('father_name') ? $request->father_name : null,
                'father_dob' => $request->filled('father_dob') ? $request->father_dob : null,
                'father_phone' => $request->filled('father_phone') ? $request->father_phone : null,
                'mother_name' => $request->filled('mother_name') ? $request->mother_name : null,
                'mother_dob' => $request->filled('mother_dob') ? $request->mother_dob : null,
                'mother_phone' => $request->filled('mother_phone') ? $request->mother_phone : null,
                'place_of_birth' => $request->filled('place_of_birth') ? $request->place_of_birth : null,
                'class_position' => $position,
                'max_leave_days' => $request->filled('max_leave_days') ? intval($request->max_leave_days) : 10,
                'photo' => $photoPath,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Student enrolled successfully',
                'student' => $student->load([
                    'user', 
                    'schoolClass.teacherAssignments.teacher', 
                    'studentParent.user'
                ])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to enroll student: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to enroll student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Show one student
    public function show($id)
    {
        $student = Student::with([
            'user', 
            'schoolClass.teacherAssignments.teacher', 
            'studentParent.user'
        ])->findOrFail($id);
        return response()->json(['student' => $student]);
    }

    // Update student
    public function update(Request $request, $id)
    {
        $student = Student::findOrFail($id);
        $user = $student->user;

        if ($request->has('date_of_birth') && empty($request->date_of_birth)) {
            $request->merge(['date_of_birth' => null]);
        }

        if ($request->has('class_id') && empty($request->class_id)) {
            $request->merge(['class_id' => null]);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'student_code' => 'sometimes|string|unique:students,student_code,' . $student->id,
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string',
            'class_id' => 'nullable|exists:school_classes,id',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'father_name' => 'nullable|string',
            'mother_name' => 'nullable|string',
            'place_of_birth' => 'nullable|string',
            'class_position' => 'nullable|string',
            'photo' => 'nullable',
        ]);

        try {
            DB::beginTransaction();

            // 1. Update User
            $userData = $request->only(['name', 'email']);
            if ($request->filled('password')) {
                $userData['password'] = Hash::make($request->password);
            }
            $user->update($userData);

            // 2. Update Student Profile
            $studentData = [];
            $fields = [
                'student_code', 'date_of_birth', 'gender', 'class_id', 'phone', 'address',
                'father_name', 'father_dob', 'father_phone',
                'mother_name', 'mother_dob', 'mother_phone',
                'place_of_birth', 'class_position', 'max_leave_days'
            ];

            foreach ($fields as $field) {
                if ($request->has($field)) {
                    $val = $request->input($field);
                    $studentData[$field] = ($val === '' || $val === 'null' || $val === 'undefined') ? null : $val;
                }
            }

            if ($request->hasFile('photo')) {
                try {
                    $uploaded = \CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary::upload(
                        $request->file('photo')->getRealPath(),
                        ['folder' => 'school-management']
                    );
                    $studentData['photo'] = $uploaded->getSecurePath();
                } catch (\Throwable $e) {
                    Log::warning("Cloudinary Upload Fallback to Local Storage (Update): " . $e->getMessage());
                    $file = $request->file('photo');
                    $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    $file->storeAs('public/students', $filename);
                    $studentData['photo'] = 'storage/students/' . $filename;
                }
            } elseif ($request->has('photo') && is_string($request->photo) && !empty($request->photo)) {
                $studentData['photo'] = $request->photo;
            }

            $targetClassId = $studentData['class_id'] ?? $student->class_id;
            $targetPosition = $studentData['class_position'] ?? $student->class_position;

            if ($targetPosition && $targetPosition !== 'Member' && $targetClassId) {
                Student::where('class_id', $targetClassId)
                    ->where('class_position', $targetPosition)
                    ->where('id', '!=', $student->id)
                    ->update(['class_position' => 'Member']);
            }

            $student->update($studentData);

            DB::commit();

            $student->load([
                'user', 
                'schoolClass.teacherAssignments.teacher', 
                'studentParent.user'
            ]);

            return response()->json([
                'message' => 'Student updated successfully',
                'student' => $student
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update student: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to update student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Delete student
    public function destroy($id)
    {
        try {
            DB::beginTransaction();
            
            $student = Student::findOrFail($id);
            $userId = $student->user_id;

            $student->delete();
            User::where('id', $userId)->delete();

            DB::commit();

            return response()->json([
                'message' => 'Student deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete student: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to delete student',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
