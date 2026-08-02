<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use App\Models\Student;
use App\Models\TeacherClassAssignment;
use App\Models\TeacherSubjectAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LeaveRequestController extends Controller
{
    // List leave requests (Strictly filtered by class taught by teacher)
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            $query = LeaveRequest::with(['student.user', 'student.schoolClass', 'reviewer']);
            $roleId = intval($user->role_id);

            $teacherClassIds = [];

            if ($roleId === 2) {
                // Teacher: Only see leave requests for classes they teach (Homeroom or Subject teacher)
                $homeroomClassIds = TeacherClassAssignment::where('teacher_id', $user->id)->pluck('class_id')->toArray();
                $subjectClassIds = TeacherSubjectAssignment::where('teacher_id', $user->id)->pluck('class_id')->toArray();
                $teacherClassIds = array_unique(array_filter(array_map('intval', array_merge($homeroomClassIds, $subjectClassIds))));

                if (empty($teacherClassIds)) {
                    // Teacher does not teach any classes -> sees no student leave requests
                    return response()->json(['leave_requests' => []]);
                }

                $query->whereHas('student', function ($q) use ($teacherClassIds) {
                    $q->whereIn('class_id', $teacherClassIds);
                });
            } elseif ($roleId === 3) {
                // Student: only see own requests
                $student = Student::where('user_id', $user->id)->first();
                if ($student) {
                    $query->where('student_id', $student->id);
                } else {
                    return response()->json(['leave_requests' => []]);
                }
            } elseif ($roleId === 4) {
                // Parent: see requests for their linked student
                $parentProfile = $user->studentParent;
                if ($parentProfile && $parentProfile->student_id) {
                    $query->where('student_id', $parentProfile->student_id);
                } else {
                    return response()->json(['leave_requests' => []]);
                }
            }

            $requests = $query->latest('id')->get()->map(function ($item) use ($roleId, $teacherClassIds) {
                $itemArray = $item->toArray();
                $studentClassId = intval($item->student?->class_id);
                // Teacher can approve if and only if they teach this student's class
                $itemArray['can_approve'] = ($roleId === 2) && in_array($studentClassId, $teacherClassIds);
                return $itemArray;
            });

            $leaveSummary = null;
            if ($roleId === 3 || $roleId === 4) {
                $targetStudent = null;
                if ($roleId === 3) {
                    $targetStudent = Student::where('user_id', $user->id)->first();
                } else {
                    $parentProfile = $user->studentParent;
                    if ($parentProfile && $parentProfile->student_id) {
                        $targetStudent = Student::find($parentProfile->student_id);
                    }
                }

                if ($targetStudent) {
                    $maxDays = intval($targetStudent->max_leave_days ?? 10);
                    $approvedAndPending = LeaveRequest::where('student_id', $targetStudent->id)
                        ->whereIn('status', ['approved', 'pending'])
                        ->get();

                    $usedDays = 0;
                    foreach ($approvedAndPending as $lr) {
                        $s = \Carbon\Carbon::parse($lr->start_date);
                        $e = \Carbon\Carbon::parse($lr->end_date);
                        $usedDays += ($s->diffInDays($e) + 1);
                    }

                    $remainingDays = max($maxDays - $usedDays, 0);

                    $leaveSummary = [
                        'max_leave_days' => $maxDays,
                        'used_leave_days' => $usedDays,
                        'remaining_leave_days' => $remainingDays,
                    ];
                }
            }

            return response()->json([
                'leave_requests' => $requests,
                'leave_summary' => $leaveSummary,
            ]);
        } catch (\Exception $e) {
            Log::error('LeaveRequest index error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve leave requests: ' . $e->getMessage(),
                'leave_requests' => []
            ], 500);
        }
    }

    // Submit leave request (ONLY Students can submit)
    public function store(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            $roleId = intval($user->role_id);

            // ONLY Students (role_id = 3) can submit leave requests! Admin (1), Teachers (2), Parents (4) CANNOT submit!
            if ($roleId !== 3) {
                return response()->json([
                    'message' => 'មានតែសិស្សប៉ុណ្ណោះដែលអាចបង្កើតពាក្យសុំច្បាប់បាន (Only Students can submit leave requests).'
                ], 403);
            }

            $request->validate([
                'reason' => 'required|string|max:255',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'student_id' => 'nullable|exists:students,id',
            ]);

            $student = Student::where('user_id', $user->id)->first();
            if (!$student) {
                return response()->json([
                    'message' => 'Student profile not found for this user account.'
                ], 422);
            }

            $studentId = $student->id;

            $maxAllowedDays = intval($student->max_leave_days ?? 10);

            // Calculate requested duration in days
            $startDate = \Carbon\Carbon::parse($request->start_date);
            $endDate = \Carbon\Carbon::parse($request->end_date);
            $newRequestedDays = $startDate->diffInDays($endDate) + 1;

            // Calculate total approved and pending leave days for this student
            $existingApprovedRequests = LeaveRequest::where('student_id', $studentId)
                ->whereIn('status', ['approved', 'pending'])
                ->get();

            $usedDays = 0;
            foreach ($existingApprovedRequests as $req) {
                $s = \Carbon\Carbon::parse($req->start_date);
                $e = \Carbon\Carbon::parse($req->end_date);
                $usedDays += ($s->diffInDays($e) + 1);
            }

            if (($usedDays + $newRequestedDays) > $maxAllowedDays) {
                $remaining = max($maxAllowedDays - $usedDays, 0);
                return response()->json([
                    'message' => "ការសុំច្បាប់លើសពីចំនួនថ្ងៃដែលបានកំណត់! (សិស្សនេះត្រូវបានកំណត់ឱ្យសុំច្បាប់សរុប {$maxAllowedDays} ថ្ងៃ, ប្រើប្រាស់អស់ {$usedDays} ថ្ងៃ, នៅសល់ {$remaining} ថ្ងៃ, តែអ្នកសុំ {$newRequestedDays} ថ្ងៃ)."
                ], 422);
            }

            $leaveRequest = LeaveRequest::create([
                'student_id' => $studentId,
                'reason' => $request->reason,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'status' => 'pending',
            ]);

            // Notify Admins and Class Teachers about the new Leave Request
            try {
                $studentName = $student->user?->name ?? 'សិស្ស (Student)';
                $className = $student->schoolClass?->name ?? 'N/A';

                // 1. Notify all Admins (role_id = 1)
                $adminUsers = \App\Models\User::where('role_id', 1)->get();
                foreach ($adminUsers as $admin) {
                    \App\Models\Notification::create([
                        'user_id' => $admin->id,
                        'title' => '📝 ពាក្យសុំច្បាប់ថ្មីពីសិស្ស (New Leave Request)',
                        'message' => "សិស្ស {$studentName} (ថ្នាក់ {$className}) បានផ្ញើពាក្យសុំច្បាប់ ពីថ្ងៃ {$request->start_date} ដល់ {$request->end_date} (មូលហេតុ: {$request->reason})។",
                        'type' => 'leave_request',
                        'data' => [
                            'leave_request_id' => $leaveRequest->id,
                            'student_id' => $student->id,
                            'student_name' => $studentName,
                            'class_name' => $className,
                        ],
                    ]);
                }

                // 2. Notify ONLY teachers assigned to this student's class (Homeroom or Subject teachers)
                if ($student->class_id) {
                    $homeroomTeacherUserIds = TeacherClassAssignment::where('class_id', $student->class_id)->pluck('teacher_id')->toArray();
                    $subjectTeacherUserIds = TeacherSubjectAssignment::where('class_id', $student->class_id)->pluck('teacher_id')->toArray();
                    $assignedTeacherUserIds = array_unique(array_filter(array_map('intval', array_merge($homeroomTeacherUserIds, $subjectTeacherUserIds))));

                    if (!empty($assignedTeacherUserIds)) {
                        $targetTeachers = \App\Models\User::whereIn('id', $assignedTeacherUserIds)->get();
                        foreach ($targetTeachers as $teacher) {
                            \App\Models\Notification::create([
                                'user_id' => $teacher->id,
                                'title' => '🔔 សិស្សក្នុងថ្នាក់សុំច្បាប់ (Student Leave Request)',
                                'message' => "សិស្ស {$studentName} (ថ្នាក់ {$className}) បានផ្ញើពាក្យសុំច្បាប់ ពីថ្ងៃ {$request->start_date} ដល់ {$request->end_date} (មូលហេតុ: {$request->reason})។ សូមពិនិត្យមើល និង សម្រេច (Approve/Reject)។",
                                'type' => 'leave_request',
                                'data' => [
                                    'leave_request_id' => $leaveRequest->id,
                                    'student_id' => $student->id,
                                    'student_name' => $studentName,
                                    'class_name' => $className,
                                ],
                            ]);
                        }
                    }
                }
            } catch (\Exception $notifEx) {
                Log::warning('Failed to generate notifications for leave request: ' . $notifEx->getMessage());
            }

            return response()->json([
                'message' => 'Leave request submitted successfully (ពាក្យសុំច្បាប់ត្រូវបានបញ្ជូន)',
                'leave_request' => $leaveRequest->load(['student.user', 'student.schoolClass'])
            ], 201);
        } catch (\Exception $e) {
            Log::error('LeaveRequest store error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to submit leave request: ' . $e->getMessage()
            ], 500);
        }
    }

    // Update status (Approve / Reject) - ONLY Teachers who teach the student's class can approve/reject!
    public function updateStatus(Request $request, $id)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            $roleId = intval($user->role_id);

            // Admin is Read-Only for approvals, Teachers (role_id = 2) who teach the student's class can approve/reject
            if ($roleId !== 2) {
                return response()->json([
                    'message' => 'មានតែលោកគ្រូ/អ្នកគ្រូដែលបង្រៀនថ្នាក់នេះទេដែលអាចអនុញ្ញាត ឬ បដិសេធពាក្យសុំច្បាប់បាន (Only teachers of this class can approve/reject).'
                ], 403);
            }

            $leaveRequest = LeaveRequest::with('student')->findOrFail($id);
            $studentClassId = intval($leaveRequest->student?->class_id);

            // Check if logged in teacher teaches this student's class (Homeroom or Subject teacher)
            $homeroomClassIds = TeacherClassAssignment::where('teacher_id', $user->id)->pluck('class_id')->toArray();
            $subjectClassIds = TeacherSubjectAssignment::where('teacher_id', $user->id)->pluck('class_id')->toArray();
            $teacherClassIds = array_unique(array_filter(array_map('intval', array_merge($homeroomClassIds, $subjectClassIds))));

            if (!in_array($studentClassId, $teacherClassIds)) {
                return response()->json([
                    'message' => 'អ្នកមិនបានបង្រៀនថ្នាក់នៃសិស្សនេះទេ (You do not teach this student\'s class).'
                ], 403);
            }

            $request->validate([
                'status' => 'required|in:approved,rejected',
                'comment' => 'nullable|string',
            ]);

            $leaveRequest->update([
                'status' => $request->status,
                'comment' => $request->comment,
                'reviewed_by' => $user->id,
            ]);

            return response()->json([
                'message' => 'Leave request ' . $request->status . ' successfully',
                'leave_request' => $leaveRequest->load(['student.user', 'student.schoolClass', 'reviewer'])
            ]);
        } catch (\Exception $e) {
            Log::error('LeaveRequest updateStatus error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update leave request: ' . $e->getMessage()
            ], 500);
        }
    }
}
