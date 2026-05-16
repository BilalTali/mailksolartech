<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // Commission
            ['key' => 'commission_per_lead', 'value' => '1000', 'group' => 'commission'],
            ['key' => 'commission_per_installation', 'value' => '2000', 'group' => 'commission'],
            ['key' => 'super_agent_override_percentage', 'value' => '10', 'group' => 'commission'],
            ['key' => 'commission_per_super_agent_installation', 'value' => '500', 'group' => 'commission'],

            // ── Company / Letterhead ──────────────────────────────────────────
            ['key' => 'company_name',             'value' => 'SuryaMitra Solar Network',       'group' => 'company'],
            ['key' => 'company_slogan',           'value' => 'Empowering India with Free Solar Energy', 'group' => 'company'],
            ['key' => 'company_tagline',          'value' => 'Empowering India with Free Solar Energy', 'group' => 'company'],
            ['key' => 'company_registration_no',  'value' => 'REG/SMS/2026/0892', 'group' => 'company'],
            ['key' => 'company_affiliated_with',  'value' => 'Government of India / MNRE', 'group' => 'company'],
            ['key' => 'company_address',          'value' => 'Basement Suite 4, Residency Road, Near Regal Chowk, Srinagar, J&K - 190001', 'group' => 'company'],
            ['key' => 'company_website',          'value' => 'https://suryamitra.in', 'group' => 'company'],
            ['key' => 'company_email',            'value' => 'info@suryamitra.in',      'group' => 'company'],
            ['key' => 'company_phone',            'value' => '+91-8899055335',         'group' => 'company'],
            ['key' => 'company_whatsapp',         'value' => '+91-8899055335',         'group' => 'company'],
            ['key' => 'company_mobile',           'value' => '+91-8899055335',         'group' => 'company'],

            // ── Authorized Signatory ──────────────────────────────────────────
            ['key' => 'signatory_name',           'value' => 'Er. Sameer Ahmad', 'group' => 'signatory'],
            ['key' => 'signatory_title',          'value' => 'Chief Operations Officer', 'group' => 'signatory'],
            ['key' => 'signatory_mobile',         'value' => '+91-90000 00000', 'group' => 'signatory'],
            ['key' => 'company_signature',        'value' => 'branding/signature.png', 'group' => 'branding'],
            ['key' => 'company_logo',             'value' => 'branding/logo.png', 'group' => 'branding'],
            ['key' => 'company_favicon',          'value' => 'branding/favicon.ico', 'group' => 'branding'],
            ['key' => 'company_seal',             'value' => 'branding/seal.png', 'group' => 'branding'],
            ['key' => 'company_logo_2',           'value' => 'branding/logo_2.png', 'group' => 'branding'],

            // ── ICard Specific ────────────────────────────────────────────────
            ['key' => 'authorized_signatory',     'value' => 'Er. Sameer Ahmad', 'group' => 'icard'],
            ['key' => 'authorized_signatory_title', 'value' => 'Chief Operations Officer', 'group' => 'icard'],
            ['key' => 'icard_clearance',          'value' => 'Level-V (Elite)', 'group' => 'icard'],
            ['key' => 'company_emergency',        'value' => '9906766655', 'group' => 'icard'],
            ['key' => 'icard_verified_by',        'value' => 'CHIEF OPERATIONS OFFICER', 'group' => 'icard'],
            ['key' => 'icard_warning_text',       'value' => "THIS IDENTITY INSTRUMENT IS ISSUED BY SURYAMITRA SOLAR NETWORK. \nISSUED FOR SECURE ACCESS ONLY. \nIF FOUND, PLEASE RETURN TO A REGIONAL FACILITY OR THE RESIDENCY ROAD HQ.", 'group' => 'icard'],

            // ── Letter Content ────────────────────────────────────────────────
            ['key' => 'letter_agent_body',        'value' => "With reference to your application and subsequent interaction with our team, we are pleased to appoint you as a <strong>Business Development Executive (BDE)</strong> for <strong>{company_name}</strong> under the PM Surya Ghar Muft Bijli Yojana facilitation programme, with effect from {joining_date}.\n\nAs a Business Development Executive bearing code <strong>{agent_id}</strong>, you will be responsible for identifying, registering, and facilitating potential beneficiaries in <strong>{territory}</strong> for rooftop solar installation under the aforementioned government scheme.\n\nYou will work under the guidance of your assigned Business Development Manager and report to the administrative team. Your commissions and incentives shall be as per the prevailing schedule notified by the company from time to time.", 'group' => 'letter'],
            ['key' => 'letter_super_agent_body',  'value' => "With reference to your application and the evaluation conducted by our senior team, we are pleased to appoint you as a <strong>Business Development Manager (BDM)</strong> for <strong>{company_name}</strong> under the PM Surya Ghar Muft Bijli Yojana facilitation programme, with effect from {joining_date}.\n\nAs a Business Development Manager bearing code <strong>{super_agent_code}</strong>, you will be responsible for building, managing, and mentoring a team of Business Development Executives across <strong>{territory}</strong>. You will oversee lead verification, agent performance, and coordinated facilitation of solar installations in your assigned region.\n\nYour override commissions, team incentives, and other benefits shall be as per the prevailing schedule communicated by the administration.", 'group' => 'letter'],
            ['key' => 'letter_terms',             'value' => "This appointment is for facilitation under PM Surya Ghar Muft Bijli Yojana only and does not constitute a formal employment contract.\nThis letter is non-transferable and valid only for the individual named herein.\nThe appointee must not collect any money, fees, or charges from beneficiaries under any circumstances.\nThe appointee agrees to maintain confidentiality of all beneficiary data and company information.\nThis appointment may be revoked by the company at any time without prior notice in case of misconduct.\nThe appointee must comply with all applicable laws, government guidelines, and company policies.\nCommission rates are subject to change and will be communicated separately.\nAny disputes are subject to the exclusive jurisdiction of the courts in Srinagar, J&K.", 'group' => 'letter'],
            ['key' => 'letter_footer_note',       'value' => 'This is a computer-generated document and carries a digital signature for authenticity.', 'group' => 'letter'],
            ['key' => 'technical_team_terms',     'value' => 'I hereby certify that I have personally visited the site, validated the structural and geographical suitability, and guarantee that the geo-tagged selfie submitted corresponds accurately to the property. Any false representation may result in immediate termination of affiliation.', 'group' => 'terms'],

            // Homepage Dynamic Cards
            ['key' => 'hero_headline', 'value' => 'Get 300 Units FREE Electricity Every Month', 'group' => 'homepage'],
            ['key' => 'hero_subheadline', 'value' => 'Government of India scheme — up to ₹94,800 subsidy for rooftop solar installation. We guide you end-to-end, completely free.', 'group' => 'homepage'],
            ['key' => 'hero_stats_json', 'value' => json_encode([
                ['icon' => 'IndianRupee', 'value' => '₹94,800', 'label' => 'Max Subsidy'],
                ['icon' => 'Zap', 'value' => '300 Units', 'label' => 'Free / Month'],
                ['icon' => 'Home', 'value' => '1 Crore+', 'label' => 'Target Homes'],
                ['icon' => 'BarChart3', 'value' => '25 Years', 'label' => 'Panel Life'],
            ]), 'group' => 'homepage'],
            ['key' => 'how_it_works_json', 'value' => json_encode([
                ['icon' => 'ClipboardList', 'step' => '1', 'title' => 'Submit Query', 'desc' => 'Fill our simple form with your details'],
                ['icon' => 'PhoneCall', 'step' => '2', 'title' => 'We Call You', 'desc' => 'Our team calls within 24 hours'],
                ['icon' => 'Building2', 'step' => '3', 'title' => 'Govt Registration', 'desc' => 'We register you on pmsuryaghar.gov.in'],
                ['icon' => 'Sun', 'step' => '4', 'title' => 'Installation', 'desc' => 'Solar panels installed at your home'],
                ['icon' => 'Zap', 'step' => '5', 'title' => 'Free Electricity', 'desc' => 'Enjoy up to 300 units free every month!'],
            ]), 'group' => 'homepage'],
            ['key' => 'why_choose_us_json', 'value' => json_encode([
                ['icon' => 'Sparkles', 'title' => 'Free Guidance', 'desc' => 'No charges from beneficiaries. Our service is completely free for homeowners.'],
                ['icon' => 'Zap', 'title' => 'Faster Registration', 'desc' => 'We handle all paperwork and portal registration so you don\'t have to.'],
                ['icon' => 'PhoneCall', 'title' => 'End-to-End Support', 'desc' => 'From application to installation, we stay with you throughout the entire process.'],
            ]), 'group' => 'homepage'],

            // Eligibility Checker Settings
            ['key' => 'eligibility_headline', 'value' => 'Check Your Eligibility', 'group' => 'homepage'],
            ['key' => 'eligibility_subheadline', 'value' => 'Answer 4 quick questions to find out if you qualify', 'group' => 'homepage'],

            // Subsidy Calculator Settings
            ['key' => 'calculator_headline', 'value' => 'Solar Subsidy Calculator', 'group' => 'homepage'],
            ['key' => 'calculator_subheadline', 'value' => 'Find out the exact government subsidy for your rooftop solar installation', 'group' => 'homepage'],
            ['key' => 'calculator_values_json', 'value' => json_encode([
                ['id' => '1kw',  'label' => '1 kW',  'central' => 30000,  'state' => 0,     'savings' => 800,  'payback' => 36],
                ['id' => '2kw',  'label' => '2 kW',  'central' => 60000,  'state' => 0,     'savings' => 1600, 'payback' => 38],
                ['id' => '3kw',  'label' => '3 kW',  'central' => 78000,  'state' => 0,     'savings' => 2400, 'payback' => 40],
                ['id' => '5kw',  'label' => '5 kW',  'central' => 78000,  'state' => 0,     'savings' => 4000, 'payback' => 45],
                ['id' => '10kw', 'label' => '10 kW', 'central' => 78000,  'state' => 0,     'savings' => 8000, 'payback' => 48],
            ]), 'group' => 'homepage'],
            ['key' => 'eligibility_questions_json', 'value' => json_encode([
                ['id' => 'q1', 'text' => 'Do you own the house where solar panels will be installed?', 'expected' => 'yes'],
                ['id' => 'q2', 'text' => 'Do you have an active electricity connection in your name?', 'expected' => 'yes'],
                ['id' => 'q3', 'text' => 'Do you have a valid Aadhaar-linked bank account?', 'expected' => 'yes'],
                ['id' => 'q4', 'text' => 'Have you NOT availed any solar subsidy before?', 'expected' => 'yes'],
            ]), 'group' => 'homepage'],
            ['key' => 'eligibility_success_title', 'value' => '✅ You are Eligible for PM Surya Ghar!', 'group' => 'homepage'],
            ['key' => 'eligibility_success_desc', 'value' => 'Great news! You meet the basic criteria. Please fill the Lead Form below and our team will guide you through the entire free installation process.', 'group' => 'homepage'],
            ['key' => 'eligibility_error_title', 'value' => '⚠️ You might not be eligible', 'group' => 'homepage'],
            ['key' => 'eligibility_error_desc', 'value' => 'Based on your answers, you may not qualify for the government subsidy at this moment. However, please contact our support team as there may still be other options available for you.', 'group' => 'homepage'],

            // Footer
            ['key' => 'footer_about_text', 'value' => 'AndleebSurya is a dedicated facilitator for the PM Surya Ghar scheme, empowering the people of Jammu & Kashmir and Ladakh with clean, free energy solutions.', 'group' => 'company'],
            ['key' => 'footer_copyright', 'value' => '© 2024 AndleebSurya. Not an official Govt website.', 'group' => 'company'],
            ['key' => 'footer_disclaimer', 'value' => '⚠️ Disclaimer: All subsidies are subject to MNRE guidelines and National Portal approvals.', 'group' => 'company'],
            ['key' => 'footer_section_quick_links', 'value' => 'Quick Links', 'group' => 'company'],
            ['key' => 'footer_section_legal', 'value' => 'Legal & Support', 'group' => 'company'],
            ['key' => 'footer_link_about', 'value' => '/about', 'group' => 'company'],
            ['key' => 'footer_link_scheme', 'value' => 'https://pmsuryaghar.gov.in', 'group' => 'company'],
            ['key' => 'footer_link_contact', 'value' => '/contact', 'group' => 'company'],
            ['key' => 'footer_link_faq', 'value' => '/faq', 'group' => 'company'],
            ['key' => 'footer_link_privacy', 'value' => '/privacy', 'group' => 'company'],
            ['key' => 'footer_link_terms', 'value' => '/terms', 'group' => 'company'],
            ['key' => 'footer_link_refund', 'value' => '/refund', 'group' => 'company'],

            // Navigation Labels
            ['key' => 'nav_home', 'value' => 'Home', 'group' => 'homepage'],
            ['key' => 'nav_home_link', 'value' => '/', 'group' => 'homepage'],
            ['key' => 'nav_rewards', 'value' => 'Benefits', 'group' => 'homepage'],
            ['key' => 'nav_rewards_link', 'value' => '/media', 'group' => 'homepage'],
            ['key' => 'nav_portal_login', 'value' => 'Portal Login', 'group' => 'homepage'],
            ['key' => 'nav_cta_electricity', 'value' => 'Get Free Electricity', 'group' => 'homepage'],
            ['key' => 'nav_calculator', 'value' => 'Calculator', 'group' => 'homepage'],
            ['key' => 'nav_calculator_link', 'value' => '/solar-subsidy-calculator', 'group' => 'homepage'],
            ['key' => 'nav_track_status', 'value' => 'Track Status', 'group' => 'homepage'],
            ['key' => 'nav_track_status_link', 'value' => '/track-status', 'group' => 'homepage'],
            ['key' => 'nav_guide', 'value' => 'Guide', 'group' => 'homepage'],
            ['key' => 'nav_guide_link', 'value' => '/user-manual', 'group' => 'homepage'],
            ['key' => 'hero_cta_primary_link', 'value' => '#lead-form', 'group' => 'homepage'],
            ['key' => 'hero_cta_secondary_link', 'value' => '/enumerator/register', 'group' => 'homepage'],
            ['key' => 'label_how_it_works', 'value' => 'How It Works', 'group' => 'homepage'],
            ['key' => 'label_eligibility_checker', 'value' => 'Check Your Eligibility', 'group' => 'homepage'],
            ['key' => 'label_subsidy_calculator', 'value' => 'Solar Subsidy Calculator', 'group' => 'homepage'],
            ['key' => 'label_whatsapp_text', 'value' => 'Chat with Solar Expert', 'group' => 'homepage'],

            // ── Offers & Points ────────────────────────────────────────────────
            ['key' => 'capacity_points_json', 'value' => '{"1kw":0,"2kw":0,"3kw":1,"3.3kw":1.1,"4kw":1.5,"5kw":2,"5.5kw":2.2,"6kw":2.5,"7kw":3,"8kw":3.5,"9kw":4,"10kw":5,"above_10kw":6,"above_3kw":1.5}', 'group' => 'offer'],
            ['key' => 'offer_grace_period_days', 'value' => '7', 'group' => 'offer'],

            // ── Company Bank Details (for Billing / Invoices) ─────────────────
            ['key' => 'company_bank_account_name',   'value' => 'SuryaMitra Solar Network',         'group' => 'billing'],
            ['key' => 'company_bank_account_number', 'value' => '000000000000',                      'group' => 'billing'],
            ['key' => 'company_bank_ifsc',           'value' => 'XXXXXXXX000',                        'group' => 'billing'],
            ['key' => 'company_bank_branch',         'value' => 'Main Branch, Srinagar',              'group' => 'billing'],

            // ── Billing Items (Hardware Components) ───────────────────────────
            ['key' => 'billing_items_json', 'value' => json_encode([
                ['id' => '1', 'name' => 'Solar Panel (Monocrystalline)',  'unit' => 'Nos'],
                ['id' => '2', 'name' => 'Solar Panel (Polycrystalline)',  'unit' => 'Nos'],
                ['id' => '3', 'name' => 'Grid-Tie Inverter',             'unit' => 'Nos'],
                ['id' => '4', 'name' => 'Hybrid Inverter',               'unit' => 'Nos'],
                ['id' => '5', 'name' => 'Battery (Lithium-Ion)',          'unit' => 'Nos'],
                ['id' => '6', 'name' => 'Battery (Lead Acid / Tubular)', 'unit' => 'Nos'],
                ['id' => '7', 'name' => 'ACDB / DCDB Box',               'unit' => 'Set'],
                ['id' => '8', 'name' => 'MC4 Connector & DC Cable',      'unit' => 'Lot'],
                ['id' => '9', 'name' => 'Mounting Structure (Roof)',      'unit' => 'Set'],
                ['id' => '10', 'name' => 'Net Meter',                    'unit' => 'Nos'],
                ['id' => '11', 'name' => 'Junction Box',                 'unit' => 'Nos'],
                ['id' => '12', 'name' => 'Earthing Kit & Accessories',   'unit' => 'Set'],
                ['id' => '13', 'name' => 'Complete On-Grid Solar System', 'unit' => 'Package'],
                ['id' => '14', 'name' => 'Complete Hybrid Solar System',  'unit' => 'Package'],
            ]), 'group' => 'billing'],

            // ── Billing Makes (Brands / Manufacturers) ────────────────────────
            ['key' => 'billing_makes_json', 'value' => json_encode([
                ['id' => '1',  'name' => 'Luminous'],
                ['id' => '2',  'name' => 'Exide'],
                ['id' => '3',  'name' => 'Waaree'],
                ['id' => '4',  'name' => 'Loom Solar'],
                ['id' => '5',  'name' => 'Adani Solar'],
                ['id' => '6',  'name' => 'TATA Power Solar'],
                ['id' => '7',  'name' => 'Premier Energies'],
                ['id' => '8',  'name' => 'Sukam'],
                ['id' => '9',  'name' => 'Microtek'],
                ['id' => '10', 'name' => 'UTL Solar'],
                ['id' => '11', 'name' => 'Havells'],
                ['id' => '12', 'name' => 'Polycab'],
                ['id' => '13', 'name' => 'Nexus'],
                ['id' => '14', 'name' => 'Other'],
            ]), 'group' => 'billing'],
        ];

        foreach ($settings as $setting) {
            // Protect existing user-uploaded branding to avoid overwriting with placeholders
            if (in_array($setting['key'], ['company_logo', 'company_favicon', 'company_signature', 'company_seal', 'company_logo_2'])) {
                $existing = Setting::query()->where(fn($q) => $q->where('key', $setting['key']))->first();
                if ($existing && ! empty($existing->value) && str_contains($existing->value, 'branding/')) {
                    // Only update if current value is the placeholder we are trying to set (e.g. logo.png)
                    if ($existing->value !== $setting['value']) {
                        continue;
                    }
                }
            }

            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
