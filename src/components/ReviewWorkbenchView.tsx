/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  DocumentItem,
  ProcurementPackage,
  ReviewStatus,
} from '../types/procurement';
import { formatDate, formatRupiah, getReviewStatusBadge } from '../utils/formatters';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building,
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
  const [activeDocId, setActiveDocId] = useState<string>(
    initialDocId || (documents[0]?.id || '')
  );
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'ALL'>('ALL');
  const [reviewNotes, setReviewNotes] = useState('');

  const [checklist, setChecklist] = useState({
    kakCompliance: true,
    hpsValidity: true,
    budgetCeiling: true,
    vendorCompliance: true,
  });

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];
  const activePackage = activeDoc ? packages.find((p) => p.id === activeDoc.packageId) : undefined;

  React.useEffect(() => {
    if (activeDoc) {
      setReviewNotes(activeDoc.notes || '');
    }
  }, [activeDoc?.id]);

  const filteredDocs = documents.filter((doc) => {
    if (statusFilter === 'ALL') return true;
    return doc.reviewStatus === statusFilter;
  });

  const handleApprove = () => {
    if (!activeDoc) return;
    onUpdateDocumentReview(
      activeDoc.id,
      'DISETUJUI',
      reviewNotes || 'Dokumen telah ditelaah dan dinyatakan memenuhi syarat kelayakan.'
    );
    alert(`Dokumen "${activeDoc.title}" disetujui.`);
  };

  const handleRequestRevision = () => {
    if (!activeDoc) return;
    if (!reviewNotes.trim()) {
      alert('Mohon cantumkan rincian perbaikan.');
      return;
    }
    onUpdateDocumentReview(activeDoc.id, 'PERLU_PERBAIKAN', reviewNotes.trim());
    alert(`Catatan perbaikan telah disimpan.`);
  };

  if (!activeDoc) {
    return (
      <div className="bg-white border border-stone-200/90 rounded-xl p-8 text-center text-stone-500">
        <FileCheck2 className="w-8 h-8 text-stone-300 mx-auto mb-1" />
        <h3 className="font-bold text-stone-700 text-xs">Tidak ada dokumen</h3>
      </div>
    );
  }

  const currentBadge = getReviewStatusBadge(activeDoc.reviewStatus);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-stone-900 tracking-tight">
            Review Dokumen Pengadaan Langsung
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Telaah kesesuaian KAK, kewajaran HPS, dan kelengkapan administrasi penyedia.
          </p>
        </div>

        {/* Filter Tab Status */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              statusFilter === 'ALL' ? 'bg-white font-semibold text-stone-900 shadow-2xs' : 'text-stone-600'
            }`}
          >
            Semua ({documents.length})
          </button>
          <button
            onClick={() => setStatusFilter('MENUNGGU_REVIEW')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              statusFilter === 'MENUNGGU_REVIEW' ? 'bg-[#701524] font-semibold text-white shadow-2xs' : 'text-stone-600'
            }`}
          >
            Perlu Review ({documents.filter((d) => d.reviewStatus === 'MENUNGGU_REVIEW').length})
          </button>
          <button
            onClick={() => setStatusFilter('DISETUJUI')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              statusFilter === 'DISETUJUI' ? 'bg-stone-800 font-semibold text-white shadow-2xs' : 'text-stone-600'
            }`}
          >
            Disetujui ({documents.filter((d) => d.reviewStatus === 'DISETUJUI').length})
          </button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 Cols) */}
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

        {/* Right Column (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-stone-200/90 rounded-xl shadow-xs p-5 space-y-4">
          <div className="pb-3 border-b border-stone-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-stone-400">{activeDoc.fileName}</span>
              <span className={`text-xs font-semibold px-2 py-0.2 rounded border ${currentBadge.bgClass} ${currentBadge.textClass} ${currentBadge.borderClass}`}>
                {currentBadge.label}
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

          {/* Checklist */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#701524]" />
              <span>Kriteria Telaah Regulasi</span>
            </h3>

            <div className="space-y-1.5 text-xs">
              <label className="flex items-start gap-2 p-2 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.kakCompliance}
                  onChange={(e) => setChecklist({ ...checklist, kakCompliance: e.target.checked })}
                  className="mt-0.5 text-[#701524] focus:ring-[#701524]"
                />
                <div>
                  <span className="font-semibold text-stone-800">Spesifikasi Teknis / KAK Terukur</span>
                  <p className="text-[10px] text-stone-400">Volume, spesifikasi, dan jangka waktu jelas.</p>
                </div>
              </label>

              <label className="flex items-start gap-2 p-2 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.hpsValidity}
                  onChange={(e) => setChecklist({ ...checklist, hpsValidity: e.target.checked })}
                  className="mt-0.5 text-[#701524] focus:ring-[#701524]"
                />
                <div>
                  <span className="font-semibold text-stone-800">Perhitungan HPS Didukung Data Pasar</span>
                  <p className="text-[10px] text-stone-400">Didukung kertas kerja dan standar biaya masukan.</p>
                </div>
              </label>

              <label className="flex items-start gap-2 p-2 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.budgetCeiling}
                  onChange={(e) => setChecklist({ ...checklist, budgetCeiling: e.target.checked })}
                  className="mt-0.5 text-[#701524] focus:ring-[#701524]"
                />
                <div>
                  <span className="font-semibold text-stone-800">Tidak Melebihi Pagu Anggaran DPA</span>
                  <p className="text-[10px] text-stone-400">Alokasi anggaran mencukupi untuk membiayai HPS.</p>
                </div>
              </label>

              <label className="flex items-start gap-2 p-2 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.vendorCompliance}
                  onChange={(e) => setChecklist({ ...checklist, vendorCompliance: e.target.checked })}
                  className="mt-0.5 text-[#701524] focus:ring-[#701524]"
                />
                <div>
                  <span className="font-semibold text-stone-800">Legalitas & KSWP Rekanan Valid</span>
                  <p className="text-[10px] text-stone-400">NIB aktif dan Konfirmasi Status Wajib Pajak Valid.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Notes Area */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-stone-700">
              Catatan Telaah Pejabat Pengadaan:
            </label>
            <textarea
              rows={2}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Tuliskan catatan telaah atau arahan perbaikan..."
              className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
            />
          </div>

          {/* Action */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleRequestRevision}
              className="px-3 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[#701524] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Minta Revisi</span>
            </button>

            <button
              type="button"
              onClick={handleApprove}
              className="px-3.5 py-1.5 bg-[#701524] hover:bg-[#58101c] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Setujui Dokumen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
