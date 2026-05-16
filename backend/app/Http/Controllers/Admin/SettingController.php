<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

use App\Http\Requests\UpdateSettingRequest;

class SettingController extends Controller
{
    /**
     * Keys that are managed strictly by the Super Admin for the GLOBAL platform.
     * Regular admins cannot modify these.
     */
    public const PLATFORM_ONLY_KEYS = [
        // Homepage Presence
        'hero_headline',
        'hero_subheadline',
        'hero_video',
        'hero_stats_json',
        'how_it_works_json',
        'why_choose_us_json',
        'eligibility_headline',
        'eligibility_subheadline',
        'eligibility_questions_json',
        'eligibility_success_title',
        'eligibility_success_desc',
        'eligibility_error_title',
        'eligibility_error_desc',
        'calculator_headline',
        'calculator_subheadline',
        'calculator_values_json',
        'capacity_points_json',

        // Global Navigation & Footer
        'nav_home', 'nav_rewards', 'nav_calculator', 'nav_track_status', 'nav_guide',
        'nav_portal_login', 'nav_cta_electricity',
        'nav_home_link', 'nav_rewards_link', 'nav_calculator_link', 'nav_track_status_link',
        'nav_guide_link', 'hero_cta_primary_link', 'hero_cta_secondary_link',
        'footer_section_quick_links', 'footer_section_legal', 'footer_link_about',
        'footer_link_scheme', 'footer_link_contact', 'footer_link_faq', 'footer_link_privacy',
        'footer_link_terms', 'footer_link_refund', 'footer_about_text', 'footer_copyright',
        'footer_disclaimer',

        // Global Portal Logic
        'incentive_points_per_lead', 'incentive_points_per_agent',

        // ── Billing & Invoice Authority (Super Admin Only) ────────────────────
        'company_bank_account_name', 'company_bank_account_number',
        'company_bank_ifsc', 'company_bank_branch',
        'billing_items_json', 'billing_makes_json',
        'official_signature',
    ];

    /**
     * Keys that are overridable by Tenants (Admins) for their specific company identity.
     * Super Admin manages the GLOBAL version of these (user_id = null).
     */
    public const TENANT_KEYS = [
        'company_name',
        'company_slogan',
        'company_logo',
        'company_favicon',
        'company_logo_2',          // Admin's own secondary / affiliation logo
        'company_registration_no',
        'company_email',
        'company_phone',
        'company_mobile',
        'company_whatsapp',
        'company_address',
        'company_website',
        'company_signature',
        'official_signature',
        'company_seal',
        'authorized_signatory',
        'authorized_signatory_title',
        'icard_clearance',
        'company_affiliated_with',
        // Billing catalogue — read-only view for Admins (set by Super Admin globally)
        'billing_items_json',
        'billing_makes_json',
        'company_bank_account_name', 'company_bank_account_number',
        'company_bank_ifsc', 'company_bank_branch',
    ];

    public function index()
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();
        $targetUserId = $user->isSuperAdmin() ? null : $user->getRootAdminId();
        $mergedSettings = Setting::getMergedSettings($targetUserId);

        // Filter: Regular Admins only see Tenant keys (allowing them to manage their own identity)
        $groupedSettings = $mergedSettings->filter(function($setting) use ($user) {
            if (!$user->isSuperAdmin() && !in_array($setting->key, self::TENANT_KEYS)) {
                return false;
            }
            return true;
        })->groupBy('group');

        return response()->json([
            'success' => true,
            'data' => $groupedSettings,
        ]);
    }

    public function updateBulk(UpdateSettingRequest $request)
    {
        try {
            $validated = $request->validated();

            // Key → default group map so new rows always get a meaningful group
            $defaultGroups = [
                'company_' => 'company',
                'hero_' => 'homepage',
                'footer_' => 'company',
                'footer_link_' => 'branding',
                'eligibility_' => 'homepage',
                'calculator_' => 'homepage',
                'welcome_' => 'portal',
                'terms_' => 'portal',
                'nav_' => 'homepage',
                'hero_cta_' => 'homepage',
                'label_' => 'homepage',
                'authorized_' => 'icard',
                'letter_' => 'letter',
                'signatory_' => 'signatory',
            ];

            $user = auth()->user();
            $targetUserId = $user->isSuperAdmin() ? null : $user->id;

            foreach ($validated['settings'] as $setting) {
                $key = $setting['key'];
                $value = $setting['value'];

                // Role-based Content Protection
                if (!$user->isSuperAdmin() && in_array($key, self::PLATFORM_ONLY_KEYS)) {
                    continue; // Force isolation: Regular Admins cannot touch Platform configs
                }

                // Determine group: keep existing group if the row exists, else derive from key prefix
                $existing = Setting::query()
                    ->where('key', $key)
                    ->where('user_id', $targetUserId)
                    ->first();

                if ($existing) {
                    Log::info("UPDATING EXISTING: {$key} WITH {$value}");
                    $existing->update(['value' => $value]);
                } else {
                    $group = 'general';
                    foreach ($defaultGroups as $prefix => $g) {
                        if (str_starts_with($key, $prefix)) {
                            $group = $g;
                            break;
                        }
                    }
                    Setting::create([
                        'key' => $key,
                        'value' => $value,
                        'group' => $group,
                        'user_id' => $targetUserId
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Settings updated successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Settings update failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update settings: '.$e->getMessage(),
                'error_type' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    /**
     * Handle file upload for settings like logo, signature, hero video.
     */
    public function uploadFile(Request $request)
    {
        $request->validate([
            'key' => 'required|string|in:company_favicon,company_logo,company_logo_2,company_signature,official_signature,company_seal,hero_video',
            'file' => 'required|file|max:102400', // 100MB max
        ]);

        $key = $request->input('key');
        $file = $request->file('file');

        $user = auth()->user();
        $targetUserId = $user->isSuperAdmin() ? null : $user->id;

        // Platform Protection for file uploads
        if (!$user->isSuperAdmin() && in_array($key, self::PLATFORM_ONLY_KEYS)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized: Only Super Admin can modify Platform-level assets.'], 403);
        }

        // Delete old file if exists
        /** @var Setting|null $existing */
        $existing = Setting::query()
            ->where('key', $key)
            ->where('user_id', $targetUserId)
            ->first();

        if ($existing && $existing->value) {
            Storage::disk('public')->delete((string)$existing->value);
        }

        // Store new file
        $folder = match ($key) {
            'company_favicon', 'company_logo', 'company_logo_2', 'company_signature', 'official_signature', 'company_seal' => 'branding',
            'hero_video' => 'homepage',
            default => 'uploads',
        };

        $path = $file->store($folder, 'public');

        Setting::updateOrCreate(
            ['key' => $key, 'user_id' => $targetUserId],
            [
                'value' => $path,
                'group' => match ($key) {
                    'company_favicon', 'company_logo', 'company_logo_2', 'company_signature', 'official_signature', 'company_seal' => 'branding',
                    'hero_video' => 'homepage',
                    default => 'general',
                },
            ]
        );

        return response()->json([
            'success' => true,
            'data' => ['url' => asset('storage/'.$path)],
            'message' => 'File uploaded successfully',
        ]);
    }

    /**
     * Update the admin's personal profile details.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'mobile' => ['sometimes', 'string', 'max:20'],
            'whatsapp_number' => ['nullable', 'string', 'max:20'],
            'father_name' => ['nullable', 'string', 'max:255'],
            'dob' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'marital_status' => ['nullable', 'string', 'in:single,married,divorced,widowed'],
            'blood_group' => ['nullable', 'string', 'max:10'],
            'religion' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string'],
            'district' => ['nullable', 'string'],
            'area' => ['nullable', 'string'],
            'pincode' => ['nullable', 'string', 'max:10'],
            'landmark' => ['nullable', 'string', 'max:255'],
            'permanent_address' => ['nullable', 'string'],
            'current_address' => ['nullable', 'string'],
            'occupation' => ['nullable', 'string', 'max:255'],
            'qualification' => ['nullable', 'string', 'max:255'],
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'data' => $user->fresh(),
            'message' => 'Profile updated successfully.',
        ]);
    }
}
