import { enumeratorCommissionsApi } from '@/services/commissions.api';
import ProfitLedgerTable from '@/components/commission/ProfitLedgerTable';

export default function EnumeratorCommissionsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    My Earnings Ledger
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">Comprehensive view of your commission inflows</p>
            </div>

            <ProfitLedgerTable role="enumerator" api={enumeratorCommissionsApi} />
        </div>
    );
}
