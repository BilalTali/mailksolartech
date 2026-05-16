export type UserRole = 'admin' | 'super_admin' | 'super_agent' | 'agent' | 'enumerator' | 'operator' | 'field_technical_team' | 'consumer';
export type UserStatus = 'active' | 'inactive' | 'pending';
export type OverrideStatus = 'pending' | 'approved' | 'paid';
// ====== User / Business Development Executive ======
export interface User {
    id: number;
    name: string;
    email: string;
    mobile: string;
    role: string;
    status: string;
    agent_id?: string;
    super_agent_code?: string;
    enumerator_id?: string;
    enumerator_creator_role?: 'admin' | 'super_agent' | 'agent';
    district?: string;
    state?: string;  // SSM-YYYY-XXXX (super agents only)
    super_agent_id: number | null;          // FK → super agent (agents only)
    super_agent?: SuperAgentRef;            // populated via eager loading
    managed_states: string[] | null;        // super agents only
    area: string | null;
    profile_photo: string | null;
    profile_photo_url: string | null;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
    offer_point_threshold?: number;

    // ── Extended Profile Fields ──
    father_name: string | null;
    dob: string | null;
    blood_group: string | null;
    religion: string | null;
    gender: 'male' | 'female' | 'other' | null;
    marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null;

    permanent_address: string | null;
    current_address: string | null;
    pincode: string | null;
    landmark: string | null;

    aadhaar_number: string | null; // Masked in frontend
    pan_number: string | null;    // Masked in frontend
    voter_id: string | null;

    bank_name: string | null;
    bank_account_number: string | null; // Masked in frontend
    bank_ifsc: string | null;
    bank_branch: string | null;
    upi_id: string | null;

    occupation: string | null;
    qualification: string | null;
    experience_years: number | null;
    languages_known: string[] | null;
    reference_name: string | null;
    reference_mobile: string | null;
    territory: string | null;
    target_monthly: number | null;

    // ── Joining Letter ──
    approved_at: string | null;
    approved_by: number | null;
    letter_number: string | null;
    joining_date: string | null;
    signature_image: string | null;
    profile_completion: number;
    languages_known_string?: string; // Frontend helper

    // ── QR Code & Verification (New Phase 30) ──
    qr_token: string | null;
    qr_generated_at: string | null;
    last_verified_at: string | null;
    scan_count: number;

    // Aggregates (populated on some API calls)
    agent_count?: number;
    total_leads?: number;
    created_by?: { name: string; code: string } | null;
    permissions?: string[] | null;
    parentAgent?: User;
}

/** Minimal Business Development Manager reference for nested display */
export interface SuperAgentRef {
    id: number;
    name: string;
    super_agent_code: string;
    mobile: string;
}

/** Team assignment audit log entry */
export interface TeamAssignment {
    id: number;
    super_agent_id: number;
    agent_id: number;
    assigned_by: number;
    assigned_at: string;
    unassigned_at: string | null;
    notes: string | null;
    agent?: User;
    super_agent?: User;
    assignedBy?: User;
}

export interface AuthState {
    token: string | null;
    user: User | null;
    role: UserRole | null;
}
