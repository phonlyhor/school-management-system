<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Teacher;
use App\Models\TeacherClassAssignment;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AdminTeacherController extends Controller
{
    // Helper to format user with teacher profile data for frontend backward compatibility
    private function formatTeacherResponse(User $user)
    {
        $userArray = $user->toArray();
        $teacher = $user->teacher;

        if ($teacher) {
            $userArray['teacher_profile_id'] = $teacher->id;
            $userArray['civil_servant_id'] = $teacher->civil_servant_id;
            $userArray['position'] = $teacher->position;
            $userArray['civil_service_framework'] = $teacher->civil_service_framework;
            $userArray['education_level'] = $teacher->education_level;
            $userArray['qualification'] = $teacher->qualification;
            $userArray['specialization_1'] = $teacher->specialization_1;
            $userArray['specialization_2'] = $teacher->specialization_2;
            $userArray['specialization_3'] = $teacher->specialization_3;
            $userArray['teaching_level'] = $teacher->teaching_level;
            $userArray['activity_status'] = $teacher->activity_status;
            $userArray['civil_service_date'] = $teacher->civil_service_date;
            $userArray['service_duration'] = $teacher->service_duration;
            $userArray['awards'] = $teacher->awards;
            $userArray['honors'] = $teacher->honors;
            $userArray['grades_taught'] = $teacher->grades_taught;
            $userArray['technology_usage'] = $teacher->technology_usage;
            $userArray['class_id'] = $teacher->class_id;
        }

        return $userArray;
    }

    // View all teachers with homeroom class assignments & teacher profiles
    public function index()
    {
        $teachers = User::where('role_id', 2)
            ->with(['teacher', 'teacherClassAssignments.schoolClass'])
            ->get()
            ->map(function ($user) {
                return $this->formatTeacherResponse($user);
            });

        return response()->json([
            'teachers' => $teachers
        ]);
    }

    // Create teacher
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'gender' => 'required|string',
            'class_id' => 'nullable',
            'academic_year' => 'nullable|string',
            'photo' => 'nullable',
            'date_of_birth' => 'required|date',
            'address' => 'required|string',
            'phone' => 'required|string',
            'position' => 'required|string',
            'civil_service_framework' => 'required|string',
            'education_level' => 'required|string',
            'qualification' => 'required|string',
            'specialization_1' => 'required|string',
            'specialization_2' => 'nullable|string',
            'specialization_3' => 'nullable|string',
            'teaching_level' => 'required|string',
            'activity_status' => 'required|string',
            'civil_service_date' => 'required|date',
            'service_duration' => 'nullable|string',
            'awards' => 'nullable|string',
            'honors' => 'nullable|string',
            'grades_taught' => 'required|string',
            'technology_usage' => 'required|string',
            'civil_servant_id' => 'required|string|unique:teachers,civil_servant_id',
        ], [
            'civil_servant_id.unique' => 'អត្តលេខមន្ត្រីរាជការនេះមានក្នុងប្រព័ន្ធរួចហើយ! (Civil Servant ID already exists)',
            'civil_servant_id.required' => 'សូមបញ្ចូលអត្តលេខមន្ត្រីរាជការ (Civil Servant ID is required)',
            'email.unique' => 'អាសយដ្ឋានអ៊ីមែលនេះមានក្នុងប្រព័ន្ធរួចហើយ! (Email already exists)',
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
                    Log::warning("Cloudinary Teacher Upload Fallback: " . $e->getMessage());
                    $file = $request->file('photo');
                    $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    $file->storeAs('public/teachers', $filename);
                    $photoPath = 'storage/teachers/' . $filename;
                }
            } elseif ($request->filled('photo') && is_string($request->photo)) {
                $photoPath = $request->photo;
            }

            $spec1 = $request->specialization_1 ?? $request->specialization;

            $firstName = $request->first_name ?? '';
            $lastName = $request->last_name ?? '';
            $computedName = trim($firstName . ' ' . $lastName);
            if (empty($computedName)) {
                $computedName = $request->name;
            }

            // 1. Create Base User (role_id = 2)
            $user = User::create([
                'name' => $computedName,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $request->email,
                'gender' => $request->filled('gender') ? $request->gender : 'male',
                'password' => Hash::make($request->password),
                'role_id' => 2,
                'photo' => $photoPath,
                'date_of_birth' => $request->filled('date_of_birth') ? $request->date_of_birth : null,
                'specialization' => $spec1,
                'address' => $request->address,
                'province' => $request->province,
                'district' => $request->district,
                'commune' => $request->commune,
                'village' => $request->village,
                'phone' => $request->phone,
            ]);

            // 2. Create Dedicated Teacher Profile
            $classId = $request->filled('class_id') ? $request->class_id : null;
            $teacher = Teacher::create([
                'user_id' => $user->id,
                'class_id' => ($classId && $classId !== 'null') ? $classId : null,
                'civil_servant_id' => $request->civil_servant_id,
                'position' => $request->position,
                'civil_service_framework' => $request->civil_service_framework,
                'education_level' => $request->education_level,
                'qualification' => $request->qualification,
                'specialization_1' => $spec1,
                'specialization_2' => $request->specialization_2,
                'specialization_3' => $request->specialization_3,
                'teaching_level' => $request->teaching_level,
                'activity_status' => $request->filled('activity_status') ? $request->activity_status : 'កំពុងបម្រើការ',
                'civil_service_date' => $request->filled('civil_service_date') ? $request->civil_service_date : null,
                'service_duration' => $request->service_duration,
                'awards' => $request->awards,
                'honors' => $request->honors,
                'grades_taught' => $request->grades_taught,
                'technology_usage' => $request->filled('technology_usage') ? $request->technology_usage : 'មិនប្រើប្រាស់',
            ]);

            // 3. Assign Homeroom Class if selected
            if ($classId && $classId !== 'null' && $classId !== '') {
                $academicYear = $request->filled('academic_year') ? $request->academic_year : '2026-2027';

                $existing = TeacherClassAssignment::where('class_id', $classId)->with('teacher')->first();
                if ($existing) {
                    return response()->json([
                        'message' => 'ថ្នាក់នេះមានគ្រូបន្ទុកថ្នាក់រួចហើយ (' . ($existing->teacher?->name ?? 'គ្រូផ្សេង') . ')'
                    ], 422);
                }

                TeacherClassAssignment::where('teacher_id', $user->id)->delete();

                TeacherClassAssignment::create([
                    'teacher_id' => $user->id,
                    'class_id' => $classId,
                    'academic_year' => $academicYear,
                ]);
            }

            DB::commit();

            $freshUser = User::where('id', $user->id)->with(['teacher', 'teacherClassAssignments.schoolClass'])->first();

            return response()->json([
                'message' => 'Teacher created successfully',
                'teacher' => $this->formatTeacherResponse($freshUser)
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
        $user = User::where('role_id', 2)
            ->with(['teacher', 'teacherClassAssignments.schoolClass'])
            ->findOrFail($id);

        return response()->json(['teacher' => $this->formatTeacherResponse($user)]);
    }

    // Update teacher
    public function update(Request $request, $id)
    {
        $user = User::where('role_id', 2)->findOrFail($id);
        $teacher = Teacher::firstOrCreate(['user_id' => $user->id]);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'class_id' => 'nullable',
            'academic_year' => 'nullable|string',
            'photo' => 'nullable',
            'date_of_birth' => 'sometimes|required|date',
            'address' => 'sometimes|required|string',
            'phone' => 'sometimes|required|string',
            'position' => 'sometimes|required|string',
            'civil_service_framework' => 'sometimes|required|string',
            'education_level' => 'sometimes|required|string',
            'qualification' => 'sometimes|required|string',
            'specialization_1' => 'sometimes|required|string',
            'specialization_2' => 'nullable|string',
            'specialization_3' => 'nullable|string',
            'teaching_level' => 'sometimes|required|string',
            'activity_status' => 'sometimes|required|string',
            'civil_service_date' => 'sometimes|required|date',
            'service_duration' => 'nullable|string',
            'awards' => 'nullable|string',
            'honors' => 'nullable|string',
            'grades_taught' => 'sometimes|required|string',
            'technology_usage' => 'sometimes|required|string',
            'civil_servant_id' => 'sometimes|required|string|unique:teachers,civil_servant_id,' . $teacher->id,
        ], [
            'civil_servant_id.unique' => 'អត្តលេខមន្ត្រីរាជការនេះមានក្នុងប្រព័ន្ធរួចហើយ! (Civil Servant ID already exists)',
            'civil_servant_id.required' => 'សូមបញ្ចូលអត្តលេខមន្ត្រីរាជការ (Civil Servant ID is required)',
            'email.unique' => 'អាសយដ្ឋានអ៊ីមែលនេះមានក្នុងប្រព័ន្ធរួចហើយ! (Email already exists)',
        ]);

        try {
            DB::beginTransaction();

            $fn = $request->has('first_name') ? $request->first_name : $user->first_name;
            $ln = $request->has('last_name') ? $request->last_name : $user->last_name;
            $computedName = trim(($fn ?? '') . ' ' . ($ln ?? ''));
            if (empty($computedName)) {
                $computedName = $request->name ?? $user->name;
            }

            // Update User Info
            $userData = [
                'name' => $computedName,
                'first_name' => $fn,
                'last_name' => $ln,
            ];

            if ($request->has('email')) $userData['email'] = $request->email;
            if ($request->has('gender')) $userData['gender'] = $request->gender;
            if ($request->has('date_of_birth')) $userData['date_of_birth'] = $request->date_of_birth;
            if ($request->has('address')) $userData['address'] = $request->address;
            if ($request->has('province')) $userData['province'] = $request->province;
            if ($request->has('district')) $userData['district'] = $request->district;
            if ($request->has('commune')) $userData['commune'] = $request->commune;
            if ($request->has('village')) $userData['village'] = $request->village;
            if ($request->has('phone')) $userData['phone'] = $request->phone;
            if ($request->filled('password')) $userData['password'] = Hash::make($request->password);

            if ($request->hasFile('photo')) {
                try {
                    $uploaded = \CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary::upload(
                        $request->file('photo')->getRealPath(),
                        ['folder' => 'school-management']
                    );
                    $userData['photo'] = $uploaded->getSecurePath();
                } catch (\Throwable $e) {
                    Log::warning("Cloudinary Teacher Upload Fallback: " . $e->getMessage());
                    $file = $request->file('photo');
                    $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    $file->storeAs('public/teachers', $filename);
                    $userData['photo'] = 'storage/teachers/' . $filename;
                }
            } elseif ($request->filled('photo') && is_string($request->photo)) {
                $userData['photo'] = $request->photo;
            }

            $user->update($userData);

            // Update Teacher Profile Info
            $spec1 = $request->specialization_1 ?? $request->specialization ?? $teacher->specialization_1;
            $classId = $request->filled('class_id') ? $request->class_id : null;

            $teacher->update([
                'class_id' => ($classId && $classId !== 'null') ? $classId : null,
                'civil_servant_id' => $request->has('civil_servant_id') ? $request->civil_servant_id : $teacher->civil_servant_id,
                'position' => $request->has('position') ? $request->position : $teacher->position,
                'civil_service_framework' => $request->has('civil_service_framework') ? $request->civil_service_framework : $teacher->civil_service_framework,
                'education_level' => $request->has('education_level') ? $request->education_level : $teacher->education_level,
                'qualification' => $request->has('qualification') ? $request->qualification : $teacher->qualification,
                'specialization_1' => $spec1,
                'specialization_2' => $request->has('specialization_2') ? $request->specialization_2 : $teacher->specialization_2,
                'specialization_3' => $request->has('specialization_3') ? $request->specialization_3 : $teacher->specialization_3,
                'teaching_level' => $request->has('teaching_level') ? $request->teaching_level : $teacher->teaching_level,
                'activity_status' => $request->has('activity_status') ? $request->activity_status : $teacher->activity_status,
                'civil_service_date' => $request->has('civil_service_date') ? $request->civil_service_date : $teacher->civil_service_date,
                'service_duration' => $request->has('service_duration') ? $request->service_duration : $teacher->service_duration,
                'awards' => $request->has('awards') ? $request->awards : $teacher->awards,
                'honors' => $request->has('honors') ? $request->honors : $teacher->honors,
                'grades_taught' => $request->has('grades_taught') ? $request->grades_taught : $teacher->grades_taught,
                'technology_usage' => $request->has('technology_usage') ? $request->technology_usage : $teacher->technology_usage,
            ]);

            // Handle Class Assignment
            if ($request->has('class_id')) {
                if ($classId && $classId !== 'null' && $classId !== '') {
                    $academicYear = $request->filled('academic_year') ? $request->academic_year : '2026-2027';

                    $existing = TeacherClassAssignment::where('class_id', $classId)
                        ->where('teacher_id', '!=', $user->id)
                        ->with('teacher')
                        ->first();
                    if ($existing) {
                        return response()->json([
                            'message' => 'ថ្នាក់នេះមានគ្រូបន្ទុកថ្នាក់រួចហើយ (' . ($existing->teacher?->name ?? 'គ្រូផ្សេង') . ')'
                        ], 422);
                    }

                    TeacherClassAssignment::where('teacher_id', $user->id)->delete();

                    TeacherClassAssignment::create([
                        'teacher_id' => $user->id,
                        'class_id' => $classId,
                        'academic_year' => $academicYear,
                    ]);
                } else {
                    TeacherClassAssignment::where('teacher_id', $user->id)->delete();
                }
            }

            DB::commit();

            $freshUser = User::where('id', $user->id)->with(['teacher', 'teacherClassAssignments.schoolClass'])->first();

            return response()->json([
                'message' => 'Teacher updated successfully',
                'teacher' => $this->formatTeacherResponse($freshUser)
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
        $user = User::where('role_id', 2)->findOrFail($id);

        TeacherClassAssignment::where('teacher_id', $user->id)->delete();
        Teacher::where('user_id', $user->id)->delete();
        $user->delete();

        return response()->json(['message' => 'Teacher deleted successfully']);
    }

    // Quick assign teacher to class
    public function assignClass(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'class_id' => 'required|exists:school_classes,id',
            'academic_year' => 'nullable|string',
        ]);

        $teacherUser = User::where('role_id', 2)->findOrFail($request->teacher_id);
        $academicYear = $request->academic_year ?? '2026-2027';

        $existing = TeacherClassAssignment::where('class_id', $request->class_id)
            ->where('teacher_id', '!=', $request->teacher_id)
            ->with('teacher')
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'ថ្នាក់នេះមានគ្រូបន្ទុកថ្នាក់រួចហើយ (' . ($existing->teacher?->name ?? 'គ្រូផ្សេង') . ')'
            ], 422);
        }

        TeacherClassAssignment::where('teacher_id', $request->teacher_id)->delete();

        $assignment = TeacherClassAssignment::create([
            'teacher_id' => $request->teacher_id,
            'class_id' => $request->class_id,
            'academic_year' => $academicYear,
        ]);

        // Also sync teacher profile class_id
        Teacher::where('user_id', $request->teacher_id)->update(['class_id' => $request->class_id]);

        return response()->json([
            'message' => 'ចាត់តាំងគ្រូបន្ទុកថ្នាក់ដោយជោគជ័យ!',
            'assignment' => $assignment->load(['teacher', 'schoolClass'])
        ]);
    }
}
