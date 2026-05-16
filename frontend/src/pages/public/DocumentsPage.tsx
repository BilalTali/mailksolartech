import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Search, FolderOpen, ExternalLink, Box } from 'lucide-react';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import SEOHead from '@/components/shared/SEOHead';
import { publicApi, type PublicDocument } from '@/services/public.api';

async function fetchPublicDocuments(): Promise<PublicDocument[]> {
    return publicApi.getDocuments();
}

export default function DocumentsPage() {
    const [search, setSearch] = useState('');

    const { data: documents = [], isLoading } = useQuery({
        queryKey: ['public-documents'],
        queryFn: fetchPublicDocuments,
    });

    const filtered = documents.filter(d =>
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        (d.category ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (d.description ?? '').toLowerCase().includes(search.toLowerCase())
    );

    // Group by category
    const grouped = filtered.reduce<Record<string, PublicDocument[]>>((acc, doc) => {
        const key = doc.category ?? 'General';
        if (!acc[key]) acc[key] = [];
        acc[key].push(doc);
        return acc;
    }, {});

    const categories = Object.keys(grouped).sort();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
            <SEOHead
                title="Public Documents & Downloads — PM Surya Ghar"
                description="Download official forms, guidelines and templates for PM Surya Ghar Muft Bijli Yojana integrations."
                breadcrumbs={[
                    { name: 'Home', url: window.location.origin },
                    { name: 'Documents', url: window.location.origin + '/documents' }
                ]}
            />

            <Navbar />

            <main className="flex-grow w-full relative pb-20">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
                <div className="absolute top-0 right-1/2 translate-x-1/2 w-[80%] h-96 bg-gradient-to-b from-sky-200/40 via-white/10 to-transparent pointer-events-none blur-3xl rounded-b-full" />

                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
                    
                    {/* Header */}
                    <div className="text-center max-w-3xl mx-auto mb-16 mt-8">
                        <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200/60 rounded-full px-5 py-1.5 text-xs uppercase tracking-widest text-sky-600 font-black mb-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <Box className="w-4 h-4" />
                            Resource Center
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                            Public <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">Documents</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-2xl mx-auto">
                            Access official forms, procedural guidelines, and application templates for seamless navigation of the PM Surya Ghar Muft Bijli Yojana.
                        </p>

                        {/* Search Bar */}
                        <div className="mt-10 max-w-lg mx-auto relative animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search guidelines, forms, PDFs..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 text-slate-800 text-base font-medium shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="animate-in fade-in zoom-in-95 duration-700">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-white/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 shadow-sm">
                                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-sky-500 animate-spin mb-4" />
                                <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">Fetching Legal Resources...</p>
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/50 text-center">
                                <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                                    <FolderOpen className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">No Documents Found</h3>
                                <p className="text-slate-500 font-medium">
                                    {search ? `No resources match your search "${search}".` : 'Our repository is currently being updated. Check back soon.'}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8 md:p-12">
                                <div className="space-y-12">
                                    {categories.map(cat => (
                                        <section key={cat}>
                                            <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-100">
                                                <div className="p-2 bg-slate-100 rounded-xl text-slate-500 shrink-0">
                                                    <FolderOpen className="w-5 h-5 pointer-events-none" />
                                                </div>
                                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">
                                                    {cat}
                                                </h2>
                                                <span className="ml-auto bg-slate-100 border border-slate-200 text-slate-500 font-black px-3 py-1 rounded-full text-xs shadow-inner">
                                                    {grouped[cat].length}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {grouped[cat].map(doc => (
                                                    <div
                                                        key={doc.id}
                                                        className="group bg-slate-50 border border-slate-200/60 rounded-[1.5rem] p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-lg hover:border-sky-200 hover:-translate-y-1 hover:bg-white"
                                                    >
                                                        {/* Icon + Title */}
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 group-hover:bg-sky-50 group-hover:border-sky-100 transition-colors">
                                                                {doc.thumbnail_url ? (
                                                                    <img src={doc.thumbnail_url} alt="" className="w-10 h-10 object-cover rounded-lg" />
                                                                ) : (
                                                                    <FileText className="w-6 h-6 text-slate-400 group-hover:text-sky-500 transition-colors" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-black text-slate-800 leading-tight text-base mb-1 line-clamp-2">{doc.title}</h3>
                                                                {doc.description && (
                                                                    <p className="text-sm text-slate-500 font-medium line-clamp-2">{doc.description}</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Download Action */}
                                                        {doc.file_url ? (
                                                            <a
                                                                href={doc.file_url}
                                                                target="_blank"
                                                                rel="noreferrer noopener"
                                                                className="mt-auto flex items-center justify-between w-full px-5 py-3 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-700 hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all duration-300 shadow-sm"
                                                            >
                                                                <span className="flex items-center gap-2">
                                                                    <Download className="w-4 h-4" />
                                                                    Download File
                                                                </span>
                                                                <ExternalLink className="w-4 h-4 opacity-50" />
                                                            </a>
                                                        ) : (
                                                            <span className="mt-auto flex items-center justify-center w-full px-5 py-3 rounded-xl bg-slate-100/50 border border-slate-200/50 font-bold text-sm text-slate-400 cursor-not-allowed">
                                                                File Not Available
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
