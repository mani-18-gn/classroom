import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Lock, EyeOff, UserCheck, X } from 'lucide-react';

export const PrivacyBanner: React.FC = () => {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-950/70 via-slate-900/90 to-indigo-950/70 border border-blue-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-md mb-6 relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3.5">
          <div className="bg-blue-500/20 border border-blue-400/30 p-2.5 rounded-xl text-blue-400 flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                {t.privacyBanner.title}
              </h3>
              <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
                DPDP Act 2023 / FERPA Aligned
              </span>
            </div>
            
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-4xl">
              {t.privacyBanner.body}
            </p>

            <div className="flex items-center gap-4 mt-3 flex-wrap text-[11px] font-medium text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.privacyBanner.zeroDataRetention}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>{t.privacyBanner.onDevice}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.privacyBanner.humanInTheLoop}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition"
          title="Dismiss Banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
