import React, { useState, useEffect } from 'react';
import { Guest, DashboardStats, GuestFilterOptions, calculateDuration} from '../types/guest';
import { UserManagementModal } from './UserManagementModal';
import {
  fetchGuests,
  fetchStats,
  deleteGuest,
  updateGuest,
  resetDemoData
} from '../services/guestApi';
import { exportToExcel, exportToPdf, formatIndonesianDate, getDurationText } from '../utils/exportUtils';
import {
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  LogOut,
  Eye,
  Edit3,
  Trash2,
  QrCode,
  ShieldAlert,
  Building,
  UserCheck,
  Clock,
  CheckCircle,
  Plus,
  X,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface AdminDashboardProps {
  onOpenCheckOutModal: (guest: Guest) => void;
  onOpenVisitorPass: (guest: Guest) => void;
  onOpenNewCheckIn: () => void;
  onOpenScanner: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenCheckOutModal,
  onOpenVisitorPass,
  onOpenNewCheckIn,
  onOpenScanner,
}) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalHariIni: 0,
    aktifHariIni: 0,
    keluarHariIni: 0,
    totalKeseluruhan: 0,
    tujuanPopuler: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CHECKED_IN' | 'CHECKED_OUT'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bulanFilter, setBulanFilter] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Signature modal state
  const [previewSignature, setPreviewSignature] = useState<{
    name: string;
    type: 'Masuk' | 'Keluar';
    dataUrl: string;
    time: string;
  } | null>(null);

  // Edit note modal state
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [editedNote, setEditedNote] = useState('');
  const [editedCard, setEditedCard] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const filters: GuestFilterOptions = {
        search: searchTerm || undefined,
        status: statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        bulan: bulanFilter || undefined,
      };

      const [guestList, statsData] = await Promise.all([
        fetchGuests(filters),
        fetchStats(),
      ]);

      setGuests(guestList);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, startDate, endDate, bulanFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Hapus data log kunjungan tamu "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await deleteGuest(id);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus data.');
      }
    }
  };

  const handleOpenEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setEditedNote(guest.catatan || '');
    setEditedCard(guest.nomor_kartu || '');
  };

  const handleSaveEdit = async () => {
    if (!editingGuest) return;
    try {
      await updateGuest(editingGuest.id, {
        catatan: editedNote.trim() || null,
        nomor_kartu: editedCard.trim() || editingGuest.nomor_kartu,
      });
      setEditingGuest(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan perubahan.');
    }
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset data guestbook ke data awal Gateway Pesanggrahan?')) {
      try {
        await resetDemoData();
        loadData();
      } catch (err: any) {
        alert(err.message || 'Gagal mereset data.');
      }
    }
  };

  const handleExportExcel = () => {
    exportToExcel(guests, `Buku_Tamu_${statusFilter}`);
  };

  const handleExportPdf = () => {
    const periodLabel = startDate && endDate
      ? `${startDate} s/d ${endDate}`
      : bulanFilter || (statusFilter === 'ALL' ? 'Semua Log Kunjungan' : statusFilter);
    exportToPdf(guests, periodLabel);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Metrics */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Panel Keamanan & Resepsionis
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Buku Tamu Gateway Pesanggrahan
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitoring pengunjung apartemen dan peminjaman Kartu Akses Lift.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenScanner}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              title="Pindai QR Code Tiket Tamu untuk Verifikasi Check-Out"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan Tiket QR</span>
            </button>

            <button
              onClick={onOpenNewCheckIn}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Tamu Walk-In</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={guests.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              title="Unduh Data Excel .xlsx"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={guests.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              title="Unduh Laporan PDF Resmi"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
			
			<button
			  type="button"
			  onClick={() => setIsUserModalOpen(true)}
			  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
			  title="Kelola Akun Petugas Keamanan & Admin"
>
  <span className="text-sm">👥</span>
  <span>Kelola User</span>
</button>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-6">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 flex items-start gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase">Tamu Aktif Hari Ini</p>
              <p className="text-2xl font-extrabold text-blue-400">{stats.aktifHariIni}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Sedang di dalam kawasan</p>
            </div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase">Sudah Keluar Hari Ini</p>
              <p className="text-2xl font-extrabold text-emerald-400">{stats.keluarHariIni}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Selesai & kartu kembali</p>
            </div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 flex items-start gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase">Total Masuk Hari Ini</p>
              <p className="text-2xl font-extrabold text-white">{stats.totalHariIni}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Kunjungan tercatat</p>
            </div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 flex items-start gap-3">
            <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase">Total Database</p>
              <p className="text-2xl font-extrabold text-white">{stats.totalKeseluruhan}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Arsip seluruh log</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/90 space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari Nama Tamu, Unit (C1907), No. Kartu (VIS-012), No. HP, atau Keperluan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({guests.length})
            </button>
            <button
              onClick={() => setStatusFilter('CHECKED_IN')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'CHECKED_IN'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Aktif (Checked In)
            </button>
            <button
              onClick={() => setStatusFilter('CHECKED_OUT')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'CHECKED_OUT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Selesai (Checked Out)
            </button>
          </div>
        </div>

        {/* Date Filters Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-500">Rentang Tanggal:</span>
          </div>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs focus:bg-white"
            title="Tanggal Mulai"
          />
          <span className="text-slate-400">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs focus:bg-white"
            title="Tanggal Akhir"
          />

          <div className="flex items-center gap-1.5 ml-auto">
            <label className="text-slate-500 font-medium">Filter Bulan:</label>
            <input
              type="month"
              value={bulanFilter}
              onChange={(e) => setBulanFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs focus:bg-white"
            />

            {(startDate || endDate || bulanFilter || searchTerm) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setBulanFilter('');
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-2 underline"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Guest Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold border-b border-slate-800">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3 min-w-[150px]">Nama Tamu</th>
                <th className="py-3 px-3">Keperluan / Tujuan</th>
                <th className="py-3 px-3 text-center">Unit</th>
                <th className="py-3 px-3 text-center">No. Kartu</th>
                <th className="py-3 px-3 text-center">Masuk</th>
                <th className="py-3 px-3 text-center">TTD Masuk</th>
                <th className="py-3 px-3 text-center">Keluar</th>
                <th className="py-3 px-3 text-center">TTD Keluar</th>
				<th className="py-3 px-3 text-center">Durasi</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center min-w-[120px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {guests.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-sm text-slate-600">Tidak ada data tamu yang sesuai filter.</p>
                    <p className="text-xs mt-1">Coba ubah kata kunci pencarian atau rentang tanggal.</p>
                  </td>
                </tr>
              ) : (
                guests.map((guest, idx) => {
                  const isCheckedIn = guest.status === 'CHECKED_IN';
                  return (
                    <tr
                      key={guest.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCheckedIn ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {/* No */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Tanggal */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-medium text-slate-800 block">
                          {formatIndonesianDate(guest.tanggal)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {guest.id}
                        </span>
                      </td>

                      {/* Nama Tamu */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 text-xs">{guest.nama_tamu}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{guest.no_tlp}</div>
                        {guest.catatan && (
                          <div className="text-[10px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-0.5 inline-block">
                            Catatan: {guest.catatan}
                          </div>
                        )}
                      </td>

                      {/* Keperluan */}
                      <td className="py-3 px-3">
                        <span className="text-slate-800 font-medium block">{guest.tujuan}</span>
                        <span className="text-[10px] text-slate-400">Titip: {guest.identitas_yang_dititip || '-'}</span>
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md font-bold text-slate-800 bg-slate-100 border border-slate-200">
                          {guest.unit_tujuan}
                        </span>
                      </td>

                      {/* No. Kartu */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                        {guest.nomor_kartu}
                      </td>

                      {/* Jam Masuk */}
                      <td className="py-3 px-3 text-center font-mono text-slate-700 whitespace-nowrap">
                        {guest.jam_masuk}
                      </td>

                      {/* TTD Masuk */}
                      <td className="py-3 px-3 text-center">
                        {guest.ttd_masuk ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewSignature({
                                name: guest.nama_tamu,
                                type: 'Masuk',
                                dataUrl: guest.ttd_masuk,
                                time: guest.jam_masuk,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded-md transition-colors text-[10px] font-medium"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat</span>
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Jam Keluar */}
                      <td className="py-3 px-3 text-center font-mono whitespace-nowrap">
                        {guest.jam_keluar ? (
                          <span className="text-slate-800 font-medium">{guest.jam_keluar}</span>
                        ) : (
                          <span className="text-blue-600 font-semibold text-[11px] bg-blue-50 px-1.5 py-0.5 rounded">
                            {getDurationText(guest)}
                          </span>
                        )}
                      </td>
					  

                      {/* TTD Keluar */}
                      <td className="py-3 px-3 text-center">
                        {guest.ttd_keluar ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewSignature({
                                name: guest.nama_tamu,
                                type: 'Keluar',
                                dataUrl: guest.ttd_keluar!,
                                time: guest.jam_keluar || '-',
                              })
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 rounded-md transition-colors text-[10px] font-medium"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat</span>
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
					  
					  {/* Durasi */}
					  <td className="p-3 font-semibold text-slate-300 whitespace-nowrap">
						{guest.status === 'CHECKED_OUT' ? (
						<span className="px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700 text-[11px]">
						{calculateDuration(guest.jam_masuk, guest.jam_keluar)}
						</span>
  ) : (
    <span className="text-slate-500 text-[11px] italic">Sedang Berkunjung</span>
  )}
</td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isCheckedIn ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                            CHECKED IN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            CHECKED OUT
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isCheckedIn && (
                            <button
                              type="button"
                              onClick={() => onOpenCheckOutModal(guest)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                              title="Proses Check-Out Manual"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>Out</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenVisitorPass(guest)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Tampilkan QR Code Pass"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(guest)}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Catatan / No Kartu"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(guest.id, guest.nama_tamu)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 px-4">
          <span>Menampilkan {guests.length} catatan buku tamu</span>
          <button
            onClick={handleResetDemo}
            className="text-[11px] text-slate-400 hover:text-slate-600 underline"
          >
            Reset Contoh Demo Data
          </button>
        </div>
      </div>

      {/* Lightbox Signature Preview Modal */}
      {previewSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">Tanda Tangan {previewSignature.type}</h4>
                <p className="text-xs text-slate-400">{previewSignature.name} · {previewSignature.time} WIB</p>
              </div>
              <button
                onClick={() => setPreviewSignature(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center justify-center bg-slate-50">
              <div className="w-full h-40 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center shadow-inner">
                <img
                  src={previewSignature.dataUrl}
                  alt={`TTD ${previewSignature.name}`}
                  className="max-h-full max-w-full object-contain filter contrast-125"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-3 font-mono">Tanda tangan digital terverifikasi</p>
            </div>
            <div className="p-3 bg-white border-t border-slate-200 text-right">
              <button
                onClick={() => setPreviewSignature(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Note / Card Modal */}
      {editingGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">Edit Data Tamu</h4>
                <p className="text-xs text-slate-400">{editingGuest.nama_tamu} · Unit {editingGuest.unit_tujuan}</p>
              </div>
              <button
                onClick={() => setEditingGuest(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Nomor Kartu Visitor</label>
                <input
                  type="text"
                  value={editedCard}
                  onChange={(e) => setEditedCard(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 uppercase font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Catatan Tambahan Petugas</label>
                <textarea
                  rows={3}
                  placeholder="Misal: Sistem error, kunci unit dititip di pos, identitas tertinggal, dll."
                  value={editedNote}
                  onChange={(e) => setEditedNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 resize-none"
                />
              </div>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingGuest(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Simpan Perubahan
              </button>
			</div>
          </div>
        </div>
      )}

      {/* Modal Kelola User */}
      <UserManagementModal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
      />

    </div>
  );
};