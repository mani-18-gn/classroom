import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';
import { Classroom } from '../types';
import {
  School, Plus, Play, Users, Camera
} from 'lucide-react';

interface ClassroomManagementPageProps {
  onStartMonitoring: (classroomId: number) => void;
}

export const ClassroomManagementPage: React.FC<ClassroomManagementPageProps> = ({
  onStartMonitoring,
}) => {
  const { t } = useLanguage();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New classroom state
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCamera, setNewCamera] = useState('Camera 01 (Integrated Front WebCam)');

  const fetchClassrooms = async () => {
    try {
      const res = await apiRequest<{ classrooms: Classroom[] }>('/classrooms');
      setClassrooms(res.classrooms || []);
    } catch (err) {
      console.error('Error fetching classrooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;
    try {
      await apiRequest('/classrooms', {
        method: 'POST',
        body: JSON.stringify({
          classroom_code: newCode,
          name: newName,
          camera_source: newCamera,
          class_id: 1,
          teacher_id: 1,
        }),
      });
      setShowAddModal(false);
      setNewCode('');
      setNewName('');
      fetchClassrooms();
    } catch (err: any) {
      alert(err.message || 'Failed to create classroom');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#294638] flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight">Classroom Infrastructure Management</h1>
          <p className="text-xs text-[#A7B8AE] mt-0.5">
            Configure physical classrooms, assigned cameras, student enrollments, and live monitoring statuses.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-[#0B1713] text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add Classroom
        </button>
      </div>

      {/* Classroom Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classrooms.map((cls) => (
          <div
            key={cls.id}
            className="bg-[#17382B] border border-[#294638] rounded-3xl p-5 shadow-sm space-y-4 hover:border-[#10B981]/50 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="p-3 bg-[#204735] text-[#10B981] rounded-2xl border border-[#294638]">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#F8FAFC] tracking-tight">{cls.name}</h3>
                    <span className="text-[10px] bg-[#10231C] text-[#6EE7B7] font-mono px-2 py-0.5 rounded-full border border-[#294638]">
                      {cls.classroom_code}
                    </span>
                  </div>
                  <p className="text-xs text-[#A7B8AE] mt-0.5">
                    {cls.class_name || '8th Semester CSE'} • Section A
                  </p>
                  <p className="text-xs text-[#A7B8AE]">Teacher: <strong className="text-[#F8FAFC]">{cls.teacher_name || 'Class Teacher'}</strong></p>
                </div>
              </div>

              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  cls.status === 'MONITORING'
                    ? 'bg-[#204735] text-[#10B981] border-[#10B981]/40 animate-pulse'
                    : 'bg-[#10231C] text-[#A7B8AE] border-[#294638]'
                }`}
              >
                {cls.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#10231C] p-3 rounded-2xl border border-[#294638]">
              <div className="flex items-center gap-2 text-[#F8FAFC]">
                <Users className="w-4 h-4 text-[#10B981]" />
                <span>{cls.enrolled_count || 32} Enrolled Students</span>
              </div>
              <div className="flex items-center gap-2 text-[#F8FAFC] truncate">
                <Camera className="w-4 h-4 text-[#6EE7B7] flex-shrink-0" />
                <span className="truncate text-[#A7B8AE]">{cls.camera_source}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#A7B8AE] font-mono">ID: #{cls.id}</span>
              <button
                onClick={() => onStartMonitoring(cls.id)}
                className="flex items-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-[#0B1713] text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Live Session</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Classroom Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#10231C] border border-[#294638] rounded-3xl max-w-md w-full p-6 shadow-2xl text-[#F8FAFC]">
            <h3 className="text-base font-bold text-[#F8FAFC] mb-4">Add Classroom</h3>
            <form onSubmit={handleCreateClassroom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Classroom Code</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="E.g. CR-305"
                  className="w-full bg-[#0B1713] border border-[#294638] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Classroom Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="E.g. Room 305 — Machine Learning Studio"
                  className="w-full bg-[#0B1713] border border-[#294638] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Camera Source</label>
                <input
                  type="text"
                  value={newCamera}
                  onChange={(e) => setNewCamera(e.target.value)}
                  placeholder="Camera 01"
                  className="w-full bg-[#0B1713] border border-[#294638] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-[#17382B] text-[#A7B8AE] hover:text-[#F8FAFC] px-4 py-2 rounded-xl text-xs border border-[#294638] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#10B981] hover:bg-[#059669] text-[#0B1713] font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
