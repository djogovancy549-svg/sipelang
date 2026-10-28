/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProcurementType, ReviewStatus, StageKey } from '../types/procurement';

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getProcurementTypeLabel(type: ProcurementType): { label: string; badgeClass: string; limitText: string } {
  switch (type) {
    case 'BARANG':
      return {
        label: 'Barang',
        badgeClass: 'text-stone-700 bg-stone-100 border-stone-200',
        limitText: 'Maks. Rp 200 Juta',
      };
    case 'KONSULTANSI':
      return {
        label: 'Jasa Konsultansi',
        badgeClass: 'text-[#701524] bg-rose-50 border-rose-200/80',
        limitText: 'Maks. Rp 100 Juta',
      };
    case 'KONSTRUKSI':
      return {
        label: 'Konstruksi',
        badgeClass: 'text-stone-800 bg-stone-100 border-stone-300',
        limitText: 'Maks. Rp 200 Juta',
      };
  }
}

export function getReviewStatusBadge(status: ReviewStatus): { label: string; textClass: string; bgClass: string; borderClass: string } {
  switch (status) {
    case 'DISETUJUI':
      return {
        label: 'Disetujui',
        textClass: 'text-emerald-800',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200',
      };
    case 'PERLU_PERBAIKAN':
      return {
        label: 'Perlu Revisi',
        textClass: 'text-[#701524]',
        bgClass: 'bg-rose-50',
        borderClass: 'border-rose-200',
      };
    case 'MENUNGGU_REVIEW':
      return {
        label: 'Menunggu Review',
        textClass: 'text-amber-800',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
      };
    case 'DRAFT':
      return {
        label: 'Draft',
        textClass: 'text-stone-600',
        bgClass: 'bg-stone-100',
        borderClass: 'border-stone-200',
      };
  }
}

export function getStageTitle(stageKey: StageKey): string {
  switch (stageKey) {
    case 'PERSIAPAN_PPK':
      return '1. Persiapan PPK';
    case 'PERMINTAAN_PENAWARAN':
      return '2. Penawaran Rekanan';
    case 'EVALUASI_PENAWARAN':
      return '3. Evaluasi Penawaran';
    case 'KLARIFIKASI_NEGOSIASI':
      return '4. Klarifikasi & Negosiasi';
    case 'PENETAPAN_BAHPL':
      return '5. Penetapan & BAHPL';
    case 'SPK_SELESAI':
      return '6. SPK & Selesai';
  }
}
