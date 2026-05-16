import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import { enumeratorApi } from '@/services/enumerator.api';
import toast from 'react-hot-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function EnumeratorNotificationsPage() {
    const queryClient = useQueryClient();
    const { isSupported, isSubscribed, subscribe } = usePushNotifications();

    const { data, isLoading } = useQuery({
        queryKey: ['enumerator-notifications'],
        queryFn: () => enumeratorApi.getNotifications(),
    });

    const markReadMutation = useMutation({
        mutationFn: (id: number) => enumeratorApi.markNotificationAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enumerator-notifications'] });
            toast.success('Marked as read');
        },
    });

    const notifications = data?.data?.data?.data ?? data?.data?.data ?? [];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Bell className="text-emerald-600" /> Notifications
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Stay updated with your lead status and commissions</p>
                </div>
            </div>

            {isSupported && !isSubscribed && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 justify-between shadow-sm">
                    <div className="flex items-center gap-3 text-emerald-800">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                            <Bell size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Enable Alerts</p>
                            <p className="text-xs opacity-80">Get notified about lead updates and commissions instantly.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => subscribe().then(r => r ? toast.success('Push enabled!'):toast.error('Failed to enable'))}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
                    >
                        Enable Notifications
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="font-medium">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-10">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                            <Bell size={40} className="text-slate-200" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">No notifications yet</h3>
                        <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                            We'll notify you here when there are updates on your leads or commissions.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((n: any) => (
                            <div 
                                key={n.id} 
                                className={`p-5 transition-all flex gap-4 border-l-4 ${
                                    !n.read_at 
                                        ? 'bg-emerald-50/50 border-emerald-500 shadow-[inset_0_0_12px_rgba(16,185,129,0.05)]' 
                                        : 'bg-white border-transparent hover:bg-slate-50'
                                }`}
                            >
                                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${!n.read_at ? 'bg-emerald-100 text-emerald-600 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                                    <Bell size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <h4 className={`font-bold text-sm leading-snug ${!n.read_at ? 'text-slate-900' : 'text-slate-600'}`}>
                                            {n.title ?? n.data?.title ?? 'Notification'}
                                        </h4>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap pt-1 flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                        {n.message ?? n.data?.message ?? n.type}
                                    </p>
                                    {!n.read_at && (
                                        <button
                                            onClick={() => markReadMutation.mutate(n.id)}
                                            className="mt-3 text-[11px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 hover:text-emerald-700 active:scale-95 transition-all"
                                        >
                                            <CheckCircle2 size={13} />
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
