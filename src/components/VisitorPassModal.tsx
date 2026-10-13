import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Guest } from '../types/guest';
import { Download, Check, Copy, Printer, X, ShieldCheck, Building2, User, Clock, CreditCard } from 'lucide-react';

interface VisitorPassModalProps {
  guest: Guest;
  onClose: () => void;
}

export const VisitorPassModal: React.FC<VisitorPassModalProps> = ({ guest, onClose }) => {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleCopyToken = () => {
    navigator.clipboard.writeText(guest.qr_code_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    const svgElement = document.getElementById(`qr-svg-${guest.id}`);
    if (!svgElement) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 600;
    const height = 750;

    canvas.width = width;
    canvas.height = height;

    if (!ctx) return;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, 120);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('APARTEMEN GATEWAY PESANGGRAHAN', 40, 50);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('TIKET DIGITAL KUNJUNGAN VISITOR', 40, 80);

    // Draw QR Code from SVG
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      // Center QR code
      const qrSize = 220;
      const qrX = (width - qrSize) / 2;
      const qrY = 150;
      ctx.drawImage(image, qrX, qrY, qrSize, qrSize);

      // Draw Info text
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(guest.nama_tamu, width / 2, 410);

      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText(`UNIT: ${guest.unit_tujuan} · KARTU: ${guest.nomor_kartu}`, width / 2, 440);

      ctx.fillStyle = '#64748b';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(`Keperluan: ${guest.tujuan}`, width / 2, 470);
      ctx.fillText(`Masuk: ${guest.tanggal} | Pukul ${guest.jam_masuk} WIB`, width / 2, 495);
      ctx.fillText(`Token: ${guest.qr_code_token}`, width / 2, 530);

      // Footer note
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(30, 570, width - 60, 100);
      ctx.fillStyle = '#334155';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText('Harap tunjukkan QR Code ini ke Pos Sekuriti saat keluar.', width / 2, 610);
      ctx.fillText('Kembalikan kartu akses visitor sebelum meninggalkan gedung.', width / 2, 635);

      const link = document.createElement('a');
      link.download = `Tiket-Kunjungan-${guest.unit_tujuan}-${guest.nama_tamu.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 border border-blue-500/40 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight text-white">Gateway Pesanggrahan</h3>
              <p className="text-xs text-slate-400">Visitor Pass & Check-In Digital</p>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div ref={cardRef} className="p-6 space-y-5">
          <div className="text-center">
            <div className="inline-block p-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2">
              ✓ Check-In Berhasil Dicatat
            </div>
            <h2 className="text-xl font-bold text-slate-900">{guest.nama_tamu}</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{guest.id}</p>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="bg-white p-3 rounded-lg shadow-xs border border-slate-200">
              <QRCodeSVG
                id={`qr-svg-${guest.id}`}
                value={guest.qr_code_token}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-[11px] font-mono font-medium text-slate-600 mt-2.5 flex items-center gap-1.5">
              <span>Token:</span>
              <span className="font-bold text-slate-800">{guest.qr_code_token}</span>
              <button
                onClick={handleCopyToken}
                className="text-blue-600 hover:text-blue-700 p-0.5 rounded transition-colors"
                title="Salin token"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px]">UNIT TUJUAN</span>
                <span className="font-bold text-slate-800 text-sm">{guest.unit_tujuan}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CreditCard className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px]">NO. KARTU VISITOR</span>
                <span className="font-bold text-slate-800 text-sm">{guest.nomor_kartu}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px]">JAM MASUK</span>
                <span className="font-semibold text-slate-800">{guest.jam_masuk} WIB</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px]">KEPERLUAN</span>
                <span className="font-semibold text-slate-800 truncate block max-w-[120px]">{guest.tujuan}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed text-center font-medium">
            <p className="font-bold text-blue-950 mb-0.5">Petunjuk Check-Out:</p>
            <p>Tunjukkan QR Code ini kepada Petugas / Security saat akan Check-Out.</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadImage}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs rounded-xl shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Simpan / Screenshot Tiket</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Tiket</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-semibold text-xs rounded-xl transition-colors border border-slate-200"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
