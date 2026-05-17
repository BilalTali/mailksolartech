import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/public.api';
import { Shield, FileWarning, Eye, Database, Lock, Clock, Scale, Cookie, History, Mail } from 'lucide-react';

const getSetting = (settingsObj: any, key: string, fallback: string) => {
    return settingsObj?.[key] || fallback;
};

export default function PrivacyPolicyPage() {
    const { data: settings = {} } = useQuery({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
    });

    const companyName = getSetting(settings, 'company_name', 'MalikSolarTech');
    const companyEmail = getSetting(settings, 'company_email', 'support@MalikSolarTech.in');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
            <Helmet>
                <title>Privacy Policy — {companyName} | PM Surya Ghar</title>
                <meta name="description" content={`Read ${companyName}'s Privacy Policy to understand how we collect, use, and protect personal data for PM Surya Ghar applications.`} />
                <meta name="robots" content="noindex, follow" />
            </Helmet>
            <Navbar />
            
            <main className="flex-grow w-full relative pb-20">
                {/* Decorative Background */}
                <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-slate-200/50 to-transparent pointer-events-none" />
                <div className="absolute top-20 right-20 w-72 h-72 bg-blue-200/20 blur-3xl rounded-full pointer-events-none" />

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
                    
                    {/* Header */}
                    <div className="text-center mb-12 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-5 py-1.5 text-xs uppercase tracking-widest text-slate-600 font-black mb-6 shadow-sm">
                            <Shield className="w-4 h-4 text-blue-500" />
                            Legal Documentation
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-slate-800">
                            Privacy Policy
                        </h1>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                            Last Updated: May 10, 2026
                        </p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8 md:p-12 animate-in fade-in zoom-in-95 duration-1000">

                        <div className="bg-amber-50 text-amber-800 border border-amber-200/80 rounded-2xl p-5 md:p-6 mb-10 flex gap-4 items-start shadow-sm">
                            <div className="bg-amber-100 p-2 rounded-xl shrink-0 mt-0.5 text-amber-600">
                                <FileWarning className="w-5 h-5" />
                            </div>
                            <div className="text-sm leading-relaxed">
                                <strong>Important Disclaimer:</strong> {companyName} is a <strong>PRIVATE FACILITATION COMPANY</strong>, not a government body. We assist citizens in registering for the PM Surya Ghar Muft Bijli Yojana scheme. We are not officially affiliated with or endorsed by the Government of India, MNRE, or any government authority.
                            </div>
                        </div>

                        <div className="prose prose-slate prose-lg md:prose-xl max-w-none text-slate-600 font-medium">
                            
                            <section className="mb-12">
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-6 pb-2 border-b border-slate-100">
                                    <Eye className="w-6 h-6 text-blue-500" /> 1. Who We Are
                                </h2>
                                <p>
                                    {companyName} is a private entity that facilitates citizen registration for the PM Surya Ghar Muft Bijli Yojana. Our verified agents and managers securely guide beneficiaries through the application process on the official national portal.
                                </p>
                            </section>

                            <section className="mb-12">
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-6 pb-2 border-b border-slate-100">
                                    <Database className="w-6 h-6 text-indigo-500" /> 2. What Data We Collect
                                </h2>
                                <div className="grid md:grid-cols-2 gap-8 text-base">
                                    <div className="bg-slate-50 border border-slate-100 p-6 rounded-[1.5rem]">
                                        <h3 className="font-black text-slate-800 mb-4 text-lg">From Beneficiaries:</h3>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Name and Date of Birth</li>
                                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Contact (Mobile/Email)</li>
                                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Full Address Details</li>
                                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Encrypted Aadhaar Number</li>
                                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Electricity Consumer Number</li>
                                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Bank Account Details</li>
                                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Property Photographs</li>
                                        </ul>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 p-6 rounded-[1.5rem]">
                                        <h3 className="font-black text-slate-800 mb-4 text-lg">From Agents:</h3>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Full KYC Details</li>
                                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Encrypted PAN & Voter ID</li>
                                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Commission Bank Details</li>
                                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Profile Photos & Signatures</li>
                                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Educational Qualifications</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section className="mb-12">
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-6 pb-2 border-b border-slate-100">
                                    <Lock className="w-6 h-6 text-emerald-500" /> 3. Data Storage & Security
                                </h2>
                                <p className="mb-4">
                                    We employ enterprise-grade security protocols to protect your sensitive data:
                                </p>
                                <ul className="space-y-3">
                                    <li>Data is stored strictly on secure servers located within India.</li>
                                    <li>Sensitive fields (Aadhaar, Financials) are heavily encrypted at rest using AES-256.</li>
                                    <li>All network transmission is secured via HTTPS / modern TLS.</li>
                                    <li>Private documents are sandboxed and controlled via strict role-based access.</li>
                                </ul>
                            </section>

                            <section className="mb-12">
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-6 pb-2 border-b border-slate-100">
                                    <Clock className="w-6 h-6 text-amber-500" /> 4. Data Retention & DPDP Act 2023 Compliance
                                </h2>
                                <p>
                                    We retain your data for the duration of the scheme processing and up to 3 years post-completion for strictly regulatory audit purposes. Following this, you may exercise your right to request secure permanent deletion.
                                </p>
                                <div className="mt-4 bg-slate-50 border border-slate-100 p-6 rounded-[1.5rem]">
                                    <h3 className="font-black text-slate-800 mb-2 text-lg">Digital Personal Data Protection (DPDP) Act 2023</h3>
                                    <p className="text-sm">
                                        Our data processing strictly adheres to the DPDP Act 2023. You have the right to request a summary of the personal data processed by us and the identities of all Data Fiduciaries and Data Processors with whom the personal data has been shared.
                                    </p>
                                </div>
                            </section>

                            <section className="mb-12">
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-6 pb-2 border-b border-slate-100">
                                    <Database className="w-6 h-6 text-orange-500" /> 5. Third-Party Sharing
                                </h2>
                                <p>
                                    We strictly <strong>do not sell</strong> your data. Your data is only shared with:
                                </p>
                                <ul className="space-y-3 mt-4">
                                    <li><strong>Government Authorities:</strong> As strictly required to process your application on the PM Surya Ghar national portal.</li>
                                    <li><strong>Certified Installers:</strong> Only the technical team assigned to your property will receive your address and contact details to fulfill the installation.</li>
                                </ul>
                            </section>

                            <section className="mb-12">
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-6 pb-2 border-b border-slate-100">
                                    <Scale className="w-6 h-6 text-purple-500" /> 6. Your Rights
                                </h2>
                                <p>
                                    Under Indian data protection standards, you maintain the right to:
                                </p>
                                <ul className="space-y-3">
                                    <li><strong>Access:</strong> Request copies of the data we hold.</li>
                                    <li><strong>Correction:</strong> Fix inaccurate or stale information.</li>
                                    <li><strong>Withdrawal:</strong> Revoke consent for processing at any time.</li>
                                    <li><strong>Grievance:</strong> File a formal complaint regarding data mishandling.</li>
                                </ul>
                            </section>

                            <section className="mb-12">
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-6 pb-2 border-b border-slate-100">
                                    <Cookie className="w-6 h-6 text-rose-500" /> 6. Cookies Policy
                                </h2>
                                <p>
                                    We exclusively utilize session cookies and local storage tokens for strict authentication purposes. We absolutely <strong>do not</strong> use third-party tracking, advertising, or invasive analytics cookies across our portals.
                                </p>
                            </section>

                            <section className="mb-12">
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-6 pb-2 border-b border-slate-100">
                                    <History className="w-6 h-6 text-slate-500" /> 7. Policy Changes
                                </h2>
                                <p>
                                    We may update this Privacy Policy to reflect changing regulations. The "Last Updated" timestamp will reflect recent revisions.
                                </p>
                            </section>

                            <section>
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-6 pb-2 border-b border-slate-100">
                                    <Mail className="w-6 h-6 text-teal-500" /> 8. Contact Privacy Officer
                                </h2>
                                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-[1.5rem] p-6 text-base shadow-inner">
                                    <p className="font-black text-slate-800 mb-2">{companyName} — Data Privacy Desk</p>
                                    <p className="mb-1"><strong>Email:</strong> <a href={`mailto:${companyEmail}`} className="text-teal-600 underline font-bold">{companyEmail}</a></p>
                                    <p className="text-sm text-slate-500">SLA Response time: Within 7 business days</p>
                                </div>
                            </section>

                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
