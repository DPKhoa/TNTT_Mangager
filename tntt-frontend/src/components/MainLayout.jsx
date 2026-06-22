import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardCheck, Users, TrendingUp,
  GraduationCap, Shield, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/',           label: 'Dashboard',      icon: LayoutDashboard, end: true },
  { to: '/attendance', label: 'Điểm Danh',     icon: ClipboardCheck  },
  { to: '/students',   label: 'Thiếu Nhi',     icon: Users           },
  { to: '/progress',   label: 'Kết Quả',       icon: TrendingUp      },
  { to: '/classrooms', label: 'Lớp Học',        icon: GraduationCap   },
  { to: '/leaders',    label: 'Huynh Trưởng',  icon: Shield          },
];

const PAGE_TITLES = {
  '/':            'Dashboard',
  '/attendance':  'Điểm Danh',
  '/students':    'Danh sách Thiếu Nhi',
  '/progress':    'Kết Quả Học Tập',
  '/classrooms':  'Quản lý Lớp Học',
  '/leaders':     'Quản lý Huynh Trưởng',
};

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'TNTT Manager';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0">

        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xl font-black leading-none select-none">✝</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">TNTT Manager</p>
            <p className="text-xs text-gray-400 truncate">Xứ đoàn Cho Quan</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Menu chính
          </p>

          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={`shrink-0 ${isActive ? 'text-red-600' : 'text-gray-400'}`}
                  />
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <span className="text-red-700 text-xs font-bold">
                {user?.username?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.username}</p>
              <p className="text-xs text-gray-400">Huynh Trưởng</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-base font-semibold text-gray-900">{pageTitle}</h1>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-150 cursor-pointer"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </header>

        {/* Page content rendered by child routes */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
