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
import { ReviewMatrixModal } from './ReviewMatrixModal';
import { DEFAULT_REVIEW_MATRIX_ITEMS } from '../data/reviewMatrixTemplates';
import {
  X,
  FileCheck2,
  Building,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  TableProperties,
  Clock,
  User,
  Calendar,
  FileText,
  Download,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem;
  procurementPackage?: ProcurementPackage;
  onUpdateDocumentReview: (docId: string, status: ReviewStatus, notes: string) => void;
  matrixItems: ReviewMatrixItem[];
  onSaveMatrixEvaluation: (
    docId: string,
    newStatus: ReviewStatus,
    newNotes: string,
    items: ReviewMatrixItem[],
    reviewerName: string,
    reviewerRole: ReviewerRoleType
  ) => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  isOpen,
  onClose,
  document,
  procurementPackage,
  onUpdateDocumentReview,
  matrixItems,
  onSaveMatrixEvaluation,
}) => {
  const [reviewNotes, setReviewNotes] = useState(document.notes || '');
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);

  if (!isOpen) return null;

  const currentBadge = getReviewStatusBadge(document.reviewStatus);

  // Matrix KPI Calculations
  const totalItems = matrixItems.length;
  const totalMemenuhi = matrixItems.filter((i) => i.evaluationStatus === 'MEMENUHI').length;
  const totalCatatan = matrixItems.filter((i) => i.evaluationStatus === 'ADA_CATATAN').length;
  const totalTidak = matrixItems.filter((i) => i.evaluationStatus === 'TIDAK_MEMENUHI').length;
  const fulfillmentRate = totalItems > 0 ? Math.round((totalMemenuhi / totalItems) * 100) : 0;

  const handleApprove = () => {
    onUpdateDocumentReview(
      document.id,
      'DISETUJUI',
      reviewNotes || 'Dokumen telah ditelaah dan dinyatakan memenuhi syarat kelayakan.'
    );
    onClose();
  };

  const handleRequestRevision = () => {
    if (!reviewNotes.trim()) {
      alert('Mohon cantumkan rincian perbaikan pada catatan.');
      return;
    }
    onUpdateDocumentReview(document.id, 'PERLU_PERBAIKAN', reviewNotes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header Modal Detail */}
        <div className="bg-gradient-to-r from-[#500e19] via-[#701524] to-[#881a2d] text-white p-4 sm:p-5 flex items-start justify-between shrink-0">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-300/30 text-[10px] font-bold uppercase tracking-wider text-rose-200">
                {document.category}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${currentBadge.bgClass} ${currentBadge.textClass} ${currentBadge.borderClass}`}>
                {currentBadge.label}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold tracking-tight leading-snug">
              {document.title}
            </h2>

            <div className="flex items-center gap-3 text-xs text-rose-200/90 pt-0.5">
              <span className="font-mono text-[11px]">{document.fileName}</span>
              <span>•</span>
              <span>{document.fileSize}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-rose-100 hover:text-white transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Context Package Card */}
          {procurementPackage && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Paket Pengadaan Terkait
                </span>
                <span className="font-mono text-[11px] text-[#701524] font-semibold">
                  RUP: {procurementPackage.codeRUP}
                </span>
              </div>

              <div className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
                <Building className="w-4 h-4 text-[#701524] shrink-0" />
                <span>{procurementPackage.name}</span>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-stone-600 pt-1 border-t border-stone-200/80">
                <span>SKPD: <strong>{procurementPackage.skpdName}</strong></span>
                <span className="font-mono text-[#701524] font-bold">
                  Nilai HPS: {formatRupiah(procurementPackage.hpsValue)}
                </span>
              </div>
            </div>
          )}

          {/* Meta Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white border border-stone-200 rounded-xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#701524] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-stone-400 font-medium">Pengunggah Dokumen</div>
                <div className="font-semibold text-stone-800 line-clamp-1">{document.uploadedBy}</div>
              </div>
            </div>

            <div className="p-3 bg-white border border-stone-200 rounded-xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#701524] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-stone-400 font-medium">Tanggal Unggah</div>
                <div className="font-semibold text-stone-800">{formatDate(document.uploadDate)}</div>
              </div>
            </div>

            <div className="p-3 bg-white border border-stone-200 rounded-xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#701524] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-stone-400 font-medium">Format & Ukuran Berkas</div>
                <div className="font-semibold text-stone-800 uppercase">{document.fileType} ({document.fileSize})</div>
              </div>
            </div>
          </div>

          {/* Matriks Kriteria Telaah Status Box */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#701524] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900">
                    Matriks Evaluasi Kriteria Regulasi PBJ
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {totalItems} Kriteria • {totalMemenuhi} Sesuai • {totalCatatan} Catatan • {totalTidak} Revisi
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
                  fulfillmentRate >= 80
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                Tingkat Kelaikan: {fulfillmentRate}%
              </span>
            </div>

            {/* Quick Button to open full matrix */}
            <button
              type="button"
              onClick={() => setIsMatrixModalOpen(true)}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[#500e19] to-[#701524] hover:from-[#400b14] hover:to-[#5c111e] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <TableProperties className="w-4 h-4 text-rose-200" />
              <span>Buka Matriks Penilaian Lengkap (Edit, Hapus & Tambah Kriteria)</span>
            </button>
          </div>

          {/* Reviewer Notes Textarea */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-800">
              Catatan Telaah Pejabat Pengadaan / Staf PBJ:
            </label>
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Tuliskan catatan hasil telaah, temuan bukti, atau arahan perbaikan..."
              className="w-full text-xs p-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#701524] bg-white"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-stone-100 border-t border-stone-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-stone-700 hover:bg-stone-200 font-medium rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRequestRevision}
              className="px-4 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[#701524] font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Minta Revisi</span>
            </button>

            <button
              type="button"
              onClick={handleApprove}
              className="px-5 py-2 bg-[#701524] hover:bg-[#58101c] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Setujui Dokumen</span>
            </button>
          </div>
        </div>

      </div>

      {/* Render ReviewMatrixModal when opened */}
      <ReviewMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        document={document}
        procurementPackage={procurementPackage}
        initialItems={matrixItems}
        onSaveEvaluation={(docId, newStatus, newNotes, items, name, role) => {
          setReviewNotes(newNotes);
          onSaveMatrixEvaluation(docId, newStatus, newNotes, items, name, role);
        }}
      />
    </div>
  );
};
