import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicSettingsData } from '@/services/public.api';

export const DEFAULT_SETTINGS: PublicSettingsData = {
    company_name: import.meta.env.VITE_APP_NAME || 'AndleebSurya',
    company_email: null,
    company_mobile: null,
    company_whatsapp: null,
    company_address: null,
    company_slogan: null,
    company_logo: null,
    company_favicon: null,
    company_signature: null,
    company_seal: null,
    company_website: window.location.origin,
    social_facebook: null,
    social_twitter: null,
    social_instagram: null,
    social_youtube: null,
    hero_headline: 'Get 300 Units FREE Electricity Every Month',
    hero_subheadline: 'Government of India scheme — up to ₹94,800 subsidy for rooftop solar installation. We guide you end-to-end, completely free.',
    hero_video: null,
    hero_stats_json: null,
    how_it_works_json: null,
    why_choose_us_json: null,
    calculator_headline: null,
    calculator_subheadline: null,
    calculator_values_json: null,
    eligibility_headline: null,
    eligibility_subheadline: null,
    eligibility_questions_json: null,
    eligibility_success_title: null,
    eligibility_success_desc: null,
    eligibility_error_title: null,
    eligibility_error_desc: null,
    footer_about_text: null,
    footer_copyright: null,
    footer_disclaimer: null,

    nav_home: 'Home',
    nav_home_link: '/',
    nav_rewards: 'Rewards',
    nav_rewards_link: '/media',
    nav_calculator: 'Calculator',
    nav_calculator_link: '/solar-subsidy-calculator',
    nav_track_status: 'Track Status',
    nav_track_status_link: '/track-status',
    nav_guide: 'Guide',
    nav_guide_link: '/user-manual',
    nav_portal_login: 'Portal Login',
    nav_cta_electricity: 'Get Free Electricity',
    hero_cta_primary_link: '#lead-form',
    hero_cta_secondary_link: '/enumerator/register',

    footer_section_quick_links: 'Quick Links',
    footer_section_legal: 'Legal & Support',
    footer_link_about: 'About Us',
    footer_link_scheme: 'PM Surya Ghar Scheme',
    footer_link_contact: 'Contact',
    footer_link_faq: 'FAQ',
    footer_link_privacy: 'Privacy Policy',
    footer_link_terms: 'Terms & Conditions',
    footer_link_refund: 'Refund Policy',

    label_how_it_works: 'How It Works',
    label_eligibility_checker: 'Eligibility Checker',
    label_subsidy_calculator: 'Subsidy Calculator',
    label_become_executive: 'Become a Biz Dev Executive',
    label_executive_login: 'Biz Dev Executive Login',
    label_apply_title: 'Apply for Free Solar Electricity',
    label_apply_desc: 'Fill the form below and our team will call you within 24 hours',
    label_whatsapp_text: 'WhatsApp Us',
    company_registration_no: null,
    company_affiliated_with: null,
    company_logo_2: null,
    icard_clearance: 'Level-V (Elite)',
    external_pmsuryaghar_label: 'pmsuryaghar.gov.in',
    external_pmsuryaghar_url: 'https://pmsuryaghar.gov.in',

    // Billing & Invoice defaults
    company_bank_account_name: null,
    company_bank_account_number: null,
    company_bank_ifsc: null,
    company_bank_branch: null,
    billing_items_json: null,
    billing_makes_json: null,
    technical_team_terms: null,
};

const getFileUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').split('/api/v1')[0];
    return `${baseUrl}/storage/${path}`;
};

export function useSettings() {
    const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
        settings,
        isLoading,
        companyName: settings.company_name || 'SuryaMitra',
        affiliatedWith: settings.company_affiliated_with,
        companyEmail: settings.company_email,
        companyMobile: settings.company_mobile,
        companyWhatsapp: settings.company_whatsapp,
        companyAddress: settings.company_address,
        companyWebsite: settings.company_website,
        registrationNo: settings.company_registration_no,
        logo: settings.company_logo ? getFileUrl(settings.company_logo) : null,
        // Affiliate Partner Logo — set exclusively by Super Admin, appears on ID cards
        masterLogo: settings.company_logo_2 ? getFileUrl(settings.company_logo_2) : null,
        favicon: settings.company_favicon ? getFileUrl(settings.company_favicon) : null,
        signature: settings.company_signature ? getFileUrl(settings.company_signature) : null,
        seal: settings.company_seal ? getFileUrl(settings.company_seal) : null,
    };
}
