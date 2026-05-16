import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    MapPin, CheckCircle, Loader2, ClipboardList, List,
    PlayCircle, Navigation, AlertCircle, Send, X, Wrench, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/services/axios';
import { useAuthStore } from '@/store/authStore';
import type { Lead } from '@/types';

const fetchTechnicalLeads = async () => {
    const res = await api.get<{ leads: Lead[] }>('/technical/leads');
    return res.data.leads;
};

/** Inline support-task completion form rendered inside the card */
function SupportTaskPanel({ lead, onDone }: { lead: Lead; onDone: () => void }) {
    const [notes, setNotes] = useState('');
    const queryClient = useQueryClient();

    const completeMutation = useMutation({
        mutationFn: async () => api.post(`/technical/leads/${lead.ulid}/complete-support`, { message: notes }),
        onSuccess: () => {
            toast.success('Support task marked complete!');
            setNotes('');
            queryClient.invalidateQueries({ queryKey: ['technical-assigned-leads'] });
            onDone();
        },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to submit'),
    });

    return (
        <div className="border border-rose-200 rounded-xl bg-rose-50 p-3 mt-2 space-y-2" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-1.5 mb-1">
                <Wrench className="w-3.5 h-3.5 text-rose-600" />
                <p className="text-xs font-black uppercase tracking-widest text-rose-700">Task Completion Report</p>
            </div>
            <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Describe what was done, parts replaced, issue resolved..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-rose-200 focus:border-rose-400 outline-none resize-none bg-white"
            />
            <div className="flex gap-2">
                <button
                    onClick={() => completeMutation.mutate()}
                    disabled={!notes.trim() || completeMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-600 text-white rounded-lg text-xs font-black hover:bg-rose-700 transition disabled:opacity-50"
                >
                    {completeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Submit Report
                </button>
            </div>
        </div>
    );
}

// Technical leads overview with support delegation support
export default function TechnicalLeadsPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [openSupportPanel, setOpenSupportPanel] = useState<string | null>(null);

    const { data: leads = [], isLoading } = useQuery({
        queryKey: ['technical-assigned-leads'],
        queryFn: fetchTechnicalLeads,
    });

    const handleSiteSurveyClick      = (lead: Lead) => navigate(`/technical/leads/${lead.ulid}/survey`);
    const handleMaterialChecklistClick= (lead: Lead) => navigate(`/technical/leads/${lead.ulid}/checklist`);
    const handleInstallationFormClick = (lead: Lead) => navigate(`/technical/leads/${lead.ulid}/installation-form`);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Assigned Leads</h1>
                    <p className="text-sm text-slate-500">Visit sites and upload geo-tagged status updates.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
            ) : leads.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                    <List size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold text-slate-600">No leads assigned</p>
                    <p className="text-sm">You currently have no tasks assigned to you by the admin.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {leads.map((lead: Lead) => {
                        // Parallel tracks: surveyor can visit when lead is at REGISTERED or
                        // anywhere in the banking track (lead creator may be handling docs in parallel)
                        const canSurvey = lead.assigned_surveyor_id === user?.id &&
                            ['NEW', 'REGISTERED',
                             'LEAD_DOCUMENTS_PRINTED', 'SIGNATURE_PENDING', 'SIGNATURE_DONE'
                            ].includes(lead.status);
                        const hasVisitedSurvey = lead.surveyor_form_submitted_at != null ||
                            ['SURVEY_DONE', 'LEAD_DOCUMENTS_PRINTED', 'SIGNATURE_PENDING',
                             'SIGNATURE_DONE', 'FILE_DISBURSED', 'DISBURSEMENT_VERIFIED',
                             'DISPATCH_INITIATED', 'IN_TRANSIT',
                             'DELIVERED', 'MATERIAL_VERIFIED_BY_CONSUMER', 'INSTALLATION_SCHEDULED',
                             'INSTALLATION_IN_PROGRESS', 'SOLAR_INSTALLED', 'LEAD_COMPLETED'].includes(lead.status);

                        // Material Checklist is now available once installation is scheduled or in progress
                        const canChecklist = lead.assigned_installer_id === user?.id &&
                            ['INSTALLATION_SCHEDULED', 'INSTALLATION_IN_PROGRESS'].includes(lead.status);
                        const hasChecklist = ['SOLAR_INSTALLED', 'POD_INSPECTION_INITIATED', 'POD_SUCCESSFUL', 'LEAD_COMPLETED'].includes(lead.status);

                        // Installation form (Photos) is available once they start work
                        const canInstallForm = lead.assigned_installer_id === user?.id &&
                            ['INSTALLATION_SCHEDULED', 'INSTALLATION_IN_PROGRESS'].includes(lead.status);
                        const hasCompletedInstall = ['SOLAR_INSTALLED', 
                            'POD_INSPECTION_INITIATED', 'POD_SUCCESSFUL', 'LEAD_COMPLETED'].includes(lead.status);

                        // Support task state
                        const hasSupportTask    = lead.status_logs?.some((l: any) => l.notes?.includes('TEAM_ACTION_REQUIRED'));
                        const hasCompletedTask  = lead.status_logs?.some((l: any) => l.notes?.includes('TEAM_TASK_COMPLETED'));
                        const isSupportPanelOpen = openSupportPanel === lead.ulid;

                        return (
                            <div
                                key={lead.id}
                                onClick={() => {
                                    if (canSurvey) handleSiteSurveyClick(lead);
                                    else if (canChecklist) handleMaterialChecklistClick(lead);
                                    else if (canInstallForm) handleInstallationFormClick(lead);
                                }}
                                className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all cursor-pointer hover:border-orange-400 hover:shadow-md group ${(!canSurvey && !canChecklist && !canInstallForm) ? 'opacity-80 grayscale-[0.3]' : ''}`}
                            >
                                {/* Card header */}
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between group-hover:bg-orange-50/50 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                                ULID: {lead.ulid.slice(-8)}
                                            </div>
                                            {hasSupportTask && !hasCompletedTask && (
                                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[8px] font-black uppercase tracking-tighter rounded-full flex items-center gap-1 animate-pulse">
                                                    <AlertCircle size={8} /> Support Task
                                                </span>
                                            )}
                                            {hasSupportTask && hasCompletedTask && (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-tighter rounded-full flex items-center gap-1">
                                                    <CheckCircle size={8} /> Task Done
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                                            {lead.beneficiary_name}
                                        </h3>
                                        {lead.installation_scheduled_at && (
                                            <div className="flex items-center gap-1.5 mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-black uppercase tracking-tighter w-fit border border-blue-100">
                                                <Calendar size={10} />
                                                Install: {new Date(lead.installation_scheduled_at).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-block px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${
                                            lead.status === 'LEAD_COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                                        }`}>
                                            {lead.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="p-4 space-y-3 flex-1 text-sm bg-white">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="text-slate-400 shrink-0 mt-0.5" size={14} />
                                        <span className="text-slate-600 line-clamp-2">
                                            {lead.beneficiary_address || `${lead.beneficiary_district}, ${lead.beneficiary_state}`}
                                        </span>
                                    </div>

                                    {/* Support task context — show consumer complaint to technician */}
                                    {hasSupportTask && (
                                        <div className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">Consumer Complaint</p>
                                            <p className="text-xs text-slate-600 line-clamp-2">
                                                {(() => {
                                                    const filtered = lead.status_logs?.filter((l: any) => l.notes?.includes('TEAM_ACTION_REQUIRED')) || [];
                                                    const lastLog = filtered[filtered.length - 1];
                                                    return lastLog?.notes?.replace(/^TEAM_ACTION_REQUIRED:\s*/i, '') || 'Support escalated to you for action.';
                                                })()}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div className="p-4 border-t border-slate-100 flex flex-col gap-2 bg-slate-50 group-hover:bg-white transition-colors">
                                    {/* Site Survey */}
                                    {lead.assigned_surveyor_id === user?.id && (
                                        canSurvey ? (
                                            <button onClick={e => { e.stopPropagation(); handleSiteSurveyClick(lead); }}
                                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
                                                <ClipboardList size={16} /> Pre-installation Survey
                                            </button>
                                        ) : hasVisitedSurvey ? (
                                            <div className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-sm border border-indigo-100">
                                                <CheckCircle size={16} /> Survey Completed
                                            </div>
                                        ) : null
                                    )}


                                    {/* Material Checklist */}
                                    {lead.assigned_installer_id === user?.id && (
                                        canChecklist ? (
                                            <button onClick={e => { e.stopPropagation(); handleMaterialChecklistClick(lead); }}
                                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition shadow-lg shadow-amber-100">
                                                <ClipboardList size={16} /> Material Checklist / Returns
                                            </button>
                                        ) : hasChecklist ? (
                                            <div className="flex items-center justify-center gap-2 w-full py-2 bg-amber-50 text-amber-700 rounded-lg font-bold text-sm border border-amber-100">
                                                <CheckCircle size={16} /> Checklist Submitted
                                            </div>
                                        ) : null
                                    )}

                                    {/* Installation Photos */}
                                    {lead.assigned_installer_id === user?.id && (
                                        canInstallForm ? (
                                            <button onClick={e => { e.stopPropagation(); handleInstallationFormClick(lead); }}
                                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition shadow-lg shadow-emerald-100">
                                                <PlayCircle size={16} /> Upload Installation Photos
                                            </button>
                                        ) : hasCompletedInstall ? (
                                            <div className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-sm border border-emerald-100">
                                                <CheckCircle size={16} /> Photos & Specs Uploaded
                                            </div>
                                        ) : null
                                    )}

                                    {/* ── Support Task ── */}
                                    {hasSupportTask && !hasCompletedTask && (
                                        <>
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setOpenSupportPanel(isSupportPanelOpen ? null : lead.ulid);
                                                }}
                                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition shadow-lg shadow-rose-100 mt-1"
                                            >
                                                {isSupportPanelOpen
                                                    ? <><X size={16} /> Cancel</>
                                                    : <><Wrench size={16} /> Submit Task Completion Report</>
                                                }
                                            </button>
                                            {isSupportPanelOpen && (
                                                <SupportTaskPanel
                                                    lead={lead}
                                                    onDone={() => setOpenSupportPanel(null)}
                                                />
                                            )}
                                        </>
                                    )}

                                    {hasSupportTask && hasCompletedTask && (
                                        <div className="flex items-center justify-center gap-2 w-full py-2 bg-rose-50 text-rose-700 rounded-lg font-bold text-sm border border-rose-100 mt-1">
                                            <CheckCircle size={16} /> Support Task Report Submitted
                                        </div>
                                    )}

                                    {!canSurvey && !canChecklist && !canInstallForm && !hasCompletedInstall && !hasVisitedSurvey && !hasSupportTask && (
                                        <div className="text-center py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                            No pending action
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
