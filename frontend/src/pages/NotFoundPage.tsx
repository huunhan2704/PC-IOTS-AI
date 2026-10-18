import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-24 text-center max-w-md mx-auto space-y-4">
      <h1 className="text-6xl font-black text-sky-400 font-mono">404</h1>
      <h2 className="text-xl font-bold text-slate-100">Trang không tồn tại</h2>
      <p className="text-xs text-slate-400">
        Đường dẫn bạn yêu cầu không tìm thấy hoặc đã được di chuyển.
      </p>
      <Link to="/" className="inline-block pt-2">
        <Button variant="primary">
          <Home className="w-4 h-4 mr-1.5" />
          Về Trang Chủ
        </Button>
      </Link>
    </div>
  );
};
