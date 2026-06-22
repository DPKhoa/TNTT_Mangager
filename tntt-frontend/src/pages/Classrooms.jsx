import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, AlertTriangle, X,
  BookOpen, RefreshCw, GraduationCap,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

// ── Constants ──────────────────────────────────────────────────────────────

const BRANCH_OPTIONS = [
  { value: 'INFANT',        label: 'Ấu nhi'    },
  { value: 'JUNIOR',        label: 'Thiếu nhi' },
  { value: 'SENIOR',        label: 'Nghĩa sĩ'  },
  { value: 'ADVENTURER',    label: 'Hiệp sĩ'   },
  { value: 'SOLDIER',       label: 'Chiến sĩ'  },
  { value: 'JUNIOR_LEADER', label: 'Dự trưởng' },
];

const BRANCH_LABEL = Object.fromEntries(BRANCH_OPTIONS.map(({ value, label }) => [value, label]));

const BRANCH_STYLE = {
  INFANT:        { badge: 'bg-pink-100 text-pink-700',      bar: 'bg-pink-500'    },
  JUNIOR:        { badge: 'bg-blue-100 text-blue-700',      bar: 'bg-blue-500'    },
  SENIOR:        { badge: 'bg-purple-100 text-purple-700',  bar: 'bg-purple-500'  },
  ADVENTURER:    { badge: 'bg-amber-100 text-amber-700',    bar: 'bg-amber-500'   },
  SOLDIER:       { badge: 'bg-red-100 text-red-700',        bar: 'bg-red-500'     },
  JUNIOR_LEADER: { badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
};

const EMPTY_FORM = { className: '', academicYear: '', division: '' };

// ── Helpers ────────────────────────────────────────────────────────────────

function getCurrentAcademicYear() {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function getAcademicYearOptions() {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;
  const base  = month >= 8 ? year : year - 1;
  return Array.from({ length: 5 }, (_, i) => {
    const y = base - 2 + i;
    return `${y}-${y + 1}`;
  });
}

function inputCls(hasError) {
  return [
    'w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-800',
    'focus:outline-none focus:ring-2 focus:border-transparent transition-all',
    hasError ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-red-500',
  ].join(' ');
}

function Spinner({ size = 'sm' }) {
  const s = size === 'sm' ? 'h-4 w-4' : 'h-8 w-8';
  return (
    <svg className={`animate-spin ${s} shrink-0`} viewBox="0 0 24 24" fill="none">
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
// Create / Edit modal
// ══════════════════════════════════════════════════════════════════════════

function ClassroomFormModal({ mode, classroom, defaultYear, onClose, onSuccess, showToast }) {
  const isEdit = mode === 'edit';

  const [form, setForm] = useState(
    isEdit
      ? { className: classroom.className, academicYear: classroom.academicYear, division: classroom.division }
      : { ...EMPTY_FORM, academicYear: defaultYear },
  );
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  function change(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.className.trim())    e.className    = 'Tên lớp không được để trống.';
    if (!form.academicYear.trim()) e.academicYear = 'Năm học không được để trống.';
    if (!/^\d{4}-\d{4}$/.test(form.academicYear.trim())) e.academicYear = 'Định dạng: YYYY-YYYY (VD: 2025-2026).';
    if (!form.division)            e.division     = 'Vui lòng chọn ngành.';
    return e;
  }

  async function submit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const payload = { className: form.className.trim(), academicYear: form.academicYear.trim(), division: form.division };
      if (isEdit) {
        await axiosClient.put(`/classrooms/${classroom.id}`, payload);
        showToast('success', `Đã cập nhật lớp "${form.className.trim()}" thành công.`);
      } else {
        await axiosClient.post('/classrooms', payload);
        showToast('success', `Đã tạo lớp "${form.className.trim()}" thành công.`);
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {isEdit ? 'Chỉnh sửa lớp học' : 'Tạo lớp học mới'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? `Đang sửa: ${classroom.className}` : 'Điền thông tin lớp bên dưới'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <FormField label="Tên lớp" required error={errors.className}>
            <input
              type="text"
              value={form.className}
              onChange={(e) => change('className', e.target.value)}
              placeholder="VD: Ấu 1A, Thiếu 2B..."
              className={inputCls(!!errors.className)}
            />
          </FormField>

          <FormField label="Năm học" required error={errors.academicYear}>
            <select
              value={form.academicYear}
              onChange={(e) => change('academicYear', e.target.value)}
              className={inputCls(!!errors.academicYear)}
            >
              <option value="">-- Chọn năm học --</option>
              {getAcademicYearOptions().map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Ngành phụ trách" required error={errors.division}>
            <select
              value={form.division}
              onChange={(e) => change('division', e.target.value)}
              className={inputCls(!!errors.division)}
            >
              <option value="">-- Chọn ngành --</option>
              {BRANCH_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </FormField>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
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
            {submitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo lớp học'}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Delete confirm modal
// ══════════════════════════════════════════════════════════════════════════

function DeleteClassroomModal({ classroom, onClose, onSuccess, showToast }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await axiosClient.delete(`/classrooms/${classroom.id}`);
      showToast('success', `Đã xóa lớp "${classroom.className}" thành công.`);
      onSuccess();
    } catch {
      showToast('error', 'Không thể xóa lớp học. Vui lòng thử lại.');
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
          <h2 className="text-base font-bold text-gray-900 mb-2">Xóa lớp học</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Bạn có chắc muốn xóa lớp{' '}
            <span className="font-semibold text-gray-800">"{classroom.className}"</span>?
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
            {deleting ? 'Đang xóa...' : 'Xóa lớp'}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Classroom Card
// ══════════════════════════════════════════════════════════════════════════

function ClassroomCard({ classroom, onEdit, onDelete }) {
  const style = BRANCH_STYLE[classroom.division] ?? { badge: 'bg-gray-100 text-gray-600', bar: 'bg-gray-400' };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      {/* Colored top bar */}
      <div className={`h-1.5 w-full ${style.bar}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate">{classroom.className}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Năm học: {classroom.academicYear}</p>
          </div>
          {/* Action buttons — visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => onEdit(classroom)}
              title="Chỉnh sửa"
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all cursor-pointer"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(classroom)}
              title="Xóa lớp"
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Division badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.badge}`}>
            {BRANCH_LABEL[classroom.division] ?? classroom.division}
          </span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Main page
// ══════════════════════════════════════════════════════════════════════════

export default function Classrooms() {
  const [year,       setYear]       = useState(getCurrentAcademicYear);
  const [classrooms, setClassrooms] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [modal,      setModal]      = useState(null);   // null | 'create' | 'edit' | 'delete'
  const [target,     setTarget]     = useState(null);
  const [toast,      setToast]      = useState(null);

  const fetchClassrooms = useCallback(async (y) => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get('/classrooms', { params: { year: y } });
      setClassrooms(data ?? []);
    } catch {
      showToast('error', 'Không thể tải danh sách lớp học.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClassrooms(year); }, [year, fetchClassrooms]);

  function openCreate()         { setTarget(null); setModal('create'); }
  function openEdit(cls)        { setTarget(cls);  setModal('edit');   }
  function openDelete(cls)      { setTarget(cls);  setModal('delete'); }
  function closeModal()         { setModal(null);  setTarget(null);   }
  function handleSuccess()      { closeModal(); fetchClassrooms(year); }
  function showToast(type, msg) { setToast({ type, message: msg }); }

  // Group classrooms by division for display
  const grouped = BRANCH_OPTIONS
    .map(({ value }) => ({
      division:   value,
      items:      classrooms.filter((c) => c.division === value),
    }))
    .filter(({ items }) => items.length > 0);

  const yearOpts = getAcademicYearOptions();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Modals */}
      {(modal === 'create' || modal === 'edit') && (
        <ClassroomFormModal
          mode={modal}
          classroom={target}
          defaultYear={year}
          onClose={closeModal}
          onSuccess={handleSuccess}
          showToast={showToast}
        />
      )}
      {modal === 'delete' && target && (
        <DeleteClassroomModal
          classroom={target}
          onClose={closeModal}
          onSuccess={handleSuccess}
          showToast={showToast}
        />
      )}

      {/* ── Header bar ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Lớp Học</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {classrooms.length > 0
              ? `${classrooms.length} lớp trong năm học ${year}`
              : `Năm học ${year}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Year selector */}
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all cursor-pointer"
          >
            {yearOpts.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <button
            onClick={() => fetchClassrooms(year)}
            disabled={loading}
            title="Làm mới"
            className="w-10 h-10 flex items-center justify-center border border-gray-200 hover:border-gray-300 rounded-xl text-gray-500 hover:text-gray-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm whitespace-nowrap"
          >
            <Plus size={16} />
            Thêm lớp học
          </button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-24 text-gray-400">
          <Spinner size="lg" /> <span className="text-sm">Đang tải danh sách lớp...</span>
        </div>

      ) : classrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <GraduationCap size={28} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500 mb-1">Chưa có lớp học nào</p>
          <p className="text-xs text-gray-400 mb-4">Năm học {year} chưa có dữ liệu lớp học.</p>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Plus size={15} /> Tạo lớp đầu tiên
          </button>
        </div>

      ) : (
        <div className="space-y-6">
          {grouped.map(({ division, items }) => (
            <div key={division}>
              {/* Branch section header */}
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ngành {BRANCH_LABEL[division]} — {items.length} lớp
                </span>
                <div className="flex-1 h-px bg-gray-100 ml-2" />
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((cls) => (
                  <ClassroomCard
                    key={cls.id}
                    classroom={cls}
                    onEdit={openEdit}
                    onDelete={openDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && classrooms.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Di chuột vào thẻ lớp học để hiện nút chỉnh sửa / xóa.
        </p>
      )}
    </div>
  );
}
