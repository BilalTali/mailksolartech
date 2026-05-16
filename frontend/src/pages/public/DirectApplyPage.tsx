import LeadForm from '@/components/shared/LeadForm';
import { Leaf } from 'lucide-react';

export default function DirectApplyPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Minimal Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                            <Leaf size={18} className="text-white" />
                        </div>
                        <span className="font-bold text-slate-800 text-lg">Andleeb Surya</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 py-8">
                <div className="mb-6 max-w-4xl mx-auto px-4 text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">
                        PM Surya Ghar Muft Bijli Yojana
                    </h1>
                    <p className="text-slate-600 mt-2 text-sm max-w-2xl">
                        Apply for free solar electricity today. Submit your information below to register your home with our authorized agent network.
                    </p>
                </div>
                
                <LeadForm role="public" />
            </main>

            {/* Minimal Footer */}
            <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <p className="text-xs text-slate-500">
                        &copy; {new Date().getFullYear()} Andleeb Surya. All rights reserved. <br/>
                        An authorized channel partner for PM Surya Ghar Yojana.
                    </p>
                </div>
            </footer>
        </div>
    );
}
