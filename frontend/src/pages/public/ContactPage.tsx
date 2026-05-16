import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import SEOHead from '@/components/shared/SEOHead';
import { Mail, Phone, MapPin, MessageSquare, Headphones } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicSettingsData } from '@/services/public.api';

export default function ContactPage() {
    const { data: settings } = useQuery<PublicSettingsData>({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
    });

    const companyEmail = settings?.company_email || 'support@andleebsurya.in';
    const companyMobile = settings?.company_mobile || '+91-XXXXXXXXXX';
    const companyAddress = settings?.company_address || 'Registered Office';
    const companyName = settings?.company_name || 'AndleebSurya';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
            <SEOHead 
                title="Contact Us - PM Surya Ghar Assistance" 
                description="Get in touch with our support team for any queries regarding PM Surya Ghar Muft Bijli Yojana, solar subsidies, or agent registrations." 
                breadcrumbs={[
                    { name: 'Home', url: window.location.origin },
                    { name: 'Contact', url: window.location.origin + '/contact' }
                ]}
                schemas={[
                    {
                        "@context": "https://schema.org",
                        "@type": "ContactPage",
                        "mainEntity": {
                            "@type": "Organization",
                            "contactPoint": {
                                "@type": "ContactPoint",
                                "telephone": companyMobile,
                                "email": companyEmail,
                                "contactType": "customer service"
                            }
                        }
                    }
                ]}
            />
            <Navbar />
            <main className="flex-grow w-full relative pb-20">
                {/* Decorative Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-96 bg-gradient-to-b from-indigo-100/50 via-white/10 to-transparent pointer-events-none blur-3xl rounded-b-full" />

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
                    
                    {/* Hero Header */}
                    <div className="text-center max-w-3xl mx-auto mb-16 mt-8">
                        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200/60 rounded-full px-5 py-1.5 text-xs uppercase tracking-widest text-indigo-600 font-black mb-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                            We're Here For You
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Touch</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-2xl mx-auto">
                            Whether you're a homeowner exploring solar or a professional joining our network, our dedicated support team is ready to help.
                        </p>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid lg:grid-cols-5 gap-8">

                        {/* Contact Cards */}
                        <div className="lg:col-span-3 grid sm:grid-cols-2 gap-6">
                            
                            {/* Email */}
                            <a href={`mailto:${companyEmail}`} className="group bg-white/70 backdrop-blur-xl border border-slate-200/60 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col transition-all duration-300 hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 block animate-in fade-in zoom-in-95 duration-700">
                                <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">Email Support</h3>
                                <p className="text-slate-500 font-medium text-sm mb-6 flex-grow">General queries, platform assistance, and partnership details.</p>
                                <span className="text-indigo-600 font-bold overflow-hidden text-ellipsis w-full">{companyEmail}</span>
                            </a>

                            {/* Phone */}
                            <a href={`tel:${companyMobile}`} className="group bg-white/70 backdrop-blur-xl border border-slate-200/60 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col transition-all duration-300 hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 block animate-in fade-in zoom-in-95 duration-[800ms]">
                                <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">Helpline Call</h3>
                                <p className="text-slate-500 font-medium text-sm mb-6 flex-grow">Speak directly to an expert. Available Mon-Sat (9 AM - 6 PM).</p>
                                <span className="text-emerald-600 font-bold overflow-hidden text-ellipsis w-full">{companyMobile}</span>
                            </a>

                            {/* Location */}
                            <div className="sm:col-span-2 group bg-white/70 backdrop-blur-xl border border-slate-200/60 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 transition-all duration-300 hover:border-slate-300 animate-in fade-in zoom-in-95 duration-[900ms]">
                                <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl shrink-0 flex items-center justify-center transition-transform group-hover:bg-orange-500 group-hover:text-white">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-xl font-black text-slate-800 mb-2">Registered Office</h3>
                                    <p className="text-slate-500 font-medium">{companyAddress}</p>
                                </div>
                            </div>
                        </div>

                        {/* Dedicated Agent Support Panel */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-8 duration-700">
                            {/* Decorative background glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/20 blur-[80px] rounded-full pointer-events-none" />
                            
                            <div className="relative z-10 flex-grow flex flex-col">
                                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-8 border border-white/10">
                                    <Headphones className="w-6 h-6 text-indigo-300" />
                                </div>
                                <h3 className="text-2xl font-black mb-4">Dedicated Agent Support</h3>
                                <p className="text-indigo-100/80 font-medium leading-relaxed mb-8 flex-grow">
                                    If you are an existing agent experiencing issues with your dashboard, lead tracking, or commission payouts on <strong>{companyName}</strong>, please utilize the internal ticketing system.
                                </p>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex gap-4 items-start backdrop-blur-sm">
                                    <MessageSquare className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5" />
                                    <div className="text-sm font-medium text-indigo-100/90 leading-relaxed">
                                        Log into your agent portal to submit a <strong>Feedback Ticket</strong> for prioritized technical resolution.
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
