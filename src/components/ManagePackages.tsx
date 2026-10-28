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
  Download,
  LayoutList,
  LayoutGrid,
  Columns,
  X,
  CheckCircle2,
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
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ProcurementType | 'ALL'>('ALL');
  const [selectedStage, setSelectedStage] = useState<StageKey | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');
  const [sortBy, setSortBy] = useState<'RECENT' | 'HPS_DESC' | 'PROGRESS_DESC' | 'NAME'>('RECENT');

  // Interactive View Modes: TABLE, CARDS, KANBAN
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS' | 'KANBAN'>('TABLE');

  // Quick Preview Modal State
  const [previewPackage, setPreviewPackage] = useState<ProcurementPackage | null>(null);

  // Export Toast state
  const [showExportToast, setShowExportToast] = useState(false);

  // Compute stats
  const activeCount = packages.filter((p) => !p.isArchived).length;
  const archivedCount = packages.filter((p) => p.isArchived).length;
  const totalHps = packages.reduce((sum, p) => sum + p.hpsValue, 0);

  // Filter & Sort Logic
  const filteredPackages = useMemo(() => {
    let list = packages.filter((pkg) => {
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

    return list.sort((a, b) => {
      if (sortBy === 'HPS_DESC') return b.hpsValue - a.hpsValue;
      if (sortBy === 'PROGRESS_DESC') return b.overallProgress - a.overallProgress;
      if (sortBy === 'NAME') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [packages, searchQuery, selectedType, selectedStage, statusFilter, sortBy]);

  const isFilterActive =
    selectedType !== 'ALL' ||
    selectedStage !== 'ALL' ||
    statusFilter !== 'ALL' ||
    searchQuery.trim() !== '';

  const clearAllFilters = () => {
    setSelectedType('ALL');
    setSelectedStage('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
  };

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

    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 2500);
  };

  // Kanban Stage Columns definition
  const STAGE_COLUMNS: { key: StageKey; title: string; num: string }[] = [
    { key: 'PERSIAPAN_PPK', title: 'Persiapan PPK', num: '1' },
    { key: 'PERMINTAAN_PENAWARAN', title: 'Permintaan Penawaran', num: '2' },
    { key: 'EVALUASI_PENAWARAN', title: 'Evaluasi Penawaran', num: '3' },
    { key: 'KLARIFIKASI_NEGOSIASI', title: 'Klarifikasi & Negosiasi', num: '4' },
    { key: 'PENETAPAN_BAHPL', title: 'Penetapan & BAHPL', num: '5' },
    { key: 'SPK_SELESAI', title: 'Penyerahan & SPK', num: '6' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Toast Export Notification */}
      {showExportToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#701524] text-white p-3 px-4 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Daftar Paket Berhasil Diekspor ke File CSV!</span>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-stone-900 tracking-tight">
              Kelola Paket Pengadaan Langsung
            </h1>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-[#701524] border border-rose-200/60">
              {filteredPackages.length} Paket Terpilih
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Daftar seluruh pekerjaan Pengadaan Langsung se-Kabupaten Nagekeo
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={exportCsv}
            className="px-3.5 py-2 border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Ekspor Data CSV</span>
          </button>

          {onCreateNew && (
            <button
              type="button"
              onClick={onCreateNew}
              className="px-4 py-2 bg-[#701524] hover:bg-[#58101c] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Paket Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI STATS STRIP (Interactive Clickable Filters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 bg-white border rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer ${
            statusFilter === 'ALL' ? 'border-[#701524] ring-2 ring-[#701524]/20' : 'border-stone-200/90'
          }`}
        >
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Paket</div>
          <div className="text-xl font-black font-mono text-stone-900 mt-1">{packages.length} Paket</div>
        </div>

        <div
          onClick={() => setStatusFilter('ACTIVE')}
          className={`p-3.5 bg-white border rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer ${
            statusFilter === 'ACTIVE' ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-stone-200/90'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Aktif Berproses</div>
          <div className="text-xl font-black font-mono text-emerald-900 mt-1">{activeCount} Paket</div>
        </div>

        <div
          onClick={() => setStatusFilter('ARCHIVED')}
          className={`p-3.5 bg-white border rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer ${
            statusFilter === 'ARCHIVED' ? 'border-[#701524] ring-2 ring-[#701524]/20' : 'border-stone-200/90'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Telah Terarsip</div>
          <div className="text-xl font-black font-mono text-[#701524] mt-1">{archivedCount} Paket</div>
        </div>

        <div className="p-3.5 bg-white border border-stone-200/90 rounded-2xl shadow-2xs">
          <div className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Total HPS Paket</div>
          <div className="text-sm font-black font-mono text-indigo-950 truncate mt-1">{formatRupiah(totalHps)}</div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cari RUP, nama paket, SKPD, penyedia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524]/20 focus:border-[#701524] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Switcher (Table / Cards / Kanban) */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-between md:justify-end">
            <div className="inline-flex rounded-xl border border-stone-200 p-0.5 bg-stone-100 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'TABLE' ? 'bg-[#701524] text-white font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Tabel</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'CARDS' ? 'bg-[#701524] text-white font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('KANBAN')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'KANBAN' ? 'bg-[#701524] text-white font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Kanban Tahapan</span>
              </button>
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 font-medium text-stone-800 focus:outline-none focus:border-[#701524] cursor-pointer"
            >
              <option value="RECENT">Urut: Terbaru</option>
              <option value="HPS_DESC">Urut: HPS Tertinggi</option>
              <option value="PROGRESS_DESC">Urut: Progres Tertinggi</option>
              <option value="NAME">Urut: Nama A-Z</option>
            </select>
          </div>

        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-stone-100">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="w-full py-1.5 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#701524] font-medium"
          >
            <option value="ALL">Semua Jenis Pengadaan</option>
            <option value="BARANG">Barang (≤ Rp 200 Juta)</option>
            <option value="KONSULTANSI">Jasa Konsultansi (≤ Rp 100 Juta)</option>
            <option value="KONSTRUKSI">Pekerjaan Konstruksi (≤ Rp 200 Juta)</option>
          </select>

          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value as any)}
            className="w-full py-1.5 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#701524] font-medium"
          >
            <option value="ALL">Semua Tahapan Berjalan</option>
            <option value="PERSIAPAN_PPK">1. Dokumen Persiapan PPK</option>
            <option value="PERMINTAAN_PENAWARAN">2. Permintaan Penawaran</option>
            <option value="EVALUASI_PENAWARAN">3. Evaluasi Penawaran</option>
            <option value="KLARIFIKASI_NEGOSIASI">4. Klarifikasi & Negosiasi</option>
            <option value="PENETAPAN_BAHPL">5. Penetapan & BAHPL</option>
            <option value="SPK_SELESAI">6. Penyerahan & SPK</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full py-1.5 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#701524] font-medium"
          >
            <option value="ALL">Semua Status (Aktif & Arsip)</option>
            <option value="ACTIVE">Hanya Aktif Berproses</option>
            <option value="ARCHIVED">Hanya Terarsip</option>
          </select>
        </div>

        {/* Active Filter Chips Banner */}
        {isFilterActive && (
          <div className="p-2 bg-rose-50/80 rounded-xl border border-rose-100 flex items-center justify-between gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap text-[#701524] font-semibold text-[11px]">
              <span>Filter Aktif:</span>
              {selectedType !== 'ALL' && (
                <span className="bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  Jenis: {selectedType}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedType('ALL')} />
                </span>
              )}
              {selectedStage !== 'ALL' && (
                <span className="bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  Tahap: {getStageTitle(selectedStage)}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedStage('ALL')} />
                </span>
              )}
              {statusFilter !== 'ALL' && (
                <span className="bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  Status: {statusFilter}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter('ALL')} />
                </span>
              )}
              {searchQuery && (
                <span className="bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  Cari: "{searchQuery}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[11px] font-bold text-[#701524] hover:underline cursor-pointer shrink-0"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* MODE 1: TABEL INTERAKTIF */}
      {viewMode === 'TABLE' && (
        <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold text-stone-600 tracking-wider uppercase font-mono">
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3 min-w-[260px]">Nama Paket Pekerjaan & RUP</th>
                  <th className="py-3 px-3 min-w-[120px]">Jenis Mode</th>
                  <th className="py-3 px-3 text-right min-w-[140px]">Nilai HPS</th>
                  <th className="py-3 px-3 min-w-[170px]">Penyedia Rekanan</th>
                  <th className="py-3 px-3 min-w-[160px]">Tahapan Berjalan</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">Progres</th>
                  <th className="py-3 px-3 text-center min-w-[120px]">Aksi Kendali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-500">
                      <p className="font-bold text-stone-700">Tidak ada paket pengadaan yang sesuai filter</p>
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="mt-2 px-3 py-1 bg-rose-50 text-[#701524] rounded-lg text-xs font-bold border border-rose-200 cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pkg, idx) => {
                    const typeBadge = getProcurementTypeLabel(pkg.procurementType);
                    return (
                      <tr key={pkg.id} className="hover:bg-rose-50/20 transition-colors">
                        <td className="py-3.5 px-3 text-center font-mono text-stone-400 font-bold">
                          {idx + 1}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {pkg.registerNumber && (
                                <span className="font-mono text-[10px] text-[#701524] bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 font-semibold">
                                  {pkg.registerNumber}
                                </span>
                              )}
                              <span className="font-mono text-[10px] text-stone-400 bg-stone-100 px-1 py-0.2 rounded">
                                RUP: {pkg.codeRUP}
                              </span>
                            </div>
                            <h4
                              onClick={() => setPreviewPackage(pkg)}
                              className="font-bold text-stone-900 hover:text-[#701524] text-left cursor-pointer line-clamp-1"
                            >
                              {pkg.name}
                            </h4>
                            <div className="text-[11px] text-stone-500 truncate">
                              🏢 {pkg.skpdName}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${typeBadge.badgeClass}`}>
                            {typeBadge.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                          <div className="font-bold text-stone-900">{formatRupiah(pkg.hpsValue)}</div>
                          <div className="text-[10px] text-stone-400">Pagu: {formatRupiah(pkg.budgetCeiling)}</div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-stone-800 line-clamp-1">{pkg.vendorName}</div>
                          <div className="font-mono text-[10px] text-stone-400">NPWP: {pkg.vendorNpwp}</div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-bold text-stone-800 text-xs truncate">
                            {getStageTitle(pkg.currentStage)}
                          </div>
                          <div className="text-[10px] text-stone-400 truncate">
                            PPK: {pkg.ppkName.split('(')[0]}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="space-y-1">
                            <div className="font-mono text-xs font-bold text-[#701524]">
                              {pkg.overallProgress}%
                            </div>
                            <div className="w-16 h-1.5 bg-stone-100 rounded-full mx-auto overflow-hidden">
                              <div
                                className="h-full bg-[#701524] rounded-full transition-all duration-300"
                                style={{ width: `${pkg.overallProgress}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewPackage(pkg)}
                              title="Intip Ringkasan Paket"
                              className="p-1.5 text-stone-600 hover:text-[#701524] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenStageTracker(pkg)}
                              title="Buka Tahapan Proses"
                              className="p-1.5 text-stone-600 hover:text-[#701524] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <GitMerge className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenReviewForPackage(pkg)}
                              title="Review Dokumen"
                              className="p-1.5 text-stone-600 hover:text-[#701524] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <FileCheck2 className="w-4 h-4" />
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

          <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500 font-mono">
            <span>Menampilkan <strong className="text-stone-900">{filteredPackages.length}</strong> dari {packages.length} paket</span>
            <span>Standar Pengadaan Langsung Perpres 12/2021</span>
          </div>
        </div>
      )}

      {/* MODE 2: KARTU GRID INTERAKTIF */}
      {viewMode === 'CARDS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPackages.map((pkg) => {
            const typeBadge = getProcurementTypeLabel(pkg.procurementType);

            return (
              <div
                key={pkg.id}
                className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeBadge.badgeClass}`}>
                      {typeBadge.label}
                    </span>
                    <span className="font-mono text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                      RUP: {pkg.codeRUP}
                    </span>
                  </div>

                  <h3
                    onClick={() => setPreviewPackage(pkg)}
                    className="font-extrabold text-sm text-stone-900 hover:text-[#701524] cursor-pointer line-clamp-2"
                  >
                    {pkg.name}
                  </h3>

                  <div className="text-xs text-stone-500 font-medium">
                    🏢 {pkg.skpdName}
                  </div>

                  {/* Value & Vendor */}
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-500">Nilai HPS:</span>
                      <strong className="font-mono text-stone-900 font-extrabold">{formatRupiah(pkg.hpsValue)}</strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-500">Penyedia:</span>
                      <strong className="text-stone-800 font-semibold truncate max-w-[160px]">{pkg.vendorName}</strong>
                    </div>
                  </div>

                  {/* Stage Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 text-[11px]">Tahap {pkg.currentStage}</span>
                      <span className="font-mono font-bold text-[#701524]">{pkg.overallProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#701524] rounded-full transition-all duration-300"
                        style={{ width: `${pkg.overallProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewPackage(pkg)}
                    className="px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Intip Paket</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenStageTracker(pkg)}
                      className="p-1.5 bg-[#701524] hover:bg-[#58101c] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                      title="Tahapan Proses"
                    >
                      <GitMerge className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenReviewForPackage(pkg)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-[#701524] rounded-xl text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
                      title="Review Dokumen"
                    >
                      <FileCheck2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 3: KANBAN TAHAPAN PROSES (6 COLUMNS RESPONSIVE GRID) */}
      {viewMode === 'KANBAN' && (
        <div className="w-full pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 w-full">
            {STAGE_COLUMNS.map((col) => {
              const stagePkgs = filteredPackages.filter((p) => p.currentStage === col.key);

              return (
                <div
                  key={col.key}
                  className="bg-stone-100/70 border border-stone-200/90 rounded-2xl p-3 flex flex-col w-full space-y-3 min-h-[180px]"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-stone-800">
                      <span className="w-5 h-5 rounded-full bg-[#701524] text-white text-[10px] flex items-center justify-center font-mono">
                        {col.num}
                      </span>
                      <span className="truncate">{col.title}</span>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-stone-200 text-stone-700 rounded-full">
                      {stagePkgs.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px] pr-0.5">
                    {stagePkgs.length === 0 ? (
                      <div className="py-8 text-center text-[11px] text-stone-400 italic">
                        Kosong
                      </div>
                    ) : (
                      stagePkgs.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="bg-white p-3 rounded-xl border border-stone-200/90 shadow-2xs hover:shadow-md transition-all space-y-2"
                        >
                          <span className="text-[9px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.2 rounded block truncate">
                            RUP: {pkg.codeRUP}
                          </span>

                          <h4
                            onClick={() => setPreviewPackage(pkg)}
                            className="font-bold text-xs text-stone-900 hover:text-[#701524] cursor-pointer line-clamp-2"
                          >
                            {pkg.name}
                          </h4>

                          <div className="text-[10px] text-stone-500 truncate">
                            🏢 {pkg.skpdName}
                          </div>

                          <div className="text-xs font-mono font-extrabold text-[#701524]">
                            {formatRupiah(pkg.hpsValue)}
                          </div>

                          <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10px]">
                            <span className="text-stone-400 font-mono">{pkg.overallProgress}%</span>
                            <button
                              type="button"
                              onClick={() => onOpenStageTracker(pkg)}
                              className="text-[#701524] font-bold hover:underline cursor-pointer"
                            >
                              Proses →
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK PREVIEW DRAWER / MODAL */}
      {previewPackage && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-end p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full h-full max-h-[90vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-[#23090e] text-white flex items-center justify-between border-b border-[#3a141b]">
              <div>
                <span className="text-[10px] font-mono text-rose-300 uppercase font-bold">
                  Pratinjau Cepat Paket Pengadaan
                </span>
                <h3 className="font-extrabold text-sm text-white line-clamp-1 mt-0.5">
                  {previewPackage.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPackage(null)}
                className="text-rose-300 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200/80 space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-stone-500">Kode RUP:</span>
                  <strong className="text-stone-900">{previewPackage.codeRUP}</strong>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-stone-500">Nomor Register:</span>
                  <strong className="text-[#701524]">{previewPackage.registerNumber || '-'}</strong>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-stone-500">Nilai HPS:</span>
                  <strong className="text-stone-900 text-sm font-black">{formatRupiah(previewPackage.hpsValue)}</strong>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-800 text-xs border-b pb-1">Detail Organisasi & Rekanan</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-stone-400 block font-mono">SKPD Pemohon:</span>
                    <strong className="text-stone-800 block">{previewPackage.skpdName}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-mono">Sumber Dana:</span>
                    <strong className="text-stone-800 block">{previewPackage.fundingSource} TA {previewPackage.fiscalYear}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-mono">Penyedia Rekanan:</span>
                    <strong className="text-stone-800 block">{previewPackage.vendorName}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-mono">Pejabat PPK:</span>
                    <strong className="text-stone-800 block">{previewPackage.ppkName}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-800 text-xs border-b pb-1">Progres Tahapan</h4>
                <div className="p-3 bg-stone-50 rounded-xl border space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-stone-700">Tahap Terakhir:</span>
                    <span className="font-bold text-[#701524]">{getStageTitle(previewPackage.currentStage)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#701524] rounded-full"
                      style={{ width: `${previewPackage.overallProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-500 text-center block font-mono">
                    Total Progres Fisik: {previewPackage.overallProgress}%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectPackage(previewPackage);
                  setPreviewPackage(null);
                }}
                className="px-3.5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Buka Modal Detail
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenStageTracker(previewPackage);
                  setPreviewPackage(null);
                }}
                className="px-4 py-2 bg-[#701524] hover:bg-[#58101c] text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <GitMerge className="w-4 h-4" />
                <span>Buka Tahapan Proses</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
