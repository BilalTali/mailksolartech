import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/public.api';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import SEOHead from '@/components/shared/SEOHead';
import {
    Search, Loader2, CheckCircle2, User,
    ClipboardList, FileCheck, Map, Building2, Sun, Zap, FileSignature, Banknote,
    ChevronRight, ArrowLeft, ShieldCheck, Activity, Database, Satellite, Sparkles
} from 'lucide-react';

import toast from 'react-hot-toast';

/* ─── Animated SVG solar corona in the hero background ─── */
function SolarCorona() {
    return (
        <div className="absolute top-0 right-0 w-[520px] h-[520px] opacity-[0.07] pointer-events-none select-none translate-x-1/3 -translate-y-1/4">
            {/* Outer slow ring */}
            <svg viewBox="0 0 400 400" className="w-full h-full" style={{ animation: 'rotateSlow 40s linear infinite' }}>
                <circle cx="200" cy="200" r="190" fill="none" stroke="#FF9500" strokeWidth="1" strokeDasharray="12 8" />
                <circle cx="200" cy="200" r="170" fill="none" stroke="#FF9500" strokeWidth="0.5" strokeDasharray="4 20" />
            </svg>
            {/* Inner counter-rotating ring */}
            <svg viewBox="0 0 400 400" className="w-full h-full absolute inset-0" style={{ animation: 'rotateSlowReverse 25s linear infinite' }}>
                <circle cx="200" cy="200" r="145" fill="none" stroke="#FF9500" strokeWidth="1" strokeDasharray="20 15" />
                <circle cx="200" cy="200" r="120" fill="none" stroke="#0A3D7A" strokeWidth="0.8" strokeDasharray="6 12" />
            </svg>
            {/* Core glow */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-accent/40 blur-2xl" style={{ animation: 'solarGlow 4s ease-in-out infinite' }} />
            </div>
        </div>
    );
}

/* ─── Floating ambient particles ─── */
function Particles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className="absolute rounded-full bg-accent/20"
                    style={{
                        width: `${Math.random() * 6 + 3}px`,
                        height: `${Math.random() * 6 + 3}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `float ${6 + Math.random() * 8}s ${Math.random() * 5}s ease-in-out infinite`,
                        opacity: Math.random() * 0.5 + 0.2,
                    }}
                />
            ))}
        </div>
    );
}

/* ─── SVG circular progress ring ─── */
function ProgressRing({ step, total }: { step: number; total: number }) {
    const r = 40;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(step / total, 1);
    const offset = circ - pct * circ;
    return (
        <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
            {/* Track */}
            <circle cx="48" cy="48" r={r} fill="none" stroke="#E2E8F0" strokeWidth="7" />
            {/* Progress */}
            <circle
                cx="48" cy="48" r={r} fill="none"
                stroke="url(#ringGrad)" strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                transform="rotate(-90 48 48)"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
            />
            <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF9500" />
                    <stop offset="100%" stopColor="#FFD000" />
                </linearGradient>
            </defs>
            <text x="48" y="53" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0A3D7A" fontFamily="'Baloo 2', cursive">
                {step}/{total}
            </text>
        </svg>
    );
}

/* ─── Active node pulsing ring ─── */
function PulseRing() {
    return (
        <span className="absolute inset-0 rounded-[1.25rem] pointer-events-none">
            <span className="absolute inset-0 rounded-[1.25rem] bg-accent/30"
                style={{ animation: 'nodePin 1.6s ease-out infinite' }} />
        </span>
    );
}


/* ════════════════════════════════════════════════
   MAIN PAGE COMPONENT
════════════════════════════════════════════════ */
export default function TrackStatusPage() {
    const [searchId, setSearchId] = useState('');
    const [queryId, setQueryId] = useState('');
    const [focused, setFocused] = useState(false);

    const { data: trackingData, isLoading } = useQuery({
        queryKey: ['track-application', queryId],
        queryFn: () => publicApi.trackApplication(queryId),
        enabled: !!queryId,
        retry: false,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanId = searchId.trim();
        if (cleanId.length < 4) {
            toast.error('Please enter at least 4 characters.');
            return;
        }
        setQueryId(cleanId);
    };

    const steps = useMemo(() => [
        { label: 'Received',     desc: 'Query Entry',    icon: ClipboardList },
        { label: 'Portal Reg',   desc: 'MNRE Registered', icon: FileCheck },
        { label: 'Site Survey',  desc: 'Inspection',      icon: Map },
        { label: 'Financing',    desc: 'Bank Clearance',  icon: Building2 },
        { label: 'Installation', desc: 'Solar Mounted',   icon: Sun },
        { label: 'Commissioned', desc: 'System Live',     icon: Zap },
        { label: 'Applied',      desc: 'Subsidy Claim',   icon: FileSignature },
        { label: 'Processing',   desc: 'Verification',    icon: Loader2 },
        { label: 'Disbursed',    desc: 'Payment Paid',    icon: Banknote },
    ], []);

    const currentStep = trackingData?.data?.step_index || 0;

    return (
        <div className="min-h-screen bg-[#FAFBFF] text-slate-900 font-body overflow-x-hidden flex flex-col selection:bg-accent selection:text-white">
            <SEOHead
                title="Track Your Solar Application | PM Surya Ghar Muft Bijli Yojana"
                description="Track real-time status of your PM Surya Ghar Muft Bijli Yojana solar application. Check your installation progress, subsidy status, and government verification instantly."
                breadcrumbs={[
                    { name: 'Home', url: window.location.origin },
                    { name: 'Track Status', url: window.location.origin + '/track-status' }
                ]}
            />
            <Navbar />

            {/* ── Layered Background ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Base mesh */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFFBF5] via-[#F5F8FF] to-[#FFFBF5]" />
                {/* Blue orb top-left */}
                <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
                {/* Gold orb bottom-right */}
                <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/8 blur-[100px]" />
                {/* Subtle dot grid */}
                <div className="absolute inset-0 opacity-[0.025]"
                    style={{ backgroundImage: 'radial-gradient(circle, #0A3D7A 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                <Particles />
                <SolarCorona />
            </div>

            <main className="relative z-10 flex-grow flex flex-col items-center py-20 md:py-28 px-4">
                <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-14">

                    {/* ── HERO ── */}
                    <div className="text-center space-y-6 pt-8 animate-in fade-in slide-in-from-top-10 duration-700">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-accent/20 bg-white/80 backdrop-blur-sm shadow-sm text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                            </span>
                            <Satellite size={12} /> Live Tracking Portal · PM Surya Ghar
                        </div>

                        {/* H1 — SEO keyword rich */}
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black text-slate-900 leading-[1.05] tracking-tight">
                            Track Your{' '}
                            <span className="relative inline-block">
                                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-500">
                                    Solar Journey
                                </span>
                                <span className="absolute bottom-1 left-0 right-0 h-3 bg-accent/10 rounded-full blur-sm -z-0" />
                            </span>
                        </h1>
                        <p className="text-slate-500 font-medium text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
                            Check real-time status of your{' '}
                            <strong className="text-slate-700">PM Surya Ghar Muft Bijli Yojana</strong>{' '}
                            application using your mobile number or reference ID.
                        </p>
                    </div>

                    {/* ── SEARCH BAR ── */}
                    <div className="w-full max-w-2xl relative z-20 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
                        <form onSubmit={handleSearch} className="relative">
                            {/* Ambient glow behind bar */}
                            <div className={`absolute -inset-3 rounded-[4rem] transition-opacity duration-500 blur-2xl bg-gradient-to-r from-accent/20 via-yellow-300/10 to-primary/15 ${focused ? 'opacity-100' : 'opacity-0'}`} />

                            <div className={`relative bg-white/90 backdrop-blur-sm shadow-xl border transition-all duration-300 flex items-center p-2.5 rounded-[3rem] gap-2 ${focused ? 'border-accent/40 shadow-[0_8px_40px_rgba(255,149,0,0.12)]' : 'border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.06)]'}`}>
                                <div className={`ml-3 transition-colors duration-300 ${focused ? 'text-accent' : 'text-slate-400'}`}>
                                    <Search size={22} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter mobile no. or reference ID…"
                                    className="flex-grow bg-transparent border-none focus:outline-none focus:ring-0 text-lg font-bold text-slate-800 placeholder:text-slate-300 min-w-0 pl-2"
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="relative overflow-hidden bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-white px-8 py-4 md:px-10 md:py-5 rounded-[3rem] font-black uppercase tracking-widest text-[11px] flex items-center gap-3 shadow-lg shadow-primary/25 active:scale-95 transition-all shrink-0 group/btn"
                                >
                                    {/* Shimmer overlay */}
                                    <span className="absolute inset-0 overflow-hidden rounded-[3rem]">
                                        <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                    </span>
                                    {isLoading
                                        ? <Loader2 className="w-5 h-5 animate-spin" />
                                        : <><span>Track Now</span><ChevronRight size={15} className="group-hover/btn:translate-x-1 transition-transform" /></>
                                    }
                                </button>
                            </div>
                        </form>

                        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-4">
                            Secure · Official Government Portal · 256-bit Encrypted
                        </p>
                    </div>

                    {/* ── RESULT PANEL ── */}
                    {queryId && !isLoading && trackingData?.success && (
                        <div className="w-full max-w-5xl animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out space-y-8">

                            {/* ── Top cards row ── */}
                            <div className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-6 items-stretch">

                                {/* Status Card */}
                                <div className="relative bg-white/90 backdrop-blur-sm rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_rgba(10,61,122,0.07)] p-8 md:p-10 overflow-hidden group hover:shadow-[0_16px_50px_rgba(10,61,122,0.12)] transition-all duration-500">
                                    {/* Corner glow */}
                                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/6 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000 pointer-events-none" />
                                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/4 rounded-full blur-2xl pointer-events-none" />

                                    <div className="relative z-10 flex flex-col gap-6 h-full">
                                        <span className="inline-flex items-center gap-1.5 bg-orange-50 text-accent text-[9px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-lg border border-orange-100 w-fit">
                                            <Activity size={10} /> Current Status
                                        </span>

                                        <div className="flex items-start gap-6 flex-grow">
                                            {/* Progress ring */}
                                            <ProgressRing step={currentStep} total={steps.length} />

                                            <div className="space-y-2 flex-1">
                                                <h2 className="text-3xl xl:text-4xl font-display font-black text-slate-900 leading-tight tracking-tight">
                                                    {trackingData.data.status}
                                                </h2>
                                                <p className="text-slate-500 font-medium text-base leading-relaxed">
                                                    {trackingData.data.meaning || 'Your solar energy journey has reached this successful milestone.'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Footer meta */}
                                        <div className="flex items-center flex-wrap gap-3 pt-5 border-t border-slate-50">
                                            <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-4 py-2 text-xs font-bold text-slate-700">
                                                <span className="w-2 h-2 rounded-full bg-success inline-block" />
                                                {trackingData.data.reference}
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                Updated {new Date(trackingData.data.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Beneficiary Card */}
                                <div className="relative bg-white/90 backdrop-blur-sm rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_rgba(10,61,122,0.07)] p-8 flex flex-col items-center justify-between gap-6 overflow-hidden group hover:shadow-[0_16px_50px_rgba(10,61,122,0.12)] transition-all duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/3 pointer-events-none" />

                                    <div className="relative flex flex-col items-center gap-4 w-full">
                                        {/* Avatar with golden ring */}
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 group-hover:scale-105 transition-transform duration-500 shadow-inner">
                                                <User size={38} strokeWidth={1.5} />
                                            </div>
                                            {/* Golden ring */}
                                            <div className="absolute -inset-1.5 rounded-full border-2 border-accent/40 pointer-events-none" style={{ animation: 'solarGlow 3s ease-in-out infinite' }} />
                                            {/* Verified badge */}
                                            <div className="absolute -bottom-1 -right-1 bg-success text-white rounded-full p-1.5 shadow-md">
                                                <ShieldCheck size={12} />
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1">Beneficiary</div>
                                            <div className="text-2xl font-display font-black text-slate-900 tracking-tight uppercase leading-tight">
                                                {trackingData.data.beneficiary}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative flex gap-3 w-full">
                                        <div className="flex-1 bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">District</div>
                                            <div className="text-sm font-bold text-slate-700 capitalize truncate">{trackingData.data.district || '—'}</div>
                                        </div>
                                        <div className="flex-1 bg-success/5 rounded-2xl p-4 text-center border border-success/10">
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Verified</div>
                                            <div className="text-sm font-bold text-success flex items-center justify-center gap-1">
                                                <ShieldCheck size={13} /> Govt
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── 9-Step Milestone Timeline ── */}
                            <div className="relative bg-white/90 backdrop-blur-sm rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_rgba(10,61,122,0.07)] p-8 md:p-12 overflow-hidden hover:shadow-[0_16px_50px_rgba(10,61,122,0.1)] transition-all duration-500">
                                {/* Top decoration */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

                                <div className="text-center mb-12 space-y-1.5">
                                    <div className="text-[10px] font-black text-accent uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                                        <Sparkles size={11} /> Progress Tracker
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-display font-black text-slate-900 tracking-tight">
                                        Solar Installation Milestones
                                    </h3>
                                    <p className="text-slate-400 text-sm font-medium">
                                        Step {currentStep} of {steps.length} completed
                                    </p>
                                </div>

                                {/* Desktop: horizontal grid · Mobile: 3-column grid */}
                                <div className="relative">
                                    {/* Connector track (desktop only) */}
                                    <div className="absolute top-9 left-[4%] right-[4%] h-[3px] bg-slate-100 rounded-full overflow-hidden hidden lg:block">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-in-out"
                                            style={{
                                                width: `${Math.max(0, Math.min(((currentStep - 1) / (steps.length - 1)) * 100, 100))}%`,
                                                background: 'linear-gradient(90deg, #FF9500, #FFD000)',
                                                backgroundSize: '200% 100%',
                                                animation: 'beamFlow 3s linear infinite',
                                            }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-6 lg:gap-3 relative">
                                        {steps.map((step, idx) => {
                                            const stepNum = idx + 1;
                                            const isCompleted = currentStep > stepNum;
                                            const isActive = currentStep === stepNum;
                                            const StepIcon = step.icon;

                                            return (
                                                <div key={idx} className="flex flex-col items-center gap-3">
                                                    {/* Node */}
                                                    <div className={`relative w-[4.5rem] h-[4.5rem] rounded-[1.25rem] flex items-center justify-center z-10 transition-all duration-500
                                                        ${isCompleted
                                                            ? 'bg-gradient-to-br from-accent to-yellow-400 text-white shadow-[0_4px_20px_rgba(255,149,0,0.35)] scale-90'
                                                            : isActive
                                                                ? 'bg-gradient-to-br from-primary to-primary-light text-white shadow-xl ring-4 ring-primary/20 scale-110'
                                                                : 'bg-white border-2 border-slate-100 text-slate-400 shadow-sm'
                                                        }`}
                                                    >
                                                        {isActive && <PulseRing />}

                                                        {isCompleted
                                                            ? <CheckCircle2 size={24} className="drop-shadow-sm" />
                                                            : <StepIcon size={22} className={isActive ? 'animate-pulse' : ''} />
                                                        }

                                                        {/* Step number dot */}
                                                        <span className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center shadow-sm
                                                            ${isCompleted ? 'bg-success text-white' : isActive ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                            {stepNum}
                                                        </span>
                                                    </div>

                                                    {/* Label */}
                                                    <div className="text-center space-y-0.5">
                                                        <div className={`text-[9px] font-black uppercase tracking-tight leading-tight
                                                            ${isActive ? 'text-primary' : isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                                                            {step.label}
                                                        </div>
                                                        <div className={`text-[8px] font-semibold uppercase tracking-wide
                                                            ${isActive ? 'text-accent' : 'text-slate-300'}`}>
                                                            {step.desc}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Mobile vertical progress bar */}
                                <div className="mt-8 lg:hidden">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Progress</span>
                                        <span className="text-[10px] font-black text-accent">{Math.round((currentStep / steps.length) * 100)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{
                                                width: `${(currentStep / steps.length) * 100}%`,
                                                background: 'linear-gradient(90deg, #FF9500, #FFD000)',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── ERROR STATE ── */}
                    {queryId && !isLoading && !trackingData?.success && (
                        <div className="w-full max-w-3xl animate-in zoom-in-95 fade-in duration-500">
                            <div className="relative bg-white/90 backdrop-blur-sm rounded-[3rem] border border-red-100 shadow-[0_8px_40px_rgba(239,68,68,0.08)] p-12 md:p-20 text-center overflow-hidden">
                                <div className="absolute -top-20 -left-20 w-64 h-64 bg-red-100/50 blur-[80px] rounded-full pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-sm">
                                        <Activity className="w-10 h-10 text-red-400" />
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-display font-black text-slate-900 mb-4 tracking-tight">
                                        ID Not Found
                                    </h2>
                                    <p className="text-slate-500 text-lg max-w-md mx-auto mb-10 font-medium">
                                        The reference <span className="text-slate-900 font-black">"{queryId}"</span> was not found in the government verification database. Please check and try again.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <button
                                            onClick={() => { setSearchId(''); setQueryId(''); }}
                                            className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-lg"
                                        >
                                            <ArrowLeft size={15} /> Try Another
                                        </button>
                                        <a href="/contact"
                                            className="inline-flex items-center justify-center px-10 py-4 rounded-full font-black text-[11px] uppercase tracking-widest text-slate-500 border border-slate-200 hover:border-slate-400 hover:text-slate-800 transition-all">
                                            Contact Support
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── PRE-SEARCH FEATURE CARDS ── */}
                    {!queryId && !isLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl animate-in fade-in duration-700 delay-300">
                            {[
                                {
                                    icon: <Database size={22} />,
                                    color: 'from-accent to-yellow-400',
                                    bg: 'bg-orange-50',
                                    border: 'border-orange-100',
                                    title: 'Real-time Sync',
                                    text: 'Direct API bridge to the MNRE solar portal — data updates within 60 seconds of any status change.',
                                    stat: '99.9%', statLabel: 'Uptime'
                                },
                                {
                                    icon: <ShieldCheck size={22} />,
                                    color: 'from-primary to-primary-light',
                                    bg: 'bg-blue-50',
                                    border: 'border-blue-100',
                                    title: 'Govt. Verified',
                                    text: 'Every record is cross-verified with the National Portal for PM Surya Ghar Muft Bijli Yojana.',
                                    stat: '100%', statLabel: 'Secure'
                                },
                                {
                                    icon: <Zap size={22} />,
                                    color: 'from-success to-emerald-400',
                                    bg: 'bg-green-50',
                                    border: 'border-green-100',
                                    title: 'Instant Updates',
                                    text: 'Receive instant milestone notifications for each of the 9 stages in your solar installation journey.',
                                    stat: '9', statLabel: 'Milestones'
                                },
                            ].map((item, i) => (
                                <div key={i} className="group relative bg-white/90 backdrop-blur-sm rounded-[2rem] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8 flex flex-col gap-5 hover:shadow-[0_12px_40px_rgba(10,61,122,0.09)] hover:-translate-y-1.5 transition-all duration-400 overflow-hidden">
                                    {/* Top gradient stripe */}
                                    <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.color} opacity-60`} />

                                    <div className={`w-14 h-14 rounded-2xl ${item.bg} border ${item.border} flex items-center justify-center text-slate-700 group-hover:scale-110 transition-transform duration-300`}>
                                        <div className={`bg-gradient-to-br ${item.color} bg-clip-text`}>
                                            {item.icon}
                                        </div>
                                    </div>

                                    <div className="space-y-2 flex-grow">
                                        <h4 className="text-lg font-display font-black text-slate-900">{item.title}</h4>
                                        <p className="text-slate-500 text-sm font-medium leading-relaxed">{item.text}</p>
                                    </div>

                                    <div className="border-t border-slate-50 pt-4 flex items-center gap-2">
                                        <span className={`text-2xl font-display font-black bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                                            {item.stat}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.statLabel}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </main>

            <Footer />
        </div>
    );
}
