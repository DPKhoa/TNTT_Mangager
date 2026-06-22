import { useState, useEffect } from 'react';
import { Search, Save, TrendingUp, TrendingDown, ChevronUp, Minus } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

// ── Constants ──────────────────────────────────────────────────────────────

const PERFORMANCE_CONFIG = {
  EXCELLENT: { label: 'Xuất sắc', color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-300' },
  GOOD:      { label: 'Giỏi',     color: 'bg-blue-100 text-blue-700',       border: 'border-blue-300'    },
  AVERAGE:   { label: 'Khá',      color: 'bg-amber-100 text-amber-700',     border: 'border-amber-300'   },
  WEAK:      { label: 'Yếu',      color: 'bg-red-100 text-red-700',         border: 'border-red-300'     },
};

const SCORE_REGEX = /^(\d{1,2}(\.\d{0,1})?|10(\.0?)?)$/;

// ── Helpers ────────────────────────────────────────────────────────────────

function getCurrentAcademicYear() {
  const year  = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function calcPreview(catScore, attScore) {
  const cat = parseFloat(catScore);
  const att = parseFloat(attScore);
  if (isNaN(cat) || isNaN(att)) return null;
  if (cat < 0 || cat > 10 || att < 0 || att > 10) return null;
  const avg = cat * 0.7 + att * 0.3;
  const performance =
    avg >= 8.5 ? 'EXCELLENT' :
    avg >= 7.0 ? 'GOOD'      :
    avg >= 5.0 ? 'AVERAGE'   : 'WEAK';
  return { performance, promoted: performance !== 'WEAK', avg: avg.toFixed(2) };
}

function validateScore(value) {
  if (value === '' || value === '.') return true;
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0 && num <= 10;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Spinner({ size = 4 }) {
  return (
    <svg className={`animate-spin h-${size} w-${size} shrink-0`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function PerformanceBadge({ performance }) {
  const cfg = PERFORMANCE_CONFIG[performance];
  if (!cfg) return null;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function PromotedBadge({ promoted }) {
  if (promoted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300">
        <ChevronUp size={12} />
        Lên lớp
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
      <Minus size={12} />
      Ở lại lớp
    </span>
  );
}

function ScoreInput({ value, onChange, placeholder }) {
  return (
    <input
      type="number"
      min="0"
      max="10"
      step="0.1"
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (v === '' || validateScore(v)) onChange(v);
      }}
      placeholder={placeholder}
      className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all"
    />
  );
}

function MemberProgressRow({ index, member, classroomId, rowState, onUpdate }) {
  const { catScore, attScore, remarks, result, evaluating } = rowState;

  const preview = calcPreview(catScore, attScore);
  const canEvaluate = catScore !== '' && attScore !== '' && classroomId && !evaluating;

  async function handleEvaluate() {
    if (!canEvaluate) return;
    onUpdate({ evaluating: true });

    try {
      await axiosClient.put('/progress/evaluate', {
        studentId:       member.id,
        classroomId,
        catechismScore:  parseFloat(catScore),
        attendanceScore: parseFloat(attScore),
        remarks:         remarks || null,
      });

      const { data } = await axiosClient.get('/progress', {
        params: { studentId: member.id, classroomId },
      });

      onUpdate({ result: data, evaluating: false });
    } catch {
      onUpdate({ evaluating: false });
    }
  }

  return (
    <tr className="group hover:bg-gray-50 transition-colors">
      {/* STT */}
      <td className="px-5 py-3 text-sm text-gray-400 w-12 tabular-nums">{index}</td>

      {/* Member name */}
      <td className="px-5 py-3">
        <p className="text-sm font-semibold text-gray-900">{member.fullName}</p>
        {member.saintName && <p className="text-xs text-gray-400">{member.saintName}</p>}
      </td>

      {/* Catechism score */}
      <td className="px-5 py-3">
        <ScoreInput
          value={catScore}
          onChange={(v) => onUpdate({ catScore: v })}
          placeholder="0–10"
        />
      </td>

      {/* Attendance score */}
      <td className="px-5 py-3">
        <ScoreInput
          value={attScore}
          onChange={(v) => onUpdate({ attScore: v })}
          placeholder="0–10"
        />
      </td>

      {/* Remarks */}
      <td className="px-5 py-3">
        <input
          type="text"
          value={remarks}
          onChange={(e) => onUpdate({ remarks: e.target.value })}
          placeholder="Nhận xét..."
          maxLength={500}
          className="w-full min-w-36 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all"
        />
      </td>

      {/* Live preview */}
      <td className="px-5 py-3">
        {result ? (
          <div className="flex flex-col gap-1">
            <PerformanceBadge performance={result.performance} />
            <PromotedBadge promoted={result.promoted} />
            {result.catechismScore != null && (
              <span className="text-xs text-gray-400 tabular-nums">
                TB: {(parseFloat(result.catechismScore) * 0.7 + parseFloat(result.attendanceScore) * 0.3).toFixed(2)}
              </span>
            )}
          </div>
        ) : preview ? (
          <div className="flex flex-col gap-1 opacity-60">
            <PerformanceBadge performance={preview.performance} />
            <span className="text-xs text-gray-400">TB: {preview.avg}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-300 italic">—</span>
        )}
      </td>

      {/* Evaluate button */}
      <td className="px-5 py-3">
        <button
          type="button"
          onClick={handleEvaluate}
          disabled={!canEvaluate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-200 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
        >
          {evaluating ? <Spinner size={3} /> : <Save size={13} />}
          {evaluating ? 'Đang lưu...' : 'Lưu điểm'}
        </button>
      </td>
    </tr>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const DEFAULT_ROW = { catScore: '', attScore: '', remarks: '', result: null, evaluating: false };

export default function StudentProgress() {
  const [academicYear,   setAcademicYear]   = useState(getCurrentAcademicYear);
  const [classrooms,     setClassrooms]     = useState([]);
  const [classroomId,    setClassroomId]    = useState('');
  const [loadingRooms,   setLoadingRooms]   = useState(false);
  const [members,        setMembers]        = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [rowStates,      setRowStates]      = useState({});
  const [localFilter,    setLocalFilter]    = useState('');
  const [toast,          setToast]          = useState(null);

  // Load classrooms when year changes
  useEffect(() => {
    if (!/^\d{4}-\d{4}$/.test(academicYear)) return;
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

  // Load members when classroom is selected
  useEffect(() => {
    if (!classroomId) { setMembers([]); setRowStates({}); return; }
    let cancelled = false;
    setLoadingMembers(true);
    setMembers([]);
    setRowStates({});

    axiosClient
      .get('/members', { params: { status: 'ACTIVE', page: 0, size: 500 } })
      .then(({ data }) => {
        if (cancelled) return;
        const list = data.content ?? [];
        setMembers(list);
        const initial = {};
        list.forEach((m) => { initial[m.id] = { ...DEFAULT_ROW }; });
        setRowStates(initial);
      })
      .catch(() => { if (!cancelled) showToast('error', 'Không thể tải danh sách thiếu nhi.'); })
      .finally(() => { if (!cancelled) setLoadingMembers(false); });

    return () => { cancelled = true; };
  }, [classroomId]);

  function updateRow(memberId, fields) {
    setRowStates((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], ...fields },
    }));
  }

  function showToast(type, message) { setToast({ type, message }); }
  function closeToast()             { setToast(null); }

  const filteredMembers = members.filter((m) =>
    m.fullName.toLowerCase().includes(localFilter.toLowerCase()) ||
    (m.saintName ?? '').toLowerCase().includes(localFilter.toLowerCase()),
  );

  const savedCount  = Object.values(rowStates).filter((r) => r.result !== null).length;
  const pendingCount = members.length - savedCount;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {toast && <Toast type={toast.type} message={toast.message} onClose={closeToast} />}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kết Quả Học Tập</h1>
        <p className="text-sm text-gray-400 mt-0.5">Nhập điểm và xếp loại cuối năm học cho thiếu nhi</p>
      </div>

      {/* Setup card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Chọn lớp học</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Năm học</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => { setAcademicYear(e.target.value); }}
              placeholder="VD: 2024-2025"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Lớp học {loadingRooms && <span className="text-gray-400 font-normal">(đang tải...)</span>}
            </label>
            <select
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
              disabled={loadingRooms || classrooms.length === 0}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <option value="">
                {classrooms.length === 0 && !loadingRooms ? 'Không có lớp' : '-- Chọn lớp --'}
              </option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>{c.className} ({c.academicYear})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Formula note */}
        <p className="mt-4 text-xs text-gray-400">
          Công thức xếp loại: <span className="font-medium text-gray-600">TB = Giáo lý × 0.7 + Chuyên cần × 0.3</span>
          &nbsp;·&nbsp; ≥8.5 Xuất sắc &nbsp;·&nbsp; ≥7.0 Giỏi &nbsp;·&nbsp; ≥5.0 Khá &nbsp;·&nbsp; &lt;5.0 Yếu (ở lại lớp)
        </p>
      </div>

      {/* Members table */}
      {classroomId && (
        <>
          {/* Stats + filter */}
          {!loadingMembers && members.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">
                  Tổng: <span className="font-bold text-gray-800">{members.length}</span>
                </span>
                <span className="text-green-600">
                  Đã lưu: <span className="font-bold">{savedCount}</span>
                </span>
                <span className="text-amber-600">
                  Chưa nhập: <span className="font-bold">{pendingCount}</span>
                </span>
              </div>

              <div className="relative w-full sm:w-60">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={localFilter}
                  onChange={(e) => setLocalFilter(e.target.value)}
                  placeholder="Lọc theo tên..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5 text-left w-12">STT</th>
                    <th className="px-5 py-3.5 text-left">Thiếu nhi</th>
                    <th className="px-5 py-3.5 text-left w-28">
                      Giáo lý <span className="font-normal text-gray-400">(×0.7)</span>
                    </th>
                    <th className="px-5 py-3.5 text-left w-28">
                      Chuyên cần <span className="font-normal text-gray-400">(×0.3)</span>
                    </th>
                    <th className="px-5 py-3.5 text-left">Ghi chú</th>
                    <th className="px-5 py-3.5 text-left w-40">Kết quả</th>
                    <th className="px-5 py-3.5 text-left w-28"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loadingMembers ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                          <Spinner size={4} /> Đang tải danh sách...
                        </div>
                      </td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                        {localFilter ? `Không tìm thấy thiếu nhi với tên "${localFilter}".` : 'Không có thiếu nhi nào.'}
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member, idx) => (
                      <MemberProgressRow
                        key={member.id}
                        index={idx + 1}
                        member={member}
                        classroomId={classroomId}
                        rowState={rowStates[member.id] ?? DEFAULT_ROW}
                        onUpdate={(fields) => updateRow(member.id, fields)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Placeholder when no classroom selected */}
      {!classroomId && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={24} className="text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">Chọn một lớp học để bắt đầu</h3>
          <p className="text-sm text-gray-400">Nhập năm học và chọn lớp từ bộ lọc phía trên.</p>
        </div>
      )}
    </div>
  );
}
