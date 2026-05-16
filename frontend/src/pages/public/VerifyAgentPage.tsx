import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, ShieldAlert, ArrowLeft, MapPin, Calendar, Phone, PhoneCall, Droplets, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import SEOHead from '@/components/shared/SEOHead';

interface VerifiedAgent {
    name: string;
    agent_id: string;
    role: string;
    designation: string;
    photo_url: string | null;
    status: string;
    is_active: boolean;
    district: string;
    state: string;
    joining_date: string;
    clearance: string;
    mobile: string | null;
    blood_group: string | null;
    super_agent: {
        name: string;
        code: string;
    } | null;
}

export default function VerifyAgentPage() {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [agent, setAgent] = useState<VerifiedAgent | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { companyName } = useSettings();

    useEffect(() => {
        const verify = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/public/verify-agent/${token}`);
                if (response.data.success) {
                    setAgent(response.data.data);
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Verification failed. This QR code may be invalid.');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            verify();
        }
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#04111F] flex flex-col items-center justify-center p-6 text-white font-body">
                <Loader2 className="w-10 h-10 text-primary-light animate-spin mb-4" />
                <p className="text-slate-400 font-medium animate-pulse">Establishing Secure Connection...</p>
            </div>
        );
    }

    if (error || !agent) {
        return (
            <div className="min-h-screen bg-[#04111F] flex flex-col items-center justify-center p-6 text-white font-body">
                <div className="w-full max-w-md bg-red-500/10 border border-red-500/30 rounded-3xl p-8 text-center">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-display font-bold mb-3 text-red-500">Security Alert</h1>
                    <p className="text-slate-400 leading-relaxed mb-8">
                        {error || "We couldn't verify this agent's identity. The QR code may have been revoked or is invalid."}
                    </p>
                    <Link to="/" className="inline-flex items-center gap-2 text-primary-light font-bold hover:underline">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Homepage
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#04111F] flex flex-col items-center font-body pb-12">
            <SEOHead 
                title={`Agent Verification: ${agent.name} - PM Surya Ghar`} 
                description={`Official identity verification for ${agent.name} (${agent.agent_id}). Confirm the authenticity of ${companyName} field representatives.`}
                breadcrumbs={[
                    { name: 'Home', url: window.location.origin },
                    { name: 'Verify Agent', url: window.location.origin + '/verify-agent' }
                ]}
            />
            {/* Header */}
            <header className="w-full bg-primary py-4 px-6 border-b-4 border-accent shadow-lg flex items-center gap-4">
                <Link to="/" className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-display font-black text-primary text-xl shadow-inner">
                    ☀
                </Link>
                <div>
                    <h1 className="text-white font-display font-bold text-sm tracking-wide leading-tight uppercase">
                        {companyName}
                    </h1>
                    <p className="text-white/50 text-[10px] uppercase font-bold tracking-[2px]">Agent Identity Verification</p>
                </div>
            </header>

            {/* Status Banner */}
            <div className="w-full max-w-md px-4 mt-8">
                <div className={`
                    p-6 rounded-2xl flex items-center gap-4 border-2
                    ${agent.is_active
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-red-500/10 border-red-500/20'}
                `}>
                    <div className={`
                        w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0
                        ${agent.is_active ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}
                        shadow-lg
                    `}>
                        {agent.is_active ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
                    </div>
                    <div>
                        <h2 className={`text-lg font-black leading-tight ${agent.is_active ? 'text-emerald-500' : 'text-red-500'}`}>
                            {agent.is_active ? 'VERIFIED — ACTIVE AGENT' : 'AGENT ACCOUNT SUSPENDED'}
                        </h2>
                        <p className="text-slate-400 text-xs mt-1 leading-normal">
                            {agent.is_active
                                ? `This person is an officially authorized ${companyName} field partner.`
                                : "This agent's credentials have been suspended. Do not proceed with high-value transactions."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Profile Card */}
            <div className="w-full max-w-md px-4 mt-4">
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
                    {/* Identity Row */}
                    <div className="p-8 pb-6 border-b border-white/5 flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full border-2 border-accent p-1 shadow-xl shadow-accent/20 bg-gradient-to-br from-primary to-primary-dark overflow-hidden flex items-center justify-center">
                            {agent.photo_url ? (
                                <img src={agent.photo_url} alt={agent.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <span className="text-2xl font-display font-bold text-accent">
                                    {agent.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider truncate mb-1">
                                {agent.name}
                            </h3>
                            <p className="text-[10px] font-black text-accent tracking-[2px] uppercase">
                                {agent.designation}
                            </p>
                            <div className="inline-block mt-3 px-3 py-1 bg-primary rounded-lg text-white font-display font-bold text-[10px] tracking-widest">
                                {agent.agent_id}
                            </div>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="p-6 grid grid-cols-1 gap-1">
                        <InfoItem icon={<MapPin className="w-4 h-4" />} label="District / State" value={`${agent.district}, ${agent.state}`} />
                        <InfoItem icon={<ShieldCheck className="w-4 h-4 text-primary-light" />} label="Security Clearance" value={agent.clearance} />
                        <InfoItem icon={<Calendar className="w-4 h-4" />} label="Member Since" value={agent.joining_date} />
                        <InfoItem icon={<Phone className="w-4 h-4" />} label="Contact Reference" value={agent.mobile || 'N/A'} />
                        <InfoItem icon={<Droplets className="w-4 h-4 text-red-400" />} label="Blood Group" value={agent.blood_group || 'N/A'} />
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Account Access</span>
                                <span className={`text-xs font-bold uppercase ${agent.is_active ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {agent.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reporting Manager (If any) */}
            {agent.super_agent && (
                <div className="w-full max-w-md px-4 mt-4">
                    <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center text-xl">👤</div>
                        <div>
                            <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-0.5">Reporting Manager (BDM)</p>
                            <p className="text-white font-bold text-sm">{agent.super_agent.name}</p>
                            <p className="text-slate-500 text-[10px] font-mono mt-0.5">{agent.super_agent.code}</p>
                        </div>
                        <a href={`tel:${agent.super_agent.name}`} className="ml-auto w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center transition-transform active:scale-90">
                            <PhoneCall className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            )}

            {/* Verification Tagline */}
            <div className="w-full max-w-md px-6 mt-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-4">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Live Document Verification</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed max-w-[280px] mx-auto italic">
                    This verification result is generated in real-time from the {companyName} official portal.
                    Physical card must be cross-referenced with this digital identity.
                </p>
            </div>

            {/* Footer */}
            <footer className="mt-12 text-center">
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[4px] mb-2">{companyName}</p>
                <p className="text-[8px] text-slate-800 font-bold uppercase tracking-widest">PM Surya Ghar Facilitation Partner</p>
            </footer>
        </div>
    );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-start gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary-light flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider mb-0.5 leading-none">{label}</p>
                <p className="text-[13px] font-bold text-white/90 truncate">{value}</p>
            </div>
        </div>
    );
}
