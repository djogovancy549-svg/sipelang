/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { uploadFileToDrive } from '../utils/webhookService';
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
  Image as ImageIcon,
  Camera,
  Trash2,
  Maximize2,
  Calendar,
  MapPin,
  Layers,
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
  // Main Sub-Tab State: 'DOCUMENTS' (Berkas Dokumen) vs 'VISUAL_DATA' (Data Visual Kegiatan)
  const [activeSubTab, setActiveSubTab] = useState<'DOCUMENTS' | 'VISUAL_DATA'>('DOCUMENTS');

  // Modal State for Standard Document Upload
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Modal State for Visual Photo Upload (Dedicated for max 10 photos)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Form State for Standard Documents
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    preselectedPackageId || (packages[0]?.id || '')
  );
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<DocumentCategory>('PERSIAPAN');
  
  // Form State for Standard Documents
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [uploaderRole, setUploaderRole] = useState('Pejabat Pembuat Komitmen (PPK)');

  // Form State for Dedicated Visual Activity Data (Max 10 Photos)
  const [photoPackageId, setPhotoPackageId] = useState<string>(
    preselectedPackageId || (packages[0]?.id || '')
  );
  const [photoActivityTitle, setPhotoActivityTitle] = useState('');
  const [photoLocation, setPhotoLocation] = useState('');
  const [photoDate, setPhotoDate] = useState(new Date().toISOString().slice(0, 10));
  const [photoNotes, setPhotoNotes] = useState('');
  const [photoFiles, setPhotoFiles] = useState<{ name: string; size: string; preview: string }[]>([]);

  // Filter & Search states for Documents
  const [filterPackageId, setFilterPackageId] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Selected document preview modal
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Selected photo lightbox modal
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const currentDocPackage = packages.find((p) => p.id === selectedPackageId) || packages[0];
  const currentPhotoPackage = packages.find((p) => p.id === photoPackageId) || packages[0];
  
  // Handler for standard document file input
  const handleDocFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedFileName(file.name);
      setSelectedFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    }
  };

  // Handler for photo activity files input (Max 10)
  const handlePhotoFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));

      if (imageFiles.length === 0) {
        showToast('Mohon pilih file gambar (JPG/PNG).', 'error');
        return;
      }

      const availableSlots = 10 - photoFiles.length;
      if (availableSlots <= 0) {
        showToast('Maksimum 10 foto telah tercapai.', 'error');
        return;
      }

      const selected = imageFiles.slice(0, availableSlots);
      const newPhotos = selected.map((file) => ({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        preview: URL.createObjectURL(file),
      }));

      setPhotoFiles((prev) => [...prev, ...newPhotos]);

      if (!photoActivityTitle && newPhotos.length > 0) {
        setPhotoActivityTitle(`Dokumentasi Visual Lapangan - ${new Date().toLocaleDateString('id-ID')}`);
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  // Standard Document Submit Handler
  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackageId) {
      showToast('Mohon pilih paket pengadaan terlebih dahulu.', 'error');
      return;
    }
    if (!docTitle.trim()) {
      showToast('Mohon isi judul dokumen pengadaan.', 'error');
      return;
    }
    if (!selectedFile) {
      showToast('Mohon pilih file berkas dokumen.', 'error');
      return;
    }

    try {
      const fileUrl = await uploadFileToDrive(selectedFile, 'DOCS');
      
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || 'pdf';
      
      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        packageId: selectedPackageId,
        title: docTitle.trim(),
        category: docCategory,
        fileName: selectedFile.name,
        fileSize: selectedFileSize,
        uploadDate: new Date().toISOString().slice(0, 10),
        uploadedBy: uploaderRole,
        reviewStatus: 'MENUNGGU_REVIEW',
        notes: docNotes.trim() || 'Dokumen diunggah untuk ditelaah kelayakan oleh Pejabat Pengadaan.',
        fileType: fileExtension.includes('doc') ? 'doc' : fileExtension.includes('xls') ? 'xls' : 'pdf',
        fileUrl: fileUrl, // Include the fileUrl
      };

      onDocumentUploaded(newDoc);
      setDocTitle('');
      setSelectedFile(null);
      setSelectedFileName('');
      setSelectedFileSize('');
      setDocNotes('');
      setIsDocModalOpen(false);
      showToast(`Berhasil mengunggah dokumen: "${newDoc.title}"`, 'success');
    } catch (error) {
      console.error(error);
      showToast('Gagal mengunggah file ke Drive.', 'error');
    }
  };

  // Visual Photo Submit Handler
  const handlePhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoPackageId) {
      showToast('Mohon pilih paket pengadaan.', 'error');
      return;
    }
    if (!photoActivityTitle.trim()) {
      showToast('Mohon isi judul kegiatan visual.', 'error');
      return;
    }
    if (photoFiles.length === 0) {
      showToast('Mohon pilih minimal 1 foto kegiatan.', 'error');
      return;
    }

    const totalMB = photoFiles.reduce((acc, f) => acc + parseFloat(f.size), 0).toFixed(1);

    const newVisualDoc: DocumentItem = {
      id: `visual-${Date.now()}`,
      packageId: photoPackageId,
      title: photoActivityTitle.trim(),
      category: 'DOKUMENTASI_FOTO',
      fileName: `GALERI-VISUAL-${photoFiles.length}-FOTO.zip`,
      fileSize: `${totalMB} MB (${photoFiles.length} Foto)`,
      uploadDate: photoDate || new Date().toISOString().slice(0, 10),
      uploadedBy: uploaderRole,
      reviewStatus: 'MENUNGGU_REVIEW',
      notes: photoNotes.trim() || `Dokumentasi visual kegiatan lapangan di ${photoLocation || 'Lokasi Pekerjaan'}.`,
      fileType: 'jpg',
      images: photoFiles.map((p) => p.preview),
    };

    onDocumentUploaded(newVisualDoc);
    setPhotoActivityTitle('');
    setPhotoLocation('');
    setPhotoNotes('');
    setPhotoFiles([]);
    setIsPhotoModalOpen(false);
    showToast(`Berhasil mengunggah ${newVisualDoc.images?.length} foto dokumentasi visual!`, 'success');
  };

  // Filtered lists
  const standardDocs = documents.filter((d) => d.category !== 'DOKUMENTASI_FOTO');
  const visualDocs = documents.filter((d) => d.category === 'DOKUMENTASI_FOTO');

  const filteredStandardDocs = standardDocs.filter((doc) => {
    const matchesPackage = filterPackageId === 'ALL' || doc.packageId === filterPackageId;
    const matchesCategory = filterCategory === 'ALL' || doc.category === filterCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPackage && matchesCategory && matchesSearch;
  });

  const filteredVisualDocs = visualDocs.filter((doc) => {
    const matchesPackage = filterPackageId === 'ALL' || doc.packageId === filterPackageId;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPackage && matchesSearch;
  });

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

      {/* 1. HERO HEADER */}
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
                Pengelolaan Dokumen & Data Visual Kegiatan
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
                Pusat pengunggahan resmi berkas KAK, HPS, Surat Penawaran, BA Negosiasi, SPK, BAST, serta galeri foto data visual kegiatan lapangan.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            {activeSubTab === 'DOCUMENTS' ? (
              <button
                onClick={() => setIsDocModalOpen(true)}
                className="w-full sm:w-auto px-5 py-3 bg-[#701524] hover:bg-[#58101c] text-white font-extrabold text-xs rounded-2xl transition-all shadow-md shadow-[#701524]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 group"
              >
                <Plus className="w-4.5 h-4.5 text-rose-200 group-hover:rotate-90 transition-transform" />
                <span>UNGGAH DOKUMEN</span>
              </button>
            ) : (
              <button
                onClick={() => setIsPhotoModalOpen(true)}
                className="w-full sm:w-auto px-5 py-3 bg-indigo-900 hover:bg-indigo-950 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md shadow-indigo-900/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 group"
              >
                <Camera className="w-4.5 h-4.5 text-indigo-200 group-hover:scale-110 transition-transform" />
                <span>UNGGAH FOTO KEGIATAN</span>
              </button>
            )}

            <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-2xl flex items-center gap-3 w-full sm:w-auto justify-around">
              <div className="text-center px-2">
                <div className="text-[10px] font-semibold text-stone-500">Dokumen</div>
                <div className="text-base font-extrabold font-mono text-stone-900">{standardDocs.length}</div>
              </div>
              <div className="h-7 w-px bg-stone-200" />
              <div className="text-center px-2">
                <div className="text-[10px] font-semibold text-indigo-600">Foto Kegiatan</div>
                <div className="text-base font-extrabold font-mono text-indigo-700">{visualDocs.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Nagekeo Slide Banner */}
        <NagekeoBannerSlider />

        {/* Running Text Marquee Info Ticker */}
        <MarqueeTicker />
      </div>

      {/* 2. SUB-TAB NAVIGATION BAR (CLEAN SEPARATION) */}
      <div className="flex items-center gap-2 bg-stone-200/80 p-1.5 rounded-2xl border border-stone-300/80">
        <button
          onClick={() => setActiveSubTab('DOCUMENTS')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'DOCUMENTS'
              ? 'bg-[#701524] text-white shadow-sm'
              : 'bg-transparent text-stone-700 hover:bg-stone-300/60'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>1. BERKAS DOKUMEN RESMI ({standardDocs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('VISUAL_DATA')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'VISUAL_DATA'
              ? 'bg-indigo-900 text-white shadow-sm'
              : 'bg-transparent text-stone-700 hover:bg-stone-300/60'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>2. DATA VISUAL & FOTO KEGIATAN ({visualDocs.length})</span>
        </button>
      </div>

      {/* TAB 1: STANDARD DOCUMENTS VIEW */}
      {activeSubTab === 'DOCUMENTS' && (
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 flex flex-col min-h-[550px]">
          
          {/* Header Controls & Filters */}
          <div className="space-y-3 pb-3 border-b border-stone-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                  <FolderOpen className="w-4.5 h-4.5 text-[#701524]" />
                  <span>Daftar Dokumen Resmi Pengadaan</span>
                  <span className="font-mono text-xs px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-full font-bold border border-stone-200">
                    {filteredStandardDocs.length} Dokumen
                  </span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Berkas resmi KAK, HPS, Surat Penawaran, BA Negosiasi, SPK, dan BAST.
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

          {/* Standard Document Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {filteredStandardDocs.length === 0 ? (
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
              filteredStandardDocs.map((doc) => {
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
      )}

      {/* TAB 2: DEDICATED VISUAL ACTIVITY DATA VIEW */}
      {activeSubTab === 'VISUAL_DATA' && (
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 flex flex-col min-h-[550px]">
          
          {/* Header Controls for Visual Activity Data */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                <Camera className="w-4.5 h-4.5 text-indigo-700" />
                <span>Galeri Data Visual & Foto Kegiatan Lapangan</span>
                <span className="font-mono text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold border border-indigo-200">
                  {filteredVisualDocs.length} Kegiatan Foto
                </span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Dokumentasi foto fisik pekerjaan, survei lapangan, dan serah terima pekerjaan (Maks 10 Foto per kegiatan).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPhotoModalOpen(true)}
                className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-indigo-200" />
                <span>+ UNGGAH FOTO BARU</span>
              </button>
            </div>
          </div>

          {/* Visual Activity Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {filteredVisualDocs.length === 0 ? (
              <div className="col-span-full py-16 text-center space-y-2 bg-indigo-50/20 rounded-2xl border border-dashed border-indigo-200">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-xs font-bold text-stone-800">Belum Ada Dokumentasi Foto Kegiatan</h3>
                <p className="text-[11px] text-stone-500">
                  Klik tombol "+ UNGGAH FOTO BARU" di atas untuk menambahkan dokumentasi visual kegiatan lapangan.
                </p>
              </div>
            ) : (
              filteredVisualDocs.map((doc) => {
                const pkg = packages.find((p) => p.id === doc.packageId);
                const images = doc.images || [];

                return (
                  <div
                    key={doc.id}
                    className="p-4 bg-stone-50/70 hover:bg-indigo-50/30 border border-stone-200/90 rounded-2xl transition-all space-y-3 group flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200">
                          📸 {images.length} FOTO KEGIATAN
                        </span>
                        <span className="text-[10px] font-mono text-stone-500 font-bold">
                          {formatDate(doc.uploadDate)}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-sm text-stone-900 group-hover:text-indigo-950 transition-colors leading-snug">
                          {doc.title}
                        </h3>
                        {pkg && (
                          <div className="text-[11px] text-stone-600 font-medium truncate flex items-center gap-1 mt-1">
                            <Briefcase className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate font-semibold">{pkg.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Photo Thumbnail Grid */}
                      {images.length > 0 && (
                        <div className="grid grid-cols-5 gap-1.5 pt-1">
                          {images.slice(0, 5).map((imgUrl, idx) => (
                            <div
                              key={idx}
                              onClick={() => setLightboxImage(imgUrl)}
                              className="aspect-square rounded-xl overflow-hidden border border-stone-200/90 cursor-zoom-in group/img relative bg-stone-200"
                            >
                              <img
                                src={imgUrl}
                                alt={`Foto ${idx + 1}`}
                                className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                              />
                              {idx === 4 && images.length > 5 && (
                                <div className="absolute inset-0 bg-stone-900/70 text-white text-xs font-black flex items-center justify-center backdrop-blur-2xs">
                                  +{images.length - 5}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {doc.notes && (
                        <p className="text-[11px] text-stone-600 italic bg-white p-2.5 rounded-xl border border-stone-200/70">
                          "{doc.notes}"
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between text-[11px] text-stone-500 font-medium">
                      <span>Oleh: <strong className="text-stone-800">{doc.uploadedBy}</strong></span>
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Semua Foto</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. MODAL 1: FORMULIR UNGGAH DOKUMEN RESMI */}
      {isDocModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8">
            <div className="bg-[#701524] text-white p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/10 text-white border border-white/20">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    Formulir Unggah Dokumen Resmi
                  </h2>
                  <p className="text-xs text-rose-100/80 mt-0.5">
                    Unggah berkas KAK, HPS, Surat Penawaran, BA Negosiasi, SPK, dan BAST.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="p-1.5 rounded-xl text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDocSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
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

                {currentDocPackage && (
                  <div className="p-3 bg-gradient-to-br from-stone-50 to-rose-50/40 rounded-xl border border-rose-200/80 text-xs space-y-1.5 mt-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-stone-900 line-clamp-2">{currentDocPackage.name}</span>
                      <span className="font-mono text-[10px] bg-[#701524] text-white px-2 py-0.5 rounded-md font-bold shrink-0">
                        RUP: {currentDocPackage.codeRUP}
                      </span>
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
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
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
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524] bg-white text-stone-900"
                />
              </div>

              {/* File Input */}
              <div>
                <label className="block text-xs font-extrabold text-stone-800 mb-1">
                  Pilih File Berkas (PDF, DOCX, XLSX, ZIP)
                </label>
                <div
                  onClick={() => document.getElementById('standard-doc-file-input')?.click()}
                  className="border-2 border-dashed border-stone-300 hover:border-[#701524] rounded-2xl p-4 text-center cursor-pointer bg-stone-50/70 hover:bg-rose-50/20 transition-all space-y-2 group"
                >
                  <input
                    id="standard-doc-file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                    onChange={handleDocFileInput}
                    className="hidden"
                  />

                  {selectedFileName ? (
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-stone-200 text-left">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getFileIcon(selectedFileName)}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-stone-900 truncate">{selectedFileName}</p>
                          <p className="text-[10px] text-stone-500 font-mono">{selectedFileSize}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFileName('');
                          setSelectedFileSize('');
                        }}
                        className="p-1 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 py-2">
                      <div className="w-10 h-10 rounded-full bg-rose-100 text-[#701524] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-extrabold text-stone-800">Klik untuk memilih file dokumen</p>
                      <p className="text-[11px] text-stone-500">PDF, Word (.docx), Excel (.xlsx), ZIP (Maks 25MB)</p>
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
                  placeholder="Catatan singkat..."
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524] bg-white text-stone-900"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#701524] hover:bg-[#58101c] text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>SIMPAN & UNGGAH DOKUMEN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL 2: DEDICATED FORMULIR UNGGAH FOTO KEGIATAN (MAX 10 PHOTOS) */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8">
            <div className="bg-indigo-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/10 text-white border border-white/20">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    Unggah Data Visual & Foto Kegiatan (Maks 10 Foto)
                  </h2>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Dokumentasikan foto fisik pekerjaan, survei lokasi, dan hasil peninjauan lapangan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="p-1.5 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePhotoSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Target Package Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-stone-800 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Pilih Paket Pengadaan Target</span>
                  <span className="text-indigo-700">*</span>
                </label>
                <select
                  value={photoPackageId}
                  onChange={(e) => setPhotoPackageId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-900 bg-stone-50 text-stone-900"
                  required
                >
                  <option value="">-- Pilih Paket Pekerjaan --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      [{pkg.procurementType}] {pkg.name.slice(0, 48)}...
                    </option>
                  ))}
                </select>

                {currentPhotoPackage && (
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 text-xs space-y-1 mt-2">
                    <span className="font-bold text-stone-900">{currentPhotoPackage.name}</span>
                    <div className="flex justify-between text-[11px] text-stone-600 font-mono">
                      <span>RUP: {currentPhotoPackage.codeRUP}</span>
                      <span>HPS: {formatRupiah(currentPhotoPackage.hpsValue)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Location Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-stone-800 mb-1">
                    Judul Dokumentasi Kegiatan <span className="text-indigo-700">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Foto Fisik Lapangan Tahap 100%"
                    value={photoActivityTitle}
                    onChange={(e) => setPhotoActivityTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-900 bg-white text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-stone-800 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-500" />
                    <span>Lokasi Kegiatan</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Desa Rendu Tutubhada, Aesesa"
                    value={photoLocation}
                    onChange={(e) => setPhotoLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-900 bg-white text-stone-900"
                  />
                </div>
              </div>

              {/* Multi-Photo Dropzone (Max 10) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-extrabold text-stone-800">
                    Pilih / Tarik Foto Kegiatan (Maksimum 10 Foto)
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-700">
                    {photoFiles.length} / 10 Foto
                  </span>
                </div>

                <div
                  onClick={() => document.getElementById('visual-photo-file-input')?.click()}
                  className={`border-2 border-dashed border-indigo-300 hover:border-indigo-700 rounded-2xl p-4 text-center cursor-pointer bg-indigo-50/30 hover:bg-indigo-50/60 transition-all space-y-2 group ${
                    photoFiles.length >= 10 ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <input
                    id="visual-photo-file-input"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoFileInput}
                    className="hidden"
                  />

                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-extrabold text-stone-800">
                    Klik atau Tarik File Foto di Sini
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Format: JPG, PNG, WEBP (Bisa pilih hingga 10 foto sekaligus)
                  </p>
                </div>

                {/* Live Photo Grid Preview */}
                {photoFiles.length > 0 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {photoFiles.map((file, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl border border-stone-200 overflow-hidden group/thumb shadow-2xs">
                        <img src={file.preview} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 p-1 bg-stone-900/80 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer"
                          title="Hapus foto ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] font-mono rounded">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-extrabold text-stone-800 mb-1">Keterangan / Catatan Visual</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat mengenai progres fisik kegiatan..."
                  value={photoNotes}
                  onChange={(e) => setPhotoNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-900 bg-white text-stone-900"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>SIMPAN {photoFiles.length} FOTO KEGIATAN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DOCUMENT PREVIEW / GALLERY DRAWER MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between p-5 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 text-[#701524]">
                  {previewDoc.category === 'DOKUMENTASI_FOTO' ? <Camera className="w-5 h-5 text-indigo-700" /> : getFileIcon(previewDoc.fileName)}
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md">
                    {previewDoc.category.replace(/_/g, ' ')}
                  </span>
                  <h3 className="font-extrabold text-sm text-stone-900 mt-0.5">{previewDoc.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Photo Gallery if Photo Category */}
              {previewDoc.category === 'DOKUMENTASI_FOTO' && previewDoc.images && previewDoc.images.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-700" />
                    <span>Galeri Foto Kegiatan ({previewDoc.images.length} Foto)</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {previewDoc.images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setLightboxImage(imgUrl)}
                        className="aspect-[4/3] rounded-xl border border-stone-200 overflow-hidden shadow-2xs hover:scale-[1.02] transition-transform cursor-zoom-in relative group/img bg-stone-100"
                      >
                        <img src={imgUrl} className="w-full h-full object-cover" alt={`Foto ${idx + 1}`} />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Nama File:</span>
                    <strong className="font-mono text-stone-800">{previewDoc.fileName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Ukuran File:</span>
                    <strong className="font-mono text-stone-800">{previewDoc.fileSize}</strong>
                  </div>
                </div>
              )}

              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Tanggal Unggah:</span>
                  <strong className="font-mono text-stone-800">{formatDate(previewDoc.uploadDate)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Pengunggah:</span>
                  <strong className="text-stone-800">{previewDoc.uploadedBy}</strong>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-stone-800 block mb-1.5">Catatan/Keterangan:</span>
                <p className="p-3.5 bg-stone-50 rounded-xl text-xs text-stone-700 italic border border-stone-200 leading-relaxed">
                  "{previewDoc.notes || 'Tidak ada catatan khusus.'}"
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-stone-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2.5 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. FULLSCREEN LIGHTBOX FOR PHOTOS */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Enlarged visual photo"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
          />
        </div>
      )}
    </div>
  );
};
