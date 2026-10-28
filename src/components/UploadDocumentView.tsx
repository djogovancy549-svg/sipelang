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
import { formatDate, getReviewStatusBadge } from '../utils/formatters';
import {
  UploadCloud,
  FileText,
  FileUp,
  FolderOpen,
  Filter,
  FileCheck2,
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
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    preselectedPackageId || (packages[0]?.id || '')
  );
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('PERSIAPAN');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState('');
  const [notes, setNotes] = useState('');
  const [uploaderRole, setUploaderRole] = useState('Pejabat Pembuat Komitmen (PPK)');
  const [filterPackageId, setFilterPackageId] = useState<string>('ALL');

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

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackageId) {
      alert('Mohon pilih paket pengadaan.');
      return;
    }
    if (!title.trim()) {
      alert('Mohon isi judul dokumen pengadaan.');
      return;
    }

    const docName = selectedFileName || `${title.replace(/\s+/g, '_')}.pdf`;
    const docSize = selectedFileSize || '2.1 MB';

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      packageId: selectedPackageId,
      title: title.trim(),
      category,
      fileName: docName,
      fileSize: docSize,
      uploadDate: new Date().toISOString().slice(0, 10),
      uploadedBy: `${uploaderRole}`,
      reviewStatus: 'MENUNGGU_REVIEW',
      notes: notes.trim() || 'Dokumen diunggah untuk ditelaah kelayakan oleh Pejabat Pengadaan.',
      fileType: 'pdf',
    };

    onDocumentUploaded(newDoc);
    setTitle('');
    setSelectedFileName('');
    setSelectedFileSize('');
    setNotes('');
    alert('Dokumen berhasil diunggah.');
  };

  const displayedDocs = documents.filter((d) => {
    if (filterPackageId === 'ALL') return true;
    return d.packageId === filterPackageId;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-50 text-[#701524] border border-rose-200/60">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-stone-900 tracking-tight">
              Unggah Dokumen Pengadaan Langsung
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Unggah berkas KAK, HPS, surat penawaran, berita acara negosiasi, dan draft SPK.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Upload Form Card */}
        <div className="lg:col-span-1 bg-white border border-stone-200/90 rounded-xl shadow-xs p-4 space-y-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 pb-2 border-b border-stone-100">
            <FileUp className="w-3.5 h-3.5 text-[#701524]" />
            <span>Formulir Unggah</span>
          </h2>

          <form onSubmit={handleUploadSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Pilih Paket Pengadaan <span className="text-[#701524]">*</span>
              </label>
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524] bg-white"
                required
              >
                <option value="">-- Pilih Paket Pekerjaan --</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    [{pkg.procurementType}] {pkg.name.slice(0, 40)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Kategori Berkas <span className="text-[#701524]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524] bg-white"
              >
                <option value="PERSIAPAN">Dokumen Persiapan PPK (KAK / HPS / Draft SPK)</option>
                <option value="PENAWARAN">Dokumen Penawaran Rekanan</option>
                <option value="EVALUASI_NEGOSIASI">Berita Acara Evaluasi & Negosiasi</option>
                <option value="KONTRAK_HASIL">Dokumen Hasil & Kontrak (BAHPL / SPK)</option>
                <option value="SERAH_TERIMA">Serah Terima & BAST</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Judul Dokumen <span className="text-[#701524]">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Dokumen Spesifikasi Teknis Final"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
              />
            </div>

            {/* Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Pilih Berkas (PDF, DOCX)
              </label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleSimulatedDrop}
                className="border border-dashed border-stone-300 hover:border-[#701524] rounded-lg p-3 text-center cursor-pointer bg-stone-50/50 hover:bg-rose-50/20 transition-colors"
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <FileText className="w-5 h-5 text-stone-400 mx-auto mb-1" />
                {selectedFileName ? (
                  <div>
                    <p className="text-xs font-semibold text-stone-800 break-all">{selectedFileName}</p>
                    <p className="text-[10px] text-stone-400 font-mono">{selectedFileSize}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-stone-600 font-medium">Klik untuk memilih file</p>
                    <p className="text-[10px] text-stone-400">PDF, DOCX, XLSX</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Pengunggah</label>
              <select
                value={uploaderRole}
                onChange={(e) => setUploaderRole(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524] bg-white"
              >
                <option value="Pejabat Pembuat Komitmen (PPK)">Pejabat Pembuat Komitmen (PPK)</option>
                <option value="Calon Rekanan / Pelaku Usaha">Calon Rekanan / Pelaku Usaha</option>
                <option value="Pejabat Pengadaan (PP)">Pejabat Pengadaan (PP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Catatan</label>
              <textarea
                rows={2}
                placeholder="Catatan berkas..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#701524] hover:bg-[#58101c] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Unggah Dokumen</span>
            </button>
          </form>
        </div>

        {/* Uploaded Documents List */}
        <div className="lg:col-span-2 bg-white border border-stone-200/90 rounded-xl shadow-xs p-4 flex flex-col space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
            <div>
              <h2 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-[#701524]" />
                <span>Dokumen Terunggah ({displayedDocs.length})</span>
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-stone-400" />
              <select
                value={filterPackageId}
                onChange={(e) => setFilterPackageId(e.target.value)}
                className="py-1 px-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
              >
                <option value="ALL">Semua Paket</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name.slice(0, 25)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-stone-100 overflow-y-auto max-h-[520px] pr-1">
            {displayedDocs.map((doc) => {
              const statusBadge = getReviewStatusBadge(doc.reviewStatus);

              return (
                <div key={doc.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-rose-50/15 p-2 rounded-lg transition-colors">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded">
                        {doc.category}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.2 rounded border ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}>
                        {statusBadge.label}
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">{doc.fileSize}</span>
                    </div>

                    <h4 className="font-semibold text-xs text-stone-900 truncate">
                      {doc.title}
                    </h4>

                    <div className="text-[11px] text-stone-500 flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-stone-400">{doc.fileName}</span>
                      <span>·</span>
                      <span>Oleh: {doc.uploadedBy}</span>
                      <span>·</span>
                      <span className="font-mono">{formatDate(doc.uploadDate)}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={() => onReviewDocument(doc)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#701524] hover:bg-[#58101c] text-white transition-colors flex items-center gap-1"
                    >
                      <FileCheck2 className="w-3 h-3" />
                      <span>Telaah</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
