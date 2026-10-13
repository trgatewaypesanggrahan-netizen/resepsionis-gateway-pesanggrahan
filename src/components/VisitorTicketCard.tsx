import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Guest } from '../types/guest';
import { Download, Printer, Check, Copy, Building2, CreditCard, Clock, User, ShieldCheck, ArrowLeft } from 'lucide-react';

interface VisitorTicketCardProps {
  guest: Guest;
  onDone?: () => void;
  showBackAction?: boolean;
}

export const VisitorTicketCard: React.FC<VisitorTicketCardProps> = ({
  guest,
  onDone,
  showBackAction = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyToken = () => {
    navigator.clipboard.writeText(guest.qr_code_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTicket = () => {
    const svgElement = document.getElementById(`qr-code-svg-${guest.id}`);
    if (!svgElement) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 640;
    const height = 820;

    canvas.width = width;
    canvas.height = height;

    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Top Navy Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, 130);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('APARTEMEN GATEWAY PESANGGRAHAN', 40, 52);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('TIKET CHECK-OUT VISITOR DIGITAL', 40, 82);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Jl. Ciledug Raya No. 15, Pesanggrahan, Jakarta Selatan', 40, 105);

    // QR Code rendering
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const qrSize = 240;
      const qrX = (width - qrSize) / 2;
      const qrY = 160;

      // Draw subtle container box
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.fillRect(qrX - 20, qrY - 15, qrSize + 40, qrSize + 55);
      ctx.strokeRect(qrX - 20, qrY - 15, qrSize + 40, qrSize + 55);

      // Draw QR image
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`TOKEN: ${guest.qr_code_token}`, width / 2, qrY + qrSize + 25);

      // Visitor Info
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(guest.nama_tamu, width / 2, 490);

      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 17px system-ui, sans-serif';
      ctx.fillText(`UNIT TUJUAN: ${guest.unit_tujuan}   |   KARTU VISITOR: ${guest.nomor_kartu}`, width / 2, 525);

      ctx.fillStyle = '#475569';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(`Keperluan: ${guest.tujuan}`, width / 2, 560);
      ctx.fillText(`Waktu Masuk: ${guest.tanggal} · ${guest.jam_masuk} WIB`, width / 2, 588);
      ctx.fillText(`Identitas Dititip: ${guest.identitas_yang_dititip || 'KTP'}`, width / 2, 615);

      // Instruction Box
      ctx.fillStyle = '#eff6ff';
      ctx.strokeStyle = '#bfdbfe';
      ctx.fillRect(40, 650, width - 80, 110);
      ctx.strokeRect(40, 650, width - 80, 110);

      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText('PETUNJUK KELUAR / CHECK-OUT:', width / 2, 682);

      ctx.fillStyle = '#1e40af';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText('Tunjukkan QR Code ini kepada Petugas / Security di Pos Jaga saat akan Check-Out.', width / 2, 710);
      ctx.fillText('Kembalikan kartu akses visitor Anda sebelum meninggalkan gedung.', width / 2, 735);

      // Save
      const link = document.createElement('a');
      link.download = `Tiket-CheckOut-${guest.unit_tujuan}-${guest.nama_tamu.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      URL.revokeObjectURL(blobURL);
    };
    img.src = blobURL;
  };

  const isCheckedIn = guest.status === 'CHECKED_IN';

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 animate-in fade-in duration-200">
      
      {/* Ticket Card Container */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600/30 border border-blue-500/40 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-base tracking-tight text-white">Gateway Pesanggrahan</h3>
                <p className="text-xs text-blue-300 font-medium">Tiket Digital Kunjungan & Barcode Check-Out</p>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${
              isCheckedIn
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {isCheckedIn ? '● AKTIF (CHECKED-IN)' : 'SELESAI (CHECKED-OUT)'}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              ID Kunjungan: {guest.id}
            </p>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">{guest.nama_tamu}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{guest.no_tlp}</p>
          </div>

          {/* Large, Clear QR Code */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border-2 border-slate-200/90 shadow-inner">
            <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200">
              <QRCodeSVG
                id={`qr-code-svg-${guest.id}`}
                value={guest.qr_code_token}
                size={230}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Token with copy button */}
            <div className="flex items-center gap-2 mt-4 px-3 py-1.5 bg-white border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-400">Token:</span>
              <span className="font-mono font-bold text-xs text-slate-800">{guest.qr_code_token}</span>
              <button
                type="button"
                onClick={handleCopyToken}
                className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                title="Salin token"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Crucial Instruction Box Requested by User */}
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl text-center space-y-1">
            <p className="text-xs font-bold text-blue-900 flex items-center justify-center gap-1.5">
              <span>🔍 Petunjuk Check-Out Pengunjung</span>
            </p>
            <p className="text-xs text-blue-800 leading-relaxed font-medium">
              Tunjukkan QR Code ini kepada Petugas / Security saat akan Check-Out.
            </p>
            <p className="text-[11px] text-blue-600">
              Petugas akan memindai QR ini di Pos Jaga dan mengembalikan kartu identitas Anda.
            </p>
          </div>

          {/* Details Grid: Nama, Unit Tujuan, Jam Masuk, Nomor Kartu Akses */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div className="flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Unit Tujuan</span>
                <span className="font-bold text-slate-900 text-sm">{guest.unit_tujuan}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CreditCard className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Nomor Kartu Akses</span>
                <span className="font-bold text-slate-900 text-sm">{guest.nomor_kartu}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Jam Masuk</span>
                <span className="font-semibold text-slate-800">{guest.jam_masuk} WIB</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <User className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Identitas Dititip</span>
                <span className="font-semibold text-slate-800">{guest.identitas_yang_dititip || 'KTP'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Simpan / Screenshot Tiket, Cetak, Selesai */}
          <div className="space-y-2.5 pt-2">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleDownloadTicket}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Simpan / Screenshot Tiket</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all border border-slate-200"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Tiket</span>
              </button>
            </div>

            {showBackAction && onDone && (
              <button
                type="button"
                onClick={onDone}
                className="w-full py-3 px-4 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl transition-colors border border-slate-200"
              >
                Selesai (Kembali ke Beranda)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
