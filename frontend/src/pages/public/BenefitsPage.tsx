import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicSettingsData } from '@/services/public.api';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import SEOHead from '@/components/shared/SEOHead';
import { 
    TrendingDown, 
    Leaf, 
    ShieldCheck, 
    Home, 
    IndianRupee, 
    Zap, 
    CheckCircle2, 
    ArrowRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BenefitsPage() {
    const { data: settings } = useQuery<PublicSettingsData>({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
    });

    const companyName = settings?.company_name || 'AndleebSurya';

    const benefits = [
        {
            icon: <TrendingDown className="w-12 h-12 text-blue-500" />,
            title: "Zero Electricity Bills",
            desc: "Generate up to 300 units of free electricity every month. For most Indian households, this effectively reduces monthly electricity bills to zero.",
            highlight: "Save up to ₹30,000/year"
        },
        {
            icon: <IndianRupee className="w-12 h-12 text-emerald-500" />,
            title: "Direct Govt. Subsidy",
            desc: "Get upfront financial assistance. The Government of India provides a direct subsidy of up to ₹94,800 per household for rooftop solar installation.",
            highlight: "Fixed Subsidy Rates"
        },
        {
            icon: <Leaf className="w-12 h-12 text-green-500" />,
            title: "Environmental Impact",
            desc: "Reduce your carbon footprint. A 3kW solar system is equivalent to planting approximately 150 trees over its lifetime.",
            highlight: "100% Clean Energy"
        },
        {
            icon: <Home className="w-12 h-12 text-orange-500" />,
            title: "Increase Property Value",
            desc: "Solar-equipped homes are valued higher and sell faster. It is a long-term asset with a lifespan of 25+ years.",
            highlight: "25-Year Durability"
        },
        {
            icon: <ShieldCheck className="w-12 h-12 text-purple-500" />,
            title: "Simplified Registration",
            desc: `Through ${companyName}, your entire journey from registration on the National Portal to installation is handled by verified experts.`,
            highlight: "Fully Verified Process"
        },
        {
            icon: <Zap className="w-12 h-12 text-yellow-500" />,
            title: "Energy Independence",
            desc: "Protected from future electricity tariff hikes. Generate your own power and enjoy uninterrupted energy security for decades.",
            highlight: "Grid Resilience"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <SEOHead 
                title="Benefits of PM Surya Ghar Muft Bijli Yojana" 
                description="Explore the massive financial and environmental benefits of the PM Surya Ghar scheme. Save on bills, get ₹94,800 subsidy, and switch to green energy." 
                breadcrumbs={[
                    { name: 'Home', url: window.location.origin },
                    { name: 'Benefits', url: window.location.origin + '/benefits-of-solar' }
                ]}
                schemas={[
                    {
                        "@context": "https://schema.org",
                        "@type": "Article",
                        "headline": "Top Benefits of PM Surya Ghar Muft Bijli Yojana",
                        "description": "Financial savings, government subsidies, and environmental impact of the rooftop solar scheme.",
                        "author": {
                            "@type": "Organization",
                            "name": companyName
                        }
                    }
                ]}
            />
            <Navbar />
            
            <main className="flex-grow">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-primary to-blue-900 text-white py-20 px-4 mt-[-1px]">
                    <div className="max-w-6xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black mb-6 tracking-tight">
                            Why Switch to <span className="text-accent underline decoration-accent/30 underline-offset-8">Solar</span>?
                        </h1>
                        <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                            PM Surya Ghar Muft Bijli Yojana is more than just a subsidy. It's a gateway to lifetime savings and energy freedom for 1 crore Indian households.
                        </p>
                    </div>
                </section>

                {/* Benefits Grid */}
                <section className="max-w-6xl mx-auto px-4 py-20">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {benefits.map((benefit, idx) => (
                            <div key={idx} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="mb-6 bg-slate-50 w-20 h-20 rounded-2xl flex items-center justify-center border border-slate-100">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-2xl font-display font-bold text-slate-900 mb-3">{benefit.title}</h3>
                                <p className="text-slate-600 mb-6 leading-relaxed text-sm">
                                    {benefit.desc}
                                </p>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                    <CheckCircle2 size={12} />
                                    {benefit.highlight}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Savings Snapshot */}
                <section className="bg-white py-20 border-y border-slate-100">
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden">
                            {/* Decoration */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[100px] rounded-full -mr-20 -mt-20" />
                            
                            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                                <div>
                                    <h2 className="text-3xl font-display font-bold mb-4 italic text-accent">Financial Snapshot</h2>
                                    <p className="text-slate-400 mb-8 leading-relaxed">
                                        For a standard 3kW household installation in India, the payback period is typically between 3 to 4 years, after which the electricity is virtually free for the remaining 20+ years of the system's life.
                                    </p>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-accent">
                                                <IndianRupee size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest leading-none mb-1">Max Subsidy</p>
                                                <p className="text-xl font-bold">₹94,800</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-blue-400">
                                                <Zap size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest leading-none mb-1">Free Units</p>
                                                <p className="text-xl font-bold">300 Units/mo</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                                    <h4 className="font-bold mb-4 text-center">ROI Example (3kW System)</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm py-2 border-b border-white/5">
                                            <span className="text-slate-400">System Cost (Avg)</span>
                                            <span className="font-bold">₹1,50,000</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-2 border-b border-white/5 text-emerald-400">
                                            <span>Less: Govt Subsidy</span>
                                            <span className="font-bold">- ₹94,800</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-2 border-b border-white/5 font-bold">
                                            <span>Net Homeowner Cost</span>
                                            <span>₹55,200</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-2 text-accent">
                                            <span>Est. Annual Savings</span>
                                            <span className="font-bold">~ ₹22,000</span>
                                        </div>
                                    </div>
                                    <div className="mt-8 text-center">
                                        <Link to="/solar-subsidy-calculator" className="inline-flex items-center gap-2 text-accent font-bold hover:underline">
                                            Calculate for your Bill <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="py-24 px-4 text-center">
                    <div className="max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-display font-black text-slate-900 mb-6">Start Your Journey Today</h2>
                        <p className="text-lg text-slate-600 mb-10">
                            Our verified agents are ready to help you navigate the subsidy application and technical assessment. Zero facilitation cost.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/#apply" className="bg-primary hover:bg-primary-dark text-white font-black uppercase tracking-widest px-10 py-5 rounded-2xl shadow-xl shadow-primary/20 transition-all">
                                Register Now
                            </Link>
                            <Link to="/scheme" className="bg-white border border-slate-200 text-slate-900 font-bold px-10 py-5 rounded-2xl hover:bg-slate-50 transition-all">
                                View Scheme Details
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            
            <Footer />
        </div>
    );
}
