import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Lock, EyeOff, UserCheck, X } from 'lucide-react';

export const PrivacyBanner: React.FC = () => {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-[#17382B] border border-[#294638] rounded-2xl p-4 shadow-sm backdrop-blur-md mb-6 relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#10B981]/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3.5">
          <div className="bg-[#204735] border border-[#294638] p-2.5 rounded-xl text-[#10B981] flex-shrink-0 mt-0.5 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-[#F8FAFC] tracking-tight">
                {t.privacyBanner.title}
              </h3>
              <span className="bg-[#204735] text-[#6EE7B7] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#294638]">
                DPDP Act 2023 / FERPA Aligned
              </span>
            </div>
            
            <p className="text-xs text-[#A7B8AE] mt-1 leading-relaxed max-w-4xl">
              {t.privacyBanner.body}
            </p>

            <div className="flex items-center gap-3 mt-3 flex-wrap text-[11px] font-medium text-[#F8FAFC]">
              <div className="flex items-center gap-1.5 bg-[#10231C] px-2.5 py-1 rounded-lg border border-[#294638]">
                <EyeOff className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="text-[#A7B8AE]">{t.privacyBanner.zeroDataRetention}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#10231C] px-2.5 py-1 rounded-lg border border-[#294638]">
                <Lock className="w-3.5 h-3.5 text-[#6EE7B7]" />
                <span className="text-[#A7B8AE]">{t.privacyBanner.onDevice}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#10231C] px-2.5 py-1 rounded-lg border border-[#294638]">
                <UserCheck className="w-3.5 h-3.5 text-[#FBBF24]" />
                <span className="text-[#A7B8AE]">{t.privacyBanner.humanInTheLoop}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-[#A7B8AE] hover:text-[#F8FAFC] p-1.5 rounded-lg hover:bg-[#204735] transition"
          title="Dismiss Banner"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
