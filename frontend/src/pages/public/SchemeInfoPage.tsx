import { Sun, CheckCircle, FileText, ExternalLink, AlertTriangle, Zap, IndianRupee, LayoutList, Home } from 'lucide-react';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import SEOHead from '@/components/shared/SEOHead';
import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicSettingsData } from '@/services/public.api';



const documents = [
    'Aadhaar Card (Resident of J&K or Ladakh)',
    'Latest Electricity Bill (with consumer number)',
    'Property ownership proof or landlord\'s NOC',
    'Passport-size photograph',
    'Bank passbook / cancelled cheque (for subsidy credit)',
    'PAN Card (for subsidy amounts above ₹50,000)',
];

export default function SchemeInfoPage() {
    const { data: settings } = useQuery<PublicSettingsData>({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
    });

    const companyName = settings?.company_name || 'AndleebSurya';

    const steps = [
        { step: '01', title: 'Submit Your Query', desc: 'Fill the form on our website with your name, mobile, and district. Zero cost, takes 2 minutes.' },
        { step: '02', title: 'Agent Calls You', desc: `A verified ${companyName} agent contacts you within 24 hours to understand your requirement.` },
        { step: '03', title: 'Document Collection', desc: 'Agent helps you compile required documents and checks your eligibility for the scheme.' },
        { step: '04', title: 'National Portal Registration', desc: 'Your application is submitted on the official pmsuryaghar.gov.in portal seamlessly.' },
        { step: '05', title: 'Site Feasibility', desc: 'An empanelled installation vendor surveys your rooftop and provides capacity recommendation.' },
        { step: '06', title: 'Solar Installation', desc: 'Solar panels are installed by the government-empanelled vendor without any hassle.' },
        { step: '07', title: 'Net Meter & Subsidy', desc: 'Net meter is installed. Government subsidy of up to ₹94,800 is credited directly to your bank account.' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
            <SEOHead 
                title={`PM Surya Ghar Muft Bijli Yojana — Free Solar Scheme Info`} 
                description={`Everything about PM Surya Ghar Muft Bijli Yojana — free solar panels, ₹94,800 government subsidy, eligibility for J&K and Ladakh residents. Documents, process, benefits explained via ${companyName}.`}
                keywords="PM Surya Ghar, Muft Bijli Yojana, free solar panels J&K, solar subsidy Jammu Kashmir, MNRE scheme, rooftop solar Ladakh"
                breadcrumbs={[
                    { name: 'Home', url: window.location.origin },
                    { name: 'Scheme Info', url: window.location.origin + '/scheme' }
                ]}
                schemas={[
                    {
                        "@context": "https://schema.org",
                        "@type": "Article",
                        "headline": "PM Surya Ghar Muft Bijli Yojana — Free Solar Scheme Info",
                        "description": `Get free solar panels with up to ₹94,800 government subsidy under PM Surya Ghar Muft Bijli Yojana. ${companyName} helps J&K and Ladakh residents register.`,
                        "author": {
                            "@type": "Organization",
                            "name": companyName
                        }
                    }
                ]}
            />
            <Navbar />

            <main className="flex-grow w-full relative pb-24">
                {/* Decorative Background Mesh */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

                {/* Hero Header */}
                <div className="relative pt-24 pb-20 px-4 text-center">
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-orange-200/40 to-rose-200/20 blur-3xl rounded-full pointer-events-none" />
                    <div className="absolute top-10 left-1/4 w-72 h-72 bg-gradient-to-tr from-sky-200/40 to-indigo-200/20 blur-3xl rounded-full pointer-events-none" />
                    
                    <div className="max-w-4xl mx-auto relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md border border-slate-200 shadow-sm rounded-full px-5 py-2 text-sm font-bold text-slate-600 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <Sun className="w-4 h-4 text-orange-500" />
                            Government of India Flagship Scheme
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-6 tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700">
                            PM Surya Ghar <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-600">Muft Bijli Yojana</span>
                        </h1>
                        <p className="text-lg md:text-2xl text-slate-500 font-medium leading-relaxed max-w-3xl mx-auto mb-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            Free rooftop solar installation with up to <strong className="text-slate-800">₹94,800 subsidy</strong> for eligible households across India.
                        </p>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            {companyName} acts as a facilitation gateway
                        </p>
                    </div>
                </div>

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

                    {/* Disclaimer */}
                    <div className="bg-amber-50/80 backdrop-blur-md border border-amber-200/80 rounded-[2rem] p-6 lg:px-8 flex flex-col md:flex-row gap-5 items-center md:items-start shadow-sm animate-in fade-in zoom-in-95 duration-[800ms]">
                        <div className="bg-amber-100 p-3 rounded-2xl flex-shrink-0 text-amber-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="text-sm md:text-base text-amber-800 font-medium leading-relaxed">
                            <strong>Disclaimer: {companyName} is a private facilitation company, not a government entity.</strong> We assist residents in navigating the official PM Surya Ghar registration process smoothly. The actual scheme and subsidies are provided directly by the Government of India. Official registration portal: {' '}
                            <a href="https://pmsuryaghar.gov.in" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-amber-900 border-b border-amber-900/30 hover:border-amber-900 transition-colors">
                                pmsuryaghar.gov.in <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>

                    {/* What is the scheme */}
                    <section className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[2.5rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center">
                                <Home className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800">What is the Scheme?</h2>
                        </div>
                        <p className="text-lg text-slate-600 font-medium leading-relaxed mb-10">
                            PM Surya Ghar Muft Bijli Yojana is a visionary Government of India scheme launched in February 2024. Residential households receive free rooftop solar panel installations along with a direct government subsidy. The scheme specifically aims to provide up to 300 units of free electricity per month to 1 crore households nationwide.
                        </p>
                        <div className="grid sm:grid-cols-3 gap-6">
                            <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-6 text-center transition-all hover:bg-sky-50 hover:border-sky-100">
                                <div className="w-14 h-14 mx-auto bg-sky-100 text-sky-500 rounded-2xl flex items-center justify-center mb-4">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <p className="font-black text-xl text-slate-800 mb-2">300 Units/Month</p>
                                <p className="text-sm font-medium text-slate-500">Free electricity for eligible residential homes</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-6 text-center transition-all hover:bg-emerald-50 hover:border-emerald-100">
                                <div className="w-14 h-14 mx-auto bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                                    <IndianRupee className="w-6 h-6" />
                                </div>
                                <p className="font-black text-xl text-slate-800 mb-2">Up to ₹94,800</p>
                                <p className="text-sm font-medium text-slate-500">Capped central subsidy limit directly to bank</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-6 text-center transition-all hover:bg-orange-50 hover:border-orange-100">
                                <div className="w-14 h-14 mx-auto bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mb-4">
                                    <Sun className="w-6 h-6" />
                                </div>
                                <p className="font-black text-xl text-slate-800 mb-2">Zero Cost Help</p>
                                <p className="text-sm font-medium text-slate-500">No hidden fees for our portal facilitation service</p>
                            </div>
                        </div>
                    </section>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Eligibility */}
                        <section className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full">
                            <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-indigo-500" />
                                Who is Eligible?
                            </h2>
                            <ul className="space-y-5">
                                {[
                                    'Residential electricity consumers with an active connection',
                                    'Must own the property or have the owner\'s stamped written consent',
                                    'Resident operating within applicable state jurisdictions',
                                    'Must not have previously availed rooftop solar subsidy',
                                    'No active arrears on past electricity bills',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="bg-indigo-100 shrink-0 p-1 rounded-full mt-0.5">
                                            <CheckCircle className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <span className="text-slate-600 font-medium leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Documents */}
                        <section className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full">
                            <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                                <FileText className="w-6 h-6 text-rose-500" />
                                Documents Required
                            </h2>
                            <ul className="space-y-4">
                                {documents.map((doc) => (
                                    <li key={doc} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:border-rose-100">
                                        <FileText className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                        <span className="text-slate-600 font-medium leading-relaxed">{doc}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>

                    {/* Process Timeline */}
                    <section className="bg-gradient-to-b from-slate-900 to-indigo-950 rounded-[2.5rem] p-8 md:p-14 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                        <h2 className="text-3xl font-black text-white mb-10 flex items-center gap-4">
                            <LayoutList className="w-8 h-8 text-indigo-400" />
                            How the Process Works
                        </h2>
                        <div className="grid gap-6">
                            {steps.map((s, idx) => (
                                <div key={s.step} className="flex gap-5 md:gap-8 items-start group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-[1rem] bg-indigo-500/20 text-indigo-300 font-black flex items-center justify-center shrink-0 border border-indigo-400/30 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300 shadow-inner">
                                            {s.step}
                                        </div>
                                        {idx !== steps.length - 1 && (
                                            <div className="w-0.5 h-12 bg-indigo-500/20 mt-4 group-hover:bg-indigo-400/50 transition-colors" />
                                        )}
                                    </div>
                                    <div className="pt-2 pb-6">
                                        <p className="text-xl font-bold text-white mb-2">{s.title}</p>
                                        <p className="text-indigo-200/70 font-medium leading-relaxed text-sm md:text-base">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="bg-gradient-to-r from-orange-500 to-rose-600 rounded-[2.5rem] p-10 md:p-16 text-white text-center shadow-2xl shadow-orange-500/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)] pointer-events-none" />
                        <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Ready to Apply?</h2>
                        <p className="text-white/90 mb-10 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
                            {companyName} helps you complete the precise registration process — absolutely free. Provide your basic details and an agent will personally guide you within 24 hours.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <a href="/#apply" className="bg-white text-orange-600 shadow-xl shadow-black/10 hover:shadow-2xl hover:scale-105 font-black px-8 py-4 rounded-2xl transition-all duration-300 text-lg w-full sm:w-auto">
                                Apply Now — Free
                            </a>
                            <a href="https://pmsuryaghar.gov.in" target="_blank" rel="noopener noreferrer" className="bg-black/20 backdrop-blur-md border border-white/20 hover:bg-black/30 hover:border-white/40 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 text-lg flex items-center justify-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                <ExternalLink className="w-5 h-5" /> Official Gov Portal
                            </a>
                        </div>
                    </section>

                </div>
            </main>
            <Footer />
        </div>
    );
}
