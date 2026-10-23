import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Navigation, Compass } from 'lucide-react';

interface ZoneData {
  id: string;
  name: string;
  attentionScore: number;
  studentCount: number;
  status: 'OPTIMAL' | 'MODERATE' | 'LOW';
}

interface SeatingHeatmapProps {
  zones?: ZoneData[];
  onZoneClick?: (zoneId: string) => void;
}

export const SeatingHeatmap: React.FC<SeatingHeatmapProps> = ({ zones, onZoneClick }) => {
  const { t } = useLanguage();

  const defaultZones: ZoneData[] = zones || [
    { id: 'FL', name: t.zones.frontLeft, attentionScore: 92, studentCount: 5, status: 'OPTIMAL' },
    { id: 'FC', name: t.zones.frontCenter, attentionScore: 88, studentCount: 6, status: 'OPTIMAL' },
    { id: 'FR', name: t.zones.frontRight, attentionScore: 84, studentCount: 4, status: 'OPTIMAL' },
    { id: 'ML', name: 'Middle Left', attentionScore: 78, studentCount: 5, status: 'MODERATE' },
    { id: 'MC', name: 'Middle Center', attentionScore: 82, studentCount: 6, status: 'OPTIMAL' },
    { id: 'MR', name: 'Middle Right', attentionScore: 72, studentCount: 4, status: 'MODERATE' },
    { id: 'BL', name: t.zones.backLeft, attentionScore: 66, studentCount: 5, status: 'MODERATE' },
    { id: 'BC', name: t.zones.backCenter, attentionScore: 70, studentCount: 5, status: 'MODERATE' },
    { id: 'BR', name: t.zones.backRight, attentionScore: 58, studentCount: 4, status: 'LOW' },
  ];

  // Find lowest engagement zone to suggest teacher walk towards it
  const lowestZone = [...defaultZones].sort((a, b) => a.attentionScore - b.attentionScore)[0];

  const getZoneBadge = (status: 'OPTIMAL' | 'MODERATE' | 'LOW', score: number) => {
    if (score >= 80) return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25';
    if (score >= 65) return 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25';
    return 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25 animate-pulse';
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200">{t.camera.spatialHeatmap}</h4>
            <p className="text-[10px] text-slate-400">Anonymous Aggregate Zone Distribution</p>
          </div>
        </div>

        {lowestZone && lowestZone.attentionScore < 70 && (
          <div className="flex items-center gap-1.5 text-[11px] bg-rose-500/20 text-rose-300 px-2.5 py-1 rounded-lg border border-rose-500/30">
            <Navigation className="w-3.5 h-3.5 rotate-45" />
            <span>Nudge: Walk towards <strong>{lowestZone.name}</strong></span>
          </div>
        )}
      </div>

      {/* Classroom Front Board Indicator */}
      <div className="w-full bg-slate-900/90 text-slate-400 text-[10px] font-semibold text-center py-1 rounded-lg border border-slate-700/60 mb-3 tracking-widest uppercase">
        ▲ Classroom Front Board / Teacher Podium ▲
      </div>

      {/* Spatial 3x3 Seating Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {defaultZones.map((zone) => (
          <div
            key={zone.id}
            onClick={() => onZoneClick && onZoneClick(zone.id)}
            className={`border rounded-xl p-2.5 cursor-pointer transition-all flex flex-col justify-between ${getZoneBadge(
              zone.status,
              zone.attentionScore
            )}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-tight">{zone.name}</span>
              <span className="text-[10px] font-mono opacity-80">{zone.studentCount} students</span>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xs font-medium opacity-80">Attention</span>
              <span className="text-sm font-bold font-mono">{zone.attentionScore}%</span>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-full bg-slate-900/60 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full ${
                  zone.attentionScore >= 80
                    ? 'bg-emerald-400'
                    : zone.attentionScore >= 65
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
                style={{ width: `${zone.attentionScore}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-700/60 pt-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Optimal (&gt;80%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Moderate (65-80%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Low Attention (&lt;65%)
          </span>
        </div>
        <span className="italic">Zero student identities revealed</span>
      </div>
    </div>
  );
};
