import React, { useState, useEffect } from 'react';
import { Building2, Shield, QrCode, ClipboardList, LogIn, LogOut, Clock, Calendar } from 'lucide-react';

interface NavbarProps {
  currentView: 'guest' | 'admin';
  isAdminAuthenticated: boolean;
  onSelectView: (view: 'guest' | 'admin') => void;
  onOpenScanner: () => void;
  onOpenLogin: () => void;
  onLogoutAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  isAdminAuthenticated,
  onSelectView,
  onOpenScanner,
  onOpenLogin,
  onLogoutAdmin,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectView('guest')}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center shadow-md border border-blue-400/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white leading-tight">
                  GATEWAY
                </span>
                <span className="font-light text-base sm:text-lg tracking-wider text-blue-400 leading-tight">
                  PESANGGRAHAN
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 tracking-wide font-medium">
                BUKU TAMU DIGITAL · APARTEMEN
              </p>
            </div>
          </div>

          {/* Center Clock for Security Post (Desktop) */}
          <div className="hidden md:flex items-center gap-4 px-4 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{dateStr}</span>
            </div>
            <div className="w-px h-3.5 bg-slate-700"></div>
            <div className="flex items-center gap-1.5 font-mono font-bold text-blue-400">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{timeStr}</span>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Check-Out Scanner Button - ONLY visible to Admin/Security */}
            {currentView === 'admin' && (
              <button
                onClick={onOpenScanner}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
                title="Pindai QR Code Tiket Tamu untuk Verifikasi Check-Out"
              >
                <QrCode className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">Scan QR Tamu</span>
              </button>
            )}

            {/* Mode Switcher */}
            {currentView === 'admin' ? (
              <button
                onClick={() => onSelectView('guest')}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
              >
                <ClipboardList className="w-4 h-4 text-slate-400" />
                <span>Form Tamu</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (isAdminAuthenticated) {
                    onSelectView('admin');
                  } else {
                    onOpenLogin();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Pos Sekuriti</span>
              </button>
            )}

            {/* Admin Logout if logged in */}
            {isAdminAuthenticated && currentView === 'admin' && (
              <button
                onClick={onLogoutAdmin}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                title="Keluar dari Panel Admin"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
