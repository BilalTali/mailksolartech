import { Outlet } from 'react-router-dom';
import TechnicalSidebar from './TechnicalSidebar';

export default function TechnicalLayout() {
    return (
        <div className="flex bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
            <TechnicalSidebar />
            <main className="flex-1 overflow-x-hidden pt-12 md:pt-4" id="main-content">
                <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500 pb-24">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
