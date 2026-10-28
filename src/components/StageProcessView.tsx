/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ProcurementPackage,
  StageKey,
  DocumentItem,
  ReviewStatus,
  ReviewMatrixItem,
  ReviewerRoleType,
} from '../types/procurement';
import { PROCUREMENT_STAGES } from '../data/procurementStages';
import { formatRupiah, getProcurementTypeLabel, formatDate } from '../utils/formatters';
import { ReviewMatrixModal } from './ReviewMatrixModal';
import { MainNavTab } from './Sidebar';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  GitMerge,
  CheckSquare,
  Square,
  ChevronRight,
  Save,
  FileText,
  ShieldCheck,
  ExternalLink,
  PlusCircle,
  Eye,
  Check,
  AlertTriangle,
  LayoutGrid,
  Table,
  Folder,
  Columns,
  FileSpreadsheet,
} from 'lucide-react';

interface StageProcessViewProps {
  packages: ProcurementPackage[];
  documents?: DocumentItem[];
  onUpdatePackageStage: (updatedPkg: ProcurementPackage) => void;
  selectedPackageId?: string;
  onNavigateTab?: (tab: MainNavTab) => void;
  onOpenReviewDoc?: (doc: DocumentItem) => void;
  onUpdateDocumentReview?: (docId: string, status: ReviewStatus, notes: string) => void;
}

export const StageProcessView: React.FC<StageProcessViewProps> = ({
  packages,
  documents = [],
  onUpdatePackageStage,
  selectedPackageId: initialPkgId,
  onNavigateTab,
  onOpenReviewDoc,
  onUpdateDocumentReview,
}) => {
  const [activePkgId, setActivePkgId] = useState<string>(
    initialPkgId || (packages[0]?.id || '')
  );
  const [activeStageKey, setActiveStageKey] = useState<StageKey>('PERSIAPAN_PPK');
  const [editNotes, setEditNotes] = useState('');

  // Selected document for direct inside-modal review
  const [modalReviewDoc, setModalReviewDoc] = useState<DocumentItem | null>(null);

  // View modes for stage document panel: CARD, TABLE, ICON, SPLIT
  const [docViewMode, setDocViewMode] = useState<'CARD' | 'TABLE' | 'ICON' | 'SPLIT'>('CARD');
  const [splitDocId, setSplitDocId] = useState<string | null>(null);

  const currentPkg = packages.find((p) => p.id === activePkgId) || packages[0];

  React.useEffect(() => {
    if (currentPkg) {
      setActiveStageKey(currentPkg.currentStage);
      const stageData = currentPkg.stages[currentPkg.currentStage];
      setEditNotes(stageData?.notes || '');
    }
  }, [currentPkg?.id]);

  if (!currentPkg) {
    return (
      <div className="bg-white border border-stone-200/90 rounded-xl p-8 text-center text-stone-500">
        <GitMerge className="w-8 h-8 text-stone-300 mx-auto mb-2" />
        <h3 className="font-bold text-stone-700 text-xs">Belum ada paket pengadaan terdaftar</h3>
      </div>
    );
  }

  const currentStageInfo = PROCUREMENT_STAGES.find((s) => s.key === activeStageKey)!;
  const currentStageState = currentPkg.stages[activeStageKey];
  const typeBadge = getProcurementTypeLabel(currentPkg.procurementType);

  // Map Stage to Document Categories
  const getDocumentsForCurrentStage = (): DocumentItem[] => {
    const pkgDocs = documents.filter((d) => d.packageId === currentPkg.id);
    if (pkgDocs.length === 0) return [];

    switch (activeStageKey) {
      case 'PERSIAPAN_PPK':
        return pkgDocs.filter(
          (d) =>
            d.category === 'PERSIAPAN' ||
            d.title.toLowerCase().includes('kak') ||
            d.title.toLowerCase().includes('hps')
        );
      case 'PERMINTAAN_PENAWARAN':
        return pkgDocs.filter(
          (d) =>
            d.category === 'PENAWARAN' ||
            d.title.toLowerCase().includes('permintaan') ||
            d.title.toLowerCase().includes('undangan')
        );
      case 'EVALUASI_PENAWARAN':
        return pkgDocs.filter(
          (d) =>
            d.category === 'PENAWARAN' ||
            d.category === 'EVALUASI_NEGOSIASI' ||
            d.title.toLowerCase().includes('penawaran') ||
            d.title.toLowerCase().includes('evaluasi')
        );
      case 'KLARIFIKASI_NEGOSIASI':
        return pkgDocs.filter(
          (d) =>
            d.category === 'EVALUASI_NEGOSIASI' ||
            d.title.toLowerCase().includes('klarifikasi') ||
            d.title.toLowerCase().includes('negosiasi')
        );
      case 'PENETAPAN_BAHPL':
        return pkgDocs.filter(
          (d) =>
            d.category === 'EVALUASI_NEGOSIASI' ||
            d.category === 'KONTRAK_HASIL' ||
            d.title.toLowerCase().includes('bahpl') ||
            d.title.toLowerCase().includes('penetapan')
        );
      case 'SPK_SELESAI':
        return pkgDocs.filter(
          (d) =>
            d.category === 'KONTRAK_HASIL' ||
            d.category === 'SERAH_TERIMA' ||
            d.title.toLowerCase().includes('spk') ||
            d.title.toLowerCase().includes('bast')
        );
      default:
        return pkgDocs;
    }
  };

  const stageDocs = getDocumentsForCurrentStage();
  // Fallback if filter is empty but package has documents
  const displayDocs = stageDocs.length > 0 ? stageDocs : documents.filter((d) => d.packageId === currentPkg.id);

  // Active split doc fallback
  const activeSplitDoc = displayDocs.find((d) => d.id === splitDocId) || displayDocs[0];

  const toggleChecklist = (checkId: string) => {
    const updatedStages = { ...currentPkg.stages };
    const currentList = updatedStages[activeStageKey].checklists;

    const newList = currentList.map((item) => {
      if (item.id === checkId) {
        return {
          ...item,
          isDone: !item.isDone,
          completedAt: !item.isDone ? new Date().toISOString().slice(0, 10) : undefined,
        };
      }
      return item;
    });

    updatedStages[activeStageKey] = {
      ...updatedStages[activeStageKey],
      checklists: newList,
    };

    const allChecklists = Object.values(updatedStages).flatMap((s) => s.checklists);
    const totalDone = allChecklists.filter((c) => c.isDone).length;
    const newProgress = Math.round((totalDone / Math.max(1, allChecklists.length)) * 100);

    const updatedPackage: ProcurementPackage = {
      ...currentPkg,
      overallProgress: newProgress,
      stages: updatedStages,
    };

    onUpdatePackageStage(updatedPackage);
  };

  const handleAdvanceStage = () => {
    const stageIndex = PROCUREMENT_STAGES.findIndex((s) => s.key === activeStageKey);
    const updatedStages = { ...currentPkg.stages };

    updatedStages[activeStageKey] = {
      ...updatedStages[activeStageKey],
      status: 'completed',
      completedDate: new Date().toISOString().slice(0, 10),
      notes: editNotes || updatedStages[activeStageKey].notes,
      checklists: updatedStages[activeStageKey].checklists.map((c) => ({ ...c, isDone: true })),
    };

    let nextStageKey = currentPkg.currentStage;
    if (stageIndex < PROCUREMENT_STAGES.length - 1) {
      nextStageKey = PROCUREMENT_STAGES[stageIndex + 1].key;
      updatedStages[nextStageKey] = {
        ...updatedStages[nextStageKey],
        status: 'in_progress',
        startDate: new Date().toISOString().slice(0, 10),
      };
      setActiveStageKey(nextStageKey);
    }

    const allChecklists = Object.values(updatedStages).flatMap((s) => s.checklists);
    const totalDone = allChecklists.filter((c) => c.isDone).length;
    const newProgress = Math.min(100, Math.round((totalDone / Math.max(1, allChecklists.length)) * 100));

    const updatedPackage: ProcurementPackage = {
      ...currentPkg,
      currentStage: nextStageKey,
      overallProgress: newProgress,
      stages: updatedStages,
      notes: editNotes ? editNotes : currentPkg.notes,
    };

    onUpdatePackageStage(updatedPackage);
  };

  const handleSaveNotes = () => {
    const updatedStages = { ...currentPkg.stages };
    updatedStages[activeStageKey] = {
      ...updatedStages[activeStageKey],
      notes: editNotes,
    };

    const updatedPackage: ProcurementPackage = {
      ...currentPkg,
      stages: updatedStages,
    };

    onUpdatePackageStage(updatedPackage);
  };

  const handleSaveMatrixEvaluation = (
    docId: string,
    newStatus: ReviewStatus,
    summaryNotes: string,
    _items: ReviewMatrixItem[],
    reviewerName: string,
    _reviewerRole: ReviewerRoleType
  ) => {
    if (onUpdateDocumentReview) {
      onUpdateDocumentReview(docId, newStatus, summaryNotes);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Package Picker */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-stone-900 tracking-tight">
            Tahapan Proses Pengadaan Langsung
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Pelacakan 6 alur pengadaan langsung LKPP & terintegrasi langsung dengan Matriks Review Dokumen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-500 font-medium shrink-0">Pilih Paket:</label>
          <select
            value={activePkgId}
            onChange={(e) => setActivePkgId(e.target.value)}
            className="py-1 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524] font-medium"
          >
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                [{pkg.procurementType}] {pkg.name.slice(0, 35)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Package Profile Summary */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeBadge.badgeClass}`}>
                {typeBadge.label}
              </span>
              <span className="text-xs font-mono text-stone-400">RUP: {currentPkg.codeRUP}</span>
              <span className="text-xs text-stone-300">·</span>
              <span className="text-xs font-mono text-stone-500">{currentPkg.skpdName}</span>
            </div>
            <h2 className="text-sm font-bold text-stone-900">{currentPkg.name}</h2>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <div className="font-mono text-base font-bold text-stone-900">{formatRupiah(currentPkg.hpsValue)}</div>
            <div className="text-[11px] text-[#701524] font-mono font-semibold">
              Progres: {currentPkg.overallProgress}%
            </div>
          </div>
        </div>

        {/* 6-Step Visual Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {PROCUREMENT_STAGES.map((stage) => {
            const stageData = currentPkg.stages[stage.key];
            const isCurrentActive = activeStageKey === stage.key;
            const isCompleted = stageData?.status === 'completed';
            const isInProgress = stageData?.status === 'in_progress';

            let borderClass = 'border-stone-200 bg-stone-50/60 text-stone-600';
            let iconBadge = <span className="font-mono text-[10px]">{stage.stepNumber}</span>;

            if (isCompleted) {
              borderClass = 'border-stone-300 bg-stone-100/70 text-stone-800';
              iconBadge = <CheckCircle2 className="w-3.5 h-3.5 text-stone-700" />;
            } else if (isInProgress) {
              borderClass = 'border-[#701524] bg-rose-50/50 text-[#701524] font-semibold';
              iconBadge = <Clock className="w-3.5 h-3.5 text-[#701524]" />;
            }

            return (
              <button
                key={stage.key}
                onClick={() => {
                  setActiveStageKey(stage.key);
                  setEditNotes(currentPkg.stages[stage.key]?.notes || '');
                }}
                className={`p-2.5 rounded-lg border text-left transition-all relative flex flex-col justify-between ${borderClass} ${
                  isCurrentActive ? 'ring-1 ring-[#701524] border-[#701524] shadow-2xs' : 'hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-4 h-4 rounded-full bg-white border border-stone-200 flex items-center justify-center font-bold">
                    {iconBadge}
                  </div>
                  <span className="text-[9px] font-mono uppercase text-stone-400">
                    {isCompleted ? 'Selesai' : isInProgress ? 'Aktif' : 'Antre'}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs leading-tight line-clamp-1">{stage.shortTitle}</h4>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Synchronized Document & Matrix Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0 mt-0.5 sm:mt-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-900">
              Integrasi Matriks Review Dokumen Tahap {currentStageInfo.stepNumber}: {currentStageInfo.shortTitle}
            </h4>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Setiap kriteria verifikasi pada tahap ini terhubung langsung dengan Matriks Penilaian KAK, HPS, DPA, Legalitas & SPK.
            </p>
          </div>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('review-dokumen')}
            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
          >
            <span>Buka Menu Review Dokumen</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Grid Pane - Spacious Split (5/12 Checklist vs 7/12 Document Workbench) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* Checklist & Verification Section (5 Columns) */}
        <div className="xl:col-span-5 bg-white border border-stone-200/90 rounded-xl shadow-xs p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-3 border-b border-stone-100 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#701524] text-white flex items-center justify-center text-xs font-bold font-mono">
                    {currentStageInfo.stepNumber}
                  </span>
                  <h3 className="font-bold text-sm text-stone-900">
                    {currentStageInfo.title}
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  {currentStageInfo.description}
                </p>
              </div>

              <span className="px-2.5 py-1 bg-stone-100 text-stone-700 font-mono text-[11px] rounded-lg font-bold shrink-0">
                {currentStageState?.checklists.filter((c) => c.isDone).length} / {currentStageState?.checklists.length} Verified
              </span>
            </div>

            {/* Checklist items */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-[#701524]" />
                <span>Verifikasi Pejabat Pengadaan & Tim Evaluator</span>
              </h4>

              <div className="space-y-2">
                {currentStageState?.checklists.map((check) => (
                  <div
                    key={check.id}
                    onClick={() => toggleChecklist(check.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      check.isDone
                        ? 'border-emerald-300 bg-emerald-50/30 text-stone-900 shadow-2xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                    }`}
                  >
                    <div className="pt-0.5 shrink-0">
                      {check.isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-300" />
                      )}
                    </div>
                    <div className="flex-1 text-xs space-y-1">
                      <span className="font-semibold text-stone-900 leading-snug block">
                        {check.text}
                      </span>

                      {/* Keterangan Hijau Bagian Bawahnya saat Dicentang */}
                      {check.isDone && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300/80 px-2.5 py-0.5 rounded-md w-fit">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Telah Diverifikasi Sah {check.completedAt ? `(${formatDate(check.completedAt)})` : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage Guidance Box */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
              <span className="font-bold text-stone-800 uppercase tracking-wider text-[10px] block text-stone-500">
                Kewenangan & Tugas Tahapan:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-rose-50/60 rounded-lg border border-rose-100">
                  <span className="font-bold text-[#701524] block">Pejabat Pengadaan:</span>
                  <p className="text-stone-600 leading-tight mt-0.5">Evaluasi penawaran, klarifikasi teknis, negosiasi harga, penetapan BAHPL.</p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-stone-200">
                  <span className="font-bold text-stone-800 block">PPK:</span>
                  <p className="text-stone-600 leading-tight mt-0.5">Menyusun KAK, HPS, Draft SPK & menerbitkan SPK final.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes and stage advance action */}
          <div className="pt-3 border-t border-stone-100 space-y-2 mt-2">
            <label className="block text-xs font-semibold text-stone-700">
              Catatan Tahapan:
            </label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Catatan hasil verifikasi, nomor surat, atau kesepakatan negosiasi..."
              className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
            />
            <div className="flex justify-between items-center pt-1">
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-3 py-1.5 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-stone-500" />
                <span>Simpan Catatan</span>
              </button>

              <button
                type="button"
                onClick={handleAdvanceStage}
                className="px-3.5 py-1.5 bg-[#701524] hover:bg-[#58101c] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selesaikan & Lanjut Tahap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stage Documents & Matrix Quick Review Panel with 7 Columns (Broad & Spacious) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="bg-white border border-stone-200/90 rounded-xl shadow-xs p-5 space-y-4">
            {/* Panel Toolbar with View Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 text-[#701524] rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                    Daftar Berkas Tahap Ini ({displayDocs.length})
                  </h3>
                  <p className="text-[11px] text-stone-400">Pilih mode tampilan berkas sesuai kenyamanan Anda</p>
                </div>
              </div>

              {/* View Mode Switches: Card, Table, Icon, Split */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-100 text-stone-600 text-xs">
                  <button
                    type="button"
                    onClick={() => setDocViewMode('CARD')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all flex items-center gap-1 cursor-pointer ${
                      docViewMode === 'CARD'
                        ? 'bg-[#701524] text-white shadow-2xs'
                        : 'hover:text-stone-900'
                    }`}
                    title="Mode Kartu"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>Kartu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocViewMode('TABLE')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all flex items-center gap-1 cursor-pointer ${
                      docViewMode === 'TABLE'
                        ? 'bg-[#701524] text-white shadow-2xs'
                        : 'hover:text-stone-900'
                    }`}
                    title="Mode Tabel"
                  >
                    <Table className="w-3 h-3" />
                    <span>Tabel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocViewMode('ICON')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all flex items-center gap-1 cursor-pointer ${
                      docViewMode === 'ICON'
                        ? 'bg-[#701524] text-white shadow-2xs'
                        : 'hover:text-stone-900'
                    }`}
                    title="Mode Ikon Grid"
                  >
                    <Folder className="w-3 h-3" />
                    <span>Ikon</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocViewMode('SPLIT')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all flex items-center gap-1 cursor-pointer ${
                      docViewMode === 'SPLIT'
                        ? 'bg-[#701524] text-white shadow-2xs'
                        : 'hover:text-stone-900'
                    }`}
                    title="Mode Split View"
                  >
                    <Columns className="w-3 h-3" />
                    <span>Split</span>
                  </button>
                </div>

                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('unggah-dokumen')}
                    className="text-[11px] text-[#701524] hover:underline font-semibold flex items-center gap-1 shrink-0"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>+ Unggah</span>
                  </button>
                )}
              </div>
            </div>

            {displayDocs.length === 0 ? (
              <div className="p-4 border border-dashed border-stone-200 rounded-xl bg-stone-50 text-center space-y-2">
                <FileText className="w-6 h-6 text-stone-300 mx-auto" />
                <p className="text-xs text-stone-500 font-medium">
                  Belum ada dokumen terunggah untuk tahap ini.
                </p>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('unggah-dokumen')}
                    className="px-3 py-1 bg-[#701524] text-white text-xs rounded-lg font-semibold inline-block"
                  >
                    + Unggah Dokumen
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* 1. MODE CARD */}
                {docViewMode === 'CARD' && (
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {displayDocs.map((doc) => {
                      const isApproved = doc.reviewStatus === 'DISETUJUI';
                      const isNeedsRevision = doc.reviewStatus === 'PERLU_PERBAIKAN';

                      return (
                        <div
                          key={doc.id}
                          className="p-3 border border-stone-200 rounded-xl bg-stone-50/50 hover:bg-stone-50 transition-all space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-stone-200 text-stone-700">
                                {doc.category}
                              </span>
                              <h4 className="font-bold text-xs text-stone-900 leading-snug truncate" title={doc.title}>
                                {doc.title}
                              </h4>
                              <p className="text-[10px] text-stone-400 font-mono">
                                {doc.fileName} • {doc.fileSize}
                              </p>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 border ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : isNeedsRevision
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                            >
                              {isApproved ? '✓ Disetujui' : isNeedsRevision ? '⚠ Perlu Perbaikan' : '⏳ Menunggu Review'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-stone-200/80 text-xs">
                            <button
                              type="button"
                              onClick={() => setModalReviewDoc(doc)}
                              className="px-2.5 py-1 bg-[#701524] hover:bg-[#59101c] text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-rose-200" />
                              <span>Matriks Review</span>
                            </button>

                            {onOpenReviewDoc ? (
                              <button
                                type="button"
                                onClick={() => onOpenReviewDoc(doc)}
                                className="px-2 py-1 border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-stone-500" />
                               <span>Detail Workbench</span>
                              </button>
                            ) : onNavigateTab ? (
                              <button
                                type="button"
                                onClick={() => onNavigateTab('review-dokumen')}
                                className="px-2 py-1 text-[#701524] hover:underline font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <span>Ke Workbench</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. MODE TABLE */}
                {docViewMode === 'TABLE' && (
                  <div className="border border-stone-200 rounded-xl overflow-hidden max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-stone-100 text-stone-700 text-[10px] font-bold uppercase tracking-wider border-b border-stone-200">
                          <th className="py-2 px-3">Berkas & Kategori</th>
                          <th className="py-2 px-2 text-center">Status</th>
                          <th className="py-2 px-2 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {displayDocs.map((doc) => {
                          const isApproved = doc.reviewStatus === 'DISETUJUI';
                          const isNeedsRevision = doc.reviewStatus === 'PERLU_PERBAIKAN';

                          return (
                            <tr key={doc.id} className="hover:bg-stone-50">
                              <td className="py-2 px-3 space-y-0.5">
                                <div className="font-bold text-stone-900 text-xs truncate max-w-[180px]" title={doc.title}>
                                  {doc.title}
                                </div>
                                <div className="text-[10px] text-stone-400 font-mono">
                                  {doc.category} • {doc.fileSize}
                                </div>
                              </td>

                              <td className="py-2 px-2 text-center">
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border inline-block ${
                                    isApproved
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : isNeedsRevision
                                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                                      : 'bg-amber-100 text-amber-800 border-amber-300'
                                  }`}
                                >
                                  {isApproved ? '✓ Sah' : isNeedsRevision ? 'Revisi' : 'Antre'}
                                </span>
                              </td>

                              <td className="py-2 px-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => setModalReviewDoc(doc)}
                                  className="px-2 py-0.5 bg-[#701524] text-white font-bold text-[10px] rounded hover:bg-[#59101c] transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Matriks</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 3. MODE ICON */}
                {docViewMode === 'ICON' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[520px] overflow-y-auto p-1">
                    {displayDocs.map((doc) => {
                      const isApproved = doc.reviewStatus === 'DISETUJUI';
                      const isNeedsRevision = doc.reviewStatus === 'PERLU_PERBAIKAN';

                      return (
                        <div
                          key={doc.id}
                          className="p-3.5 border border-stone-200 rounded-2xl bg-white hover:border-[#701524] hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="p-2.5 rounded-xl bg-rose-50 text-[#701524] border border-rose-100/90 group-hover:bg-[#701524] group-hover:text-white transition-colors shrink-0">
                                <FileText className="w-6 h-6" />
                              </div>
                              <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200/80">
                                {doc.category}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-bold text-xs text-stone-900 leading-snug line-clamp-2 group-hover:text-[#701524] transition-colors" title={doc.title}>
                                {doc.title}
                              </h4>
                              <p className="text-[10px] text-stone-400 font-mono mt-1">
                                {doc.fileName} ({doc.fileSize})
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2.5 border-t border-stone-100 text-xs">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : isNeedsRevision
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                            >
                              {isApproved ? '✓ Disetujui' : isNeedsRevision ? '⚠ Perlu Perbaikan' : '⏳ Menunggu Review'}
                            </span>

                            <button
                              type="button"
                              onClick={() => setModalReviewDoc(doc)}
                              className="px-2.5 py-1 bg-[#701524] hover:bg-[#59101c] text-white font-bold text-[11px] rounded-lg transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-rose-200" />
                              <span>Matriks</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. MODE SPLIT */}
                {docViewMode === 'SPLIT' && (
                  <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50 flex flex-col sm:flex-row min-h-[260px]">
                    {/* Left List */}
                    <div className="w-full sm:w-5/12 border-b sm:border-b-0 sm:border-r border-stone-200 bg-white p-2 space-y-1.5 max-h-[260px] overflow-y-auto shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1 block">
                        Pilih Berkas:
                      </span>
                      {displayDocs.map((doc) => {
                        const isSelected = activeSplitDoc?.id === doc.id;
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => setSplitDocId(doc.id)}
                            className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center justify-between gap-1 cursor-pointer ${
                              isSelected
                                ? 'bg-[#701524] text-white font-bold shadow-2xs'
                                : 'hover:bg-stone-100 text-stone-800'
                            }`}
                          >
                            <span className="truncate flex-1">{doc.title}</span>
                            <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-stone-400'}`} />
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Preview */}
                    <div className="w-full sm:w-7/12 p-3 bg-white flex flex-col justify-between space-y-3 min-h-[200px]">
                      {activeSplitDoc ? (
                        <>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-mono">
                                {activeSplitDoc.category}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  activeSplitDoc.reviewStatus === 'DISETUJUI'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : activeSplitDoc.reviewStatus === 'PERLU_PERBAIKAN'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {activeSplitDoc.reviewStatus}
                              </span>
                            </div>

                            <h4 className="font-bold text-xs text-stone-900 leading-snug">
                              {activeSplitDoc.title}
                            </h4>

                            <div className="text-[11px] text-stone-500 font-mono space-y-0.5 bg-stone-50 p-2 rounded-lg border border-stone-200/80">
                              <div>Berkas: {activeSplitDoc.fileName}</div>
                              <div>Ukuran: {activeSplitDoc.fileSize}</div>
                              <div>Pengunggah: {activeSplitDoc.uploadedBy}</div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setModalReviewDoc(activeSplitDoc)}
                              className="px-3 py-1.5 bg-[#701524] hover:bg-[#59101c] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-rose-200" />
                              <span>Buka Matriks Penilaian</span>
                            </button>

                            {onOpenReviewDoc && (
                              <button
                                type="button"
                                onClick={() => onOpenReviewDoc(activeSplitDoc)}
                                className="px-2.5 py-1.5 border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                Workbench
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-stone-400 text-center my-auto">Pilih berkas untuk melihat detail</div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Guidance Card */}
          <div className="bg-white border border-stone-200/90 rounded-xl shadow-xs p-4 space-y-2.5 text-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 pb-1.5 border-b border-stone-100">
              Kewenangan Tahapan
            </h3>

            <div className="p-2.5 bg-rose-50/40 rounded-lg border border-rose-100 text-[11px] space-y-1">
              <span className="font-bold text-[#701524] block">Tugas Pejabat Pengadaan:</span>
              <p className="text-stone-600 leading-relaxed">
                Melakukan evaluasi penawaran, klarifikasi teknis, negosiasi harga, dan menetapkan penyedia melalui BAHPL.
              </p>
            </div>

            <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-[11px] space-y-1">
              <span className="font-bold text-stone-800 block">Tugas PPK:</span>
              <p className="text-stone-600 leading-relaxed">
                Menyusun dokumen persiapan (KAK, HPS, Draft SPK) dan menerbitkan SPK setelah menerima BAHPL.
              </p>
            </div>

            <div className="p-2 border border-stone-200 rounded-lg bg-stone-50 text-[10px] text-stone-400 text-center font-mono mt-1">
              Paket ID: {currentPkg.id}
            </div>
          </div>
        </div>

      </div>

      {/* Embedded Review Matrix Modal for Direct In-Context Scoring */}
      {modalReviewDoc && (
        <ReviewMatrixModal
          isOpen={!!modalReviewDoc}
          onClose={() => setModalReviewDoc(null)}
          document={modalReviewDoc}
          procurementPackage={currentPkg}
          onSaveEvaluation={handleSaveMatrixEvaluation}
        />
      )}
    </div>
  );
};

