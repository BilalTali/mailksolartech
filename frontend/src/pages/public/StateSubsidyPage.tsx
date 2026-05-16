import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import SEOHead from '@/components/shared/SEOHead';
import { Map, Info, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicSettingsData } from '@/services/public.api';

// Realistic state-level subsidy data roughly mirroring India's PM Surya Ghar top-ups
const stateSubsidies = [
    { state: 'Uttar Pradesh', topUp: '₹30,000', conditional: 'Additional state top-up available for residential rooftop solar. Above 3kW max ₹94,800 + state share.', extra: true },
    { state: 'Delhi', topUp: '₹2,000/kW', conditional: 'Maximum capping of ₹10,000 for residential systems up to 5kW.', extra: true },
    { state: 'Haryana', topUp: '₹10,000/kW', conditional: 'Targeted mainly at extremely weak income groups with strict limits.', extra: true },
    { state: 'Gujarat', topUp: 'Nil', conditional: 'No discrete state top-up, but streamlined DISCOM approvals through SURYA GUJARAT portal.', extra: false },
    { state: 'Maharashtra', topUp: 'Nil', conditional: 'Standard MNRE central subsidy applies. Strong net-metering support across MSEDCL.', extra: false },
    { state: 'Karnataka', topUp: 'Nil', conditional: 'Standard MNRE central subsidy applies. High solar irradiance yields excellent ROI.', extra: false },
    { state: 'Tamil Nadu', topUp: 'Nil', conditional: 'Standard MNRE central subsidy applies.', extra: false },
    { state: 'Kerala', topUp: 'Nil', conditional: 'KSEB handles MNRE central subsidy directly through the Soura scheme integration.', extra: false },
    { state: 'Rajasthan', topUp: 'Nil', conditional: 'Highest solar generation efficiency. Standard MNRE subsidy applies.', extra: false },
];

export default function StateSubsidyPage() {
    const { data: settings } = useQuery<PublicSettingsData>({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
    });

    const companyName = settings?.company_name || 'AndleebSurya';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
            <SEOHead 
                title="State-Wise Solar Subsidy List - PM Surya Ghar" 
                description="View the complete list of state-wise additional top-up subsidies for rooftop solar installations in India under the PM Surya Ghar scheme."
                breadcrumbs={[
                    { name: 'Home', url: window.location.origin },
                    { name: 'State Subsidy', url: window.location.origin + '/state-wise-subsidy' }
                ]}
                schemas={[
                    {
                        "@context": "https://schema.org",
                        "@type": "Table",
                        "name": "State-wise PM Surya Ghar Subsidy Distribution Options",
                        "description": "A comprehensive table outlining the additional state-level top-up subsidies available for residential rooftop solar installations across Indian states.",
                        "about": {
                            "@type": "Thing",
                            "name": "PM Surya Ghar Muft Bijli Yojana"
                        }
                    }
                ]}
            />
            <Navbar />

            <main className="flex-grow w-full relative pb-20">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-teal-200/30 to-blue-200/20 blur-3xl rounded-full pointer-events-none" />

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
                    
                    {/* Header */}
                    <div className="text-center mb-16 mt-8">
                        <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200/60 rounded-full px-5 py-1.5 text-xs uppercase tracking-widest text-teal-600 font-black mb-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <Map className="w-4 h-4" />
                            Regional Implementation
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">State-Wise</span> Subsidy Details
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            While the Central Government provides a baseline subsidy up to <strong className="text-slate-800">₹94,800</strong>, several State Governments offer additional "Top-up" subsidies to further accelerate renewable energy adoption.
                        </p>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden mb-12 animate-in fade-in zoom-in-95 duration-700">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-black text-xs tracking-widest uppercase">
                                        <th className="px-8 py-6 w-1/4">State / UT</th>
                                        <th className="px-8 py-6 w-1/4">State Top-up</th>
                                        <th className="px-8 py-6 w-1/2">Conditions & Guidelines</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {stateSubsidies.map((row, idx) => (
                                        <tr key={idx} className={`group hover:bg-slate-50/80 transition-all duration-300 ${row.extra ? 'bg-teal-50/20' : ''}`}>
                                            <td className="px-8 py-6 text-slate-800 font-black flex items-center gap-3 text-lg">
                                                {row.state}
                                                {row.extra && (
                                                    <span className="flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-500 rounded-full group-hover:scale-110 transition-transform shadow-sm">
                                                        <Zap className="w-3.5 h-3.5" />
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`font-black text-lg ${row.extra ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500' : 'text-slate-400'}`}>
                                                    {row.topUp}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-slate-600 font-medium leading-relaxed flex items-start gap-4">
                                                {row.conditional}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Footer Info Box */}
                        <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 p-8 md:p-10 flex items-start gap-5 border-t border-slate-200/60">
                            <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 shrink-0 shadow-inner mt-1">
                                <Info className="w-6 h-6" />
                            </div>
                            <p className="text-slate-600 font-medium leading-relaxed">
                                <strong className="text-slate-800">Disclaimer:</strong> State subsidies are subject to independent budgets set by individual state nodal agencies and DISCOMs. The availability of top-ups can be exhausted or abruptly modified by local governments independently of the central ₹75,021 crore PM Surya Ghar allocation. 
                                <br/><br/>
                                Always consult your assigned <strong className="text-blue-600">{companyName}</strong> executive for the most up-to-date and tailored feasibility report for your exact pincode.
                            </p>
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
