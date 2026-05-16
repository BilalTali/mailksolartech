
import { IndianRupee, User, Wrench, Navigation, CheckCircle2, Clock, MapPin, HardHat } from 'lucide-react';

interface DistributionRowProps {
    recipientName: string;
    recipientRole: string;
    amount: number;
    category: string;
    status: 'pending' | 'paid' | 'confirmed';
    date: string;
}

export default function DistributionRow({ recipientName, recipientRole, amount, category, status, date }: DistributionRowProps) {
    const getRoleIcon = () => {
        switch (recipientRole) {
            case 'installer': return <Wrench className="w-4 h-4 text-amber-500" />;
            case 'surveyor': return <MapPin className="w-4 h-4 text-emerald-500" />;
            case 'field_technical_team': return <HardHat className="w-4 h-4 text-amber-600" />;
            case 'agent': return <User className="w-4 h-4 text-indigo-500" />;
            case 'enumerator': return <Navigation className="w-4 h-4 text-blue-500" />;
            default: return <User className="w-4 h-4 text-slate-500" />;
        }
    };

    const getCategoryPill = () => {
        let colorClasses = 'bg-slate-100 text-slate-600';
        if (category.toLowerCase().includes('commission')) colorClasses = 'bg-blue-100 text-blue-700';
        else if (category.toLowerCase().includes('meeting')) colorClasses = 'bg-purple-100 text-purple-700';
        else if (category.toLowerCase().includes('expense')) colorClasses = 'bg-amber-100 text-amber-700';

        return (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${colorClasses}`}>
                {category}
            </span>
        );
    };

    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    {getRoleIcon()}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{recipientName}</span>
                        {getCategoryPill()}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <span className="uppercase tracking-wider opacity-70">{recipientRole.replace(/_/g, ' ')}</span>
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-xs font-medium text-slate-400">Added {new Date(date).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-slate-500 mb-0.5">Amount</span>
                    <div className="flex items-center text-slate-800">
                        <IndianRupee className="w-4 h-4" />
                        <span className="font-black text-lg">{amount.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>

                <div className="flex flex-col items-end min-w-[80px]">
                    {status === 'paid' || status === 'confirmed' ? (
                        <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-1" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Paid</span>
                        </>
                    ) : (
                        <>
                            <Clock className="w-5 h-5 text-amber-500 mb-1" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
