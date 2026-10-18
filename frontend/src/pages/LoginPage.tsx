import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, Cpu, KeyRound, User, Sparkles } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const loginStore = useAuthStore((s) => s.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.warning('Vui lòng nhập tên tài khoản và mật khẩu');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.login({
        username: username.trim(),
        password: password.trim(),
      });
      loginStore(res.token, res.user);
      toast.success(`Chào mừng trở lại, ${res.user.fullName}!`);
      navigate(redirect);
    } catch (err: any) {
      // handled by axios interceptor
    } finally {
      setIsLoading(false);
    }
  };

  const fillAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/10">
          <Cpu className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-100 uppercase tracking-tight">
          Đăng Nhập Tài Khoản
        </h1>
        <p className="text-xs text-slate-400">
          Truy cập hệ thống bán linh kiện máy tính tích hợp IoT & AI
        </p>
      </div>

      {/* Quick Fill Demo Chips */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Tài Khoản Thử Nghiệm Nhanh:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fillAccount('admin', 'admin123')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 hover:text-white hover:border-sky-500 transition text-[11px]"
          >
            👑 Admin (admin/admin123)
          </button>
          <button
            type="button"
            onClick={() => fillAccount('nhan', '123456')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 hover:text-white hover:border-sky-500 transition text-[11px]"
          >
            👤 Trần Hữu Nhân (nhan/123456)
          </button>
          <button
            type="button"
            onClick={() => fillAccount('tech', 'tech123')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 hover:text-white hover:border-sky-500 transition text-[11px]"
          >
            🔧 Kỹ Thuật (tech/tech123)
          </button>
        </div>
      </div>

      <form onSubmit={handleLogin} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <Input
          label="Tên đăng nhập hoặc Email *"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin hoặc email..."
          required
        />

        <Input
          label="Mật khẩu *"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu..."
          required
        />

        <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
          <LogIn className="w-4 h-4 mr-1.5" />
          Đăng Nhập
        </Button>

        <div className="text-center text-xs text-slate-400 pt-3 border-t border-slate-800">
          Chưa có tài khoản?{' '}
          <Link to="/dang-ky" className="font-bold text-sky-400 hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </form>
    </div>
  );
};
