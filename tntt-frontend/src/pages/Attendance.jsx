import { useState, useEffect } from 'react';
import { CheckCircle2, Send, RefreshCw } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

// ── Constants ──────────────────────────────────────────────────────────────

const STATUSES = [
  { key: 'PRESENT',           label: 'Có mặt',       short: 'Có mặt'    },
  { key: 'EXCUSED_ABSENCE',   label: 'Vắng phép',    short: 'Vắng phép' },
  { key: 'UNEXCUSED_ABSENCE', label: 'Vắng không phép', short: 'Vắng KP' },
];

const STATUS_ACTIVE_CLASS = {
  PRESENT:           'bg-green-500 text-white border-green-500',
  EXCUSED_ABSENCE:   'bg-amber-400 text-white border-amber-400',
  UNEXCUSED_ABSENCE: 'bg-red-500   text-white border-red-500',
};

const STATUS_IDLE_CLASS =
  'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700';

const BRANCH_LABEL = {
  INFANT:       'Ấu nhi',
  JUNIOR:       'Thiếu nhi',
  SENIOR:       'Nghĩa sĩ',
  ADVENTURER:   'Hiệp sĩ',
  SOLDIER:      'Chiến sĩ',
  JUNIOR_LEADER:'Dự trưởng',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getDefaultAcademicYear() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function buildAttendanceMap(members) {
  return Object.fromEntries(
    members.map((m) => [m.id, { status: 'PRESENT', remarks: '' }]),
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function StatCard({ label, value, colorClass }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className={`text-xs font-medium mt-0.5 ${colorClass}`}>{label}</p>
    </div>
  );
}

function MemberRow({ index, member, entry, onStatusChange, onRemarksChange }) {
  const needsRemarks = entry.status !== 'PRESENT';

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* STT */}
      <td className="px-6 py-3 text-sm text-gray-400 w-12 tabular-nums">{index}</td>

      {/* Name */}
      <td className="px-6 py-3">
        <p className="text-sm font-semibold text-gray-900">{member.fullName}</p>
        {member.saintName && (
          <p className="text-xs text-gray-400">{member.saintName}</p>
        )}
      </td>

      {/* Branch */}
      <td className="px-6 py-3">
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
          {BRANCH_LABEL[member.branch] ?? member.branch}
        </span>
      </td>

      {/* Status buttons */}
      <td className="px-6 py-3">
        <div className="flex items-center justify-center gap-1.5">
          {STATUSES.map(({ key, short }) => (
            <button
              key={key}
              type="button"
              onClick={() => onStatusChange(key)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all duration-100 cursor-pointer whitespace-nowrap ${
                entry.status === key
                  ? STATUS_ACTIVE_CLASS[key]
                  : STATUS_IDLE_CLASS
              }`}
            >
              {short}
            </button>
          ))}
        </div>
      </td>

      {/* Remarks */}
      <td className="px-6 py-3 w-52">
        {needsRemarks ? (
          <input
            type="text"
            value={entry.remarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            placeholder="Ghi chú..."
            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-transparent transition-all"
          />
        ) : (
          <span className="text-xs text-gray-300 italic">—</span>
        )}
      </td>
    </tr>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function Attendance() {
  const [academicYear,  setAcademicYear]  = useState(getDefaultAcademicYear);
  const [classrooms,    setClassrooms]    = useState([]);
  const [classroomId,   setClassroomId]   = useState('');
  const [sessionDate,   setSessionDate]   = useState(getTodayString);
  const [sessionId,     setSessionId]     = useState(null);
  const [members,       setMembers]       = useState([]);
  const [attendance,    setAttendance]    = useState({});
  const [phase,         setPhase]         = useState('SETUP'); // 'SETUP' | 'MARKING'

  const [loadingRooms,  setLoadingRooms]  = useState(false);
  const [initializing,  setInitializing]  = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [toast,         setToast]         = useState(null);

  // Tải danh sách lớp khi năm học thay đổi và hợp lệ
  useEffect(() => {
    const isValid = /^\d{4}-\d{4}$/.test(academicYear);
    if (!isValid) return;

    let cancelled = false;
    setLoadingRooms(true);
    setClassrooms([]);
    setClassroomId('');

    axiosClient
      .get('/classrooms', { params: { year: academicYear } })
      .then(({ data }) => { if (!cancelled) setClassrooms(data ?? []); })
      .catch(() => { if (!cancelled) showToast('error', 'Không thể tải danh sách lớp.'); })
      .finally(() => { if (!cancelled) setLoadingRooms(false); });

    return () => { cancelled = true; };
  }, [academicYear]);

  // ── Toast helpers ────────────────────────────────────────────────────────

  function showToast(type, message) { setToast({ type, message }); }
  function closeToast() { setToast(null); }

  // ── Attendance state helpers ─────────────────────────────────────────────

  function updateStatus(memberId, status) {
    setAttendance((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], status },
    }));
  }

  function updateRemarks(memberId, remarks) {
    setAttendance((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], remarks },
    }));
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  async function initializeSession() {
    if (!classroomId || !sessionDate) return;
    setInitializing(true);

    try {
      const [sessionRes, membersRes] = await Promise.all([
        axiosClient.post('/attendance/session', {
          classroomId,
          sessionDate,
          description: `Buổi sinh hoạt ngày ${sessionDate}`,
        }),
        axiosClient.get('/members', {
          params: { status: 'ACTIVE', page: 0, size: 500 },
        }),
      ]);

      const memberList = membersRes.data.content ?? [];
      setSessionId(sessionRes.data.id);
      setMembers(memberList);
      setAttendance(buildAttendanceMap(memberList));
      setPhase('MARKING');
    } catch {
      showToast('error', 'Không thể khởi tạo buổi điểm danh. Vui lòng thử lại.');
    } finally {
      setInitializing(false);
    }
  }

  async function submitAttendance() {
    if (!sessionId || members.length === 0) return;
    setSubmitting(true);

    const records = members.map((m) => ({
      studentId: m.id,
      status:    attendance[m.id]?.status   ?? 'PRESENT',
      remarks:   attendance[m.id]?.remarks  || null,
    }));

    try {
      await axiosClient.post('/attendance/submit', { sessionId, records });
      showToast('success', `Đã nộp bảng điểm danh ${members.length} thiếu nhi thành công!`);
    } catch {
      showToast('error', 'Nộp bảng thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  function resetToSetup() {
    setSessionId(null);
    setMembers([]);
    setAttendance({});
    setPhase('SETUP');
  }

  // ── Derived values ───────────────────────────────────────────────────────

  const presentCount  = Object.values(attendance).filter((a) => a.status === 'PRESENT').length;
  const absentCount   = members.length - presentCount;
  const activeRoom    = classrooms.find((c) => c.id === classroomId);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {toast && <Toast type={toast.type} message={toast.message} onClose={closeToast} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Điểm Danh</h1>
          <p className="text-sm text-gray-400 mt-0.5">Quản lý buổi điểm danh cho lớp học</p>
        </div>
        {phase === 'MARKING' && (
          <button
            type="button"
            onClick={resetToSetup}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
            Buổi mới
          </button>
        )}
      </div>

      {/* ── PHASE: SETUP ──────────────────────────────────────────────────── */}
      {phase === 'SETUP' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-5 uppercase tracking-wide">
            Thiết lập buổi điểm danh
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Năm học */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Năm học
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="VD: 2024-2025"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Lớp học */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Lớp học
                {loadingRooms && (
                  <span className="ml-1.5 text-gray-400 font-normal">(đang tải...)</span>
                )}
              </label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                disabled={loadingRooms || classrooms.length === 0}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <option value="">
                  {classrooms.length === 0 && !loadingRooms
                    ? 'Không tìm thấy lớp'
                    : '-- Chọn lớp --'}
                </option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.className} ({c.academicYear})
                  </option>
                ))}
              </select>
            </div>

            {/* Ngày sinh hoạt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ngày sinh hoạt
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={initializeSession}
              disabled={!classroomId || !sessionDate || initializing}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-red-300 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              {initializing ? <><Spinner /> Đang khởi tạo...</> : <><CheckCircle2 size={16} /> Bắt đầu điểm danh</>}
            </button>
          </div>
        </div>
      )}

      {/* ── PHASE: MARKING ────────────────────────────────────────────────── */}
      {phase === 'MARKING' && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Tổng thiếu nhi"  value={members.length} colorClass="text-gray-500"  />
            <StatCard label="Có mặt"           value={presentCount}   colorClass="text-green-600" />
            <StatCard label="Vắng mặt"         value={absentCount}    colorClass="text-red-500"   />
          </div>

          {/* Table card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Card header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {activeRoom?.className ?? 'Danh sách điểm danh'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Ngày: {sessionDate} &nbsp;·&nbsp; {members.length} thiếu nhi
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Có mặt
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Vắng phép
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Vắng KP
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3 text-left w-12">STT</th>
                    <th className="px-6 py-3 text-left">Họ và Tên</th>
                    <th className="px-6 py-3 text-left">Ngành</th>
                    <th className="px-6 py-3 text-center">Trạng thái</th>
                    <th className="px-6 py-3 text-left w-48">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {members.map((member, idx) => (
                    <MemberRow
                      key={member.id}
                      index={idx + 1}
                      member={member}
                      entry={attendance[member.id] ?? { status: 'PRESENT', remarks: '' }}
                      onStatusChange={(status)  => updateStatus(member.id, status)}
                      onRemarksChange={(remarks) => updateRemarks(member.id, remarks)}
                    />
                  ))}
                </tbody>
              </table>

              {members.length === 0 && (
                <div className="py-16 text-center text-sm text-gray-400">
                  Không tìm thấy thiếu nhi nào đang hoạt động.
                </div>
              )}
            </div>
          </div>

          {/* Submit button */}
          <div className="flex justify-end pb-2">
            <button
              type="button"
              onClick={submitAttendance}
              disabled={submitting || members.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-red-300 text-white font-semibold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-md"
            >
              {submitting
                ? <><Spinner /> Đang nộp...</>
                : <><Send size={16} /> Nộp bảng điểm danh</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
