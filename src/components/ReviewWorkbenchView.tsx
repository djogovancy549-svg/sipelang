/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  DocumentItem,
  ProcurementPackage,
  ReviewStatus,
  ReviewMatrixItem,
  ReviewerRoleType,
} from '../types/procurement';
import { formatDate, formatRupiah, getReviewStatusBadge } from '../utils/formatters';
import { DocumentDetailModal } from './DocumentDetailModal';
import { DEFAULT_REVIEW_MATRIX_ITEMS } from '../data/reviewMatrixTemplates';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building,
  TableProperties,
  LayoutGrid,
  List,
  Table,
  Folder,
  FileText,
  Calendar,
  User,
  ArrowRight,
} from 'lucide-react';

interface ReviewWorkbenchViewProps {
  documents: DocumentItem[];
  packages: ProcurementPackage[];
  onUpdateDocumentReview: (docId: string, status: ReviewStatus, notes: string) => void;
  selectedDocId?: string;
}

export const ReviewWorkbenchView: React.FC<ReviewWorkbenchViewProps> = ({
  documents,
  packages,
  onUpdateDocumentReview,
  selectedDocId: initialDocId,
}) => {
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'CARD' | 'TABLE' | 'ICON' | 'SPLIT'>('CARD');

  // Document selected for full detail modal
  const [selectedDocForModal, setSelectedDocForModal] = useState<DocumentItem | null>(null);

  // Matrix items cached by doc id
  const [matrixState, setMatrixState] = useState<Record<string, ReviewMatrixItem[]>>({});

  const [activeDocId, setActiveDocId] = useState<string>(
    initialDocId || (documents[0]?.id || '')
  );

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];
  const activePackage = activeDoc ? packages.find((p) => p.id === activeDoc.packageId) : undefined;

  const getDocMatrixItems = (docId: string): ReviewMatrixItem[] => {
    if (matrixState[docId]) return matrixState[docId];
    try {
      const cached = localStorage.getItem(`sipelang_matrix_${docId}`);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return DEFAULT_REVIEW_MATRIX_ITEMS;
  };

  const filteredDocs = documents.filter((doc) => {
    if (statusFilter === 'ALL') return true;
    return doc.reviewStatus === statusFilter;
  });

  const handleSaveMatrixEvaluation = (
    docId: string,
    newStatus: ReviewStatus,
    newNotes: string,
    items: ReviewMatrixItem[],
    reviewerName: string,
    reviewerRole: ReviewerRoleType
  ) => {
    setMatrixState((prev) => ({ ...prev, [docId]: items }));
    onUpdateDocumentReview(docId, newStatus, newNotes);
  };

  return (
    <div className="space-y-5">
      {/* Header Toolbar */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-stone-900 tracking-tight">
              Review Dokumen Pengadaan Langsung
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-[#701524] border border-rose-200">
              {viewMode === 'CARD' ? 'Mode Kartu' : viewMode === 'TABLE' ? 'Mode Tabel' : viewMode === 'ICON' ? 'Mode Ikon Grid' : 'Mode Split'}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Pilih mode Kartu, Tabel, Ikon, atau Split untuk menelaah KAK, HPS, dan Matriks Evaluasi Regulasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle Bar */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('CARD')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'CARD'
                  ? 'bg-[#701524] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-[#701524] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('ICON')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'ICON'
                  ? 'bg-[#701524] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Ikon</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('SPLIT')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'SPLIT'
                  ? 'bg-[#701524] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
          </div>

          {/* Filter Tab Status */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white font-semibold text-stone-900 shadow-2xs' : 'text-stone-600'
              }`}
            >
              Semua ({documents.length})
            </button>
            <button
              onClick={() => setStatusFilter('MENUNGGU_REVIEW')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                statusFilter === 'MENUNGGU_REVIEW'
                  ? 'bg-[#701524] font-semibold text-white shadow-2xs'
                  : 'text-stone-600'
              }`}
            >
              Perlu Review ({documents.filter((d) => d.reviewStatus === 'MENUNGGU_REVIEW').length})
            </button>
            <button
              onClick={() => setStatusFilter('DISETUJUI')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                statusFilter === 'DISETUJUI'
                  ? 'bg-stone-800 font-semibold text-white shadow-2xs'
                  : 'text-stone-600'
              }`}
            >
              Disetujui ({documents.filter((d) => d.reviewStatus === 'DISETUJUI').length})
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: CARD GRID VIEW (Warna Menarik & Diklik Muncul Modal) */}
      {viewMode === 'CARD' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium px-1">
            <span>Menampilkan {filteredDocs.length} Berkas Dokumen Pengadaan</span>
            <span className="text-[11px] text-stone-400">Klik kartu mana saja untuk menelaah</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => {
              const pkg = packages.find((p) => p.id === doc.packageId);
              const badge = getReviewStatusBadge(doc.reviewStatus);
              const items = getDocMatrixItems(doc.id);

              const totalItems = items.length;
              const totalMemenuhi = items.filter((i) => i.evaluationStatus === 'MEMENUHI').length;
              const fulfillmentRate = totalItems > 0 ? Math.round((totalMemenuhi / totalItems) * 100) : 0;

              const isApproved = doc.reviewStatus === 'DISETUJUI';
              const isNeedsRevision = doc.reviewStatus === 'PERLU_PERBAIKAN';

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocForModal(doc)}
                  className={`group bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 ${
                    isApproved
                      ? 'border-emerald-200/90 hover:border-emerald-400'
                      : isNeedsRevision
                      ? 'border-rose-200/90 hover:border-rose-400'
                      : 'border-stone-200 hover:border-[#701524]'
                  }`}
                >
                  <div
                    className={`h-1.5 w-full ${
                      isApproved
                        ? 'bg-emerald-600'
                        : isNeedsRevision
                        ? 'bg-rose-600'
                        : 'bg-[#701524]'
                    }`}
                  />

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 uppercase tracking-wider">
                          {doc.category}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <h3 className="font-bold text-stone-900 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-[#701524] transition-colors">
                        {doc.title}
                      </h3>

                      {pkg && (
                        <div className="p-2 bg-stone-50 rounded-xl border border-stone-200/80 text-[11px] space-y-0.5">
                          <div className="font-semibold text-stone-800 flex items-center gap-1.5 truncate">
                            <Building className="w-3.5 h-3.5 text-[#701524] shrink-0" />
                            <span className="truncate">{pkg.name}</span>
                          </div>
                          <div className="text-[10px] text-stone-500 font-mono flex items-center justify-between">
                            <span>SKPD: {pkg.skpdName}</span>
                            <span className="text-[#701524] font-bold">{formatRupiah(pkg.hpsValue)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-stone-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-stone-400" />
                          <span className="truncate max-w-[130px]">{doc.uploadedBy.split(' ')[0]}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span>{formatDate(doc.uploadDate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-stone-50 p-2 rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#701524]" />
                          <span className="text-[11px] font-semibold text-stone-700">Matriks Kelaikan:</span>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            fulfillmentRate >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {fulfillmentRate}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-50/90 border-t border-stone-100 px-4 py-2.5 flex items-center justify-between text-xs group-hover:bg-rose-50/50 transition-colors">
                    <span className="text-[11px] font-semibold text-[#701524]">
                      Buka Review & Matriks
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#701524] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: TABLE VIEW (Mode Tampilan Tabel yang Rapi & Profesional) */}
      {viewMode === 'TABLE' && (
        <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-3.5 bg-stone-50 border-b border-stone-200/80 flex items-center justify-between text-xs font-medium text-stone-600">
            <span>Daftar Berkas Dokumen Pengadaan ({filteredDocs.length})</span>
            <span className="text-[11px] text-stone-400">Klik baris mana saja untuk menelaah dokumen</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100/90 text-stone-700 text-[11px] font-bold uppercase tracking-wider border-b border-stone-200">
                  <th className="py-3 px-3.5 w-10 text-center">No</th>
                  <th className="py-3 px-4 w-4/12">Judul & Nama Berkas</th>
                  <th className="py-3 px-4 w-3/12">Kategori & Paket Pengadaan</th>
                  <th className="py-3 px-3.5 w-2/12">Pengunggah & Tanggal</th>
                  <th className="py-3 px-3 text-center w-2/12">Matriks Kelaikan</th>
                  <th className="py-3 px-3 text-center w-2/12">Status Review</th>
                  <th className="py-3 px-3 text-center w-2/12">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredDocs.map((doc, idx) => {
                  const pkg = packages.find((p) => p.id === doc.packageId);
                  const badge = getReviewStatusBadge(doc.reviewStatus);
                  const items = getDocMatrixItems(doc.id);

                  const totalItems = items.length;
                  const totalMemenuhi = items.filter((i) => i.evaluationStatus === 'MEMENUHI').length;
                  const fulfillmentRate = totalItems > 0 ? Math.round((totalMemenuhi / totalItems) * 100) : 0;

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => setSelectedDocForModal(doc)}
                      className="hover:bg-rose-50/30 transition-colors cursor-pointer group"
                    >
                      {/* No */}
                      <td className="py-3 px-3.5 text-center font-mono text-stone-400 text-[11px] align-top">
                        {idx + 1}
                      </td>

                      {/* Judul & Nama Berkas */}
                      <td className="py-3 px-4 align-top space-y-0.5">
                        <div className="font-bold text-stone-900 group-hover:text-[#701524] transition-colors leading-snug">
                          {doc.title}
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono flex items-center gap-1">
                          <FileText className="w-3 h-3 text-[#701524]" />
                          <span>{doc.fileName}</span>
                          <span>({doc.fileSize})</span>
                        </div>
                      </td>

                      {/* Kategori & Paket */}
                      <td className="py-3 px-4 align-top space-y-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 uppercase tracking-wider inline-block">
                          {doc.category}
                        </span>
                        {pkg && (
                          <div className="text-[11px] text-stone-600 font-medium line-clamp-1">
                            {pkg.name} ({pkg.skpdName})
                          </div>
                        )}
                      </td>

                      {/* Pengunggah & Tanggal */}
                      <td className="py-3 px-3.5 align-top space-y-0.5 text-[11px] text-stone-600">
                        <div className="font-semibold text-stone-800 line-clamp-1">{doc.uploadedBy}</div>
                        <div className="font-mono text-[10px] text-stone-400">{formatDate(doc.uploadDate)}</div>
                      </td>

                      {/* Matriks Kelaikan */}
                      <td className="py-3 px-3 text-center align-top">
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            fulfillmentRate >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {fulfillmentRate}%
                        </span>
                      </td>

                      {/* Status Review */}
                      <td className="py-3 px-3 text-center align-top">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Aksi Button */}
                      <td className="py-3 px-3 text-center align-top">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocForModal(doc);
                          }}
                          className="px-2.5 py-1 bg-[#701524] hover:bg-[#58101c] text-white font-semibold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs mx-auto cursor-pointer"
                        >
                          <TableProperties className="w-3 h-3 text-rose-200" />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODE 3: ICON GRID VIEW */}
      {viewMode === 'ICON' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium px-1">
            <span>Menampilkan {filteredDocs.length} Ikon Berkas Dokumen</span>
            <span className="text-[11px] text-stone-400">Klik ikon berkas untuk menelaah</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {filteredDocs.map((doc) => {
              const badge = getReviewStatusBadge(doc.reviewStatus);
              const items = getDocMatrixItems(doc.id);
              const totalItems = items.length;
              const totalMemenuhi = items.filter((i) => i.evaluationStatus === 'MEMENUHI').length;
              const fulfillmentRate = totalItems > 0 ? Math.round((totalMemenuhi / totalItems) * 100) : 0;

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocForModal(doc)}
                  className="bg-white rounded-2xl border border-stone-200 hover:border-[#701524] hover:shadow-md transition-all p-3.5 flex flex-col justify-between items-center text-center cursor-pointer group space-y-2.5"
                >
                  <div className="p-3 bg-rose-50 rounded-2xl text-[#701524] group-hover:bg-[#701524] group-hover:text-white transition-colors border border-rose-100">
                    <FileText className="w-8 h-8" />
                  </div>

                  <div className="space-y-1 w-full">
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200 inline-block">
                      {doc.category}
                    </span>
                    <h3 className="font-bold text-stone-900 text-xs leading-snug line-clamp-2 group-hover:text-[#701524] transition-colors" title={doc.title}>
                      {doc.title}
                    </h3>
                    <p className="text-[10px] text-stone-400 font-mono truncate">{doc.fileSize}</p>
                  </div>

                  <div className="w-full pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                    <span className={`font-bold px-1.5 py-0.2 rounded border ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}>
                      {badge.label}
                    </span>
                    <span className="font-mono font-bold text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded">
                      {fulfillmentRate}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 4: SPLIT LIST VIEW (Tampilan Split) */}
      {viewMode === 'SPLIT' && activeDoc && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-white border border-stone-200/90 rounded-xl shadow-xs p-3.5 space-y-2 flex flex-col">
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider pb-1.5 border-b border-stone-100">
              Daftar Berkas ({filteredDocs.length})
            </div>

            <div className="divide-y divide-stone-100 overflow-y-auto max-h-[580px] space-y-1">
              {filteredDocs.map((doc) => {
                const pkg = packages.find((p) => p.id === doc.packageId);
                const badge = getReviewStatusBadge(doc.reviewStatus);
                const isSelected = doc.id === activeDoc.id;

                return (
                  <div
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#701524] text-white shadow-xs'
                        : 'hover:bg-rose-50/20 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${
                          isSelected
                            ? 'bg-rose-950/80 border-rose-800 text-rose-100'
                            : `${badge.bgClass} ${badge.textClass} ${badge.borderClass}`
                        }`}
                      >
                        {badge.label}
                      </span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-rose-200' : 'text-stone-400'}`}>
                        {formatDate(doc.uploadDate)}
                      </span>
                    </div>

                    <h4 className="font-semibold text-xs leading-snug line-clamp-1">
                      {doc.title}
                    </h4>

                    <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-rose-100/70' : 'text-stone-400'}`}>
                      Paket: {pkg?.name || doc.packageId}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-stone-200/90 rounded-xl shadow-xs p-5 space-y-4">
            <div className="pb-3 border-b border-stone-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-stone-400">{activeDoc.fileName}</span>
                <span className={`text-xs font-semibold px-2 py-0.2 rounded border ${getReviewStatusBadge(activeDoc.reviewStatus).bgClass} ${getReviewStatusBadge(activeDoc.reviewStatus).textClass}`}>
                  {getReviewStatusBadge(activeDoc.reviewStatus).label}
                </span>
              </div>

              <h2 className="text-sm font-bold text-stone-900">
                {activeDoc.title}
              </h2>

              {activePackage && (
                <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200/80 text-xs">
                  <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-stone-500" />
                    <span>{activePackage.name}</span>
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                    RUP: {activePackage.codeRUP} · HPS: {formatRupiah(activePackage.hpsValue)}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedDocForModal(activeDoc)}
              className="w-full py-3 px-4 bg-[#701524] hover:bg-[#58101c] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <TableProperties className="w-4 h-4 text-rose-200" />
              <span>Buka Review Modal & Matriks Penilaian</span>
            </button>
          </div>
        </div>
      )}

      {/* Render Full Document Detail Modal when any card or row is clicked */}
      {selectedDocForModal && (
        <DocumentDetailModal
          isOpen={!!selectedDocForModal}
          onClose={() => setSelectedDocForModal(null)}
          document={selectedDocForModal}
          procurementPackage={packages.find((p) => p.id === selectedDocForModal.packageId)}
          onUpdateDocumentReview={onUpdateDocumentReview}
          matrixItems={getDocMatrixItems(selectedDocForModal.id)}
          onSaveMatrixEvaluation={handleSaveMatrixEvaluation}
        />
      )}
    </div>
  );
};
