import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import SEOHead from '@/components/shared/SEOHead';
import { Star, ShieldCheck, TrendingUp, Sun, FileText, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicSettingsData } from '@/services/public.api';

export default function GuidePage() {
    const { data: settings } = useQuery<PublicSettingsData>({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
    });

    const companyName = settings?.company_name || 'AndleebSurya';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <SEOHead 
                title="Ultimate Guide to PM Surya Ghar Muft Bijli Yojana" 
                description="A comprehensive, step-by-step guide to understanding the PM Surya Ghar scheme, maximizing your solar subsidy, and achieving energy independence."
                breadcrumbs={[
                    { name: 'Home', url: window.location.origin },
                    { name: 'Guide', url: window.location.origin + '/pm-surya-ghar-guide' }
                ]}
                schemas={[
                    {
                        "@context": "https://schema.org",
                        "@type": "Article",
                        "headline": "Ultimate Guide to PM Surya Ghar Muft Bijli Yojana",
                        "author": {
                            "@type": "Organization",
                            "name": companyName
                        },
                        "publisher": {
                            "@type": "Organization",
                            "name": companyName,
                            "logo": {
                                "@type": "ImageObject",
                                "url": `${window.location.origin}/logo.webp`
                            }
                        },
                        "description": "Learn everything about the PM Surya Ghar Muft Bijli Yojana rooftop solar scheme. Find out eligibility, subsidy slabs, installation processes, and net metering concepts."
                    }
                ]}
            />
            <Navbar />

            <main className="flex-grow w-full py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <article className="bg-white rounded-[2rem] p-8 md:p-14 shadow-xl border border-slate-100">
                    
                    <header className="mb-12 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
                            <Star className="w-4 h-4" />
                            <span>Comprehensive Guide 2024</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 mb-6 leading-tight">
                            The Ultimate Guide to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">PM Surya Ghar Yojana</span>
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">Everything you need to know to claim your ₹94,800 subsidy and get 300 units of free electricity every month.</p>
                    </header>

                    <div className="prose prose-lg prose-slate max-w-none text-slate-700 space-y-8">
                        
                        <section>
                            <h2 className="text-3xl font-display font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <Sun className="text-accent w-8 h-8" />
                                1. What is the PM Surya Ghar Muft Bijli Yojana?
                            </h2>
                            <p>
                                Launched with a massive budget outlay of ₹75,021 crores, the <strong>PM Surya Ghar Muft Bijli Yojana</strong> is India's most ambitious renewable energy initiative. The objective is incredibly straightforward yet highly impactful: to provide up to <strong>300 units of free electricity every month</strong> to 1 crore households across the nation by subsidizing the installation of grid-connected rooftop solar systems.
                            </p>
                            <p>
                                By transforming consumers into "prosumers" (producers + consumers), the scheme aims to drastically reduce individual household utility bills, alleviate the immense burden on state-owned DISCOMs, and significantly lower India's carbon emissions, steering the country closer to its net-zero objectives.
                            </p>
                        </section>

                        <section className="bg-slate-50 p-8 rounded-2xl border border-slate-100 my-10">
                            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <TrendingUp className="text-primary w-7 h-7" />
                                Central Subsidy Structure
                            </h2>
                            <p className="mb-4">The government offers direct DBT (Direct Benefit Transfer) subsidies based on the capacity of the solar plant you install:</p>
                            <ul className="space-y-3">
                                <li><strong>Residential Rooftop Solar (3 kW & Above):</strong> Flat government subsidy of <strong>₹94,800</strong>.</li>
                            </ul>
                            <div className="mt-6 text-sm text-slate-500 italic">
                                Note: Many states offer additional top-up subsidies that can be combined with the central subsidy, drastically reducing the final payable amount. Check our State-wise Subsidy tracking tool for localized data.
                            </div>
                        </section>

                        <section>
                            <h2 className="text-3xl font-display font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <ShieldCheck className="text-green-500 w-8 h-8" />
                                2. Eligibility Criteria
                            </h2>
                            <p>Not everyone qualifies automatically. To ensure the subsidy reaches the intended beneficiaries, the Ministry of New and Renewable Energy (MNRE) has set the following baseline requirements:</p>
                            <ol>
                                <li><strong>Property Ownership:</strong> The applicant must own the house with a sturdy, concrete roof where the system will be situated. Renters cannot apply unless they have explicit legal authorization from the property owner.</li>
                                <li><strong>Active Grid Connection:</strong> You must have a valid operational electricity connection in your own name.</li>
                                <li><strong>Never Received Prior Subsidies:</strong> You must not have previously availed of any other central government scheme for solar panels on the same utility account/property.</li>
                                <li><strong>Aadhaar-Linked Bank Account:</strong> The subsidy is transferred exclusively via DBT, meaning your bank account must be seeded with your Aadhaar number.</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-3xl font-display font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <Zap className="text-orange-500 w-8 h-8" />
                                3. Understanding Net Metering
                            </h2>
                            <p>One of the most confusing aspects for new solar adopters is what happens to the electricity they generate if they don't consume it immediately. The answer is <strong>Net Metering</strong>.</p>
                            <p>Due to the high cost of off-grid battery arrays, the PM Surya Ghar scheme focuses strictly on <em>grid-tied</em> deployments. Your solar inverter connects directly to your neighborhood power grid. When the sun is shining and your panels generate more electricity than your home is using, the excess power flows backward into the grid.</p>
                            <p>Your local DISCOM will install a specialized bidirectional "Net Meter" that tracks both imported (consumed) and exported (generated) power. At the end of the billing cycle, you are only billed for the net difference.</p>
                            <blockquote className="border-l-4 border-primary pl-6 py-2 my-6 bg-primary/5 rounded-r-xl italic">
                                "If you generate 400 units and consume 300 units, your bill is zero, and the 100 surplus units are usually carried forward to the next month!"
                            </blockquote>
                        </section>

                        <section>
                            <h2 className="text-3xl font-display font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <FileText className="text-blue-500 w-8 h-8" />
                                4. How {companyName} Facilitates Your Registration
                            </h2>
                            <p>While the National Portal is open to the public, navigating the DISCOM feasibility approvals, vendor hunting, and technical documentation can be paralyzing. That is where <strong>{companyName}</strong> comes in.</p>
                            <p>We provide a completely free facilitation service for citizens. Our network of trained Business Development Executives (BDEs) act as your personal concierges across the following lifecycle:</p>
                            <ol>
                                <li><strong>Site Inspection & Capacity Sizing:</strong> Based on your historical energy bills and shadow-free roof area.</li>
                                <li><strong>National Portal Registration:</strong> Securing your application ID correctly.</li>
                                <li><strong>Feasibility Approval:</strong> Dealing with local electricity boards to get the technical green light.</li>
                                <li><strong>Empaneled Vendor Matching:</strong> Sourcing high-quality tier-1 solar panels from locally trusted installers.</li>
                                <li><strong>Commissioning & Subsidy Release:</strong> Submitting joint inspection reports safely to trigger your DBT payout.</li>
                            </ol>
                        </section>

                        <hr className="my-10 border-slate-200" />

                        <section className="text-center">
                            <h3 className="text-2xl font-bold mb-4">Ready to shrink your electricity bill to zero?</h3>
                            <p className="mb-8">Use our calculator to see your precise savings, or apply right away!</p>
                            <div className="flex justify-center gap-4">
                                <a href="/solar-subsidy-calculator" className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-3 rounded-xl font-bold transition-colors">
                                    Calculate Subsidy
                                </a>
                                <a href="/contact" className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all hover:-translate-y-1">
                                    Apply Now
                                </a>
                            </div>
                        </section>

                    </div>
                </article>
            </main>

            <Footer />
        </div>
    );
}
