import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Guest } from '../types/guest';

// Format Indonesian Date: "Jumat, 09 Okt 2026"
export function formatIndonesianDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// Calculate duration between check-in and check-out or current time
export function getDurationText(guest: Guest): string {
  try {
    const inParts = guest.jam_masuk.split(':');
    if (inParts.length < 2) return '-';
    const inMins = parseInt(inParts[0], 10) * 60 + parseInt(inParts[1], 10);

    let outMins: number;
    if (guest.jam_keluar) {
      const outParts = guest.jam_keluar.split(':');
      outMins = parseInt(outParts[0], 10) * 60 + parseInt(outParts[1], 10);
    } else {
      const now = new Date();
      outMins = now.getHours() * 60 + now.getMinutes();
    }

    let diff = outMins - inMins;
    if (diff < 0) diff += 24 * 60;

    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours === 0) return `${mins} m`;
    return `${hours}j ${mins}m`;
  } catch {
    return '-';
  }
}

// Get Month Name in Indonesian: e.g. "Oktober 2026"
export function getMonthYear(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * EXPORT TO EXCEL (.xlsx)
 */
export function exportToExcel(guests: Guest[], reportTitle = 'Laporan Buku Tamu'): void {
  // Map data to the exact required columns for Gateway Pesanggrahan
  const excelData = guests.map((g, index) => ({
    'No': index + 1,
    'ID Kunjungan': g.id,
    'Bulan': getMonthYear(g.tanggal),
    'Hari / Tanggal': formatIndonesianDate(g.tanggal),
    'Nama Tamu': g.nama_tamu,
    'No Telepon / WA': g.no_tlp || '-',
    'Keperluan / Tujuan': g.tujuan,
    'Unit Tujuan': g.unit_tujuan,
    'Jam Masuk': g.jam_masuk,
    'Jam Keluar': g.jam_keluar || '(Masih di lokasi)',
    'Durasi': getDurationText(g),
    'Identitas Dititip': g.identitas_yang_dititip || 'KTP',
    'No. Kartu Visitor': g.nomor_kartu,
    'Status': g.status === 'CHECKED_IN' ? 'SEDANG KUNJUNGAN' : 'SELESAI (KELUAR)',
    'Tanda Tangan Masuk': g.ttd_masuk ? 'TERVERIFIKASI DIGITAL' : '-',
    'Tanda Tangan Keluar': g.ttd_keluar ? 'TERVERIFIKASI DIGITAL' : '-',
    'Catatan Petugas': g.catatan || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 18 }, // ID
    { wch: 15 }, // Bulan
    { wch: 18 }, // Hari/Tanggal
    { wch: 25 }, // Nama
    { wch: 16 }, // No Tlp
    { wch: 26 }, // Tujuan
    { wch: 14 }, // Unit
    { wch: 12 }, // Jam Masuk
    { wch: 18 }, // Jam Keluar
    { wch: 10 }, // Durasi
    { wch: 16 }, // Identitas
    { wch: 16 }, // No Kartu
    { wch: 20 }, // Status
    { wch: 20 }, // TTD Masuk
    { wch: 20 }, // TTD Keluar
    { wch: 30 }, // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Buku Tamu Gateway');

  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Buku_Tamu_Gateway_Pesanggrahan_${todayStr}.xlsx`);
}

/**
 * EXPORT TO PDF (.pdf)
 */
export function exportToPdf(guests: Guest[], reportPeriod = 'Semua Periode'): void {
  // Landscape orientation for broad table columns
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Primary Colors
  const navyDark = [15, 23, 42]; // #0f172a
  const slateMuted = [100, 116, 139]; // #64748b

  // Header Banner
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('APARTEMEN GATEWAY PESANGGRAHAN', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('BADAN PENGELOLA APARTEMEN · BUKU TAMU & LOG KUNJUNGAN PENGUNJUNG RESMI', 14, 18);

  // Sub-header details
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`LAPORAN KUNJUNGAN TAMU (${reportPeriod.toUpperCase()})`, 14, 32);

  const printDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Dicetak pada: ${printDate} WIB | Total Tamu: ${guests.length} Orang`, 14, 37);

  // Table Body Rows
  const tableRows = guests.map((g, idx) => [
    idx + 1,
    formatIndonesianDate(g.tanggal),
    g.nama_tamu,
    g.no_tlp || '-',
    g.tujuan,
    g.unit_tujuan,
    g.jam_masuk,
    g.jam_keluar || '(Aktif)',
    g.identitas_yang_dititip || 'KTP',
    g.nomor_kartu,
    g.status === 'CHECKED_IN' ? 'CHECKED-IN' : 'CHECKED-OUT',
    g.catatan || '-',
  ]);

  autoTable(doc, {
    startY: 42,
    head: [[
      'No',
      'Tanggal',
      'Nama Tamu',
      'No. Telepon',
      'Keperluan / Tujuan',
      'Unit',
      'Masuk',
      'Keluar',
      'Titip',
      'No. Kartu',
      'Status',
      'Catatan',
    ]],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [30, 58, 138], // #1e3a8a
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 22 },
      2: { fontStyle: 'bold', cellWidth: 34 },
      3: { cellWidth: 24 },
      4: { cellWidth: 34 },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
      6: { halign: 'center', cellWidth: 16 },
      7: { halign: 'center', cellWidth: 16 },
      8: { halign: 'center', cellWidth: 16 },
      9: { halign: 'center', cellWidth: 18 },
      10: { halign: 'center', fontStyle: 'bold', cellWidth: 24 },
      11: { cellWidth: 'auto' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Halaman ${data.pageNumber}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth - 25, pageHeight - 8);

      doc.text(
        'Sistem Buku Tamu Digital Gateway Pesanggrahan · Dokumen Rahasia Pengelola & Sekuriti',
        14,
        pageHeight - 8
      );
    },
  });

  // Security Sign-off Section on the last page if space permits
  const finalY = (doc as any).lastAutoTable?.finalY || 140;
  if (finalY < pageHeight - 35) {
    const sigY = finalY + 12;
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    
    // Left: Petugas Pos Keamanan
    doc.text('Petugas Jaga / Sekuriti,', 20, sigY);
    doc.text('(..................................................)', 20, sigY + 18);
    doc.text('Pos Gerbang / Lobby Utama', 20, sigY + 22);

    // Right: Chief Security / Building Manager
    doc.text('Mengetahui / Disetujui,', pageWidth - 80, sigY);
    doc.text('(..................................................)', pageWidth - 80, sigY + 18);
    doc.text('Building Manager / Koordinator', pageWidth - 80, sigY + 22);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  doc.save(`Laporan_Buku_Tamu_Gateway_${todayStr}.pdf`);
}
