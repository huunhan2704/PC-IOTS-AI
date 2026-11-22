import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

function applyDomTheme(isDark: boolean) {
  if (typeof document === 'undefined') return;
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light-theme');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light-theme');
  }
}

// Mặc định khởi tạo giao diện Nền Trắng Sáng (Light Mode) ngay khi tải trang
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('light-theme');
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      toggleTheme: () => {
        const next = !get().isDark;
        applyDomTheme(next);
        set({ isDark: next });
      },
    }),
    {
      name: 'linhkien-theme-v3',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyDomTheme(state.isDark);
        } else {
          applyDomTheme(false);
        }
      },
    }
  )
);
