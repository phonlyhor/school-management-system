<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;


class RoleMiddleware
{

    public function handle(
        Request $request,
        Closure $next,
        ...$roles
    )
    {

        $user = $request->user();


        if(!$user){

            return response()->json([
                'message'=>'Unauthenticated'
            ],401);

        }



        if(!in_array(
            $user->role_id,
            $roles
        )){


            return response()->json([
                'message'=>'You do not have permission'
            ],403);

        }



        return $next($request);

    }

}