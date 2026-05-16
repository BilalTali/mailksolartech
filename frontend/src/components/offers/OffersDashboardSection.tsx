import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { OfferCard } from '../shared/OfferCard'
import { OfferNotificationBanner } from './OfferNotificationBanner'
import { OfferWithProgress, UserOfferProgress, computeUrgencyScore, OfferProgress } from '@/types'
import api from '@/services/axios'

interface Props {
    role: 'agent' | 'super_agent'
    onRedeem?: (offerId: number) => void
}

export const OffersDashboardSection = ({ role, onRedeem }: Props) => {
    const navigate = useNavigate()
    const endpoint = role === 'agent' ? '/agent/offers' : '/super-agent/offers'
    const qKey = role === 'agent' ? ['agent-offers'] : ['sa-offers']

    const { data: offers = [], isLoading } = useQuery<OfferWithProgress[]>({
        queryKey: qKey,
        queryFn: async () => {
            const res = await api.get(endpoint);
            return res.data.data ?? [];
        },
        refetchInterval: 60_000,
        staleTime: 10_000,
    })

    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (!scrollRef.current || isPaused || offers.length <= 1) return;

        const interval = setInterval(() => {
            const el = scrollRef.current;
            if (!el) return;

            const cardWidth = el.offsetWidth * 0.85; // Approximate width based on snap points
            const maxScroll = el.scrollWidth - el.clientWidth;
            
            if (el.scrollLeft >= maxScroll - 50) {
                // Smoothly reset to start if we're at the end
                el.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                el.scrollBy({ left: cardWidth, behavior: 'smooth' });
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [isPaused, offers.length]);

    // Live offers only:
    const live = offers.filter(o => o.is_live || o.is_claimable)

    // Progress map:
    const pm: Record<number, UserOfferProgress | OfferProgress> = {}
    live.forEach(o => {
        const p = role === 'agent' ? o.progress : o.own_progress
        if (p) pm[o.id] = p
    })

    // Sort: can_redeem first, then urgency desc:
    const sorted = [...live].sort((a, b) => {
        const pa = pm[a.id], pb = pm[b.id]
        if (pa?.can_redeem && !pb?.can_redeem) return -1
        if (!pa?.can_redeem && pb?.can_redeem) return 1
        return computeUrgencyScore(a, pa) - computeUrgencyScore(b, pb)
    })

    const allRoute = role === 'agent' ? '/agent/offers' : '/super-agent/offers'

    if (isLoading) return (
        <div className="flex gap-4 mb-6 overflow-hidden">
            {[1, 2].map(i => <div key={i} className="h-64 w-[320px] flex-shrink-0 animate-pulse bg-slate-100 rounded-[2.5rem]" />)}
        </div>
    )

    if (!live.length) return null

    return (
        <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
                    <div>
                        <h2 className="font-display font-black text-2xl text-slate-900 tracking-tight leading-none">
                            Active Offers
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Exclusive Rewards for You</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate(allRoute)}
                    className="flex items-center gap-1.5 text-[10px] text-indigo-600 hover:text-indigo-700 font-black uppercase tracking-[0.2em] bg-indigo-50 px-4 py-2 rounded-full transition-all"
                >
                    View All {live.length} <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
            </div>

            <OfferNotificationBanner offers={live.slice(0, 3)} progressMap={pm} role={role} />

            <div 
                className="relative group/scroll"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div 
                    ref={scrollRef}
                    className="
                        flex gap-6 pb-12 px-1
                        overflow-x-auto scrollbar-hide snap-x snap-mandatory
                    "
                >
                    {sorted.map(offer => {
                        // Map OfferWithProgress + its own_progress/progress into the UserOfferProgress expected by OfferCard
                        const progress = role === 'agent' ? offer.progress : offer.own_progress;
                        
                        if (!progress) return null;

                        const cardData: UserOfferProgress = {
                            ...progress,
                            // Ensure shared fields from the offer itself are used if progress is missing them
                            id: offer.id,
                            title: offer.title,
                            description: offer.description,
                            prize_label: offer.prize_label,
                            prize_amount: offer.prize_amount,
                            prize_image_url: offer.prize_image_url,
                            offer_from: offer.offer_from,
                            offer_to: offer.offer_to,
                            offer_type: offer.offer_type,
                            target_points: offer.target_points,
                            is_featured: offer.is_featured,
                            is_claimable: offer.is_claimable,
                            days_remaining: offer.days_remaining
                        };

                        return (
                            <div key={offer.id} className="w-[88vw] sm:w-[350px] flex-shrink-0 snap-start">
                                <OfferCard
                                    offer={cardData}
                                    onRedeem={onRedeem}
                                />
                            </div>
                        );
                    })}
                </div>
                
                {/* Visual indicator for more items */}
                {live.length > 1 && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
                        {live.map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-slate-200" />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
