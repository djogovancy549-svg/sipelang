/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ProcurementPackage,
  DocumentItem,
} from '../types/procurement';
import { PROCUREMENT_STAGES } from '../data/procurementStages';
import { formatRupiah, formatDate, getProcurementTypeLabel, getReviewStatusBadge } from '../utils/formatters';
import {
  X,
  Building,
  User,
  Upload,
  GitMerge,
  CheckCircle2,
} from 'lucide-react';

interface PackageDetailModalProps {
  pkg: ProcurementPackage | null;
  documents: DocumentItem[];
  onClose: () => void;
  onOpenStageTracker: (pkg: ProcurementPackage) => void;
  onOpenUpload: (pkgId: string) => void;
  onReviewDoc: (doc: DocumentItem) => void;
}

export const PackageDetailModal: React.FC<PackageDetailModalProps> = ({
  pkg,
  documents,
  onClose,
  onOpenStageTracker,
  onOpenUpload,
  onReviewDoc,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'dokumen' | 'tahapan'>('info');

  if (!pkg) return null;

  const pkgDocs = documents.filter((d) => d.packageId === pkg.id);
  const typeBadge = getProcurementTypeLabel(pkg.procurementType);

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[88vh] shadow-xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-start justify-between bg-stone-50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeBadge.badgeClass}`}>
                {typeBadge.label}
              </span>
              {pkg.registerNumber && (
                <span className="font-mono text-[10px] text-[#701524] bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200/60 font-semibold">
                  {pkg.registerNumber}
                </span>
              )}
              <span className="text-xs font-mono text-stone-400">RUP: {pkg.codeRUP}</span>
              <span className="text-xs text-stone-300">·</span>
              <span className="text-xs font-mono text-stone-500">TA {pkg.fiscalYear}</span>
            </div>
            <h2 className="text-sm font-bold text-stone-900 leading-snug">
              {pkg.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtabs */}
        <div className="flex items-center gap-4 px-4 border-b border-stone-200 text-xs font-semibold text-stone-500 bg-white">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-2.5 border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-[#701524] text-[#701524] font-bold'
                : 'border-transparent hover:text-stone-700'
            }`}
          >
            Informasi
          </button>
          <button
            onClick={() => setActiveTab('dokumen')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'dokumen'
                ? 'border-[#701524] text-[#701524] font-bold'
                : 'border-transparent hover:text-stone-700'
            }`}
          >
            <span>Berkas ({pkgDocs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tahapan')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'tahapan'
                ? 'border-[#701524] text-[#701524] font-bold'
                : 'border-transparent hover:text-stone-700'
            }`}
          >
            <span>Alur Tahapan ({pkg.overallProgress}%)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'info' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5 p-3 bg-stone-50 rounded-lg border border-stone-200">
                <div>
                  <span className="text-stone-400 block text-[10px]">Nilai HPS PPK:</span>
                  <span className="text-xs font-bold font-mono text-stone-900">
                    {formatRupiah(pkg.hpsValue)}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Pagu Anggaran DPA:</span>
                  <span className="text-xs font-bold font-mono text-stone-700">
                    {formatRupiah(pkg.budgetCeiling)}
                  </span>
                </div>
                {pkg.negotiationValue && (
                  <div className="col-span-2 pt-1 border-t border-stone-200/60 flex justify-between">
                    <span className="text-[11px] text-stone-500">Hasil Negosiasi:</span>
                    <span className="font-mono font-bold text-[#701524]">{formatRupiah(pkg.negotiationValue)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 border border-stone-200 rounded-lg space-y-1">
                  <div className="font-bold text-stone-800 flex items-center gap-1 text-[11px]">
                    <User className="w-3 h-3 text-stone-500" />
                    <span>Pihak Terkait</span>
                  </div>
                  <div>Penyedia: <strong className="text-stone-900">{pkg.vendorName}</strong></div>
                  <div className="font-mono text-[10px] text-stone-400">NPWP: {pkg.vendorNpwp}</div>
                  <div>PPK: <span className="text-stone-800">{pkg.ppkName.split('(')[0]}</span></div>
                </div>

                <div className="p-2.5 border border-stone-200 rounded-lg space-y-1">
                  <div className="font-bold text-stone-800 flex items-center gap-1 text-[11px]">
                    <Building className="w-3 h-3 text-stone-500" />
                    <span>Lokasi & Jadwal</span>
                  </div>
                  <div>Lokasi: <span className="text-stone-800">{pkg.location}</span></div>
                  <div>Jangka Waktu: <strong className="font-mono">{pkg.executionDurationDays} Hari</strong></div>
                  <div>Batas: <span className="font-mono">{formatDate(pkg.deadlineDate)}</span></div>
                </div>
              </div>

              {pkg.notes && (
                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 text-[11px]">
                  <strong>Catatan:</strong> {pkg.notes}
                </div>
              )}
            </div>
          )}

          {activeTab === 'dokumen' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-stone-500">Daftar berkas terunggah:</span>
                <button
                  onClick={() => {
                    onClose();
                    onOpenUpload(pkg.id);
                  }}
                  className="px-2.5 py-1 bg-[#701524] hover:bg-[#58101c] text-white rounded text-[11px] font-medium flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>Unggah Berkas</span>
                </button>
              </div>

              <div className="divide-y divide-stone-100">
                {pkgDocs.length === 0 ? (
                  <div className="py-6 text-center text-stone-400 text-xs">
                    Belum ada berkas terunggah
                  </div>
                ) : (
                  pkgDocs.map((doc) => {
                    const badge = getReviewStatusBadge(doc.reviewStatus);
                    return (
                      <div key={doc.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-semibold text-stone-500 bg-stone-100 px-1 rounded">
                              {doc.category}
                            </span>
                            <span className={`text-[9px] font-semibold px-1 rounded border ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}>
                              {badge.label}
                            </span>
                          </div>
                          <h4 className="font-semibold text-stone-900 mt-0.5">{doc.title}</h4>
                        </div>
                        <button
                          onClick={() => {
                            onClose();
                            onReviewDoc(doc);
                          }}
                          className="px-2 py-0.5 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded text-[10px]"
                        >
                          Telaah
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'tahapan' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-stone-500">Alur tahapan LKPP:</span>
                <button
                  onClick={() => {
                    onClose();
                    onOpenStageTracker(pkg);
                  }}
                  className="px-2.5 py-1 bg-[#701524] hover:bg-[#58101c] text-white rounded text-[11px] font-medium flex items-center gap-1"
                >
                  <GitMerge className="w-3 h-3" />
                  <span>Buka Tracker</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {PROCUREMENT_STAGES.map((stage) => {
                  const isDone = pkg.stages[stage.key]?.status === 'completed';
                  return (
                    <div
                      key={stage.key}
                      className="p-2 border border-stone-200 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-stone-100 font-mono text-stone-700 flex items-center justify-center font-bold text-[9px]">
                          {stage.stepNumber}
                        </span>
                        <span className="font-medium text-stone-800">{stage.title}</span>
                      </div>
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-stone-700" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-lg text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
