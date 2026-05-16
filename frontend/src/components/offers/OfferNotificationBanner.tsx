import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { Offer, UserOfferProgress, computeUrgencyScore, OfferProgress } from '@/types'

interface Props {
    offers: Offer[]
    progressMap: Record<number, UserOfferProgress | OfferProgress>
    role: 'agent' | 'super_agent'
}

export const OfferNotificationBanner = ({ offers, progressMap, role }: Props) => {
    const navigate = useNavigate()
    const [gone, setGone] = useState(false)

    // Find most urgent qualifying offer
    const best = offers
        .map(o => ({ o, score: computeUrgencyScore(o, progressMap[o.id]) }))
        .filter(x => x.score >= 40)
        .sort((a, b) => b.score - a.score)[0]

    if (!best || gone) return null

    const { o: offer, score } = best
    const progress = progressMap[offer.id]
    const isReady = progress?.can_redeem
    const target = offer.target_points

    const unredeemed = progress
        ? (progress as UserOfferProgress).my_unredeemed_points ?? (progress as OfferProgress).unredeemed_points
        : 0

    const needed = target - (unredeemed % target)
    const otherCount = offers.filter(x =>
        x.id !== offer.id && computeUrgencyScore(x, progressMap[x.id]) >= 40
    ).length
    const route = role === 'agent' ? '/agent/offers' : '/super-agent/offers'

    return (
        <div
            className={`
        relative overflow-hidden rounded-[18px] mb-5
        flex items-center gap-3.5 px-[18px] py-3.5
        cursor-pointer transition-transform hover:-translate-y-0.5
        ${isReady
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400 shadow-sm'
                    : score >= 70
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-orange-50 border-orange-100'}
      `}
            onClick={() => navigate(route)}
        >
            {isReady && (
                <div className="absolute inset-y-0 -left-[80%] w-[55%] pointer-events-none
                        bg-gradient-to-r from-transparent via-white/[0.05] to-transparent
                        animate-banner-sweep" />
            )}

            <div className={`
        w-[38px] h-[38px] rounded-xl flex-shrink-0
        flex items-center justify-center text-[17px]
        ${isReady ? 'bg-yellow-400/[0.20] animate-pulse'
                    : score >= 70 ? 'bg-amber-500/[0.18]'
                        : 'bg-orange-500/[0.15]'}
      `}>
                {isReady ? '🏆' : score >= 70 ? '⚡' : '🔥'}
            </div>

            <div className="flex-1 min-w-0">
                <div className={`
          text-[12.5px] font-bold leading-tight truncate
          ${isReady ? 'text-amber-900' : 'text-dark'}
        `}>
                    {isReady
                        ? `🎉 You've earned it! Claim your prize from "${offer.title}"`
                        : score >= 70
                            ? `⚡ Only ${needed} point${needed !== 1 ? 's' : ''} away from "${offer.title}"!`
                            : `🔥 You're ${Math.round(score)}% toward "${offer.title}" — keep going!`}
                </div>
                <div className="text-[10.5px] text-neutral-500 mt-0.5 truncate">
                    Prize: {offer.prize_label}
                    {offer.days_remaining <= 7 && offer.days_remaining > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-black border border-orange-200">
                            ENDING IN {offer.days_remaining}d
                        </span>
                    )}
                    {otherCount > 0 && (
                        <span className="ml-2 text-white/24">
                            · +{otherCount} other offer{otherCount > 1 ? 's' : ''} active
                        </span>
                    )}
                </div>
            </div>

            <button
                onClick={e => { e.stopPropagation(); navigate(route) }}
                className={`
          flex-shrink-0 px-4 py-2 rounded-xl
          text-[11px] font-extrabold transition-all active:scale-95
          ${isReady
                        ? 'bg-accent text-white shadow shadow-yellow-400/25 border-none'
                        : 'bg-white text-dark/60 border border-dark/10 hover:bg-neutral-50'}
        `}
            >
                {isReady ? 'Claim Now' : 'View Offer'}
            </button>

            <button
                onClick={e => { e.stopPropagation(); setGone(true) }}
                className="flex-shrink-0 w-[22px] h-[22px] rounded-full border-none
                   bg-transparent text-dark/20 hover:text-dark/40
                   flex items-center justify-center transition-colors"
                aria-label="Dismiss"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    )
}
