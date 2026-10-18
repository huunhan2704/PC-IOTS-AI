import React from 'react';
import { Cpu, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-slate-950 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Cột 1: Thông tin đề tài tốt nghiệp */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-slate-950 font-bold">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-base font-extrabold text-slate-100">
                ĐỒ ÁN TỐT NGHIỆP ĐẠI HỌC
              </span>
            </div>
            <p className="text-sm font-semibold text-sky-400 leading-relaxed">
              "ỨNG DỤNG IOTS VÀ AI VÀO HỆ THỐNG WEB BÁN LINH KIỆN MÁY TÍNH"
            </p>
            <div className="text-xs space-y-1.5 text-slate-400">
              <p>
                <strong className="text-slate-200">Sinh viên thực hiện:</strong> Trần Hữu Nhân
              </p>
              <p>
                <strong className="text-slate-200">Giảng viên hướng dẫn:</strong> ThS. Nguyễn Thanh Truyền
              </p>
              <p>
                <strong className="text-slate-200">Khoa / Trường:</strong> Khoa Công nghệ Thông tin - Trường Đại học Tài nguyên và Môi trường TP.HCM (HCMUNRE)
              </p>
            </div>
          </div>

          {/* Cột 2: Danh mục nhanh */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Phân Hệ Kỹ Thuật
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/pc-builder" className="hover:text-sky-400 transition flex items-center gap-1">
                  PC Builder Tương Thích BR01-BR06
                </Link>
              </li>
              <li>
                <Link to="/iot" className="hover:text-emerald-400 transition flex items-center gap-1">
                  Dashboard IoT Telemetry Realtime
                </Link>
              </li>
              <li>
                <Link to="/tu-van-ai" className="hover:text-indigo-400 transition flex items-center gap-1">
                  Trợ Lý AI Chuẩn Đoán Phần Cứng
                </Link>
              </li>
              <li>
                <Link to="/tra-cuu" className="hover:text-sky-400 transition flex items-center gap-1">
                  Tra Cứu Tiến Độ Đơn Hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Liên hệ & Hỗ trợ */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Thông Tin Liên Hệ
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                <span>236 Lê Văn Sỹ, Phường 1, Q. Tân Bình, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>0912 345 678</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>nhan.tran@student.hcmunre.edu.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Trần Hữu Nhân - HCMUNRE. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400">Spring Boot 3.2</span>
            <span>•</span>
            <span className="hover:text-slate-400">React 18 + Tailwind</span>
            <span>•</span>
            <span className="hover:text-slate-400">MQTT Mosquitto</span>
            <span>•</span>
            <span className="hover:text-slate-400">VietQR Napas 247</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
