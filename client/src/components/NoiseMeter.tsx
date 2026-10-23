import React from 'react';
import { Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { AudioNoiseData } from '../services/audioService';

interface NoiseMeterProps {
  noiseData: AudioNoiseData;
}

export const NoiseMeter: React.FC<NoiseMeterProps> = ({ noiseData }) => {
  const { decibels, volumePercent, status, isLoud } = noiseData;

  const getStatusColor = () => {
    switch (status) {
      case 'LOUD':
        return 'text-rose-400 bg-rose-500/20 border-rose-500/40';
      case 'MODERATE':
        return 'text-amber-400 bg-amber-500/20 border-amber-500/40';
      default:
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
    }
  };

  const getBarColor = () => {
    if (status === 'LOUD') return 'bg-gradient-to-r from-amber-500 to-rose-500';
    if (status === 'MODERATE') return 'bg-gradient-to-r from-emerald-500 to-amber-500';
    return 'bg-gradient-to-r from-emerald-500 to-teal-400';
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-slate-700/60 rounded-xl text-slate-300">
            {volumePercent === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200">Ambient Classroom Audio (dB)</h4>
            <p className="text-[10px] text-slate-400">Web Audio API • Real-Time Mic Meter</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor()}`}>
            {status} ({decibels} dB)
          </span>
        </div>
      </div>

      {/* Decibel Meter Bar */}
      <div className="space-y-1.5">
        <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/60 flex items-center">
          <div
            className={`h-full rounded-full transition-all duration-200 ${getBarColor()}`}
            style={{ width: `${Math.min(100, Math.max(8, volumePercent))}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>35 dB (Quiet Study)</span>
          <span>55 dB (Lecture)</span>
          <span>75+ dB (Disruption)</span>
        </div>
      </div>

      {isLoud && (
        <div className="mt-3 flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs animate-pulse">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Elevated classroom noise detected. May correlate with engagement dip.</span>
        </div>
      )}
    </div>
  );
};
