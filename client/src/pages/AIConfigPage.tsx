import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';
import { Sliders, CheckCircle2, Cpu, Volume2, Eye } from 'lucide-react';

export const AIConfigPage: React.FC = () => {
  const { t } = useLanguage();

  const [eyeClosureThreshold, setEyeClosureThreshold] = useState<number>(8.0);
  const [yawThreshold, setYawThreshold] = useState<number>(30);
  const [noiseThreshold, setNoiseThreshold] = useState<number>(75);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(80);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiRequest('/settings');
        if (res.settings) {
          if (res.settings.eye_closure_threshold_sec) {
            setEyeClosureThreshold(parseFloat(res.settings.eye_closure_threshold_sec));
          }
          if (res.settings.head_pose_yaw_threshold_deg) {
            setYawThreshold(parseFloat(res.settings.head_pose_yaw_threshold_deg));
          }
          if (res.settings.noise_alert_threshold_db) {
            setNoiseThreshold(parseFloat(res.settings.noise_alert_threshold_db));
          }
          if (res.settings.min_face_match_confidence) {
            setConfidenceThreshold(Math.round(parseFloat(res.settings.min_face_match_confidence) * 100));
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest('/settings/update', {
        method: 'POST',
        body: JSON.stringify({
          settings: {
            eye_closure_threshold_sec: eyeClosureThreshold.toFixed(1),
            head_pose_yaw_threshold_deg: yawThreshold.toFixed(1),
            noise_alert_threshold_db: noiseThreshold.toString(),
            min_face_match_confidence: (confidenceThreshold / 100).toFixed(2),
          },
        }),
      });
      setSavedMessage('AI vision pipeline and audio sensitivity parameters updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-[#294638]">
        <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight">AI Vision Pipeline & False-Positive Controls</h1>
        <p className="text-xs text-[#A7B8AE] mt-0.5">
          Tune temporal thresholds to prevent false positives caused by natural blinking, looking down while taking notes, or normal student questions.
        </p>
      </div>

      {savedMessage && (
        <div className="p-3 bg-[#204735] border border-[#10B981]/40 rounded-2xl text-xs text-[#6EE7B7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#10B981]" />
            <span>{savedMessage}</span>
          </div>
          <button onClick={() => setSavedMessage(null)} className="text-[#A7B8AE] hover:text-[#F8FAFC]">✕</button>
        </div>
      )}

      {/* Sliders Card */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-6">
        {/* Continuous Eye Closure Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#F8FAFC] flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#FBBF24]" />
              Continuous Eye Closure Duration Threshold (Drowsiness Alert)
            </label>
            <span className="text-xs font-mono font-bold text-[#6EE7B7] bg-[#204735] px-2.5 py-0.5 rounded-lg border border-[#294638]">
              {eyeClosureThreshold.toFixed(1)} seconds
            </span>
          </div>
          <p className="text-[11px] text-[#A7B8AE] leading-relaxed">
            Must remain closed continuously beyond this duration. Normal blinking (100–400ms) and looking down to write notes are filtered out and will NOT trigger alerts.
          </p>
          <input
            type="range"
            min="4.0"
            max="15.0"
            step="0.5"
            value={eyeClosureThreshold}
            onChange={(e) => setEyeClosureThreshold(parseFloat(e.target.value))}
            className="w-full accent-[#10B981]"
          />
          <div className="flex justify-between text-[10px] text-[#A7B8AE] font-mono">
            <span>4.0s (Sensitive)</span>
            <span>8.0s (Recommended Standard)</span>
            <span>15.0s (Strict)</span>
          </div>
        </div>

        {/* Head Pose Yaw Angle Slider */}
        <div className="space-y-2 pt-4 border-t border-[#294638]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#F8FAFC] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#10B981]" />
              Head-Pose Yaw Angle Threshold (Distraction / Turned Away)
            </label>
            <span className="text-xs font-mono font-bold text-[#6EE7B7] bg-[#204735] px-2.5 py-0.5 rounded-lg border border-[#294638]">
              ±{yawThreshold}° away from board
            </span>
          </div>
          <p className="text-[11px] text-[#A7B8AE] leading-relaxed">
            Tolerance angle before orientation away from presentation is evaluated. Prevents flagging students who briefly glance toward classmates.
          </p>
          <input
            type="range"
            min="15"
            max="50"
            step="1"
            value={yawThreshold}
            onChange={(e) => setYawThreshold(parseInt(e.target.value, 10))}
            className="w-full accent-[#10B981]"
          />
        </div>

        {/* Classroom Noise Alert Limit */}
        <div className="space-y-2 pt-4 border-t border-[#294638]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#F8FAFC] flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#6EE7B7]" />
              Classroom Noise Alert Limit (Web Audio API Decibels)
            </label>
            <span className="text-xs font-mono font-bold text-[#6EE7B7] bg-[#204735] px-2.5 py-0.5 rounded-lg border border-[#294638]">
              {noiseThreshold} dB
            </span>
          </div>
          <p className="text-[11px] text-[#A7B8AE] leading-relaxed">
            Flags elevated classroom noise that correlates with attention drops or group disruption.
          </p>
          <input
            type="range"
            min="55"
            max="90"
            step="1"
            value={noiseThreshold}
            onChange={(e) => setNoiseThreshold(parseInt(e.target.value, 10))}
            className="w-full accent-[#10B981]"
          />
        </div>

        {/* Minimum Face Match Confidence */}
        <div className="space-y-2 pt-4 border-t border-[#294638]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#F8FAFC] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#10B981]" />
              Minimum Face Match Confidence Cutoff
            </label>
            <span className="text-xs font-mono font-bold text-[#6EE7B7] bg-[#204735] px-2.5 py-0.5 rounded-lg border border-[#294638]">
              {confidenceThreshold}%
            </span>
          </div>
          <p className="text-[11px] text-[#A7B8AE] leading-relaxed">
            If cosine similarity falls below this threshold, the student is labeled "Unknown / Unverified Student". The system NEVER guesses identities.
          </p>
          <input
            type="range"
            min="65"
            max="95"
            step="1"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(parseInt(e.target.value, 10))}
            className="w-full accent-[#10B981]"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-[#0B1713] text-xs font-bold px-6 py-2.5 rounded-xl transition shadow-xs"
          >
            {saving ? 'Applying...' : 'Save AI Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};
