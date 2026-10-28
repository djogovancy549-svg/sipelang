/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ProcurementPackage,
  DocumentItem,
  ProcurementType,
} from '../types/procurement';
import { formatRupiah, formatDate, getProcurementTypeLabel } from '../utils/formatters';
import {
  Briefcase,
  FileText,
  Clock,
  TrendingDown,
  CheckCircle2,
  ArrowRight,
  Boxes,
  Compass,
  HardHat,
  Eye,
  FileCheck2,
} from 'lucide-react';

import { NagekeoBannerSlider } from './NagekeoBannerSlider';
import { MarqueeTicker } from './MarqueeTicker';

interface DashboardOverviewProps {
  packages: ProcurementPackage[];
  documents: DocumentItem[];
  onNavigateTab: (tab: any) => void;
  onSelectPackage: (pkg: ProcurementPackage) => void;
  onReviewDocument: (doc: DocumentItem) => void;
  onOpenCreateModal: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  packages,
  documents,
  onNavigateTab,
  onSelectPackage,
  onReviewDocument,
  onOpenCreateModal,
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<ProcurementType | 'ALL'>('ALL');

  // Metrics computation
  const totalPackages = packages.length;
  const activePackages = packages.filter((p) => !p.isArchived);
  const archivedPackages = packages.filter((p) => p.isArchived);
  
  const totalHps = packages.reduce((sum, p) => sum + p.hpsValue, 0);
  const totalPagu = packages.reduce((sum, p) => sum + p.budgetCeiling, 0);
  
  const totalNegotiatedPackages = packages.filter((p) => p.negotiationValue && p.bidValue);
  const totalSavings = totalNegotiatedPackages.reduce(
    (acc, p) => acc + (p.hpsValue - (p.negotiationValue || p.hpsValue)),
    0
  );

  const pendingDocuments = documents.filter((d) => d.reviewStatus === 'MENUNGGU_REVIEW');

  // Breakdown by type
  const barangPackages = packages.filter((p) => p.procurementType === 'BARANG');
  const konsultansiPackages = packages.filter((p) => p.procurementType === 'KONSULTANSI');
  const konstruksiPackages = packages.filter((p) => p.procurementType === 'KONSTRUKSI');

  const filteredPackages = selectedTypeFilter === 'ALL'
    ? packages
    : packages.filter((p) => p.procurementType === selectedTypeFilter);

  return (
    <div className="space-y-5">
      {/* LPSE Quick Action Header Strip - Tepat di Atas Banner (Model LPSE) */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#701524] text-white flex flex-col items-center justify-center font-black leading-none shadow-xs shrink-0">
            <span className="text-[12px] tracking-tight">LPSE</span>
            <span className="text-[8px] opacity-80 font-mono tracking-tighter">SPSE</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-stone-900 tracking-tight">
                Layanan Pengadaan Secara Elektronik (LPSE)
              </span>
              <span className="text-[10px] font-semibold text-[#701524] bg-rose-50 px-2 py-0.5 rounded border border-rose-200/70">
                Kabupaten Nagekeo
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Portal Review Dokumen & Monitoring Pengadaan Langsung (PL) · TA 2026
            </p>
          </div>
        </div>

        {/* Tombol Buat Paket di Atas Banner (Model LPSE) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-[#701524] hover:bg-[#58101c] active:bg-[#480c16] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span>Buat Paket Pengadaan Baru</span>
          </button>
        </div>
      </div>

      {/* Text Berjalan (Running Text / Marquee Ticker) Penghias Pengadaan */}
      <MarqueeTicker className="rounded-xl shadow-xs" />

      {/* 10-Photo Nagekeo Panorama Banner Slider */}
      <NagekeoBannerSlider />

      {/* Executive Overview Sub-Header */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#701524] bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
              Workspace Pejabat Pengadaan (PP)
            </span>
            <span className="text-xs text-stone-300">·</span>
            <span className="text-xs text-stone-500 font-mono">Perpres No. 12 Tahun 2021</span>
          </div>
          <h2 className="text-base font-bold text-stone-900 tracking-tight">
            Monitoring & Review Berkas Pekerjaan
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Pengawasan KAK, HPS, klarifikasi & negosiasi harga, SPK, hingga pengarsipan digital.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('kelola-paket')}
            className="px-3 py-1.5 bg-stone-50 text-stone-700 border border-stone-300 hover:bg-stone-100 rounded-lg text-xs font-medium transition-colors"
          >
            <span>Daftar Paket ({totalPackages})</span>
          </button>
          <button
            onClick={() => onNavigateTab('unggah-dokumen')}
            className="px-3 py-1.5 bg-rose-50 text-[#701524] border border-rose-200/70 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors"
          >
            <span>Unggah Berkas</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip - Sederhana & Tabular */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Total Paket Pekerjaan</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#701524] flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-stone-900">{totalPackages}</span>
            <span className="text-xs text-stone-500">paket terdaftar</span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>{activePackages.length} aktif berproses</span>
            <span className="font-mono">{archivedPackages.length} arsip</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Total Nilai HPS</span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold font-mono tabular-nums text-stone-900 truncate">
              {formatRupiah(totalHps)}
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Pagu DPA:</span>
            <span className="font-mono text-stone-700">{formatRupiah(totalPagu)}</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Dokumen Perlu Review</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#701524] flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#701524]">
              {pendingDocuments.length}
            </span>
            <span className="text-xs text-stone-500">menunggu telaah</span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Status Telaah:</span>
            <span className="text-xs font-medium text-[#701524]">Segera tindaklanjuti</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Efisiensi Negosiasi Harga</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold font-mono tabular-nums text-emerald-800 truncate">
              {formatRupiah(totalSavings)}
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Penghematan:</span>
            <span className="font-mono text-emerald-700 font-semibold">
              {totalHps > 0 ? ((totalSavings / totalHps) * 100).toFixed(1) : 0}% dari HPS
            </span>
          </div>
        </div>
      </div>

      {/* 3 Categories Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Barang */}
        <div 
          onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'BARANG' ? 'ALL' : 'BARANG')}
          className={`cursor-pointer transition-all bg-white border rounded-xl p-4 shadow-xs ${
            selectedTypeFilter === 'BARANG' ? 'border-[#701524] ring-1 ring-[#701524]' : 'border-stone-200/80 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-stone-600" />
              <h3 className="font-bold text-xs text-stone-900">Pengadaan Barang</h3>
            </div>
            <span className="font-mono text-xs font-semibold text-stone-700">
              {barangPackages.length} Paket
            </span>
          </div>
          <div className="flex justify-between text-xs text-stone-500">
            <span>Batas: ≤ Rp 200 Juta</span>
            <span className="font-mono font-medium text-stone-800">
              {formatRupiah(barangPackages.reduce((sum, p) => sum + p.hpsValue, 0))}
            </span>
          </div>
        </div>

        {/* Konsultansi */}
        <div 
          onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'KONSULTANSI' ? 'ALL' : 'KONSULTANSI')}
          className={`cursor-pointer transition-all bg-white border rounded-xl p-4 shadow-xs ${
            selectedTypeFilter === 'KONSULTANSI' ? 'border-[#701524] ring-1 ring-[#701524]' : 'border-stone-200/80 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#701524]" />
              <h3 className="font-bold text-xs text-stone-900">Jasa Konsultansi</h3>
            </div>
            <span className="font-mono text-xs font-semibold text-[#701524]">
              {konsultansiPackages.length} Paket
            </span>
          </div>
          <div className="flex justify-between text-xs text-stone-500">
            <span>Batas: ≤ Rp 100 Juta</span>
            <span className="font-mono font-medium text-stone-800">
              {formatRupiah(konsultansiPackages.reduce((sum, p) => sum + p.hpsValue, 0))}
            </span>
          </div>
        </div>

        {/* Konstruksi */}
        <div 
          onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'KONSTRUKSI' ? 'ALL' : 'KONSTRUKSI')}
          className={`cursor-pointer transition-all bg-white border rounded-xl p-4 shadow-xs ${
            selectedTypeFilter === 'KONSTRUKSI' ? 'border-[#701524] ring-1 ring-[#701524]' : 'border-stone-200/80 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardHat className="w-4 h-4 text-stone-700" />
              <h3 className="font-bold text-xs text-stone-900">Pekerjaan Konstruksi</h3>
            </div>
            <span className="font-mono text-xs font-semibold text-stone-700">
              {konstruksiPackages.length} Paket
            </span>
          </div>
          <div className="flex justify-between text-xs text-stone-500">
            <span>Batas: ≤ Rp 200 Juta</span>
            <span className="font-mono font-medium text-stone-800">
              {formatRupiah(konstruksiPackages.reduce((sum, p) => sum + p.hpsValue, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Monitoring List & Review Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Packages Monitoring */}
        <div className="lg:col-span-2 bg-white border border-stone-200/90 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-stone-900 text-xs">
                Monitoring Progres Paket Pengadaan Langsung
              </h2>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {selectedTypeFilter === 'ALL' ? 'Menampilkan semua paket' : `Filter: ${selectedTypeFilter}`}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('kelola-paket')}
              className="text-xs font-semibold text-[#701524] hover:underline flex items-center gap-1"
            >
              <span>Kelola Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-stone-100 flex-1">
            {filteredPackages.slice(0, 4).map((pkg) => {
              const typeBadge = getProcurementTypeLabel(pkg.procurementType);
              return (
                <div
                  key={pkg.id}
                  className="p-4 hover:bg-rose-50/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeBadge.badgeClass}`}>
                        {typeBadge.label}
                      </span>
                      <span className="text-xs text-stone-400 font-mono">RUP: {pkg.codeRUP}</span>
                      <span className="text-xs text-stone-300">·</span>
                      <span className="text-xs text-stone-500 font-mono">{pkg.fundingSource}</span>
                    </div>

                    <h4 
                      onClick={() => onSelectPackage(pkg)}
                      className="font-semibold text-xs text-stone-900 hover:text-[#701524] cursor-pointer truncate"
                    >
                      {pkg.name}
                    </h4>

                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                      <span>Penyedia: <strong className="font-medium text-stone-700">{pkg.vendorName}</strong></span>
                      <span>·</span>
                      <span>HPS: <strong className="font-mono text-stone-900">{formatRupiah(pkg.hpsValue)}</strong></span>
                    </div>
                  </div>

                  <div className="sm:w-48 shrink-0 flex flex-col sm:items-end justify-center space-y-1.5">
                    <div className="w-full flex items-center justify-between text-xs">
                      <span className="text-stone-500 text-[11px]">Progres</span>
                      <span className="font-mono font-bold text-stone-900">{pkg.overallProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#701524] rounded-full transition-all duration-300"
                        style={{ width: `${pkg.overallProgress}%` }}
                      />
                    </div>
                    <button
                      onClick={() => onSelectPackage(pkg)}
                      className="px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-100 rounded transition-colors flex items-center gap-1 border border-stone-200"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Detail Paket</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-stone-50 border-t border-stone-100 text-center text-[11px] text-stone-500">
            Total {filteredPackages.length} paket pekerjaan dalam pengawasan Pejabat Pengadaan
          </div>
        </div>

        {/* Right Column (1 Col): Review Queue */}
        <div className="bg-white border border-stone-200/90 rounded-xl shadow-xs p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h2 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-[#701524]" />
                <span>Antrean Review Dokumen</span>
              </h2>
              <p className="text-[11px] text-stone-500 mt-0.5">Dokumen perlu telaah</p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-[#701524] border border-rose-200/60">
              {pendingDocuments.length}
            </span>
          </div>

          <div className="divide-y divide-stone-100 mt-2 flex-1 overflow-y-auto max-h-[360px]">
            {pendingDocuments.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-500">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto mb-2" />
                <p className="font-semibold text-stone-700">Semua dokumen selesai ditelaah</p>
                <p className="text-stone-400 mt-0.5 text-[11px]">Tidak ada antrean review yang tertunda.</p>
              </div>
            ) : (
              pendingDocuments.map((doc) => {
                const pkg = packages.find((p) => p.id === doc.packageId);
                return (
                  <div key={doc.id} className="py-2.5 space-y-1.5">
                    <div>
                      <span className="text-[10px] font-semibold text-[#701524] bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200/60">
                        {doc.category}
                      </span>
                      <h4 className="font-semibold text-xs text-stone-900 mt-1 line-clamp-1">
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 truncate">
                        Paket: {pkg?.name || doc.packageId}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span>{formatDate(doc.uploadDate)}</span>
                      <button
                        onClick={() => onReviewDocument(doc)}
                        className="px-2 py-0.5 bg-[#701524] hover:bg-[#58101c] text-white rounded text-[10px] font-medium transition-colors"
                      >
                        Telaah
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 mt-2 border-t border-stone-100">
            <button
              onClick={() => onNavigateTab('review-dokumen')}
              className="w-full py-1.5 text-center text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              Buka Lembar Telaah Dokumen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
