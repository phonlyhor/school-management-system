<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // List notifications for logged in user (Admin sees user_id + null global notifications)
    public function index(Request $request)
    {
        $user = $request->user()->load('role');
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $isAdmin = intval($user->role_id) === 1 || ($user->role && strtolower($user->role->name) === 'admin');

        if ($isAdmin) {
            $notifications = Notification::where('user_id', $user->id)
                ->orWhereNull('user_id')
                ->latest()
                ->take(30)
                ->get();

            $unreadCount = Notification::where(function($query) use ($user) {
                    $query->where('user_id', $user->id)->orWhereNull('user_id');
                })
                ->where('is_read', false)
                ->count();
        } else {
            $notifications = Notification::where('user_id', $user->id)
                ->latest()
                ->take(30)
                ->get();

            $unreadCount = Notification::where('user_id', $user->id)
                ->where('is_read', false)
                ->count();
        }

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    // Mark single notification as read
    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();
        $notification = Notification::findOrFail($id);
        $notification->update(['is_read' => true]);

        return response()->json(['message' => 'Notification marked as read']);
    }

    // Mark all notifications as read
    public function markAllAsRead(Request $request)
    {
        $user = $request->user()->load('role');
        $isAdmin = intval($user->role_id) === 1 || ($user->role && strtolower($user->role->name) === 'admin');

        if ($isAdmin) {
            Notification::where(function($query) use ($user) {
                    $query->where('user_id', $user->id)->orWhereNull('user_id');
                })
                ->where('is_read', false)
                ->update(['is_read' => true]);
        } else {
            Notification::where('user_id', $user->id)
                ->where('is_read', false)
                ->update(['is_read' => true]);
        }

        return response()->json(['message' => 'All notifications marked as read']);
    }

    // Delete single notification
    public function destroy(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);
        $notification->delete();

        return response()->json(['message' => 'Notification deleted successfully']);
    }

    // Delete all notifications for logged in user
    public function clearAll(Request $request)
    {
        $user = $request->user()->load('role');
        $isAdmin = intval($user->role_id) === 1 || ($user->role && strtolower($user->role->name) === 'admin');

        if ($isAdmin) {
            Notification::where(function($query) use ($user) {
                $query->where('user_id', $user->id)->orWhereNull('user_id');
            })->delete();
        } else {
            Notification::where('user_id', $user->id)->delete();
        }

        return response()->json(['message' => 'All notifications cleared successfully']);
    }
}
