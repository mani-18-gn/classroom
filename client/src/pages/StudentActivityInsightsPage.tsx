import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
  TrendingUp, BarChart2, ShieldCheck, Calendar, Info,
  AlertCircle, Sparkles, CheckCircle2, XCircle, Clock
} from 'lucide-react';

export const StudentActivityInsightsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<string>('30d');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/students/me/activity-insights?range=${range}`);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load activity insights:', err);
      setError(err.message || 'Unable to load activity insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [range]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest uppercase text-[#6EE7B7]">
          Computing Activity Insights...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-[#17382B] border border-[#F87171]/40 rounded-3xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-[#F87171] mx-auto" />
          <h2 className="text-lg font-bold text-[#F8FAFC]">Insights Data Unavailable</h2>
          <p className="text-xs text-[#A7B8AE]">{error}</p>
        </div>
      </div>
    );
  }

  const s = data.summary;
  const categories = data.categories || [];
  const trend = data.trend || [];

  // Calculate max count for chart scaling
  const maxTrendCount = Math.max(...trend.map((t: any) => t.count), 5);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#294638]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#F8FAFC]">My Activity Insights</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#204735] text-[#10B981] border border-[#10B981]/30">
              Aggregated Metrics
            </span>
          </div>
          <p className="text-xs text-[#A7B8AE] mt-1">
            Empirical telemetry patterns, observation distributions, and verification rates over time.
          </p>
        </div>

        {/* Range Selector & Mode Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="bg-[#10231C] p-1 rounded-xl border border-[#294638] flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setRange('7d')}
              className={`px-3 py-1 rounded-lg transition ${range === '7d' ? 'bg-[#10B981] text-[#0B1713] font-bold' : 'text-[#A7B8AE] hover:text-[#F8FAFC]'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRange('30d')}
              className={`px-3 py-1 rounded-lg transition ${range === '30d' ? 'bg-[#10B981] text-[#0B1713] font-bold' : 'text-[#A7B8AE] hover:text-[#F8FAFC]'}`}
            >
              30 Days
            </button>
            <button
              onClick={() => setRange('90d')}
              className={`px-3 py-1 rounded-lg transition ${range === '90d' ? 'bg-[#10B981] text-[#0B1713] font-bold' : 'text-[#A7B8AE] hover:text-[#F8FAFC]'}`}
            >
              Semester
            </button>
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
            className="px-3 py-2 bg-[#17382B] hover:bg-[#204735] text-xs font-bold text-[#6EE7B7] rounded-xl border border-[#294638] transition"
            title="Toggle between visual chart and accessible data table"
          >
            {viewMode === 'chart' ? 'Table View (A11y)' : 'Chart View'}
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#17382B] border border-[#294638] p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-[#A7B8AE]">
            <span>Total AI Observations</span>
            <Sparkles className="w-4 h-4 text-[#FBBF24]" />
          </div>
          <span className="text-2xl font-bold font-mono text-[#F8FAFC]">{s.totalObservations}</span>
          <span className="text-[10px] text-[#A7B8AE] block">Sensor detections logged</span>
        </div>

        <div className="bg-[#17382B] border border-[#294638] p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-[#A7B8AE]">
            <span>Teacher Verified</span>
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <span className="text-2xl font-bold font-mono text-[#10B981]">{s.teacherReviewedCount}</span>
          <span className="text-[10px] text-[#6EE7B7] block">Confirmed by faculty</span>
        </div>

        <div className="bg-[#17382B] border border-[#294638] p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-[#A7B8AE]">
            <span>Dismissed Observations</span>
            <XCircle className="w-4 h-4 text-[#A7B8AE]" />
          </div>
          <span className="text-2xl font-bold font-mono text-[#F8FAFC]">{s.dismissedCount}</span>
          <span className="text-[10px] text-[#A7B8AE] block">Determined non-actionable</span>
        </div>

        <div className="bg-[#17382B] border border-[#294638] p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-[#A7B8AE]">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-[#6EE7B7]" />
          </div>
          <span className="text-2xl font-bold font-mono text-[#6EE7B7]">{s.pendingCount}</span>
          <span className="text-[10px] text-[#A7B8AE] block">Under teacher review</span>
        </div>
      </div>

      {/* Main Insights Chart vs Accessible Table */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
          <div>
            <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#10B981]" />
              Observation Frequency & Verification Trend
            </h2>
            <p className="text-[11px] text-[#A7B8AE]">
              Daily frequency of preliminary vision alerts vs human teacher verifications
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#6EE7B7] bg-[#204735] px-2.5 py-0.5 rounded-full border border-[#10B981]/30">
            Window: {range === '7d' ? 'Past 7 Days' : range === '30d' ? 'Past 30 Days' : 'Past 90 Days'}
          </span>
        </div>

        {viewMode === 'chart' ? (
          <div className="space-y-4">
            {trend.length === 0 ? (
              <div className="py-12 text-center text-[#A7B8AE] bg-[#10231C] rounded-2xl border border-[#294638] text-xs">
                No observations recorded within this time window.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {/* SVG Responsive Bar Visualization */}
                <div className="h-64 flex items-end gap-2 sm:gap-4 p-4 bg-[#10231C] rounded-2xl border border-[#294638] overflow-x-auto">
                  {trend.map((day: any, idx: number) => {
                    const heightPercent = Math.max(12, Math.round((day.count / maxTrendCount) * 100));
                    const verifiedPercent = day.count > 0 ? Math.round((day.verified_count / day.count) * 100) : 0;
                    return (
                      <div
                        key={idx}
                        className="flex-1 min-w-[36px] flex flex-col items-center justify-end h-full group relative"
                      >
                        {/* Tooltip on Hover */}
                        <div className="absolute -top-12 bg-[#204735] text-[#F8FAFC] text-[10px] font-mono p-1.5 rounded-lg border border-[#10B981]/40 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-20 shadow-lg">
                          {day.event_date}: {day.count} total ({day.verified_count} verified, {day.dismissed_count} dismissed)
                        </div>

                        {/* Bar Body */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[28px] bg-[#204735] group-hover:bg-[#10B981] border border-[#294638] rounded-t-lg transition relative flex flex-col justify-end overflow-hidden"
                        >
                          {/* Verified Portion Overlay */}
                          <div
                            style={{ height: `${verifiedPercent}%` }}
                            className="w-full bg-[#10B981]"
                          />
                        </div>

                        {/* Date Label */}
                        <span className="text-[9px] font-mono text-[#A7B8AE] mt-2 truncate max-w-full">
                          {day.event_date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Chart Legend */}
                <div className="flex items-center justify-center gap-6 text-[11px] text-[#A7B8AE] pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#204735] border border-[#294638]" />
                    <span>Total AI Observations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#10B981]" />
                    <span>Teacher Verified</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Accessible Table Alternative */
          <div className="overflow-x-auto bg-[#10231C] rounded-2xl border border-[#294638]">
            <table className="w-full text-left text-xs text-[#F8FAFC]" aria-label="Activity timeline data table">
              <thead className="bg-[#204735] text-[#6EE7B7] text-[10px] font-mono uppercase tracking-wider">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-center">Total Detections</th>
                  <th className="p-3 text-center">Teacher Verified</th>
                  <th className="p-3 text-center">Dismissed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#294638]">
                {trend.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-[#A7B8AE]">No data available.</td>
                  </tr>
                ) : (
                  trend.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-[#17382B]/60">
                      <td className="p-3 font-mono">{row.event_date}</td>
                      <td className="p-3 text-center font-bold">{row.count}</td>
                      <td className="p-3 text-center text-[#10B981] font-bold">{row.verified_count}</td>
                      <td className="p-3 text-center text-[#A7B8AE]">{row.dismissed_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Breakdown & Ethical AI Guardrail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Categories Distribution */}
        <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Observation Category Breakdown
          </h2>
          <div className="space-y-3">
            {categories.map((cat: any, i: number) => {
              const totalObs = s.totalObservations || 1;
              const pct = Math.round((cat.count / totalObs) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#F8FAFC] font-semibold">{cat.name}</span>
                    <span className="font-mono text-[#A7B8AE]">{cat.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#10231C] h-2 rounded-full overflow-hidden border border-[#294638]">
                    <div
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ethical AI Guardrails & Human-in-the-Loop Disclosure */}
        <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            Ethical AI & Educational Guardrails
          </h2>
          <div className="p-4 bg-[#10231C] rounded-2xl border border-[#294638] space-y-2 text-xs text-[#A7B8AE] leading-relaxed">
            <p>
              <strong className="text-[#F8FAFC]">No Academic Ranking:</strong> ClassGuard AI explicitly refuses to rank students or assign pseudoscientific "attention percentage grades" based on facial orientation or eye blinks.
            </p>
            <p>
              <strong className="text-[#F8FAFC]">Cognitive State Disclaimer:</strong> Head tilt and eye blinks are physiological behaviors. They cannot and do not measure a student's intelligence, subject comprehension, motivation, or mental health.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
