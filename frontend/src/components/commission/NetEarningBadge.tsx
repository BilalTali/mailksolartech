import { IndianRupee } from 'lucide-react';

interface NetEarningBadgeProps {
    amount: number;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function NetEarningBadge({ amount, label = 'Net Earning', size = 'md' }: NetEarningBadgeProps) {
    const isPositive = amount > 0;
    const isNegative = amount < 0;

    const sizeClasses = {
        sm: {
            container: 'px-3 py-2',
            label: 'text-[10px] uppercase tracking-wider',
            amount: 'text-lg',
            icon: 'w-4 h-4'
        },
        md: {
            container: 'px-4 py-3',
            label: 'text-xs uppercase tracking-wider',
            amount: 'text-2xl',
            icon: 'w-5 h-5'
        },
        lg: {
            container: 'px-6 py-4',
            label: 'text-sm uppercase tracking-wider',
            amount: 'text-4xl',
            icon: 'w-8 h-8'
        }
    };

    const colorClasses = isPositive
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-100'
        : isNegative
            ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm shadow-rose-100'
            : 'bg-slate-50 border-slate-200 text-slate-700';

    const classes = sizeClasses[size];

    return (
        <div className={`rounded-2xl border flex flex-col items-start ${colorClasses} ${classes.container}`}>
            <span className={`font-bold opacity-80 ${classes.label}`}>
                {label}
            </span>
            <div className="flex items-center gap-1 mt-1">
                <IndianRupee className={`${classes.icon} ${isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-slate-400'}`} />
                <span className={`font-black tracking-tight ${classes.amount}`}>
                    {Math.abs(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
            </div>
        </div>
    );
}
