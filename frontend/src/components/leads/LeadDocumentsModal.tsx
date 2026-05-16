import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, CheckCircle, Image as ImageIcon, CreditCard, FileBadge, X, Loader2 } from 'lucide-react';
import api from '@/services/axios';

interface Document {
    id: string | number;
    document_type: string;
    original_filename: string;
    created_at: string;
    download_url: string;
    is_virtual: boolean;
    source?: 'creator' | 'system' | 'installer';
    metadata?: { make?: string; serial?: string };
}

const REQUIRED_DOCS = [
    { key: 'feasibility_report', label: 'Feasibility Report' },
    { key: 'e_token', label: 'E-Token' },
];

interface Props {
    ulid: string;
    triggerButtonText?: string;
    buttonClassName?: string;
}

export function LeadDocumentsModal({ ulid, triggerButtonText = 'View Documents', buttonClassName = "px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 border border-indigo-100" }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    const { data: documentsData, isLoading } = useQuery({
        queryKey: ['lead-documents', ulid],
        queryFn: async () => {
            const res = await api.get(`/leads/${ulid}/documents/all`);
            return res.data;
        },
        enabled: isOpen,
    });

    const openAuthenticatedFile = async (url: string, fallbackName: string) => {
        try {
            // Check if URL is same origin
            if (url.startsWith('/api') || url.includes(import.meta.env.VITE_API_BASE_URL)) {
                const response = await api.get(url.replace(import.meta.env.VITE_API_BASE_URL, ''), {
                    responseType: 'blob'
                });
                const blob = new Blob([response.data], {
                    type: (response.headers['content-type'] as string) || 'application/octet-stream'
                });
                const objectUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = objectUrl;
                a.download = fallbackName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(objectUrl);
            } else {
                window.open(url, '_blank');
            }
        } catch (err) {
            console.error('Failed to open document:', err);
            window.open(url, '_blank');
        }
    };

    const docs = documentsData?.data as Document[] || [];

    const labelMap: Record<string, string> = {
        aadhaar: 'Aadhaar Card',
        aadhaar_front: 'Aadhaar Front',
        aadhaar_back: 'Aadhaar Back',
        electricity_bill: 'Electricity Bill',
        photo: 'Beneficiary Photo',
        solar_roof_photo: 'Solar Roof Photo',
        bank_passbook: 'Bank Passbook',
        receipt: 'Completion Receipt',
        feasibility_report: 'Feasibility Report',
        e_token: 'E-Token',
        additional_document: 'Application Acknowledgement',
        other: 'PAN / Other',
        'Agreement (Annexure 2)': 'Legal Agreement (Annexure 2)'
    };
    
    const iconMap: Record<string, React.ReactNode> = {
        aadhaar: <FileBadge size={16} />,
        aadhaar_front: <FileBadge size={16} />,
        aadhaar_back: <FileBadge size={16} />,
        electricity_bill: <FileText size={16} />,
        photo: <ImageIcon size={16} />,
        solar_roof_photo: <ImageIcon size={16} />,
        bank_passbook: <CreditCard size={16} />,
        receipt: <CheckCircle size={16} />,
        'Payment Receipt': <FileText size={16} className="text-emerald-500" />,
        'Pro Forma Quotation': <FileText size={16} className="text-purple-500" />,
        feasibility_report: <FileText size={16} className="text-blue-500" />,
        e_token: <FileText size={16} className="text-amber-500" />,
        'Annexure B': <FileText size={16} className="text-rose-500" />,
        'Agreement (Annexure 2)': <FileText size={16} className="text-indigo-500" />,
        geo_material: <ImageIcon size={16} className="text-orange-500" />,
        geo_panel_serial: <ImageIcon size={16} className="text-orange-500" />,
        geo_erected_la: <ImageIcon size={16} className="text-orange-500" />,
        geo_earthing: <ImageIcon size={16} className="text-orange-500" />,
        geo_inverter_serial: <ImageIcon size={16} className="text-orange-500" />,
        agreement_consumer: <FileText size={16} className="text-orange-500" />,
        loan_statement: <FileText size={16} className="text-orange-500" />,
        geo_consumer_inverter: <ImageIcon size={16} className="text-orange-500" />,
        additional_document: <FileText size={16} />,
        other: <FileText size={16} />
    };

    const creatorDocs = docs.filter(d => d.source === 'creator');
    const systemDocs = docs.filter(d => d.source === 'system');
    const installerDocs = docs.filter(d => d.source === 'installer');

    const renderDocList = (list: Document[]) => (
        <div className="grid grid-cols-1 gap-3">
            {list.map(doc => (
                <button
                    key={doc.id}
                    onClick={() => openAuthenticatedFile(doc.download_url, doc.original_filename)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all group ${doc.is_virtual ? 'border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300' : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50'}`}
                >
                    <div className={`p-2 rounded-lg ${doc.is_virtual ? 'bg-white shadow-sm text-indigo-600' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-orange-500'}`}>
                        {iconMap[doc.document_type] ?? <FileText size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-800 truncate">{labelMap[doc.document_type] ?? doc.document_type}</p>
                            {doc.is_virtual && <span className="bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">Auto-Generated</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5" title={doc.original_filename}>{doc.original_filename}</p>
                        {(doc.metadata?.make || doc.metadata?.serial) && (
                            <div className="flex gap-2 mt-1">
                                {doc.metadata.make && <span className="text-[9px] bg-white border px-1.5 py-0.5 rounded text-slate-500">Make: {doc.metadata.make}</span>}
                                {doc.metadata.serial && <span className="text-[9px] bg-white border px-1.5 py-0.5 rounded font-mono text-slate-500">S/N: {doc.metadata.serial}</span>}
                            </div>
                        )}
                    </div>
                    <Download size={16} className={`shrink-0 mt-1 ${doc.is_virtual ? 'text-indigo-300 group-hover:text-indigo-600' : 'text-slate-300 group-hover:text-orange-500'}`} />
                </button>
            ))}
        </div>
    );

    return (
        <>
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(true); }} className={buttonClassName}>
                <FileText size={14} /> {triggerButtonText}
            </button>

            {isOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <FileText className="text-indigo-600" size={18} />
                                    Lead Documents
                                </h3>
                                <p className="text-[10px] text-slate-500 font-mono mt-1">Ref: {ulid.slice(-8)}</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                                    <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
                                    <p className="text-xs font-medium uppercase tracking-widest">Loading Documents...</p>
                                </div>
                            ) : docs.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm font-medium">No documents available yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Missing Requirements Checklist */}
                                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3">Requirements Checklist</p>
                                        <div className="space-y-2">
                                            {REQUIRED_DOCS.map(req => {
                                                const exists = docs.some(d => d.document_type === req.key);
                                                return (
                                                    <div key={req.key} className="flex items-center justify-between">
                                                        <span className="text-xs font-medium text-slate-700">{req.label}</span>
                                                        {exists ? (
                                                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                                <CheckCircle size={10} /> Received
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-white border border-orange-200 px-2 py-0.5 rounded-full shadow-sm">
                                                                <X size={10} /> Missing
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {creatorDocs.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b pb-2">Added by Lead Creator</h4>
                                            {renderDocList(creatorDocs)}
                                        </div>
                                    )}

                                    {systemDocs.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3 border-b pb-2">Auto-Generated System Docs</h4>
                                            {renderDocList(systemDocs)}
                                        </div>
                                    )}

                                    {installerDocs.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-3 border-b pb-2">Added by Installer</h4>
                                            {renderDocList(installerDocs)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setIsOpen(false)} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
