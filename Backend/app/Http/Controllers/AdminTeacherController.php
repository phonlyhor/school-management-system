<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\TeacherClassAssignment;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AdminTeacherController extends Controller
{
    // View all teachers with homeroom class assignments
    public function index()
    {
        $teachers = User::where('role_id', 2)
            ->with(['teacherClassAssignments.schoolClass'])
            ->get();

        return response()->json([
            'teachers' => $teachers
        ]);
    }

    // Create teacher
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'gender' => 'nullable|string',
            'class_id' => 'nullable',
            'academic_year' => 'nullable|string',
            'photo' => 'nullable',
            'date_of_birth' => 'nullable|date',
            'specialization' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
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
                    \Illuminate\Support\Facades\Log::warning("Cloudinary Teacher Upload Fallback: " . $e->getMessage());
                    $file = $request->file('photo');
                    $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    $file->storeAs('public/teachers', $filename);
                    $photoPath = 'storage/teachers/' . $filename;
                }
            } elseif ($request->filled('photo') && is_string($request->photo)) {
                $photoPath = $request->photo;
            }

            // 1. Create Teacher User (role_id = 2)
            $teacher = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'gender' => $request->filled('gender') ? $request->gender : 'male',
                'password' => Hash::make($request->password),
                'role_id' => 2,
                'photo' => $photoPath,
                'date_of_birth' => $request->filled('date_of_birth') ? $request->date_of_birth : null,
                'specialization' => $request->specialization,
                'address' => $request->address,
                'phone' => $request->phone,
            ]);

            // 2. Assign Homeroom Class if selected
            $classId = $request->filled('class_id') ? $request->class_id : null;
            if ($classId && $classId !== 'null' && $classId !== '') {
                $academicYear = $request->filled('academic_year') ? $request->academic_year : '2026-2027';

                // Check if class already has a homeroom teacher
                $existing = TeacherClassAssignment::where('class_id', $classId)->with('teacher')->first();
                if ($existing) {
                    return response()->json([
                        'message' => 'ថ្នាក់នេះមានគ្រូបន្ទុកថ្នាក់រួចហើយ (' . ($existing->teacher?->name ?? 'គ្រូផ្សេង') . ')'
                    ], 422);
                }

                // Clear any homeroom class previously assigned to THIS teacher
                TeacherClassAssignment::where('teacher_id', $teacher->id)->delete();

                TeacherClassAssignment::create([
                    'teacher_id' => $teacher->id,
                    'class_id' => $classId,
                    'academic_year' => $academicYear,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Teacher created successfully',
                'teacher' => $teacher->load(['teacherClassAssignments.schoolClass'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create teacher: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to create teacher: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Show single teacher
    public function show($id)
    {
        $teacher = User::where('role_id', 2)
            ->with(['teacherClassAssignments.schoolClass'])
            ->findOrFail($id);

        return response()->json(['teacher' => $teacher]);
    }

    // Update teacher
    public function update(Request $request, $id)
    {
        $teacher = User::where('role_id', 2)->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $teacher->id,
            'class_id' => 'nullable',
            'academic_year' => 'nullable|string',
            'photo' => 'nullable',
            'date_of_birth' => 'nullable|date',
            'specialization' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $userData = $request->only(['name', 'email', 'gender', 'specialization', 'address', 'phone']);
            if ($request->has('date_of_birth')) {
                $userData['date_of_birth'] = $request->filled('date_of_birth') ? $request->date_of_birth : null;
            }
            if ($request->filled('password')) {
                $userData['password'] = Hash::make($request->password);
            }

            if ($request->hasFile('photo')) {
                try {
                    $uploaded = \CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary::upload(
                        $request->file('photo')->getRealPath(),
                        ['folder' => 'school-management']
                    );
                    $userData['photo'] = $uploaded->getSecurePath();
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning("Cloudinary Teacher Update Upload Fallback: " . $e->getMessage());
                    $file = $request->file('photo');
                    $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    $file->storeAs('public/teachers', $filename);
                    $userData['photo'] = 'storage/teachers/' . $filename;
                }
            } elseif ($request->has('photo') && is_string($request->photo) && !empty($request->photo)) {
                $userData['photo'] = $request->photo;
            }

            $teacher->update($userData);

            // Update Homeroom Class Assignment
            if ($request->has('class_id')) {
                $classId = $request->input('class_id');

                if ($classId && $classId !== 'null' && $classId !== '') {
                    $academicYear = $request->filled('academic_year') ? $request->academic_year : '2026-2027';

                    // Check if class already has a homeroom teacher (excluding current teacher)
                    $existing = TeacherClassAssignment::where('class_id', $classId)
                        ->where('teacher_id', '!=', $teacher->id)
                        ->with('teacher')
                        ->first();

                    if ($existing) {
                        return response()->json([
                            'message' => 'ថ្នាក់នេះមានគ្រូបន្ទុកថ្នាក់រួចហើយ (' . ($existing->teacher?->name ?? 'គ្រូផ្សេង') . ')'
                        ], 422);
                    }

                    // Clear any homeroom class previously assigned to THIS teacher
                    TeacherClassAssignment::where('teacher_id', $teacher->id)->delete();

                    TeacherClassAssignment::create([
                        'teacher_id' => $teacher->id,
                        'class_id' => $classId,
                        'academic_year' => $academicYear,
                    ]);
                } else {
                    // Remove homeroom assignment if cleared
                    TeacherClassAssignment::where('teacher_id', $teacher->id)->delete();
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Teacher updated successfully',
                'teacher' => $teacher->load(['teacherClassAssignments.schoolClass'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update teacher: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update teacher: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Delete teacher
    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $teacher = User::where('role_id', 2)->findOrFail($id);
            TeacherClassAssignment::where('teacher_id', $teacher->id)->delete();
            $teacher->delete();

            DB::commit();

            return response()->json([
                'message' => 'Teacher deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete teacher: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete teacher: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
