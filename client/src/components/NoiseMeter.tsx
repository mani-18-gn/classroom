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
        return 'text-[#F87171] bg-[#F87171]/15 border-[#F87171]/40';
      case 'MODERATE':
        return 'text-[#FBBF24] bg-[#FBBF24]/15 border-[#FBBF24]/40';
      default:
        return 'text-[#6EE7B7] bg-[#10B981]/20 border-[#10B981]/40';
    }
  };

  const getBarColor = () => {
    if (status === 'LOUD') return 'bg-gradient-to-r from-[#FBBF24] to-[#F87171]';
    if (status === 'MODERATE') return 'bg-gradient-to-r from-[#10B981] to-[#FBBF24]';
    return 'bg-gradient-to-r from-[#059669] to-[#10B981]';
  };

  return (
    <div className="bg-[#17382B] border border-[#294638] rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-[#204735] border border-[#294638] rounded-xl text-[#10B981]">
            {volumePercent === 0 ? <VolumeX className="w-4 h-4 text-[#A7B8AE]" /> : <Volume2 className="w-4 h-4 text-[#10B981]" />}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#F8FAFC]">Ambient Classroom Audio (dB)</h4>
            <p className="text-[10px] text-[#A7B8AE]">Web Audio API • Real-Time Decibel Meter</p>
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
        <div className="w-full bg-[#10231C] h-3 rounded-full overflow-hidden p-0.5 border border-[#294638] flex items-center">
          <div
            className={`h-full rounded-full transition-all duration-200 ${getBarColor()}`}
            style={{ width: `${Math.min(100, Math.max(8, volumePercent))}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-[#A7B8AE] font-mono">
          <span>35 dB (Quiet Study)</span>
          <span>55 dB (Lecture)</span>
          <span>75+ dB (Disruption)</span>
        </div>
      </div>

      {isLoud && (
        <div className="mt-3 flex items-center gap-2 p-2 bg-[#F87171]/10 border border-[#F87171]/30 rounded-xl text-[#F87171] text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Elevated classroom noise detected. May correlate with engagement dip.</span>
        </div>
      )}
    </div>
  );
};
