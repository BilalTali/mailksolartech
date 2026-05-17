import React, { useState } from 'react';
import SecurityGuard from '@/components/super-admin/SecurityGuard';
import SuperAdminCapacityPointsPage from './SuperAdminCapacityPointsPage';
import { AdminOffersPage } from '@/pages/admin/AdminOffersPage';
import { AdminRedemptionsPage } from '@/pages/admin/AdminRedemptionsPage';
import AdminAbsorptionsPage from '@/pages/admin/AdminAbsorptionsPage';
import SuperAdminFAQPage from './SuperAdminFAQPage';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';
import SuperAdminCrmOptionsPage from './SuperAdminCrmOptionsPage';
import SuperAdminPortalSettings from './SuperAdminPortalSettings';
import { AchievementManager } from '@/components/admin/AchievementManager';
import { FeedbackManager } from '@/components/admin/FeedbackManager';
import { ConsumerRatingManager } from '@/components/admin/ConsumerRatingManager';
import { 
    Zap, Gift, Trophy, 
    ShieldCheck, HelpCircle, FileBarChart, 
    Home, Database, Layers, MessageSquare
} from 'lucide-react';

type GlobalSettingTab = 
    | 'points' 
    | 'offers' 
    | 'redemptions' 
    | 'absorptions' 
    | 'faqs' 
    | 'reports' 
    | 'crm_options' 
    | 'achievements'
    | 'feedback'
    | 'homepage'
    | 'consumer_governance';

export default function SuperAdminGlobalSettingsPage() {
    const [activeTab, setActiveTab] = useState<GlobalSettingTab>('points');

    const tabs: { id: GlobalSettingTab; label: string; icon: React.ElementType; description: string }[] = [
        { id: 'points', label: 'Incentive Point Mapping', icon: Zap, description: 'Configure points for solar capacities' },
        { id: 'offers', label: 'Incentive Offers', icon: Gift, description: 'Manage target-based reward campaigns' },
        { id: 'redemptions', label: 'Prize Redemptions', icon: Trophy, description: 'Review and fulfill agent prize claims' },
        { id: 'absorptions', label: 'Absorbed Points', icon: Layers, description: 'Track system-reverted incentive points' },
        { id: 'faqs', label: 'Global Help Center', icon: HelpCircle, description: 'Manage Knowledge Base and FAQs' },
        { id: 'reports', label: 'Global Reports', icon: FileBarChart, description: 'Cross-territory performance analytics' },
        { id: 'homepage', label: 'Global Portal Identity', icon: Home, description: 'Branding, SEO and Landing Page content' },
        { id: 'crm_options', label: 'CRM Master Options', icon: Database, description: 'Configure lead form system options' },
        { id: 'achievements', label: 'Success Records', icon: Trophy, description: 'Manage platform-wide achievements' },
        { id: 'feedback', label: 'User Testimonials', icon: MessageSquare, description: 'Moderate public feedback and reviews' },
        { id: 'consumer_governance', label: 'Installer Audit', icon: ShieldCheck, description: 'Consumer ratings for installation teams' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'points': return <SuperAdminCapacityPointsPage onTabChange={setActiveTab} />;
            case 'offers': return <AdminOffersPage />;
            case 'redemptions': return <AdminRedemptionsPage />;
            case 'absorptions': return <AdminAbsorptionsPage />;
            case 'faqs': return <SuperAdminFAQPage />;
            case 'reports': return <AdminReportsPage />;
            case 'crm_options': return <SuperAdminCrmOptionsPage />;
            case 'achievements': return <div className="bg-white p-8 rounded-[3rem] border border-slate-200"><AchievementManager /></div>;
            case 'feedback': return <div className="bg-white p-8 rounded-[3rem] border border-slate-200"><FeedbackManager /></div>;
            case 'consumer_governance': return <div className="bg-white p-8 rounded-[3rem] border border-slate-200"><ConsumerRatingManager /></div>;
            case 'homepage': return <SuperAdminPortalSettings />;
            default: return null;
        }
    };

    return (
        <SecurityGuard>
            <div className="space-y-6 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <ShieldCheck className="text-indigo-600 w-7 h-7" /> Global Authority Hub
                        </h1>
                        <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-widest">OTP Protected Administrative Layer</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Navigation Sidebar (Desktop) */}
                    <div className="hidden lg:block w-72 shrink-0">
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-2 space-y-1 sticky top-24">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
                                        activeTab === tab.id 
                                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                                            : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className={`p-2 rounded-lg transition-colors ${
                                        activeTab === tab.id ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-white'
                                    }`}>
                                        <tab.icon size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-[13px] tracking-tight leading-none mb-1">{tab.label}</p>
                                        <p className={`text-[9px] font-medium leading-none opacity-60 ${
                                            activeTab === tab.id ? 'text-white' : 'text-slate-400'
                                        }`}>
                                            {tab.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Navigation (Horizontal Scroll) */}
                    <div className="lg:hidden -mx-4 px-4 overflow-x-auto no-scrollbar pb-2 flex gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                    activeTab === tab.id 
                                        ? 'bg-slate-900 text-white shadow-lg' 
                                        : 'bg-white text-slate-500 border border-slate-200'
                                }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </SecurityGuard>
    );
}
