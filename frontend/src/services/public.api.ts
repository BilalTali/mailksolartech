import api from './axios';
import type { ApiResponse } from '@/types';

export interface PublicSettingsData {
    company_name: string | null;
    company_email: string | null;
    company_mobile: string | null;
    company_whatsapp: string | null;
    company_address: string | null;
    company_slogan: string | null;
    company_logo: string | null;
    company_favicon: string | null;
    company_signature: string | null;
    company_seal: string | null;
    company_website: string | null;
    social_facebook: string | null;
    social_twitter: string | null;
    social_instagram: string | null;
    social_youtube: string | null;
    hero_headline: string | null;
    hero_subheadline: string | null;

    hero_video: string | null;
    hero_stats_json: string | null;
    how_it_works_json: string | null;
    why_choose_us_json: string | null;
    calculator_headline: string | null;
    calculator_subheadline: string | null;
    calculator_values_json: string | null;
    eligibility_headline: string | null;
    eligibility_subheadline: string | null;
    eligibility_questions_json: string | null;
    eligibility_success_title: string | null;
    eligibility_success_desc: string | null;
    eligibility_error_title: string | null;
    eligibility_error_desc: string | null;
    footer_about_text: string | null;
    footer_copyright: string | null;
    footer_disclaimer: string | null;

    // Navigation Labels
    nav_home: string | null;
    nav_home_link: string | null;
    nav_rewards: string | null;
    nav_rewards_link: string | null;
    nav_calculator: string | null;
    nav_calculator_link: string | null;
    nav_track_status: string | null;
    nav_track_status_link: string | null;
    nav_guide: string | null;
    nav_guide_link: string | null;
    nav_portal_login: string | null;
    nav_cta_electricity: string | null;
    hero_cta_primary_link: string | null;
    hero_cta_secondary_link: string | null;

    // Footer Links & Sections
    footer_section_quick_links: string | null;
    footer_section_legal: string | null;
    footer_link_about: string | null;
    footer_link_scheme: string | null;
    footer_link_contact: string | null;
    footer_link_faq: string | null;
    footer_link_privacy: string | null;
    footer_link_terms: string | null;
    footer_link_refund: string | null;

    // General Labels
    label_how_it_works: string | null;
    label_eligibility_checker: string | null;
    label_subsidy_calculator: string | null;
    label_become_executive: string | null;
    label_executive_login: string | null;
    label_apply_title: string | null;
    label_apply_desc: string | null;
    label_whatsapp_text: string | null;
    company_registration_no: string | null;
    company_affiliated_with: string | null;
    company_logo_2: string | null;
    icard_clearance: string | null;
    external_pmsuryaghar_label: string | null;
    external_pmsuryaghar_url: string | null;

    // Billing & Invoice (Super Admin Only)
    company_bank_account_name: string | null;
    company_bank_account_number: string | null;
    company_bank_ifsc: string | null;
    company_bank_branch: string | null;
    billing_items_json: string | null;
    billing_makes_json: string | null;
    technical_team_terms: string | null;
}

export interface PublicAchievement {
    id: number;
    title: string;
    winner_name: string | null;
    description: string | null;
    image_url: string | null;
    date: string | null;
}

export interface PublicFeedback {
    id: number;
    name: string;
    message: string;
    rating: number;
    admin_reply: string | null;
    date: string;
}

export interface PublicMedia {
    id: number;
    title: string;
    winner_name: string | null;
    description: string | null;
    image_url: string | null;
    date: string | null;
}

export interface PublicDocument {
    id: number;
    title: string;
    description: string | null;
    category: string | null;
    file_url: string | null;
    thumbnail_url: string | null;
    is_published: boolean;
    sort_order: number;
    created_at: string;
}

export interface HelpCenterData {
    faqs: {
        id: number;
        question: string;
        answer: string;
        category: string | null;
    }[];
    contacts: {
        id: number;
        name: string;
        district: string | null;
        state: string | null;
        whatsapp: string | null;
        role: string;
    }[];
}

export const publicApi = {
    getSettings: async (): Promise<PublicSettingsData> => {
        const res = await api.get<ApiResponse<PublicSettingsData>>('/public/settings');
        return res.data.data as PublicSettingsData;
    },
    getAchievements: async (): Promise<PublicAchievement[]> => {
        const res = await api.get<ApiResponse<PublicAchievement[]>>('/public/achievements');
        return res.data.data ?? [];
    },
    getFeedbacks: async (): Promise<PublicFeedback[]> => {
        const res = await api.get<ApiResponse<PublicFeedback[]>>('/public/feedbacks');
        return res.data.data ?? [];
    },
    getMedia: async (): Promise<PublicMedia[]> => {
        const res = await api.get<ApiResponse<PublicMedia[]>>('/public/media');
        return res.data.data ?? [];
    },
    submitFeedback: async (data: { name: string; email?: string; phone?: string; message: string; rating: number }) => {
        const res = await api.post<ApiResponse<{ id: number }>>('/public/feedback', data);
        return res.data;
    },
    trackApplication: async (id: string) => {
        const res = await api.get<ApiResponse<any>>(`/public/leads/track?id=${id}`);
        return res.data;
    },
    getDocuments: async (): Promise<PublicDocument[]> => {
        const res = await api.get<ApiResponse<PublicDocument[]>>('/public/documents');
        return res.data.data ?? [];
    },
    getHelpData: async (): Promise<HelpCenterData> => {
        const res = await api.get<ApiResponse<HelpCenterData>>('/public/help');
        return res.data.data as HelpCenterData;
    },
    getCrmOptions: async (): Promise<Record<string, any[]>> => {
        const res = await api.get<ApiResponse<Record<string, any[]>>>('/public/crm-options');
        return res.data.data ?? {};
    },
};
