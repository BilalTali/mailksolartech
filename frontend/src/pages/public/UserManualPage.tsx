import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/public.api';
import {
    BookOpen, CheckCircle, Info, ShieldAlert, ShieldCheck,
    MapPin, Calculator, Users, Trophy,
    LogIn, Sun, Star
} from 'lucide-react';

const getSetting = (settingsObj: any, key: string, fallback: string) => {
    return settingsObj?.[key] || fallback;
};

export default function UserManualPage() {
    const { data: settings = {} } = useQuery({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
    });

    const companyName = getSetting(settings, 'company_name', 'AndleebSurya');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
            <Helmet>
                <title>User Manual — {companyName} | PM Surya Ghar Guide</title>
                <meta name="description" content={`Complete digital manual for Citizens, BDEs, and BDMs using the ${companyName} facilitation portal.`} />
            </Helmet>
            <Navbar />

            <main className="flex-grow w-full relative pb-20">
                {/* Hero section */}
                <div className="relative bg-slate-900 pt-20 pb-24 border-b-4 border-sky-500 overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-l from-sky-500/20 to-transparent blur-3xl rounded-l-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-32 bg-indigo-500/30 blur-[80px] rounded-r-full pointer-events-none" />
                    
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sky-400 font-bold text-xs uppercase tracking-widest mb-6 shadow-sm backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <BookOpen className="w-4 h-4" /> Comprehensive Guide • v1.0
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-6 tracking-tight text-white animate-in fade-in slide-in-from-bottom-4 duration-700">
                            User <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Manual</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-300 max-w-2xl font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            The ultimate facilitation portal handbook for Citizens, Executives (BDE), and Team Managers (BDM).
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
                        {/* Static Sidebar Navigation */}
                        <aside className="lg:w-72 shrink-0 lg:sticky lg:top-24 h-fit hidden lg:block z-20">
                            <nav className="space-y-1 bg-white/70 backdrop-blur-xl p-5 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 animate-in fade-in slide-in-from-left-4 duration-700">
                                <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Navigation Chapters</p>
                                <a href="#intro" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all">
                                    <Info className="w-5 h-5 text-slate-400" /> 1. Introduction
                                </a>
                                <a href="#citizens" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                                    <MapPin className="w-5 h-5 text-slate-400" /> 2. For Citizens
                                </a>
                                <a href="#bde" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                    <Users className="w-5 h-5 text-slate-400" /> 3. Become a BDE
                                </a>
                                <a href="#bdm" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all">
                                    <Trophy className="w-5 h-5 text-slate-400" /> 4. BDM Guide
                                </a>
                                <a href="#dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
                                    <LogIn className="w-5 h-5 text-slate-400" /> 5. Using Portal
                                </a>
                            </nav>
                        </aside>

                        {/* Content Area */}
                        <div className="flex-grow animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            
                            <div className="bg-emerald-50 border border-emerald-200/80 rounded-[2rem] p-8 mb-12 flex items-start flex-col sm:flex-row gap-6 shadow-sm">
                                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/30">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className="text-emerald-900 font-black text-xl md:text-2xl mb-2 tracking-tight">100% FREE FACILITATION</h4>
                                    <p className="text-emerald-800 leading-relaxed font-medium">Our portal and agent facilitation service is definitively <strong>100% FREE</strong> for all beneficiaries. Registered {companyName} agents are strictly forbidden from charging applicants independent service fees.</p>
                                </div>
                            </div>

                            <div className="space-y-24">

                                <section id="intro" className="scroll-mt-32">
                                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-6 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-sky-100 text-sky-500 rounded-2xl flex items-center justify-center shadow-inner shrink-0">1</div>
                                        What is {companyName}?
                                    </h2>
                                    <div className="text-lg text-slate-600 font-medium leading-relaxed space-y-4">
                                        <p>
                                            {companyName} serves as a private digital integration layer that accelerates the PM Surya Ghar Muft Bijli Yojana journey for citizens. We bridge the gap between complex government portals and everyday households.
                                        </p>
                                        <p>
                                            Our ecosystem empowers verified Business Development Executives (BDEs) to seamlessly register applicants, conduct initial feasibility checks, and track subsidies—transparently and digitally.
                                        </p>
                                    </div>

                                    <div className="bg-rose-50 border border-rose-200 rounded-[2rem] p-8 my-8 text-rose-800 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert className="w-32 h-32" /></div>
                                        <div className="flex items-center gap-3 mb-4 font-black text-rose-600 text-lg uppercase tracking-widest relative z-10">
                                            <ShieldAlert className="w-6 h-6" /> Legal Reality Check
                                        </div>
                                        <p className="relative z-10 font-medium leading-relaxed text-lg">
                                            {companyName} acts exclusively as a <strong>PRIVATE FACILITATION PLATFORM</strong>. We are NOT a sovereign body nor an MNRE agency. For official government documentation, citizens must always refer to the national repository at <a href="https://pmsuryaghar.gov.in" target="_blank" rel="noreferrer" className="text-rose-700 font-black border-b border-rose-300 hover:border-rose-700 transition-colors">pmsuryaghar.gov.in</a>.
                                        </p>
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-800 mt-12 mb-8">Understanding the Core Metrics</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { icon: <Sun />, title: 'Free PV Panels', desc: 'Rooftop hardware installation', color: 'orange' },
                                            { icon: <Calculator />, title: '₹94,800 Subsidy', desc: 'Maximum generic subsidy', color: 'blue' },
                                            { icon: <CheckCircle />, title: '300 Free Units', desc: 'Estimated monthly generation', color: 'emerald' },
                                            { icon: <Star />, title: 'Earn Credits', desc: 'Net metering enabled', color: 'purple' },
                                        ].map((card, idx) => (
                                            <div key={idx} className={`bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm hover:shadow-lg transition-shadow border-t-4 border-t-${card.color}-400`}>
                                                <div className={`w-12 h-12 rounded-xl bg-${card.color}-50 text-${card.color}-500 flex items-center justify-center mb-4 inner-shadow`}>
                                                    {card.icon}
                                                </div>
                                                <h4 className="font-black text-slate-800 text-lg mb-1">{card.title}</h4>
                                                <p className="text-sm font-medium text-slate-500">{card.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-6 font-bold uppercase tracking-widest">
                                        * Subject to Central Government directives and state sub-allocations.
                                    </p>
                                </section>


                                <section id="citizens" className="scroll-mt-32">
                                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-10 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">2</div>
                                        For Citizens — Getting Started
                                    </h2>
                                    
                                    <div className="relative pl-6 md:pl-10 space-y-12 before:absolute before:left-[19px] md:before:left-[35px] before:top-4 before:bottom-4 before:w-1 before:bg-gradient-to-b before:from-emerald-300 before:to-teal-500 before:rounded-full">
                                        {[
                                            { s: 1, t: "Information Query", d: "Initiate contact via this portal's digital lead forms." },
                                            { s: 2, t: "Agent Handshake", d: "A registered local executive calls you to schedule an inspection." },
                                            { s: 3, t: "Document Check", d: "Compile Aadhaar, Consumer Electricity Bill, and Bank proofs." },
                                            { s: 4, t: "Registration", d: "Our agent files the initial application directly onto the National Portal." },
                                            { s: 5, t: "Site Feasibility", d: "Empanelled technical vendors survey your roof load constraints." },
                                            { s: 6, t: "Grid Synchronization", d: "Panels are activated with DISCOM net-metering components." }
                                        ].map(step => (
                                            <div key={step.s} className="relative bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 lg:p-8 ml-6">
                                                <div className="absolute -left-[54px] md:-left-[70px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white border-4 border-slate-50 shadow-md flex items-center justify-center font-black text-lg text-emerald-600 z-10">
                                                    {step.s}
                                                </div>
                                                <h4 className="font-black text-xl text-slate-800 mb-2">{step.t}</h4>
                                                <p className="text-base font-medium text-slate-500 leading-relaxed">{step.d}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 mt-16 shadow-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
                                            <ShieldAlert size={160} />
                                        </div>
                                        <h4 className="text-white text-2xl m-0 flex items-center gap-3 mb-4 font-black">
                                            <ShieldAlert size={28} className="text-amber-400" /> Verify Your Agent
                                        </h4>
                                        <p className="text-slate-300 text-lg leading-relaxed font-medium m-0 max-w-2xl relative z-10">
                                            Demand to scan the QR code printed on the agent's ID Card. The code must resolve directly to a live verification page hosted strictly on <code className="bg-black/30 px-2 py-1 rounded-md text-sky-300">andleebsurya.in/verify</code>.
                                        </p>
                                    </div>
                                </section>

                                <section id="bde" className="scroll-mt-32">
                                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-8 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">3</div>
                                        Become an Executive (BDE)
                                    </h2>
                                    <p className="text-lg text-slate-600 font-medium leading-relaxed mb-10">
                                        Act as the primary catalyst bringing solar capability to households. Business Development Executives earn direct performance-based milestone commissions for every successful portal registration.
                                    </p>

                                    <div className="grid lg:grid-cols-2 gap-8">
                                        <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 shadow-sm">
                                            <h4 className="font-black text-slate-800 text-xl border-b border-slate-100 pb-4 mb-6">Enrollment Criteria</h4>
                                            <ul className="space-y-4 font-medium text-slate-600">
                                                <li className="flex gap-4 items-center"><CheckCircle className="w-6 h-6 text-blue-500 shrink-0" /> Resident of operational territory</li>
                                                <li className="flex gap-4 items-center"><CheckCircle className="w-6 h-6 text-blue-500 shrink-0" /> Verified PAN & Authentic Aadhaar linking</li>
                                                <li className="flex gap-4 items-center"><CheckCircle className="w-6 h-6 text-blue-500 shrink-0" /> Active bank account for Direct Benefit Transfer</li>
                                                <li className="flex gap-4 items-center"><CheckCircle className="w-6 h-6 text-blue-500 shrink-0" /> Functional smartphone with internet access</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 shadow-sm">
                                            <h4 className="font-black text-slate-800 text-xl border-b border-slate-100 pb-4 mb-6">Core Perks</h4>
                                            <ul className="space-y-4 font-medium text-slate-600">
                                                <li className="flex gap-4 items-center"><Trophy className="w-6 h-6 text-orange-500 shrink-0" /> Paid Milestone Commissions</li>
                                                <li className="flex gap-4 items-center"><ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" /> Verified Cryptographic Digital ID Card</li>
                                                <li className="flex gap-4 items-center"><MapPin className="w-6 h-6 text-purple-500 shrink-0" /> Exclusive Area Mapping Privileges</li>
                                                <li className="flex gap-4 items-center"><CheckCircle className="w-6 h-6 text-sky-500 shrink-0" /> Automatic Contest Participations</li>
                                            </ul>
                                        </div>
                                    </div>
                                </section>

                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
