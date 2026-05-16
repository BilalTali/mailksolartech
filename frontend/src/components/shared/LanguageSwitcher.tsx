import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC<{ className?: string, variant?: 'light' | 'dark' }> = ({ className, variant = 'light' }) => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const baseStyles = variant === 'light' 
    ? "bg-slate-100/80 hover:bg-slate-200/80 border-slate-200 text-slate-700" 
    : "bg-white/10 hover:bg-white/20 border-white/20 text-white";

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-black tracking-tight ${baseStyles} ${className}`}
      title={i18n.language === 'en' ? 'Switch to Hindi' : 'अंग्रेजी में बदलें'}
    >
      <Globe size={14} className={variant === 'light' ? "text-slate-400" : "text-white/60"} />
      <span>{i18n.language === 'en' ? 'EN' : 'HI'}</span>
    </button>
  );
};

export default LanguageSwitcher;
