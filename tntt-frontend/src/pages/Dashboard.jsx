import { Users, ClipboardCheck, TrendingUp, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STAT_CARDS = [
  { label: 'Tổng Thiếu Nhi',    value: '—', icon: Users,          color: 'blue'  },
  { label: 'Buổi Điểm Danh',    value: '—', icon: ClipboardCheck, color: 'green' },
  { label: 'Lớp Học',           value: '—', icon: BookOpen,       color: 'amber' },
  { label: 'Kết Quả Cập Nhật',  value: '—', icon: TrendingUp,     color: 'red'   },
];

const COLOR_MAP = {
  blue:  { bg: 'bg-blue-50',  icon: 'text-blue-500'  },
  green: { bg: 'bg-green-50', icon: 'text-green-500' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-500' },
  red:   { bg: 'bg-red-50',   icon: 'text-red-500'   },
};

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl px-8 py-6 text-white">
        <p className="text-red-200 text-sm mb-1">Chào mừng trở lại,</p>
        <h2 className="text-2xl font-bold">{user?.username} 👋</h2>
        <p className="text-red-100 text-sm mt-2">
          Hệ thống Quản lý Xứ đoàn — <span className="font-semibold text-yellow-300">Sống Tin Mừng</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => {
          const { bg, icon } = COLOR_MAP[color];
          return (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={18} className={icon} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
            </div>
          );
        })}
      </div>

      {/* Placeholder content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <ClipboardCheck size={24} className="text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Welcome to TNTT Cho Quan Dashboard
        </h3>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          Chọn một chức năng từ menu bên trái để bắt đầu quản lý Xứ đoàn.
        </p>
      </div>
    </div>
  );
}
