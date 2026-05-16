import { User } from './user.types';
export type ExcitementState = 'dormant' | 'building' | 'close' | 'ready';
// ====== Offers & Incentives (v2) ======
export type OfferType = 'individual' | 'collective';
export type OfferStatus = 'active' | 'paused' | 'ended';
export type RedemptionStatus = 'pending' | 'admin_approved' | 'approved' | 'delivered' | 'cancelled';

export interface Offer {
    id: number;
    title: string;
    description: string | null;
    prize_label: string;
    prize_amount: number | null;
    prize_image_url: string | null;
    prize_image_path?: string | null;
    offer_from: string;
    offer_to: string;
    target_points: number;
    offer_type: OfferType;
    visible_to: 'agents' | 'super_agents' | 'both';
    status: OfferStatus;
    is_featured: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;

    // v3 Fields
    grace_period_days: number;
    is_annual: boolean;
    absorption_processed_at: string | null;

    // Computed/Appended
    is_live: boolean;
    is_claimable: boolean;
    grace_period_ends_at: string | null;
    days_remaining: number;
    collective_remaining?: number;
    collective_redeemed?: boolean;
    redemptions_count?: number; // admin view
}

export interface UserOfferProgress {
    // Basic offer data
    id: number;
    title: string;
    description: string | null;
    prize_label: string;
    prize_amount: number | null;
    prize_image_url: string | null;
    offer_from: string;
    offer_to: string;
    offer_type: OfferType;
    target_points: number;
    days_remaining: number;
    is_featured: boolean;
    is_annual: boolean;
    is_claimable: boolean;
    offer_ended_zeroed_at: string | null;

    // Collective data
    current_points?: number;
    collective_remaining?: number;
    collective_redeemed?: boolean;

    // Personal data (Individual)
    my_total_points: number;
    my_redeemed_points: number;
    my_unredeemed_points: number;
    my_redemption_count: number;
    can_redeem: boolean;
    pending_redemption_count: number;

    // Cycle progress
    cycle_points: number;
    cycle_needed: number;
    cycle_percentage: number;
}

export interface SuperAgentAbsorbedPoint {
    id: number;
    super_agent_id: number;
    source_agent_id: number;
    offer_id: number;
    absorbed_points: number;
    agent_total_points: number;
    offer_target: number;
    absorption_reason: 'agent_fell_short' | 'grace_period_expired' | 'enumerator_absorption';
    absorbed_at: string;
    status: 'unclaimed' | 'claimed' | 'delivered';
    claimed_by: number | null;
    claimed_at: string | null;
    delivered_at: string | null;
    approved_by: number | null;
    admin_notes: string | null;
    lead_id?: number;

    // Relations
    offer: {
        id: number;
        title: string;
        offer_from: string;
        offer_to: string;
        target_points: number;
        prize_label: string;
        prize_image_path: string | null;
        visible_to: 'agents' | 'super_agents' | 'both';
    };
    source_agent: User;
    super_agent?: User;
    lead?: {
        id: number;
        customer_name: string;
        ulid: string;
        system_capacity: string;
    };
}

export interface OfferParticipant {
    user_id: number;
    name: string;
    agent_id: string; // The code
    role: 'agent' | 'super_agent';
    total_points: number;
    unredeemed: number;
    redemptions: number;
    last_activity: string | null;
}

export interface OfferRedemption {
    id: number;
    offer_id: number;
    user_id: number;
    redemption_number: number;
    points_used: number;
    status: RedemptionStatus;
    notes: string | null;
    approved_by: number | null;
    approved_at: string | null;
    delivered_at: string | null;
    claimed_at: string;
    created_at: string;

    // Relationships
    offer?: Offer;
    user?: User;
    approved_by_user?: User;
}

export interface TeamOfferPerformance {
    offer_id: number;
    offer_title: string;
    prize_label: string;
    prize_image_url: string | null;
    target_points: number;
    offer_to: string;
    days_remaining: number;
    is_featured: boolean;
    agents: TeamAgentOfferRow[];
    team_totals: {
        total_points: number;
        redeemed_points: number;
        unredeemed_points: number;
        redemption_count: number;
        agents_who_can_redeem: number;
    };
}

export interface TeamAgentOfferRow {
    agent_id: number;
    agent_name: string;
    agent_code: string | null;
    total_points: number;
    redeemed_points: number;
    unredeemed_points: number;
    redemption_count: number;
    can_redeem: boolean;
    cycle_points: number;
    cycle_needed: number;
    last_installation_at: string | null;
}

// ====== Offer Excitement Helpers ======

/**
 * Maps the UserOfferProgress to the simplified OfferProgress used by excitement components.
 * This handles the 'my_' prefix mapping.
 */
export interface OfferProgress {
    total_points: number;
    unredeemed_points: number;
    redemption_count: number;
    can_redeem: boolean;
}

export interface OfferWithProgress extends Offer {
    progress?: UserOfferProgress;
    own_progress?: UserOfferProgress;
}

/**
 * Computes the excitement state for a single offer+progress pair.
 * Uses CYCLE progress (unredeemed % target), not lifetime total.
 */
export function getExcitementState(
    progress: OfferProgress | UserOfferProgress | null | undefined,
    targetPoints: number
): ExcitementState {
    if (!progress) return 'dormant';

    // Support both OfferProgress and UserOfferProgress field naming
    const total = (progress as UserOfferProgress).my_total_points ?? (progress as OfferProgress).total_points;
    if (total === 0) return 'dormant';

    if (progress.can_redeem) return 'ready';

    const unredeemed = (progress as UserOfferProgress).my_unredeemed_points ?? (progress as OfferProgress).unredeemed_points;
    const cyclePoints = unredeemed % targetPoints;
    const pct = targetPoints > 0
        ? (cyclePoints / targetPoints) * 100
        : 0;

    if (pct >= 90) return 'ready';
    if (pct >= 60) return 'close';
    if (pct >= 30) return 'building';
    return 'dormant';
}

/**
 * Urgency score 0–100 for determining whether to show the banner.
 */
export function computeUrgencyScore(
    offer: Offer,
    progress: OfferProgress | UserOfferProgress | null | undefined
): number {
    if (!progress) return 0;
    if (progress.can_redeem) return 100;

    const target = offer.target_points;
    const unredeemed = (progress as UserOfferProgress).my_unredeemed_points ?? (progress as OfferProgress).unredeemed_points;
    const cyclePoints = unredeemed % target;
    const pct = target > 0 ? (cyclePoints / target) * 100 : 0;

    const daysBonus =
        offer.days_remaining <= 2 ? 35 :
            offer.days_remaining <= 5 ? 20 :
                offer.days_remaining <= 7 ? 12 :
                    offer.days_remaining <= 14 ? 5 : 0;

    return Math.min(100, Math.round(pct + daysBonus));
}
