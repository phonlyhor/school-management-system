<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // View all users
    public function index()
    {
        $users = User::with(['role', 'student.schoolClass', 'teacherClassAssignments.schoolClass'])->get();

        return response()->json([
            'users' => $users,
        ]);
    }

    // Create user
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role_id' => 'required|exists:roles,id',
            'photo' => 'nullable',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->storeAs('public/teachers', $filename);
            $photoPath = 'storage/teachers/' . $filename;
        } elseif ($request->filled('photo') && is_string($request->photo)) {
            $photoPath = $request->photo;
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id,
            'photo' => $photoPath,
        ]);

        $user->load(['role', 'teacherClassAssignments.schoolClass']);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user,
        ], 201);
    }

    // View one user
    public function show(User $user)
    {
        $user->load(['role', 'teacherClassAssignments.schoolClass']);

        return response()->json([
            'user' => $user,
        ]);
    }

    // Update user
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'role_id' => 'sometimes|exists:roles,id',
            'photo' => 'nullable',
        ]);

        $userData = [];
        if ($request->has('name')) $userData['name'] = $request->name;
        if ($request->has('email')) $userData['email'] = $request->email;
        if ($request->has('role_id')) $userData['role_id'] = $request->role_id;

        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->storeAs('public/teachers', $filename);
            $userData['photo'] = 'storage/teachers/' . $filename;
        } elseif ($request->has('photo') && is_string($request->photo) && !empty($request->photo)) {
            $userData['photo'] = $request->photo;
        }

        $user->update($userData);

        $user->load(['role', 'teacherClassAssignments.schoolClass']);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user,
        ]);
    }

    // Delete user
    public function destroy(User $user)
    {
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }
}