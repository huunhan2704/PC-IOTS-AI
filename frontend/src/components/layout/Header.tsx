import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Cpu,
  Search,
  ShoppingCart,
  User,
  Sun,
  Moon,
  LogOut,
  ShieldAlert,
  Activity,
  Sparkles,
  Package,
  Wrench,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useThemeStore } from '@/store/themeStore';
import { productService } from '@/services/productService';
import { useDebounce } from '@/hooks/useDebounce';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, canAccessAdminPanel, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { isDark, toggleTheme } = useThemeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchQuery, 250);

  useEffect(() => {
    if (debouncedSearch.trim().length >= 2) {
      productService
        .getSuggest(debouncedSearch.trim())
        .then((res) => {
          setSuggestions(res || []);
          setShowSuggest(true);
        })
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
      setShowSuggest(false);
    }
  }, [debouncedSearch]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggest(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggest(false);
      navigate(`/?keyword=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
              LinhKiện IoT·AI
            </span>
            <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              HCMUNRE Tech Store
            </span>
          </div>
        </Link>

        {/* Search Bar with Autocomplete */}
        <div ref={searchRef} className="relative flex-1 max-w-lg hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && setShowSuggest(true)}
              placeholder="Tìm CPU, VGA RTX 4070, RAM DDR5, Socket LGA1700..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggest && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                Gợi ý linh kiện
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                {suggestions.map((item) => (
                  <Link
                    key={item.id}
                    to={`/san-pham/${item.slug}`}
                    onClick={() => setShowSuggest(false)}
                    className="flex items-center gap-3 p-2.5 hover:bg-slate-800/60 transition group"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded-lg bg-slate-800 border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-sky-400">
                        {item.name}
                      </p>
                      <p className="text-xs font-bold text-rose-400">
                        {new Intl.NumberFormat('vi-VN').format(item.price)}₫
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex items-center gap-2">
          {/* PC Builder Quick Link */}
          <Link
            to="/pc-builder"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition"
          >
            <Wrench className="w-3.5 h-3.5" />
            PC Builder
          </Link>

          {/* IoT Dashboard Quick Link */}
          <Link
            to="/iot"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
          >
            <Activity className="w-3.5 h-3.5" />
            IoT Live
          </Link>

          {/* AI Advisor Quick Link */}
          <Link
            to="/tu-van-ai"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Tư Vấn AI
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Đổi giao diện Sáng / Tối"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Cart Icon with Badge */}
          <Link
            to="/gio-hang"
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Giỏ hàng"
          >
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950 animate-in zoom-in-50">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          {/* User Account Menu */}
          <div ref={userMenuRef} className="relative">
            {isAuthenticated() ? (
              <div>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-medium text-slate-200 hidden lg:inline max-w-[120px] truncate">
                    {user?.fullName}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs font-bold text-slate-100">{user?.fullName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/don-hang"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Package className="w-4 h-4 text-sky-400" />
                      Đơn hàng của tôi
                    </Link>

                    <Link
                      to="/iot"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Thiết bị IoT của tôi
                    </Link>

                    <Link
                      to="/tu-van-ai"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Chuẩn đoán & Tư vấn AI
                    </Link>

                    {canAccessAdminPanel() && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/10 transition border-t border-slate-800"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        {user?.role === 'ROLE_ADMIN'
                          ? 'Quản trị hệ thống (Admin)'
                          : user?.role === 'ROLE_WAREHOUSE'
                          ? 'Quản lý Kho & Đơn hàng'
                          : 'Quản lý Thiết bị IoT'}
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition border-t border-slate-800"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/dang-nhap"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/dang-ky"
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sm transition"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
