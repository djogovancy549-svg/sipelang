/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ProcurementPackage, ProcurementType, StageKey } from '../types/procurement';
import { formatRupiah, getProcurementTypeLabel, getStageTitle } from '../utils/formatters';
import {
  Search,
  Plus,
  Eye,
  GitMerge,
  FileCheck2,
  Archive,
  Download,
} from 'lucide-react';

interface ManagePackagesProps {
  packages: ProcurementPackage[];
  onCreateNew?: () => void;
  onSelectPackage: (pkg: ProcurementPackage) => void;
  onOpenStageTracker: (pkg: ProcurementPackage) => void;
  onOpenReviewForPackage: (pkg: ProcurementPackage) => void;
}

export const ManagePackages: React.FC<ManagePackagesProps> = ({
  packages,
  onCreateNew,
  onSelectPackage,
  onOpenStageTracker,
  onOpenReviewForPackage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ProcurementType | 'ALL'>('ALL');
  const [selectedStage, setSelectedStage] = useState<StageKey | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const matchSearch =
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.codeRUP.includes(searchQuery) ||
        (pkg.registerNumber && pkg.registerNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        pkg.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.skpdName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = selectedType === 'ALL' || pkg.procurementType === selectedType;
      const matchStage = selectedStage === 'ALL' || pkg.currentStage === selectedStage;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && !pkg.isArchived) ||
        (statusFilter === 'ARCHIVED' && pkg.isArchived);

      return matchSearch && matchType && matchStage && matchStatus;
    });
  }, [packages, searchQuery, selectedType, selectedStage, statusFilter]);

  const exportCsv = () => {
    const headers = ['Kode RUP', 'Nama Paket', 'Jenis', 'SKPD', 'Pagu (Rp)', 'HPS (Rp)', 'Negosiasi (Rp)', 'Penyedia', 'Tahap', 'Progres (%)'];
    const rows = filteredPackages.map((p) => [
      p.codeRUP,
      `"${p.name.replace(/"/g, '""')}"`,
      p.procurementType,
      `"${p.skpdName.replace(/"/g, '""')}"`,
      p.budgetCeiling,
      p.hpsValue,
      p.negotiationValue || '-',
      `"${p.vendorName.replace(/"/g, '""')}"`,
      p.currentStage,
      p.overallProgress,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Paket_Pengadaan_Langsung_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header & Action */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-stone-900 tracking-tight">
              Kelola Paket Pengadaan Langsung
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-[#701524] border border-rose-200/60 font-semibold">
              {filteredPackages.length} Paket
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Daftar paket pekerjaan pengadaan langsung barang, jasa konsultansi, dan konstruksi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="px-3 py-1.5 border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-3.5 shadow-xs space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Cari RUP, nama paket, rekanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524] focus:bg-white"
            />
          </div>

          {/* Filter Jenis */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="w-full py-1.5 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
          >
            <option value="ALL">Semua Jenis Pengadaan</option>
            <option value="BARANG">Barang (≤ Rp 200 Juta)</option>
            <option value="KONSULTANSI">Jasa Konsultansi (≤ Rp 100 Juta)</option>
            <option value="KONSTRUKSI">Konstruksi (≤ Rp 200 Juta)</option>
          </select>

          {/* Filter Tahapan */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value as any)}
            className="w-full py-1.5 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
          >
            <option value="ALL">Semua Tahapan</option>
            <option value="PERSIAPAN_PPK">1. Dokumen Persiapan PPK</option>
            <option value="PERMINTAAN_PENAWARAN">2. Permintaan Penawaran</option>
            <option value="EVALUASI_PENAWARAN">3. Evaluasi Penawaran</option>
            <option value="KLARIFIKASI_NEGOSIASI">4. Klarifikasi & Negosiasi</option>
            <option value="PENETAPAN_BAHPL">5. Penetapan & BAHPL</option>
            <option value="SPK_SELESAI">6. Penyerahan & SPK</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full py-1.5 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
          >
            <option value="ALL">Semua Status Paket</option>
            <option value="ACTIVE">Aktif Berjalan</option>
            <option value="ARCHIVED">Telah Terarsip</option>
          </select>
        </div>

        {/* Quick Segmented Buttons */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-stone-100 overflow-x-auto text-xs">
          <span className="text-stone-400 text-[10px] font-medium shrink-0 uppercase tracking-wider">Kategori:</span>
          <button
            onClick={() => setSelectedType('ALL')}
            className={`px-2.5 py-0.5 rounded text-[11px] transition-colors shrink-0 ${
              selectedType === 'ALL'
                ? 'bg-[#701524] text-white font-medium'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Semua ({packages.length})
          </button>
          <button
            onClick={() => setSelectedType('BARANG')}
            className={`px-2.5 py-0.5 rounded text-[11px] transition-colors shrink-0 ${
              selectedType === 'BARANG'
                ? 'bg-[#701524] text-white font-medium'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Barang ({packages.filter((p) => p.procurementType === 'BARANG').length})
          </button>
          <button
            onClick={() => setSelectedType('KONSULTANSI')}
            className={`px-2.5 py-0.5 rounded text-[11px] transition-colors shrink-0 ${
              selectedType === 'KONSULTANSI'
                ? 'bg-[#701524] text-white font-medium'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Konsultansi ({packages.filter((p) => p.procurementType === 'KONSULTANSI').length})
          </button>
          <button
            onClick={() => setSelectedType('KONSTRUKSI')}
            className={`px-2.5 py-0.5 rounded text-[11px] transition-colors shrink-0 ${
              selectedType === 'KONSTRUKSI'
                ? 'bg-[#701524] text-white font-medium'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Konstruksi ({packages.filter((p) => p.procurementType === 'KONSTRUKSI').length})
          </button>
        </div>
      </div>

      {/* Main Packages Table */}
      <div className="bg-white border border-stone-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-semibold text-stone-600 tracking-wider uppercase">
                <th className="py-2.5 px-3 w-10 text-center">No</th>
                <th className="py-2.5 px-3 min-w-[260px]">Nama Paket & Kode RUP</th>
                <th className="py-2.5 px-3 min-w-[120px]">Jenis</th>
                <th className="py-2.5 px-3 text-right min-w-[130px]">Nilai HPS (Rp)</th>
                <th className="py-2.5 px-3 min-w-[170px]">Penyedia Rekanan</th>
                <th className="py-2.5 px-3 min-w-[150px]">Tahapan Berjalan</th>
                <th className="py-2.5 px-3 text-center min-w-[90px]">Progres</th>
                <th className="py-2.5 px-3 text-right min-w-[120px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    <p className="font-semibold text-stone-700">Tidak ada paket yang sesuai kriteria pencarian</p>
                    <p className="text-stone-400 mt-1 text-xs">Gunakan tombol Buat Paket untuk menambahkan paket baru.</p>
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg, idx) => {
                  const typeBadge = getProcurementTypeLabel(pkg.procurementType);
                  return (
                    <tr key={pkg.id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-stone-400 text-xs">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {pkg.registerNumber && (
                              <span className="font-mono text-[10px] text-[#701524] bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200/60 font-semibold">
                                {pkg.registerNumber}
                              </span>
                            )}
                            <span className="font-mono text-[10px] text-stone-400 bg-stone-100 px-1 py-0.2 rounded">
                              RUP: {pkg.codeRUP}
                            </span>
                            <span className="text-[10px] font-mono text-stone-400">
                              TA {pkg.fiscalYear} ({pkg.fundingSource})
                            </span>
                          </div>
                          <button
                            onClick={() => onSelectPackage(pkg)}
                            className="font-semibold text-stone-900 hover:text-[#701524] text-left line-clamp-1"
                          >
                            {pkg.name}
                          </button>
                          <div className="text-[11px] text-stone-500 truncate">
                            {pkg.skpdName}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${typeBadge.badgeClass}`}>
                          {typeBadge.label}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <div className="font-bold text-stone-900">{formatRupiah(pkg.hpsValue)}</div>
                        <div className="text-[10px] text-stone-400">Pagu: {formatRupiah(pkg.budgetCeiling)}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-stone-800 line-clamp-1">{pkg.vendorName}</div>
                        <div className="font-mono text-[10px] text-stone-400">NPWP: {pkg.vendorNpwp}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-stone-800 text-xs truncate">
                          {getStageTitle(pkg.currentStage)}
                        </div>
                        <div className="text-[10px] text-stone-400 truncate">
                          PPK: {pkg.ppkName.split('(')[0]}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="space-y-1">
                          <div className="font-mono text-xs font-bold text-stone-800">
                            {pkg.overallProgress}%
                          </div>
                          <div className="w-14 h-1.5 bg-stone-100 rounded-full mx-auto overflow-hidden">
                            <div
                              className="h-full bg-[#701524] rounded-full"
                              style={{ width: `${pkg.overallProgress}%` }}
                            />
                          </div>
                          {pkg.isArchived && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-rose-800 bg-rose-50 px-1 rounded">
                              <Archive className="w-2.5 h-2.5" />
                              <span>Arsip</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectPackage(pkg)}
                            title="Detail Paket"
                            className="p-1 text-stone-600 hover:text-[#701524] hover:bg-rose-50 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenStageTracker(pkg)}
                            title="Alur Tahapan"
                            className="p-1 text-stone-600 hover:text-[#701524] hover:bg-rose-50 rounded transition-colors"
                          >
                            <GitMerge className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenReviewForPackage(pkg)}
                            title="Telaah Dokumen"
                            className="p-1 text-stone-600 hover:text-[#701524] hover:bg-rose-50 rounded transition-colors"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
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

        <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
          <span>Menampilkan <strong className="font-mono text-stone-700">{filteredPackages.length}</strong> paket</span>
          <span className="font-mono text-stone-400">Standar Pengadaan Langsung LKPP</span>
        </div>
      </div>
    </div>
  );
};
