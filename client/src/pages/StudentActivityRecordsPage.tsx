import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
  FileText, Filter, Calendar, Search, CheckCircle2, Clock,
  XCircle, ChevronLeft, ChevronRight, Eye, ShieldCheck,
  GraduationCap, AlertCircle, Camera, RefreshCw
} from 'lucide-react';

interface StudentActivityRecordsPageProps {
  initialStatusFilter?: string;
  onNavigateToAppeal?: (eventId: number) => void;
}

export const StudentActivityRecordsPage: React.FC<StudentActivityRecordsPageProps> = ({
  initialStatusFilter,
  onNavigateToAppeal
}) => {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Snapshot modal
  const [selectedRecordForSnapshots, setSelectedRecordForSnapshots] = useState<any | null>(null);

  const fetchRecords = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', targetPage.toString());
      params.append('limit', '10');
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (search.trim()) params.append('search', search.trim());

      const res = await apiRequest(`/students/me/activity-records?${params.toString()}`);
      setRecords(res.records || []);
      setTotal(res.pagination?.total || 0);
      setPage(res.pagination?.page || 1);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to fetch activity records:', err);
      setError(err.message || 'Failed to load activity records from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(1);
  }, [categoryFilter, statusFilter, dateFrom, dateTo]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords(1);
  };

  const handleClearFilters = () => {
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    fetchRecords(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#294638]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#F8FAFC]">My Activity Records</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#204735] text-[#10B981] border border-[#10B981]/30">
              {total} Total Observations
            </span>
          </div>
          <p className="text-xs text-[#A7B8AE] mt-1">
            Official activity logs showing unverified AI edge detections vs final human teacher verifications.
          </p>
        </div>

        <button
          onClick={() => fetchRecords(page)}
          className="p-2 bg-[#17382B] hover:bg-[#204735] text-[#A7B8AE] hover:text-[#F8FAFC] rounded-xl border border-[#294638] transition inline-flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-[#A7B8AE] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by observation or notes..."
              className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F8FAFC] outline-none transition"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none transition"
            >
              <option value="ALL">All Categories</option>
              <option value="ATTENTION">Attention (EAR/Yaw)</option>
              <option value="ENGAGEMENT">Engagement</option>
              <option value="DISTURBANCE">Disturbance</option>
              <option value="SAFETY">Classroom Safety</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="VERIFIED">Teacher Reviewed</option>
              <option value="DISMISSED">Dismissed / Normal</option>
            </select>
          </div>

          {/* Filter Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 bg-[#10B981] hover:bg-[#059669] text-[#0B1713] text-xs font-bold py-2 px-3 rounded-xl transition text-center"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="bg-[#10231C] hover:bg-[#204735] text-[#A7B8AE] text-xs font-semibold py-2 px-3 rounded-xl border border-[#294638] transition"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Date Range Pickers */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#294638]/60 text-xs">
          <span className="text-[11px] text-[#A7B8AE] flex items-center gap-1 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-[#10B981]" /> Date Range:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-[#10231C] border border-[#294638] rounded-lg px-2.5 py-1 text-xs text-[#F8FAFC] outline-none"
            />
            <span className="text-[#A7B8AE]">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-[#10231C] border border-[#294638] rounded-lg px-2.5 py-1 text-xs text-[#F8FAFC] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Status Definitions Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#10231C] p-3 rounded-2xl border border-[#294638] text-xs space-y-1">
          <span className="font-bold text-[#FBBF24] flex items-center gap-1.5 text-[11px]">
            <Clock className="w-3.5 h-3.5" /> PENDING REVIEW
          </span>
          <p className="text-[10px] text-[#A7B8AE]">
            Preliminary camera vision observation recorded. Awaits review by your class teacher.
          </p>
        </div>

        <div className="bg-[#10231C] p-3 rounded-2xl border border-[#294638] text-xs space-y-1">
          <span className="font-bold text-[#10B981] flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" /> TEACHER REVIEWED
          </span>
          <p className="text-[10px] text-[#A7B8AE]">
            Reviewed and confirmed by class teacher with official justification notes.
          </p>
        </div>

        <div className="bg-[#10231C] p-3 rounded-2xl border border-[#294638] text-xs space-y-1">
          <span className="font-bold text-[#A7B8AE] flex items-center gap-1.5 text-[11px]">
            <XCircle className="w-3.5 h-3.5" /> DISMISSED
          </span>
          <p className="text-[10px] text-[#A7B8AE]">
            Determined by teacher to be normal attentive activity or false positive. Not actionable.
          </p>
        </div>
      </div>

      {/* Records List */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
        {loading ? (
          <div className="py-12 text-center text-[#A7B8AE] space-y-3">
            <div className="w-8 h-8 border-3 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono">Filtering activity records...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-[#F87171] text-xs">{error}</div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center bg-[#10231C] rounded-2xl border border-[#294638] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#10B981]/60 mx-auto" />
            <p className="text-xs font-bold text-[#F8FAFC]">No Matching Records Found</p>
            <p className="text-[11px] text-[#A7B8AE]">
              No observations match the selected filters or date ranges.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="bg-[#10231C] border border-[#294638] hover:border-[#10B981]/40 rounded-2xl p-5 transition space-y-3"
              >
                {/* Top Bar: Event ID, Category, Status, Timestamp */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#6EE7B7] bg-[#204735] px-2 py-0.5 rounded border border-[#294638]">
                      #{rec.id}
                    </span>
                    <span className="text-sm font-bold text-[#F8FAFC]">
                      {rec.event_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#A7B8AE] bg-[#17382B] px-2 py-0.5 rounded">
                      {rec.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        rec.verification_status === 'VERIFIED'
                          ? 'bg-[#204735] text-[#10B981] border-[#10B981]/40'
                          : rec.verification_status === 'REJECTED'
                          ? 'bg-[#10231C] text-[#A7B8AE] border-[#294638]'
                          : 'bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/40'
                      }`}
                    >
                      {rec.verification_status === 'VERIFIED'
                        ? '✓ TEACHER REVIEWED'
                        : rec.verification_status === 'REJECTED'
                        ? 'DISMISSED'
                        : 'PENDING REVIEW'}
                    </span>
                    <span className="text-xs font-mono text-[#A7B8AE]">{rec.timestamp}</span>
                  </div>
                </div>

                {/* AI Observation Callout */}
                <div className="bg-[#0B1713] p-3 rounded-xl border border-[#294638] text-xs">
                  <span className="text-[10px] uppercase font-semibold text-[#A7B8AE] block mb-0.5">
                    AI Vision Detection Telemetry:
                  </span>
                  <p className="text-[#F8FAFC] italic">"{rec.ai_observation}"</p>
                  <div className="flex items-center gap-4 text-[10px] text-[#A7B8AE] font-mono mt-1.5 pt-1.5 border-t border-[#294638]/50">
                    <span>Duration: {rec.duration_seconds}s</span>
                    <span>Confidence: {(rec.confidence_score * 100).toFixed(0)}%</span>
                    <span>Camera: {rec.camera_id}</span>
                  </div>
                </div>

                {/* Teacher Decision (if reviewed) */}
                {rec.teacher_notes && (
                  <div className="bg-[#204735]/70 p-3 rounded-xl border border-[#10B981]/30 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#6EE7B7] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                        Official Teacher Verification Reason:
                      </span>
                      <span className="text-[10px] text-[#A7B8AE]">
                        Verified by {rec.verified_by_teacher} on {rec.verified_at}
                      </span>
                    </div>
                    <p className="text-[#F8FAFC] italic font-medium">"{rec.teacher_notes}"</p>
                  </div>
                )}

                {/* Action Bar: Snapshots Preview & Appeal Button */}
                <div className="flex items-center justify-between pt-2 border-t border-[#294638]/60 flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    {rec.snapshot_count > 0 && (
                      <button
                        onClick={() => setSelectedRecordForSnapshots(rec)}
                        className="text-[11px] font-semibold text-[#6EE7B7] hover:underline flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>View {rec.snapshot_count} Evidence Snapshots</span>
                      </button>
                    )}
                    {rec.appeal_status && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#204735] text-[#10B981] border border-[#10B981]/30">
                        Appeal: {rec.appeal_status}
                      </span>
                    )}
                  </div>

                  {/* Appeal Action */}
                  <div>
                    {!rec.appeal_status && (
                      <button
                        onClick={() => {
                          if (onNavigateToAppeal) {
                            onNavigateToAppeal(rec.id);
                          }
                        }}
                        className="px-3 py-1 bg-[#204735] hover:bg-[#10B981] hover:text-[#0B1713] text-[#F8FAFC] text-[11px] font-semibold rounded-lg border border-[#294638] transition inline-flex items-center gap-1"
                      >
                        <GraduationCap className="w-3 h-3" />
                        <span>Request Review / Appeal</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-[#294638] text-xs">
            <span className="text-[#A7B8AE]">
              Showing page <strong className="text-[#F8FAFC]">{page}</strong> of <strong className="text-[#F8FAFC]">{totalPages}</strong> ({total} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchRecords(page - 1)}
                className="p-1.5 bg-[#10231C] disabled:opacity-40 text-[#A7B8AE] hover:text-[#F8FAFC] rounded-lg border border-[#294638] transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchRecords(page + 1)}
                className="p-1.5 bg-[#10231C] disabled:opacity-40 text-[#A7B8AE] hover:text-[#F8FAFC] rounded-lg border border-[#294638] transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Evidence Snapshots Modal */}
      {selectedRecordForSnapshots && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#17382B] border border-[#294638] rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
              <div>
                <h3 className="text-sm font-bold text-[#F8FAFC]">
                  Evidence Snapshots — Observation #{selectedRecordForSnapshots.id}
                </h3>
                <p className="text-[11px] text-[#A7B8AE]">
                  Captured at {selectedRecordForSnapshots.timestamp} (Subject to 24h retention policy)
                </p>
              </div>
              <button
                onClick={() => setSelectedRecordForSnapshots(null)}
                className="p-1.5 text-[#A7B8AE] hover:text-[#F8FAFC] rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedRecordForSnapshots.snapshots?.map((snap: any, idx: number) => (
                <div key={snap.id || idx} className="bg-[#10231C] rounded-2xl p-2 border border-[#294638] space-y-1">
                  <img
                    src={snap.image_data_url}
                    alt={`Evidence Snapshot ${snap.snapshot_index}`}
                    className="w-full h-44 object-cover rounded-xl"
                  />
                  <div className="flex items-center justify-between text-[10px] text-[#A7B8AE] px-1 font-mono">
                    <span>Frame #{snap.snapshot_index}</span>
                    <span>{snap.captured_at?.slice(11, 19)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-right pt-2 border-t border-[#294638]">
              <button
                onClick={() => setSelectedRecordForSnapshots(null)}
                className="px-4 py-1.5 bg-[#204735] text-xs font-bold text-[#F8FAFC] rounded-xl hover:bg-[#10B981] hover:text-[#0B1713] transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
