import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    Shield, BadgeCheck, Save, 
    Building2, Globe,  
    RefreshCcw, Trophy, MessageSquare,
    Upload, Check, Key, FileText
} from 'lucide-react';
import { settingsApi } from '@/services/settings.api';
import { useAuthStore } from '@/store/authStore';
import { AchievementManager } from '@/components/admin/AchievementManager';
import { FeedbackManager } from '@/components/admin/FeedbackManager';
import api from '@/services/axios';
import toast from 'react-hot-toast';
import ChangePasswordForm from '@/components/shared/ChangePasswordForm';
import { compressImage } from '@/utils/imageUtils';
import { SettingJsonEditor } from '@/components/admin/SettingJsonEditor';
import SuperAdminCrmOptionsPage from '@/pages/super-admin/SuperAdminCrmOptionsPage';

export default function SuperAdminProfilePage() {
    const queryClient = useQueryClient();
    const { user, setUser } = useAuthStore();
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: user?.name ?? '',
        email: user?.email ?? '',
        mobile: user?.mobile ?? '',
    });

    // Authority Tabs
    const [authorityTab, setAuthorityTab] = useState<'presence' | 'content' | 'branding' | 'billing' | 'achievements' | 'feedback' | 'nav' | 'footer' | 'crm'>('presence');
    const [saving, setSaving] = useState(false);

    // Authority State
    const [localAuthority, setLocalAuthority] = useState<Record<string, string>>({});
    const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});

    const { data: settingsData, isLoading } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: settingsApi.getSettings
    });

    useEffect(() => {
        if (settingsData?.success && settingsData.data) {
            const flat: Record<string, string> = {};
            Object.values(settingsData.data).flat().forEach(item => {
                flat[item.key] = item.value || '';
            });
            setLocalAuthority(flat);
        }
    }, [settingsData]);

    const updateMutation = useMutation({
        mutationFn: settingsApi.updateSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            queryClient.invalidateQueries({ queryKey: ['public-settings'] });
            toast.success('System authority synchronized');
        }
    });

    const uploadFileMutation = useMutation({
        mutationFn: ({ key, file }: { key: string; file: File }) => settingsApi.uploadSettingsFile(key, file),
        onSuccess: (res, { key }) => {
            if (res?.data?.url) {
                const url: string = res.data.url;
                const relativePath = url.includes('/storage/') ? url.split('/storage/')[1] : url;
                setLocalAuthority(prev => ({ ...prev, [key]: relativePath }));
            }
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
        }
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.put('/admin/profile', data);
            return res.data;
        },
        onSuccess: (res) => {
            if (res.success) {
                setUser(res.data);
                setEditing(false);
                toast.success('Root profile updated');
            }
        }
    });

    const handleAuthoritySave = async (keys: string[]) => {
        try {
            setSaving(true);
            const uploadedKeys = new Set<string>();

            // 1. Upload pending files first
            for (const key of keys) {
                if (pendingFiles[key]) {
                    const res = await uploadFileMutation.mutateAsync({ key, file: pendingFiles[key] });
                    if (res.success) {
                        uploadedKeys.add(key);
                    }
                }
            }

            // 2. Clear pending state for the keys we're saving
            setPendingFiles(prev => {
                const updated = { ...prev };
                keys.forEach(k => delete updated[k]);
                return updated;
            });

            // 3. Save text fields (skip keys that were just uploaded as files, or are known media keys)
            const settingsToSave = keys
                .filter(k => localAuthority[k] !== undefined && !uploadedKeys.has(k) && !['hero_video', 'company_logo', 'company_logo_2', 'company_favicon'].includes(k))
                .map(k => ({ key: k, value: localAuthority[k] }));

            if (settingsToSave.length > 0) {
                await updateMutation.mutateAsync(settingsToSave);
            }
            toast.success('Authority committed and synchronized');
        } catch (err) {
            toast.error('Failed to commit authority');
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) return <div className="flex h-64 items-center justify-center"><RefreshCcw className="w-8 h-8 text-indigo-600 animate-spin" /></div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-2xl shadow-indigo-100">
                        <Shield className="text-white w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight leading-none">System Authority Hub</h1>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">{localAuthority.company_name || 'Platform Root Control'}</p>
                    </div>
                </div>
                {!editing ? (
                    <button onClick={() => setEditing(true)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:scale-105 transition-all shadow-xl">
                        Edit Root Profile
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button onClick={() => setEditing(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-2xl">Cancel</button>
                        <button onClick={() => updateProfileMutation.mutate(editForm)} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-xl">
                            <Save size={14} /> Save Profile
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left: Global Authority Navigator */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-32 h-32 rounded-3xl bg-slate-800 border-4 border-slate-800 overflow-hidden shadow-2xl mb-6">
                                {user?.profile_photo_url ? (
                                    <img src={user.profile_photo_url} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-indigo-600/20 text-indigo-400 font-black text-4xl">
                                        {user?.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <h3 className="text-xl font-display font-black tracking-tight text-center">{user?.name}</h3>
                            <div className="mt-2 bg-indigo-600/30 px-3 py-1 rounded-full border border-indigo-500/30 flex items-center gap-1.5">
                                <BadgeCheck size={12} className="text-indigo-400" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-100">Root Authority</span>
                            </div>
                        </div>
                    </div>

                    <nav className="bg-white rounded-[2rem] border border-slate-200 p-2 shadow-sm space-y-1">
                        <NavTab id="presence" label="Hero Presence" icon={<Globe size={16} />} active={authorityTab === 'presence'} onClick={setAuthorityTab} />
                        <NavTab id="content" label="Homepage Content" icon={<FileText size={16} />} active={authorityTab === 'content'} onClick={setAuthorityTab} />
                        <NavTab id="branding" label="Master Branding" icon={<Building2 size={16} />} active={authorityTab === 'branding'} onClick={setAuthorityTab} />
                        <NavTab id="billing" label="Billing & Bank Authority" icon={<FileText size={16} />} active={authorityTab === 'billing'} onClick={setAuthorityTab} />
                        <NavTab id="nav" label="Navigation Links" icon={<Key size={16} />} active={authorityTab === 'nav'} onClick={setAuthorityTab} />
                        <NavTab id="footer" label="Footer Settings" icon={<Building2 size={16} />} active={authorityTab === 'footer'} onClick={setAuthorityTab} />
                        <NavTab id="achievements" label="Achievements" icon={<Trophy size={16} />} active={authorityTab === 'achievements'} onClick={setAuthorityTab} />
                        <NavTab id="feedback" label="Customer Feedback" icon={<MessageSquare size={16} />} active={authorityTab === 'feedback'} onClick={setAuthorityTab} />
                        <NavTab id="crm" label="CRM Configuration" icon={<Shield size={16} />} active={authorityTab === 'crm'} onClick={setAuthorityTab} />
                    </nav>
                </div>

                {/* Right: Module Content */}
                <div className="lg:col-span-3 space-y-8">
                    {editing && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4">
                            <InputBlock label="Full Root Name" value={editForm.name} onChange={v => setEditForm(p => ({ ...p, name: v }))} />
                            <InputBlock label="Primary Mobile" value={editForm.mobile} onChange={v => setEditForm(p => ({ ...p, mobile: v }))} />
                            <div className="md:col-span-2">
                                <InputBlock label="Security Email" value={editForm.email} onChange={v => setEditForm(p => ({ ...p, email: v }))} />
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                        <div className="p-8 lg:p-10">
                            {authorityTab === 'presence' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Globe size={18} /></div>
                                        <h2 className="font-display font-black text-xl text-slate-800 tracking-tight">Homepage Hero Authority</h2>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6">
                                        <InputBlock label="Main Headline" value={localAuthority.hero_headline || ''} onChange={v => setLocalAuthority(p => ({ ...p, hero_headline: v }))} />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sub Headline</label>
                                            <textarea 
                                                value={localAuthority.hero_subheadline || ''} 
                                                onChange={e => setLocalAuthority(p => ({ ...p, hero_subheadline: e.target.value }))}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-800 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all h-32" 
                                            />
                                        </div>
                                        <FileUploadBlock 
                                            label="Presence Video (MP4)" 
                                            currentPath={localAuthority.hero_video} 
                                            pendingFile={pendingFiles.hero_video}
                                            onSelect={f => setPendingFiles(p => ({ ...p, hero_video: f }))}
                                            accept="video/mp4"
                                        />
                                    </div>
                                    <CommitButton saving={saving} onClick={() => handleAuthoritySave(['hero_headline', 'hero_subheadline', 'hero_video'])} />
                                </div>
                            )}

                            {authorityTab === 'content' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><FileText size={18} /></div>
                                        <h2 className="font-display font-black text-xl text-slate-800 tracking-tight">Homepage Sections Authority</h2>
                                    </div>
                                    
                                    <SettingJsonEditor 
                                        label="Platform Stats (Hero)"
                                        value={localAuthority.hero_stats_json || '[]'}
                                        onChange={v => setLocalAuthority(p => ({ ...p, hero_stats_json: v }))}
                                        fields={[
                                            { key: 'label', label: 'Label (e.g. Happy Users)', type: 'text' },
                                            { key: 'value', label: 'Value (e.g. 50k+)', type: 'text' },
                                            { key: 'icon', label: 'Lucide Icon Name', type: 'text' }
                                        ]}
                                    />

                                    <div className="pt-6 border-t border-slate-50">
                                        <SettingJsonEditor 
                                            label="How It Works Steps"
                                            value={localAuthority.how_it_works_json || '[]'}
                                            onChange={v => setLocalAuthority(p => ({ ...p, how_it_works_json: v }))}
                                            fields={[
                                                { key: 'title', label: 'Step Title', type: 'text' },
                                                { key: 'desc', label: 'Description', type: 'textarea' }
                                            ]}
                                        />
                                    </div>

                                    <div className="pt-6 border-t border-slate-50">
                                        <SettingJsonEditor 
                                            label="Why Choose Us Cards"
                                            value={localAuthority.why_choose_us_json || '[]'}
                                            onChange={v => setLocalAuthority(p => ({ ...p, why_choose_us_json: v }))}
                                            fields={[
                                                { key: 'title', label: 'Benefit Title', type: 'text' },
                                                { key: 'desc', label: 'Description', type: 'textarea' },
                                                { key: 'icon', label: 'Lucide Icon Name', type: 'text' }
                                            ]}
                                        />
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 space-y-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Eligibility Checker</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <InputBlock label="Checker Headline" value={localAuthority.eligibility_headline || ''} onChange={v => setLocalAuthority(p => ({ ...p, eligibility_headline: v }))} />
                                            <InputBlock label="Checker Sub-headline" value={localAuthority.eligibility_subheadline || ''} onChange={v => setLocalAuthority(p => ({ ...p, eligibility_subheadline: v }))} />
                                        </div>
                                        <SettingJsonEditor 
                                            label="Eligibility Questions"
                                            value={localAuthority.eligibility_questions_json || '[]'}
                                            onChange={v => setLocalAuthority(p => ({ ...p, eligibility_questions_json: v }))}
                                            fields={[
                                                { key: 'id', label: 'Unique ID (e.g. q1)', type: 'text' },
                                                { key: 'text', label: 'Question', type: 'text' },
                                                { key: 'expected', label: 'Required Answer', type: 'radio', options: ['yes', 'no'] }
                                            ]}
                                        />
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 space-y-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subsidy Calculator</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <InputBlock label="Calculator Headline" value={localAuthority.calculator_headline || ''} onChange={v => setLocalAuthority(p => ({ ...p, calculator_headline: v }))} />
                                            <InputBlock label="Calculator Sub-headline" value={localAuthority.calculator_subheadline || ''} onChange={v => setLocalAuthority(p => ({ ...p, calculator_subheadline: v }))} />
                                        </div>
                                        <SettingJsonEditor 
                                            label="Calculator Packages"
                                            value={localAuthority.calculator_values_json || '[]'}
                                            onChange={v => setLocalAuthority(p => ({ ...p, calculator_values_json: v }))}
                                            fields={[
                                                { key: 'id', label: 'Identifier (e.g. 3kw)', type: 'text' },
                                                { key: 'label', label: 'Display Label', type: 'text' },
                                                { key: 'central', label: 'Central Subsidy (₹)', type: 'number' },
                                                { key: 'state', label: 'State Subsidy (₹)', type: 'number' },
                                                { key: 'savings', label: 'Monthly Savings (₹)', type: 'number' },
                                                { key: 'payback', label: 'Payback (Months)', type: 'number' }
                                            ]}
                                        />
                                    </div>

                                    <CommitButton saving={saving} onClick={() => handleAuthoritySave(['hero_stats_json', 'how_it_works_json', 'why_choose_us_json', 'eligibility_headline', 'eligibility_subheadline', 'eligibility_questions_json', 'calculator_headline', 'calculator_subheadline', 'calculator_values_json'])} />
                                </div>
                            )}

                            {authorityTab === 'nav' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Key size={18} /></div>
                                        <h2 className="font-display font-black text-xl text-slate-800 tracking-tight">Navigation & CTA Authority</h2>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                        {/* Row: Home */}
                                        <div className="space-y-4">
                                            <InputBlock label="Home Nav Label" value={localAuthority.nav_home || ''} onChange={v => setLocalAuthority(p => ({ ...p, nav_home: v }))} />
                                            <InputBlock label="Home Nav Link" value={localAuthority.nav_home_link || ''} onChange={v => setLocalAuthority(p => ({ ...p, nav_home_link: v }))} />
                                        </div>

                                        {/* Row: Rewards/Benefits */}
                                        <div className="space-y-4">
                                            <InputBlock label="Rewards/Benefits Label" value={localAuthority.nav_rewards || ''} onChange={v => setLocalAuthority(p => ({ ...p, nav_rewards: v }))} />
                                            <InputBlock label="Rewards/Benefits Link" value={localAuthority.nav_rewards_link || ''} onChange={v => setLocalAuthority(p => ({ ...p, nav_rewards_link: v }))} />
                                        </div>

                                        {/* Row: Calculator */}
                                        <div className="space-y-4">
                                            <InputBlock label="Calculator Label" value={localAuthority.nav_calculator || ''} onChange={v => setLocalAuthority(p => ({ ...p, nav_calculator: v }))} />
                                            <InputBlock label="Calculator Link" value={localAuthority.nav_calculator_link || ''} onChange={v => setLocalAuthority(p => ({ ...p, nav_calculator_link: v }))} />
                                        </div>

                                        {/* Row: Track Status */}
                                        <div className="space-y-4">
                                            <InputBlock label="Track Status Label" value={localAuthority.nav_track_status || ''} onChange={v => setLocalAuthority(p => ({ ...p, nav_track_status: v }))} />
                                            <InputBlock label="Track Status Link" value={localAuthority.nav_track_status_link || ''} onChange={v => setLocalAuthority(p => ({ ...p, nav_track_status_link: v }))} />
                                        </div>

                                        {/* Row: User Guide */}
                                        <div className="space-y-4">
                                            <InputBlock label="User Guide Label" value={localAuthority.nav_guide || ''} onChange={v => setLocalAuthority(p => ({ ...p, nav_guide: v }))} />
                                            <InputBlock label="User Guide Link" value={localAuthority.nav_guide_link || ''} onChange={v => setLocalAuthority(p => ({ ...p, nav_guide_link: v }))} />
                                        </div>

                                        <div className="space-y-4">
                                            <InputBlock label="Portal Login Button Label" value={localAuthority.nav_portal_login || ''} onChange={v => setLocalAuthority(p => ({ ...p, nav_portal_login: v }))} />
                                            <div className="h-20 flex items-end">
                                                <p className="text-[10px] text-slate-400 font-bold italic p-4 bg-slate-50 rounded-xl">Portal login target is managed by the system security layer.</p>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-slate-100 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Navbar CTA Button</h3>
                                                <InputBlock label="Navbar CTA Label" value={localAuthority.nav_cta_electricity || ''} onChange={v => setLocalAuthority(p => ({ ...p, nav_cta_electricity: v }))} />
                                                <p className="text-[9px] text-indigo-600 font-bold">Points to lead registration form by default.</p>
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Hero Secondary Button</h3>
                                                <InputBlock label="Hero Secondary Label (Text)" value={localAuthority.company_slogan ? 'Using locale' : 'Become a Partner'} disabled onChange={() => {}} />
                                                <InputBlock label="Hero Secondary Link" value={localAuthority.hero_cta_secondary_link || ''} onChange={v => setLocalAuthority(p => ({ ...p, hero_cta_secondary_link: v }))} />
                                                <p className="text-[9px] text-indigo-600 font-bold">Current Target: {localAuthority.hero_cta_secondary_link}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <CommitButton saving={saving} onClick={() => handleAuthoritySave([
                                        'nav_home', 'nav_home_link', 
                                        'nav_rewards', 'nav_rewards_link', 
                                        'nav_calculator', 'nav_calculator_link', 
                                        'nav_track_status', 'nav_track_status_link', 
                                        'nav_portal_login', 
                                        'nav_cta_electricity', 
                                        'nav_guide', 'nav_guide_link',
                                        'hero_cta_secondary_link'
                                    ])} />
                                </div>
                            )}

                            {authorityTab === 'footer' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Building2 size={18} /></div>
                                        <h2 className="font-display font-black text-xl text-slate-800 tracking-tight">Global Footer Authority</h2>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Footer About Text</label>
                                            <textarea 
                                                value={localAuthority.footer_about_text || ''} 
                                                onChange={e => setLocalAuthority(p => ({ ...p, footer_about_text: e.target.value }))}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-800 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all h-24" 
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <InputBlock label="Copyright Text" value={localAuthority.footer_copyright || ''} onChange={v => setLocalAuthority(p => ({ ...p, footer_copyright: v }))} />
                                            <InputBlock label="Disclaimer Text" value={localAuthority.footer_disclaimer || ''} onChange={v => setLocalAuthority(p => ({ ...p, footer_disclaimer: v }))} />
                                        </div>
                                        <div className="pt-6 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <InputBlock label="Footer Section (Quick Links)" value={localAuthority.footer_section_quick_links || ''} onChange={v => setLocalAuthority(p => ({ ...p, footer_section_quick_links: v }))} />
                                            <InputBlock label="Footer Section (Legal)" value={localAuthority.footer_section_legal || ''} onChange={v => setLocalAuthority(p => ({ ...p, footer_section_legal: v }))} />
                                        </div>
                                        <div className="pt-6 border-t border-slate-50">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-4">Quick Links & Legal Labels</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <InputBlock label="About Us Link" value={localAuthority.footer_link_about || ''} onChange={v => setLocalAuthority(p => ({ ...p, footer_link_about: v }))} />
                                                <InputBlock label="Scheme Link" value={localAuthority.footer_link_scheme || ''} onChange={v => setLocalAuthority(p => ({ ...p, footer_link_scheme: v }))} />
                                                <InputBlock label="Contact Link" value={localAuthority.footer_link_contact || ''} onChange={v => setLocalAuthority(p => ({ ...p, footer_link_contact: v }))} />
                                                <InputBlock label="FAQ Link" value={localAuthority.footer_link_faq || ''} onChange={v => setLocalAuthority(p => ({ ...p, footer_link_faq: v }))} />
                                                <InputBlock label="Privacy Link" value={localAuthority.footer_link_privacy || ''} onChange={v => setLocalAuthority(p => ({ ...p, footer_link_privacy: v }))} />
                                                <InputBlock label="Terms Link" value={localAuthority.footer_link_terms || ''} onChange={v => setLocalAuthority(p => ({ ...p, footer_link_terms: v }))} />
                                                <InputBlock label="Refund Link" value={localAuthority.footer_link_refund || ''} onChange={v => setLocalAuthority(p => ({ ...p, footer_link_refund: v }))} />
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-slate-50">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-4">Global Contact Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <InputBlock label="Support Email" value={localAuthority.company_email || ''} onChange={v => setLocalAuthority(p => ({ ...p, company_email: v }))} />
                                                <InputBlock label="Support Phone" value={localAuthority.company_phone || ''} onChange={v => setLocalAuthority(p => ({ ...p, company_phone: v }))} />
                                                <InputBlock label="Support Mobile" value={localAuthority.company_mobile || ''} onChange={v => setLocalAuthority(p => ({ ...p, company_mobile: v }))} />
                                                <InputBlock label="WhatsApp Number" value={localAuthority.company_whatsapp || ''} onChange={v => setLocalAuthority(p => ({ ...p, company_whatsapp: v }))} />
                                                <InputBlock label="Website URL" value={localAuthority.company_website || ''} onChange={v => setLocalAuthority(p => ({ ...p, company_website: v }))} />
                                                <div className="md:col-span-3">
                                                    <div className="space-y-1.5 w-full">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Address</label>
                                                        <textarea 
                                                            value={localAuthority.company_address || ''} 
                                                            onChange={e => setLocalAuthority(p => ({ ...p, company_address: e.target.value }))}
                                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-800 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all h-20" 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <CommitButton saving={saving} onClick={() => handleAuthoritySave(['footer_about_text', 'footer_copyright', 'footer_disclaimer', 'footer_section_quick_links', 'footer_section_legal', 'footer_link_about', 'footer_link_scheme', 'footer_link_contact', 'footer_link_faq', 'footer_link_privacy', 'footer_link_terms', 'footer_link_refund', 'company_email', 'company_phone', 'company_mobile', 'company_whatsapp', 'company_website', 'company_address'])} />
                                </div>
                            )}

                            {authorityTab === 'branding' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Building2 size={18} /></div>
                                        <h2 className="font-display font-black text-xl text-slate-800 tracking-tight">Master Identity Branding</h2>
                                    </div>
                                    <div className="p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-xl">
                                        <p className="text-xs text-indigo-800 font-bold">
                                            <strong>Super Admin Exclusive:</strong> Set the global platform name, primary logo, and favicon. These appear across the entire platform as the master identity.
                                            Each admin sets their own secondary/affiliation logo (<code>company_logo_2</code>) separately in their own settings for use on ID cards and documents.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputBlock label="Platform Name" value={localAuthority.company_name || ''} onChange={v => setLocalAuthority(p => ({ ...p, company_name: v }))} />
                                        <InputBlock label="Global Affiliation Partner" value={localAuthority.company_affiliated_with || ''} onChange={v => setLocalAuthority(p => ({ ...p, company_affiliated_with: v }))} />
                                        <InputBlock label="Govt Registration No" value={localAuthority.company_registration_no || ''} onChange={v => setLocalAuthority(p => ({ ...p, company_registration_no: v }))} />
                                        <div className="md:col-span-2">
                                            <InputBlock label="Platform Slogan" value={localAuthority.company_slogan || ''} onChange={v => setLocalAuthority(p => ({ ...p, company_slogan: v }))} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                                        <div className="space-y-2">
                                            <FileUploadBlock
                                                label="Global Primary Logo"
                                                currentPath={localAuthority.company_logo}
                                                pendingFile={pendingFiles.company_logo}
                                                onSelect={f => setPendingFiles(p => ({ ...p, company_logo: f }))}
                                            />
                                            <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest">Platform-wide logo · Super Admin only</p>
                                        </div>
                                        <div className="space-y-2">
                                            <FileUploadBlock
                                                label="System Favicon"
                                                currentPath={localAuthority.company_favicon}
                                                pendingFile={pendingFiles.company_favicon}
                                                onSelect={f => setPendingFiles(p => ({ ...p, company_favicon: f }))}
                                            />
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Browser tab icon</p>
                                        </div>
                                        <div className="space-y-2">
                                            <FileUploadBlock
                                                label="Authorized Signature (For Bills)"
                                                currentPath={localAuthority.company_signature}
                                                pendingFile={pendingFiles.company_signature}
                                                onSelect={f => setPendingFiles(p => ({ ...p, company_signature: f }))}
                                            />
                                            <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest">Transparent PNG signature for Bank/Receipts</p>
                                        </div>
                                    </div>
                                    <CommitButton saving={saving} onClick={() => handleAuthoritySave(['company_name', 'company_affiliated_with', 'company_registration_no', 'company_slogan', 'company_logo', 'company_favicon', 'company_signature'])} />
                                </div>
                            )}

                            {authorityTab === 'billing' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><FileText size={18} /></div>
                                        <h2 className="font-display font-black text-xl text-slate-800 tracking-tight">Billing & Bank Authority</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputBlock label="Bank Account Name" value={localAuthority.company_bank_account_name || ''} onChange={v => setLocalAuthority(p => ({ ...p, company_bank_account_name: v }))} />
                                        <InputBlock label="Bank Account Number" value={localAuthority.company_bank_account_number || ''} onChange={v => setLocalAuthority(p => ({ ...p, company_bank_account_number: v }))} />
                                        <InputBlock label="Bank IFSC" value={localAuthority.company_bank_ifsc || ''} onChange={v => setLocalAuthority(p => ({ ...p, company_bank_ifsc: v }))} />
                                        <InputBlock label="Bank Branch" value={localAuthority.company_bank_branch || ''} onChange={v => setLocalAuthority(p => ({ ...p, company_bank_branch: v }))} />
                                    </div>
                                    <CommitButton saving={saving} onClick={() => handleAuthoritySave(['company_bank_account_name', 'company_bank_account_number', 'company_bank_ifsc', 'company_bank_branch'])} />
                                </div>
                            )}

                            {authorityTab === 'achievements' && <AchievementManager />}
                            {authorityTab === 'feedback' && <FeedbackManager />}
                            {authorityTab === 'crm' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Shield size={18} /></div>
                                        <h2 className="font-display font-black text-xl text-slate-800 tracking-tight">CRM Pipeline Configuration</h2>
                                    </div>
                                    <SuperAdminCrmOptionsPage />
                                </div>
                            )}
                        </div>
                    </div>

                    {!editing && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                            <h3 className="font-display font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2 mb-6">
                                <Key className="text-indigo-600" size={18} /> Root Security
                            </h3>
                            <ChangePasswordForm />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const NavTab = ({ id, label, icon, active, onClick }: { id: any, label: string, icon: React.ReactNode, active: boolean, onClick: (id: any) => void }) => (
    <button 
        onClick={() => onClick(id)}
        className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const InputBlock = ({ label, value, onChange, type = "text", disabled = false }: { label: string, value: string, onChange: (v: string) => void, type?: string, disabled?: boolean }) => (
    <div className={`space-y-1.5 w-full ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
        <input 
            type={type} 
            value={value} 
            disabled={disabled}
            onChange={e => !disabled && onChange(e.target.value)} 
            className={`w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-800 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all ${disabled ? 'bg-slate-100' : ''}`} 
        />
    </div>
);

const FileUploadBlock = ({ label, currentPath, pendingFile, onSelect, accept = "image/*" }: { label: string, currentPath?: string, pendingFile?: File, onSelect: (f: File) => void, accept?: string }) => {
    const getSafeUrl = (path: string | undefined | null) => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
        return `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').split('/api/v1')[0]}/storage/${path}`;
    };
    const previewUrl = pendingFile ? URL.createObjectURL(pendingFile) : getSafeUrl(currentPath);
    const isVideo = accept.includes('video') || String(previewUrl).toLowerCase().endsWith('.mp4') || String(pendingFile?.type).includes('video');
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
            <div className="relative group">
                <div className="h-32 w-full rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 transition-all group-hover:border-indigo-400 overflow-hidden">
                    {previewUrl ? (
                        isVideo ? (
                            <video src={previewUrl} className="h-full w-full object-cover rounded-xl" autoPlay loop muted playsInline />
                        ) : (
                            <img src={previewUrl} alt={label} className="max-h-full max-w-full object-contain" />
                        )
                    ) : (
                        <Upload className="text-slate-300" size={30} />
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" accept={accept} onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                            toast.error('File must be under 5MB.');
                            return;
                        }
                        if (file.type.startsWith('image/')) {
                            const toastId = toast.loading('Optimizing image...');
                            try {
                                const compressed = await compressImage(file);
                                toast.dismiss(toastId);
                                onSelect(compressed);
                            } catch (err) {
                                toast.dismiss(toastId);
                                toast.error('Failed to process image');
                            }
                        } else {
                            onSelect(file);
                        }
                    }} />
                </div>
                {pendingFile && <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[8px] px-2 py-1 rounded-full font-black uppercase">Unsaved</div>}
            </div>
        </div>
    );
};

const CommitButton = ({ onClick, saving }: { onClick: () => void, saving: boolean }) => (
    <div className="flex justify-end pt-6 border-t border-slate-50">
        <button 
            disabled={saving}
            onClick={onClick} 
            className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-2xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Check size={18} />}
            {saving ? 'Synchronizing...' : 'Commit Authority'}
        </button>
    </div>
);
