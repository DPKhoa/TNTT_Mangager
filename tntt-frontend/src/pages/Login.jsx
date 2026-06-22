import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data } = await axiosClient.post('/auth/login', {
        username: formData.username,
        password: formData.password,
      });
      login(data.accessToken);
      navigate('/', { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Tên đăng nhập hoặc mật khẩu không chính xác.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex">

        {/* ── Panel trái: Thương hiệu (chỉ hiện trên màn hình lớn) ── */}
        <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-red-600 to-red-900 flex-col items-center justify-center p-12 relative overflow-hidden">

          {/* Vòng trang trí nền */}
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white opacity-5" />
          <div className="absolute -bottom-20 -right-10 w-80 h-80 rounded-full bg-white opacity-5" />
          <div className="absolute top-1/2 left-0 w-32 h-32 rounded-full bg-yellow-400 opacity-10 -translate-y-1/2 -translate-x-1/2" />

          {/* Biểu tượng thánh giá */}
          <div className="relative w-24 h-24 rounded-full bg-yellow-400 flex items-center justify-center mb-8 shadow-2xl ring-4 ring-yellow-300/40">
            <span className="text-red-800 text-5xl font-black select-none">✝</span>
          </div>

          <h1 className="text-white text-4xl font-black tracking-tight mb-2 text-center">
            TNTT Manager
          </h1>
          <p className="text-red-200 text-base text-center mb-8">
            Hệ thống Quản lý Xứ đoàn
          </p>

          <div className="w-12 h-1 bg-yellow-400 rounded-full mb-8" />

          <p className="text-red-100 text-sm text-center italic leading-relaxed">
            "Sống Tin Mừng<br />phục vụ Thiếu Nhi"
          </p>
        </div>

        {/* ── Panel phải: Form đăng nhập ── */}
        <div className="w-full lg:w-7/12 flex flex-col justify-center px-8 py-12 lg:px-14">

          {/* Header mobile (ẩn trên desktop) */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mb-4 shadow-lg">
              <span className="text-white text-3xl">✝</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">TNTT Manager</h1>
            <p className="text-gray-500 text-sm">Hệ thống Quản lý Xứ đoàn</p>
          </div>

          {/* Tiêu đề */}
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Đăng nhập</h2>
          <p className="text-gray-500 text-sm mb-8">
            Chào mừng trở lại! Vui lòng nhập thông tin để tiếp tục.
          </p>

          {/* Thông báo lỗi */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Trường: Tên đăng nhập */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Tên đăng nhập
              </label>
              <div className="relative">
                <User
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  placeholder="Nhập tên đăng nhập"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-300 transition-all duration-200"
                />
              </div>
            </div>

            {/* Trường: Mật khẩu */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-300 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Nút đăng nhập */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-red-300 text-white font-semibold py-3 rounded-xl transition-all duration-200 cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-red-100 mt-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Đăng nhập
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-gray-400">
            Thiếu Nhi Thánh Thể &nbsp;•&nbsp;
            <span className="text-yellow-500 font-semibold">Sống Tin Mừng</span>
          </p>
        </div>

      </div>
    </div>
  );
}
