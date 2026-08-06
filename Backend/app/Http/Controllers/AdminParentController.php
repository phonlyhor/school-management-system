<?php

namespace App\Http\Controllers;

use App\Models\StudentParent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminParentController extends Controller
{
    // View all parents with their linked children
    public function index()
    {
        $parentRecords = StudentParent::with(['user', 'student.user', 'student.schoolClass'])->get();

        // Group by user_id so each parent user is unique in the response
        $grouped = $parentRecords->groupBy('user_id')->map(function ($records) {
            $first = $records->first();
            $user = $first->user;
            $students = $records->map(function ($r) {
                return $r->student;
            })->filter()->values();

            return [
                'id' => $first->id,
                'user_id' => $user->id,
                'user' => $user,
                'phone' => $first->phone,
                'address' => $first->address,
                'student_ids' => $records->pluck('student_id')->toArray(),
                'students' => $students
            ];
        })->values();

        return response()->json([
            'parents' => $grouped
        ]);
    }

    // Create parent (support multiple student_ids)
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $firstName = $request->first_name ?? '';
            $lastName = $request->last_name ?? '';
            $computedName = trim($firstName . ' ' . $lastName);
            if (empty($computedName)) {
                $computedName = $request->name;
            }

            // 1. Create the User (Role 4 = Parent)
            $user = User::create([
                'name' => $computedName,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role_id' => 4,
                'phone' => $request->phone,
                'address' => $request->address,
                'province' => $request->province,
                'district' => $request->district,
                'commune' => $request->commune,
                'village' => $request->village,
            ]);

            // 2. Create StudentParent profile for each student_id
            foreach ($request->student_ids as $studentId) {
                StudentParent::create([
                    'user_id' => $user->id,
                    'student_id' => $studentId,
                    'phone' => $request->phone,
                    'address' => $request->address,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Parent enrolled successfully with linked children'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to enroll parent',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Show one parent
    public function show($id)
    {
        $parentRecord = StudentParent::with(['user', 'student.user', 'student.schoolClass'])->findOrFail($id);
        $allRecords = StudentParent::with(['student.user', 'student.schoolClass'])
            ->where('user_id', $parentRecord->user_id)
            ->get();

        return response()->json([
            'parent' => [
                'id' => $parentRecord->id,
                'user_id' => $parentRecord->user_id,
                'user' => $parentRecord->user,
                'phone' => $parentRecord->phone,
                'address' => $parentRecord->address,
                'student_ids' => $allRecords->pluck('student_id')->toArray(),
                'students' => $allRecords->pluck('student')->values()
            ]
        ]);
    }

    // Update parent (support updating multiple student_ids)
    public function update(Request $request, $id)
    {
        $parentRecord = StudentParent::findOrFail($id);
        $user = $parentRecord->user;

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'student_ids' => 'sometimes|array',
            'student_ids.*' => 'exists:students,id',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // 1. Update User info
            $fn = $request->has('first_name') ? $request->first_name : $user->first_name;
            $ln = $request->has('last_name') ? $request->last_name : $user->last_name;
            $computedName = trim(($fn ?? '') . ' ' . ($ln ?? ''));
            if (empty($computedName)) {
                $computedName = $request->name ?? $user->name;
            }

            $userData = [
                'name' => $computedName,
                'first_name' => $fn,
                'last_name' => $ln,
            ];
            if ($request->has('email')) $userData['email'] = $request->email;
            if ($request->has('phone')) $userData['phone'] = $request->phone;
            if ($request->has('address')) $userData['address'] = $request->address;
            if ($request->has('province')) $userData['province'] = $request->province;
            if ($request->has('district')) $userData['district'] = $request->district;
            if ($request->has('commune')) $userData['commune'] = $request->commune;
            if ($request->has('village')) $userData['village'] = $request->village;
            if ($request->filled('password')) {
                $userData['password'] = Hash::make($request->password);
            }
            $user->update($userData);

            // 2. Sync student_ids if provided
            if ($request->has('student_ids')) {
                // Delete old links for this parent user
                StudentParent::where('user_id', $user->id)->delete();

                // Re-create new links
                foreach ($request->student_ids as $studentId) {
                    StudentParent::create([
                        'user_id' => $user->id,
                        'student_id' => $studentId,
                        'phone' => $request->phone ?? $parentRecord->phone,
                        'address' => $request->address ?? $parentRecord->address,
                    ]);
                }
            } else {
                // Update phone/address across all records for this parent user
                StudentParent::where('user_id', $user->id)->update([
                    'phone' => $request->phone ?? $parentRecord->phone,
                    'address' => $request->address ?? $parentRecord->address,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Parent updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update parent',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Delete parent
    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $parentRecord = StudentParent::findOrFail($id);
            $userId = $parentRecord->user_id;

            // Delete all links for this parent user
            StudentParent::where('user_id', $userId)->delete();

            // Delete user account
            User::where('id', $userId)->delete();

            DB::commit();

            return response()->json([
                'message' => 'Parent deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete parent',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
