import { useQuery } from '@tanstack/react-query';
import { documentsApi, type AdminDocument } from '@/services/documents.api';
import { FileText, Download, Search, RefreshCcw, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export default function DocumentsPage() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const { data: documents = [], isLoading } = useQuery({
        queryKey: ['agent-resources'],
        queryFn: documentsApi.getResources,
    });

    const categories = Array.from(new Set(documents.map(d => d.category).filter(Boolean))) as string[];

    const filteredDocs = documents.filter(d => {
        const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
            d.description?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = !selectedCategory || d.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <FileText className="text-primary" /> Resource Library
                </h1>
                <p className="text-slate-500 text-sm">Download forms, guidelines, and marketing materials</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative group w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search resources..."
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary bg-white shadow-sm transition-all text-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${!selectedCategory ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white text-slate-500 border border-slate-200 hover:border-primary/50'}`}
                    >
                        All Resources
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white text-slate-500 border border-slate-200 hover:border-primary/50'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <RefreshCcw className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDocs.map((doc: AdminDocument) => (
                        <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col hover:shadow-lg transition-all duration-300 group">
                            <div className="aspect-[4/3] rounded-xl bg-slate-100 mb-4 overflow-hidden border border-slate-100 flex items-center justify-center relative">
                                {doc.thumbnail_url ? (
                                    <img src={doc.thumbnail_url} alt={doc.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <FileText size={48} className="text-slate-300 group-hover:text-primary/40 transition-colors" />
                                )}
                                <div className="absolute top-2 right-2">
                                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-black text-slate-700 rounded-lg shadow-sm uppercase tracking-wider border border-white/50">
                                        {doc.category || 'General'}
                                    </span>
                                </div>
                            </div>

                            <h3 className="font-bold text-slate-800 text-sm mb-2 group-hover:text-primary transition-colors line-clamp-1">{doc.title}</h3>
                            {doc.description && (
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1 mb-4">
                                    {doc.description}
                                </p>
                            )}

                            <div className="flex gap-2 mt-auto pt-4 border-t border-slate-50">
                                <a
                                    href={doc.file_url!}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors border border-slate-200"
                                >
                                    <ExternalLink size={14} /> Preview
                                </a>
                                <a
                                    href={doc.file_url!}
                                    download
                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-primary text-white hover:bg-primary-dark rounded-xl text-xs font-bold transition-all shadow-sm shadow-primary/10"
                                >
                                    <Download size={14} /> Download
                                </a>
                            </div>
                        </div>
                    ))}

                    {filteredDocs.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm mx-auto mb-4">
                                <Search size={20} className="text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-bold">No documents found matching your criteria</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
