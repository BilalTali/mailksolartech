import React from 'react';
import { Gift, Calendar, TrendingUp, Users, CheckCircle2, ChevronRight, Info, Zap } from 'lucide-react';
import { UserOfferProgress } from '../../types';
import { twMerge } from 'tailwind-merge';

interface OfferCardProps {
    offer: UserOfferProgress;
    onRedeem?: (id: number) => void;
    isRedeeming?: boolean;
    showEnumeratorTooltip?: boolean;
}

export const OfferCard: React.FC<OfferCardProps> = ({
    offer,
    onRedeem,
    isRedeeming = false,
    showEnumeratorTooltip = false,
}) => {
    const isCollective = offer.offer_type === 'collective';
    const isEnded = !!offer.offer_ended_zeroed_at;
    const isTargetHit = isCollective ? (offer.current_points || 0) >= offer.target_points : offer.can_redeem;

    // Progress calculation
    const currentProgress = isEnded
        ? 0
        : (isCollective
            ? Math.min(100, Math.round(((offer.current_points || 0) / offer.target_points) * 100))
            : (offer.pending_redemption_count > 0 ? 100 : offer.cycle_percentage));

    return (
        <div className={twMerge(
            "group relative flex flex-col h-full rounded-[2.5rem] transition-all duration-500 overflow-hidden border-2",
            offer.is_featured && !isEnded 
                ? "bg-gradient-to-br from-indigo-50/30 to-white border-indigo-100/50 shadow-2xl shadow-indigo-100/30" 
                : "bg-white border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-indigo-100/50 hover:-translate-y-1",
            isEnded && "opacity-80 grayscale-[0.3] border-slate-200"
        )}>
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

            {/* Top Status Bar - Match Screenshot Layout */}
            <div className="px-5 pt-5 pb-2 flex items-center justify-between relative z-10">
                <div className="flex gap-2">
                    <span className={twMerge(
                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border shadow-sm",
                        isCollective
                            ? "bg-purple-100 text-purple-700 border-purple-200"
                            : "bg-indigo-100 text-indigo-700 border-indigo-100"
                    )}>
                        {isCollective ? <Users size={12} strokeWidth={3} /> : <Zap size={12} strokeWidth={3} />}
                        {offer.offer_type}
                    </span>
                    {offer.is_featured && !isEnded && (
                        <span className="bg-orange-100 text-orange-600 border border-orange-200 text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                            <TrendingUp size={12} strokeWidth={3} />
                            FEATURED
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl shadow-sm">
                    <Calendar size={12} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-500 tracking-tight">{offer.offer_to}</span>
                </div>
            </div>

            {/* Visual Container - Premium Card Layout */}
            <div className="px-5 py-4 relative z-10 shrink-0">
                <div className="relative aspect-[16/10] w-full rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl shadow-slate-900/10 group-hover:shadow-indigo-500/20 transition-all duration-700">
                    {offer.prize_image_url ? (
                        <img
                            src={offer.prize_image_url}
                            alt={offer.prize_label}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-800 to-slate-900 text-white/10 p-8">
                            <Gift size={64} strokeWidth={1} />
                        </div>
                    )}
                    
                    {/* Glassmorphic Prize Overlay - Exactly as in Screenshot */}
                    <div className="absolute bottom-5 left-5 right-5 backdrop-blur-xl bg-white/20 border border-white/30 px-5 py-4 rounded-[2rem] flex items-center gap-4 shadow-2xl">
                        <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/40 text-slate-900 shrink-0">
                            <Gift size={20} strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-white/70 uppercase leading-none mb-1.5 tracking-widest">REWARD</p>
                            <p className="text-base font-black text-white leading-none truncate">{offer.prize_label}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="px-8 pb-8 flex flex-col flex-grow relative z-10">
                <div className="mb-6">
                    <h3 className="text-2xl font-black text-indigo-600 leading-tight mb-3 tracking-tight group-hover:translate-x-1 transition-transform">
                        {offer.title}
                    </h3>
                    <p className="text-[15px] font-medium text-slate-500 line-clamp-3 min-h-[60px] leading-relaxed opacity-90 italic">
                        {offer.description || `Achieve a total of ${offer.target_points} verified installation points to claim!`}
                    </p>
                </div>

                {/* Integrated Progress Visualizer */}
                <div className="mt-auto space-y-5">
                    {showEnumeratorTooltip && (
                        <div className="bg-amber-50 rounded-xl px-3 py-2 border border-amber-100 flex items-start gap-2">
                            <Info size={14} className="text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-amber-800 font-medium leading-tight">
                                <strong>Reminder:</strong> Your first 10 system points go towards your onboarding fee. Only points earned <span className="underline">after</span> the fee is paid will fill this bar.
                            </p>
                        </div>
                    )}
                    
                    <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none px-1">
                            {isCollective ? "NETWORK TOTAL" : "MILESTONE TRACKER"}
                        </span>
                        
                        <div className="relative h-14 w-full bg-slate-50 border border-slate-100 rounded-2xl flex items-center px-6 overflow-hidden shadow-inner">
                            {/* Numbers */}
                            <div className="relative z-20 flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-slate-900 leading-none tabular-nums">
                                    {isEnded ? 0 : (isCollective ? offer.current_points : offer.my_unredeemed_points)}
                                </span>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">/ {offer.target_points} PTS</span>
                            </div>

                            {/* Shimmering Progress Fill */}
                            <div
                                className={twMerge(
                                    "absolute left-0 top-0 h-full transition-all duration-1000 ease-out z-10 opacity-10",
                                    isTargetHit && !isEnded ? "bg-emerald-500" : "bg-indigo-600"
                                )}
                                style={{ width: `${currentProgress}%` }}
                            />

                            {/* Floating Percentage Badge */}
                            <div 
                                className={twMerge(
                                    "absolute right-4 z-20 px-3 py-1.5 rounded-xl text-sm font-black tabular-nums shadow-sm border transition-all duration-1000",
                                    isTargetHit && !isEnded ? "bg-emerald-500 text-white border-emerald-400" : "bg-indigo-600 text-white border-indigo-500"
                                )}
                            >
                                {currentProgress}%
                            </div>
                        </div>

                        {/* Traditional Progress Bar - Clean Style */}
                        <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1 shadow-inner">
                            <div
                                className={twMerge(
                                    "absolute left-0 top-0 h-full transition-all duration-1000 ease-out rounded-full",
                                    isEnded ? "bg-slate-300" : (isTargetHit ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-600 to-indigo-400")
                                )}
                                style={{ width: `${currentProgress}%` }}
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-shimmer-fast" style={{ backgroundSize: '200% 100%' }} />
                            </div>
                        </div>
                    </div>

                    {/* Multi-Redemption Badge */}
                    {!isCollective && !isEnded && offer.my_redemption_count > 0 && (
                        <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-xs uppercase tracking-wide pt-1">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 size={12} strokeWidth={3} />
                            </div>
                            Won {offer.my_redemption_count} times
                        </div>
                    )}
                </div>

                {/* Redeem Button (Only for Individuals) */}
                {!isCollective && !isEnded && (
                    <div className="mt-8">
                        <button
                            onClick={() => onRedeem?.(offer.id)}
                            disabled={!offer.is_claimable || !offer.can_redeem || isRedeeming}
                            className={twMerge(
                                "w-full py-5 px-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 active:scale-95",
                                (offer.can_redeem && offer.is_claimable)
                                    ? "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-2xl hover:shadow-indigo-200/50 shadow-lg shadow-slate-900/10"
                                    : "bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed opacity-60"
                            )}
                        >
                            {isRedeeming ? (
                                <div className="animate-spin w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full" />
                            ) : (
                                <>
                                    {offer.pending_redemption_count > 0 ? (
                                        <>
                                            CLAIM REWARD NOW
                                            <div className="w-7 h-7 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                                                <ChevronRight size={16} strokeWidth={4} />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Info size={16} strokeWidth={3} />
                                            STILL NEED {offer.cycle_needed} POINTS
                                        </>
                                    )}
                                </>
                            )}
                        </button>

                        {!offer.is_claimable && (
                            <p className="mt-3 text-[10px] text-center text-red-500 font-black uppercase tracking-widest opacity-60">
                                Registration window closed
                            </p>
                        )}
                    </div>
                )}

                {/* Collective Note */}
                {isCollective && isTargetHit && !isEnded && (
                    <div className="mt-8 p-5 rounded-[2rem] bg-emerald-50 border-2 border-emerald-100 flex items-center gap-4 animate-in zoom-in duration-500">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200 shrink-0">
                            <CheckCircle2 size={24} strokeWidth={2.5} />
                        </div>
                        <p className="text-xs text-emerald-900 font-black uppercase tracking-tight leading-tight">
                            Target Hit! <br/> <span className="opacity-60 text-[10px]">Redemptions Active</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
