import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { VisitorPortal } from './components/VisitorPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { VisitorPassModal } from './components/VisitorPassModal';
import { QRScannerModal } from './components/QRScannerModal';
import { CheckOutModal } from './components/CheckOutModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Guest } from './types/guest';
import { CheckCircle2, ShieldCheck, PhoneCall, MapPin, Building, QrCode } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'guest' | 'admin'>('guest');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Modals state
  const [activeVisitorPass, setActiveVisitorPass] = useState<Guest | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeCheckOutGuest, setActiveCheckOutGuest] = useState<Guest | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Success Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleCheckInSuccess = (guest: Guest) => {
    showToast(`Check-In berhasil! Tiket kunjungan untuk ${guest.nama_tamu} telah dibuat.`);
  };

  const handleScanSuccess = (guest: Guest) => {
    // Open Checkout modal for this guest
    setActiveCheckOutGuest(guest);
  };

  const handleCheckOutSuccess = (updatedGuest: Guest) => {
    showToast(`Check-Out berhasil! Tamu ${updatedGuest.nama_tamu} tercatat keluar pada ${updatedGuest.jam_keluar} WIB.`);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-100 flex-1">{toastMessage}</p>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <Navbar
        currentView={currentView}
        isAdminAuthenticated={isAdminAuthenticated}
        onSelectView={(view) => {
          if (view === 'admin' && !isAdminAuthenticated) {
            setIsLoginOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogoutAdmin={() => {
          setIsAdminAuthenticated(false);
          setCurrentView('guest');
          showToast('Anda telah logout dari panel keamanan.');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'guest' ? (
          <VisitorPortal
            onCheckInSuccess={handleCheckInSuccess}
          />
        ) : (
          <AdminDashboard
            onOpenCheckOutModal={(guest) => setActiveCheckOutGuest(guest)}
            onOpenVisitorPass={(guest) => setActiveVisitorPass(guest)}
            onOpenNewCheckIn={() => setCurrentView('guest')}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-sm mb-2">
                <Building className="w-4 h-4 text-blue-400" />
                <span>APARTEMEN GATEWAY PESANGGRAHAN</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Gateway Pesanggrahan Jl. Ciledug Raya No.15, Petukangan Selatan, Pesanggrahan, Kota Jakarta Selatan, DKI Jakarta, ID 12270
              </p>
            </div>

            <div>
              <p className="text-white font-semibold text-xs mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Keamanan & Informasi Gedung</span>
              </p>
              <ul className="space-y-1 text-[11px] text-slate-400">
                <li>• Pos Satpam Lobby Utama: 24 Jam</li>
                <li>• Pengambilan & Pengembalian Kartu Akses Lift di Resepsionis Lobby C</li>
                <li>• Seluruh Tamu & Vendor Wajib Membawa Tanda Identitas Sah</li>
              </ul>
            </div>

            <div>
              <p className="text-white font-semibold text-xs mb-2 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                <span>Kontak Pos Jaga & Darurat</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Hotline Security 24 Jam: <strong className="text-slate-200">(021) 7388-4695</strong> <br />
				Whatsapp Komplain 24 Jam: <strong className="text-slate-200">0878-9611-1138</strong>
              </p>
              <div className="mt-2.5">
                <button
                  onClick={() => {
                    if (isAdminAuthenticated) {
                      setCurrentView('admin');
                    } else {
                      setIsLoginOpen(true);
                    }
                  }}
                  className="text-blue-400 hover:text-blue-300 underline text-[11px]"
                >
                  {isAdminAuthenticated ? 'Buka Dashboard Petugas Keamanan' : 'Login Khusus Petugas Pos Jaga'}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <span>© {new Date().getFullYear()} Apartemen Gateway Pesanggrahan. Buku Tamu Digital & Visitor Management System.</span>
            <span className="font-mono text-slate-400">v2.4.0 · Modern Full-Stack Ready</span>
          </div>
        </div>
      </footer>

      {/* Visitor Pass (QR Code Ticket) Modal */}
      {activeVisitorPass && (
        <VisitorPassModal
          guest={activeVisitorPass}
          onClose={() => setActiveVisitorPass(null)}
        />
      )}

      {/* QR Code Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Check-Out Confirmation Modal */}
      <CheckOutModal
        guest={activeCheckOutGuest}
        isOpen={!!activeCheckOutGuest}
        onClose={() => setActiveCheckOutGuest(null)}
        onSuccess={handleCheckOutSuccess}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={() => {
          setIsAdminAuthenticated(true);
          setCurrentView('admin');
          showToast('Login berhasil sebagai Petugas Keamanan Gateway Pesanggrahan.');
        }}
      />
    </div>
  );
}
