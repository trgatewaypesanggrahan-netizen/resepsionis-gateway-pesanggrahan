import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, Upload, KeyRound, AlertCircle, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';
import { fetchGuestByToken } from '../services/guestApi';
import { Guest } from '../types/guest';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (guest: Guest) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual' | 'file'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'html5qr-reader-container';

  // Play subtle audio confirmation
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext may be restricted by autoplay policy
    }
  };

  const handleProcessCode = async (codeString: string) => {
    if (!codeString || isLoading) return;
    setIsLoading(true);
    setScannerError(null);

    try {
      playBeep();
      // Stop scanner if active
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        setIsCameraActive(false);
      }

      const cleanToken = codeString.trim();
      const guest = await fetchGuestByToken(cleanToken);
      onScanSuccess(guest);
      onClose();
    } catch (err: any) {
      setScannerError(err.message || 'Kode QR tidak dikenali atau tamu tidak ditemukan.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start Camera Scanner
  const startScanner = async () => {
    try {
      setScannerError(null);
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
        ],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleProcessCode(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setIsCameraActive(false);
      setScannerError(
        'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan atau gunakan opsi Input Manual / Upload Screenshot.'
      );
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      scannerRef.current = null;
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      const timeout = setTimeout(() => {
        startScanner();
      }, 300);
      return () => {
        clearTimeout(timeout);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, activeTab]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setScannerError(null);

    try {
      const html5QrCode = new Html5Qrcode('file-scanner-temp');
      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      handleProcessCode(decodedText);
    } catch {
      setScannerError('Tidak dapat membaca QR code dari gambar ini. Pastikan gambar jelas dan tidak buram.');
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setScannerError('Silakan masukkan token atau nomor kartu.');
      return;
    }
    handleProcessCode(manualCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div id="file-scanner-temp" className="hidden"></div>
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 border border-blue-500/40 rounded-xl">
              <Camera className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Scanner Verifikasi Check-Out</h3>
              <p className="text-xs text-slate-400">Pindai QR Code Tiket Tamu di Pos Jaga</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setScannerError(null);
              setActiveTab('camera');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'camera'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Kamera Live</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopScanner();
              setScannerError(null);
              setActiveTab('manual');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'manual'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Ketik Token / Kartu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopScanner();
              setScannerError(null);
              setActiveTab('file');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'file'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Foto</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {scannerError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Perhatian</p>
                <p>{scannerError}</p>
              </div>
            </div>
          )}

          {/* TAB 1: Camera Scanner */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square max-h-[300px] mx-auto flex items-center justify-center border border-slate-300 shadow-inner">
                <div
                  id={readerElementId}
                  className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
                />

                {/* Reticle Overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-blue-500 rounded-2xl relative shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]">
                    {/* Corner highlights */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-blue-400 rounded-tl-sm"></div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-blue-400 rounded-tr-sm"></div>
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-blue-400 rounded-bl-sm"></div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-blue-400 rounded-br-sm"></div>
                    
                    {/* Animated scanning bar */}
                    <div className="absolute left-2 right-2 h-0.5 bg-blue-400/80 shadow-[0_0_8px_#38bdf8] animate-pulse top-1/2 -translate-y-1/2"></div>
                  </div>
                </div>

                {isLoading && (
                  <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white gap-2 z-20">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                    <span className="text-xs font-medium">Memverifikasi Data Kunjungan...</span>
                  </div>
                )}
              </div>

              <div className="text-center text-xs text-slate-500 space-y-1">
                <p className="font-medium text-slate-700">Arahkan kamera ke QR Code Tiket Tamu</p>
                <p className="text-[11px]">Sistem akan otomatis mendeteksi dan membuka form Check-Out</p>
              </div>
            </div>
          )}

          {/* TAB 2: Manual Input */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Token QR / ID Tamu / Nomor Kartu Akses
                </label>
                <input
                  type="text"
                  placeholder="Contoh: GW-TOKEN-BAMBANG atau GW-20261009-001"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono placeholder:font-sans"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500">
                  Masukkan token yang tertera pada tiket fisik atau nomor kartu visitor.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !manualCode.trim()}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mencari Data...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Cari & Konfirmasi Check-Out</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: File Upload */}
          {activeTab === 'file' && (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30">
                <Upload className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-xs font-semibold text-slate-700">Pilih screenshot tiket / foto QR Code</span>
                <span className="text-[11px] text-slate-400 mt-1">Format PNG, JPG, WEBP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-xs text-blue-600 py-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menganalisis gambar...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 px-5">
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            Gateway Pesanggrahan Security System
          </span>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-slate-600 hover:text-slate-900 font-medium py-1 px-2.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};
