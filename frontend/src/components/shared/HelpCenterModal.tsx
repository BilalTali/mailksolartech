import React, { useState, useEffect } from 'react';
import { publicApi, HelpCenterData } from '@/services/public.api';
import { X, MessageCircle, ChevronDown, ChevronRight, Search, Phone, User as UserIcon, HelpCircle } from 'lucide-react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'faqs' | 'contacts'>('faqs');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HelpCenterData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const res = await publicApi.getHelpData();
          setData(res);
        } catch (error) {
          console.error("Failed to fetch help data", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredFaqs = data?.faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredContacts = data?.contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.district && contact.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (contact.state && contact.state.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/10 dark:border-slate-800/50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              Help Center
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">How can we assist you today?</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-1 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={() => setActiveTab('faqs')}
            className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
              activeTab === 'faqs' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Common Questions
            {activeTab === 'faqs' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full shadow-[0_-2px_10px_rgba(37,99,235,0.4)]" />}
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
              activeTab === 'contacts' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Chat with Support
            {activeTab === 'contacts' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full shadow-[0_-2px_10px_rgba(37,99,235,0.4)]" />}
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text"
              placeholder={activeTab === 'faqs' ? "Search FAQs..." : "Search by name or district..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm transition-all outline-none"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Loading helpful resources...</p>
            </div>
          ) : activeTab === 'faqs' ? (
            <div className="space-y-3">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq) => (
                  <div 
                    key={faq.id}
                    className="group border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800/50 transition-all duration-300 shadow-sm"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                      className="w-full text-left p-4 flex items-start justify-between gap-4"
                    >
                      <div className="flex gap-3">
                        <HelpCircle className="w-5 h-5 text-blue-500/70 mt-0.5" />
                        <span className="font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">{faq.question}</span>
                      </div>
                      <div className={`mt-1 transition-transform duration-300 ${expandedFaq === faq.id ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      </div>
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="px-11 pb-5 animate-in slide-in-from-top-2 duration-300">
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-loose whitespace-pre-line">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">No matching questions found.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <div 
                    key={contact.id}
                    className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-800/30 flex flex-col gap-4 shadow-sm"
                  >
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <UserIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700 dark:text-slate-200">Support Representative</h4>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full uppercase tracking-wider">
                                    {contact.role}
                                </span>
                            </div>
                        </div>
                        <div className="mt-3 space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <ChevronRight className="w-3 h-3 text-blue-500" />
                                <span>{contact.district}, {contact.state}</span>
                            </div>
                        </div>
                    </div>
                    
                    <a
                      href={`https://wa.me/${contact.whatsapp?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('SUPPORT')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg shadow-green-500/20"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat on WhatsApp
                    </a>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-400">No support representatives found for your area.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
               <Phone className="w-3 h-3" />
               Emergency? Call our central support line: <strong className="text-slate-600 dark:text-slate-300">92249-46360</strong>
            </p>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterModal;
