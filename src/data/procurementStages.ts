/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StageInfo, StageKey, StageChecklistItem } from '../types/procurement';

export const PROCUREMENT_STAGES: StageInfo[] = [
  {
    key: 'PERSIAPAN_PPK',
    stepNumber: 1,
    shortTitle: 'Persiapan PPK',
    title: 'Penerimaan & Reviu Dokumen Persiapan dari PPK',
    description: 'Pemeriksaan kelengkapan Spesifikasi Teknis/KAK, HPS beserta kertas kerja perhitungan, dan Rancangan SPK/Surat Pesanan.',
    responsibleRole: 'Pejabat Pembuat Komitmen & Pejabat Pengadaan',
  },
  {
    key: 'PERMINTAAN_PENAWARAN',
    stepNumber: 2,
    shortTitle: 'Permintaan Penawaran',
    title: 'Penyampaian Permintaan Penawaran & Pemasukan Dokumen',
    description: 'Penyampaian undangan permintaan penawaran kepada pelaku usaha yang berkualifikasi dan penerimaan dokumen penawaran teknis serta harga.',
    responsibleRole: 'Pejabat Pengadaan & Penyedia',
  },
  {
    key: 'EVALUASI_PENAWARAN',
    stepNumber: 3,
    shortTitle: 'Evaluasi Penawaran',
    title: 'Evaluasi Administrasi, Teknis, dan Kualifikasi',
    description: 'Pemeriksaan keabsahan dokumen administrasi (NIB, NPWP, Izin Usaha), kesesuaian spesifikasi barang/jasa, dan kapasitas pelaku usaha.',
    responsibleRole: 'Pejabat Pengadaan',
  },
  {
    key: 'KLARIFIKASI_NEGOSIASI',
    stepNumber: 4,
    shortTitle: 'Klarifikasi & Negosiasi',
    title: 'Klarifikasi Teknis & Negosiasi Harga',
    description: 'Klarifikasi unsur teknis dan negosiasi harga untuk memperoleh harga yang wajar dan menguntungkan keuangan negara.',
    responsibleRole: 'Pejabat Pengadaan & Penyedia',
  },
  {
    key: 'PENETAPAN_BAHPL',
    stepNumber: 5,
    shortTitle: 'Penetapan & BAHPL',
    title: 'Penetapan Penyedia & Penyusunan BAHPL',
    description: 'Penyusunan Berita Acara Hasil Pengadaan Langsung (BAHPL) yang memuat seluruh riwayat proses evaluasi dan negosiasi.',
    responsibleRole: 'Pejabat Pengadaan',
  },
  {
    key: 'SPK_SELESAI',
    stepNumber: 6,
    shortTitle: 'Penyampaian & SPK',
    title: 'Penyampaian BAHPL ke PPK & Penerbitan SPK',
    description: 'Penyampaian laporan hasil kepada PPK untuk dasar penerbitan Surat Perintah Kerja (SPK) atau Surat Pesanan serta pengarsipan berkas.',
    responsibleRole: 'Pejabat Pengadaan & PPK',
  },
];

export const getDefaultStageChecklists = (stageKey: StageKey): StageChecklistItem[] => {
  switch (stageKey) {
    case 'PERSIAPAN_PPK':
      return [
        { id: 'prep-1', text: 'Spesifikasi Teknis / KAK telah diverifikasi dan mencantumkan output yang terukur', isDone: true },
        { id: 'prep-2', text: 'HPS ditandatangani PPK dan didukung data pasar / standar biaya masukan yang valid', isDone: true },
        { id: 'prep-3', text: 'Pagu anggaran pada DPA/DIPA mencukupi untuk membiayai nilai HPS', isDone: true },
        { id: 'prep-4', text: 'Rancangan SPK telah memuat klausul hak, kewajiban, dan sanksi denda keterlambatan', isDone: true },
      ];
    case 'PERMINTAAN_PENAWARAN':
      return [
        { id: 'req-1', text: 'Surat Permintaan Penawaran telah disampaikan kepada calon rekanan', isDone: false },
        { id: 'req-2', text: 'Dokumen Penawaran Rekanan diterima tepat waktu sebelum batas akhir', isDone: false },
        { id: 'req-3', text: 'Surat Penawaran bertanggal dan ditandatangani penanggung jawab berwenang', isDone: false },
      ];
    case 'EVALUASI_PENAWARAN':
      return [
        { id: 'eval-1', text: 'Evaluasi Administrasi: Masa berlaku penawaran, keabsahan tanda tangan sah', isDone: false },
        { id: 'eval-2', text: 'Evaluasi Kualifikasi: NIB, NPWP aktif, status KSWP Konfirmasi Status Wajib Pajak Valid', isDone: false },
        { id: 'eval-3', text: 'Evaluasi Teknis: Spesifikasi barang/jasa sesuai atau melampaui KAK / Spek Teknis PPK', isDone: false },
        { id: 'eval-4', text: 'Evaluasi Harga: Total penawaran tidak melebihi HPS dan rincian harga wajar', isDone: false },
      ];
    case 'KLARIFIKASI_NEGOSIASI':
      return [
        { id: 'neg-1', text: 'Pelaksanaan klarifikasi kesanggupan jadwal, volume, dan mutu pekerjaan', isDone: false },
        { id: 'neg-2', text: 'Negosiasi biaya satuan / total penawaran untuk efisiensi anggaran negara', isDone: false },
        { id: 'neg-3', text: 'Penandatanganan Berita Acara Klarifikasi dan Negosiasi Teknis & Harga', isDone: false },
      ];
    case 'PENETAPAN_BAHPL':
      return [
        { id: 'bahpl-1', text: 'Penerbitan Surat Penetapan Penyedia Barang/Jasa oleh Pejabat Pengadaan', isDone: false },
        { id: 'bahpl-2', text: 'Penyusunan Berita Acara Hasil Pengadaan Langsung (BAHPL)', isDone: false },
        { id: 'bahpl-3', text: 'Seluruh lampiran evaluasi, negosiasi, dan bukti dukung telah dilegalisasi', isDone: false },
      ];
    case 'SPK_SELESAI':
      return [
        { id: 'spk-1', text: 'Penyampaian BAHPL resmi dari Pejabat Pengadaan kepada PPK', isDone: false },
        { id: 'spk-2', text: 'Penerbitan Surat Perintah Kerja (SPK) / Surat Pesanan oleh PPK', isDone: false },
        { id: 'spk-3', text: 'Verifikasi kelengkapan berkas untuk digitalisasi arsip audit BPK/Inspektorat', isDone: false },
      ];
  }
};
