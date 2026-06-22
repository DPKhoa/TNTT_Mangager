import { useState, useEffect } from 'react';
import {
  Users, Shield, Home, CheckCircle2,
  TrendingDown, AlertTriangle, RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

// ── Constants ──────────────────────────────────────────────────────────────

const BRANCH_COLORS = {
  INFANT:        '#f472b6',
  JUNIOR:        '#60a5fa',
  SENIOR:        '#a78bfa',
  ADVENTURER:    '#fbbf24',
  SOLDIER:       '#f87171',
  JUNIOR_LEADER: '#34d399',
};

const STAT_CARDS = [
  {
    key:     'totalStudents',
    label:   'Tổng Thiếu Nhi',
    icon:    Users,
    bg:      'bg-blue-50',
    iconCls: 'text-blue-500',
    trend:   'Đang sinh hoạt',
  },
  {
    key:     'activeLeaders',
    label:   'Huynh Trưởng',
    icon:    Shield,
    bg:      'bg-purple-50',
    iconCls: 'text-purple-500',
    trend:   'Đang hoạt động',
  },
  {
    key:     'totalClassrooms',
    label:   'Lớp Học',
    icon:    Home,
    bg:      'bg-amber-50',
    iconCls: 'text-amber-500',
    trend:   'Toàn xứ đoàn',
  },
  {
    key:     'weeklyAttendanceRate',
    label:   'Chuyên Cần Tuần Này',
    icon:    CheckCircle2,
    bg:      'bg-green-50',
    iconCls: 'text-green-500',
    suffix:  '%',
    trend:   '7 ngày gần nhất',
  },
];

// ── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-9 w-20 mb-1" />
      <Skeleton className="h-3 w-24 mt-2" />
    </div>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────

function AttendanceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">Tuần {label}</p>
      <p className="text-red-600">
        Chuyên cần: <span className="font-bold">{payload[0]?.value}%</span>
      </p>
      <p className="text-gray-400 text-xs mt-1">
        {payload[0]?.payload?.present} / {payload[0]?.payload?.total} thiếu nhi
      </p>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700">{payload[0]?.name}</p>
      <p className="text-gray-600">
        <span className="font-bold">{payload[0]?.value}</span> thiếu nhi
      </p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosClient.get('/dashboard/stats');
      setStats(data);
    } catch {
      setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStats(); }, []);

  // Pie chart data — flatten branch colors into the data array
  const pieData = (stats?.branchDistribution ?? []).map((b) => ({
    name:  b.label,
    value: b.count,
    color: BRANCH_COLORS[b.branch] ?? '#9ca3af',
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Xin chào, <span className="font-semibold text-gray-700">{user?.username}</span> · Tổng quan hoạt động Xứ đoàn
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ── Summary Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : STAT_CARDS.map(({ key, label, icon: Icon, bg, iconCls, suffix, trend }) => {
              const raw   = stats?.[key] ?? 0;
              const value = typeof raw === 'number' && !Number.isInteger(raw)
                ? raw.toFixed(1)
                : raw;
              return (
                <div
                  key={key}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                      <Icon size={18} className={iconCls} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 tabular-nums">
                    {value}{suffix ?? ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-1.5">{trend}</p>
                </div>
              );
            })}
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Bar Chart — Attendance Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-800">Xu hướng Chuyên cần</p>
            <p className="text-xs text-gray-400 mt-0.5">Tỷ lệ có mặt qua 4 tuần gần nhất (%)</p>
          </div>

          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : (stats?.attendanceTrend ?? []).every((w) => w.total === 0) ? (
            <EmptyChart message="Chưa có dữ liệu điểm danh trong 4 tuần qua." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={stats?.attendanceTrend ?? []}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                barSize={32}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<AttendanceTooltip />} cursor={{ fill: '#fef2f2' }} />
                <Bar
                  dataKey="rate"
                  name="Chuyên cần"
                  fill="#dc2626"
                  radius={[6, 6, 0, 0]}
                  label={{
                    position: 'top',
                    fontSize: 11,
                    fill: '#6b7280',
                    formatter: (v) => v > 0 ? `${v}%` : '',
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart — Branch Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-800">Phân bổ theo Ngành</p>
            <p className="text-xs text-gray-400 mt-0.5">Số lượng thiếu nhi đang sinh hoạt theo từng ngành</p>
          </div>

          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : pieData.length === 0 ? (
            <EmptyChart message="Chưa có thiếu nhi nào được ghi nhận." />
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Custom legend */}
              <div className="flex-1 space-y-2">
                {pieData.map((entry) => {
                  const total = pieData.reduce((s, d) => s + d.value, 0);
                  const pct   = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-gray-600 flex-1 truncate">{entry.name}</span>
                      <span className="font-semibold text-gray-800 tabular-nums">{entry.value}</span>
                      <span className="text-gray-400 text-xs tabular-nums w-12 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── High Absence Alert Table ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <TrendingDown size={16} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Cảnh báo Vắng học</p>
            <p className="text-xs text-gray-400">Top 5 lớp có tỷ lệ vắng cao nhất tuần này</p>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-8 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (stats?.highAbsenceClasses ?? []).length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            <CheckCircle2 size={32} className="mx-auto mb-3 text-green-400 opacity-60" />
            Tuyệt vời! Không có lớp nào có tỷ lệ vắng đáng lo ngại tuần này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">Lớp học</th>
                  <th className="px-6 py-3 text-left">Năm học</th>
                  <th className="px-6 py-3 text-center">Vắng / Tổng</th>
                  <th className="px-6 py-3 text-left">Tỷ lệ vắng</th>
                  <th className="px-6 py-3 text-left">Mức độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(stats?.highAbsenceClasses ?? []).map((cls, i) => (
                  <AbsenceRow key={i} cls={cls} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// ── Helper sub-components ──────────────────────────────────────────────────

function EmptyChart({ message }) {
  return (
    <div className="h-56 flex items-center justify-center text-sm text-gray-400 italic">
      {message}
    </div>
  );
}

function AbsenceRow({ cls }) {
  const rate = cls.absenceRate;

  const severity =
    rate >= 30 ? { label: 'Nghiêm trọng', cls: 'bg-red-100 text-red-700 border-red-200'   } :
    rate >= 15 ? { label: 'Cần theo dõi', cls: 'bg-amber-100 text-amber-700 border-amber-200' } :
                 { label: 'Bình thường',  cls: 'bg-gray-100 text-gray-500 border-gray-200'   };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-3.5 font-semibold text-gray-900">{cls.classroomName}</td>
      <td className="px-6 py-3.5 text-gray-500">{cls.academicYear}</td>
      <td className="px-6 py-3.5 text-center tabular-nums text-gray-700">
        <span className="font-bold text-red-600">{cls.absentCount}</span>
        <span className="text-gray-400"> / {cls.totalCount}</span>
      </td>
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-2">
          {/* Progress bar */}
          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-red-400 transition-all"
              style={{ width: `${Math.min(rate, 100)}%` }}
            />
          </div>
          <span className="tabular-nums text-gray-700 font-medium text-xs">
            {rate.toFixed(1)}%
          </span>
        </div>
      </td>
      <td className="px-6 py-3.5">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${severity.cls}`}>
          {severity.label}
        </span>
      </td>
    </tr>
  );
}
