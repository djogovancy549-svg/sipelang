/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ProcurementPackage,
  DocumentItem,
  DocumentCategory,
} from '../types/procurement';
import { formatDate, formatRupiah, getReviewStatusBadge } from '../utils/formatters';
import { NagekeoBannerSlider } from './NagekeoBannerSlider';
import { MarqueeTicker } from './MarqueeTicker';
import {
  UploadCloud,
  FileText,
  FolderOpen,
  FileCheck2,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileArchive,
  Search,
  X,
  Plus,
  Eye,
  Tag,
  UserCheck,
} from 'lucide-react';

interface UploadDocumentViewProps {
  packages: ProcurementPackage[];
  documents: DocumentItem[];
  onDocumentUploaded: (doc: DocumentItem) => void;
  onReviewDocument: (doc: DocumentItem) => void;
  preselectedPackageId?: string;
}

export const UploadDocumentView: React.FC<UploadDocumentViewProps> = ({
  packages,
  documents,
  onDocumentUploaded,
  onReviewDocument,
  preselectedPackageId,
}) => {
  // Modal State (Single Upload Modal)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Form State
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    preselectedPackageId || (packages[0]?.id || '')
  );
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('PERSIAPAN');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState('');
  const [notes, setNotes] = useState('');
  const [uploaderRole, setUploaderRole] = useState('Pejabat Pembuat Komitmen (PPK)');

  // Filter & Search states
  const [filterPackageId, setFilterPackageId] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Selected document preview modal
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const currentPackage = packages.find((p) => p.id === selectedPackageId) || packages[0];

  const handleSimulatedDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFileName(file.name);
      setSelectedFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
      setSelectedFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFileName('');
    setSelectedFileSize('');
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackageId) {
      showToast('Mohon pilih paket pengadaan terlebih dahulu.', 'error');
      return;
    }
    if (!title.trim()) {
      showToast('Mohon isi judul dokumen pengadaan.', 'error');
      return;
    }

    const fileExtension = selectedFileName ? selectedFileName.split('.').pop()?.toLowerCase() || 'pdf' : 'pdf';
    const docName = selectedFileName || `${title.replace(/\s+/g, '_')}.${fileExtension}`;
    const docSize = selectedFileSize || '2.4 MB';

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      packageId: selectedPackageId,
      title: title.trim(),
      category,
      fileName: docName,
      fileSize: docSize,
      uploadDate: new Date().toISOString().slice(0, 10),
      uploadedBy: uploaderRole,
      reviewStatus: 'MENUNGGU_REVIEW',
      notes: notes.trim() || 'Dokumen diunggah untuk ditelaah kelayakan oleh Pejabat Pengadaan.',
      fileType: fileExtension.includes('doc') ? 'doc' : fileExtension.includes('xls') ? 'xls' : 'pdf',
    };

    onDocumentUploaded(newDoc);
    setTitle('');
    setSelectedFileName('');
    setSelectedFileSize('');
    setNotes('');
    setIsUploadModalOpen(false);
    showToast(`Berhasil mengunggah dokumen: "${newDoc.title}"`, 'success');
  };

  // Filtered uploaded documents list
  const filteredDocs = documents.filter((doc) => {
    const matchesPackage = filterPackageId === 'ALL' || doc.packageId === filterPackageId;
    const matchesCategory = filterCategory === 'ALL' || doc.category === filterCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPackage && matchesCategory && matchesSearch;
  });

  // KPI stats
  const totalUploaded = documents.length;
  const pendingReview = documents.filter((d) => d.reviewStatus === 'MENUNGGU_REVIEW').length;
  const approvedDocs = documents.filter((d) => d.reviewStatus === 'DISETUJUI').length;

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (ext === 'zip' || ext === 'rar') return <FileArchive className="w-5 h-5 text-amber-600" />;
    if (ext === 'doc' || ext === 'docx') return <FileText className="w-5 h-5 text-blue-600" />;
    return <FileText className="w-5 h-5 text-rose-600" />;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : 'bg-rose-900 text-rose-100 border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/70 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. HERO HEADER WITH SINGLE PRIMARY UPLOAD BUTTON */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-sm gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-[#701524] text-white shadow-md shadow-[#701524]/20 shrink-0">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-100 text-[#701524] uppercase border border-rose-200">
                  SIPELANG Nagekeo
                </span>
                <span className="text-xs font-semibold text-stone-500">
                  E-Pengadaan Langsung TA 2026
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-0.5">
                Pengelolaan & Unggah Dokumen Pengadaan
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
                Pusat pengunggahan resmi berkas KAK, HPS, Surat Penawaran, BA Negosiasi, dan Draft SPK. Terintegrasi langsung dengan Lembar Telaah Matriks.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            {/* SINGLE PRIMARY UPLOAD BUTTON */}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 bg-[#701524] hover:bg-[#58101c] text-white font-extrabold text-xs rounded-2xl transition-all shadow-md shadow-[#701524]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 group"
            >
              <Plus className="w-4.5 h-4.5 text-rose-200 group-hover:rotate-90 transition-transform" />
              <span>UNGGAH DOKUMEN</span>
            </button>

            <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-2xl flex items-center gap-3 w-full sm:w-auto justify-around">
              <div className="text-center px-2">
                <div className="text-[10px] font-semibold text-stone-500">Total</div>
                <div className="text-base font-extrabold font-mono text-stone-900">{totalUploaded}</div>
              </div>
              <div className="h-7 w-px bg-stone-200" />
              <div className="text-center px-2">
                <div className="text-[10px] font-semibold text-amber-600">Menunggu</div>
                <div className="text-base font-extrabold font-mono text-amber-700">{pendingReview}</div>
              </div>
              <div className="h-7 w-px bg-stone-200" />
              <div className="text-center px-2">
                <div className="text-[10px] font-semibold text-emerald-600">Disetujui</div>
                <div className="text-base font-extrabold font-mono text-emerald-700">{approvedDocs}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Nagekeo Slide Banner */}
        <NagekeoBannerSlider />

        {/* Running Text Marquee Info Ticker */}
        <MarqueeTicker />
      </div>

      {/* 2. UPLOADED DOCUMENTS WORKBENCH (FULL WIDTH) */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 flex flex-col min-h-[550px]">
        
        {/* Header Controls & Filters */}
        <div className="space-y-3 pb-3 border-b border-stone-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                <FolderOpen className="w-4.5 h-4.5 text-[#701524]" />
                <span>Daftar Dokumen Terunggah</span>
                <span className="font-mono text-xs px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-full font-bold border border-stone-200">
                  {filteredDocs.length} Dokumen
                </span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Kelola dan tinjau kelayakan berkas pengadaan langsung yang telah masuk ke sistem.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterPackageId}
                onChange={(e) => setFilterPackageId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524] text-stone-800 cursor-pointer"
              >
                <option value="ALL">🌐 Semua Paket Pengadaan</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.procurementType}] {p.name.slice(0, 30)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Bar & Category Filter Pills */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul berkas, nama file, pengunggah, atau paket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'ALL', label: 'Semua Dokumen' },
                { id: 'PERSIAPAN', label: '📁 Persiapan PPK' },
                { id: 'PENAWARAN', label: '📑 Penawaran Rekanan' },
                { id: 'EVALUASI_NEGOSIASI', label: '⚖️ BA Negosiasi' },
                { id: 'KONTRAK_HASIL', label: '✍️ SPK / Kontrak' },
                { id: 'SERAH_TERIMA', label: '📦 BAST' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    filterCategory === cat.id
                      ? 'bg-[#701524] text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Document Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {filteredDocs.length === 0 ? (
            <div className="col-span-full py-16 text-center space-y-2 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-stone-700">Tidak Ada Dokumen Ditemukan</h3>
              <p className="text-[11px] text-stone-400">
                Coba sesuaikan kata kunci pencarian atau klik "UNGGAH DOKUMEN" di atas.
              </p>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const statusBadge = getReviewStatusBadge(doc.reviewStatus);
              const pkg = packages.find((p) => p.id === doc.packageId);

              return (
                <div
                  key={doc.id}
                  className="p-4 bg-stone-50/60 hover:bg-rose-50/20 border border-stone-200/90 rounded-2xl transition-all space-y-3 group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-stone-200 text-stone-700">
                          {doc.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400 font-semibold shrink-0">
                        {doc.fileSize}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-white rounded-xl border border-stone-200 shadow-2xs shrink-0 mt-0.5">
                        {getFileIcon(doc.fileName)}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <h3 className="font-extrabold text-xs text-stone-900 group-hover:text-[#701524] transition-colors leading-snug line-clamp-2">
                          {doc.title}
                        </h3>
                        {pkg && (
                          <div className="text-[11px] text-stone-500 font-medium truncate flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-stone-400 shrink-0" />
                            <span className="truncate">{pkg.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between text-[11px] text-stone-500 gap-2">
                    <div className="truncate">
                      <span className="font-semibold text-stone-800">{doc.uploadedBy}</span>
                      <span className="mx-1">•</span>
                      <span className="font-mono text-stone-400">{formatDate(doc.uploadDate)}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                        title="Detail Berkas"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onReviewDocument(doc)}
                        className="px-2.5 py-1.5 bg-[#701524] hover:bg-[#58101c] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Buka Lembar Telaah Matriks"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Telaah</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. SINGLE MODAL POP-UP UPLOAD DIALOG */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-[#701524] text-white p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/10 text-white border border-white/20">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    Formulir Unggah Dokumen Pengadaan
                  </h2>
                  <p className="text-xs text-rose-100/80 mt-0.5">
                    Unggah berkas KAK, HPS, Surat Penawaran, BA Negosiasi, dan Draft SPK.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-xl text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Target Package Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-stone-800 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-[#701524]" />
                  <span>Pilih Paket Pengadaan Target</span>
                  <span className="text-[#701524]">*</span>
                </label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524] bg-stone-50 text-stone-900"
                  required
                >
                  <option value="">-- Pilih Paket Pekerjaan --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      [{pkg.procurementType}] {pkg.name.slice(0, 48)}...
                    </option>
                  ))}
                </select>

                {currentPackage && (
                  <div className="p-3 bg-gradient-to-br from-stone-50 to-rose-50/40 rounded-xl border border-rose-200/80 text-xs space-y-1.5 mt-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-stone-900 line-clamp-2">{currentPackage.name}</span>
                      <span className="font-mono text-[10px] bg-[#701524] text-white px-2 py-0.5 rounded-md font-bold shrink-0">
                        RUP: {currentPackage.codeRUP}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-rose-100 text-[11px]">
                      <div>
                        <span className="text-stone-500 block text-[10px]">Nilai HPS</span>
                        <strong className="font-mono text-[#701524]">{formatRupiah(currentPackage.hpsValue)}</strong>
                      </div>
                      <div className="truncate">
                        <span className="text-stone-500 block text-[10px]">SKPD / Instansi</span>
                        <strong className="text-stone-800 truncate block">{currentPackage.skpdName}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-extrabold text-stone-800 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-[#701524]" />
                  <span>Kategori Dokumen Pengadaan</span>
                  <span className="text-[#701524]">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                  className="w-full px-3 py-2 text-xs font-medium border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524] bg-white text-stone-800"
                >
                  <option value="PERSIAPAN">📁 Dokumen Persiapan PPK (KAK / HPS / Draft SPK)</option>
                  <option value="PENAWARAN">📑 Dokumen Penawaran Rekanan / Penyedia</option>
                  <option value="EVALUASI_NEGOSIASI">⚖️ Berita Acara Evaluasi & Negosiasi (BAHPL)</option>
                  <option value="KONTRAK_HASIL">✍️ Dokumen Kontrak / SPK / Surat Pesanan</option>
                  <option value="SERAH_TERIMA">📦 Berita Acara Serah Terima (BAST)</option>
                </select>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-extrabold text-stone-800 mb-1">
                  Judul Dokumen <span className="text-[#701524]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dokumen Spesifikasi Teknis & KAK Final"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524] bg-white text-stone-900 placeholder:text-stone-400"
                />
              </div>

              {/* Drag & Drop File Box */}
              <div>
                <label className="block text-xs font-extrabold text-stone-800 mb-1">
                  Pilih File Berkas (PDF, DOCX, XLSX, ZIP)
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleSimulatedDrop}
                  onClick={() => document.getElementById('single-modal-file-input')?.click()}
                  className="border-2 border-dashed border-stone-300 hover:border-[#701524] rounded-2xl p-4 text-center cursor-pointer bg-stone-50/70 hover:bg-rose-50/20 transition-all space-y-2 group"
                >
                  <input
                    id="single-modal-file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                    onChange={handleFileInput}
                    className="hidden"
                  />

                  {selectedFileName ? (
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-stone-200 shadow-2xs text-left">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getFileIcon(selectedFileName)}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-stone-900 truncate">{selectedFileName}</p>
                          <p className="text-[10px] text-stone-500 font-mono">{selectedFileSize}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="p-1 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Hapus pilihan file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 py-2">
                      <div className="w-10 h-10 rounded-full bg-rose-100 text-[#701524] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-extrabold text-stone-800">
                        Klik atau Tarik File Berkas ke Sini
                      </p>
                      <p className="text-[11px] text-stone-500 font-medium">
                        PDF, Word (.docx), Excel (.xlsx), ZIP (Maks. 25MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Uploader Role */}
              <div>
                <label className="block text-xs font-extrabold text-stone-800 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-stone-500" />
                  <span>Jabatan / Peran Pengunggah</span>
                </label>
                <select
                  value={uploaderRole}
                  onChange={(e) => setUploaderRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524] bg-white text-stone-800"
                >
                  <option value="Pejabat Pembuat Komitmen (PPK)">Pejabat Pembuat Komitmen (PPK)</option>
                  <option value="Calon Rekanan / Pelaku Usaha">Calon Rekanan / Pelaku Usaha</option>
                  <option value="Pejabat Pengadaan (PP)">Pejabat Pengadaan (PP)</option>
                  <option value="Tim Evaluator / POKJA">Tim Evaluator / POKJA</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-extrabold text-stone-800 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan singkat substansi berkas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524] bg-white text-stone-900"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#701524] hover:bg-[#58101c] text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-[#701524]/20 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>SIMPAN & UNGGAH DOKUMEN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DOCUMENT PREVIEW MODAL DRAWER */}
      {previewDoc && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden space-y-4 p-5">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-[#701524]">
                  {getFileIcon(previewDoc.fileName)}
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md">
                    {previewDoc.category}
                  </span>
                  <h3 className="font-bold text-sm text-stone-900 mt-0.5">{previewDoc.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Nama File:</span>
                  <strong className="font-mono text-stone-800">{previewDoc.fileName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Ukuran File:</span>
                  <strong className="font-mono text-stone-800">{previewDoc.fileSize}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Tanggal Pengunggahan:</span>
                  <strong className="font-mono text-stone-800">{formatDate(previewDoc.uploadDate)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Pengunggah:</span>
                  <strong className="text-stone-800">{previewDoc.uploadedBy}</strong>
                </div>
              </div>

              <div>
                <span className="text-stone-500 block font-bold mb-1">Catatan Pengunggah:</span>
                <p className="p-3 bg-stone-50 rounded-xl text-stone-700 italic border border-stone-200">
                  "{previewDoc.notes || 'Tidak ada catatan khusus.'}"
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setPreviewDoc(null);
                  onReviewDocument(previewDoc);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#701524] hover:bg-[#58101c] rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Buka Lembar Telaah Matriks</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
