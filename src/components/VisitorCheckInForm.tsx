import React, { useState, useRef } from 'react';
import { SignaturePad, SignaturePadHandle } from './SignaturePad';
import { submitCheckIn } from '../services/guestApi';
import { Guest, GuestCheckInPayload } from '../types/guest';
import { User, Phone, MapPin, Building, CreditCard, ShieldCheck, CheckCircle2, QrCode, Sparkles, AlertCircle } from 'lucide-react';

interface VisitorCheckInFormProps {
  onCheckInSuccess: (guest: Guest) => void;
}

const COMMON_PURPOSES = [
  'ART / Asisten Rumah Tangga',
  'Cuci AC & Servis',
  'Cek Unit / Calon Penyewa',
  'Pengiriman Paket / Barang',
  'Tamu Kerabat / Penghuni',
  'Teknisi Wifi & Internet',
  'Renovasi / Tukang Bangunan',
  'Meeting / Kunjungan Kerja',
];

const COMMON_IDENTITY_TYPES = ['KTP', 'SIM A/C', 'Kartu Pegawai', 'Kartu Pelajar/Mhs', 'Paspor'];

export const VisitorCheckInForm: React.FC<VisitorCheckInFormProps> = ({
  onCheckInSuccess,
}) => {
  const [namaTamu, setNamaTamu] = useState('');
  const [noTlp, setNoTlp] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [customTujuan, setCustomTujuan] = useState('');
  const [unitTujuan, setUnitTujuan] = useState('');
  const [tower, setTower] = useState('Tower C');
  const [identitasDititip, setIdentitasDititip] = useState('KTP');
  const [nomorKartu, setNomorKartu] = useState('');
  const [catatan, setCatatan] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sigPadRef = useRef<SignaturePadHandle | null>(null);

  const handlePurposeSelect = (p: string) => {
    setTujuan(p);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const finalTujuan = tujuan === 'Lainnya' ? customTujuan.trim() : (tujuan || customTujuan.trim());
    if (!namaTamu.trim()) {
      setErrorMsg('Nama Tamu wajib diisi.');
      return;
    }
    if (!finalTujuan) {
      setErrorMsg('Pilih atau isi Keperluan / Tujuan Kunjungan.');
      return;
    }
    if (!unitTujuan.trim()) {
      setErrorMsg('Unit Tujuan wajib diisi (Contoh: C1907 atau D02-26).');
      return;
    }

    const ttd = signatureData || sigPadRef.current?.toDataURL();
    if (!ttd || (sigPadRef.current && sigPadRef.current.isEmpty())) {
      setErrorMsg('Tanda tangan digital wajib digoreskan sebelum Check-In.');
      return;
    }

    setIsLoading(true);

    try {
      const payload: GuestCheckInPayload = {
        nama_tamu: namaTamu.trim(),
        no_tlp: noTlp.trim() || '-',
        tujuan: finalTujuan,
        unit_tujuan: unitTujuan.trim().toUpperCase(),
        identitas_yang_dititip: identitasDititip,
        nomor_kartu: nomorKartu.trim() || undefined,
        ttd_masuk: ttd,
        catatan: catatan.trim() || undefined,
      };

      const result = await submitCheckIn(payload);

      // Reset form
      setNamaTamu('');
      setNoTlp('');
      setTujuan('');
      setCustomTujuan('');
      setUnitTujuan('');
      setNomorKartu('');
      setCatatan('');
      setSignatureData(null);
      sigPadRef.current?.clear();

      onCheckInSuccess(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan check-in. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/50">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-semibold text-blue-300">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Sistem Buku Tamu Mandiri & Pos Keamanan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Selamat Datang di Gateway Pesanggrahan
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Demi kenyamanan dan keamanan bersama, seluruh pengunjung wajib mengisi buku tamu digital saat memasuki gedung. Setelah check-in, Anda akan menerima <strong>QR Code Tiket Kunjungan</strong>.
          </p>

          <div className="pt-2">
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-slate-300">
              <QrCode className="w-4 h-4 text-blue-400 shrink-0" />
              <span><strong>Alur Check-Out:</strong> Cukup tunjukkan QR Code tiket Anda kepada Petugas di Pos Jaga saat hendak pulang.</span>
            </div>
          </div>
        </div>

        {/* Decorative Watermark / Circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Main Check-In Form Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
        <div className="p-6 sm:p-8">
          
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Formulir Self Check-In</h2>
              <p className="text-xs text-slate-500 mt-0.5">Isi data kunjungan Anda secara lengkap dan benar</p>
            </div>
            <span className="text-xs text-rose-500 font-semibold">* Wajib diisi</span>
          </div>

          {errorMsg && (
            <div className="mt-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Periksa Kembali Data Anda</p>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            
            {/* ROW 1: Nama Tamu & No HP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nama Lengkap Tamu</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian Prasetyo"
                  value={namaTamu}
                  onChange={(e) => setNamaTamu(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>No. Telepon / WhatsApp</span>
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={noTlp}
                  onChange={(e) => setNoTlp(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* ROW 2: Unit Tujuan */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>Unit Apartemen Tujuan</span>
                <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <select
                    value={tower}
                    onChange={(e) => {
                      setTower(e.target.value);
                      if (!unitTujuan) setUnitTujuan(`${e.target.value.replace('Tower ', '')}`);
                    }}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Tower A">Tower A</option>
                    <option value="Tower B">Tower B</option>
                    <option value="Tower C">Tower C</option>
                    <option value="Tower D">Tower D</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: C1907, D02-26, A08-12"
                    value={unitTujuan}
                    onChange={(e) => setUnitTujuan(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 uppercase tracking-wider font-semibold placeholder:font-normal placeholder:tracking-normal placeholder:capitalize transition-all"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Pilih Tower dan tulis nomor lantai serta nomor unit (contoh: C1907 = Tower C Lantai 19 No. 07).
              </p>
            </div>

            {/* ROW 3: Keperluan / Tujuan */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Keperluan / Tujuan Kunjungan</span>
                <span className="text-rose-500">*</span>
              </label>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2">
                {COMMON_PURPOSES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handlePurposeSelect(item)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left ${
                      tujuan === item
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handlePurposeSelect('Lainnya')}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    tujuan === 'Lainnya'
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Lainnya...
                </button>
              </div>

              {(tujuan === 'Lainnya' || !COMMON_PURPOSES.includes(tujuan)) && (
                <input
                  type="text"
                  placeholder="Ketik tujuan kunjungan spesifik..."
                  value={customTujuan}
                  onChange={(e) => setCustomTujuan(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  autoFocus={tujuan === 'Lainnya'}
                />
              )}
            </div>

            {/* ROW 4: Identitas & Nomor Kartu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Identitas yang Dititip di Pos Jaga</span>
                </label>
                <select
                  value={identitasDititip}
                  onChange={(e) => setIdentitasDititip(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {COMMON_IDENTITY_TYPES.map((idType) => (
                    <option key={idType} value={idType}>
                      {idType}
                    </option>
                  ))}
                  <option value="Tidak Titip (Kunjungan Singkat)">Tidak Titip (Kunjungan Singkat)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nomor Kartu Visitor (Jika ada)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: VIS-025 (Opsional)"
                  value={nomorKartu}
                  onChange={(e) => setNomorKartu(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 uppercase"
                />
              </div>
            </div>

            {/* ROW 5: Catatan Tambahan (Opsional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800 block">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Membawa barang berat via lift barang / Izin parkir loading dock"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* ROW 6: Tanda Tangan Canvas */}
            <div className="pt-2">
              <SignaturePad
                ref={sigPadRef}
                label="Tanda Tangan Digital Tamu (Masuk)"
                required={true}
                height={160}
                penColor="#0f172a"
                onChange={(data) => setSignatureData(data)}
              />
            </div>

            {/* Disclaimer & Submission */}
            <div className="pt-2 space-y-3">
              <p className="text-[11px] text-slate-400">
                Dengan menekan tombol Check-In, Anda menyetujui tata tertib hunian Apartemen Gateway Pesanggrahan dan bersedia mematuhi aturan keamanan gedung.
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Mendaftarkan Tamu...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-blue-200" />
                    <span>Check-In Sekarang & Dapatkan QR Tiket</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
