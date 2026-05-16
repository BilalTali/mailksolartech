import React from 'react';

interface Props {
    count: number;
    onActionClick: () => void;
}

export const RevertedLeadBanner: React.FC<Props> = ({ count, onActionClick }) => {
    if (count === 0) return null;

    return (
        <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl p-4 flex items-center gap-4 shadow-lg">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
                ↩
            </div>
            <div className="flex-1">
                <p className="font-semibold text-sm">
                    {count === 1
                        ? '1 lead needs your attention'
                        : `${count} leads need your attention`}
                </p>
                <p className="text-red-100 text-xs mt-0.5">
                    {count === 1 ? 'This lead was' : 'These leads were'} returned by your Super Agent with corrections needed. Please review and resubmit.
                </p>
            </div>
            <button
                onClick={onActionClick}
                className="flex-shrink-0 bg-white text-red-600 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
                View {count > 1 ? 'All' : ''} →
            </button>
        </div>
    );
};
