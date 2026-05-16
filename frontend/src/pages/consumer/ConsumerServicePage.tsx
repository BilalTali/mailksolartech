import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    MessageSquarePlus, Loader2, Send, ClipboardList,
    Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
    RefreshCw, Headphones, Zap, Wrench, HelpCircle, Sparkles,
    UserCheck, ShieldCheck, Hammer, FileCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';

type TicketStatus = 'pending' | 'in_progress' | 'resolved';

interface TimelineEvent {
    event: string;
    label: string;
    description: string;
    date: string | null;
    done: boolean;
    technician?: string | null;
}

interface Ticket {
    id: number;
    subject: string;
    message: string;
    status: TicketStatus;
    submitted_at: string;
    submitted_date: string;
    timeline: TimelineEvent[];
}

const STATUS_CONFIG: Record<TicketStatus, {
    displayLabel: string;
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
    dot: string;
}> = {
    pending: {
        displayLabel: 'Pending',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: <Clock className="w-3.5 h-3.5" />,
        dot: 'bg-amber-400',
    },
    in_progress: {
        displayLabel: 'In Progress',
        color: 'text-indigo-700',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        dot: 'bg-indigo-500',
    },
    resolved: {
        displayLabel: 'Resolved',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        dot: 'bg-emerald-500',
    },
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
    submitted:   <FileCheck   className="w-3.5 h-3.5" />,
    escalated:   <ShieldCheck className="w-3.5 h-3.5" />,
    delegated:   <Hammer      className="w-3.5 h-3.5" />,
    work_report: <Wrench      className="w-3.5 h-3.5" />,
    resolved:    <UserCheck   className="w-3.5 h-3.5" />,
};

const SUBJECT_OPTIONS = [
    { value: 'System Not Working', label: 'System Not Working / No Power',  icon: <Zap         className="w-4 h-4" /> },
    { value: 'Inverter Issue',      label: 'Inverter Error / Blinking',       icon: <AlertCircle className="w-4 h-4" /> },
    { value: 'Panel Cleaning',      label: 'Request Panel Cleaning',          icon: <Sparkles    className="w-4 h-4" /> },
    { value: 'Wiring Issue',        label: 'Wiring / Connection Problem',     icon: <Wrench      className="w-4 h-4" /> },
    { value: 'General Query',       label: 'General Query / Other',           icon: <HelpCircle  className="w-4 h-4" /> },
];

function TicketCard({ ticket }: { ticket: Ticket }) {
    const [expanded, setExpanded] = useState(false);
    const cfg = STATUS_CONFIG[ticket.status];

    return (
        <div className={`rounded-2xl border ${cfg.border} bg-white overflow-hidden`}>
            {/* Header row */}
            <button
                onClick={() => setExpanded(p => !p)}
                className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-slate-50/60 transition-colors"
            >
                <span className="mt-1 flex-shrink-0">
                    <span className={`flex w-2.5 h-2.5 rounded-full ${cfg.dot} ${ticket.status !== 'resolved' ? 'animate-pulse' : ''}`} />
                </span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-800 text-sm leading-tight">{ticket.subject}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                            {cfg.icon} {cfg.displayLabel}
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{ticket.submitted_date}</p>
                    {!expanded && (
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">{ticket.message}</p>
                    )}
                </div>
                <span className="text-slate-400 flex-shrink-0 mt-0.5">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
            </button>

            {/* Expanded detail */}
            {expanded && (
                <div className="border-t border-slate-100 px-5 pb-6 pt-4 space-y-5">
                    {/* Consumer message */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Your Message</p>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                            {ticket.message}
                        </p>
                    </div>

                    {/* Event-by-event timeline */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Activity Timeline</p>
                        <div className="relative">
                            {ticket.timeline.map((event, i) => {
                                const isLast = i === ticket.timeline.length - 1;
                                const isDone = event.done;

                                return (
                                    <div key={event.event} className="flex gap-3">
                                        {/* Vertical line + icon */}
                                        <div className="flex flex-col items-center">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all z-10 ${
                                                isDone
                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                    : 'bg-white border-slate-200 text-slate-300'
                                            }`}>
                                                {EVENT_ICONS[event.event] ?? <Clock className="w-3.5 h-3.5" />}
                                            </div>
                                            {!isLast && (
                                                <div className={`w-0.5 flex-1 my-1 min-h-[24px] rounded-full ${isDone ? 'bg-emerald-300' : 'bg-slate-100'}`} />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className={`pb-4 flex-1 ${isLast ? 'pb-0' : ''}`}>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className={`text-sm font-bold leading-tight ${isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                                                    {event.label}
                                                </p>
                                                {event.date && (
                                                    <span className="text-[10px] text-slate-400 font-medium">{event.date}</span>
                                                )}
                                                {!isDone && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">Pending</span>
                                                )}
                                            </div>
                                            <p className={`text-xs mt-0.5 leading-relaxed ${isDone ? 'text-slate-600' : 'text-slate-400'}`}>
                                                {event.description}
                                            </p>
                                            {event.technician && isDone && (
                                                <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                    <Hammer className="w-3 h-3" /> {event.technician}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ConsumerServicePage() {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const queryClient = useQueryClient();

    const { data: ticketsRes, isLoading: ticketsLoading, refetch } = useQuery({
        queryKey: ['consumer-my-tickets'],
        queryFn: () => api.get('/consumer/my-tickets').then(r => r.data),
        refetchInterval: 60_000,
    });

    const tickets: Ticket[] = ticketsRes?.data ?? [];

    const ticketMutation = useMutation({
        mutationFn: () => api.post('/consumer/support-ticket', { subject, message }),
        onSuccess: () => {
            toast.success('Ticket submitted! Our team will contact you soon.');
            setSubject('');
            setMessage('');
            queryClient.invalidateQueries({ queryKey: ['consumer-my-tickets'] });
        },
        onError: (e: any) => {
            toast.error(e.response?.data?.message || 'Failed to submit ticket.');
        },
    });

    const pendingCount  = tickets.filter(t => t.status === 'pending').length;
    const activeCount   = tickets.filter(t => t.status === 'in_progress').length;
    const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Headphones className="w-6 h-6 text-indigo-600" />
                        Service &amp; Support
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Submit a request or track your existing complaints step by step</p>
                </div>
                {tickets.length > 0 && (
                    <button
                        onClick={() => refetch()}
                        className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Refresh tickets"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                {/* ── LEFT: New Request Form ── */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <MessageSquarePlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 text-base leading-tight">New Request</h2>
                            <p className="text-xs text-slate-500">Our team responds within 24 hours</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Issue Type</label>
                            <div className="grid grid-cols-1 gap-2">
                                {SUBJECT_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setSubject(opt.value)}
                                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left text-sm font-semibold transition-all ${
                                            subject === opt.value
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                                        }`}
                                    >
                                        <span className={subject === opt.value ? 'text-white' : 'text-indigo-500'}>
                                            {opt.icon}
                                        </span>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Details</label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={4}
                                placeholder="Describe your issue — what happened, when, and what you've already tried..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition text-sm resize-none leading-relaxed"
                            />
                        </div>

                        <button
                            onClick={() => ticketMutation.mutate()}
                            disabled={!subject || !message.trim() || ticketMutation.isPending}
                            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                        >
                            {ticketMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Submit Request
                        </button>
                    </div>
                </div>

                {/* ── RIGHT: Complaint Tracker ── */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Stats */}
                    {tickets.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                            {([
                                { label: 'Pending',     count: pendingCount,  cfg: STATUS_CONFIG.pending },
                                { label: 'In Progress', count: activeCount,   cfg: STATUS_CONFIG.in_progress },
                                { label: 'Resolved',    count: resolvedCount, cfg: STATUS_CONFIG.resolved },
                            ]).map(s => (
                                <div key={s.label} className={`rounded-2xl border ${s.cfg.border} ${s.cfg.bg} p-3 text-center`}>
                                    <p className={`text-2xl font-black ${s.cfg.color}`}>{s.count}</p>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${s.cfg.color} opacity-70 mt-0.5`}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-slate-400" />
                        <h2 className="font-bold text-slate-700 text-sm">My Complaints</h2>
                        {tickets.length > 0 && (
                            <span className="ml-auto text-[10px] font-black bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
                                {tickets.length} total
                            </span>
                        )}
                    </div>

                    {ticketsLoading ? (
                        <div className="flex items-center justify-center py-12 text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            <span className="text-sm font-medium">Loading your tickets...</span>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <ClipboardList className="w-7 h-7 text-slate-400" />
                            </div>
                            <p className="font-bold text-slate-700">No complaints yet</p>
                            <p className="text-sm text-slate-400 mt-1">Submit a request on the left — each ticket will show a full step-by-step activity log here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tickets.map(ticket => (
                                <TicketCard key={ticket.id} ticket={ticket} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
