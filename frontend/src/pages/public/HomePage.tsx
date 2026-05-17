import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/public.api';
import { Link } from 'react-router-dom';
import {
    CheckCircle2, XCircle, Sun, IndianRupee, Zap, Home, BarChart3, ArrowRight,
    PhoneCall, ClipboardList, Building2, Sparkles, Briefcase, Trophy, Users, Plus,
    MessageSquare, Camera, Shield, Mail, Calendar, MapPin, FileText
} from 'lucide-react';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import LeadForm from '@/components/shared/LeadForm';
import HeroSection from '@/components/public/HeroSection';
import AchievementsSection from '@/components/public/AchievementsSection';
import FeedbackSection from '@/components/public/FeedbackSection';
import SEOHead from '@/components/shared/SEOHead';
import AnimatedStat from '@/components/shared/AnimatedStat';


// Dynamic Subsidy and Eligibility logic defined inside component using CMS settings

// Will be defined dynamically inside the component


type EligibilityAnswer = 'yes' | 'no' | 'unanswered';

const IconMap: Record<string, any> = {
    IndianRupee, Zap, Home, BarChart3, ClipboardList, PhoneCall, Building2, Sun, Sparkles, CheckCircle2, Plus, Users, Trophy, Briefcase, MessageSquare, Camera, Shield, Mail, Calendar, MapPin, FileText
};

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    const Icon = IconMap[name] || Sun;
    return <Icon className={className} />;
};


// Helper function to extract settings safely
const getSetting = (settingsObj: any, key: string, fallback: string) => {
    return settingsObj?.[key] || fallback;
};

export default function HomePage() {
    const { data: settings = {} } = useQuery({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
    });

    // Eligibility and Calculator data are now fetched and parsed belowdynamically from settings

    const [submittedRef, setSubmittedRef] = useState<string | null>(null);
    const [eligAnswers, setEligAnswers] = useState<Record<string, EligibilityAnswer>>({});

    // Scroll to Lead Form if #lead-form or ref is present
    useEffect(() => {
        const hash = window.location.hash;
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');

        if (hash === '#lead-form' || ref) {
            // Wait slightly for dynamic content to render
            setTimeout(() => {
                const element = document.getElementById('lead-form');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 500);
        }
    }, []);

    // 1. Parse dynamic Eligibility Questions
    const eligibilityQuestions = (() => {
        try {
            const json = (settings as any).eligibility_questions_json;
            if (json) {
                const parsed = JSON.parse(json);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) { }
        return [
            { id: 'q1', text: 'Do you own the house where solar panels will be installed?', expected: 'yes' },
            { id: 'q2', text: 'Do you have an active electricity connection in your name?', expected: 'yes' },
            { id: 'q3', text: 'Do you have a valid Aadhaar-linked bank account?', expected: 'yes' },
            { id: 'q4', text: 'Have you NOT availed any solar subsidy before?', expected: 'yes' },
        ];
    })();

    // 2. Parse dynamic calculation data
    const activeSubsidyData: any[] = (() => {
        try {
            const json = (settings as any).calculator_values_json;
            if (json) {
                const parsed = JSON.parse(json);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) { }
        return [
            { id: '3kw', label: '3KW System', central: 94800, state: 0, savings: 1800, payback: 48 },
            { id: 'above_3kw', label: 'Above 3kW System', central: 94800, state: 0, savings: 2400, payback: 42 },
        ];
    })();

    // 3. Parse dynamic hero stats
    const heroStats = (() => {
        try {
            const json = (settings as any).hero_stats_json;
            if (json) {
                const parsed = JSON.parse(json);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) { }
        return [
            { icon: 'IndianRupee', value: '₹94,800', label: 'Max Subsidy' },
            { icon: 'Zap', value: '300 Units', label: 'Free / Month' },
            { icon: 'Home', value: '1 Crore+', label: 'Target Homes' },
            { icon: 'BarChart3', value: '25 Years', label: 'Panel Life' },
        ];
    })();

    // 4. Parse dynamic How It Works
    const howItWorks = (() => {
        try {
            const json = (settings as any).how_it_works_json;
            if (json) {
                const parsed = JSON.parse(json);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) { }
        return [
            { icon: 'ClipboardList', step: '1', title: 'Submit Query', desc: 'Fill our simple form with your details' },
            { icon: 'PhoneCall', step: '2', title: 'We Call You', desc: 'Our team calls within 24 hours' },
            { icon: 'Building2', step: '3', title: 'Govt Registration', desc: 'We register you on pmsuryaghar.gov.in' },
            { icon: 'Sun', step: '4', title: 'Installation', desc: 'Solar panels installed at your home' },
            { icon: 'Zap', step: '5', title: 'Free Electricity', desc: 'Enjoy up to 300 units free every month!' },
        ];
    })();

    // 5. Parse dynamic Why Choose Us
    const whyChooseUs = (() => {
        try {
            const json = (settings as any).why_choose_us_json;
            if (json) {
                const parsed = JSON.parse(json);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) { }
        return [
            { icon: 'Sparkles', title: 'Free Guidance', desc: 'No charges from beneficiaries. Our service is completely free for homeowners.' },
            { icon: 'Zap', title: 'Faster Registration', desc: 'We handle all paperwork and portal registration so you don\'t have to.' },
            { icon: 'PhoneCall', title: 'End-to-End Support', desc: 'From application to installation, we stay with you throughout the entire process.' },
        ];
    })();

    const [capacitySelected, setCapacitySelected] = useState<string>(activeSubsidyData[0]?.id || '3kw');

    // Eligibility logic: fail if any answer doesn't match expected. Succeed if all match.
    const isUserIneligible = eligibilityQuestions.some(q =>
        eligAnswers[q.id] && eligAnswers[q.id] !== 'unanswered' && eligAnswers[q.id] !== q.expected
    );
    const isUserEligible = eligibilityQuestions.length > 0 && eligibilityQuestions.every(q =>
        eligAnswers[q.id] === q.expected
    );
    const showResult = isUserEligible || isUserIneligible;

    const subsidyData = activeSubsidyData.find(opt => opt.id === capacitySelected) || activeSubsidyData[0] || { central: 0, state: 0, savings: 0, payback: 0 };
    const totalSubsidy = (Number(subsidyData.central) || 0) + (Number(subsidyData.state) || 0);

    return (
        <div className="min-h-screen bg-white">
            <SEOHead 
                title="PM Surya Ghar Muft Bijli Yojana - Free Solar Subsidy" 
                description="Apply for PM Surya Ghar Muft Bijli Yojana. Get up to ₹94,800 subsidy and 300 units of free electricity per month. Free registration and expert guidance."
                breadcrumbs={[
                    { name: 'Home', url: window.location.origin }
                ]}
                schemas={[
                    {
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "url": window.location.origin,
                        "name": getSetting(settings, 'company_name', 'MalikSolarTech'),
                        "description": "Official portal facilitator for PM Surya Ghar Muft Bijli Yojana details and subsidies."
                    }
                ]}
            />
            <Navbar />

            {/* HERO — CMS Controlled */}
            <HeroSection />

            {/* STATS BAR */}
            <section className="bg-primary-light py-5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-white text-center">
                        {heroStats.map((stat, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1">
                                <div className="text-accent">
                                    <DynamicIcon name={stat.icon} className="w-5 h-5" />
                                </div>
                                <AnimatedStat valueString={stat.value} className="font-display font-bold text-2xl" />
                                <div className="text-white/70 text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" className="py-20 bg-neutral-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="font-display font-bold text-3xl text-dark mb-3">{getSetting(settings, 'label_how_it_works', 'How It Works')}</h2>
                        <p className="text-neutral-600 max-w-xl mx-auto">Five simple steps from application to free electricity</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 items-center gap-6">
                        {howItWorks.map((step, i, arr) => (
                            <div key={i} className="flex items-center gap-4 w-full h-full">
                                <div className="flex-1 flex flex-col items-center text-center p-5 bg-white rounded-card shadow-card h-full">
                                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3">
                                        <DynamicIcon name={step.icon} className="w-7 h-7" />
                                    </div>
                                    <div className="font-display font-semibold text-primary text-sm mb-1">Step {step.step}</div>
                                    <div className="font-display font-bold text-dark text-base mb-1">{step.title}</div>
                                    <div className="text-neutral-600 text-xs">{step.desc}</div>
                                </div>
                                {i < arr.length - 1 && <ArrowRight className="hidden lg:block w-6 h-6 text-neutral-600 shrink-0" />}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ACHIEVEMENTS — CMS Controlled */}
            <AchievementsSection />

            {/* ELIGIBILITY CHECKER */}
            <section id="eligibility" className="py-20 bg-neutral-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="font-display font-bold text-3xl text-dark mb-3">
                            {getSetting(settings, 'eligibility_headline', 'Check Your Eligibility')}
                        </h2>
                        <p className="text-neutral-600">
                            {getSetting(settings, 'eligibility_subheadline', 'Answer 4 quick questions to find out if you qualify')}
                        </p>
                    </div>
                    <div className="card">
                        <div className="flex flex-col gap-4">
                            {eligibilityQuestions.map((q) => (
                                <div key={q.id} className="flex items-center justify-between gap-4 p-4 bg-neutral-50 rounded-xl">
                                    <p className="text-sm font-medium text-dark flex-1">{q.text}</p>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => setEligAnswers(prev => ({ ...prev, [q.id]: 'yes' }))} className={`px-4 py-1.5 rounded-pill text-sm font-medium border transition-all ${eligAnswers[q.id] === 'yes' ? 'bg-success text-white border-success' : 'border-gray-200 text-neutral-600 hover:border-success hover:text-success'}`}>Yes</button>
                                        <button onClick={() => setEligAnswers(prev => ({ ...prev, [q.id]: 'no' }))} className={`px-4 py-1.5 rounded-pill text-sm font-medium border transition-all ${eligAnswers[q.id] === 'no' ? 'bg-danger text-white border-danger' : 'border-gray-200 text-neutral-600 hover:border-danger hover:text-danger'}`}>No</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {showResult && (
                            <div className={`mt-6 p-6 rounded-2xl border-2 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 ${isUserEligible ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                                {isUserEligible ? <CheckCircle2 className="w-8 h-8 shrink-0 text-green-600 mt-1" /> : <XCircle className="w-8 h-8 shrink-0 text-red-600 mt-1" />}
                                <div>
                                    <h3 className="font-display font-bold text-xl mb-1">
                                        {isUserEligible
                                            ? getSetting(settings, 'eligibility_success_title', '✅ You are Eligible for PM Surya Ghar!')
                                            : getSetting(settings, 'eligibility_error_title', '⚠️ You might not be eligible')}
                                    </h3>
                                    <p className="text-sm opacity-90 leading-relaxed whitespace-pre-line">
                                        {isUserEligible
                                            ? getSetting(settings, 'eligibility_success_desc', 'Great news! You meet the basic criteria. Please fill the Lead Form below and our team will guide you through the entire free installation process.')
                                            : getSetting(settings, 'eligibility_error_desc', 'Based on your answers, you may not qualify for the government subsidy at this moment. However, please contact our support team as there may still be other options available for you.')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* SUBSIDY CALCULATOR */}
            <section id="calculator" className="py-20">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="font-display font-bold text-3xl text-dark mb-3">
                            {getSetting(settings, 'calculator_headline', 'Subsidy Calculator')}
                        </h2>
                        <p className="text-neutral-600">
                            {getSetting(settings, 'calculator_subheadline', 'See how much you can save based on your system size')}
                        </p>
                    </div>
                    <div className="card">
                        <label className="label">Select System Capacity</label>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                            {activeSubsidyData.map((opt) => (
                                <button key={opt.id} onClick={() => setCapacitySelected(opt.id)} className={`py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all ${capacitySelected === opt.id ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-gray-200 text-neutral-600 hover:border-primary/50'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-green-50 rounded-xl p-4 text-center">
                                <IndianRupee className="w-6 h-6 text-success mx-auto mb-2" />
                                <div className="font-display font-bold text-2xl text-success">₹{totalSubsidy.toLocaleString()}</div>
                                <div className="text-xs text-neutral-600 mt-1">Total Combined Subsidy</div>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-4 text-center">
                                <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
                                <div className="font-display font-bold text-2xl text-primary">₹{subsidyData.savings}/mo</div>
                                <div className="text-xs text-neutral-600 mt-1">Estimated Monthly Savings</div>
                            </div>
                            <div className="bg-orange-50 rounded-xl p-4 text-center col-span-2 md:col-span-1">
                                <BarChart3 className="w-6 h-6 text-accent mx-auto mb-2" />
                                <div className="font-display font-bold text-2xl text-accent">{subsidyData.payback} months</div>
                                <div className="text-xs text-neutral-600 mt-1">Estimated Payback Period</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* LEAD FORM */}
            <section id="lead-form" className="py-20 bg-neutral-50">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="font-display font-bold text-3xl text-dark mb-3">{getSetting(settings, 'label_apply_title', 'Apply for Free Solar Electricity')}</h2>
                        <p className="text-neutral-600">{getSetting(settings, 'label_apply_desc', 'Fill the form below and our team will call you within 24 hours')}</p>
                    </div>
                    {submittedRef ? (
                        <div className="card text-center py-10">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-success" />
                            </div>
                            <h3 className="font-display font-bold text-xl text-dark mb-2">Request Received!</h3>
                            <p className="text-neutral-600 mb-4">We'll call you within 24 hours. Your reference number:</p>
                            <div className="font-mono font-bold text-primary bg-primary/5 rounded-lg px-4 py-2 inline-block text-sm">{submittedRef}</div>
                            <button onClick={() => setSubmittedRef(null)} className="btn-ghost block mt-6 mx-auto">Submit Another Query</button>
                        </div>
                    ) : (
                        <div className="bg-white/50 backdrop-blur-xl rounded-3xl p-6 md:p-10 shadow-xl border border-white/40">
                            <LeadForm role="public" onSuccess={(res: any) => setSubmittedRef(res.data?.reference || 'OK')} />
                        </div>
                    )}
                </div>
            </section>

            {/* FEEDBACK — CMS Controlled */}
            <FeedbackSection />

            {/* WHY CHOOSE US */}
            <section className="py-20 bg-neutral-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="font-display font-bold text-3xl text-dark mb-3">Why Choose {getSetting(settings, 'company_name', 'SuryaMitra')}?</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {whyChooseUs.map((item, idx) => (
                            <div key={idx} className="card hover:shadow-lg transition-shadow">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                                    <DynamicIcon name={item.icon} className="w-7 h-7" />
                                </div>
                                <h3 className="font-display font-bold text-lg text-dark mb-2">{item.title}</h3>
                                <p className="text-neutral-600 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* JOIN OUR TEAM */}
            <section className="py-20 bg-gradient-to-b from-slate-900 to-[#020617] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 blur-[120px] rounded-full -ml-48 -mb-48" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="max-w-xl">
                            <h2 className="font-display font-bold text-4xl md:text-5xl mb-6 leading-tight">
                                Launch Your Career in <span className="text-accent underline decoration-accent/30 underline-offset-8">Solar Energy</span>
                            </h2>
                            <p className="text-white/70 text-lg mb-8 leading-relaxed">
                                Join India's largest solar mission. Work as an Enumerator, conduct site surveys to help families get approved, and earn attractive daily commissions for every successful survey.
                            </p>
                            <div className="grid grid-cols-2 gap-6 mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-accent">
                                        <Briefcase className="w-5 h-5" />
                                    </div>
                                    <span className="font-semibold">Flexible Work</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-accent">
                                        <Trophy className="w-5 h-5" />
                                    </div>
                                    <span className="font-semibold">High Incentives</span>
                                </div>
                            </div>
                            <Link
                                to="/enumerator/register"
                                className="inline-flex items-center gap-3 bg-white text-slate-900 hover:bg-accent hover:text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 group shadow-2xl shadow-white/5"
                            >
                                {getSetting(settings, 'label_become_enumerator', 'Apply as Enumerator')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <div className="w-full md:w-1/3 aspect-square bg-gradient-to-br from-white/10 to-transparent rounded-[2.5rem] border border-white/10 flex items-center justify-center relative group">
                            <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Users size={120} className="text-white/20 group-hover:text-accent/40 transition-colors" />
                            <div className="absolute -bottom-6 -right-6 bg-accent p-6 rounded-3xl shadow-2xl">
                                <Plus size={32} className="text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            <Footer />
        </div>
    );
}
