/**
 * Utility untuk validasi PIN keamanan aksi hapus dinamis harian Dokumen.KU PBJ.
 * Aturan: DDMMYY-pbj (Tanggal, Bulan, 2 digit tahun terakhir + '-pbj')
 * Contoh: Tanggal 29 Oktober 2026 -> 291026-pbj
 */

export interface PinParts {
  dd: string;
  mm: string;
  yy: string;
  fullYear: number;
  formattedDate: string;
}

export function getTodayPinParts(date: Date = new Date()): PinParts {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  const fullYear = date.getFullYear();

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const formattedDate = `${date.getDate()} ${months[date.getMonth()]} ${fullYear}`;

  return { dd, mm, yy, fullYear, formattedDate };
}

/**
 * Mendapatkan PIN hari ini dalam format standar: DDMMYY-pbj
 */
export function getTodayPin(date: Date = new Date()): string {
  const { dd, mm, yy } = getTodayPinParts(date);
  return `${dd}${mm}${yy}-pbj`;
}

/**
 * Validasi apakah PIN yang dimasukkan pengguna cocok dengan PIN hari ini.
 * Bersifat fleksibel terhadap spasi (misal '291026 -pbj') dan huruf besar/kecil ('291026-PBJ').
 */
export function validateDailyPin(input: string, date: Date = new Date()): boolean {
  if (!input) return false;
  const expected = getTodayPin(date).toLowerCase().replace(/\s+/g, '');
  const sanitized = input.trim().toLowerCase().replace(/\s+/g, '');
  return sanitized === expected;
}
