import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicMedia, type PublicSettingsData } from '@/services/public.api';
import { Award, Calendar, RefreshCcw, Search } from 'lucide-react';
import { useState } from 'react';
import SEOHead from '@/components/shared/SEOHead';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';

export default function MediaPage() {
    const [search, setSearch] = useState('');

    const { data: media = [], isLoading } = useQuery({
        queryKey: ['public-media'],
        queryFn: publicApi.getMedia,
    });

    const { data: settings } = useQuery<PublicSettingsData>({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
    });

    const filteredMedia = media.filter(m =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.description?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white">
            <SEOHead
                title="Reward Winners & Announcements - PM Surya Ghar"
                description={`Celebrating the milestones and achievements of our dedicated ${settings?.company_name || 'AndleebSurya'} partners across India.`}
                breadcrumbs={[
                    { name: 'Home', url: window.location.origin },
                    { name: 'Media', url: window.location.origin + '/media' }
                ]}
            />
            <Navbar />

            <div className="min-h-[80vh] bg-slate-50 py-12 md:py-20 overflow-hidden relative">
                {/* Background elements */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-accent/5 blur-[120px] rounded-full -mr-24 -mt-24 z-0" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full -ml-24 -mb-24 z-0" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    {/* Header */}
                    <div className="text-center mb-20 animate-slide-up">
                        <div className="inline-flex items-center gap-2 bg-accent/10 text-accent text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-pill border border-accent/20 mb-6 drop-shadow-sm">
                            <Award size={16} className="animate-pulse" /> Wall of Excellence
                        </div>
                        <h1 className="text-5xl md:text-7xl font-display font-black text-dark mb-8 tracking-tighter leading-[1.1]">
                            Reward <span className="text-accent text-glow">Winners</span> <br /> & Announcements
                        </h1>
                        <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
                            Honoring the frontline champions of India's solar revolution. Every installation brings us closer to a greener future.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto mb-16 relative group animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="absolute inset-x-0 bottom-0 h-4 bg-primary/5 blur-xl -z-10 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-accent transition-colors" size={22} />
                        <input
                            type="text"
                            placeholder="Search announcements or winners..."
                            className="w-full pl-14 pr-8 py-5 rounded-[20px] border border-neutral-200 focus:outline-none focus:ring-8 focus:ring-accent/5 focus:border-accent bg-white/70 backdrop-blur-xl shadow-card transition-all text-lg font-medium"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex justify-center py-40">
                            <RefreshCcw className="w-12 h-12 text-accent animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {filteredMedia.map((m: PublicMedia, idx) => (
                                    <div
                                        key={m.id}
                                        className="group glass-card overflow-hidden transition-all duration-700 hover:-translate-y-3 flex flex-col items-center justify-center animate-slide-up"
                                        style={{ animationDelay: `${0.2 + (idx * 0.1)}s` }}
                                    >
                                        <div className="aspect-[4/3] w-full relative overflow-hidden bg-white">
                                            {m.image_url ? (
                                                <img
                                                    src={m.image_url}
                                                    alt={m.title}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s]"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                                    <Award size={80} className="opacity-10 text-primary" />
                                                </div>
                                            )}
                                            {/* Metallic Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />

                                            {/* Date Badge */}
                                            <div className="absolute top-6 left-6">
                                                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary shadow-xl border border-white">
                                                    <Calendar size={14} className="text-accent" /> {m.date || 'Update'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 flex-1 flex flex-col w-full bg-white relative">
                                            {/* Glowing bottom line */}
                                            <div className="absolute bottom-0 left-0 h-1 bg-accent w-0 group-hover:w-full transition-all duration-700" />

                                            <div className="mb-2">
                                                <h3 className="text-2xl font-display font-black text-dark group-hover:text-primary transition-colors leading-tight">
                                                    {m.winner_name || m.title}
                                                </h3>
                                                {m.winner_name && (
                                                    <p className="text-sm font-black uppercase tracking-widest text-accent mt-1 drop-shadow-sm">
                                                        {m.title}
                                                    </p>
                                                )}
                                            </div>

                                            {m.description && (
                                                <p className="text-neutral-500 text-base leading-relaxed mb-6 line-clamp-3">
                                                    {m.description}
                                                </p>
                                            )}

                                            <div className="mt-auto flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-300 group-hover:text-accent transition-colors">{settings?.company_name || 'SuryaMitra'} Official</span>
                                                <Award size={20} className="text-neutral-200 group-hover:text-accent group-hover:rotate-12 transition-all duration-500" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredMedia.length === 0 && (
                                <div className="text-center py-32 rounded-[32px] border-4 border-dashed border-neutral-100 animate-fade-in bg-white/30 backdrop-blur-sm">
                                    <Search className="w-16 h-16 text-neutral-200 mx-auto mb-6" />
                                    <p className="text-2xl text-neutral-400 font-display font-bold">No results found for "{search}"</p>
                                    <button onClick={() => setSearch('')} className="mt-6 text-accent font-black uppercase tracking-widest text-sm hover:underline">Clear Search</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
