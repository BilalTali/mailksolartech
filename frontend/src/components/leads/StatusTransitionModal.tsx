import { useState } from 'react';
import { FileText, X, FileCheck, Ticket, UploadCloud, Cpu, Zap, Ruler } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => void;
    isPending: boolean;
    targetStatus: string;
    targetStatusLabel: string;
}

export function StatusTransitionModal({ isOpen, onClose, onSubmit, isPending, targetStatus, targetStatusLabel }: Props) {
    const [feasibilityReport, setFeasibilityReport] = useState<File | null>(null);
    const [eToken, setEToken] = useState<File | null>(null);
    const [additionalDocument, setAdditionalDocument] = useState<File | null>(null);
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [visibleToDownline, setVisibleToDownline] = useState(false);

    // Survey spec fields (set by admin at MNRE registration, pre-fill the surveyor form)
    const [systemCapacityKw, setSystemCapacityKw] = useState('');
    const [panelQuantity, setPanelQuantity] = useState('');
    const [panelModelMake, setPanelModelMake] = useState('');
    const [inverterModelMake, setInverterModelMake] = useState('');
    const [wireLengthMeters, setWireLengthMeters] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (targetStatus === 'REGISTERED' && !registrationNumber.trim()) {
            toast.error("Registration Number is required.");
            return;
        }
        if (!feasibilityReport) {
            toast.error("Feasibility Report is required to register at MNRE.");
            return;
        }
        if (!eToken) {
            toast.error("E-Token is required to register at MNRE.");
            return;
        }

        const fd = new FormData();
        fd.append('status', targetStatus);
        fd.append('visible_to_downline', visibleToDownline ? '1' : '0');

        if (notes) fd.append('notes', notes);
        if (targetStatus === 'REGISTERED') {
            fd.append('registration_number', registrationNumber.trim());
        }

        fd.append('feasibility_report', feasibilityReport);
        fd.append('e_token', eToken);
        if (additionalDocument) fd.append('additional_document', additionalDocument);

        // Survey spec — optional but recommended
        if (systemCapacityKw) fd.append('survey_system_capacity_kw', systemCapacityKw);
        if (panelQuantity) fd.append('survey_panel_quantity', panelQuantity);
        if (panelModelMake) fd.append('survey_panel_model_make', panelModelMake);
        if (inverterModelMake) fd.append('survey_inverter_model_make', inverterModelMake);
        if (wireLengthMeters) fd.append('survey_wire_length_meters', wireLengthMeters);

        onSubmit(fd);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-50 shrink-0">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <UploadCloud className="text-indigo-600" size={18} />
                            Upload Required Documents
                        </h3>
                        <p className="text-xs text-indigo-700 mt-1 font-medium">To change status to "{targetStatusLabel}"</p>
                    </div>
                    <button disabled={isPending} onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                    <p className="text-xs text-slate-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100 italic">
                        The system requires the following MNRE documents to proceed with registration. Please upload them below.
                    </p>

                    {/* MNRE Documents */}
                    <div className="space-y-3">
                        {targetStatus === 'REGISTERED' && (
                            <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                    <FileText size={12} className="text-indigo-500" /> Registration Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={registrationNumber}
                                    onChange={e => setRegistrationNumber(e.target.value)}
                                    placeholder="Enter MNRE Registration Number"
                                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                <FileCheck size={12} className="text-blue-500" /> Feasibility Report <span className="text-red-500">*</span>
                            </label>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFeasibilityReport(e.target.files?.[0] || null)}
                                className="text-[11px] text-slate-600 block w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 focus:outline-none" />
                        </div>

                        <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                <Ticket size={12} className="text-amber-500" /> E-Token <span className="text-red-500">*</span>
                            </label>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setEToken(e.target.files?.[0] || null)}
                                className="text-[11px] text-slate-600 block w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 focus:outline-none" />
                        </div>

                        <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                <FileText size={12} className="text-slate-500" /> Application Acknowledgement <span className="text-[10px] font-normal text-slate-400 capitalize">(Optional)</span>
                            </label>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setAdditionalDocument(e.target.files?.[0] || null)}
                                className="text-[11px] text-slate-600 block w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 focus:outline-none" />
                        </div>
                    </div>

                    {/* Survey Spec — pre-fills the surveyor's form */}
                    <div className="border border-indigo-200 rounded-xl overflow-hidden">
                        <div className="bg-indigo-50 px-4 py-2.5 flex items-center gap-2">
                            <Cpu size={14} className="text-indigo-600" />
                            <p className="text-xs font-black text-indigo-800 uppercase tracking-wider">Solar System Specification</p>
                            <span className="ml-auto text-[10px] text-indigo-500 font-semibold italic">Pre-fills surveyor form</span>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-3 bg-white">
                            <div>
                                <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block flex items-center gap-1">
                                    <Zap size={10} /> System Capacity (kW)
                                </label>
                                <input type="number" step="0.1" value={systemCapacityKw} onChange={e => setSystemCapacityKw(e.target.value)}
                                    placeholder="e.g. 3.0"
                                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">Panel Quantity</label>
                                <input type="number" value={panelQuantity} onChange={e => setPanelQuantity(e.target.value)}
                                    placeholder="e.g. 6"
                                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">Panel Make / Model</label>
                                <input type="text" value={panelModelMake} onChange={e => setPanelModelMake(e.target.value)}
                                    placeholder="e.g. Waaree 540W"
                                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">Inverter Make / Model</label>
                                <input type="text" value={inverterModelMake} onChange={e => setInverterModelMake(e.target.value)}
                                    placeholder="e.g. Growatt 3kW"
                                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block flex items-center gap-1">
                                    <Ruler size={10} /> Wire Length (Meters)
                                </label>
                                <input type="number" value={wireLengthMeters} onChange={e => setWireLengthMeters(e.target.value)}
                                    placeholder="e.g. 30"
                                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>
                        </div>
                    </div>

                    {/* Notes & visibility */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                            <input type="checkbox" id="visible_to_downline" checked={visibleToDownline} onChange={e => setVisibleToDownline(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                            <label htmlFor="visible_to_downline" className="text-[11px] font-bold text-indigo-700 uppercase cursor-pointer select-none">
                                Share documents with downstream agents/enumerators
                            </label>
                        </div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Change Notes</label>
                        <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="Optional note for this status change…"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <button disabled={isPending} onClick={onClose}
                        className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50">
                        Cancel
                    </button>
                    <button
                        disabled={isPending || !feasibilityReport || !eToken || (targetStatus === 'REGISTERED' && !registrationNumber.trim())}
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm">
                        {isPending ? 'Uploading & Saving...' : 'Upload & Change Status'}
                    </button>
                </div>
            </div>
        </div>
    );
}
