import { User } from './user.types';
import { CommissionPrompt, Commission, LeadCommissionEntryStatus } from './commission.types';
export type LeadStatus =
    | 'NEW'
    | 'REJECTED'
    | 'REGISTERED'
    | 'SURVEY_DONE'
    | 'LEAD_DOCUMENTS_PRINTED'
    | 'SIGNATURE_PENDING'
    | 'SIGNATURE_DONE'
    | 'FILE_DISBURSED'
    | 'DISBURSEMENT_VERIFIED'
    | 'DISPATCH_INITIATED'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'MATERIAL_VERIFIED_BY_CONSUMER'
    | 'INSTALLATION_SCHEDULED'
    | 'INSTALLATION_IN_PROGRESS'
    | 'SOLAR_INSTALLED'
    | 'POD_INSPECTION_INITIATED'
    | 'POD_REJECTED'
    | 'POD_SUCCESSFUL'
    | 'PROJECT_COMMISSIONING'
    | 'SUBSIDY_REQUEST'
    | 'SUBSIDY_DISBURSED'
    | 'LEAD_COMPLETED';
// ====== Lead Pipeline Types ======
export type LeadSource =
    | 'public_form'
    | 'agent_submission'
    | 'super_agent_submission'
    | 'admin_manual';

export type LeadOwnerType = 'admin_pool' | 'super_agent_pool' | 'agent_pool';

export type LeadVerificationStatus =
    | 'not_required'
    | 'pending_agent_verification'
    | 'pending_super_agent_verification'
    | 'super_agent_verified'
    | 'reverted_to_enumerator'
    | 'reverted_to_agent'
    | 'admin_override';

export type LeadVerificationAction = 'verified' | 'reverted';

export interface LeadVerification {
    id: number;
    lead_id: number;
    action: LeadVerificationAction;
    performed_by: number;
    performed_by_name?: string;
    performedBy?: { id: number; name: string; role: string; agent_id: string | null; super_agent_code: string | null };
    performer_role: 'super_agent' | 'admin';
    reason: string | null;
    revert_count_at_time: number;
    created_at: string;
}

// ====== Lead ======
export interface Lead {
    id: number;
    ulid: string;
    source: LeadSource;
    owner_type: LeadOwnerType;
    verification_status: LeadVerificationStatus;
    revert_count: number;
    revert_reason: string | null;
    assigned_agent_id: number | null;
    assigned_super_agent_id: number | null;
    assigned_admin_id: number | null;
    assigned_surveyor_id?: number | null;
    assigned_installer_id?: number | null;
    submitted_by_agent_id: number | null;
    submitted_by_enumerator_id: number | null;
    created_by_super_agent_id: number | null;
    verified_by_super_agent_id: number | null;
    verified_at: string | null;
    reverted_at: string | null;
    surveyor_form_submitted_at?: string | null;
    installation_assigned_at?: string | null;
    installation_scheduled_at?: string | null;
    assigned_agent?: User;
    assigned_super_agent?: User;
    assigned_admin?: User;
    assigned_surveyor?: User;
    assigned_installer?: User;
    submitted_by_agent?: User;
    submitted_by_enumerator?: User;
    created_by_super_agent?: User;
    verifications?: LeadVerification[];

    beneficiary_name: string;
    beneficiary_mobile: string;
    beneficiary_email: string | null;
    beneficiary_state: string;
    beneficiary_district: string;
    beneficiary_address: string | null;
    beneficiary_pincode: string | null;

    consumer_number: string | null;
    discom_name: string | null;
    roof_size: string | null;
    system_capacity: string | null;
    system_item: string | null;
    system_make: string | null;
    monthly_bill_amount: number | null;
    category: 'APL' | 'BPL' | 'AAY' | 'OTHER' | null;
    referral_agent_id: string | null;

    status: LeadStatus;
    query_message: string | null;
    admin_notes: string | null;
    follow_up_date: string | null;
    govt_application_number: string | null;
    rejection_reason: string | null;

    commission_entry_status: LeadCommissionEntryStatus;
    commission_prompt?: CommissionPrompt;
    commission_status?: {
        prompts: CommissionPrompt[];
    };
    formatted_commissions?: {
        super_agent_commission: Commission | null;
        agent_commission: Commission | null;
        enumerator_commission: Commission | null;
        all?: Commission[];
    };
    commissions?: Commission[];
    
    // Top-down Admin allocation
    lead_revenue?: number | null;
    admin_received_commission?: number | null;
    admin_meeting_allowance?: number | null;
    admin_additional_expenses?: number | null;
    admin_other_expenses?: { label: string; amount: number }[] | null;
    admin_net_earning?: number;

    status_logs?: LeadStatusLog[];
    documents?: LeadDocument[];

    billing_items?: BillingItem[];
    billing_gst_percentage?: number;

    quotation_serial?: string;
    receipt_serial?: string;
    quotation_base_amount?: number;
    quotation_gst_amount?: number;
    quotation_total_amount?: number;
    receipt_amount?: number;

    created_at: string;
    updated_at: string;
    survey_requirement?: SurveyRequirement;
    inventory_items?: LeadInventoryItem[];
}

export interface LeadInventoryItem {
    id: number;
    lead_id: number;
    inventory_item_id: number;
    quantity: number;
    consumed_quantity: number;
    reverted_quantity: number;
    serial_number?: string;
    reversion_confirmed_at?: string | null;
    reversion_confirmed_by?: number | null;
    inventory_item: {
        id: number;
        name: string;
        sku: string;
        make?: string;
        unit: string;
    };
    created_at: string;
    updated_at: string;
}

export interface SurveyRequirement {
    id: number;
    lead_id: number;
    system_capacity_kw: number;
    panel_quantity: number;
    inverter_model_make: string;
    wire_length_meters: number;
    additional_accessories?: { item: string; qty: string | number }[];
    created_at: string;
    updated_at: string;
}

export interface BillingItem {
    description: string;
    make: string;
    rate: number;
}

// ====== Lead Status Log ======
export interface LeadStatusLog {
    id: number;
    lead_id: number;
    changed_by: number | null;
    from_status: LeadStatus;
    to_status: LeadStatus;
    notes: string | null;
    /** F3 — Geotag evidence (set when changed by field_technical_team) */
    geotag_photo_path: string | null;
    latitude: number | null;
    longitude: number | null;
    /** B4 — Role of the user who made the change */
    changed_by_role: string | null;
    changedBy?: User;
    created_at: string;
}

// ====== Lead Document ======
export interface LeadDocument {
    id: number;
    lead_id: number;
    document_type: string;
    file_path: string;
    download_url: string;
    original_filename: string;
    uploaded_by: number;
    /** F5 — Document visibility flag for downline users (agents/enumerators) */
    visible_to_downline: boolean;
    /** F5 — Role of the uploader for filtering/display logic */
    uploaded_by_role: string | null;
    uploadedBy?: User;
    created_at: string;
}
