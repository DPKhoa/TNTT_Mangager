import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, X, ChevronLeft, ChevronRight,
  User, Phone, Mail, MapPin, Calendar, BookOpen,
  Shield, Heart, Users, Cross, Droplets, Flame,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

// ── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

const BRANCH_LABEL = {
  INFANT:        'Ấu nhi',
  JUNIOR:        'Thiếu nhi',
  SENIOR:        'Nghĩa sĩ',
  ADVENTURER:    'Hiệp sĩ',
  SOLDIER:       'Chiến sĩ',
  JUNIOR_LEADER: 'Dự trưởng',
};

const BRANCH_COLOR = {
  INFANT:        'bg-pink-100 text-pink-700',
  JUNIOR:        'bg-blue-100 text-blue-700',
  SENIOR:        'bg-purple-100 text-purple-700',
  ADVENTURER:    'bg-amber-100 text-amber-700',
  SOLDIER:       'bg-red-100 text-red-700',
  JUNIOR_LEADER: 'bg-emerald-100 text-emerald-700',
};

const STATUS_COLOR = {
  ACTIVE:   'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
  default:  'bg-gray-100 text-gray-500',
};

const STATUS_LABEL = {
  ACTIVE:   'Đang sinh hoạt',
  INACTIVE: 'Ngừng sinh hoạt',
};

const GENDER_LABEL = {
  MALE:   'Nam',
  FEMALE: 'Nữ',
  OTHER:  'Khác',
};

const ORIGIN_LABEL = {
  LOCAL:    'Tại giáo xứ',
  TRANSFER: 'Chuyển đến',
};

const RELATIONSHIP_LABEL = {
  FATHER:          'Bố',
  MOTHER:          'Mẹ',
  GRANDPARENT:     'Ông / Bà',
  OTHER_GUARDIAN:  'Người giám hộ',
};

const SACRAMENT_CONFIG = {
  BAPTISM:          { label: 'Rửa Tội',               color: 'bg-blue-500',    dotColor:  'border-blue-500'   },
  FIRST_COMMUNION:  { label: 'Rước Lễ Lần Đầu',       color: 'bg-amber-400',   dotColor:  'border-amber-400'  },
  SOLEMN_COMMUNION: { label: 'Rước Lễ Trọng Thể',     color: 'bg-orange-500',  dotColor:  'border-orange-500' },
  CONFIRMATION:     { label: 'Thêm Sức',               color: 'bg-red-500',     dotColor:  'border-red-500'    },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{value}</p>
      </div>
    </div>
  );
}

// ── Member Detail Modal ────────────────────────────────────────────────────

function MemberModal({ member, sacraments, loadingSacraments, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sortedSacraments = [...sacraments].sort(
    (a, b) => new Date(a.receivedDate) - new Date(b.receivedDate),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {member.saintName ? `${member.saintName} ${member.fullName}` : member.fullName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${BRANCH_COLOR[member.branch] ?? 'bg-gray-100 text-gray-600'}`}>
                {BRANCH_LABEL[member.branch] ?? member.branch}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[member.status] ?? STATUS_COLOR.default}`}>
                {STATUS_LABEL[member.status] ?? member.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-gray-400 hover:text-gray-700"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Personal info */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Thông tin cá nhân</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon={Calendar}  label="Ngày sinh"       value={formatDate(member.dateOfBirth)} />
              <InfoRow icon={User}      label="Giới tính"       value={GENDER_LABEL[member.gender] ?? member.gender} />
              <InfoRow icon={BookOpen}  label="Nguồn gốc"       value={ORIGIN_LABEL[member.origin] ?? member.origin} />
              <InfoRow icon={Calendar}  label="Ngày gia nhập"   value={formatDate(member.enrollmentDate)} />
              <InfoRow icon={MapPin}    label="Địa chỉ"         value={member.address} />
              <InfoRow icon={Phone}     label="Điện thoại"      value={member.phoneNumber} />
              <InfoRow icon={Mail}      label="Email"           value={member.email} />
            </div>
          </section>

          {/* Guardians */}
          {member.guardians?.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Phụ huynh / Người giám hộ</p>
              <div className="space-y-2.5">
                {member.guardians.map((g) => (
                  <div key={g.id} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <Users size={14} className="text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{g.fullName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {RELATIONSHIP_LABEL[g.relationship] ?? g.relationship}
                        {g.phoneNumber && ` · ${g.phoneNumber}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sacraments timeline */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Các Bí Tích đã nhận
            </p>

            {loadingSacraments ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Đang tải bí tích...
              </div>
            ) : sortedSacraments.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-2">Chưa có dữ liệu bí tích.</p>
            ) : (
              <div className="relative pl-6">
                {/* Vertical line */}
                <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" />

                <div className="space-y-4">
                  {sortedSacraments.map((s) => {
                    const cfg = SACRAMENT_CONFIG[s.sacramentType] ?? { label: s.sacramentType, color: 'bg-gray-400', dotColor: 'border-gray-400' };
                    return (
                      <div key={s.id} className="relative">
                        {/* Timeline dot */}
                        <div className={`absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2 bg-white ${cfg.dotColor}`} />

                        <div className="pl-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            <span className="text-xs text-gray-400">{formatDate(s.receivedDate)}</span>
                          </div>
                          <div className="text-xs text-gray-500 space-y-0.5">
                            {s.patronSaint && <p>Bổn mạng: <span className="text-gray-700">{s.patronSaint}</span></p>}
                            {s.celebrant  && <p>Linh mục ban: <span className="text-gray-700">{s.celebrant}</span></p>}
                            {s.place      && <p>Nơi nhận: <span className="text-gray-700">{s.place}</span></p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Notes */}
          {member.notes && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ghi chú</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">{member.notes}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Member Row ─────────────────────────────────────────────────────────────

function MemberRow({ index, member, onClick }) {
  return (
    <tr
      onClick={() => onClick(member)}
      className="hover:bg-red-50 transition-colors cursor-pointer group"
    >
      <td className="px-5 py-3.5 text-sm text-gray-400 tabular-nums w-12">{index}</td>

      <td className="px-5 py-3.5">
        <div>
          <p className="text-sm font-semibold text-gray-900 group-hover:text-red-700 transition-colors">
            {member.fullName}
          </p>
          {member.saintName && (
            <p className="text-xs text-gray-400">{member.saintName}</p>
          )}
        </div>
      </td>

      <td className="px-5 py-3.5 text-sm text-gray-500">
        {formatDate(member.dateOfBirth)}
      </td>

      <td className="px-5 py-3.5">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${BRANCH_COLOR[member.branch] ?? 'bg-gray-100 text-gray-600'}`}>
          {BRANCH_LABEL[member.branch] ?? member.branch}
        </span>
      </td>

      <td className="px-5 py-3.5">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[member.status] ?? STATUS_COLOR.default}`}>
          {STATUS_LABEL[member.status] ?? member.status}
        </span>
      </td>
    </tr>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function Students() {
  const [keyword,         setKeyword]         = useState('');
  const [page,            setPage]            = useState(0);
  const [members,         setMembers]         = useState([]);
  const [totalPages,      setTotalPages]      = useState(0);
  const [totalElements,   setTotalElements]   = useState(0);
  const [loading,         setLoading]         = useState(false);
  const [selectedMember,  setSelectedMember]  = useState(null);
  const [sacraments,      setSacraments]      = useState([]);
  const [loadingSacr,     setLoadingSacr]     = useState(false);
  const [toast,           setToast]           = useState(null);
  const debounceRef = useRef(null);

  // Fetch members: debounced when keyword changes, immediate when page changes
  const fetchMembers = useCallback(async (kw, pg) => {
    setLoading(true);
    try {
      const endpoint = kw.trim() ? '/members/search' : '/members';
      const params = kw.trim()
        ? { keyword: kw.trim(), page: pg, size: PAGE_SIZE }
        : { status: 'ACTIVE', page: pg, size: PAGE_SIZE };

      const { data } = await axiosClient.get(endpoint, { params });
      setMembers(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
    } catch {
      showToast('error', 'Không thể tải danh sách thiếu nhi.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce keyword changes; page change is immediate
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchMembers(keyword, page), keyword ? 400 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [keyword, page, fetchMembers]);

  async function openModal(member) {
    setSelectedMember(member);
    setSacraments([]);
    setLoadingSacr(true);
    try {
      const { data } = await axiosClient.get('/sacraments', { params: { studentId: member.id } });
      setSacraments(data ?? []);
    } catch {
      // silent — sacrament list may be empty
    } finally {
      setLoadingSacr(false);
    }
  }

  function closeModal() {
    setSelectedMember(null);
    setSacraments([]);
  }

  function handleKeywordChange(value) {
    setKeyword(value);
    setPage(0);
  }

  function showToast(type, message) { setToast({ type, message }); }
  function closeToast()             { setToast(null); }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {toast && <Toast type={toast.type} message={toast.message} onClose={closeToast} />}
      {selectedMember && (
        <MemberModal
          member={selectedMember}
          sacraments={sacraments}
          loadingSacraments={loadingSacr}
          onClose={closeModal}
        />
      )}

      {/* Header + search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách Thiếu Nhi</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalElements > 0
              ? `${totalElements} thiếu nhi được tìm thấy`
              : 'Quản lý hồ sơ thiếu nhi trong xứ đoàn'}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            placeholder="Tìm kiếm họ tên..."
            className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />
          {keyword && (
            <button
              onClick={() => handleKeywordChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
              aria-label="Xóa tìm kiếm"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3.5 text-left w-12">STT</th>
                <th className="px-5 py-3.5 text-left">Họ và Tên</th>
                <th className="px-5 py-3.5 text-left">Ngày sinh</th>
                <th className="px-5 py-3.5 text-left">Ngành</th>
                <th className="px-5 py-3.5 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-gray-400">
                    {keyword
                      ? `Không tìm thấy thiếu nhi nào với từ khóa "${keyword}".`
                      : 'Chưa có dữ liệu thiếu nhi.'}
                  </td>
                </tr>
              ) : (
                members.map((m, idx) => (
                  <MemberRow
                    key={m.id}
                    index={page * PAGE_SIZE + idx + 1}
                    member={m}
                    onClick={openModal}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Trang <span className="font-semibold text-gray-700">{page + 1}</span> / {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft size={14} />
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Sau
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Click vào một dòng để xem chi tiết hồ sơ và bí tích của thiếu nhi.
      </p>
    </div>
  );
}
