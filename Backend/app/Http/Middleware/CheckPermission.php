<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(
        Request $request,
        Closure $next,
        string $permission
    ): Response {

        // Get current logged-in user
        $user = $request->user();

        // User is not logged in
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated',
            ], 401);
        }

        // Check user permission
        if (!$user->hasPermission($permission)) {
            return response()->json([
                'message' => 'You do not have permission.',
                'required_permission' => $permission,
            ], 403);
        }

        // Permission allowed
        return $next($request);
    }
}