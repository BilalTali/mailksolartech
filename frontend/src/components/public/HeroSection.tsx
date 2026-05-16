import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/public.api';
import { DEFAULT_SETTINGS } from '@/hooks/useSettings';
import { ArrowRight, Play } from 'lucide-react';

export default function HeroSection() {
    const { t } = useTranslation();
    const { data: settings = DEFAULT_SETTINGS } = useQuery({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
    });

    const hasVideo = !!settings.hero_video;

    return (
        <section className="relative overflow-hidden min-h-[500px] md:min-h-[700px] lg:min-h-[800px] flex items-center pt-20">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                {hasVideo ? (
                    <video
                        autoPlay loop muted playsInline
                        className="w-full h-full object-cover scale-105"
                        src={settings.hero_video!}
                    />
                ) : (
                    <div className="w-full h-full grad-primary" />
                )}
                <div className={`absolute inset-0 ${hasVideo ? 'bg-primary/60' : 'bg-primary/20'} backdrop-blur-[2px]`} />
            </div>

            {/* Decorative Floating Blobs */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-accent/20 blur-[100px] rounded-full animate-float" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary-light/30 blur-[120px] rounded-full animate-float" style={{ animationDelay: '2s' }} />

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="animate-slide-up">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white text-[10px] font-black tracking-[0.2em] uppercase px-5 py-2.5 rounded-pill border border-white/20 mb-8 shadow-xl">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                            </span>
                            PM Surya Ghar Yojana 2024
                        </div>

                        <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.1] mb-8">
                            {((settings?.hero_headline ?? t('home.hero_title')) || '').split(' ').map((word: string, i: number) => (
                                <span key={i} className={word.toLowerCase() === 'free' || word.toLowerCase() === 'units' ? 'text-accent text-glow' : ''}>
                                    {word}{' '}
                                </span>
                            ))}
                        </h1>

                        <p className="text-white/70 text-lg lg:text-xl mb-10 max-w-xl leading-relaxed font-body">
                            {settings.hero_subheadline || t('home.hero_subtitle')}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5">
                            <a href={settings?.hero_cta_primary_link || "#lead-form"} className="btn-accent group relative overflow-hidden">
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {settings?.nav_cta_electricity || t('home.hero_cta_primary')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </a>
                            <a href={settings?.hero_cta_secondary_link || "/enumerator/register"} className="glass-card px-8 py-3 flex items-center justify-center gap-3 text-white font-bold hover:bg-white/20 transition-all border-white/10">
                                <Play className="w-5 h-5 text-accent" /> {t('home.hero_cta_secondary')}
                            </a>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Wave / Transition */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </section>
    );
}
