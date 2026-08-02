<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SystemSetting;

class SystemSettingController extends Controller
{
    // Public setting endpoint for student registration page
    public function getPublicSettings()
    {
        $allowRegistration = SystemSetting::get('allow_student_registration', 'true') === 'true';
        return response()->json([
            'allow_student_registration' => $allowRegistration
        ]);
    }

    // Admin settings list
    public function index()
    {
        $settings = SystemSetting::all()->pluck('value', 'key');
        return response()->json([
            'settings' => $settings
        ]);
    }

    // Update system setting
    public function update(Request $request)
    {
        $request->validate([
            'key' => 'required|string',
            'value' => 'required',
        ]);

        SystemSetting::set($request->key, $request->value);

        return response()->json([
            'message' => 'បានធ្វើបច្ចុប្បន្នភាពកំណត់រចនាសម្ព័ន្ធប្រព័ន្ធដោយជោគជ័យ!',
            'settings' => SystemSetting::all()->pluck('value', 'key')
        ]);
    }

    // Batch update homeroom class registration status
    public function updateHomeroomRegistrations(Request $request)
    {
        $request->validate([
            'open_class_ids' => 'present|array',
            'mode' => 'nullable|string'
        ]);

        $mode = $request->input('mode', 'custom');

        if ($mode === 'all_open') {
            \App\Models\SchoolClass::query()->update(['is_registration_open' => true]);
            SystemSetting::set('allow_student_registration', 'true');
        } else if ($mode === 'all_closed') {
            \App\Models\SchoolClass::query()->update(['is_registration_open' => false]);
            SystemSetting::set('allow_student_registration', 'false');
        } else {
            $openIds = array_map('intval', $request->input('open_class_ids', []));
            if (!empty($openIds)) {
                \App\Models\SchoolClass::whereIn('id', $openIds)->update(['is_registration_open' => true]);
                \App\Models\SchoolClass::whereNotIn('id', $openIds)->update(['is_registration_open' => false]);
            } else {
                \App\Models\SchoolClass::query()->update(['is_registration_open' => false]);
            }
            
            $hasOpen = \App\Models\SchoolClass::where('is_registration_open', true)->exists();
            SystemSetting::set('allow_student_registration', $hasOpen ? 'true' : 'false');
        }

        return response()->json([
            'message' => 'បានធ្វើបច្ចុប្បន្នភាពការកំណត់ចុះឈ្មោះតាមថ្នាក់បន្ទុកដោយជោគជ័យ!'
        ]);
    }
}
