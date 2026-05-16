import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicAchievement } from '@/services/public.api';
import { Trophy, Calendar, ArrowRight } from 'lucide-react';

export default function AchievementsSection() {
    const { data: achievements = [], isLoading } = useQuery({
        queryKey: ['public-achievements'],
        queryFn: publicApi.getAchievements,
        staleTime: 5 * 60 * 1000,
    });

    if (!isLoading && achievements.length === 0) return null;

    return (
        <section id="achievements" className="py-24 bg-white relative overflow-hidden">
            {/* Soft background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_#F1F5F9_0%,_transparent_70%)] opacity-50 z-0" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-pill mb-4 border border-primary/10">
                        <Trophy className="w-3.5 h-3.5" /> Proven Track Record
                    </div>
                    <h2 className="font-display font-black text-4xl lg:text-5xl text-dark mb-4">Milestones We've Delivered</h2>
                    <p className="text-neutral-600 max-w-xl mx-auto text-lg">Real impact for families across India through sustainable energy.</p>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="rounded-card bg-neutral-100 animate-pulse h-80" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[280px]">
                        {achievements.map((a: PublicAchievement, idx) => {
                            // First achievement and every 5th one or so gets larger
                            const isLarge = idx === 0 || (idx > 0 && idx % 7 === 0);
                            return (
                                <div
                                    key={a.id}
                                    className={`group relative rounded-card overflow-hidden bg-white border border-neutral-100 shadow-card hover:shadow-premium transition-all duration-500 hover:-translate-y-1 ${isLarge ? 'sm:col-span-2 lg:row-span-2' : ''}`}
                                >
                                    {a.image_url ? (
                                        <div className="absolute inset-0 z-0">
                                            <img
                                                src={a.image_url}
                                                alt={a.title}
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-light opacity-10 group-hover:opacity-20 transition-opacity" />
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end h-full z-10">
                                        {a.date && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-3">
                                                <Calendar className="w-3.5 h-3.5" /> {a.date}
                                            </div>
                                        )}
                                        <h3 className={`font-display font-bold text-white mb-2 leading-tight group-hover:text-accent transition-colors ${isLarge ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}`}>
                                            {a.title}
                                        </h3>
                                        {a.description && (
                                            <p className={`text-white/70 line-clamp-3 group-hover:text-white transition-colors ${isLarge ? 'text-base' : 'text-sm'}`}>
                                                {a.description}
                                            </p>
                                        )}

                                        {/* Optional "view details" or "category" hover hint */}
                                        <div className="mt-4 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest">
                                                Success Case <ArrowRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
