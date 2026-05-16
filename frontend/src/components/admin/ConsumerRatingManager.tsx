import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, UserCircle2, Loader2, Search } from 'lucide-react';
import api from '@/services/axios';

export const ConsumerRatingManager = () => {
    const [roleFilter, setRoleFilter] = React.useState('');
    const [search, setSearch] = React.useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['consumer-ratings', roleFilter],
        queryFn: async () => {
            const res = await api.get('/super-admin/consumer-ratings', { params: { role: roleFilter } });
            return res.data.data;
        },
    });

    const ratings = data?.data ?? [];

    const filteredRatings = ratings.filter((r: any) => 
        r.lead?.beneficiary_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.rated_user?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Team Performance Audit</h3>
                    <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest text-[10px]">Verified Consumer Ratings & Reviews</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition w-64"
                        />
                    </div>
                    <select 
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none cursor-pointer"
                    >
                        <option value="">All Roles</option>
                        <option value="installer">Installers</option>
                        <option value="surveyor">Surveyors</option>
                        <option value="agent">BDEs (Agent)</option>
                        <option value="super_agent">BDMs (SA)</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Auditing Records...</p>
                    </div>
                ) : filteredRatings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                            <Star size={32} className="text-slate-200" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-800">No Ratings Yet</h4>
                        <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                            Verified performance data from completed installations will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredRatings.map((r: any) => (
                            <div key={r.id} className="p-8 hover:bg-slate-50 transition-all flex flex-col md:flex-row md:items-start justify-between gap-8 group">
                                <div className="flex gap-6 flex-1 min-w-0">
                                    <div className="shrink-0 space-y-2 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors mx-auto">
                                            <UserCircle2 size={32} />
                                        </div>
                                        <span className="inline-block px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-widest">
                                            {r.role_rated}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-3 flex-1 min-w-0">
                                        <div>
                                            <h4 className="font-black text-slate-900 truncate">
                                                {r.rated_user?.name || 'Unassigned User'}
                                            </h4>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                                Rated by: {r.consumer?.name || 'Consumer'} ({r.lead?.ulid})
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} size={16} className={s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                                            ))}
                                            <span className="ml-2 text-sm font-black text-slate-900">{r.rating}.0</span>
                                        </div>

                                        {r.comments && (
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative">
                                                <div className="absolute top-2 left-2 text-slate-200 opacity-50">"</div>
                                                <p className="text-sm text-slate-600 italic leading-relaxed">
                                                    {r.comments}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="shrink-0 flex flex-col items-end gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                        {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${r.rating >= 4 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : r.rating >= 3 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                            {r.rating >= 4 ? 'Exemplary' : r.rating >= 3 ? 'Satisfactory' : 'Needs Review'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
