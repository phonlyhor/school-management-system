<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AnnouncementController extends Controller
{
    // List announcements for active logged-in user
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            $roleKey = match (intval($user->role_id)) {
                1 => 'admin',
                2 => 'teacher',
                3 => 'student',
                4 => 'parent',
                default => 'all',
            };

            $announcements = Announcement::with('author')
                ->where(function ($q) use ($roleKey) {
                    $q->where('target_role', 'all')
                      ->orWhere('target_role', $roleKey);
                })
                ->latest('id')
                ->get();

            return response()->json([
                'announcements' => $announcements
            ]);
        } catch (\Exception $e) {
            Log::error('Announcement index error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve announcements: ' . $e->getMessage(),
                'announcements' => []
            ], 500);
        }
    }

    // Create announcement (Admin only)
    public function store(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            if (intval($user->role_id) !== 1) {
                return response()->json([
                    'message' => 'Only School Administrators can post announcements.'
                ], 403);
            }

            $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'category' => 'nullable|string',
                'target_role' => 'nullable|string',
            ]);

            $announcement = Announcement::create([
                'title' => $request->title,
                'content' => $request->content,
                'category' => $request->category ?: 'General',
                'target_role' => $request->target_role ?: 'all',
                'author_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Announcement posted successfully (សេចក្តីជូនដំណឹងត្រូវបានបង្កើត)',
                'announcement' => $announcement->load('author')
            ], 201);
        } catch (\Exception $e) {
            Log::error('Announcement store error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to post announcement: ' . $e->getMessage()
            ], 500);
        }
    }

    // Delete announcement
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            if (intval($user->role_id) !== 1) {
                return response()->json([
                    'message' => 'Only School Administrators can delete announcements.'
                ], 403);
            }

            $announcement = Announcement::findOrFail($id);
            $announcement->delete();

            return response()->json([
                'message' => 'Announcement deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Announcement destroy error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete announcement: ' . $e->getMessage()
            ], 500);
        }
    }
}
