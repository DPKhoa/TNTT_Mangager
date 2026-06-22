import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, X, Plus, Pencil, Trash2, AlertTriangle,
  ChevronLeft, ChevronRight, PowerOff, Power, Shield,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

// ── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

const GENDER_OPTIONS   = [{ value: 'MALE', label: 'Nam' }, { value: 'FEMALE', label: 'Nữ' }];

const LEVEL_OPTIONS    = [
  { value: 'PROBATIONARY_LEADER', label: 'Dự trưởng'    },
  { value: 'CERTIFIED_LEADER',    label: 'Huynh Trưởng' },
];

const STATUS_OPTIONS   = [
  { value: 'ACTIVE',   label: 'Đang phục vụ'       },
  { value: 'ON_LEAVE', label: 'Tạm nghỉ'           },
  { value: 'INACTIVE', label: 'Không còn phục vụ'  },
];

const POSITION_OPTIONS = [
  { value: 'PARISH_CHIEF',           label: 'Đoàn trưởng Xứ đoàn'   },
  { value: 'PARISH_DEPUTY_EXTERNAL', label: 'Đoàn phó Đối ngoại'     },
  { value: 'PARISH_DEPUTY_INTERNAL', label: 'Đoàn phó Đối nội'       },
  { value: 'SECRETARY',              label: 'Thư ký'                  },
  { value: 'TREASURER',              label: 'Thủ quỹ'                 },
  { value: 'SPECIALIST',             label: 'Chuyên viên'             },
  { value: 'BRANCH_LEADER',          label: 'Trưởng ngành'            },
  { value: 'BRANCH_DEPUTY',          label: 'Phó ngành'               },
  { value: 'CLASS_LEADER',           label: 'Trưởng lớp'              },
  { value: 'ASSISTANT_SUPERVISOR',   label: 'Trợ tá Giám thị'         },
  { value: 'ASSISTANT_AIDE',         label: 'Trợ tá Trợ giáo'         },
  { value: 'GROUP_LEADER',           label: 'Trưởng nhóm'             },
];

const LEVEL_LABEL    = Object.fromEntries(LEVEL_OPTIONS.map(({ value, label }) => [value, label]));
const STATUS_LABEL   = Object.fromEntries(STATUS_OPTIONS.map(({ value, label }) => [value, label]));
const POSITION_LABEL = Object.fromEntries(POSITION_OPTIONS.map(({ value, label }) => [value, label]));

const STATUS_STYLE = {
  ACTIVE:   'bg-green-100 text-green-700',
  ON_LEAVE: 'bg-amber-100 text-amber-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
};

const LEVEL_STYLE = {
  PROBATIONARY_LEADER: 'bg-blue-100 text-blue-700',
  CERTIFIED_LEADER:    'bg-purple-100 text-purple-700',
};

const EMPTY_FORM = {
  leaderCode: '', christianName: '', fullName: '', dateOfBirth: '',
  gender: '', phoneNumber: '', email: '', level: '', status: 'ACTIVE', position: '',
};

// ── Admin check ────────────────────────────────────────────────────────────

function useIsAdmin() {
  const { user } = useAuth();
  return user?.roles?.some(
    (r) => r === 'ROLE_ADMIN' || r === 'ROLE_EXECUTIVE_COMMITTEE',
  ) ?? false;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function inputCls(hasError) {
  return [
    'w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-800',
    'focus:outline-none focus:ring-2 focus:border-transparent transition-all',
    hasError ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-red-500',
  ].join(' ');
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-red-500 normal-case">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function ModalBackdrop({ onClose, children }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Leader form modal (create + edit)
// ══════════════════════════════════════════════════════════════════════════

function leaderToForm(l) {
  return {
    leaderCode:    l.leaderCode    ?? '',
    christianName: l.christianName ?? '',
    fullName:      l.fullName      ?? '',
    dateOfBirth:   l.dateOfBirth   ?? '',
    gender:        l.gender        ?? '',
    phoneNumber:   l.phoneNumber   ?? '',
    email:         l.email         ?? '',
    level:         l.level         ?? '',
    status:        l.status        ?? 'ACTIVE',
    position:      l.position      ?? '',
  };
}

function validateLeaderForm(form) {
  const e = {};
  if (!form.leaderCode.trim())  e.leaderCode  = 'Mã HT không được để trống.';
  if (!form.fullName.trim())    e.fullName    = 'Họ và tên không được để trống.';
  if (!form.dateOfBirth)        e.dateOfBirth = 'Ngày sinh không được để trống.';
  if (!form.gender)             e.gender      = 'Vui lòng chọn giới tính.';
  if (!form.level)              e.level       = 'Vui lòng chọn cấp bậc.';
  if (!form.status)             e.status      = 'Vui lòng chọn trạng thái.';
  if (!form.position)           e.position    = 'Vui lòng chọn chức vụ.';
  if (form.phoneNumber && !/^(0|\+84)[0-9]{9}$/.test(form.phoneNumber.trim())) {
    e.phoneNumber = 'Số điện thoại không hợp lệ (VD: 0912345678).';
  }
  return e;
}

function LeaderFormModal({ mode, leader, onClose, onSuccess, showToast }) {
  const isEdit     = mode === 'edit';
  const [form,       setForm]       = useState(isEdit ? leaderToForm(leader) : EMPTY_FORM);
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  function change(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  }

  async function submit(e) {
    e.preventDefault();
    const errs = validateLeaderForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const payload = {
        leaderCode:    form.leaderCode.trim(),
        christianName: form.christianName.trim() || null,
        fullName:      form.fullName.trim(),
        dateOfBirth:   form.dateOfBirth || null,
        gender:        form.gender      || null,
        phoneNumber:   form.phoneNumber.trim() || null,
        email:         form.email.trim()       || null,
        level:         form.level,
        status:        form.status,
        position:      form.position,
      };

      if (isEdit) {
        await axiosClient.put(`/leaders/${leader.id}`, payload);
        showToast('success', `Đã cập nhật HT "${form.fullName.trim()}" thành công.`);
      } else {
        await axiosClient.post('/leaders', payload);
        showToast('success', `Đã thêm HT "${form.fullName.trim()}" thành công.`);
      }
      onSuccess();
    } catch (err) {
      showToast('error', err?.response?.data?.message ?? 'Đã có lỗi xảy ra.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {isEdit ? 'Chỉnh sửa Huynh Trưởng' : 'Thêm Huynh Trưởng mới'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? `Đang sửa: ${leader.fullName}` : 'Điền thông tin Huynh Trưởng bên dưới'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <FormField label="Mã Huynh Trưởng" required error={errors.leaderCode}>
              <input
                type="text"
                value={form.leaderCode}
                onChange={(e) => change('leaderCode', e.target.value)}
                placeholder="VD: HT-001"
                className={inputCls(!!errors.leaderCode)}
              />
            </FormField>

            <FormField label="Tên Thánh" error={errors.christianName}>
              <input
                type="text"
                value={form.christianName}
                onChange={(e) => change('christianName', e.target.value)}
                placeholder="VD: Giuse, Maria..."
                className={inputCls(false)}
              />
            </FormField>

            <FormField label="Họ và Tên" required error={errors.fullName}>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => change('fullName', e.target.value)}
                placeholder="Nguyễn Văn An"
                className={inputCls(!!errors.fullName)}
              />
            </FormField>

            <FormField label="Ngày sinh" required error={errors.dateOfBirth}>
              <input
                type="date"
                value={form.dateOfBirth}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => change('dateOfBirth', e.target.value)}
                className={inputCls(!!errors.dateOfBirth)}
              />
            </FormField>

            <FormField label="Giới tính" required error={errors.gender}>
              <select
                value={form.gender}
                onChange={(e) => change('gender', e.target.value)}
                className={inputCls(!!errors.gender)}
              >
                <option value="">-- Chọn giới tính --</option>
                {GENDER_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Điện thoại" error={errors.phoneNumber}>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => change('phoneNumber', e.target.value)}
                placeholder="0912345678"
                className={inputCls(!!errors.phoneNumber)}
              />
            </FormField>

            <FormField label="Email" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => change('email', e.target.value)}
                placeholder="ten@gmail.com"
                className={inputCls(!!errors.email)}
              />
            </FormField>

            <FormField label="Cấp bậc" required error={errors.level}>
              <select
                value={form.level}
                onChange={(e) => change('level', e.target.value)}
                className={inputCls(!!errors.level)}
              >
                <option value="">-- Chọn cấp bậc --</option>
                {LEVEL_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Trạng thái" required error={errors.status}>
              <select
                value={form.status}
                onChange={(e) => change('status', e.target.value)}
                className={inputCls(!!errors.status)}
              >
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </FormField>

            {/* Position — full width */}
            <div className="sm:col-span-2">
              <FormField label="Chức vụ" required error={errors.position}>
                <select
                  value={form.position}
                  onChange={(e) => change('position', e.target.value)}
                  className={inputCls(!!errors.position)}
                >
                  <option value="">-- Chọn chức vụ --</option>
                  {POSITION_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting && <Spinner />}
            {submitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm Huynh Trưởng'}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Delete confirm modal
// ══════════════════════════════════════════════════════════════════════════

function DeleteLeaderModal({ leader, onClose, onSuccess, showToast }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await axiosClient.delete(`/leaders/${leader.id}`);
      showToast('success', `Đã xóa hồ sơ "${leader.fullName}" thành công.`);
      onSuccess();
    } catch {
      showToast('error', 'Không thể xóa hồ sơ. Vui lòng thử lại.');
      setDeleting(false);
    }
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-5 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={26} className="text-red-500" />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-2">Xóa hồ sơ Huynh Trưởng</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Bạn có chắc muốn xóa hồ sơ của{' '}
            <span className="font-semibold text-gray-800">
              {leader.christianName ? `${leader.christianName} ` : ''}{leader.fullName}
            </span>?
            <br />
            <span className="text-red-500 text-xs font-medium">Hành động này không thể hoàn tác.</span>
          </p>
        </div>
        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 hover:border-gray-300 rounded-xl transition-all cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {deleting && <Spinner />}
            {deleting ? 'Đang xóa...' : 'Xóa hồ sơ'}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Table row
// ══════════════════════════════════════════════════════════════════════════

function LeaderRow({ index, leader, isAdmin, onEdit, onDelete, onToggleStatus, toggling }) {
  const isActive = leader.status === 'ACTIVE';

  return (
    <tr className="hover:bg-gray-50/60 transition-colors group">
      <td className="px-5 py-3.5 text-sm text-gray-400 tabular-nums">{index}</td>

      <td className="px-5 py-3.5">
        <p className="text-sm font-semibold text-gray-900">
          {leader.christianName ? `${leader.christianName} ` : ''}{leader.fullName}
        </p>
        <p className="text-xs text-gray-400 font-mono mt-0.5">{leader.leaderCode}</p>
      </td>

      <td className="px-5 py-3.5 text-sm text-gray-500">
        {leader.email ?? <span className="text-gray-300 italic text-xs">Chưa có</span>}
        {leader.phoneNumber && (
          <p className="text-xs text-gray-400 mt-0.5">{leader.phoneNumber}</p>
        )}
      </td>

      <td className="px-5 py-3.5">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${LEVEL_STYLE[leader.level] ?? 'bg-gray-100 text-gray-500'}`}>
          {LEVEL_LABEL[leader.level] ?? leader.level}
        </span>
      </td>

      <td className="px-5 py-3.5 text-sm text-gray-600">
        {POSITION_LABEL[leader.position] ?? leader.position}
      </td>

      <td className="px-5 py-3.5">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[leader.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {STATUS_LABEL[leader.status] ?? leader.status}
        </span>
      </td>

      {/* Actions — admin only */}
      <td className="px-5 py-3.5 w-32">
        {isAdmin ? (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Toggle status */}
            <button
              onClick={() => onToggleStatus(leader)}
              disabled={toggling === leader.id}
              title={isActive ? 'Tạm khóa tài khoản' : 'Kích hoạt tài khoản'}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer disabled:opacity-40 ${
                isActive
                  ? 'hover:bg-amber-50 text-gray-400 hover:text-amber-600'
                  : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
              }`}
            >
              {toggling === leader.id
                ? <Spinner />
                : isActive ? <PowerOff size={14} /> : <Power size={14} />}
            </button>

            {/* Edit */}
            <button
              onClick={() => onEdit(leader)}
              title="Chỉnh sửa"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all cursor-pointer"
            >
              <Pencil size={14} />
            </button>

            {/* Delete */}
            <button
              onClick={() => onDelete(leader)}
              title="Xóa hồ sơ"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-300 italic">—</span>
        )}
      </td>
    </tr>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Main page
// ══════════════════════════════════════════════════════════════════════════

export default function Leaders() {
  const isAdmin = useIsAdmin();

  const [keyword,  setKeyword]  = useState('');
  const [page,     setPage]     = useState(0);
  const [leaders,  setLeaders]  = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [toggling, setToggling] = useState(null);   // leader.id currently being toggled

  const [modal,  setModal]  = useState(null);       // null | 'create' | 'edit' | 'delete'
  const [target, setTarget] = useState(null);
  const [toast,  setToast]  = useState(null);

  const debounceRef = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────

  const fetchLeaders = useCallback(async (kw, pg) => {
    setLoading(true);
    try {
      const endpoint = kw.trim() ? '/leaders/search' : '/leaders';
      const params   = kw.trim()
        ? { keyword: kw.trim(), page: pg, size: PAGE_SIZE }
        : { page: pg, size: PAGE_SIZE };
      const { data } = await axiosClient.get(endpoint, { params });
      setLeaders(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
    } catch {
      showToast('error', 'Không thể tải danh sách Huynh Trưởng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchLeaders(keyword, page),
      keyword ? 400 : 0,
    );
    return () => clearTimeout(debounceRef.current);
  }, [keyword, page, fetchLeaders]);

  // ── Toggle status ────────────────────────────────────────────────────────

  async function handleToggleStatus(leader) {
    const newStatus = leader.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setToggling(leader.id);
    try {
      const payload = {
        leaderCode:    leader.leaderCode,
        christianName: leader.christianName ?? null,
        fullName:      leader.fullName,
        dateOfBirth:   leader.dateOfBirth,
        gender:        leader.gender,
        phoneNumber:   leader.phoneNumber ?? null,
        email:         leader.email       ?? null,
        level:         leader.level,
        status:        newStatus,
        position:      leader.position,
      };
      await axiosClient.put(`/leaders/${leader.id}`, payload);
      const verb = newStatus === 'ACTIVE' ? 'Kích hoạt' : 'Tạm khóa';
      showToast('success', `${verb} tài khoản "${leader.fullName}" thành công.`);
      fetchLeaders(keyword, page);
    } catch {
      showToast('error', 'Không thể thay đổi trạng thái. Vui lòng thử lại.');
    } finally {
      setToggling(null);
    }
  }

  // ── Modal helpers ────────────────────────────────────────────────────────

  function openCreate()         { setTarget(null);   setModal('create'); }
  function openEdit(l)          { setTarget(l);       setModal('edit');   }
  function openDelete(l)        { setTarget(l);       setModal('delete'); }
  function closeModal()         { setModal(null);     setTarget(null);   }
  function handleSuccess()      { closeModal(); fetchLeaders(keyword, page); }
  function showToast(type, msg) { setToast({ type, message: msg }); }

  function handleKeywordChange(value) {
    setKeyword(value);
    setPage(0);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Modals */}
      {(modal === 'create' || modal === 'edit') && (
        <LeaderFormModal
          mode={modal}
          leader={target}
          onClose={closeModal}
          onSuccess={handleSuccess}
          showToast={showToast}
        />
      )}
      {modal === 'delete' && target && (
        <DeleteLeaderModal
          leader={target}
          onClose={closeModal}
          onSuccess={handleSuccess}
          showToast={showToast}
        />
      )}

      {/* ── Header bar ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Huynh Trưởng</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalElements > 0
              ? `${totalElements} Huynh Trưởng trong Xứ đoàn`
              : 'Danh sách toàn bộ Huynh Trưởng và Dự Trưởng'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Add — admin only */}
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm whitespace-nowrap"
            >
              <Plus size={16} />
              Thêm Huynh Trưởng
            </button>
          )}
        </div>
      </div>

      {/* Admin notice for non-admins */}
      {!isAdmin && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <Shield size={15} className="shrink-0" />
          Bạn đang xem ở chế độ chỉ đọc. Chỉ Admin và Ban điều hành mới có thể chỉnh sửa.
        </div>
      )}

      {/* ── Table card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3.5 text-left w-12">STT</th>
                <th className="px-5 py-3.5 text-left">Họ và Tên</th>
                <th className="px-5 py-3.5 text-left">Liên lạc</th>
                <th className="px-5 py-3.5 text-left">Cấp bậc</th>
                <th className="px-5 py-3.5 text-left">Chức vụ</th>
                <th className="px-5 py-3.5 text-left">Trạng thái</th>
                <th className="px-5 py-3.5 text-left w-32">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                      <Spinner /> Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : leaders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-gray-400">
                    {keyword
                      ? `Không tìm thấy Huynh Trưởng nào với từ khóa "${keyword}".`
                      : 'Chưa có dữ liệu Huynh Trưởng.'}
                  </td>
                </tr>
              ) : (
                leaders.map((l, idx) => (
                  <LeaderRow
                    key={l.id}
                    index={page * PAGE_SIZE + idx + 1}
                    leader={l}
                    isAdmin={isAdmin}
                    onEdit={openEdit}
                    onDelete={openDelete}
                    onToggleStatus={handleToggleStatus}
                    toggling={toggling}
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
                <ChevronLeft size={14} /> Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Sau <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {!loading && leaders.length > 0 && isAdmin && (
        <p className="text-xs text-gray-400 text-center">
          Di chuột vào dòng để hiện nút thao tác · Icon nguồn để khóa/kích hoạt · Icon bút chì để sửa · Icon thùng rác để xóa
        </p>
      )}
    </div>
  );
}
