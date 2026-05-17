import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/public.api';
import { ScrollText, AlertTriangle, ShieldCheck, FileWarning, EyeOff, Gavel, Scale, Mail } from 'lucide-react';

const getSetting = (settingsObj: any, key: string, fallback: string) => {
    return settingsObj?.[key] || fallback;
};

export default function TermsConditionsPage() {
    const { data: settings = {} } = useQuery({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
    });

    const companyName = getSetting(settings, 'company_name', 'MalikSolarTech');
    const companyEmail = getSetting(settings, 'company_email', 'support@MalikSolarTech.in');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
            <Helmet>
                <title>Terms & Conditions — {companyName} | PM Surya Ghar Integration</title>
                <meta name="description" content={`Read ${companyName}'s Terms & Conditions. ${companyName} is a private facilitation company helping citizens register for PM Surya Ghar.`} />
                <meta name="robots" content="noindex, follow" />
            </Helmet>
            <Navbar />
            
            <main className="flex-grow w-full relative pb-20">
                {/* Decorative Background */}
                <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-slate-200/50 to-transparent pointer-events-none" />
                <div className="absolute top-20 right-20 w-72 h-72 bg-rose-200/20 blur-3xl rounded-full pointer-events-none" />

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
                    
                    {/* Header */}
                    <div className="text-center mb-12 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-5 py-1.5 text-xs uppercase tracking-widest text-slate-600 font-black mb-6 shadow-sm">
                            <ScrollText className="w-4 h-4 text-rose-500" />
                            Terms of Service
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-slate-800">
                            Terms &amp; Conditions
                        </h1>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                            Last Updated: May 10, 2026
                        </p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8 md:p-12 animate-in fade-in zoom-in-95 duration-1000">

                        <div className="bg-rose-50 text-rose-800 border border-rose-200/80 rounded-2xl p-5 md:p-6 mb-10 flex gap-4 items-start shadow-sm">
                            <div className="bg-rose-100 p-2 rounded-xl shrink-0 mt-0.5 text-rose-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="text-sm leading-relaxed">
                                <strong>Important Declaration:</strong> {companyName} operates as a <strong>PRIVATE FACILITATION SERVICE</strong>. We are absolutely NOT affiliated with or endorsed by the Government of India, MNRE, or any state nodal body. The PM Surya Ghar Muft Bijli Yojana is a government initiative — {companyName} purely assists in the digital application lifecycle.
                            </div>
                        </div>

                        <div className="prose prose-slate prose-lg md:prose-xl max-w-none text-slate-600 font-medium">

                            <section className="mb-12">
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-6 pb-2 border-b border-slate-100">
                                    <ShieldCheck className="w-6 h-6 text-emerald-500" /> 1. Service Description & Scope
                                </h2>
                                <p>
                                    {companyName} provides a <strong>free facilitation desk</strong> helping residents across operational states securely track and register for the PM Surya Ghar Muft Bijli Yojana. Our certified Business Executives navigate households through the complex documentation mapping without levying software usage charges to the beneficiary.
                                </p>
                            </section>

                            <section className="mb-12">
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-6 pb-2 border-b border-slate-100">
                                    <FileWarning className="w-6 h-6 text-red-500" /> 2. No Fee Policy — CRITICAL
                                </h2>
                                <div className="bg-emerald-50 border border-emerald-200 rounded-[1rem] p-5 mb-4 shadow-inner">
                                    <p className="font-black text-emerald-800 text-base m-0 flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5" />
                                        {companyName} does NOT charge beneficiaries any direct monetary fee for portal facilitation processing.
                                    </p>
                                </div>
                                <p>
                                    The PM Surya Ghar Muft Bijli Yojana provides solar subsidization — <strong>upfront processing payments are entirely prohibited</strong>. Should anyone demanding representation invoke fees, report them immediately to <a href={`mailto:${companyEmail}`} className="text-red-500 underline">{companyEmail}</a>. This is classified as fraud.
                                </p>
                            </section>

                            <section className="mb-12">
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-6 pb-2 border-b border-slate-100">
                                    <EyeOff className="w-6 h-6 text-purple-500" /> 3. Agent Code of Conduct
                                </h2>
                                <p className="mb-4">
                                   Agents registered into our hierarchy operate under profound strictness. They will never:
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4 text-base">
                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-[1rem]">
                                        <p className="font-bold text-slate-700 m-0 text-sm">Demand applicant payment for simple portal submission tasks.</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-[1rem]">
                                        <p className="font-bold text-slate-700 m-0 text-sm">Promise aggressive or unrealistic vendor installation turnarounds.</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-[1rem]">
                                        <p className="font-bold text-slate-700 m-0 text-sm">Impersonate direct authorities or central MNRE operatives.</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-[1rem]">
                                        <p className="font-bold text-slate-700 m-0 text-sm">Possess or harvest original hardcopy identity documents.</p>
                                    </div>
                                </div>
                            </section>

                            <section className="mb-12">
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-6 pb-2 border-b border-slate-100">
                                    <Scale className="w-6 h-6 text-amber-500" /> 4. Subsidy Disclaimers
                                </h2>
                                <p className="mb-4">
                                    Exact subvention capital under the Yojana is directly authorized by MNRE benchmarks and state treasury pipelines. Our generic calculations display idealized slabs:
                                </p>
                                <ul className="space-y-2">
                                    {(() => {
                                        try {
                                            const json = (settings as any).calculator_values_json;
                                            if (json) {
                                                const parsed = JSON.parse(json);
                                                if (Array.isArray(parsed)) {
                                                    return parsed.map((item: any) => (
                                                        <li key={item.id} className="flex items-center gap-3 text-base">
                                                            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                                            {item.label}: ₹{((Number(item.central) || 0) + (Number(item.state) || 0)).toLocaleString()} {item.id.includes('above') ? '(Max Expected Ceiling)' : ''}
                                                        </li>
                                                    ));
                                                }
                                            }
                                        } catch (e) { }
                                        return (
                                            <li className="flex items-center gap-3 text-base">
                                                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                                3 kW & Above Parameter: ₹94,800 subsidy expected threshold
                                            </li>
                                        );
                                    })()}
                                </ul>
                            </section>

                            <section className="mb-12">
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-6 pb-2 border-b border-slate-100">
                                    <Gavel className="w-6 h-6 text-blue-500" /> 5. Liability Capping
                                </h2>
                                <p className="mb-4">
                                    As pure integration mediators, {companyName} relinquishes liability concerning:
                                </p>
                                <ul className="space-y-3">
                                    <li>Rejections dispatched by governmental backend validation logic.</li>
                                    <li>Volatile adjustments enacted against the overall PM Surya Ghar mandate.</li>
                                    <li>SLA failures by physical installation vendor franchisees.</li>
                                    <li>Disruptive outages experienced against the central pmsuryaghar.gov.in domain.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-6 pb-2 border-b border-slate-100">
                                    <Mail className="w-6 h-6 text-slate-500" /> 6. Governance & Contact
                                </h2>
                                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-[1.5rem] p-6 text-base shadow-inner">
                                    <p className="font-black text-slate-800 mb-2">{companyName} — Legal Compliance Desk</p>
                                    <p className="mb-1"><strong>Email Protocol:</strong> <a href={`mailto:${companyEmail}`} className="text-slate-600 underline font-bold">{companyEmail}</a></p>
                                    <p className="text-sm text-slate-500">Notice to Cure: 14 business days</p>
                                    <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                                        Use of this portal signifies unequivocal adherence to the aforementioned clauses. Disputes fall exclusively under the jurisdiction of standard Indian arbitration protocols.
                                    </p>
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
