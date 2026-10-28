/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ProcurementPackage, DocumentItem, ProcurementType } from '../types/procurement';
import { formatRupiah, formatDate, getProcurementTypeLabel } from '../utils/formatters';
import { MarqueeTicker } from './MarqueeTicker';
import {
  Folder,
  FolderArchive,
  FileText,
  Printer,
  ShieldCheck,
  Search,
  ChevronRight,
  ChevronLeft,
  Pause,
  Play,
  Grid,
  List,
  HardDrive,
  Building,
  Calendar,
  Layers,
  ArrowLeft,
  X,
  Plus,
  Box,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface ArchivingViewProps {
  packages: ProcurementPackage[];
  documents: DocumentItem[];
  onArchivePackage: (pkgId: string, boxNumber: string, verifier: string) => void;
}

interface SlideItem {
  id: number;
  imageUrl: string;
  title: string;
  subtitle: string;
  badgeLocation: string;
  badgeCategory: string;
}

const HERO_SLIDES: SlideItem[] = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=1400&q=80',
    title: 'Pusat E-Arsip Digital Pengadaan Langsung',
    subtitle: 'Sistem Pengarsipan Terenkripsi KAK, HPS, BAHPL & SPK Berkas Siap Audit APIP & BPK RI',
    badgeLocation: 'Gedung Setda Kota Mbay',
    badgeCategory: 'E-Arsip Pemkab Nagekeo',
  },
  {
    id: 2,
    imageUrl: '/public/assets/aistudio/image_4f7c3a37.png',
    title: 'Savana Bukit Kotagoa & Dhawe Mbay',
    subtitle: 'Bentang perbukitan savana keemasan yang menawan mengelilingi pusat pemerintahan Kabupaten Nagekeo di Kota Mbay.',
    badgeLocation: 'Kota Mbay - Ibukota Nagekeo',
    badgeCategory: 'Kabupaten Nagekeo • Flores NTT',
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
    title: 'Arsip Infrastruktur & Bangunan Gedung OPD',
    subtitle: 'Penyimpanan berkas proyek fisik Pekerjaan Konstruksi & Konsultansi Pengawasan Bappeda, PUPR & Dinas Teknis',
    badgeLocation: 'Kantor Bappeda & Dinas PU',
    badgeCategory: 'Pekerjaan Konstruksi & Konsultansi',
  },
  {
    id: 4,
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1400&q=80',
    title: 'Pusat Data Jaringan & Server Digital Diskominfo',
    subtitle: 'Arsip Pengadaan Perangkat Access Point, Router, Switch & Server Komunikasi Publik',
    badgeLocation: 'Ruang Server Diskominfo',
    badgeCategory: 'Pengadaan Barang • Diskominfo',
  },
  {
    id: 5,
    imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1400&q=80',
    title: 'Integritas & Akuntabilitas Audit Inspektorat',
    subtitle: 'Lembar Kendali Otomatis & Verifikasi Digital Sesuai Perpres No. 12/2021 & Standar LKPP',
    badgeLocation: 'Inspektorat Daerah Nagekeo',
    badgeCategory: 'Kepatuhan Regulasi & Audit',
  },
];

type FolderPath = {
  id: string;
  name: string;
  type: 'ROOT' | 'PROCUREMENT_TYPE' | 'YEAR' | 'PACKAGE';
  procurementType?: ProcurementType;
  packageId?: string;
};

export const ArchivingView: React.FC<ArchivingViewProps> = ({
  packages,
  documents,
  onArchivePackage,
}) => {
  // 5 Slide Hero Banner State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Folder Explorer State (Laptop / OS Style Navigation)
  const [folderPath, setFolderPath] = useState<FolderPath[]>([
    { id: 'root', name: 'E-Arsip Utama (Drive D:)', type: 'ROOT' },
  ]);
  const [explorerViewMode, setExplorerViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | ProcurementType>('ALL');

  // Kendali Modal State
  const [selectedPackageForKendali, setSelectedPackageForKendali] = useState<ProcurementPackage | null>(null);

  // Archive Action Modal State
  const [targetPkgToArchive, setTargetPkgToArchive] = useState<ProcurementPackage | null>(null);
  const [boxNumber, setBoxNumber] = useState('');
  const [verifierName, setVerifierName] = useState('Inspektorat Daerah / APIP');

  // Auto-play interval for 5-slide banner
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentFolder = folderPath[folderPath.length - 1];

  // Helper navigate into subfolder
  const navigateTo = (newPath: FolderPath) => {
    setFolderPath((prev) => [...prev, newPath]);
  };

  // Helper navigate back to specific index in breadcrumbs
  const navigateToBreadcrumb = (index: number) => {
    setFolderPath((prev) => prev.slice(0, index + 1));
  };

  const currentPkgCount = packages.filter((p) => p.isArchived).length;
  const readyToArchivePackages = packages.filter((p) => !p.isArchived && p.overallProgress >= 80);

  // Filter packages based on active folder & filter settings
  const getDisplayPackages = () => {
    return packages.filter((p) => {
      // Search
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.codeRUP.includes(searchQuery) ||
        p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.archiveBoxNumber && p.archiveBoxNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      // Type Filter
      if (filterType !== 'ALL' && p.procurementType !== filterType) return false;

      // Folder Hierarchy context
      if (currentFolder.type === 'PROCUREMENT_TYPE' && currentFolder.procurementType) {
        return p.procurementType === currentFolder.procurementType;
      }

      return true;
    });
  };

  const displayPackages = getDisplayPackages();

  const handleConfirmArchive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPkgToArchive) return;
    if (!boxNumber.trim()) {
      alert('Mohon isi Nomor Box Arsip.');
      return;
    }
    onArchivePackage(targetPkgToArchive.id, boxNumber.trim(), verifierName.trim());
    setTargetPkgToArchive(null);
    setBoxNumber('');
  };

  const handlePrintKendali = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HERO SLIDESHOW BANNER (5 Gambar Slide) */}
      <div className="relative bg-stone-950 rounded-2xl overflow-hidden shadow-xl border border-stone-800 text-white min-h-[280px] sm:min-h-[320px] flex flex-col justify-between group">
        
        {/* Slides Images */}
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="w-full h-full object-cover object-center filter brightness-[0.68]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
            </div>
          );
        })}

        {/* Top Badges Header */}
        <div className="relative z-20 p-4 sm:p-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="bg-[#701524] text-rose-100 border border-rose-300/40 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
              <Building className="w-3.5 h-3.5" />
              <span>{HERO_SLIDES[currentSlide].badgeCategory}</span>
            </span>

            <span className="bg-black/60 backdrop-blur-md text-stone-200 border border-white/10 text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-full">
              📍 {HERO_SLIDES[currentSlide].badgeLocation}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full text-xs font-mono">
            <span className="text-amber-300 font-bold">
              0{currentSlide + 1} / 0{HERO_SLIDES.length}
            </span>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-stone-300 hover:text-white p-0.5 transition-colors cursor-pointer"
              title={isPlaying ? 'Jeda Slide' : 'Putar Slide'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Slide Content Text */}
        <div className="relative z-20 p-5 sm:p-6 space-y-1.5 max-w-3xl">
          <p className="text-xs font-mono tracking-widest text-amber-300 uppercase font-semibold">
            Sistem Informasi E-Arsip PBJ • Pemkab Nagekeo
          </p>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight">
            {HERO_SLIDES[currentSlide].title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-light line-clamp-2">
            {HERO_SLIDES[currentSlide].subtitle}
          </p>
        </div>

        {/* Navigation Dots & Prev/Next Arrows */}
        <div className="relative z-20 px-5 py-3 bg-black/40 backdrop-blur-xs border-t border-white/10 flex items-center justify-between">
          {/* Indicator Dots */}
          <div className="flex items-center gap-2">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentSlide ? 'w-8 bg-[#701524]' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                title={`Ke Slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="text-[11px] font-mono text-stone-300 hidden sm:block">
            Pengadaan Barang/Jasa Pemerintah Kabupaten Nagekeo
          </div>

          {/* Prev/Next Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
              className="p-1.5 rounded-lg bg-black/50 hover:bg-white/20 border border-white/20 text-white transition-colors cursor-pointer"
              title="Slide Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
              className="p-1.5 rounded-lg bg-black/50 hover:bg-white/20 border border-white/20 text-white transition-colors cursor-pointer"
              title="Slide Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. TEXT BERJALAN (Marquee Ticker Penghias) */}
      <MarqueeTicker
        announcements={[
          'PENGARSIPAN DIGITAL E-ARSIP PBJ KABUPATEN NAGEKEO TAHUN ANGGARAN 2026',
          'Sistem Penyimpanan Berkas Terenkripsi KAK, HPS, DPA, BAHPL & SPK Terhubung Langsung Audit Inspektorat & BPK RI',
          'Terdapat 3 Mode Pengadaan Warna Khusus: Pengadaan Barang (Merah Maroon), Jasa Konsultansi (Nila Indigo), Pekerjaan Konstruksi (Hijau Zamrud)',
          'Gunakan Lembar Kendali Digital untuk Pencetakan Otomatis Audit Pengawasan Pengadaan Langsung',
        ]}
        className="rounded-xl shadow-2xs border border-rose-900/40"
      />

      {/* 3. MODERN LAPTOP OS STYLE FOLDER EXPLORER */}
      <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden space-y-0">
        
        {/* Top OS Window Header Toolbar */}
        <div className="bg-stone-100/80 border-b border-stone-200 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* OS Navigation Buttons & Breadcrumbs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Back Button */}
            <button
              type="button"
              disabled={folderPath.length <= 1}
              onClick={() => setFolderPath((prev) => prev.slice(0, -1))}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                folderPath.length > 1
                  ? 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50 cursor-pointer'
                  : 'bg-stone-100 border-stone-200 text-stone-300 cursor-not-allowed'
              }`}
              title="Kembali ke Folder Atas"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            {/* Laptop Breadcrumbs Path */}
            <div className="flex items-center gap-1 bg-white border border-stone-200/90 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-700 shadow-2xs">
              <HardDrive className="w-3.5 h-3.5 text-[#701524]" />
              {folderPath.map((item, idx) => (
                <React.Fragment key={item.id}>
                  {idx > 0 && <span className="text-stone-300 font-bold">/</span>}
                  <button
                    type="button"
                    onClick={() => navigateToBreadcrumb(idx)}
                    className={`hover:text-[#701524] transition-colors truncate max-w-[140px] cursor-pointer ${
                      idx === folderPath.length - 1 ? 'text-[#701524] font-bold' : 'text-stone-600'
                    }`}
                  >
                    {item.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Search Bar & View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Cari folder, RUP, paket, box..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524] shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode (Grid vs List) */}
            <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-white text-xs">
              <button
                type="button"
                onClick={() => setExplorerViewMode('GRID')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  explorerViewMode === 'GRID' ? 'bg-[#701524] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Tampilan Folder Grid Laptop"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setExplorerViewMode('LIST')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  explorerViewMode === 'LIST' ? 'bg-[#701524] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Tampilan List Tabel OS"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Procurement Category Quick Filters (Dengan Warna Berbeda) */}
        <div className="bg-stone-50 border-b border-stone-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-stone-500 font-bold uppercase tracking-wider text-[10px] mr-1">
              Mode Pengadaan:
            </span>

            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-stone-800 text-white shadow-2xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              Semua Mode ({packages.length})
            </button>

            {/* Pengadaan Barang (Merah Maroon) */}
            <button
              type="button"
              onClick={() => setFilterType('BARANG')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer border flex items-center gap-1.5 ${
                filterType === 'BARANG'
                  ? 'bg-[#701524] text-white border-[#701524] shadow-2xs'
                  : 'bg-rose-50 text-[#701524] border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span>Pengadaan Barang ({packages.filter((p) => p.procurementType === 'BARANG').length})</span>
            </button>

            {/* Jasa Konsultansi (Nila Indigo) */}
            <button
              type="button"
              onClick={() => setFilterType('KONSULTANSI')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer border flex items-center gap-1.5 ${
                filterType === 'KONSULTANSI'
                  ? 'bg-indigo-800 text-white border-indigo-800 shadow-2xs'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span>Jasa Konsultansi ({packages.filter((p) => p.procurementType === 'KONSULTANSI').length})</span>
            </button>

            {/* Pekerjaan Konstruksi (Hijau Zamrud) */}
            <button
              type="button"
              onClick={() => setFilterType('KONSTRUKSI')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer border flex items-center gap-1.5 ${
                filterType === 'KONSTRUKSI'
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Pekerjaan Konstruksi ({packages.filter((p) => p.procurementType === 'KONSTRUKSI').length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-stone-500 font-mono">
              Terarsip: <strong className="text-[#701524]">{currentPkgCount}</strong> / {packages.length} Paket
            </span>
          </div>
        </div>

        {/* 4. MAIN FOLDER EXPLORER CONTENT AREA */}
        <div className="p-4 sm:p-5 space-y-6">
          
          {/* ROOT LEVEL: SHOW CATEGORY & YEAR FOLDERS */}
          {currentFolder.type === 'ROOT' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-stone-100 text-xs">
                <span className="font-bold uppercase tracking-wider text-stone-500">
                  Folder Mode Pengadaan (Laptop OS Explorer)
                </span>
                <span className="text-stone-400 font-mono text-[11px]">Klik folder untuk membuka sub-arsip</span>
              </div>

              {/* 3 Colored Procurement Folders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Folder 1: Pengadaan Barang (Warna Merah Maroon #701524) */}
                <div
                  onClick={() =>
                    navigateTo({
                      id: 'f-barang',
                      name: '📁 Folder 01. Pengadaan Barang',
                      type: 'PROCUREMENT_TYPE',
                      procurementType: 'BARANG',
                    })
                  }
                  className="group p-4 bg-rose-50/70 border border-rose-200/90 hover:border-[#701524] hover:shadow-md rounded-2xl transition-all cursor-pointer space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-[#701524] text-rose-100 rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                      <Folder className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-[#701524] border border-rose-300">
                      Merah Maroon
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-stone-900 text-sm group-hover:text-[#701524] transition-colors">
                      Pengadaan Barang
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {packages.filter((p) => p.procurementType === 'BARANG').length} Paket Pengadaan • Access Point, Switch, Peralatan Kantor
                    </p>
                  </div>

                  <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-xs font-semibold text-[#701524]">
                    <span>Buka Folder Barang</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Folder 2: Jasa Konsultansi (Warna Nila Indigo) */}
                <div
                  onClick={() =>
                    navigateTo({
                      id: 'f-konsultansi',
                      name: '📁 Folder 02. Jasa Konsultansi',
                      type: 'PROCUREMENT_TYPE',
                      procurementType: 'KONSULTANSI',
                    })
                  }
                  className="group p-4 bg-indigo-50/70 border border-indigo-200/90 hover:border-indigo-600 hover:shadow-md rounded-2xl transition-all cursor-pointer space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-indigo-700 text-indigo-100 rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                      <Folder className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                      Nila Indigo
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-stone-900 text-sm group-hover:text-indigo-800 transition-colors">
                      Jasa Konsultansi
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {packages.filter((p) => p.procurementType === 'KONSULTANSI').length} Paket Pengadaan • Pengawasan Gedung, Perencanaan
                    </p>
                  </div>

                  <div className="pt-2 border-t border-indigo-200/60 flex items-center justify-between text-xs font-semibold text-indigo-800">
                    <span>Buka Folder Konsultansi</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Folder 3: Pekerjaan Konstruksi (Warna Hijau Zamrud) */}
                <div
                  onClick={() =>
                    navigateTo({
                      id: 'f-konstruksi',
                      name: '📁 Folder 03. Pekerjaan Konstruksi',
                      type: 'PROCUREMENT_TYPE',
                      procurementType: 'KONSTRUKSI',
                    })
                  }
                  className="group p-4 bg-emerald-50/70 border border-emerald-200/90 hover:border-emerald-600 hover:shadow-md rounded-2xl transition-all cursor-pointer space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-emerald-700 text-emerald-100 rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                      <Folder className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Hijau Zamrud
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-stone-900 text-sm group-hover:text-emerald-800 transition-colors">
                      Pekerjaan Konstruksi
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {packages.filter((p) => p.procurementType === 'KONSTRUKSI').length} Paket Pengadaan • Drainase, Jalan, Rehabilitasi Gedung
                    </p>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs font-semibold text-emerald-800">
                    <span>Buka Folder Konstruksi</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

              </div>

              {/* Special Folder Drive Sections (Tahun Anggaran & Box Audit BPK) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
                    <Calendar className="w-4 h-4 text-[#701524]" />
                    <span>Arsip Per Tahun Anggaran</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['TA 2026', 'TA 2025', 'TA 2024'].map((yr) => (
                      <span
                        key={yr}
                        className="px-3 py-1 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 shadow-2xs hover:border-[#701524] cursor-pointer"
                      >
                        📁 {yr}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <Box className="w-4 h-4 text-amber-800" />
                    <span>Kotak Box Arsip Audit BPK & Inspektorat</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Setiap paket terarsip dilengkapi Kode Nomor Box Fisik & Digital untuk pemeriksaan APIP.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PACKAGE LIST (Inside Selected Folder or Master List) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-stone-100 text-xs">
              <span className="font-bold text-stone-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#701524]" />
                <span>Berkas Paket Pengadaan Dalam Folder Ini ({displayPackages.length})</span>
              </span>
              <span className="text-stone-400 font-mono text-[11px]">
                {explorerViewMode === 'GRID' ? 'Mode Kartu OS' : 'Mode Tabel List'}
              </span>
            </div>

            {/* READY TO ARCHIVE NOTIFICATION BANNER */}
            {readyToArchivePackages.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-amber-800" />
                  <span className="font-semibold text-amber-900">
                    Terdapat {readyToArchivePackages.length} paket siap diarsipkan (Progres &gt;= 80%)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const first = readyToArchivePackages[0];
                    setTargetPkgToArchive(first);
                    setBoxNumber(`BOX-2026-${first.procurementType}-${Math.floor(Math.random() * 90 + 10)}`);
                  }}
                  className="px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  + Arsipkan Sekarang
                </button>
              </div>
            )}

            {/* VIEW MODE 1: GRID FOLDERS (OS LAPTOP STYLE) */}
            {explorerViewMode === 'GRID' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayPackages.map((pkg) => {
                  const typeBadge = getProcurementTypeLabel(pkg.procurementType);
                  const pkgDocs = documents.filter((d) => d.packageId === pkg.id);
                  const isBarang = pkg.procurementType === 'BARANG';
                  const isKonsultansi = pkg.procurementType === 'KONSULTANSI';

                  let colorBorder = 'border-emerald-200 hover:border-emerald-500 bg-emerald-50/20';
                  let headerBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';

                  if (isBarang) {
                    colorBorder = 'border-rose-200 hover:border-[#701524] bg-rose-50/20';
                    headerBadgeClass = 'bg-rose-100 text-[#701524] border-rose-300';
                  } else if (isKonsultansi) {
                    colorBorder = 'border-indigo-200 hover:border-indigo-600 bg-indigo-50/20';
                    headerBadgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-300';
                  }

                  return (
                    <div
                      key={pkg.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between space-y-3 ${colorBorder}`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeBadge.badgeClass}`}>
                            {typeBadge.label}
                          </span>

                          {pkg.isArchived ? (
                            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{pkg.archiveBoxNumber || 'TERARSIP'}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 font-bold">
                              Progres: {pkg.overallProgress}%
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-stone-900 text-xs sm:text-sm leading-snug line-clamp-2">
                          {pkg.name}
                        </h3>

                        <div className="p-2.5 bg-white/90 rounded-xl border border-stone-200/80 text-[11px] space-y-1 font-mono">
                          <div className="flex items-center justify-between text-stone-600">
                            <span>RUP: {pkg.codeRUP}</span>
                            <span className="font-bold text-stone-900">{formatRupiah(pkg.hpsValue)}</span>
                          </div>
                          <div className="text-[10px] text-stone-500 truncate">
                            SKPD: {pkg.skpdName}
                          </div>
                          <div className="text-[10px] text-stone-500 truncate">
                            Penyedia: <strong className="text-stone-800">{pkg.vendorName}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-stone-500 font-semibold">
                          📄 {pkgDocs.length} Dokumen Digital
                        </span>

                        <div className="flex items-center gap-1.5">
                          {!pkg.isArchived && pkg.overallProgress >= 80 && (
                            <button
                              type="button"
                              onClick={() => {
                                setTargetPkgToArchive(pkg);
                                setBoxNumber(`BOX-2026-${pkg.procurementType}-${Math.floor(Math.random() * 90 + 10)}`);
                              }}
                              className="px-2.5 py-1 bg-[#701524] text-white rounded-lg text-[11px] font-bold shadow-2xs hover:bg-[#58101c] cursor-pointer"
                            >
                              Arsipkan
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedPackageForKendali(pkg)}
                            className="px-2.5 py-1 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-stone-500" />
                            <span>Lembar Kendali</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW MODE 2: TABLE LIST */}
            {explorerViewMode === 'LIST' && (
              <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 text-stone-700 text-[10px] font-bold uppercase tracking-wider border-b border-stone-200">
                      <th className="py-2.5 px-3">Mode & Paket Pengadaan</th>
                      <th className="py-2.5 px-3">SKPD & Penyedia</th>
                      <th className="py-2.5 px-3 text-right">Nilai HPS</th>
                      <th className="py-2.5 px-3 text-center">Status Box Arsip</th>
                      <th className="py-2.5 px-3 text-center">Aksi Lembar Kendali</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {displayPackages.map((pkg) => {
                      const typeBadge = getProcurementTypeLabel(pkg.procurementType);

                      return (
                        <tr key={pkg.id} className="hover:bg-stone-50">
                          <td className="py-2.5 px-3 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${typeBadge.badgeClass}`}>
                                {typeBadge.label}
                              </span>
                              <span className="text-[10px] font-mono text-stone-400">RUP: {pkg.codeRUP}</span>
                            </div>
                            <div className="font-bold text-stone-900 text-xs leading-snug">
                              {pkg.name}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-stone-600 space-y-0.5">
                            <div className="font-semibold text-stone-800">{pkg.skpdName}</div>
                            <div className="text-[10px] text-stone-400">Penyedia: {pkg.vendorName}</div>
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                            {formatRupiah(pkg.hpsValue)}
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            {pkg.isArchived ? (
                              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-bold border border-emerald-300 inline-block">
                                {pkg.archiveBoxNumber || 'TERARSIP'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-bold inline-block">
                                Belum Terarsip ({pkg.overallProgress}%)
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedPackageForKendali(pkg)}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#701524]" />
                              <span>Cetak Kendali</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* MODAL 1: INPUT NOMOR BOX ARSIP */}
      {targetPkgToArchive && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-stone-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-sm text-[#701524] flex items-center gap-1.5">
                <Box className="w-4 h-4 text-[#701524]" />
                <span>Arsipkan Paket PBJ Digital</span>
              </h3>
              <button
                type="button"
                onClick={() => setTargetPkgToArchive(null)}
                className="text-stone-400 hover:text-stone-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmArchive} className="space-y-3">
              <div>
                <span className="text-[10px] font-mono text-stone-400">Paket Terpilih:</span>
                <h4 className="text-xs font-bold text-stone-900 line-clamp-2">{targetPkgToArchive.name}</h4>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nomor Box Arsip Audit <span className="text-[#701524]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={boxNumber}
                  onChange={(e) => setBoxNumber(e.target.value)}
                  placeholder="BOX-2026-BARANG-01"
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Verifikator Audit Inspektorat
                </label>
                <input
                  type="text"
                  value={verifierName}
                  onChange={(e) => setVerifierName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetPkgToArchive(null)}
                  className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-medium text-stone-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#701524] hover:bg-[#58101c] text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                >
                  Simpan Arsip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2 / PRINTABLE: LEMBAR KENDALI REVIU AUDIT */}
      {selectedPackageForKendali && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[88vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#701524]" />
                <span>Lembar Kendali Pengawasan Audit Pengadaan Langsung</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintKendali}
                  className="px-3 py-1 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800 hover:bg-stone-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#701524]" />
                  <span>Cetak Kendali</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPackageForKendali(null)}
                  className="text-stone-400 hover:text-stone-600 font-bold text-xs p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="text-center pb-3 border-b border-stone-200 space-y-0.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  LEMBAR KENDALI DOKUMEN PENGADAAN LANGSUNG (E-ARSIP)
                </h2>
                <p className="text-[11px] text-stone-500">
                  Pemerintah Kabupaten Nagekeo • Perpres No. 12 Tahun 2021 & Standar LKPP
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs font-mono">
                <div>
                  <span className="text-stone-400 block text-[10px]">Nama Paket:</span>
                  <span className="font-bold text-stone-900">{selectedPackageForKendali.name}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Kode RUP:</span>
                  <span className="font-bold text-stone-800">{selectedPackageForKendali.codeRUP}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Nilai HPS:</span>
                  <span className="font-bold text-stone-900">{formatRupiah(selectedPackageForKendali.hpsValue)}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Penyedia Terpilih:</span>
                  <span className="font-bold text-stone-900">{selectedPackageForKendali.vendorName}</span>
                </div>
              </div>

              <table className="w-full border-collapse border border-stone-200 text-left text-xs">
                <thead>
                  <tr className="bg-stone-100 text-[10px] font-bold text-stone-700 uppercase">
                    <th className="border border-stone-200 p-2 w-8 text-center">No</th>
                    <th className="border border-stone-200 p-2">Daftar Dokumen Digital Kunci</th>
                    <th className="border border-stone-200 p-2 w-28 text-center">Status Digital</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {[
                    'Kerangka Acuan Kerja (KAK) & Spesifikasi Teknis',
                    'Perhitungan HPS & Kertas Kerja Pasar SBM',
                    'Dokumen DPA Alokasi Anggaran SKPD',
                    'Surat Permintaan Penawaran Resmi',
                    'Surat Penawaran Teknis & Harga Rekanan',
                    'Dokumen Kualifikasi Rekanan (NIB, KSWP Taxes)',
                    'Berita Acara Evaluasi Penawaran',
                    'Berita Acara Klarifikasi & Negosiasi Teknis/Harga',
                    'Berita Acara Hasil Pengadaan Langsung (BAHPL)',
                    'Surat Perintah Kerja (SPK) & BAST Final',
                  ].map((title, idx) => (
                    <tr key={idx}>
                      <td className="border border-stone-200 p-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-stone-200 p-2 font-semibold text-stone-800">{title}</td>
                      <td className="border border-stone-200 p-2 text-center text-emerald-800 font-bold text-[11px] bg-emerald-50/50">
                        ✓ Terverifikasi Sah
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-2 pt-4 text-center text-xs">
                <div>
                  <p className="text-stone-500 text-[11px]">Pejabat Pembuat Komitmen (PPK)</p>
                  <div className="h-12" />
                  <p className="font-bold underline text-stone-900">{selectedPackageForKendali.ppkName.split('(')[0]}</p>
                </div>
                <div>
                  <p className="text-stone-500 text-[11px]">Pejabat Pengadaan (PP)</p>
                  <div className="h-12" />
                  <p className="font-bold underline text-stone-900">{selectedPackageForKendali.ppName.split('(')[0]}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

