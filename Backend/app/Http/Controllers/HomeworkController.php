<?php

namespace App\Http\Controllers;

use App\Models\Homework;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class HomeworkController extends Controller
{
    // List homework assignments
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            $query = Homework::with(['schoolClass', 'subject', 'teacher']);
            $roleId = intval($user->role_id);

            if ($roleId === 3) {
                // Student: see homework for their assigned class
                $student = Student::where('user_id', $user->id)->first();
                if ($student && $student->class_id) {
                    $query->where('class_id', $student->class_id);
                }
            } elseif ($roleId === 2) {
                // Teacher: see homework posted by them
                $query->where('teacher_id', $user->id);
            }

            $homeworkList = $query->latest('id')->get();

            return response()->json([
                'homework' => $homeworkList
            ]);
        } catch (\Exception $e) {
            Log::error('Homework index error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve homework: ' . $e->getMessage(),
                'homework' => []
            ], 500);
        }
    }

    // Assign new homework (Teacher/Admin only)
    public function store(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            if (!in_array(intval($user->role_id), [1, 2])) {
                return response()->json([
                    'message' => 'Only Teachers and Admins can assign homework.'
                ], 403);
            }

            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'class_id' => 'required|exists:school_classes,id',
                'subject_id' => 'nullable|exists:subjects,id',
                'due_date' => 'required|date',
                'attachment' => 'nullable|file|mimes:pdf,doc,docx,png,jpg,jpeg|max:10240',
            ]);

            $attachmentPath = null;
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->storeAs('public/homework', $filename);
                $attachmentPath = 'storage/homework/' . $filename;
            }

            $homework = Homework::create([
                'title' => $request->title,
                'description' => $request->description,
                'class_id' => $request->class_id,
                'subject_id' => $request->subject_id,
                'teacher_id' => $user->id,
                'due_date' => $request->due_date,
                'attachment_path' => $attachmentPath,
            ]);

            return response()->json([
                'message' => 'Homework assigned successfully (កិច្ចការផ្ទះត្រូវបានបង្កើត)',
                'homework' => $homework->load(['schoolClass', 'subject', 'teacher'])
            ], 201);
        } catch (\Exception $e) {
            Log::error('Homework store error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to assign homework: ' . $e->getMessage()
            ], 500);
        }
    }

    // Delete homework
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            $homework = Homework::findOrFail($id);

            if (intval($user->role_id) !== 1 && $homework->teacher_id !== $user->id) {
                return response()->json([
                    'message' => 'Unauthorized to delete this homework.'
                ], 403);
            }

            $homework->delete();

            return response()->json([
                'message' => 'Homework deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Homework destroy error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete homework: ' . $e->getMessage()
            ], 500);
        }
    }
}
