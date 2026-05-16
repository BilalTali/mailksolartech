import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import { adminNotificationsApi } from '@/services/adminNotifications.api';
import toast from 'react-hot-toast';

export default function AdminNotificationsPage() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['admin-notifications'],
        queryFn: () => adminNotificationsApi.getNotifications(),
    });

    const markReadMutation = useMutation({
        mutationFn: (id: number) => adminNotificationsApi.markNotificationAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            queryClient.invalidateQueries({ queryKey: ['admin-notifications-count'] });
            toast.success('Marked as read');
        },
    });

    const notifications = data?.data?.data ?? [];

    return (
        <div className="max-w-4xl mx-auto space-y-6 py-8 px-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Bell className="text-indigo-500" /> System Notifications
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Alerts, redemptions, and system updates</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="font-medium">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-10">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                            <Bell size={40} className="text-slate-200" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">No notifications yet</h3>
                        <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                            System alerts will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((n: any) => (
                            <div key={n.id} className={`p-5 hover:bg-slate-50 transition-colors flex gap-4 ${!n.read_at ? 'bg-indigo-500/5' : ''}`}>
                                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${!n.read_at ? 'bg-indigo-500/10 text-indigo-500 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                                    <Bell size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <h4 className={`font-bold text-sm leading-snug ${!n.read_at ? 'text-slate-900' : 'text-slate-600'}`}>
                                            {n.title ?? n.data?.title ?? 'Notification'}
                                        </h4>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap pt-1 flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                        {n.message ?? n.data?.message ?? n.type}
                                    </p>
                                    {!n.read_at && (
                                        <button
                                            onClick={() => markReadMutation.mutate(n.id)}
                                            className="mt-3 text-[11px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5 hover:text-indigo-600 active:scale-95 transition-all"
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
