export type GuestStatus = 'CHECKED_IN' | 'CHECKED_OUT';

export interface Guest {
  id: string;
  tanggal: string; // YYYY-MM-DD
  nama_tamu: string;
  no_tlp: string;
  tujuan: string;
  unit_tujuan: string;
  jam_masuk: string; // HH:mm:ss or HH:mm
  ttd_masuk: string; // Base64 data URL
  jam_keluar: string | null;
  ttd_keluar: string | null;
  identitas_yang_dititip: string | null;
  nomor_kartu: string;
  status: GuestStatus;
  qr_code_token: string;
  catatan?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GuestCheckInPayload {
  nama_tamu: string;
  no_tlp: string;
  tujuan: string;
  unit_tujuan: string;
  identitas_yang_dititip?: string | null;
  nomor_kartu?: string;
  ttd_masuk: string;
  catatan?: string | null;
}

export interface GuestCheckOutPayload {
  ttd_keluar: string;
  catatan?: string | null;
}

export interface GuestFilterOptions {
  search?: string;
  status?: 'ALL' | GuestStatus;
  startDate?: string;
  endDate?: string;
  bulan?: string; // YYYY-MM
  unit?: string;
}

export interface DashboardStats {
  totalHariIni: number;
  aktifHariIni: number;
  keluarHariIni: number;
  totalKeseluruhan: number;
  tujuanPopuler: { tujuan: string; count: number }[];
}
// Fungsi untuk menghitung durasi antara jam masuk dan jam keluar
export const calculateDuration = (jamMasuk?: string, jamKeluar?: string): string => {
  if (!jamMasuk || !jamKeluar || jamKeluar === '-') return '-';

  try {
    const [hMasuk, mMasuk] = jamMasuk.split(':').map(Number);
    const [hKeluar, mKeluar] = jamKeluar.split(':').map(Number);

    let totalMenitMasuk = hMasuk * 60 + mMasuk;
    let totalMenitKeluar = hKeluar * 60 + mKeluar;

    // Jika check-out lewat tengah malam (hari berikutnya)
    if (totalMenitKeluar < totalMenitMasuk) {
      totalMenitKeluar += 24 * 60;
    }

    const selisihMenit = totalMenitKeluar - totalMenitMasuk;
    const jam = Math.floor(selisihMenit / 60);
    const menit = selisihMenit % 60;

    if (jam > 0 && menit > 0) {
      return `${jam} jam ${menit} mnt`;
    } else if (jam > 0) {
      return `${jam} jam`;
    } else {
      return `${menit} mnt`;
    }
  } catch (err) {
    return '-';
  }
};