import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
  School, Calendar, Video, ShieldCheck, Mail, Phone,
  Clock, AlertCircle, Info, UserCheck, CheckCircle2, ChevronRight
} from 'lucide-react';

export const StudentClassroomPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassroom = async () => {
      setLoading(true);
      try {
        const res = await apiRequest('/students/me/classroom');
        setData(res);
      } catch (err: any) {
        console.error('Failed to load classroom details:', err);
        setError(err.message || 'Unable to load assigned classroom details.');
      } finally {
        setLoading(false);
      }
    };
    fetchClassroom();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest uppercase text-[#6EE7B7]">
          Loading Classroom & Timetable...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-[#17382B] border border-[#F87171]/40 rounded-3xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-[#F87171] mx-auto" />
          <h2 className="text-lg font-bold text-[#F8FAFC]">Classroom Information Unavailable</h2>
          <p className="text-xs text-[#A7B8AE]">{error || 'Could not connect to classroom backend services.'}</p>
        </div>
      </div>
    );
  }

  const c = data.classroom;
  const enrollment = data.studentEnrollment;
  const policy = data.monitoringPolicy;
  const schedule = data.schedule || [];
  const notices = data.notices || [];
  const support = data.supportContact;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-[#294638]">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-[#F8FAFC]">My Assigned Classroom</h1>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#204735] text-[#10B981] border border-[#10B981]/30">
            {c.classroom_code || 'CR-402'}
          </span>
        </div>
        <p className="text-xs text-[#A7B8AE] mt-1">
          Authorized classroom environment, scheduled lectures, assigned faculty, and on-device monitoring transparency.
        </p>
      </div>

      {/* Classroom Status & Teacher Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Card 1 & 2 (Span 2): Classroom Infrastructure */}
        <div className="md:col-span-2 bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-[#10B981]" />
              <div>
                <h2 className="text-sm font-bold text-[#F8FAFC]">{c.name || 'Lecture Hall'}</h2>
                <p className="text-[11px] text-[#A7B8AE]">Code: {c.classroom_code} • {c.department || enrollment.className}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                  c.camera_status === 'MONITORING'
                    ? 'bg-[#204735] text-[#10B981] border-[#10B981]/40'
                    : 'bg-[#10231C] text-[#A7B8AE] border-[#294638]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${c.camera_status === 'MONITORING' ? 'bg-[#10B981] animate-pulse' : 'bg-[#A7B8AE]'}`} />
                {c.camera_status === 'MONITORING' ? 'MONITORING ACTIVE' : 'IDLE / OFF'}
              </span>
            </div>
          </div>

          {/* Infrastructure Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
              <span className="text-[10px] uppercase font-semibold text-[#A7B8AE] block">Camera Source</span>
              <p className="text-xs font-bold text-[#F8FAFC] truncate">{c.camera_source || 'Integrated Webcam'}</p>
              <span className="text-[10px] text-[#10B981]">Hardware Active</span>
            </div>

            <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
              <span className="text-[10px] uppercase font-semibold text-[#A7B8AE] block">Enrolled Program</span>
              <p className="text-xs font-bold text-[#F8FAFC] truncate">{enrollment.className}</p>
              <span className="text-[10px] text-[#6EE7B7]">Section {enrollment.section}</span>
            </div>

            <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
              <span className="text-[10px] uppercase font-semibold text-[#A7B8AE] block">Privacy Protection</span>
              <p className="text-xs font-bold text-[#F8FAFC]">Zero Video Upload</p>
              <span className="text-[10px] text-[#10B981]">100% In-Browser Mesh</span>
            </div>
          </div>

          {/* Privacy & Monitoring Policy Box */}
          <div className="bg-[#10231C] p-4 rounded-2xl border border-[#294638] space-y-2">
            <span className="text-xs font-bold text-[#6EE7B7] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              Classroom Monitoring Policy & Transparency
            </span>
            <ul className="text-xs text-[#A7B8AE] space-y-1.5 list-disc list-inside">
              <li>
                <strong className="text-[#F8FAFC]">Client-Side Only:</strong> Facial landmark tracking uses Google MediaPipe and executes solely in the classroom workstation browser.
              </li>
              <li>
                <strong className="text-[#F8FAFC]">Teacher Review Required:</strong> Preliminary AI detections are never shared for academic evaluations without verified faculty consent.
              </li>
              <li>
                <strong className="text-[#F8FAFC]">Retention Limit:</strong> {policy.retentionPeriod}. Data is securely purged automatically.
              </li>
            </ul>
          </div>
        </div>

        {/* Card 3 (Span 1): Authorized Teacher Details */}
        <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-[#294638]">
            <span className="text-[10px] text-[#A7B8AE] uppercase tracking-wider font-semibold block">Authorized Faculty</span>
            <h3 className="text-base font-bold text-[#F8FAFC] mt-0.5">{c.teacher_name || 'Dr. Arun Kumar'}</h3>
            <p className="text-xs text-[#6EE7B7]">{c.teacher_department || 'Computer Science & Engineering'}</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2.5 bg-[#10231C] p-3 rounded-xl border border-[#294638]">
              <Mail className="w-4 h-4 text-[#10B981] flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-[#A7B8AE] block">Faculty Email</span>
                <span className="text-[#F8FAFC] font-mono truncate block">{c.teacher_email || 'arun.kumar@institution.edu'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-[#10231C] p-3 rounded-xl border border-[#294638]">
              <Phone className="w-4 h-4 text-[#6EE7B7] flex-shrink-0" />
              <div>
                <span className="text-[10px] text-[#A7B8AE] block">Faculty Contact</span>
                <span className="text-[#F8FAFC] font-mono">{c.teacher_phone || '+91 94480 12345'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-[#10231C] p-3 rounded-xl border border-[#294638]">
              <UserCheck className="w-4 h-4 text-[#10B981] flex-shrink-0" />
              <div>
                <span className="text-[10px] text-[#A7B8AE] block">Authority</span>
                <span className="text-[#F8FAFC]">Class Teacher & In-Charge</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#204735]/70 rounded-xl border border-[#294638] text-[11px] text-[#A7B8AE]">
            <p>
              Your class teacher is the sole authorized reviewer for preliminary attention detections occurring during lectures in this classroom.
            </p>
          </div>
        </div>
      </div>

      {/* Class Timetable / Schedule */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#10B981]" />
            <div>
              <h2 className="text-sm font-bold text-[#F8FAFC]">Class Schedule & Timetable</h2>
              <p className="text-[11px] text-[#A7B8AE]">Scheduled lecture hours in {c.classroom_code || 'CR-402'}</p>
            </div>
          </div>
          <span className="text-xs text-[#6EE7B7] font-semibold">{enrollment.className}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {schedule.map((item: any, idx: number) => (
            <div
              key={idx}
              className="bg-[#10231C] border border-[#294638] hover:border-[#10B981]/40 rounded-2xl p-4 transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981] bg-[#204735] px-2 py-0.5 rounded">
                  {item.day}
                </span>
                <span className="text-[11px] font-mono text-[#A7B8AE] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#A7B8AE]" />
                  {item.time}
                </span>
              </div>
              <h3 className="text-xs font-bold text-[#F8FAFC] leading-snug">{item.subject}</h3>
              <div className="flex items-center justify-between text-[11px] text-[#A7B8AE] pt-1 border-t border-[#294638]/60">
                <span>{item.room}</span>
                <span className="text-[#6EE7B7]">{item.teacher}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Classroom Notices & Support Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Notices */}
        <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <Info className="w-4 h-4 text-[#10B981]" />
            Classroom Notices & Guidelines
          </h2>
          <div className="space-y-2.5">
            {notices.map((n: any) => (
              <div key={n.id} className="p-3 bg-[#10231C] border border-[#294638] rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F8FAFC]">{n.title}</span>
                  <span className="text-[10px] font-mono text-[#A7B8AE]">{n.date}</span>
                </div>
                <p className="text-[11px] text-[#A7B8AE]">{n.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support Contact */}
        <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#10B981]" />
            Department Support & Helpdesk
          </h2>
          <div className="bg-[#10231C] p-4 rounded-2xl border border-[#294638] space-y-2 text-xs">
            <p className="font-bold text-[#F8FAFC]">{support?.department || 'Department Coordinator'}</p>
            <p className="text-[#A7B8AE]">{support?.coordinator}</p>
            <div className="pt-2 border-t border-[#294638] space-y-1 text-[11px] font-mono">
              <p>Email: <span className="text-[#10B981]">{support?.email}</span></p>
              <p>Phone: <span className="text-[#F8FAFC]">{support?.phone}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
