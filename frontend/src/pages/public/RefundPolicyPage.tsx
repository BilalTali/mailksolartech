import { Helmet } from 'react-helmet-async';
import { ShieldCheck, AlertTriangle, Phone, Mail, Receipt, Briefcase } from 'lucide-react';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/public.api';

const getSetting = (s: any, k: string, fb: string) => s?.[k] || fb;

export default function RefundPolicyPage() {
    const { data: settings = {} } = useQuery({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
    });

    const companyName = getSetting(settings, 'company_name', 'MalikSolarTech');
    const companyEmail = getSetting(settings, 'company_email', 'support@MalikSolarTech.in');
    const companyMobile = getSetting(settings, 'company_mobile', '+91-XXXXXXXXXX');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
            <Helmet>
                <title>Refund & Cancellation Policy — {companyName} | No-Fee Guarantee</title>
                <meta name="description" content={`${companyName} guarantees no fee for PM Surya Ghar facilitation. Read our zero-fee refund policy and learn how to report scheme fraud securely.`} />
                <meta name="robots" content="noindex, follow" />
            </Helmet>
            <Navbar />
            
            <main className="flex-grow w-full relative pb-20">
                {/* Decorative Background */}
                <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-slate-200/50 to-transparent pointer-events-none" />
                <div className="absolute top-20 right-20 w-72 h-72 bg-emerald-200/20 blur-3xl rounded-full pointer-events-none" />

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
                    
                    {/* Header */}
                    <div className="text-center mb-12 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-5 py-1.5 text-xs uppercase tracking-widest text-slate-600 font-black mb-6 shadow-sm">
                            <Receipt className="w-4 h-4 text-emerald-500" />
                            Financial Policy
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-slate-800">
                            Refund &amp; Cancellation
                        </h1>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                            Last Updated: May 10, 2026
                        </p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8 md:p-12 animate-in fade-in zoom-in-95 duration-1000">

                        <div className="space-y-12">

                            {/* Core ZERO FEE statement */}
                            <div className="bg-emerald-50 border border-emerald-200/80 rounded-[1.5rem] p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-start shadow-sm transition-all hover:shadow-md">
                                <div className="bg-emerald-100 p-3 rounded-2xl shrink-0 mt-1 shadow-inner group transition-transform hover:scale-110">
                                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="font-black text-emerald-900 text-xl md:text-2xl mb-3">{companyName} is a ZERO-FEE Service</h2>
                                    <p className="text-emerald-800 font-medium text-base md:text-lg leading-relaxed mb-4">
                                        As a dedicated assistance portal, {companyName} <strong>strictly does not solicit or charge any monetary fee</strong> from citizens to facilitate PM Surya Ghar Muft Bijli Yojana integrations. 
                                    </p>
                                    <div className="inline-flex items-center bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl text-emerald-700 font-bold border border-emerald-100">
                                        Therefore, absolutely no consumer refunds apply.
                                    </div>
                                    <p className="text-emerald-700/80 font-medium text-sm mt-4">
                                        The respective government bodies cover subsidy capital directly. We never invoice the homeowner.
                                    </p>
                                </div>
                            </div>

                            {/* Fraud warning block */}
                            <div className="bg-rose-50 border border-rose-200/80 rounded-[1.5rem] p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-start shadow-sm relative overflow-hidden">
                                {/* Danger Stripes */}
                                <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)] pointer-events-none" />
                                
                                <div className="bg-rose-100 p-3 rounded-2xl shrink-0 mt-1 shadow-inner relative z-10 transition-transform hover:rotate-12 hover:scale-110">
                                    <AlertTriangle className="w-8 h-8 text-rose-600" />
                                </div>
                                <div className="relative z-10">
                                    <h2 className="font-black text-rose-900 text-xl md:text-2xl mb-3">Report Extortion & Fraud Immediately</h2>
                                    <p className="text-rose-800 font-medium text-base mb-4 leading-relaxed">
                                        If an operative or person claiming to represent our network demands capital for identifying themselves as a gateway:
                                    </p>
                                    <ul className="grid sm:grid-cols-2 gap-3 mb-6">
                                        {[
                                            'Initial Processing & Registration Fees',
                                            'Mandatory Document Assessment Costs',
                                            'Rooftop Survey & Evaluation Fines',
                                            'Expedited Portal Queue Charges',
                                        ].map((item, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-rose-700 font-medium text-sm bg-rose-100/50 p-2 rounded-lg border border-rose-200/50">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="inline-flex items-center bg-rose-600 text-white px-5 py-3 rounded-xl font-bold uppercase tracking-wide text-xs shadow-lg shadow-rose-600/20">
                                        Consider this High-Level Fraud. Report Immediately.
                                    </div>
                                </div>
                            </div>

                            {/* Contact Module */}
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="bg-slate-50 border border-slate-200/60 rounded-[1.5rem] p-8 flex flex-col text-center items-center transition-all hover:bg-white hover:shadow-lg hover:-translate-y-1">
                                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-5">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-black text-slate-800 text-lg mb-2">Direct Phone Line</h3>
                                    <p className="text-slate-500 font-medium text-sm mb-6">Immediate escalations during business hours.</p>
                                    <a href={`tel:${companyMobile}`} className="mt-auto text-blue-600 font-black text-lg hover:text-blue-700 transition-colors">
                                        {companyMobile}
                                    </a>
                                </div>
                                
                                <div className="bg-slate-50 border border-slate-200/60 rounded-[1.5rem] p-8 flex flex-col text-center items-center transition-all hover:bg-white hover:shadow-lg hover:-translate-y-1">
                                    <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-5">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-black text-slate-800 text-lg mb-2">Anti-Fraud Desk Mail</h3>
                                    <p className="text-slate-500 font-medium text-sm mb-6">Send explicit evidence of extortion securely.</p>
                                    <a href={`mailto:${companyEmail}`} className="mt-auto text-indigo-600 font-bold overflow-hidden text-ellipsis max-w-full hover:text-indigo-700 transition-colors">
                                        {companyEmail}
                                    </a>
                                </div>
                            </div>

                            {/* Agent commission section */}
                            <div className="border-t border-slate-200/80 pt-10">
                                <h2 className="flex items-center gap-3 text-xl font-black text-slate-800 mb-4">
                                    <Briefcase className="w-5 h-5 text-slate-400" /> Commission Queries (Agents Only)
                                </h2>
                                <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 border border-slate-100 rounded-2xl p-6">
                                    Registered Business Development Executives (SM-XXXX) and Managers experiencing latency in milestone commission processing are advised to raise a ticket. Email <a href={`mailto:${companyEmail}`} className="text-blue-600 font-bold hover:underline">{companyEmail}</a> with your exact Agent ID and Lead ID matrix. Validated dispute settlements trigger within 5-7 business working days upon verification against MNRE execution lists.
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
