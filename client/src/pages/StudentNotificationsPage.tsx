import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
  Bell, Check, CheckCheck, Filter, Clock, ArrowRight,
  ShieldCheck, RefreshCw, Eye, AlertCircle, FileText
} from 'lucide-react';

interface StudentNotificationsPageProps {
  onNavigateToTab?: (tab: string) => void;
}

export const StudentNotificationsPage: React.FC<StudentNotificationsPageProps> = ({
  onNavigateToTab
}) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/students/me/notifications');
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiRequest(`/students/me/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/students/me/notifications/mark-all-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const displayedNotifications = filterUnreadOnly
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest uppercase text-[#6EE7B7]">
          Loading Notifications Center...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#294638]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Notifications Center</h1>
            {unreadCount > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#10B981] text-[#0B1713]">
                {unreadCount} Unread
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#204735] text-[#10B981] border border-[#10B981]/30">
                All Read
              </span>
            )}
          </div>
          <p className="text-xs text-[#A7B8AE] mt-1">
            Real-time updates regarding teacher review decisions, observation appeals, consent modifications, and account security.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 bg-[#204735] hover:bg-[#10B981] hover:text-[#0B1713] text-xs font-bold text-[#F8FAFC] rounded-xl border border-[#294638] transition inline-flex items-center gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark All as Read
            </button>
          )}

          <button
            onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition inline-flex items-center gap-1.5 ${
              filterUnreadOnly
                ? 'bg-[#10B981] text-[#0B1713] border-[#10B981]'
                : 'bg-[#17382B] text-[#A7B8AE] border-[#294638] hover:text-[#F8FAFC]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {filterUnreadOnly ? 'Showing Unread' : 'Filter Unread'}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
        {displayedNotifications.length === 0 ? (
          <div className="text-center py-12 bg-[#10231C] rounded-2xl border border-[#294638] space-y-2">
            <Bell className="w-8 h-8 text-[#10B981]/50 mx-auto" />
            <p className="text-xs font-bold text-[#F8FAFC]">No Notifications to Display</p>
            <p className="text-[11px] text-[#A7B8AE]">
              {filterUnreadOnly
                ? 'You have zero unread notifications.'
                : 'You are all caught up! Important updates will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedNotifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition space-y-2 relative ${
                  n.is_read
                    ? 'bg-[#10231C]/60 border-[#294638] text-[#A7B8AE]'
                    : 'bg-[#10231C] border-[#10B981]/50 text-[#F8FAFC] shadow-xs'
                }`}
              >
                {!n.is_read && (
                  <div className="absolute left-2.5 top-5 w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                )}

                <div className="flex items-center justify-between flex-wrap gap-2 pl-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#F8FAFC]">{n.title}</span>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#204735] text-[#6EE7B7] border border-[#10B981]/20">
                      {n.type?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#A7B8AE]">{n.created_at}</span>
                </div>

                <p className="text-xs text-[#A7B8AE] pl-3 leading-relaxed">{n.message}</p>

                <div className="flex items-center justify-between pt-2 border-t border-[#294638]/50 pl-3 text-xs">
                  <div>
                    {n.link_tab && onNavigateToTab && (
                      <button
                        onClick={() => onNavigateToTab(n.link_tab)}
                        className="text-[11px] font-semibold text-[#10B981] hover:text-[#6EE7B7] flex items-center gap-1 transition"
                      >
                        <span>Open Related Portal Section</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-[11px] text-[#A7B8AE] hover:text-[#F8FAFC] flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Mark Read</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
