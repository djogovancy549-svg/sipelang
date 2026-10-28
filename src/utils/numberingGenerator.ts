/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OPDNumberingConfig } from '../types/procurement';

export const ROMAN_MONTHS: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII',
  9: 'IX',
  10: 'X',
  11: 'XI',
  12: 'XII',
};

export function getRomanMonth(dateInput?: string | Date): string {
  if (!dateInput) {
    const now = new Date();
    return ROMAN_MONTHS[now.getMonth() + 1] || 'X';
  }
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    return 'X';
  }
  const month = d.getMonth() + 1;
  return ROMAN_MONTHS[month] || 'X';
}

/**
 * Standard Nagekeo Format:
 * Nomor surat/PP-Kode Pengadaan/Kode dinas-NGK/Bulan (angka Romawi sesuai tanggal surat)/Tahun
 */
export function generateNagekeoPackageNumber(params: {
  counter: number;
  padding?: number;
  kodePengadaan?: string;
  kodeOpd: string;
  suratDate?: string | Date;
  subTypeDoc?: string; // Optional document prefix/suffix, e.g. 'UND', 'BAHPL', 'SPK'
}): string {
  const paddedNo = String(params.counter).padStart(params.padding || 3, '0');
  const d = params.suratDate ? new Date(params.suratDate) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  
  const romanMonth = getRomanMonth(validDate);
  const year = validDate.getFullYear() || 2026;
  
  // Clean OPD code and enforce -NGK suffix
  const cleanOpd = (params.kodeOpd || 'OPD').replace(/-NGK$/i, '').trim().toUpperCase();
  const opdNgk = `${cleanOpd}-NGK`;
  
  // Clean Kode Pengadaan: remove any existing "PP-" prefix and whitespace
  let cleanPengadaan = (params.kodePengadaan || 'PL').replace(/^PP-/i, '').trim().toUpperCase();
  if (!cleanPengadaan) cleanPengadaan = 'PL';

  if (params.subTypeDoc) {
    return `${paddedNo}/PP-${cleanPengadaan}.${params.subTypeDoc}/${opdNgk}/${romanMonth}/${year}`;
  }

  return `${paddedNo}/PP-${cleanPengadaan}/${opdNgk}/${romanMonth}/${year}`;
}

export function formatWithCounter(
  template: string,
  opd: OPDNumberingConfig,
  customCounter?: number,
  dateInput?: string | Date,
  customKodePengadaan?: string
): string {
  const counterValue = customCounter !== undefined ? customCounter : opd.currentCounter + 1;
  const paddedNo = String(counterValue).padStart(opd.counterPadding || 3, '0');
  
  const d = dateInput ? new Date(dateInput) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const year = String(validDate.getFullYear() || opd.fiscalYear || 2026);
  const romanMonth = getRomanMonth(validDate);
  const monthNum = String(validDate.getMonth() + 1).padStart(2, '0');

  const cleanOpd = (opd.opdCode || 'OPD').replace(/-NGK$/i, '').trim().toUpperCase();
  const opdNgk = `${cleanOpd}-NGK`;
  const cleanPengadaan = (customKodePengadaan || 'PL').replace(/^PP-/i, '').trim().toUpperCase();

  // If template is empty or matches legacy, apply the new standard
  if (!template || template.includes('PL/{KODE_OPD}') || template === 'STANDARD_NAGEKEO') {
    return `${paddedNo}/PP-${cleanPengadaan}/${opdNgk}/${romanMonth}/${year}`;
  }

  let result = template;
  result = result.replace(/\{NO\}/g, paddedNo);
  result = result.replace(/\{KODE_PENGADAAN\}/g, cleanPengadaan);
  result = result.replace(/\{KODE_OPD\}-NGK/g, opdNgk);
  result = result.replace(/\{KODE_OPD\}/g, opdNgk); // ensure -NGK
  result = result.replace(/\{KLASIFIKASI\}/g, opd.classificationCode || '027');
  result = result.replace(/\{BULAN_ROMAWI\}/g, romanMonth);
  result = result.replace(/\{BULAN\}/g, monthNum);
  result = result.replace(/\{TAHUN\}/g, year);

  return result;
}

export function generateAllDocumentNumbers(
  opd: OPDNumberingConfig,
  counter?: number,
  dateInput?: string | Date,
  kodePengadaan: string = 'PL'
) {
  const cnt = counter !== undefined ? counter : opd.currentCounter + 1;
  const pad = opd.counterPadding || 3;
  const opdCode = opd.opdCode || 'OPD';

  return {
    packageRegNumber: generateNagekeoPackageNumber({
      counter: cnt,
      padding: pad,
      kodePengadaan,
      kodeOpd: opdCode,
      suratDate: dateInput,
    }),
    invitationNumber: generateNagekeoPackageNumber({
      counter: cnt,
      padding: pad,
      kodePengadaan,
      kodeOpd: opdCode,
      suratDate: dateInput,
      subTypeDoc: 'UND',
    }),
    bahplNumber: generateNagekeoPackageNumber({
      counter: cnt,
      padding: pad,
      kodePengadaan,
      kodeOpd: opdCode,
      suratDate: dateInput,
      subTypeDoc: 'BAHPL',
    }),
    spkNumber: generateNagekeoPackageNumber({
      counter: cnt,
      padding: pad,
      kodePengadaan,
      kodeOpd: opdCode,
      suratDate: dateInput,
      subTypeDoc: 'SPK',
    }),
    bastNumber: generateNagekeoPackageNumber({
      counter: cnt,
      padding: pad,
      kodePengadaan,
      kodeOpd: opdCode,
      suratDate: dateInput,
      subTypeDoc: 'BAST',
    }),
  };
}
