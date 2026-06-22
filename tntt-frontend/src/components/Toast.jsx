import { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const CONFIG = {
  success: {
    Icon: CheckCircle2,
    wrapper: 'bg-green-50 border-green-200 text-green-800',
    icon: 'text-green-500',
  },
  error: {
    Icon: XCircle,
    wrapper: 'bg-red-50 border-red-200 text-red-800',
    icon: 'text-red-500',
  },
};

const AUTO_DISMISS_MS = 3500;

export default function Toast({ type, message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onClose]);

  const { Icon, wrapper, icon } = CONFIG[type] ?? CONFIG.success;

  return (
    <div className="fixed top-5 right-5 z-50">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${wrapper}`}>
        <Icon size={18} className={`shrink-0 ${icon}`} />
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="shrink-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Đóng thông báo"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
