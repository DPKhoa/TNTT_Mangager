import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, X, ChevronLeft, ChevronRight, Plus,
  Pencil, Trash2, AlertTriangle,
  User, Phone, Mail, MapPin, Calendar, BookOpen, Users,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

// ── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

const BRANCH_OPTIONS = [
  { value: 'INFANT',        label: 'Ấu nhi'     },
  { value: 'JUNIOR',        label: 'Thiếu nhi'  },
  { value: 'SENIOR',        label: 'Nghĩa sĩ'   },
  { value: 'ADVENTURER',    label: 'Hiệp sĩ'    },
  { value: 'SOLDIER',       label: 'Chiến sĩ'   },
  { value: 'JUNIOR_LEADER', label: 'Dự trưởng'  },
];

const GENDER_OPTIONS = [
  { value: 'MALE',   label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ'  },
];

const ORIGIN_OPTIONS = [
  { value: 'NEW_MEMBER',  label: 'Thành viên mới'        },
  { value: 'TRANSFERRED', label: 'Chuyển đến từ đoàn khác' },
  { value: 'RETURNING',   label: 'Tái gia nhập'           },
];

const BRANCH_LABEL  = Object.fromEntries(BRANCH_OPTIONS.map(({ value, label }) => [value, label]));
const GENDER_LABEL  = Object.fromEntries(GENDER_OPTIONS.map(({ value, label }) => [value, label]));
const ORIGIN_LABEL  = Object.fromEntries(ORIGIN_OPTIONS.map(({ value, label }) => [value, label]));

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
};

const STATUS_LABEL = {
  ACTIVE:   'Đang sinh hoạt',
  INACTIVE: 'Ngừng sinh hoạt',
};

const RELATIONSHIP_LABEL = {
  FATHER:         'Bố',
  MOTHER:         'Mẹ',
  GRANDPARENT:    'Ông / Bà',
  OTHER_GUARDIAN: 'Người giám hộ',
};

const SACRAMENT_CONFIG = {
  BAPTISM:          { label: 'Rửa Tội',             color: 'bg-blue-500',   dotColor: 'border-blue-500'   },
  FIRST_COMMUNION:  { label: 'Rước Lễ Lần Đầu',     color: 'bg-amber-400',  dotColor: 'border-amber-400'  },
  SOLEMN_COMMUNION: { label: 'Rước Lễ Trọng Thể',   color: 'bg-orange-500', dotColor: 'border-orange-500' },
  CONFIRMATION:     { label: 'Thêm Sức',             color: 'bg-red-500',    dotColor: 'border-red-500'    },
};

const EMPTY_FORM = {
  saintName:      '',
  fullName:       '',
  dateOfBirth:    '',
  gender:         '',
  branch:         '',
  address:        '',
  phoneNumber:    '',
  email:          '',
  origin:         '',
  enrollmentDate: '',
  notes:          '',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function memberToForm(m) {
  return {
    saintName:      m.saintName      ?? '',
    fullName:       m.fullName       ?? '',
    dateOfBirth:    m.dateOfBirth    ?? '',
    gender:         m.gender         ?? '',
    branch:         m.branch         ?? '',
    address:        m.address        ?? '',
    phoneNumber:    m.phoneNumber    ?? '',
    email:          m.email          ?? '',
    origin:         m.origin         ?? '',
    enrollmentDate: m.enrollmentDate ?? '',
    notes:          m.notes          ?? '',
  };
}

function buildPayload(form) {
  return {
    fullName:       form.fullName.trim(),
    saintName:      form.saintName.trim()   || null,
    dateOfBirth:    form.dateOfBirth        || null,
    gender:         form.gender             || null,
    branch:         form.branch             || null,
    address:        form.address.trim()     || null,
    phoneNumber:    form.phoneNumber.trim() || null,
    email:          form.email.trim()       || null,
    origin:         form.origin             || null,
    enrollmentDate: form.enrollmentDate     || null,
    notes:          form.notes.trim()       || null,
  };
}

function validateForm(form) {
  const errors = {};
  if (!form.fullName.trim())  errors.fullName    = 'Họ và tên không được để trống.';
  if (!form.dateOfBirth)      errors.dateOfBirth = 'Ngày sinh không được để trống.';
  if (!form.gender)           errors.gender      = 'Vui lòng chọn giới tính.';
  if (!form.branch)           errors.branch      = 'Vui lòng chọn ngành.';
  if (form.phoneNumber && !/^(0|\+84)[0-9]{9}$/.test(form.phoneNumber.trim())) {
    errors.phoneNumber = 'Số điện thoại không hợp lệ (VD: 0912345678).';
  }
  return errors;
}

// ── Shared input class builders ────────────────────────────────────────────

function inputCls(hasError) {
  return [
    'w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-800',
    'focus:outline-none focus:ring-2 focus:border-transparent transition-all',
    hasError
      ? 'border-red-300 focus:ring-red-400'
      : 'border-gray-200 focus:ring-red-500',
  ].join(' ');
}

// ── FormField wrapper ──────────────────────────────────────────────────────

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

// ── Spinner ────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ── InfoRow (for detail modal) ─────────────────────────────────────────────

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

// ── Backdrop wrapper ───────────────────────────────────────────────────────

function ModalBackdrop({ onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
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
// Modal 1: Create / Edit form
// ══════════════════════════════════════════════════════════════════════════

function MemberFormModal({ mode, member, onClose, onSuccess, showToast }) {
  const isEdit = mode === 'edit';
  const [form,       setForm]       = useState(isEdit ? memberToForm(member) : EMPTY_FORM);
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const payload = buildPayload(form);
      if (isEdit) {
        await axiosClient.put(`/members/${member.id}`, payload);
        showToast('success', `Đã cập nhật hồ sơ "${form.fullName.trim()}" thành công.`);
      } else {
        await axiosClient.post('/members', payload);
        showToast('success', `Đã thêm thiếu nhi "${form.fullName.trim()}" thành công.`);
      }
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      showToast('error', msg);
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
              {isEdit ? 'Chỉnh sửa hồ sơ' : 'Thêm thiếu nhi mới'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? `Đang sửa: ${member.fullName}` : 'Điền đầy đủ thông tin bên dưới'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Tên Thánh */}
            <FormField label="Tên Thánh" error={errors.saintName}>
              <input
                type="text"
                value={form.saintName}
                onChange={(e) => handleChange('saintName', e.target.value)}
                placeholder="VD: Maria, Gioan..."
                className={inputCls(!!errors.saintName)}
              />
            </FormField>

            {/* Họ và Tên */}
            <FormField label="Họ và Tên" required error={errors.fullName}>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Nguyễn Thị Lan"
                className={inputCls(!!errors.fullName)}
              />
            </FormField>

            {/* Ngày sinh */}
            <FormField label="Ngày sinh" required error={errors.dateOfBirth}>
              <input
                type="date"
                value={form.dateOfBirth}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                className={inputCls(!!errors.dateOfBirth)}
              />
            </FormField>

            {/* Giới tính */}
            <FormField label="Giới tính" required error={errors.gender}>
              <select
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className={inputCls(!!errors.gender)}
              >
                <option value="">-- Chọn giới tính --</option>
                {GENDER_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </FormField>

            {/* Ngành */}
            <FormField label="Ngành" required error={errors.branch}>
              <select
                value={form.branch}
                onChange={(e) => handleChange('branch', e.target.value)}
                className={inputCls(!!errors.branch)}
              >
                <option value="">-- Chọn ngành --</option>
                {BRANCH_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </FormField>

            {/* Ngày gia nhập */}
            <FormField label="Ngày gia nhập" error={errors.enrollmentDate}>
              <input
                type="date"
                value={form.enrollmentDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleChange('enrollmentDate', e.target.value)}
                className={inputCls(!!errors.enrollmentDate)}
              />
            </FormField>

            {/* Địa chỉ */}
            <FormField label="Địa chỉ" error={errors.address}>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Số nhà, đường, phường..."
                className={inputCls(!!errors.address)}
              />
            </FormField>

            {/* Điện thoại */}
            <FormField label="Điện thoại liên lạc" error={errors.phoneNumber}>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder="0912345678"
                className={inputCls(!!errors.phoneNumber)}
              />
            </FormField>

            {/* Email */}
            <FormField label="Email" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="ten@gmail.com"
                className={inputCls(!!errors.email)}
              />
            </FormField>

            {/* Nguồn gốc */}
            <FormField label="Nguồn gốc" error={errors.origin}>
              <select
                value={form.origin}
                onChange={(e) => handleChange('origin', e.target.value)}
                className={inputCls(!!errors.origin)}
              >
                <option value="">-- Chọn nguồn gốc --</option>
                {ORIGIN_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </FormField>

            {/* Ghi chú — full width */}
            <div className="sm:col-span-2">
              <FormField label="Ghi chú" error={errors.notes}>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Nhận xét đặc biệt, tình trạng sức khỏe..."
                  className={`${inputCls(!!errors.notes)} resize-none`}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.notes.length}/500</p>
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
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting && <Spinner />}
            {submitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm thiếu nhi'}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Modal 2: Delete confirmation
// ══════════════════════════════════════════════════════════════════════════

function DeleteConfirmModal({ member, onClose, onSuccess, showToast }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await axiosClient.delete(`/members/${member.id}`);
      showToast('success', `Đã xóa hồ sơ "${member.fullName}" thành công.`);
      onSuccess();
    } catch {
      showToast('error', 'Không thể xóa hồ sơ. Vui lòng thử lại.');
      setDeleting(false);
    }
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Body */}
        <div className="px-6 pt-6 pb-5 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={26} className="text-red-500" />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-2">Xóa hồ sơ thiếu nhi</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Bạn có chắc chắn muốn xóa hồ sơ của{' '}
            <span className="font-semibold text-gray-800">
              {member.saintName ? `${member.saintName} ` : ''}{member.fullName}
            </span>
            ?
            <br />
            <span className="text-red-500 font-medium">Hành động này không thể hoàn tác.</span>
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-all cursor-pointer"
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
// Modal 3: View Details (sacrament timeline)
// ══════════════════════════════════════════════════════════════════════════

function MemberDetailModal({ member, sacraments, loadingSacraments, onClose }) {
  const sorted = [...sacraments].sort(
    (a, b) => new Date(a.receivedDate) - new Date(b.receivedDate),
  );

  return (
    <ModalBackdrop onClose={onClose}>
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
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[member.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {STATUS_LABEL[member.status] ?? member.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Personal info */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Thông tin cá nhân</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon={Calendar} label="Ngày sinh"     value={formatDate(member.dateOfBirth)} />
              <InfoRow icon={User}     label="Giới tính"     value={GENDER_LABEL[member.gender] ?? member.gender} />
              <InfoRow icon={BookOpen} label="Nguồn gốc"     value={ORIGIN_LABEL[member.origin] ?? member.origin} />
              <InfoRow icon={Calendar} label="Ngày gia nhập" value={formatDate(member.enrollmentDate)} />
              <InfoRow icon={MapPin}   label="Địa chỉ"       value={member.address} />
              <InfoRow icon={Phone}    label="Điện thoại"    value={member.phoneNumber} />
              <InfoRow icon={Mail}     label="Email"         value={member.email} />
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
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Các Bí Tích đã nhận</p>
            {loadingSacraments ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                <Spinner /> Đang tải bí tích...
              </div>
            ) : sorted.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-2">Chưa có dữ liệu bí tích.</p>
            ) : (
              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" />
                <div className="space-y-4">
                  {sorted.map((s) => {
                    const cfg = SACRAMENT_CONFIG[s.sacramentType] ?? { label: s.sacramentType, color: 'bg-gray-400', dotColor: 'border-gray-400' };
                    return (
                      <div key={s.id} className="relative">
                        <div className={`absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2 bg-white ${cfg.dotColor}`} />
                        <div className="pl-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-xs text-gray-400">{formatDate(s.receivedDate)}</span>
                          </div>
                          <div className="text-xs text-gray-500 space-y-0.5">
                            {s.patronSaint && <p>Bổn mạng: <span className="text-gray-700">{s.patronSaint}</span></p>}
                            {s.celebrant   && <p>Linh mục ban: <span className="text-gray-700">{s.celebrant}</span></p>}
                            {s.place       && <p>Nơi nhận: <span className="text-gray-700">{s.place}</span></p>}
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
    </ModalBackdrop>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Table row
// ══════════════════════════════════════════════════════════════════════════

function MemberRow({ index, member, onView, onEdit, onDelete }) {
  return (
    <tr
      onClick={() => onView(member)}
      className="hover:bg-red-50/50 transition-colors cursor-pointer group"
    >
      {/* STT */}
      <td className="px-5 py-3.5 text-sm text-gray-400 tabular-nums w-12">{index}</td>

      {/* Name */}
      <td className="px-5 py-3.5">
        <p className="text-sm font-semibold text-gray-900 group-hover:text-red-700 transition-colors">
          {member.fullName}
        </p>
        {member.saintName && <p className="text-xs text-gray-400">{member.saintName}</p>}
      </td>

      {/* DOB */}
      <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(member.dateOfBirth)}</td>

      {/* Branch */}
      <td className="px-5 py-3.5">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${BRANCH_COLOR[member.branch] ?? 'bg-gray-100 text-gray-600'}`}>
          {BRANCH_LABEL[member.branch] ?? member.branch}
        </span>
      </td>

      {/* Status */}
      <td className="px-5 py-3.5">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[member.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {STATUS_LABEL[member.status] ?? member.status}
        </span>
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5 w-24">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(member); }}
            title="Chỉnh sửa"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all cursor-pointer"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(member); }}
            title="Xóa hồ sơ"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════════════════

export default function Students() {
  // List state
  const [keyword,       setKeyword]       = useState('');
  const [page,          setPage]          = useState(0);
  const [members,       setMembers]       = useState([]);
  const [totalPages,    setTotalPages]    = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading,       setLoading]       = useState(false);

  // Modal state — one active modal at a time
  const [modal,         setModal]         = useState(null);   // null | 'create' | 'edit' | 'delete' | 'view'
  const [targetMember,  setTargetMember]  = useState(null);
  const [sacraments,    setSacraments]    = useState([]);
  const [loadingSacr,   setLoadingSacr]   = useState(false);

  // Toast
  const [toast,         setToast]         = useState(null);
  const debounceRef = useRef(null);

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchMembers = useCallback(async (kw, pg) => {
    setLoading(true);
    try {
      const endpoint = kw.trim() ? '/members/search' : '/members';
      const params   = kw.trim()
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

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchMembers(keyword, page),
      keyword ? 400 : 0,
    );
    return () => clearTimeout(debounceRef.current);
  }, [keyword, page, fetchMembers]);

  // ── Modal openers ────────────────────────────────────────────────────────

  function openCreate() {
    setTargetMember(null);
    setModal('create');
  }

  function openEdit(member) {
    setTargetMember(member);
    setModal('edit');
  }

  function openDelete(member) {
    setTargetMember(member);
    setModal('delete');
  }

  async function openView(member) {
    setTargetMember(member);
    setSacraments([]);
    setLoadingSacr(true);
    setModal('view');
    try {
      const { data } = await axiosClient.get('/sacraments', { params: { studentId: member.id } });
      setSacraments(data ?? []);
    } catch { /* silent */ } finally {
      setLoadingSacr(false);
    }
  }

  function closeModal() { setModal(null); setTargetMember(null); }

  // ── After successful mutation ────────────────────────────────────────────

  function handleMutationSuccess() {
    closeModal();
    fetchMembers(keyword, page);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  function handleKeywordChange(value) {
    setKeyword(value);
    setPage(0);
  }

  function showToast(type, message) { setToast({ type, message }); }
  function closeToast()             { setToast(null); }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={closeToast} />}

      {/* Modals */}
      {(modal === 'create' || modal === 'edit') && (
        <MemberFormModal
          mode={modal}
          member={targetMember}
          onClose={closeModal}
          onSuccess={handleMutationSuccess}
          showToast={showToast}
        />
      )}
      {modal === 'delete' && targetMember && (
        <DeleteConfirmModal
          member={targetMember}
          onClose={closeModal}
          onSuccess={handleMutationSuccess}
          showToast={showToast}
        />
      )}
      {modal === 'view' && targetMember && (
        <MemberDetailModal
          member={targetMember}
          sacraments={sacraments}
          loadingSacraments={loadingSacr}
          onClose={closeModal}
        />
      )}

      {/* ── Header bar ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách Thiếu Nhi</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalElements > 0
              ? `${totalElements} thiếu nhi được tìm thấy`
              : 'Quản lý hồ sơ thiếu nhi trong xứ đoàn'}
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

          {/* Add button */}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm whitespace-nowrap"
          >
            <Plus size={16} />
            Thêm thiếu nhi
          </button>
        </div>
      </div>

      {/* ── Table card ────────────────────────────────────────────────── */}
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
                <th className="px-5 py-3.5 text-left w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                      <Spinner /> Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-gray-400">
                    {keyword
                      ? `Không tìm thấy thiếu nhi nào với từ khóa "${keyword}".`
                      : 'Chưa có dữ liệu thiếu nhi. Hãy thêm mới để bắt đầu.'}
                  </td>
                </tr>
              ) : (
                members.map((m, idx) => (
                  <MemberRow
                    key={m.id}
                    index={page * PAGE_SIZE + idx + 1}
                    member={m}
                    onView={openView}
                    onEdit={openEdit}
                    onDelete={openDelete}
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

      <p className="text-xs text-gray-400 text-center">
        Click vào dòng để xem chi tiết · Icon bút chì để chỉnh sửa · Icon thùng rác để xóa
      </p>
    </div>
  );
}
