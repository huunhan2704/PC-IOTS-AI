import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Cpu } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const loginStore = useAuthStore((s) => s.login);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim() || !email.trim() || !password.trim()) {
      toast.warning('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.register({
        username: username.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password: password.trim(),
      });
      loginStore(res.token, res.user);
      toast.success('Đăng ký tài khoản thành công!');
      navigate('/');
    } catch (err: any) {
      // handled by axios interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/10">
          <Cpu className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-100 uppercase tracking-tight">
          Đăng Ký Tài Khoản Mới
        </h1>
        <p className="text-xs text-slate-400">
          Tạo tài khoản để quản lý thiết bị IoT và trải nghiệm tính năng PC Builder
        </p>
      </div>

      <form onSubmit={handleRegister} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <Input
          label="Tên đăng nhập *"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="nhan123"
          required
        />

        <Input
          label="Họ và tên *"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Trần Hữu Nhân"
          required
        />

        <Input
          label="Email *"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nhan.tran@example.com"
          required
        />

        <Input
          label="Số điện thoại"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0912345678"
        />

        <Input
          label="Mật khẩu *"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Tối thiểu 6 ký tự"
          required
        />

        <Input
          label="Xác nhận mật khẩu *"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Nhập lại mật khẩu..."
          required
        />

        <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
          <UserPlus className="w-4 h-4 mr-1.5" />
          Đăng Ký
        </Button>

        <div className="text-center text-xs text-slate-400 pt-3 border-t border-slate-800">
          Đã có tài khoản?{' '}
          <Link to="/dang-nhap" className="font-bold text-sky-400 hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </form>
    </div>
  );
};
