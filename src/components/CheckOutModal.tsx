import React, { useState, useRef } from 'react';
import { Guest } from '../types/guest';
import { SignaturePad, SignaturePadHandle } from './SignaturePad';
import { submitCheckOut } from '../services/guestApi';
import { LogOut, X, Clock, Building2, CreditCard, User, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CheckOutModalProps {
  guest: Guest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedGuest: Guest) => void;
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({
  guest,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const sigPadRef = useRef<SignaturePadHandle | null>(null);

  if (!isOpen || !guest) return null;

  // Calculate visit duration if checked in today
  const calculateDuration = () => {
    try {
      const parts = guest.jam_masuk.split(':');
      if (parts.length < 2) return '-';
      const checkInMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      let diff = currentMinutes - checkInMinutes;
      if (diff < 0) diff += 24 * 60; // overnight fallback

      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      if (hours === 0) return `${mins} Menit`;
      return `${hours} Jam ${mins} Menit`;
    } catch {
      return '-';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureData && (!sigPadRef.current || sigPadRef.current.isEmpty())) {
      setErrorMsg('Tanda tangan keluar wajib diisi sebelum menyelesaikan check-out.');
      return;
    }

    const ttd = signatureData || sigPadRef.current?.toDataURL() || '';
    if (!ttd) {
      setErrorMsg('Tanda tangan keluar tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const updated = await submitCheckOut(guest.id, {
        ttd_keluar: ttd,
        catatan: catatan.trim() || undefined,
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses check-out. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/30 border border-emerald-500/40 rounded-xl">
              <LogOut className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Konfirmasi Check-Out Tamu</h3>
              <p className="text-xs text-slate-400">Verifikasi Kepulangan & Tanda Tangan Keluar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          
          {guest.status === 'CHECKED_OUT' && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Tamu ini sudah tercatat Check-Out pada pukul {guest.jam_keluar || '-'}.</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Visitor Card Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">{guest.id}</span>
                <h4 className="text-base font-bold text-slate-900">{guest.nama_tamu}</h4>
                <p className="text-xs text-slate-500">{guest.no_tlp}</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                Unit {guest.unit_tujuan}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/80 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Kartu: <strong className="text-slate-800">{guest.nomor_kartu}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Identitas: <strong className="text-slate-800">{guest.identitas_yang_dititip || '-'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Masuk: <strong className="text-slate-800">{guest.jam_masuk}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Durasi: <strong className="text-emerald-700">{calculateDuration()}</strong></span>
              </div>
            </div>

            {/* Check-In Signature Preview */}
            {guest.ttd_masuk && (
              <div className="pt-2 border-t border-slate-200/80">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>Tanda Tangan Saat Masuk:</span>
                  <span className="text-slate-400 font-mono">{guest.tanggal}</span>
                </div>
                <div className="h-14 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-1 overflow-hidden">
                  <img
                    src={guest.ttd_masuk}
                    alt="TTD Masuk"
                    className="max-h-full max-w-full object-contain filter contrast-125"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Checklist Pos Jaga */}
          <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5 text-blue-800">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Pemeriksaan Pos Jaga Sekuriti:
            </p>
            <p className="text-[11px] text-blue-700">
              1. Pastikan kartu visitor ({guest.nomor_kartu}) telah dikembalikan ke pos jaga.
              <br />
              2. Kembalikan identitas tamu ({guest.identitas_yang_dititip || 'KTP'}).
            </p>
          </div>

          {/* Canvas Tanda Tangan Keluar */}
          <div className="space-y-1">
            <SignaturePad
              ref={sigPadRef}
              label="Tanda Tangan Keluar (Diverifikasi Petugas)"
              required={true}
              height={140}
              penColor="#0f172a"
              onChange={(data) => setSignatureData(data)}
            />
          </div>

          {/* Notes Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Catatan Check-Out (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Kartu dikembalikan lengkap, pekerjaan selesai rapi"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || guest.status === 'CHECKED_OUT'}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi Selesai & Keluar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
