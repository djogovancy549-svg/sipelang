/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
  PieChart,
  BarChart3,
  Search,
  Activity,
  PlusCircle,
  X,
  ArrowUpDown,
  Filter,
  SlidersHorizontal,
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
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<ProcurementType | 'ALL'>('ALL');
  const [selectedSkpdFilter, setSelectedSkpdFilter] = useState<string | null>(null);
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<
    'ALL' | 'REVIEWED' | 'IN_REVIEW' | 'READY_PROCUREMENT' | 'ARCHIVED'
  >('ALL');
  const [sortBy, setSortBy] = useState<'RECENT' | 'HPS_DESC' | 'PROGRESS_DESC' | 'NAME'>('RECENT');

  // Analytics Chart State
  const [activeChartTab, setActiveChartTab] = useState<'TYPE' | 'STATUS'>('TYPE');
  const [hoveredDonutIndex, setHoveredDonutIndex] = useState<number | null>(null);

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

  // Document Review Metrics for KPIs
  const pendingDocuments = documents.filter((d) => d.reviewStatus === 'MENUNGGU_REVIEW');
  const approvedDocuments = documents.filter((d) => d.reviewStatus === 'DISETUJUI');
  const revisionDocuments = documents.filter((d) => d.reviewStatus === 'PERLU_PERBAIKAN');
  const reviewedDocuments = documents.filter(
    (d) => d.reviewStatus === 'DISETUJUI' || d.reviewStatus === 'PERLU_PERBAIKAN'
  );

  // Packages with reviewed docs
  const packageIdsWithReviewedDocs = useMemo(() => {
    return new Set(reviewedDocuments.map((d) => d.packageId));
  }, [reviewedDocuments]);

  // Packages with pending review docs
  const packageIdsWithPendingReview = useMemo(() => {
    return new Set(pendingDocuments.map((d) => d.packageId));
  }, [pendingDocuments]);

  // Packages ready for procurement (Sudah direview & disetujui, siap proses pengadaan langsung)
  const packageIdsReadyProcurement = useMemo(() => {
    const readyIds = new Set<string>();
    packages.forEach((pkg) => {
      const pkgDocs = documents.filter((d) => d.packageId === pkg.id);
      const hasApprovedDoc = pkgDocs.some((d) => d.reviewStatus === 'DISETUJUI');
      const isStageReady = pkg.stages?.PERSIAPAN_PPK?.status === 'completed' || pkg.overallProgress >= 20;
      if ((hasApprovedDoc || isStageReady) && !pkg.isArchived) {
        readyIds.add(pkg.id);
      }
    });
    return readyIds;
  }, [packages, documents]);

  // Breakdown by type
  const barangPackages = packages.filter((p) => p.procurementType === 'BARANG');
  const konsultansiPackages = packages.filter((p) => p.procurementType === 'KONSULTANSI');
  const konstruksiPackages = packages.filter((p) => p.procurementType === 'KONSTRUKSI');

  const barangHps = barangPackages.reduce((sum, p) => sum + p.hpsValue, 0);
  const konsultansiHps = konsultansiPackages.reduce((sum, p) => sum + p.hpsValue, 0);
  const konstruksiHps = konstruksiPackages.reduce((sum, p) => sum + p.hpsValue, 0);

  // Filtered & Sorted packages calculation
  const filteredPackages = useMemo(() => {
    let list = packages.filter((pkg) => {
      // Type Filter
      const matchesType = selectedTypeFilter === 'ALL' || pkg.procurementType === selectedTypeFilter;
      
      // SKPD Filter
      const matchesSkpd = !selectedSkpdFilter || pkg.skpdName === selectedSkpdFilter;

      // KPI Filter
      let matchesKpi = true;
      if (selectedKpiFilter === 'REVIEWED') {
        matchesKpi = packageIdsWithReviewedDocs.has(pkg.id);
      } else if (selectedKpiFilter === 'IN_REVIEW') {
        matchesKpi = packageIdsWithPendingReview.has(pkg.id);
      } else if (selectedKpiFilter === 'READY_PROCUREMENT') {
        matchesKpi = packageIdsReadyProcurement.has(pkg.id);
      } else if (selectedKpiFilter === 'ARCHIVED') {
        matchesKpi = pkg.isArchived;
      }

      // Search Filter
      const matchesQuery =
        searchQuery === '' ||
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.codeRUP.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.skpdName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.vendorName?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesSkpd && matchesKpi && matchesQuery;
    });

    // Sort logic
    return list.sort((a, b) => {
      if (sortBy === 'HPS_DESC') return b.hpsValue - a.hpsValue;
      if (sortBy === 'PROGRESS_DESC') return b.overallProgress - a.overallProgress;
      if (sortBy === 'NAME') return a.name.localeCompare(b.name);
      return 0; // RECENT (default)
    });
  }, [
    packages,
    selectedTypeFilter,
    selectedSkpdFilter,
    selectedKpiFilter,
    searchQuery,
    sortBy,
    packageIdsWithPendingReview,
  ]);

  // Active filters checker
  const isFilterActive =
    selectedTypeFilter !== 'ALL' ||
    selectedSkpdFilter !== null ||
    selectedKpiFilter !== 'ALL' ||
    searchQuery.trim() !== '';

  const clearAllFilters = () => {
    setSelectedTypeFilter('ALL');
    setSelectedSkpdFilter(null);
    setSelectedKpiFilter('ALL');
    setSearchQuery('');
  };

  // Donut Chart Data
  const donutTypeData = [
    { typeKey: 'BARANG' as ProcurementType, name: 'Pengadaan Barang', count: barangPackages.length, value: barangHps, color: '#701524', bg: 'bg-[#701524]' },
    { typeKey: 'KONSULTANSI' as ProcurementType, name: 'Jasa Konsultansi', count: konsultansiPackages.length, value: konsultansiHps, color: '#4f46e5', bg: 'bg-indigo-600' },
    { typeKey: 'KONSTRUKSI' as ProcurementType, name: 'Pekerjaan Konstruksi', count: konstruksiPackages.length, value: konstruksiHps, color: '#059669', bg: 'bg-emerald-600' },
  ];

  const donutStatusData = [
    { name: 'Disetujui Sah', count: approvedDocuments.length, value: approvedDocuments.length, color: '#059669', bg: 'bg-emerald-600' },
    { name: 'Perlu Review', count: pendingDocuments.length, value: pendingDocuments.length, color: '#d97706', bg: 'bg-amber-600' },
    { name: 'Perlu Perbaikan', count: revisionDocuments.length, value: revisionDocuments.length, color: '#e11d48', bg: 'bg-rose-600' },
  ];

  const activeDonutData = activeChartTab === 'TYPE' ? donutTypeData : donutStatusData;
  const totalDonutCount = activeDonutData.reduce((sum, d) => sum + d.count, 0);

  // SVG Donut Calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;
  const donutSlices = activeDonutData.map((item, index) => {
    const percentage = totalDonutCount > 0 ? item.count / totalDonutCount : 0;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += percentage * circumference;

    return {
      ...item,
      percentage: Math.round(percentage * 100),
      strokeDasharray,
      strokeDashoffset,
      index,
    };
  });

  // Bar Chart Data
  const skpdMap: Record<string, { count: number; totalHps: number; avgProgress: number }> = {};
  packages.forEach((pkg) => {
    const skpd = pkg.skpdName || 'SKPD Nagekeo';
    if (!skpdMap[skpd]) {
      skpdMap[skpd] = { count: 0, totalHps: 0, avgProgress: 0 };
    }
    skpdMap[skpd].count += 1;
    skpdMap[skpd].totalHps += pkg.hpsValue;
    skpdMap[skpd].avgProgress += pkg.overallProgress;
  });

  const barChartData = Object.entries(skpdMap).map(([skpdName, data]) => ({
    skpdName,
    count: data.count,
    totalHps: data.totalHps,
    avgProgress: Math.round(data.avgProgress / data.count),
  }));

  const maxHpsInBar = Math.max(1, ...barChartData.map((b) => b.totalHps));

  return (
    <div className="space-y-6">
      
      {/* 1. TOP QUICK HEADER - Clean, Compact & Interactive */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#701524] text-white flex flex-col items-center justify-center font-black leading-none shadow-md shrink-0">
            <span className="text-[12px] tracking-tight">LPSE</span>
            <span className="text-[8px] opacity-80 font-mono tracking-tighter">SPSE</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-extrabold text-stone-900 tracking-tight">
                Dashboard OPTIMA.DOK Nagekeo
              </h1>
              <span className="text-[10px] font-bold text-[#701524] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                TA 2026 • Perpres 12/2021
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Portal Pengadaan Langsung: Monitoring Paket, Telaah Dokumen & Analitik Data Interaktif
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-[#701524] hover:bg-[#58101c] active:bg-[#480c16] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Buat Paket Pengadaan Baru</span>
          </button>
        </div>
      </div>

      {/* 2. DEKORASI 1: RUNNING TEXT TICKER */}
      <MarqueeTicker className="rounded-xl shadow-xs" />

      {/* 3. DEKORASI 2: NAGEKEO PANORAMA HERO SLIDER */}
      <NagekeoBannerSlider />

      {/* 4. INTERACTIVE KPI METRIC CARDS (Klik untuk memfilter daftar paket!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Paket Pekerjaan */}
        <div
          onClick={() => setSelectedKpiFilter(selectedKpiFilter === 'ALL' ? 'ARCHIVED' : 'ALL')}
          className={`cursor-pointer bg-gradient-to-br from-rose-50/80 via-white to-rose-50/30 border rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group ${
            selectedKpiFilter === 'ARCHIVED' ? 'border-[#701524] ring-2 ring-[#701524]' : 'border-rose-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#701524] uppercase tracking-wider group-hover:underline">
              Total Paket Pekerjaan
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#701524] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-stone-900">
              {totalPackages}
            </span>
            <span className="text-xs font-bold text-stone-500">paket terdaftar</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-rose-100 flex items-center justify-between text-xs text-stone-600">
            <span className="font-semibold">{activePackages.length} aktif berproses</span>
            <span className="font-mono font-bold text-[#701524] bg-rose-100 px-2 py-0.5 rounded-md">
              {archivedPackages.length} arsip
            </span>
          </div>
        </div>

        {/* KPI 2: Dokumen yang Telah Di-review (Menggantikan Total Nilai HPS) */}
        <div
          onClick={() => setSelectedKpiFilter(selectedKpiFilter === 'REVIEWED' ? 'ALL' : 'REVIEWED')}
          className={`cursor-pointer bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 border rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group ${
            selectedKpiFilter === 'REVIEWED' ? 'border-emerald-600 ring-2 ring-emerald-600' : 'border-emerald-200/90'
          }`}
          title="Klik untuk memfilter paket dengan dokumen yang telah selesai direview"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider group-hover:underline">
              Dokumen Telah Di-review
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-emerald-950">
              {reviewedDocuments.length}
            </span>
            <span className="text-xs font-bold text-stone-500">berkas telaah</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-xs text-stone-600">
            <span className="font-semibold text-emerald-900">{approvedDocuments.length} Disetujui</span>
            <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
              {revisionDocuments.length} perbaikan
            </span>
          </div>
        </div>

        {/* KPI 3: Dokumen dalam Proses Review */}
        <div
          onClick={() => setSelectedKpiFilter(selectedKpiFilter === 'IN_REVIEW' ? 'ALL' : 'IN_REVIEW')}
          className={`cursor-pointer bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group ${
            selectedKpiFilter === 'IN_REVIEW' ? 'border-amber-600 ring-2 ring-amber-600' : 'border-amber-200/90'
          }`}
          title="Klik untuk memfilter paket dengan dokumen dalam proses review"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider group-hover:underline">
              Dokumen Dalam Proses Review
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-amber-900">
              {pendingDocuments.length}
            </span>
            <span className="text-xs font-bold text-stone-500">berkas antrean</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-amber-100 flex items-center justify-between text-xs">
            <span className="text-stone-600 font-medium">Status:</span>
            <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
              {selectedKpiFilter === 'IN_REVIEW' ? 'Filtered: Proses Review' : 'Menunggu Telaah'}
            </span>
          </div>
        </div>

        {/* KPI 4: Sudah Di-review Siap Proses Pengadaan (Kartu Baru Ditambahkan!) */}
        <div
          onClick={() => setSelectedKpiFilter(selectedKpiFilter === 'READY_PROCUREMENT' ? 'ALL' : 'READY_PROCUREMENT')}
          className={`cursor-pointer bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30 border rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group ${
            selectedKpiFilter === 'READY_PROCUREMENT' ? 'border-indigo-600 ring-2 ring-indigo-600' : 'border-indigo-200/90'
          }`}
          title="Klik untuk memfilter paket yang sudah direview dan siap proses pengadaan"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider group-hover:underline">
              Siap Proses Pengadaan
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-700 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-indigo-950">
              {approvedDocuments.length}
            </span>
            <span className="text-xs font-bold text-stone-500">berkas sah ({packageIdsReadyProcurement.size} paket)</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-indigo-100 flex items-center justify-between text-xs text-stone-600">
            <span className="font-semibold text-indigo-900">Status Disetujui</span>
            <span className="font-mono font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md">
              Siap Undangan / SPK
            </span>
          </div>
        </div>

      </div>

      {/* 5. MAIN CONTINUOUS GRID (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (7 COLS): MONITORING LIST & CATEGORY CARDS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Package Monitoring Card */}
          <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            
            {/* Header & Category Filters */}
            <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50">
              <div>
                <h2 className="font-bold text-stone-900 text-xs flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#701524]" />
                  <span>Monitoring Progres Paket Pekerjaan</span>
                </h2>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Progres fisik dan nilai HPS paket pengadaan langsung
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedTypeFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedTypeFilter === 'ALL'
                      ? 'bg-[#701524] text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  Semua ({packages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTypeFilter('BARANG')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedTypeFilter === 'BARANG'
                      ? 'bg-[#701524] text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  Barang ({barangPackages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTypeFilter('KONSULTANSI')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedTypeFilter === 'KONSULTANSI'
                      ? 'bg-indigo-700 text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  Konsultansi ({konsultansiPackages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTypeFilter('KONSTRUKSI')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedTypeFilter === 'KONSTRUKSI'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  Konstruksi ({konstruksiPackages.length})
                </button>
              </div>
            </div>

            {/* Live Search & Sorting Controls */}
            <div className="p-3 border-b border-stone-100 bg-white flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama paket, RUP, SKPD, atau penyedia..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#701524]/20 focus:border-[#701524]"
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

              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-stone-400" />
                  <span>Urut:</span>
                </span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 font-medium text-stone-800 focus:outline-none focus:border-[#701524] cursor-pointer"
                >
                  <option value="RECENT">Terbaru</option>
                  <option value="HPS_DESC">HPS Tertinggi</option>
                  <option value="PROGRESS_DESC">Progres Tertinggi</option>
                  <option value="NAME">Nama A-Z</option>
                </select>
              </div>
            </div>

            {/* Active Filter Chips Banner */}
            {isFilterActive && (
              <div className="p-2.5 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between gap-2 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap text-[#701524] font-semibold text-[11px]">
                  <span>Filter Aktif:</span>
                  {selectedTypeFilter !== 'ALL' && (
                    <span className="bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      Mode: {selectedTypeFilter}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedTypeFilter('ALL')} />
                    </span>
                  )}
                  {selectedSkpdFilter && (
                    <span className="bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      SKPD: {selectedSkpdFilter}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedSkpdFilter(null)} />
                    </span>
                  )}
                  {selectedKpiFilter !== 'ALL' && (
                    <span className="bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      Kategori:{' '}
                      {selectedKpiFilter === 'REVIEWED'
                        ? 'Dokumen Telah Di-review'
                        : selectedKpiFilter === 'IN_REVIEW'
                        ? 'Dokumen Dalam Proses Review'
                        : selectedKpiFilter === 'READY_PROCUREMENT'
                        ? 'Siap Proses Pengadaan'
                        : selectedKpiFilter === 'ARCHIVED'
                        ? 'Paket Arsip'
                        : selectedKpiFilter}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedKpiFilter('ALL')} />
                    </span>
                  )}
                  {searchQuery && (
                    <span className="bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      Kata kunci: "{searchQuery}"
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

            {/* Package Rows List */}
            <div className="divide-y divide-stone-100 flex-1 overflow-y-auto max-h-[460px]">
              {filteredPackages.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500 space-y-2">
                  <Filter className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="font-bold text-stone-800">Tidak ada paket pengadaan yang sesuai filter</p>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                filteredPackages.map((pkg) => {
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
                          <span
                            onClick={() => setSelectedSkpdFilter(pkg.skpdName || null)}
                            className="text-xs text-stone-500 hover:text-[#701524] font-medium cursor-pointer underline hover:no-underline"
                            title="Klik untuk memfilter SKPD ini"
                          >
                            {pkg.skpdName}
                          </span>
                        </div>

                        <h4 
                          onClick={() => onSelectPackage(pkg)}
                          className="font-bold text-xs sm:text-sm text-stone-900 hover:text-[#701524] cursor-pointer line-clamp-1"
                        >
                          {pkg.name}
                        </h4>

                        <div className="flex items-center gap-2 text-[11px] text-stone-500">
                          <span>Penyedia: <strong className="font-semibold text-stone-700">{pkg.vendorName}</strong></span>
                          <span>·</span>
                          <span>HPS: <strong className="font-mono font-bold text-stone-900">{formatRupiah(pkg.hpsValue)}</strong></span>
                        </div>
                      </div>

                      <div className="sm:w-44 shrink-0 flex flex-col sm:items-end justify-center space-y-1.5">
                        <div className="w-full flex items-center justify-between text-xs font-mono">
                          <span className="text-stone-500 text-[11px]">Progres</span>
                          <span className="font-bold text-[#701524]">{pkg.overallProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#701524] rounded-full transition-all duration-300"
                            style={{ width: `${pkg.overallProgress}%` }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectPackage(pkg)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1 border border-stone-200 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detail Paket</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-mono">
              <span>Menampilkan {filteredPackages.length} dari {packages.length} paket</span>
              <button
                type="button"
                onClick={() => onNavigateTab('kelola-paket')}
                className="text-[#701524] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Tabel Kelola Paket</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Category Regulation Limits Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Barang */}
            <div 
              onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'BARANG' ? 'ALL' : 'BARANG')}
              className={`cursor-pointer transition-all bg-gradient-to-br from-rose-50/70 to-white border rounded-2xl p-4 shadow-2xs hover:shadow-md ${
                selectedTypeFilter === 'BARANG' ? 'border-[#701524] ring-2 ring-[#701524]' : 'border-rose-200/80 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#701524] text-white rounded-lg">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-[#701524]">Pengadaan Barang</h3>
                </div>
                <span className="font-mono text-xs font-bold text-[#701524] bg-rose-100 px-2 py-0.5 rounded-full">
                  {barangPackages.length} Paket
                </span>
              </div>
              <div className="flex justify-between text-xs text-stone-600 mt-2 pt-2 border-t border-rose-100">
                <span>Batas Regulasi: ≤ Rp 200 Juta</span>
                <span className="font-mono font-bold text-stone-900">
                  {formatRupiah(barangHps)}
                </span>
              </div>
            </div>

            {/* Konsultansi */}
            <div 
              onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'KONSULTANSI' ? 'ALL' : 'KONSULTANSI')}
              className={`cursor-pointer transition-all bg-gradient-to-br from-indigo-50/70 to-white border rounded-2xl p-4 shadow-2xs hover:shadow-md ${
                selectedTypeFilter === 'KONSULTANSI' ? 'border-indigo-600 ring-2 ring-indigo-600' : 'border-indigo-200/80 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-700 text-white rounded-lg">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-indigo-900">Jasa Konsultansi</h3>
                </div>
                <span className="font-mono text-xs font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                  {konsultansiPackages.length} Paket
                </span>
              </div>
              <div className="flex justify-between text-xs text-stone-600 mt-2 pt-2 border-t border-indigo-100">
                <span>Batas Regulasi: ≤ Rp 100 Juta</span>
                <span className="font-mono font-bold text-stone-900">
                  {formatRupiah(konsultansiHps)}
                </span>
              </div>
            </div>

            {/* Konstruksi */}
            <div 
              onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'KONSTRUKSI' ? 'ALL' : 'KONSTRUKSI')}
              className={`cursor-pointer transition-all bg-gradient-to-br from-emerald-50/70 to-white border rounded-2xl p-4 shadow-2xs hover:shadow-md ${
                selectedTypeFilter === 'KONSTRUKSI' ? 'border-emerald-600 ring-2 ring-emerald-600' : 'border-emerald-200/80 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-700 text-white rounded-lg">
                    <HardHat className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-emerald-900">Pekerjaan Konstruksi</h3>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {konstruksiPackages.length} Paket
                </span>
              </div>
              <div className="flex justify-between text-xs text-stone-600 mt-2 pt-2 border-t border-emerald-100">
                <span>Batas Regulasi: ≤ Rp 200 Juta</span>
                <span className="font-mono font-bold text-stone-900">
                  {formatRupiah(konstruksiHps)}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (5 COLS): REVIEW QUEUE, DONUT CHART & BAR CHART */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Review Queue Panel */}
          <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h2 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-[#701524]" />
                  <span>Antrean Review Dokumen</span>
                </h2>
                <p className="text-[11px] text-stone-500 mt-0.5">Dokumen perlu telaah kelayakan</p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-[#701524] border border-rose-200">
                {pendingDocuments.length} Pending
              </span>
            </div>

            <div className="divide-y divide-stone-100 mt-2 flex-1 overflow-y-auto max-h-[280px]">
              {pendingDocuments.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-bold text-stone-800">Semua dokumen selesai ditelaah</p>
                  <p className="text-stone-400 mt-0.5 text-[11px]">Tidak ada antrean review tertunda.</p>
                </div>
              ) : (
                pendingDocuments.map((doc) => {
                  const pkg = packages.find((p) => p.id === doc.packageId);
                  return (
                    <div key={doc.id} className="py-2.5 space-y-1">
                      <div>
                        <span className="text-[10px] font-bold text-[#701524] bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          {doc.category}
                        </span>
                        <h4 className="font-bold text-xs text-stone-900 mt-1 line-clamp-1">
                          {doc.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 truncate">
                          Paket: {pkg?.name || doc.packageId}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono pt-1">
                        <span>{formatDate(doc.uploadDate)}</span>
                        <button
                          type="button"
                          onClick={() => onReviewDocument(doc)}
                          className="px-2.5 py-1 bg-[#701524] hover:bg-[#58101c] text-white rounded-lg text-[10px] font-bold transition-colors shadow-2xs cursor-pointer"
                        >
                          Telaah Sekarang
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 mt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => onNavigateTab('review-dokumen')}
                className="w-full py-2 text-center text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Buka Matriks Review Dokumen
              </button>
            </div>
          </div>

          {/* Interactive Donut Chart (Klik irisannya untuk memfilter!) */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 text-[#701524] rounded-lg">
                  <PieChart className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                  Grafik Donut {activeChartTab === 'TYPE' ? 'Mode Pengadaan' : 'Status Audit'}
                </h3>
              </div>

              {/* Toggle Donut Data */}
              <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-100 text-[10px]">
                <button
                  type="button"
                  onClick={() => setActiveChartTab('TYPE')}
                  className={`px-2 py-0.5 font-bold rounded transition-all cursor-pointer ${
                    activeChartTab === 'TYPE' ? 'bg-[#701524] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Jenis Mode
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('STATUS')}
                  className={`px-2 py-0.5 font-bold rounded transition-all cursor-pointer ${
                    activeChartTab === 'STATUS' ? 'bg-[#701524] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Status Audit
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-1">
              {/* SVG Circle with Slice Click Trigger */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="stroke-stone-100"
                    strokeWidth="14"
                    fill="transparent"
                  />

                  {donutSlices.map((slice: any) => {
                    const isHovered = hoveredDonutIndex === slice.index;
                    return (
                      <circle
                        key={slice.name}
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke={slice.color}
                        strokeWidth={isHovered ? 18 : 14}
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        fill="transparent"
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredDonutIndex(slice.index)}
                        onMouseLeave={() => setHoveredDonutIndex(null)}
                        onClick={() => {
                          if (slice.typeKey) {
                            setSelectedTypeFilter(selectedTypeFilter === slice.typeKey ? 'ALL' : slice.typeKey);
                          }
                        }}
                      />
                    );
                  })}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-lg font-black font-mono text-stone-900 leading-none">
                    {hoveredDonutIndex !== null ? activeDonutData[hoveredDonutIndex].count : totalDonutCount}
                  </span>
                  <span className="text-[9px] font-bold text-stone-400 mt-0.5 uppercase tracking-wider">
                    {hoveredDonutIndex !== null ? activeDonutData[hoveredDonutIndex].name.split(' ')[0] : 'Total'}
                  </span>
                </div>
              </div>

              {/* Donut Legend Items */}
              <div className="space-y-2 flex-1 min-w-0 w-full">
                {donutSlices.map((slice: any) => {
                  const isHovered = hoveredDonutIndex === slice.index;
                  return (
                    <div
                      key={slice.name}
                      onMouseEnter={() => setHoveredDonutIndex(slice.index)}
                      onMouseLeave={() => setHoveredDonutIndex(null)}
                      onClick={() => {
                        if (slice.typeKey) {
                          setSelectedTypeFilter(selectedTypeFilter === slice.typeKey ? 'ALL' : slice.typeKey);
                        }
                      }}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isHovered ? 'border-stone-400 bg-stone-100/80 shadow-2xs scale-102' : 'border-stone-100 bg-stone-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${slice.bg}`} />
                        <span className="font-bold text-stone-800 text-[11px] truncate">{slice.name}</span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-[11px] text-stone-900 block">{slice.count} Item</span>
                        <span className="text-[9px] font-mono text-stone-500 font-semibold">{slice.percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 text-[10px] text-stone-400 text-center font-mono">
              💡 Tip: Klik irisian Donut untuk langsung memfilter daftar paket
            </div>
          </div>

          {/* Interactive Bar Chart per OPD (Klik batang OPD untuk memfilter!) */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
            
            <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 text-[#701524] rounded-lg">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                    Grafik Batang HPS & Progres per OPD
                  </h3>
                  <p className="text-[10px] text-stone-400">Klik batang SKPD untuk memfilter paket</p>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold text-[#701524] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                {barChartData.length} SKPD
              </span>
            </div>

            {/* Bar List */}
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {barChartData.map((bar) => {
                const widthPct = Math.max(8, Math.round((bar.totalHps / maxHpsInBar) * 100));
                const isSelected = selectedSkpdFilter === bar.skpdName;

                return (
                  <div
                    key={bar.skpdName}
                    onClick={() => setSelectedSkpdFilter(isSelected ? null : bar.skpdName)}
                    className={`p-1.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                      isSelected ? 'border-[#701524] bg-rose-50/50 ring-1 ring-[#701524]' : 'border-transparent hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-800 truncate max-w-[200px]" title={bar.skpdName}>
                        🏢 {bar.skpdName}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                        <span className="text-stone-500 font-semibold">{bar.count} Paket</span>
                        <span className="font-bold text-stone-900">{formatRupiah(bar.totalHps)}</span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden flex items-center p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 shadow-2xs ${
                          isSelected ? 'bg-[#701524]' : 'bg-gradient-to-r from-[#701524] via-rose-700 to-rose-500'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500">
              <span>Total HPS Terpetakan: <strong className="font-mono text-stone-900">{formatRupiah(totalHps)}</strong></span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};



