import { useState } from 'react';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import SEOHead from '@/components/shared/SEOHead';
import { HelpCircle, ChevronDown, MessageCircleQuestion } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicSettingsData } from '@/services/public.api';

const defaultFaqs = [
    {
        q: "What is PM Surya Ghar Muft Bijli Yojana?",
        a: "PM Surya Ghar Muft Bijli Yojana is a central government initiative aimed at providing free electricity up to 300 units every month to households across India by subsidizing the installation of rooftop solar panels."
    },
    {
        q: "Who is eligible for the solar subsidy?",
        a: "Any Indian citizen owning a house with a solid roof, a valid electricity connection, and no prior solar subsidy from the government is eligible for this scheme."
    },
    {
        q: "What is the maximum subsidy amount available?",
        a: "The maximum government subsidy is capped at ₹94,800 for residential rooftop solar systems of 3 kW or higher capacity."
    },
    {
        q: "How many free electricity units will I get?",
        a: "Homes installing appropriate capacity solar panels can generate enough power to offset their consumption, resulting in up to 300 units of free electricity every month."
    },
    {
        q: "What documents are required for application?",
        a: "You need an electricity bill (recent 6 months), Aadhaar card, PAN card, a passport-sized photograph, bank passbook copy, and a cancelled cheque."
    },
    {
        q: "Can I install solar panels in an apartment?",
        a: "Yes, provided you have roof rights or a no-objection certificate (NOC) from your housing society or Resident Welfare Association (RWA)."
    },
    {
        q: "How long does the installation process take?",
        a: "From registration to final grid commissioning (net metering), the typical timeline is 30 to 45 days, depending on DISCOM approvals."
    },
    {
        q: "Do I have to pay the full amount upfront?",
        a: "No. You can either self-finance the remaining amount or apply for low-interest loans specifically tailored for this scheme by major banks."
    },
    {
        q: "What is Net Metering?",
        a: "Net metering is a billing mechanism that credits solar energy system owners for the electricity they add to the grid. If you generate more than you consume, it is sent to the grid and adjusted in your bill."
    },
    {
        q: "What happens during a power cut?",
        a: "Grid-tied solar systems automatically switch off during grid failures to protect line workers (anti-islanding). You would need a hybrid system with battery storage if you want power during cuts."
    },
    {
        q: "Is there a warranty on the solar panels?",
        a: "Yes, Empaneled vendors provide a 5-year comprehensive maintenance contract (CMC) for the entire system, and panels typically have a 25-year performance warranty."
    },
];

export default function FaqPage() {
    const { data: settings } = useQuery<PublicSettingsData>({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
    });

    const companyName = settings?.company_name || 'AndleebSurya';

    const agencyFaqs = [
        {
            q: `Does ${companyName} charge any fee for registration?`,
            a: `No, ${companyName} provides absolute free registration and guidance services. Our trained agents help you navigate the process without any overarching service fees from the consumer.`
        },
        {
            q: "How do I become an Agent (Business Development Executive)?",
            a: "You can click on the 'Agent Login' button on our website, fill out the KYC details, and our admins will review and approve your application to start earning."
        },
        {
            q: "How are agents compensated?",
            a: "Agents receive attractive commissions for every successful rooftop solar installation they facilitate. Payments are transferred directly to their bank accounts after successful project milestones."
        }
    ];

    const faqs = [...defaultFaqs, ...agencyFaqs];

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
            <SEOHead
                title={`Frequently Asked Questions - ${companyName}`}
                description="Find answers to all your questions about PM Surya Ghar Muft Bijli Yojana, solar subsidies, eligibility criteria, and the installation process."
                keywords="PM Surya Ghar FAQ, solar subsidy questions, Muft Bijli Yojana eligibility, rooftop solar FAQ India"
                schemas={[faqSchema]}
                breadcrumbs={[
                    { name: 'Home', url: window.location.origin },
                    { name: 'FAQ', url: window.location.origin + '/faq' },
                ]}
            />

            <Navbar />
            
            <main className="flex-grow w-full relative pb-20">
                {/* Decorative Background */}
                 <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
                 <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-200/30 to-purple-200/20 blur-3xl rounded-full pointer-events-none" />

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
                    
                    {/* Header */}
                    <div className="text-center mb-16 mt-8">
                        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200/60 rounded-full px-5 py-1.5 text-xs uppercase tracking-widest text-indigo-600 font-black mb-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <HelpCircle className="w-4 h-4" />
                            Help Center
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Questions</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            Find clear, concise answers to all your queries regarding the PM Surya Ghar scheme and our facilitation services.
                        </p>
                    </div>

                    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 p-6 md:p-10 animate-in fade-in zoom-in-95 duration-700">
                        <div className="space-y-4">
                            {faqs.map((faq, index) => {
                                const isOpen = openIndex === index;
                                return (
                                    <div 
                                        key={index} 
                                        className={`rounded-2xl transition-all duration-300 overflow-hidden border ${isOpen ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <button
                                            onClick={() => toggleFaq(index)}
                                            className="w-full text-left p-6 flex justify-between items-center gap-4 focus:outline-none"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-xl shrink-0 transition-colors ${isOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    <MessageCircleQuestion className="w-5 h-5" />
                                                </div>
                                                <h3 className={`font-black text-lg transition-colors ${isOpen ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                    {faq.q}
                                                </h3>
                                            </div>
                                            <div className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`}>
                                                <ChevronDown className="w-5 h-5" />
                                            </div>
                                        </button>
                                        
                                        <div 
                                            className={`transition-all duration-300 ease-in-out px-6 md:px-20 ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'}`}
                                        >
                                            <p className="text-slate-600 font-medium leading-relaxed">
                                                {faq.a}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-12 text-center bg-indigo-50 border border-indigo-100 rounded-3xl p-8 animate-in fade-in zoom-in-95 duration-1000">
                        <p className="text-indigo-900 font-bold text-lg mb-2">Still have questions?</p>
                        <p className="text-indigo-700/80 font-medium mb-6">Our support team is just an email or call away.</p>
                        <a href="/contact" className="inline-block bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-indigo-600/40 transition-all hover:-translate-y-0.5">
                            Contact Support
                        </a>
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
}
