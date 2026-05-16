import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import SEOHead from '@/components/shared/SEOHead';
import { Shield, Target, Users, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicSettingsData } from '@/services/public.api';

export default function AboutPage() {
    const { data: settings } = useQuery<PublicSettingsData>({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
    });

    const companyName = settings?.company_name || 'AndleebSurya';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
            <SEOHead 
                title={`About ${companyName} - Our Solar Mission`} 
                description={`Learn more about ${companyName}'s mission to accelerate India's transition to renewable energy through the PM Surya Ghar Muft Bijli Yojana.`} 
                breadcrumbs={[
                    { name: 'Home', url: window.location.origin },
                    { name: 'About', url: window.location.origin + '/about' }
                ]}
                schemas={[
                    {
                        "@context": "https://schema.org",
                        "@type": "AboutPage",
                        "name": `About ${companyName}`,
                        "description": `Empowering India with Solar Energy by acting as the bridge for the PM Surya Ghar Muft Bijli Yojana.`
                    }
                ]}
            />
            <Navbar />
            <main className="flex-grow w-full relative pb-20">
                {/* Decorative Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
                <div className="absolute top-0 right-0 w-1/2 h-96 bg-gradient-to-bl from-orange-100/50 via-white/10 to-transparent pointer-events-none blur-3xl rounded-bl-full" />
                <div className="absolute top-40 left-0 w-1/3 h-64 bg-gradient-to-tr from-sky-100/40 via-white/10 to-transparent pointer-events-none blur-3xl rounded-tr-full" />

                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
                    
                    {/* Hero Header */}
                    <div className="text-center max-w-3xl mx-auto mb-16 mt-8">
                        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200/60 rounded-full px-5 py-1.5 text-xs uppercase tracking-widest text-orange-600 font-black mb-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                            Our Story
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">{companyName}</span>
                        </h1>
                        <p className="text-lg md:text-2xl text-slate-500 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            Empowering India with clean, renewable energy by acting as the trusted bridge for the PM Surya Ghar Muft Bijli Yojana.
                        </p>
                    </div>

                    {/* Bento Box Grid */}
                    <div className="grid md:grid-cols-3 gap-6 mb-16">
                        <div className="md:col-span-2 bg-white/70 backdrop-blur-xl border border-slate-200/60 p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-700 transition-all hover:shadow-2xl hover:-translate-y-1">
                            <h2 className="text-3xl font-black mb-6 text-slate-800">Who We Are</h2>
                            <div className="prose prose-lg prose-slate text-slate-600 font-medium leading-relaxed">
                                <p>Welcome to <strong>{companyName}</strong>, your most trusted partner in navigating the PM Surya Ghar platform. We are a specialized ecosystem dedicated to connecting homeowners directly with qualified solar agents and facilitators.</p>
                                <p>Through our secure and state-of-the-art portal, we manage an expansive network of vetted Super Agents who assist citizens across the nation in assessing roof capacity, estimating exact bill savings, and seamlessly applying for government subsidies.</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-orange-500/20 text-white flex flex-col justify-between animate-in fade-in zoom-in-95 duration-1000 transition-all hover:shadow-2xl hover:scale-[1.02]">
                            <Target className="w-12 h-12 text-white/80 mb-8" />
                            <div>
                                <h3 className="text-2xl font-black mb-4">Our Mission</h3>
                                <p className="text-white/90 text-sm md:text-base font-medium leading-relaxed">
                                    To definitively accelerate India's transition to renewable energy in the most secure, transparent, and profitable way possible for the everyday household.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Value Pillars */}
                    <h2 className="text-3xl font-black text-center mb-10 text-slate-800">Core Pillars of Trust</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <Shield className="w-8 h-8 text-indigo-500" />,
                                title: "Secure & Reliable",
                                desc: "Enterprise-grade encryption and strict KYC processes guarantee complete peace of mind.",
                                color: "from-indigo-50 to-indigo-100/20",
                                border: "border-indigo-100",
                                iconBg: "bg-indigo-100"
                            },
                            {
                                icon: <Users className="w-8 h-8 text-emerald-500" />,
                                title: "Vetted Agents",
                                desc: "A massive, verified network of professionals ready to assist households end-to-end.",
                                color: "from-emerald-50 to-emerald-100/20",
                                border: "border-emerald-100",
                                iconBg: "bg-emerald-100"
                            },
                            {
                                icon: <Zap className="w-8 h-8 text-amber-500" />,
                                title: "Lightning Fast Processing",
                                desc: "Our platform ensures your subsidy application and feasibility approvals move swiftly.",
                                color: "from-amber-50 to-amber-100/20",
                                border: "border-amber-100",
                                iconBg: "bg-amber-100"
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className={`bg-gradient-to-br ${feature.color} backdrop-blur-md border ${feature.border} rounded-[2rem] p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
                                <div className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-3">{feature.title}</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
}
