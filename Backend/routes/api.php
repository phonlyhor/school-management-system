<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminClassController;
use App\Http\Controllers\AdminStudentController;
use App\Http\Controllers\AdminParentController;
use App\Http\Controllers\AdminHomeroomController;
use App\Http\Controllers\AdminSubjectController;
use App\Http\Controllers\AdminTeacherAssignmentController;
use App\Http\Controllers\AdminScheduleController;
use App\Http\Controllers\AdminBuildingController;
use App\Http\Controllers\AdminTeacherController;

use App\Http\Controllers\TeacherDashboardController;
use App\Http\Controllers\TeacherStudentController;
use App\Http\Controllers\TeacherAttendanceController;
use App\Http\Controllers\TeacherClassController;
use App\Http\Controllers\TeacherScheduleController;
use App\Http\Controllers\StudentScoreController;
use App\Http\Controllers\TeacherController;

use App\Http\Controllers\StudentDashboardController;
use App\Http\Controllers\StudentScheduleController;
use App\Http\Controllers\StudentReportController;
use App\Http\Controllers\ReportCardController;

use App\Http\Controllers\ParentDashboardController;

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceReportController;

use App\Http\Controllers\AcademicYearController;
use App\Http\Controllers\SemesterController;
use App\Http\Controllers\AssessmentController;

use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\HomeworkController;


use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;


/*
|--------------------------------------------------------------------------
| CloadinaryTest
|--------------------------------------------------------------------------
*/
Route::post('/upload-test', function (Request $request) {

    $file = $request->file('image');

    $uploadedFile = Cloudinary::upload(
        $file->getRealPath(),
        [
            'folder' => 'school-management'
        ]
    );

    return response()->json([
        'url' => $uploadedFile->getSecurePath()
    ]);
});
/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/


Route::post('/login', [
    AuthController::class,
    'login'
]);

Route::post('/register/student', [
    AuthController::class,
    'registerStudent'
]);

Route::get('/public/classes', [
    \App\Http\Controllers\AdminClassController::class,
    'index'
]);

Route::get('/public/settings', [
    \App\Http\Controllers\SystemSettingController::class,
    'getPublicSettings'
]);

Route::get('/student/verify/{code}', [
    \App\Http\Controllers\StudentVerificationController::class,
    'verify'
]);

Route::post('/public/forgot-password-request', function (\Illuminate\Http\Request $request) {
    $request->validate(['email' => 'required|email']);
    
    $user = \App\Models\User::where('email', $request->email)->first();
    if ($user) {
        $admin = \App\Models\User::where('role_id', 1)->orWhere('email', 'admin@school.com')->first();
        \App\Models\Notification::create([
            'title' => '🔑 សំណើស្នើសុំផ្លាស់ប្តូរពាក្យសម្ងាត់',
            'message' => 'គណនី ' . $user->name . ' (' . $user->email . ') បានស្នើសុំផ្លាស់ប្តូរពាក្យសម្ងាត់ថ្មី។',
            'type' => 'password_reset',
            'user_id' => $admin ? $admin->id : 1,
            'is_read' => false,
        ]);
    }
    
    return response()->json(['message' => 'Password reset notification sent to Admin successfully']);
});



/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/


Route::middleware('auth:sanctum')->group(function () {

    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [\App\Http\Controllers\NotificationController::class, 'destroy']);
    Route::delete('/notifications', [\App\Http\Controllers\NotificationController::class, 'clearAll']);


 // All logged-in users can view report
 Route::get('/student/report/{student_id}', [
        StudentReportController::class,
        'show'
    ]);

Route::get('/student/report-card/{student_id}', [
    ReportCardController::class,
    'show'
]);

Route::get('/teacher/my-class', [
    TeacherController::class,
    'myClass'
]);

    /*
    |--------------------------------------------------------------------------
    | Current User
    |--------------------------------------------------------------------------
    */

    Route::get('/me', [
        AuthController::class,
        'me'
    ]);

    Route::put('/profile', [
        AuthController::class,
        'updateProfile'
    ]);


    Route::post('/logout', [
        AuthController::class,
        'logout'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Public School Features: Leave Requests, Announcements, Homework
    |--------------------------------------------------------------------------
    */
    Route::get('/leave-requests', [LeaveRequestController::class, 'index']);
    Route::post('/leave-requests', [LeaveRequestController::class, 'store']);
    Route::put('/leave-requests/{id}/status', [LeaveRequestController::class, 'updateStatus']);

    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::post('/announcements', [AnnouncementController::class, 'store']);
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);

    Route::get('/homework', [HomeworkController::class, 'index']);
    Route::post('/homework', [HomeworkController::class, 'store']);
    Route::delete('/homework/{id}', [HomeworkController::class, 'destroy']);



    /*
    |--------------------------------------------------------------------------
    | Shared Read-Only Settings & Lists
    |--------------------------------------------------------------------------
    */
    Route::get('/academic-years',[AcademicYearController::class, 'index']);
    Route::get('/semesters',[SemesterController::class, 'index']);
    Route::get('/assessments',[AssessmentController::class, 'index']);
    Route::get('/classes', [AdminClassController::class, 'index']);
    Route::get('/subjects', [AdminSubjectController::class, 'index']);

    /*
    |--------------------------------------------------------------------------
    | ADMIN ONLY
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:1')->group(function () {


        Route::get('/admin/dashboard', [
            AdminDashboardController::class,
            'index'
        ]);
        Route::get('/admin/org-structure', [
            AdminDashboardController::class,
            'orgStructure'
        ]);
        Route::apiResource(
            '/admin/teachers',
            AdminTeacherController::class
        );
        Route::apiResource(
            '/admin/classes',
            AdminClassController::class
        );
           Route::apiResource(
        '/admin/students',
        AdminStudentController::class
    );
           Route::apiResource(
        '/admin/parents',
        AdminParentController::class
    );
          Route::apiResource(
        '/admin/subjects',
        AdminSubjectController::class
    );
        Route::apiResource(
        '/admin/teacher-assignments',
        AdminTeacherAssignmentController::class
    );
           Route::apiResource(
        '/admin/homerooms',
        AdminHomeroomController::class
    );
    Route::post('/admin/schedules/batch', [AdminScheduleController::class, 'batchStore']);
    Route::apiResource(
        '/admin/schedules',
        AdminScheduleController::class
    );
    Route::apiResource(
        '/admin/buildings',
        AdminBuildingController::class
    );
  // Academic Year
    Route::post('/academic-years',[
        AcademicYearController::class,
        'store'
    ]);
Route::get('/academic-years/{academicYear}',[
    AcademicYearController::class,
    'show'
]);
Route::put('/academic-years/{academicYear}',[
    AcademicYearController::class,
    'update'
]);
// Student Promotion & Year-End Rollover
Route::get('/admin/promotion/preview', [\App\Http\Controllers\AdminPromotionController::class, 'preview']);
Route::post('/admin/promotion/execute', [\App\Http\Controllers\AdminPromotionController::class, 'execute']);


    // Semester
    Route::post('/semesters',[
        SemesterController::class,
        'store'
    ]);
Route::get('/semesters/{semester}',[
    SemesterController::class,
    'show'
]);
Route::put('/semesters/{semester}',[
    SemesterController::class,
    'update'
]);
Route::delete('/semesters/{semester}',[
    SemesterController::class,
    'destroy'
]);


    // Assessment
    Route::post('/assessments',[
        AssessmentController::class,
        'store'
    ]);
    // Assessment Show
Route::get('/assessments/{assessment}',[
    AssessmentController::class,
    'show'
]);
// Assessment Update
Route::put('/assessments/{assessment}',[
    AssessmentController::class,
    'update'
]);
// Assessment Delete
Route::delete('/assessments/{assessment}',[
    AssessmentController::class,
    'destroy'
]);




        // User Management

        Route::get('/users', [
            UserController::class,
            'index'
        ])->middleware('permission:users.view');


        Route::post('/users', [
            UserController::class,
            'store'
        ])->middleware('permission:users.create');


        Route::get('/users/{user}', [
            UserController::class,
            'show'
        ])->middleware('permission:users.view');


        Route::put('/users/{user}', [
            UserController::class,
            'update'
        ])->middleware('permission:users.update');


        Route::delete('/users/{user}', [
            UserController::class,
            'destroy'
        ])->middleware('permission:users.delete');


    });





    /*
    |--------------------------------------------------------------------------
    | TEACHER ONLY
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:2')->group(function () {
     // View all student scores

    Route::get('/student-scores', [
        StudentScoreController::class,
        'index'
    ]);



    // Create student score

    Route::post('/student-scores', [
        StudentScoreController::class,
        'store'
    ]);



    // Update student score

    Route::put('/student-scores/{studentScore}', [
        StudentScoreController::class,
        'update'
    ]);



    // Delete student score

    Route::delete('/student-scores/{studentScore}', [
        StudentScoreController::class,
        'destroy'
    ]);

        Route::get('/teacher/dashboard', [
            TeacherDashboardController::class,
            'dashboard'
        ]);



        Route::get('/teacher/schedule', [
            TeacherScheduleController::class,
            'index'
        ]);

        Route::get('/teacher/homeroom-schedule', [
            TeacherScheduleController::class,
            'homeroomSchedule'
        ]);



        Route::get('/teacher/classes/{class_id}/students', [
            TeacherStudentController::class,
            'index'
        ]);

        Route::put('/teacher/students/{student_id}/position', [
            TeacherStudentController::class,
            'updatePosition'
        ]);



        Route::get('/teacher/classes/{class_id}', [
            TeacherClassController::class,
            'show'
        ]);

        Route::post('/teacher/classes/{class_id}/toggle-registration', [
            TeacherClassController::class,
            'toggleRegistration'
        ]);



        Route::post('/teacher/attendance/bulk', [
            AttendanceController::class,
            'bulkStore'
        ]);



        Route::get('/teacher/attendance/history', [
            AttendanceController::class,
            'history'
        ]);



        Route::put('/teacher/attendance/{id}', [
            AttendanceController::class,
            'update'
        ]);

    });






    /*
    |--------------------------------------------------------------------------
    | STUDENT ONLY
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:3')->group(function () {


        Route::get('/student/dashboard', [
            StudentDashboardController::class,
            'dashboard'
        ]);

        Route::get('/student/schedule', [
            StudentScheduleController::class,
            'index'
        ]);

        Route::get('/student/attendance', [
            StudentDashboardController::class,
            'attendance'
        ]);

    });






    /*
    |--------------------------------------------------------------------------
    | PARENT ONLY
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:4')->group(function () {


        Route::get('/parent/dashboard', [
            ParentDashboardController::class,
            'dashboard'
        ]);
        Route::get('/parent/schedule', [

        ParentDashboardController::class,

        'schedule'

    ]);
        Route::get('/parent/children', [
            ParentDashboardController::class,
            'children'
        ]);
        Route::get('/parent/attendance', [
            ParentDashboardController::class,
            'attendance'
        ]);

    });






    /*
    |--------------------------------------------------------------------------
    | Attendance
    |--------------------------------------------------------------------------
    */


    Route::apiResource('attendances', AttendanceController::class)
        ->only([
            'index',
            'store',
            'show'
        ]);

    Route::get('/report-card/{student_id}', [ReportCardController::class, 'show']);
    Route::get(
        '/attendance/report/student/{student_id}',
        [
            AttendanceReportController::class,
            'studentReport'
        ]
    );



    Route::get(
        '/attendance/report/student/{student_id}/subjects',
        [
            AttendanceReportController::class,
            'subjectReport'
        ]
    );

    Route::get(
        '/attendance/report/class/{class_id}',
        [
            AttendanceReportController::class,
            'classReport'
        ]
    );



    Route::get('/admin/system-settings', [
        \App\Http\Controllers\SystemSettingController::class,
        'index'
    ]);

    Route::post('/admin/system-settings', [
        \App\Http\Controllers\SystemSettingController::class,
        'update'
    ]);

    Route::post('/admin/system-settings/homeroom-registration', [
        \App\Http\Controllers\SystemSettingController::class,
        'updateHomeroomRegistrations'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Permission Test
    |--------------------------------------------------------------------------
    */


    Route::get('/test-permission', function(Request $request){

        return response()->json([

            'message'=>'You have permission!',

            'user'=>$request->user()->name

        ]);

    })->middleware('permission:users.delete');

});