import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Sun, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/public.api';

const getSetting = (settingsObj: any, key: string, fallback: string) => {
    return settingsObj?.[key] || fallback;
};

export default function Footer() {
    const { data: settings = {} } = useQuery({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
    });

    const companyName = getSetting(settings, 'company_name', 'AndleebSurya');
    const email = getSetting(settings, 'company_email', 'info@andleebsurya.in');
    const phone = getSetting(settings, 'company_mobile', '+91 88990 55335');
    const address = getSetting(settings, 'company_address', 'Srinagar, Jammu & Kashmir');

    return (
        <footer className="bg-[#030712] text-white pt-16 pb-8 border-t border-slate-800 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
            <div className="absolute top-0 right-1/4 w-[600px] h-64 bg-sky-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-slate-800">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Sun className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-black text-2xl tracking-tight">{companyName}</span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">
                            {getSetting(settings, 'footer_about_text', 'Facilitating solar rooftop installations under the PM Surya Ghar Muft Bijli Yojana intelligently.')}
                        </p>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-black text-slate-50 mb-5 tracking-wide text-lg">Contact Us</h4>
                        <div className="flex flex-col gap-4">
                            <a href={`tel:${phone}`} className="flex items-center gap-3 text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors group">
                                <div className="p-1.5 rounded-md bg-slate-800 group-hover:bg-sky-500/20 transition-colors">
                                    <Phone className="w-4 h-4 text-slate-300 group-hover:text-sky-400" />
                                </div>
                                {phone}
                            </a>
                            <a href={`mailto:${email}`} className="flex items-center gap-3 text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors group">
                                <div className="p-1.5 rounded-md bg-slate-800 group-hover:bg-sky-500/20 transition-colors">
                                    <Mail className="w-4 h-4 text-slate-300 group-hover:text-sky-400" />
                                </div>
                                {email}
                            </a>
                            <div className="flex items-start gap-3 text-sm font-medium text-slate-400 mt-1">
                                <div className="p-1.5 rounded-md bg-slate-800">
                                    <MapPin className="w-4 h-4 text-slate-300" />
                                </div>
                                <span className="mt-1 leading-relaxed">{address}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-black text-slate-50 mb-5 tracking-wide text-lg">Quick Links</h4>
                        <ul className="flex flex-col gap-3 font-medium">
                            <li><Link to="/about" className="text-sm text-slate-400 hover:text-sky-400 transition-colors inline-block hover:translate-x-1 transform duration-200">About Our Mission</Link></li>
                            <li><Link to="/contact" className="text-sm text-slate-400 hover:text-sky-400 transition-colors inline-block hover:translate-x-1 transform duration-200">Help & Support</Link></li>
                            <li><Link to="/scheme" className="text-sm text-slate-400 hover:text-sky-400 transition-colors inline-block hover:translate-x-1 transform duration-200">Scheme Information</Link></li>
                            <li><Link to="/faq" className="text-sm text-slate-400 hover:text-sky-400 transition-colors inline-block hover:translate-x-1 transform duration-200">Frequently Asked (FAQ)</Link></li>
                            <li><Link to="/solar-subsidy-calculator" className="text-sm text-slate-400 hover:text-sky-400 transition-colors inline-block hover:translate-x-1 transform duration-200">Subsidy Calculator</Link></li>
                            <li><Link to="/state-wise-subsidy" className="text-sm text-slate-400 hover:text-sky-400 transition-colors inline-block hover:translate-x-1 transform duration-200">State Subsidies List</Link></li>
                            <li><Link to="/user-manual" className="text-sm text-slate-400 hover:text-sky-400 transition-colors inline-block hover:translate-x-1 transform duration-200">User Manuals</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-black text-slate-50 mb-5 tracking-wide text-lg">Legal & Portals</h4>
                        <ul className="flex flex-col gap-3 font-medium">
                            <li><Link to="/privacy-policy" className="text-sm text-slate-400 hover:text-sky-400 transition-colors inline-block hover:translate-x-1 transform duration-200">Privacy Policy</Link></li>
                            <li><Link to="/terms-conditions" className="text-sm text-slate-400 hover:text-sky-400 transition-colors inline-block hover:translate-x-1 transform duration-200">Terms & Conditions</Link></li>
                            <li><Link to="/refund-policy" className="text-sm text-slate-400 hover:text-sky-400 transition-colors inline-block hover:translate-x-1 transform duration-200">Refund/Cancellation</Link></li>
                            <li className="mt-4 pt-4 border-t border-slate-800">
                                <Link to="/login" className="text-sm text-white hover:text-sky-300 transition-colors flex items-center gap-1.5 font-bold">
                                    Agent Portal Login <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                            </li>
                            <li>
                                <a href="https://pmsuryaghar.gov.in" target="_blank" rel="noopener noreferrer" className="text-sm text-white hover:text-sky-300 transition-colors flex items-center gap-1.5 font-bold">
                                    National Scheme Web <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">
                        &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
                    </p>
                    <p className="text-xs text-slate-500 font-medium text-center md:text-right max-w-sm">
                        Not an official government website. We are a registered facilitator for the PM Surya Ghar Muft Bijli Yojana.
                    </p>
                </div>
            </div>
            
            {/* INJECT WHATSAPP BUTTON HERE */}
        </footer>
    );
}
