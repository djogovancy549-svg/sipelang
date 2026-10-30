/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Megaphone } from 'lucide-react';

interface MarqueeTickerProps {
  announcements?: string[];
  className?: string;
}

export const MarqueeTicker: React.FC<MarqueeTickerProps> = ({
  announcements,
  className = '',
}) => {
  const defaultAnnouncements = [
    'Dokumen.KU KABUPATEN NAGEKEO: Sistem Informasi Dokumentasi & Monitoring Pengadaan Langsung Pemkab Nagekeo Tahun Anggaran 2026',
    'Selalu pastikan penelaahan KAK, kewajaran HPS, KSWP Ditjen Pajak, dan INAPROC LKPP terverifikasi valid sebelum penerbitan BAHPL',
    'Pengadaan Langsung Pengadaan Barang, Jasa Konsultansi, dan Pekerjaan Konstruksi seluruh OPD / SKPD se-Kabupaten Nagekeo',
    'Layanan Konsultasi & Pembinaan PBJ: Bagian Pengadaan Barang/Jasa Setda Kabupaten Nagekeo, Gedung Kantor Bupati di Kota Mbay',
    'Tetap Junjung Tinggi Transparansi, Akuntabilitas, Mencegah Korupsi, dan Efisiensi Anggaran APBD',
  ];

  const list = announcements && announcements.length > 0 ? announcements : defaultAnnouncements;
  const fullText = list.join('  •  ');

  return (
    <div className={`bg-gradient-to-r from-[#500e19] via-[#701524] to-[#500e19] text-white overflow-hidden py-1.5 px-3 flex items-center gap-2 text-xs shadow-inner shrink-0 ${className}`}>
      {/* Badge Indicator */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-300/30 text-[10px] font-bold text-rose-200 uppercase tracking-wider shrink-0 z-10 shadow-xs">
        <Megaphone className="w-3 h-3 text-amber-300 animate-pulse" />
        <span>Info PBJ</span>
      </div>

      {/* Marquee Track */}
      <div className="relative flex overflow-x-hidden w-full select-none">
        <div className="py-0.5 animate-marquee whitespace-nowrap flex items-center gap-4 text-rose-100 font-medium text-[11px] tracking-wide">
          <span>{fullText}</span>
          <span className="text-rose-400 font-mono">•</span>
          <span>{fullText}</span>
        </div>
      </div>
    </div>
  );
};
