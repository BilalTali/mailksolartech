import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Zap, Save, RefreshCw, AlertCircle, 
    ArrowRight, Settings, Info,
    Plus, Trash2, CheckCircle2, XCircle
} from 'lucide-react';
import { settingsApi } from '@/services/settings.api';
import { crmOptionsApi } from '@/services/crmOptions.api';
import toast from 'react-hot-toast';

export default function SuperAdminCapacityPointsPage({ onTabChange }: { onTabChange?: (tab: any) => void }) {
    const qc = useQueryClient();
    const [localMapping, setLocalMapping] = useState<Record<string, number>>({});
    const [isSaving, setIsSaving] = useState(false);

    // 1. Fetch CRM Options to know which capacities exist
    const { data: optionsData, isLoading: optionsLoading } = useQuery({
        queryKey: ['admin-crm-options', 'system_capacity'],
        queryFn: () => crmOptionsApi.getAll('system_capacity')
    });

    // 2. Fetch Global Settings to get current points mapping
    const { data: settingsData, isLoading: settingsLoading } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: settingsApi.getSettings
    });

    useEffect(() => {
        if (settingsData?.success) {
            let jsonString = '{}';
            // settingsData.data is grouped by category
            Object.values(settingsData.data).flat().forEach((s: any) => {
                if (s.key === 'capacity_points_json') jsonString = s.value;
            });
            
            try {
                const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString || {};
                setLocalMapping(parsed);
            } catch {
                setLocalMapping({});
            }
        }
    }, [settingsData]);

    const saveMutation = useMutation({
        mutationFn: settingsApi.updateSettings,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-settings'] });
            toast.success('Capacity points mapping synchronized successfully');
        },
        onError: (err: any) => {
            toast.error('Failed to update mapping: ' + (err.response?.data?.message || err.message));
        }
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveMutation.mutateAsync([
                { key: 'capacity_points_json', value: JSON.stringify(localMapping) }
            ]);
        } finally {
            setIsSaving(false);
        }
    };

    const updatePoint = (key: string, val: string) => {
        const cleanKey = key.toLowerCase().replace(/\s+/g, '');
        const num = parseFloat(val);
        setLocalMapping(prev => ({ 
            ...prev, 
            [cleanKey]: isNaN(num) ? 0 : num 
        }));
    };

    const deleteMapping = (key: string) => {
        setLocalMapping(prev => {
            const next = { ...prev };
            delete next[key];
            return { ...next }; // Ensure new object reference
        });
        toast.success(`Removed mapping for ${key}`, { duration: 1000 });
    };

    const crmOptions = optionsData?.data || [];
    const isLoading = optionsLoading || settingsLoading;

    // Derived: separate mapping into "linked to CRM" and "orphan/legacy"
    const standardKeys = useMemo(() => crmOptions.map((o: any) => o.value), [crmOptions]);
    const existingKeys = Object.keys(localMapping);
    const orphanKeys = useMemo(() => existingKeys.filter(k => !standardKeys.includes(k)), [existingKeys, standardKeys]);

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full -mr-40 -mt-40 blur-3xl pointer-events-none" />
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-200 rotate-6 hover:rotate-0 transition-all duration-500">
                        <Zap className="text-white w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight leading-none">Incentive Core</h1>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                             <Settings size={14} className="text-indigo-400" /> Administrative Points Protocol
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                    <div className="hidden lg:block text-right mr-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modified Rules</p>
                        <p className="text-sm font-black text-indigo-600 uppercase">{existingKeys.length} active mappings</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="group flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? <RefreshCw className="animate-spin w-5 h-5" /> : <Save size={20} className="group-hover:animate-bounce" />}
                        {isSaving ? 'Synchronizing...' : 'Save Configuration'}
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100 shadow-sm gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-200" size={24} />
                    </div>
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Initializing Points Matrix...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                    {/* Left: Configuration Steps */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-lg">
                            <div className="p-8 lg:p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-lg font-display font-black text-slate-900 uppercase tracking-tight">Active Fleet Mappings</h3>
                                    <p className="text-sm text-slate-400 font-medium mt-1">Directly correlated with CRM System Capacities</p>
                                </div>
                                <div className="h-10 px-5 bg-indigo-600 text-white rounded-[1rem] text-[10px] font-black uppercase tracking-widest flex items-center shadow-lg shadow-indigo-100">
                                    {crmOptions.length} Sizes Defined
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100 italic font-medium text-slate-300">
                                {crmOptions.length === 0 && (
                                    <div className="p-20 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <AlertCircle size={40} className="text-slate-200" />
                                        </div>
                                        <p className="text-slate-400 text-sm">No standard capacities detected in CRM Options.</p>
                                    </div>
                                )}
                                {crmOptions.map((opt: any) => (
                                    <div key={opt.id} className="p-8 lg:p-10 flex flex-col md:flex-row md:items-center gap-8 group hover:bg-indigo-50/30 transition-all NOT-ITALIC">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-indigo-600 transition-colors">
                                                    <span className="text-white font-black text-xs">{opt.label.charAt(0)}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-display font-black text-slate-800 text-xl uppercase tracking-tight">{opt.label}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Key:</span>
                                                        <code className="bg-slate-100 px-2 py-0.5 rounded-lg text-indigo-600 font-mono text-[10px] font-black">{opt.value}</code>
                                                        {localMapping[opt.value] === 0 && (
                                                            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-200 shadow-sm ml-2">Intentionally 0 Points</span>
                                                        )}
                                                        {localMapping[opt.value] === undefined && (
                                                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-200 shadow-sm ml-2" title="Will default to 0 points">Missing Config</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mr-2 flex items-center gap-2">
                                                Reward Yield <Info size={10} />
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <div className="relative group/input">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        value={localMapping[opt.value] ?? ''}
                                                        onChange={(e) => updatePoint(opt.value, e.target.value)}
                                                        placeholder="0.0"
                                                        className="w-40 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-8 py-5 text-slate-800 font-black text-xl text-center focus:border-indigo-600 focus:bg-white outline-none transition-all shadow-inner group-hover/input:border-indigo-200"
                                                    />
                                                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none" size={18} />
                                                </div>
                                                {localMapping[opt.value] !== undefined && (
                                                    <button 
                                                        onClick={() => deleteMapping(opt.value)}
                                                        className="w-14 h-14 flex items-center justify-center text-slate-300 hover:text-white hover:bg-red-500 rounded-[1.5rem] transition-all border-2 border-transparent hover:border-red-600 hover:shadow-xl hover:shadow-red-100 group"
                                                        title="Flush Mapping"
                                                    >
                                                        <Trash2 size={20} className="group-active:scale-90" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Orphan Mappings */}
                        {orphanKeys.length > 0 && (
                            <div className="bg-slate-50 rounded-[3rem] border-2 border-slate-200 border-dashed p-10 space-y-10 transition-all hover:border-indigo-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-display font-black text-slate-700 uppercase tracking-tight">Administrative Overrides</h4>
                                            <p className="text-xs text-slate-400 font-medium">Extra mappings defined outside standard CRM options</p>
                                        </div>
                                    </div>
                                    <div title="These do not match any standard capacities">
                                        <XCircle className="text-slate-200 cursor-help" size={24} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {orphanKeys.map(key => (
                                        <div key={key} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between group hover:shadow-xl hover:border-indigo-100 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all"><Info size={18} /></div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custom Key</p>
                                                    <p className="text-base font-black text-slate-700 font-mono">{key}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={localMapping[key]}
                                                        onChange={e => updatePoint(key, e.target.value)}
                                                        className="w-24 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-black text-center focus:border-indigo-600 outline-none transition-all"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => deleteMapping(key)}
                                                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Administrative Controls */}
                    <div className="space-y-8 sticky top-8">
                        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
                            <h3 className="text-2xl font-display font-black tracking-tight mb-8 flex items-center gap-3">
                                <Info className="text-indigo-400" size={24} /> Points Protocol
                            </h3>
                            <div className="space-y-6">
                                <ProtocolStep icon={<CheckCircle2 size={14} className="text-indigo-400" />} text="Points are only minted upon 'INSTALLED' status confirmation." />
                                <ProtocolStep icon={<CheckCircle2 size={14} className="text-indigo-400" />} text="Decimal accuracy supported (e.g. 1.25). System floors partials for vouchers." />
                                <ProtocolStep icon={<CheckCircle2 size={14} className="text-indigo-400" />} text="Unmapped capacities generate 0 points. Map carefully." />
                            </div>
                        </div>

                        <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm hover:shadow-xl transition-all">
                            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 mb-8 flex items-center gap-2">
                                <Plus size={16} className="text-indigo-600" /> New Override Pattern
                            </h4>
                            <form 
                                className="space-y-6"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const key = formData.get('key')?.toString();
                                    const val = formData.get('val')?.toString() || '0';
                                    if (key) {
                                        updatePoint(key, val);
                                        e.currentTarget.reset();
                                        toast.success(`Rule created for: ${key}`);
                                    }
                                }}
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">System Slug (Unique)</label>
                                    <input 
                                        name="key" 
                                        required 
                                        placeholder="e.g. 12kw, above_3kw" 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black focus:border-indigo-600 focus:bg-white outline-none transition-all placeholder:text-slate-300" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Points Value</label>
                                    <input 
                                        name="val" 
                                        type="number" 
                                        step="0.1" 
                                        defaultValue="0" 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black focus:border-indigo-600 focus:bg-white outline-none transition-all" 
                                    />
                                </div>
                                <button type="submit" className="w-full py-5 bg-indigo-50 text-indigo-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all shadow-lg hover:shadow-indigo-100 active:scale-95">
                                    Execute Rule Matrix
                                </button>
                            </form>
                        </div>

                        <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200">
                            <h4 className="text-base font-black uppercase tracking-widest mb-4">Discovery Engine</h4>
                            <p className="text-[11px] text-indigo-100 font-medium leading-relaxed mb-10 opacity-90 italic">
                                To add official capacities that appear in Lead Forms, update the CRM Master Options.
                            </p>
            <button 
                onClick={() => onTabChange?.('crm_options')}
                className="w-full py-5 bg-white text-indigo-600 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-900 hover:text-white transition-all group"
            >
                Master Options <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const ProtocolStep = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
    <div className="flex gap-4">
        <div className="shrink-0 mt-1">{icon}</div>
        <p className="text-[11px] font-medium leading-relaxed text-slate-300">{text}</p>
    </div>
);
