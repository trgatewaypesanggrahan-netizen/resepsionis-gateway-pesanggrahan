import React, { useState } from 'react';
import { lookupGuestTicket } from '../services/guestApi';
import { Guest } from '../types/guest';
import { VisitorTicketCard } from './VisitorTicketCard';
import { Search, Phone, CreditCard, AlertCircle, ArrowLeft, ShieldCheck, RefreshCw, QrCode } from 'lucide-react';

interface CheckMyTicketProps {
  onBackToForm: () => void;
}

export const CheckMyTicket: React.FC<CheckMyTicketProps> = ({ onBackToForm }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [foundGuest, setFoundGuest] = useState<Guest | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setErrorMsg('Silakan masukkan Nomor HP / WhatsApp atau Nomor Kartu Akses.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const guest = await lookupGuestTicket(query.trim());
      setFoundGuest(guest);
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Tiket tidak ditemukan. Pastikan nomor HP atau nomor kartu sesuai dengan data saat Check-In.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSearch = () => {
    setFoundGuest(null);
    setQuery('');
    setErrorMsg(null);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      
      {foundGuest ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleResetSearch}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cari Tiket Lain</span>
            </button>
            <span className="text-xs text-slate-500 font-medium">Tiket Ditemukan</span>
          </div>

          <VisitorTicketCard
            guest={foundGuest}
            onDone={onBackToForm}
            showBackAction={true}
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
          
          {/* Card Header */}
          <div className="bg-slate-900 text-white p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/30 border border-blue-500/40 rounded-2xl">
                <QrCode className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Cek Tiket & Barcode Saya</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tampilkan kembali QR Code Check-Out Anda jika layar sebelumnya tertutup
                </p>
              </div>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="p-6 sm:p-7 space-y-5">
            
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Pencarian Tidak Ditemukan</p>
                  <p className="mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Nomor Handphone / WhatsApp ATAU Nomor Kartu Visitor
              </label>
              
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Contoh: 081234567890 atau VIS-015"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Masukkan nomor telepon yang Anda daftarkan tadi, atau nomor kartu fisik yang diberikan pos keamanan.
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mencari Tiket Anda...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Tampilkan Barcode Check-Out Saya</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onBackToForm}
                className="w-full py-2.5 text-slate-600 hover:text-slate-900 text-xs font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                Kembali ke Formulir Check-In
              </button>
            </div>

            {/* Security Tip Box */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Butuh Bantuan Check-Out?
              </p>
              <p>
                Jika Anda lupa nomor HP atau kehilangan tiket, Anda tetap bisa langsung menuju <strong>Pos Sekuriti / Jaga</strong>. Petugas dapat memproses Check-Out secara manual dengan mengecek nama atau unit tujuan Anda.
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
