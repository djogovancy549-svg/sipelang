/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ProcurementPackage,
  StageKey,
  DocumentItem,
  ReviewStatus,
  ReviewMatrixItem,
  ReviewerRoleType,
  DocumentChecklistItem,
} from '../types/procurement';
import { PROCUREMENT_STAGES, getDefaultDocumentChecklist } from '../data/procurementStages';
import { formatRupiah, getProcurementTypeLabel, formatDate } from '../utils/formatters';
import { ReviewMatrixModal } from './ReviewMatrixModal';
import { MainNavTab } from './Sidebar';
import {
  CheckCircle2,
  Clock,
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
  Printer,
  Edit3,
  ListChecks,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Folder,
  Columns,
  Download,
  X,
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

// Fallback sample package if no packages exist in state
const DEFAULT_FALLBACK_PACKAGE: ProcurementPackage = {
  id: 'pkg-default-nagekeo',
  codeRUP: 'RUP-48920102',
  registerNumber: 'PL-PUPR-2026-001',
  name: 'Peningkatan Jalan Produksi Pasulewa Sub-Sektor Hortikultura',
  procurementType: 'KONSTRUKSI',
  fiscalYear: 2026,
  fundingSource: 'DAK',
  skpdName: 'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kab. Nagekeo',
  budgetCeiling: 198500000,
  hpsValue: 197800000,
  bidValue: 195200000,
  negotiationValue: 194500000,
  vendorName: 'CV. Nagekeo Konstruksi Utama',
  vendorNpwp: '73.812.392.1-924.000',
  ppkName: 'Drs. Antonius Ndoa, M.Si (PPK)',
  ppName: 'Bambang Pratama, S.Kom. (Pejabat Pengadaan)',
  location: 'Kecamatan Aesesa, Kabupaten Nagekeo',
  executionDurationDays: 60,
  createdDate: '2026-02-10',
  deadlineDate: '2026-04-10',
  currentStage: 'EVALUASI_PENAWARAN',
  overallProgress: 50,
  isArchived: false,
  stages: {
    PERSIAPAN_PPK: {
      stageKey: 'PERSIAPAN_PPK',
      status: 'completed',
      startDate: '2026-02-10',
      completedDate: '2026-02-12',
      notes: 'Dokumen KAK, HPS, dan DPA lengkap & diverifikasi.',
      checklists: [
        { id: 'prep-1', text: 'Spesifikasi Teknis / KAK telah diverifikasi', isDone: true },
        { id: 'prep-2', text: 'HPS ditandatangani PPK', isDone: true },
      ],
    },
    PERMINTAAN_PENAWARAN: {
      stageKey: 'PERMINTAAN_PENAWARAN',
      status: 'completed',
      startDate: '2026-02-13',
      completedDate: '2026-02-15',
      checklists: [{ id: 'req-1', text: 'Undangan disampaikan', isDone: true }],
    },
    EVALUASI_PENAWARAN: {
      stageKey: 'EVALUASI_PENAWARAN',
      status: 'in_progress',
      startDate: '2026-02-16',
      checklists: [{ id: 'eval-1', text: 'Evaluasi administrasi', isDone: true }],
    },
    KLARIFIKASI_NEGOSIASI: {
      stageKey: 'KLARIFIKASI_NEGOSIASI',
      status: 'pending',
      checklists: [],
    },
    PENETAPAN_BAHPL: {
      stageKey: 'PENETAPAN_BAHPL',
      status: 'pending',
      checklists: [],
    },
    SPK_SELESAI: {
      stageKey: 'SPK_SELESAI',
      status: 'pending',
      checklists: [],
    },
  },
  documentChecklist: getDefaultDocumentChecklist(),
};

export const StageProcessView: React.FC<StageProcessViewProps> = ({
  packages,
  documents = [],
  onUpdatePackageStage,
  selectedPackageId: initialPkgId,
  onNavigateTab,
  onOpenReviewDoc,
  onUpdateDocumentReview,
}) => {
  // Main sub-view tab: 'CHECKLIST_TABLE' (Default & Prominent) vs 'STAGE_WORKFLOW'
  const [activeSubTab, setActiveSubTab] = useState<'CHECKLIST_TABLE' | 'STAGE_WORKFLOW'>('CHECKLIST_TABLE');

  // Active selected package ID
  const effectivePackages = packages.length > 0 ? packages : [DEFAULT_FALLBACK_PACKAGE];
  const [activePkgId, setActivePkgId] = useState<string>(
    initialPkgId || (effectivePackages[0]?.id || DEFAULT_FALLBACK_PACKAGE.id)
  );

  const [activeStageKey, setActiveStageKey] = useState<StageKey>('PERSIAPAN_PPK');
  const [editNotes, setEditNotes] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Selected document for direct inside-modal review
  const [modalReviewDoc, setModalReviewDoc] = useState<DocumentItem | null>(null);

  // View modes for stage document panel: CARD, TABLE, ICON, SPLIT
  const [docViewMode, setDocViewMode] = useState<'CARD' | 'TABLE' | 'ICON' | 'SPLIT'>('CARD');
  const [splitDocId, setSplitDocId] = useState<string | null>(null);

  // Resolve current active package object
  const currentPkg = effectivePackages.find((p) => p.id === activePkgId) || effectivePackages[0] || DEFAULT_FALLBACK_PACKAGE;

  // Local state for interactive 8-item document checklist
  const [localChecklist, setLocalChecklist] = useState<DocumentChecklistItem[]>(() => {
    return currentPkg.documentChecklist && currentPkg.documentChecklist.length > 0
      ? currentPkg.documentChecklist
      : getDefaultDocumentChecklist();
  });

  // Sync state whenever active package changes
  useEffect(() => {
    if (currentPkg) {
      setActiveStageKey(currentPkg.currentStage);
      const stageData = currentPkg.stages[currentPkg.currentStage];
      setEditNotes(stageData?.notes || '');

      setLocalChecklist(
        currentPkg.documentChecklist && currentPkg.documentChecklist.length > 0
          ? currentPkg.documentChecklist
          : getDefaultDocumentChecklist()
      );
    }
  }, [currentPkg.id]);

  // Toggle single item in 8-item document checklist
  const handleToggleDocChecklist = (id: string) => {
    const updatedList = localChecklist.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          isDone: !item.isDone,
          date: !item.isDone ? new Date().toISOString().slice(0, 10) : item.date,
        };
      }
      return item;
    });

    setLocalChecklist(updatedList);

    const updatedPackage: ProcurementPackage = {
      ...currentPkg,
      documentChecklist: updatedList,
    };

    onUpdatePackageStage(updatedPackage);
  };

  // Inline update item number/date/notes
  const handleUpdateChecklistItemField = (
    id: string,
    field: 'documentNumber' | 'date' | 'notes',
    value: string
  ) => {
    const updatedList = localChecklist.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });

    setLocalChecklist(updatedList);

    const updatedPackage: ProcurementPackage = {
      ...currentPkg,
      documentChecklist: updatedList,
    };

    onUpdatePackageStage(updatedPackage);
  };

  // Toggle ALL checkmarks
  const handleToggleAllCheckmarks = (checkAll: boolean) => {
    const updatedList = localChecklist.map((item) => ({
      ...item,
      isDone: checkAll,
      date: checkAll ? new Date().toISOString().slice(0, 10) : item.date,
    }));

    setLocalChecklist(updatedList);

    const updatedPackage: ProcurementPackage = {
      ...currentPkg,
      documentChecklist: updatedList,
    };

    onUpdatePackageStage(updatedPackage);
  };

  const currentStageInfo = PROCUREMENT_STAGES.find((s) => s.key === activeStageKey) || PROCUREMENT_STAGES[0];
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
  const displayDocs = stageDocs.length > 0 ? stageDocs : documents.filter((d) => d.packageId === currentPkg.id);
  const activeSplitDoc = displayDocs.find((d) => d.id === splitDocId) || displayDocs[0];

  const toggleStageChecklist = (checkId: string) => {
    const updatedStages = { ...currentPkg.stages };
    const currentList = updatedStages[activeStageKey]?.checklists || [];

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

    const allChecklists = Object.values(updatedStages).flatMap((s) => s.checklists || []);
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
      checklists: (updatedStages[activeStageKey]?.checklists || []).map((c) => ({ ...c, isDone: true })),
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

    const allChecklists = Object.values(updatedStages).flatMap((s) => s.checklists || []);
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
    _reviewerName: string,
    _reviewerRole: ReviewerRoleType
  ) => {
    if (onUpdateDocumentReview) {
      onUpdateDocumentReview(docId, newStatus, summaryNotes);
    }
  };

  const completedChecklistCount = localChecklist.filter((item) => item.isDone).length;
  const checklistPercentage = Math.round((completedChecklistCount / localChecklist.length) * 100);

  return (
    <div className="space-y-5">
      {/* Top Header Controls & Primary View Navigation Switcher */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#701524] text-white text-[10px] font-bold rounded font-mono">
                PEJABAT PENGADAAN
              </span>
              <h1 className="text-base font-bold text-stone-900 tracking-tight">
                Tahapan Proses & Ceklist Kelengkapan Dokumen
              </h1>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Kelola lembar Ceklist Kelengkapan Dokumen Pengadaan Langsung dan monitor 6 alur tahapan proses.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <label className="text-xs text-stone-500 font-semibold shrink-0">Pilih Paket Pengadaan:</label>
            <select
              value={activePkgId}
              onChange={(e) => setActivePkgId(e.target.value)}
              className="py-1.5 px-3 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524] font-medium max-w-[280px] md:max-w-[360px] truncate"
            >
              {effectivePackages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  [{pkg.procurementType}] {pkg.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs between "Ceklist Kelengkapan Dokumen" and "6 Tahapan Proses" */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('CHECKLIST_TABLE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'CHECKLIST_TABLE'
                ? 'bg-[#701524] text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>Tabel Ceklist Kelengkapan Dokumen Pengadaan</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeSubTab === 'CHECKLIST_TABLE' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
              }`}
            >
              {completedChecklistCount}/8
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('STAGE_WORKFLOW')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'STAGE_WORKFLOW'
                ? 'bg-[#701524] text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Monitoring 6 Tahapan Proses & Upload Berkas</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeSubTab === 'STAGE_WORKFLOW' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
              }`}
            >
              Tahap {currentStageInfo.stepNumber}
            </span>
          </button>
        </div>
      </div>

      {/* Package Profile Summary */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeBadge.badgeClass}`}>
                {typeBadge.label}
              </span>
              <span className="text-xs font-mono text-stone-500 font-bold">RUP: {currentPkg.codeRUP}</span>
              <span className="text-xs text-stone-300">·</span>
              <span className="text-xs font-mono text-stone-500">{currentPkg.registerNumber || 'REG-PL-2026'}</span>
              <span className="text-xs text-stone-300">·</span>
              <span className="text-xs text-stone-600 font-medium">{currentPkg.skpdName}</span>
            </div>
            <h2 className="text-sm font-bold text-stone-900">{currentPkg.name}</h2>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <div className="font-mono text-base font-bold text-stone-900">{formatRupiah(currentPkg.hpsValue)}</div>
            <div className="text-[11px] text-stone-500 font-medium">
              Penyedia: <span className="font-semibold text-stone-800">{currentPkg.vendorName || 'Dalam Proses'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: TABEL CEKLIST KELENGKAPAN DOKUMEN PENGADAAN (DIISI PEJABAT PENGADAAN) */}
      {/* ========================================================================= */}
      {activeSubTab === 'CHECKLIST_TABLE' && (
        <div className="space-y-5">
          {/* Action Toolbar */}
          <div className="bg-stone-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl shrink-0 text-amber-400">
                <ListChecks className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">
                  Formulir Ceklist Kelengkapan Dokumen Pengadaan Langsung
                </h3>
                <p className="text-xs text-stone-300 mt-0.5">
                  Diisi dan dicentang oleh Pejabat Pengadaan untuk verifikasi legalitas berkas audit.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handleToggleAllCheckmarks(true)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Centang Semua (√)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Ceklist Dokumen</span>
              </button>
            </div>
          </div>

          {/* Status Progress Banner */}
          <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-stone-700">Status Kelengkapan Berkas Pengadaan:</span>
              <span className={checklistPercentage === 100 ? 'text-emerald-700 font-mono' : 'text-[#701524] font-mono'}>
                {completedChecklistCount} dari 8 Dokumen Terpenuhi ({checklistPercentage}%)
              </span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  checklistPercentage === 100 ? 'bg-emerald-600' : 'bg-[#701524]'
                }`}
                style={{ width: `${checklistPercentage}%` }}
              />
            </div>
          </div>

          {/* OFFICIAL GOVERNMENT TABLE FORMAT (Identical Layout & Lines to Image /assets/aistudio/image_feddf662.png) */}
          <div className="bg-white border-2 border-stone-900 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  {/* Outer Government Header Box */}
                  <tr className="bg-stone-100 border-b-2 border-stone-900">
                    <th colSpan={4} className="p-3 text-center border-b border-stone-900">
                      <div className="text-xs uppercase font-extrabold tracking-wider text-stone-700">
                        Jenis Pengadaan
                      </div>
                      <div className="text-base font-extrabold text-stone-900 mt-0.5">
                        {currentPkg.procurementType === 'KONSTRUKSI'
                          ? 'Pekerjaan Konstruksi'
                          : currentPkg.procurementType === 'KONSULTANSI'
                          ? 'Jasa Konsultansi'
                          : 'Pengadaan Barang'}
                      </div>
                    </th>
                  </tr>
                  <tr className="bg-stone-50 border-b-2 border-stone-900 text-stone-900 font-bold uppercase text-[11px]">
                    <th className="p-3 border-r-2 border-stone-900 w-1/2">Ceklist Dokumen</th>
                    <th className="p-3 text-center border-r-2 border-stone-900 w-16">
                      Status (√)
                    </th>
                    <th className="p-3 border-r-2 border-stone-900 w-1/4">Nomor Dokumen & Tanggal</th>
                    <th className="p-3 w-1/4">Catatan / Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-stone-900">
                  {localChecklist.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-stone-50 transition-colors ${
                        item.isDone ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* Column 1: Document Title */}
                      <td className="p-3.5 border-r-2 border-stone-900 font-medium text-stone-900 leading-snug">
                        <div className="flex items-start gap-2">
                          <span className="font-mono text-stone-400 text-[10px] mt-0.5 shrink-0">
                            {idx + 1}.
                          </span>
                          <div>
                            <span className="font-bold text-stone-900">{item.title}</span>
                            <p className="text-[10px] text-stone-500 mt-0.5 font-sans">
                              Verifikator: <span className="font-semibold text-stone-700">{item.verifiedBy || 'Pejabat Pengadaan'}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Checkmark √ Toggle */}
                      <td className="p-2 text-center border-r-2 border-stone-900 align-middle">
                        <button
                          type="button"
                          onClick={() => handleToggleDocChecklist(item.id)}
                          className={`w-9 h-9 mx-auto rounded-lg font-mono text-lg font-extrabold flex items-center justify-center transition-all cursor-pointer ${
                            item.isDone
                              ? 'bg-emerald-700 text-white shadow-xs hover:bg-emerald-800'
                              : 'bg-stone-100 text-stone-300 hover:text-stone-500 border border-stone-300'
                          }`}
                          title={item.isDone ? 'Klik untuk membatalkan centang' : 'Klik untuk mencentang (√)'}
                        >
                          {item.isDone ? '√' : ''}
                        </button>
                      </td>

                      {/* Column 3: Document Number & Date (Editable) */}
                      <td className="p-2.5 border-r-2 border-stone-900 space-y-1.5 align-top">
                        <div>
                          <label className="text-[9px] font-bold text-stone-400 uppercase block">No. Dokumen:</label>
                          <input
                            type="text"
                            value={item.documentNumber || ''}
                            onChange={(e) =>
                              handleUpdateChecklistItemField(item.id, 'documentNumber', e.target.value)
                            }
                            placeholder="e.g. 027/01/BAHPL/2026"
                            className="w-full px-2 py-1 text-xs border border-stone-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-[#701524]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-stone-400 uppercase block">Tanggal:</label>
                          <input
                            type="date"
                            value={item.date || ''}
                            onChange={(e) =>
                              handleUpdateChecklistItemField(item.id, 'date', e.target.value)
                            }
                            className="w-full px-2 py-1 text-xs border border-stone-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-[#701524]"
                          />
                        </div>
                      </td>

                      {/* Column 4: Notes / Remarks (Editable) */}
                      <td className="p-2.5 align-top space-y-1">
                        <textarea
                          rows={2}
                          value={item.notes || ''}
                          onChange={(e) =>
                            handleUpdateChecklistItemField(item.id, 'notes', e.target.value)
                          }
                          placeholder="Catatan hasil verifikasi..."
                          className="w-full px-2 py-1 text-xs border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#701524]"
                        />
                        {item.isDone ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Telah Memenuhi Syarat</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Menunggu Dilengkapi</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Signature Section Footer */}
            <div className="bg-stone-50 border-t-2 border-stone-900 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 border-r border-stone-200 pr-4">
                <span className="font-bold text-stone-900 uppercase text-[11px] block">
                  Pernyataan Pejabat Pengadaan:
                </span>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  Seluruh dokumen di atas telah diperiksa kelengkapan, keabsahan administrasi, dan kesesuaiannya dengan ketentuan Perpres Pengadaan Barang/Jasa Pemerintah.
                </p>
              </div>

              <div className="text-right space-y-1">
                <div className="text-stone-500 text-[11px]">Mbay, Kabupaten Nagekeo</div>
                <div className="font-bold text-stone-900">Pejabat Pengadaan Barang/Jasa</div>
                <div className="h-10"></div>
                <div className="font-bold text-stone-900 underline">
                  {currentPkg.ppName || 'Bambang Pratama, S.Kom.'}
                </div>
                <div className="font-mono text-[10px] text-stone-500">NIP. 19880412 201212 1 002</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: MONITORING 6 TAHAPAN PROSES PENGADAAN & UPLOAD BERKAS */}
      {/* ========================================================================= */}
      {activeSubTab === 'STAGE_WORKFLOW' && (
        <div className="space-y-5">
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
                  className={`p-2.5 rounded-lg border text-left transition-all relative flex flex-col justify-between cursor-pointer ${borderClass} ${
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

          {/* Main Grid Pane - Split (5/12 Checklist vs 7/12 Document Workbench) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Stage Checklists (5 Columns) */}
            <div className="xl:col-span-5 bg-white border border-stone-200/90 rounded-xl shadow-xs p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="pb-3 border-b border-stone-100 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#701524] text-white flex items-center justify-center text-xs font-bold font-mono">
                        {currentStageInfo.stepNumber}
                      </span>
                      <h3 className="font-bold text-sm text-stone-900">{currentStageInfo.title}</h3>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">{currentStageInfo.description}</p>
                  </div>

                  <span className="px-2.5 py-1 bg-stone-100 text-stone-700 font-mono text-[11px] rounded-lg font-bold shrink-0">
                    {(currentStageState?.checklists || []).filter((c) => c.isDone).length} / {(currentStageState?.checklists || []).length} Verified
                  </span>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-[#701524]" />
                    <span>Verifikasi Pejabat Pengadaan & Tim Evaluator</span>
                  </h4>

                  <div className="space-y-2">
                    {(currentStageState?.checklists || []).map((check) => (
                      <div
                        key={check.id}
                        onClick={() => toggleStageChecklist(check.id)}
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
                          <span className="font-semibold text-stone-900 leading-snug block">{check.text}</span>
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
              </div>

              {/* Stage Notes & Advance Button */}
              <div className="pt-3 border-t border-stone-100 space-y-2 mt-2">
                <label className="block text-xs font-semibold text-stone-700">Catatan Tahapan:</label>
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

            {/* Stage Documents Workbench (7 Columns) */}
            <div className="xl:col-span-7 space-y-4">
              <div className="bg-white border border-stone-200/90 rounded-xl shadow-xs p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-rose-50 text-[#701524] rounded-lg">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                        Daftar Berkas Tahap Ini ({displayDocs.length})
                      </h3>
                      <p className="text-[11px] text-stone-400">Pilih mode tampilan berkas sesuai kebutuhan</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-100 text-stone-600 text-xs">
                      <button
                        type="button"
                        onClick={() => setDocViewMode('CARD')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all flex items-center gap-1 cursor-pointer ${
                          docViewMode === 'CARD' ? 'bg-[#701524] text-white shadow-2xs' : 'hover:text-stone-900'
                        }`}
                      >
                        <LayoutGrid className="w-3 h-3" />
                        <span>Kartu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDocViewMode('TABLE')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all flex items-center gap-1 cursor-pointer ${
                          docViewMode === 'TABLE' ? 'bg-[#701524] text-white shadow-2xs' : 'hover:text-stone-900'
                        }`}
                      >
                        <TableIcon className="w-3 h-3" />
                        <span>Tabel</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDocViewMode('ICON')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all flex items-center gap-1 cursor-pointer ${
                          docViewMode === 'ICON' ? 'bg-[#701524] text-white shadow-2xs' : 'hover:text-stone-900'
                        }`}
                      >
                        <Folder className="w-3 h-3" />
                        <span>Ikon</span>
                      </button>
                    </div>

                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('unggah-dokumen')}
                        className="text-[11px] text-[#701524] hover:underline font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
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
                    <p className="text-xs text-stone-500 font-medium">Belum ada dokumen terunggah untuk tahap ini.</p>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('unggah-dokumen')}
                        className="px-3 py-1 bg-[#701524] text-white text-xs rounded-lg font-semibold inline-block cursor-pointer"
                      >
                        + Unggah Dokumen
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {displayDocs.map((doc) => (
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

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0 bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Disetujui
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* PRINT MODAL PREVIEW (Official Clean Document Print Layout) */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#701524]" />
                <h3 className="font-bold text-sm text-stone-900">
                  Pratinjau Cetak Ceklist Kelengkapan Dokumen Pengadaan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Content Container */}
            <div className="p-6 bg-white border border-stone-900 space-y-4 text-xs font-sans text-stone-900">
              <div className="text-center space-y-1 border-b-2 border-stone-900 pb-3">
                <h2 className="font-bold text-sm uppercase tracking-wide">
                  PEMERINTAH KABUPATEN NAGEKEO
                </h2>
                <h3 className="font-extrabold text-base uppercase">
                  {currentPkg.skpdName}
                </h3>
                <p className="text-[10px] font-mono text-stone-600">
                  LEMBAR CEKLIST KELENGKAPAN DOKUMEN PENGADAAN LANGSUNG
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="font-bold">Nama Paket:</span> {currentPkg.name}
                </div>
                <div>
                  <span className="font-bold">Jenis Pengadaan:</span> {currentPkg.procurementType}
                </div>
                <div>
                  <span className="font-bold">Nilai HPS:</span> {formatRupiah(currentPkg.hpsValue)}
                </div>
                <div>
                  <span className="font-bold">Nomor RUP / Reg:</span> {currentPkg.codeRUP} / {currentPkg.registerNumber}
                </div>
              </div>

              {/* Exact Printable Table */}
              <table className="w-full text-left border-collapse border-2 border-stone-900 text-xs">
                <thead>
                  <tr className="bg-stone-100 border-b-2 border-stone-900 text-stone-900 font-bold uppercase">
                    <th className="p-2 border-r-2 border-stone-900">Ceklist Dokumen</th>
                    <th className="p-2 text-center border-r-2 border-stone-900 w-16">Status</th>
                    <th className="p-2 border-r-2 border-stone-900 w-1/3">No. Dokumen & Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-stone-900">
                  {localChecklist.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 border-r-2 border-stone-900 font-medium">{item.title}</td>
                      <td className="p-2 text-center border-r-2 border-stone-900 font-bold font-mono">
                        {item.isDone ? '√' : '-'}
                      </td>
                      <td className="p-2 border-r-2 border-stone-900 font-mono text-[11px]">
                        {item.documentNumber || '-'} {item.date ? `(${formatDate(item.date)})` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-4 flex justify-between items-end text-xs">
                <div>
                  <div className="font-bold">Status Verifikasi:</div>
                  <div className="text-emerald-800 font-bold">{completedChecklistCount} dari 8 Dokumen Lengkap</div>
                </div>
                <div className="text-right space-y-1">
                  <div>Mbay, {new Date().toLocaleDateString('id-ID')}</div>
                  <div className="font-bold">Pejabat Pengadaan</div>
                  <div className="h-12"></div>
                  <div className="font-bold underline">{currentPkg.ppName || 'Bambang Pratama, S.Kom.'}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 font-semibold text-xs cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#701524] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
