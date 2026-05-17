import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Globe, Save, RefreshCcw, Layout, Image as ImageIcon, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi } from '@/services/settings.api';
import api from '@/services/axios';
import { compressImage } from '@/utils/imageUtils';
import { SettingJsonEditor } from '@/components/admin/SettingJsonEditor';

type TabId = 'identity' | 'homepage' | 'icard' | 'letter';

const getFileUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').split('/api/v1')[0];
    return `${baseUrl}/storage/${path}`;
};

const Field = ({ k, label, type = 'text', placeholder, value, onChange }: { k: string, label: string, type?: string, placeholder?: string, value: string, onChange: (k: string, v: string) => void }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</label>
        {type === 'textarea' ? (
            <textarea
                value={value}
                onChange={e => onChange(k, e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white min-h-[100px] text-sm"
            />
        ) : (
            <input
                type={type}
                value={value}
                onChange={e => onChange(k, e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white text-sm"
            />
        )}
    </div>
);

const FileUploadField = ({ settingKey, label, accept, file, url, onSelect }: { settingKey: string, label: string, accept: string, file?: File, url?: string, onSelect: (k: string, f: File) => void }) => {
    const previewUrl = file ? URL.createObjectURL(file) : getFileUrl(url);

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</label>
            {(previewUrl || file) && (
                <div className="rounded-xl border border-slate-100 h-24 flex items-center justify-center bg-slate-50 relative">
                    {accept.includes('video') ? (
                        <video src={previewUrl} className="h-full" muted autoPlay loop playsInline />
                    ) : (
                        <img src={previewUrl} alt={label} className="h-full object-contain p-2" />
                    )}
                </div>
            )}
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-accent/50 cursor-pointer text-sm text-slate-600">
                <ImageIcon className="w-4 h-4" /> {url || file ? 'Replace file' : 'Upload file'}
                <input type="file" className="hidden" accept={accept} onChange={async e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.type.startsWith('image/')) {
                        const compressed = await compressImage(f);
                        onSelect(settingKey, compressed);
                    } else {
                        onSelect(settingKey, f);
                    }
                }} />
            </label>
        </div>
    );
};


interface QuestionItem {
    id: string;
    text: string;
    expected: 'yes' | 'no';
}

export default function SuperAdminPortalSettings() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabId>('identity');
    const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
    const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});

    const getQuestions = (): QuestionItem[] => {
        try {
            const json = localSettings.eligibility_questions_json;
            if (json) {
                const parsed = JSON.parse(json);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {}
        return [
            { id: 'q1', text: 'Do you own the house where solar panels will be installed?', expected: 'yes' },
            { id: 'q2', text: 'Do you have an active electricity connection in your name?', expected: 'yes' },
            { id: 'q3', text: 'Do you have a valid Aadhaar-linked bank account?', expected: 'yes' },
            { id: 'q4', text: 'Have you NOT availed any solar subsidy before?', expected: 'yes' },
        ];
    };

    const updateQuestions = (questions: QuestionItem[]) => {
        setLocalSettings(prev => ({
            ...prev,
            eligibility_questions_json: JSON.stringify(questions, null, 2)
        }));
    };

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
            setLocalSettings(flat);
        }
    }, [settingsData]);

    const updateMutation = useMutation({
        mutationFn: settingsApi.updateSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            queryClient.invalidateQueries({ queryKey: ['public-settings'] });
            toast.success('Platform settings saved');
        }
    });

    const uploadFileMutation = useMutation({
        mutationFn: async ({ key, file }: { key: string; file: File }) => {
            const fd = new FormData();
            fd.append('key', key);
            fd.append('file', file);
            const res = await api.post('/admin/settings/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            return res.data;
        },
        onSuccess: (data, { key }) => {
            if (data?.data?.url) {
                const url: string = data.data.url;
                const relativePath = url.includes('/storage/') ? url.split('/storage/')[1] : url;
                setLocalSettings(prev => ({ ...prev, [key]: relativePath }));
            }
        }
    });

    const saveSection = async (keys: string[]) => {
        for (const key of keys) {
            if (pendingFiles[key]) {
                await uploadFileMutation.mutateAsync({ key, file: pendingFiles[key] });
            }
        }
        setPendingFiles(prev => {
            const updated = { ...prev };
            keys.forEach(k => delete updated[k]);
            return updated;
        });

        const settingsToSave = keys
            .filter(k => localSettings[k] !== undefined && !['company_logo', 'company_favicon', 'official_signature', 'hero_video'].includes(k))
            .map(k => ({ key: k, value: localSettings[k] }));

        if (settingsToSave.length > 0) {
            await updateMutation.mutateAsync(settingsToSave);
        }
    };

    const handleInput = (key: string, value: string) => setLocalSettings(p => ({ ...p, [key]: value }));



    if (isLoading) return <div className="flex h-64 items-center justify-center"><RefreshCcw className="w-8 h-8 text-accent animate-spin" /></div>;

    const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
        { id: 'identity', label: 'Platform Identity', icon: Globe },
        { id: 'homepage', label: 'Homepage & Content', icon: Layout },
        { id: 'icard', label: 'Default ID Card Rules', icon: SettingsIcon },
        { id: 'letter', label: 'Default Joining Terms', icon: SettingsIcon },
    ];

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[650px]">
            <div className="w-full md:w-64 border-r border-slate-100 bg-slate-50/30 p-4 space-y-1 shrink-0">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                            activeTab === tab.id 
                                ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <tab.icon size={18} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
                {activeTab === 'identity' && (
                    <div className="space-y-6">
                        <div className="p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-lg">
                            <p className="text-xs text-indigo-800 font-medium">
                                <strong>Global Platform Assets:</strong> These settings dictate the primary branding shown on the public homepage and global footer.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field k="company_name" label="Global Platform Name" value={localSettings.company_name || ''} onChange={handleInput} />
                            <Field k="company_affiliated_with" label="Top Affiliator Name (For ID Card Back)" value={localSettings.company_affiliated_with || ''} onChange={handleInput} />
                            <Field k="company_email" label="Global Support Email" value={localSettings.company_email || ''} onChange={handleInput} />
                            <Field k="company_phone" label="Global Support Phone" value={localSettings.company_phone || ''} onChange={handleInput} />
                            <div className="md:col-span-2">
                                <Field k="company_address" label="Global Footer Address" type="textarea" value={localSettings.company_address || ''} onChange={handleInput} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FileUploadField settingKey="company_logo" label="Master Platform Logo" accept="image/*" file={pendingFiles.company_logo} url={localSettings.company_logo} onSelect={(k, f) => setPendingFiles(p => ({...p, [k]: f}))} />
                            <FileUploadField settingKey="company_favicon" label="Platform Favicon" accept="image/*" file={pendingFiles.company_favicon} url={localSettings.company_favicon} onSelect={(k, f) => setPendingFiles(p => ({...p, [k]: f}))} />
                            <FileUploadField settingKey="official_signature" label="Official Master Signature" accept="image/*" file={pendingFiles.official_signature} url={localSettings.official_signature} onSelect={(k, f) => setPendingFiles(p => ({...p, [k]: f}))} />
                        </div>
                        <div className="flex justify-end pt-6 border-t border-slate-100">
                            <button onClick={() => saveSection(['company_name', 'company_affiliated_with', 'company_email', 'company_phone', 'company_address', 'company_logo', 'company_favicon', 'official_signature'])} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
                                <Save className="w-4 h-4" /> Save Identity
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'homepage' && (
                    <div className="space-y-8">
                        <div className="p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-lg">
                            <p className="text-xs text-indigo-800 font-medium">
                                <strong>Homepage Content:</strong> Modify the text and structure that appears on the main landing page and footer.
                            </p>
                        </div>
                        
                        <div>
                            <h3 className="font-black text-slate-800 mb-4 border-b border-slate-100 pb-2">Hero Section & Text</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 mb-4">
                                    <FileUploadField 
                                        settingKey="hero_video" 
                                        label="Homepage Hero Background Video" 
                                        accept="video/mp4,video/webm" 
                                        file={pendingFiles.hero_video} 
                                        url={localSettings.hero_video} 
                                        onSelect={(k, f) => setPendingFiles(p => ({...p, [k]: f}))} 
                                    />
                                </div>
                                <Field k="hero_headline" label="Hero Headline" value={localSettings.hero_headline || ''} onChange={handleInput} />
                                <div className="md:col-span-2">
                                    <Field k="hero_subheadline" label="Hero Subheadline" type="textarea" value={localSettings.hero_subheadline || ''} onChange={handleInput} />
                                </div>
                                <Field k="eligibility_headline" label="Eligibility Headline" value={localSettings.eligibility_headline || ''} onChange={handleInput} />
                                <Field k="eligibility_subheadline" label="Eligibility Subheadline" value={localSettings.eligibility_subheadline || ''} onChange={handleInput} />
                                <Field k="calculator_headline" label="Calculator Headline" value={localSettings.calculator_headline || ''} onChange={handleInput} />
                                <Field k="calculator_subheadline" label="Calculator Subheadline" value={localSettings.calculator_subheadline || ''} onChange={handleInput} />
                                <Field k="hero_cta_primary_link" label="Primary CTA Link" value={localSettings.hero_cta_primary_link || ''} onChange={handleInput} />
                                <Field k="hero_cta_secondary_link" label="Secondary CTA Link" value={localSettings.hero_cta_secondary_link || ''} onChange={handleInput} />
                            </div>
                        </div>

                        <div>
                            <h3 className="font-black text-slate-800 mb-4 border-b border-slate-100 pb-2">Eligibility Status Messages</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Field k="eligibility_success_title" label="Success Title" value={localSettings.eligibility_success_title || ''} onChange={handleInput} />
                                <Field k="eligibility_error_title" label="Error Title" value={localSettings.eligibility_error_title || ''} onChange={handleInput} />
                                <div className="md:col-span-1">
                                    <Field k="eligibility_success_desc" label="Success Description" type="textarea" value={localSettings.eligibility_success_desc || ''} onChange={handleInput} />
                                </div>
                                <div className="md:col-span-1">
                                    <Field k="eligibility_error_desc" label="Error Description" type="textarea" value={localSettings.eligibility_error_desc || ''} onChange={handleInput} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-black text-slate-800 mb-4 border-b border-slate-100 pb-2">Eligibility Checklist Questions</h3>
                            <div className="space-y-4 mb-6">
                                {getQuestions().map((q, index) => (
                                    <div key={q.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-2xl transition-all duration-300">
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 font-black text-indigo-600 text-xs shadow-sm">
                                                Q{index + 1}
                                            </span>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <input
                                                type="text"
                                                value={q.text}
                                                onChange={(e) => {
                                                    const updated = getQuestions().map(item => item.id === q.id ? { ...item, text: e.target.value } : item);
                                                    updateQuestions(updated);
                                                }}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white text-sm"
                                                placeholder="Enter the qualification question text..."
                                            />
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block font-sans">Expected Answer</span>
                                            <div className="flex bg-slate-200/60 p-1 rounded-xl">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = getQuestions().map(item => item.id === q.id ? { ...item, expected: 'yes' as const } : item);
                                                        updateQuestions(updated);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-widest transition-all ${
                                                        q.expected === 'yes'
                                                            ? 'bg-emerald-500 text-white shadow-sm'
                                                            : 'text-slate-500 hover:text-slate-800'
                                                    }`}
                                                >
                                                    YES
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = getQuestions().map(item => item.id === q.id ? { ...item, expected: 'no' as const } : item);
                                                        updateQuestions(updated);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-widest transition-all ${
                                                        q.expected === 'no'
                                                            ? 'bg-rose-500 text-white shadow-sm'
                                                            : 'text-slate-500 hover:text-slate-800'
                                                    }`}
                                                >
                                                    NO
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = getQuestions().filter(item => item.id !== q.id);
                                                    updateQuestions(updated);
                                                }}
                                                className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-105 active:scale-95 shrink-0"
                                                title="Delete Question"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextId = `q${Date.now()}`;
                                        const updated = [...getQuestions(), { id: nextId, text: '', expected: 'yes' as const }];
                                        updateQuestions(updated);
                                    }}
                                    className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-dashed border-slate-200 hover:border-indigo-500/50 hover:bg-indigo-50/20 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-all duration-300 group active:scale-[0.99]"
                                >
                                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> Add Custom Question
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-black text-slate-800 mb-4 border-b border-slate-100 pb-2">Navigation & Labels</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Field k="nav_home" label="Nav: Home" value={localSettings.nav_home || ''} onChange={handleInput} />
                                <Field k="nav_rewards" label="Nav: Benefits" value={localSettings.nav_rewards || ''} onChange={handleInput} />
                                <Field k="nav_portal_login" label="Nav: Portal Login" value={localSettings.nav_portal_login || ''} onChange={handleInput} />
                                <Field k="nav_cta_electricity" label="Nav: Get Electricity" value={localSettings.nav_cta_electricity || ''} onChange={handleInput} />
                                <Field k="nav_calculator" label="Nav: Calculator" value={localSettings.nav_calculator || ''} onChange={handleInput} />
                                <Field k="nav_track_status" label="Nav: Track Status" value={localSettings.nav_track_status || ''} onChange={handleInput} />
                                <Field k="nav_guide" label="Nav: Guide" value={localSettings.nav_guide || ''} onChange={handleInput} />
                                <Field k="label_how_it_works" label="Label: How It Works" value={localSettings.label_how_it_works || ''} onChange={handleInput} />
                                <Field k="label_eligibility_checker" label="Label: Check Eligibility" value={localSettings.label_eligibility_checker || ''} onChange={handleInput} />
                                <Field k="label_subsidy_calculator" label="Label: Subsidy Calculator" value={localSettings.label_subsidy_calculator || ''} onChange={handleInput} />
                                <Field k="label_whatsapp_text" label="Label: WhatsApp CTA" value={localSettings.label_whatsapp_text || ''} onChange={handleInput} />
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h3 className="font-black text-slate-800 mb-4 border-b border-slate-100 pb-2">Interactive Section Configurations</h3>
                            
                            <SettingJsonEditor 
                                label="Hero Stats"
                                value={localSettings.hero_stats_json || '[]'}
                                onChange={v => setLocalSettings(p => ({ ...p, hero_stats_json: v }))}
                                fields={[
                                    { key: 'icon', label: 'Lucide Icon Name', type: 'text' },
                                    { key: 'value', label: 'Value (e.g. 300 Units)', type: 'text' },
                                    { key: 'label', label: 'Label (e.g. Free / Month)', type: 'text' }
                                ]}
                            />

                            <div className="pt-6 border-t border-slate-100">
                                <SettingJsonEditor 
                                    label="How It Works Steps"
                                    value={localSettings.how_it_works_json || '[]'}
                                    onChange={v => setLocalSettings(p => ({ ...p, how_it_works_json: v }))}
                                    fields={[
                                        { key: 'icon', label: 'Lucide Icon Name', type: 'text' },
                                        { key: 'step', label: 'Step Number', type: 'text' },
                                        { key: 'title', label: 'Step Title', type: 'text' },
                                        { key: 'desc', label: 'Description', type: 'textarea' }
                                    ]}
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <SettingJsonEditor 
                                    label="Why Choose Us Cards"
                                    value={localSettings.why_choose_us_json || '[]'}
                                    onChange={v => setLocalSettings(p => ({ ...p, why_choose_us_json: v }))}
                                    fields={[
                                        { key: 'icon', label: 'Lucide Icon Name', type: 'text' },
                                        { key: 'title', label: 'Benefit Title', type: 'text' },
                                        { key: 'desc', label: 'Description', type: 'textarea' }
                                    ]}
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <SettingJsonEditor 
                                    label="Calculator Values"
                                    value={localSettings.calculator_values_json || '[]'}
                                    onChange={v => setLocalSettings(p => ({ ...p, calculator_values_json: v }))}
                                    fields={[
                                        { key: 'id', label: 'Identifier (e.g. 1kw)', type: 'text' },
                                        { key: 'label', label: 'Display Label (e.g. 1 kW)', type: 'text' },
                                        { key: 'central', label: 'Central Subsidy (₹)', type: 'number' },
                                        { key: 'state', label: 'State Subsidy (₹)', type: 'number' },
                                        { key: 'savings', label: 'Monthly Savings (₹)', type: 'number' },
                                        { key: 'payback', label: 'Payback (Months)', type: 'number' }
                                    ]}
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="font-black text-slate-800 mb-4 border-b border-slate-100 pb-2">Footer</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <Field k="footer_about_text" label="Footer About Text" type="textarea" value={localSettings.footer_about_text || ''} onChange={handleInput} />
                                <Field k="footer_copyright" label="Footer Copyright Text" value={localSettings.footer_copyright || ''} onChange={handleInput} />
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-slate-100">
                            <button onClick={() => saveSection([
                                'hero_video', 'hero_headline', 'hero_subheadline', 'eligibility_headline', 'eligibility_subheadline',
                                'calculator_headline', 'calculator_subheadline', 'hero_cta_primary_link', 'hero_cta_secondary_link',
                                'eligibility_success_title', 'eligibility_error_title', 'eligibility_success_desc', 'eligibility_error_desc',
                                'nav_home', 'nav_rewards', 'nav_portal_login', 'nav_cta_electricity', 'nav_calculator', 'nav_track_status', 'nav_guide',
                                'label_how_it_works', 'label_eligibility_checker', 'label_subsidy_calculator', 'label_whatsapp_text',
                                'hero_stats_json', 'how_it_works_json', 'why_choose_us_json', 'eligibility_questions_json', 'calculator_values_json',
                                'footer_about_text', 'footer_copyright'
                            ])} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
                                <Save className="w-4 h-4" /> Save All Homepage Content
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'icard' && (
                    <div className="space-y-6">
                        <div className="p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-lg">
                            <p className="text-xs text-indigo-800 font-medium">
                                <strong>Global ID Card Defaults:</strong> Set the default backside instructions for all platform ID cards. Admins can still override these for their own teams.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <Field k="icard_inst_1" label="Instruction Line 1" value={localSettings.icard_inst_1 || ''} onChange={handleInput} />
                            <Field k="icard_inst_2" label="Instruction Line 2" value={localSettings.icard_inst_2 || ''} onChange={handleInput} />
                            <Field k="icard_inst_3" label="Instruction Line 3" value={localSettings.icard_inst_3 || ''} onChange={handleInput} />
                            <Field k="icard_inst_4" label="Instruction Line 4" value={localSettings.icard_inst_4 || ''} onChange={handleInput} />
                        </div>
                        <div className="flex justify-end pt-6 border-t border-slate-100">
                            <button onClick={() => saveSection(['icard_inst_1', 'icard_inst_2', 'icard_inst_3', 'icard_inst_4'])} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
                                <Save className="w-4 h-4" /> Save Defaults
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'letter' && (
                    <div className="space-y-6">
                        <div className="p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-lg">
                            <p className="text-xs text-indigo-800 font-medium">
                                <strong>Global Joining Letter Terms:</strong> Establish the base terms of appointment across the platform.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field k="joining_terms_office_timing" label="Default Office Timing" value={localSettings.joining_terms_office_timing || ''} onChange={handleInput} />
                            <Field k="joining_terms_working_days" label="Default Working Days" value={localSettings.joining_terms_working_days || ''} onChange={handleInput} />
                            <div className="md:col-span-2">
                                <Field k="joining_terms_probation" label="Probation & Notice Period Details" type="textarea" value={localSettings.joining_terms_probation || ''} onChange={handleInput} />
                            </div>
                        </div>
                        <div className="flex justify-end pt-6 border-t border-slate-100">
                            <button onClick={() => saveSection(['joining_terms_office_timing', 'joining_terms_working_days', 'joining_terms_probation'])} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
                                <Save className="w-4 h-4" /> Save Template
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
