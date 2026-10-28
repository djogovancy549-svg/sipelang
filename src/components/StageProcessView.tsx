/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ProcurementPackage,
  StageKey,
} from '../types/procurement';
import { PROCUREMENT_STAGES } from '../data/procurementStages';
import { formatRupiah, getProcurementTypeLabel, formatDate } from '../utils/formatters';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  GitMerge,
  CheckSquare,
  Square,
  ChevronRight,
  Save,
} from 'lucide-react';

interface StageProcessViewProps {
  packages: ProcurementPackage[];
  onUpdatePackageStage: (updatedPkg: ProcurementPackage) => void;
  selectedPackageId?: string;
}

export const StageProcessView: React.FC<StageProcessViewProps> = ({
  packages,
  onUpdatePackageStage,
  selectedPackageId: initialPkgId,
}) => {
  const [activePkgId, setActivePkgId] = useState<string>(
    initialPkgId || (packages[0]?.id || '')
  );
  const [activeStageKey, setActiveStageKey] = useState<StageKey>('PERSIAPAN_PPK');
  const [editNotes, setEditNotes] = useState('');

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
    alert('Catatan tahapan berhasil disimpan.');
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
            Pelacakan 6 alur pengadaan langsung LKPP dan verifikasi checklist kepatuhan regulasi.
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

      {/* Detail Pane of Selected Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Checklist Section */}
        <div className="lg:col-span-2 bg-white border border-stone-200/90 rounded-xl shadow-xs p-5 space-y-4">
          <div className="pb-3 border-b border-stone-100">
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

          {/* Checklist items */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-[#701524]" />
              <span>Verifikasi Pejabat Pengadaan</span>
            </h4>

            <div className="space-y-1.5">
              {currentStageState?.checklists.map((check) => (
                <div
                  key={check.id}
                  onClick={() => toggleChecklist(check.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 ${
                    check.isDone
                      ? 'border-stone-200 bg-stone-50/70 text-stone-700'
                      : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    {check.isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-[#701524]" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-300" />
                    )}
                  </div>
                  <div className="flex-1 text-xs">
                    <span className={check.isDone ? 'line-through text-stone-400' : 'font-medium'}>
                      {check.text}
                    </span>
                    {check.completedAt && (
                      <span className="block text-[10px] text-stone-400 font-mono mt-0.5">
                        Diverifikasi: {formatDate(check.completedAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes and action */}
          <div className="pt-3 border-t border-stone-100 space-y-2">
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
                className="px-3 py-1.5 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-stone-500" />
                <span>Simpan Catatan</span>
              </button>

              <button
                type="button"
                onClick={handleAdvanceStage}
                className="px-3.5 py-1.5 bg-[#701524] hover:bg-[#58101c] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selesaikan & Lanjut Tahap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Simplified Guidance Sidebar */}
        <div className="bg-white border border-stone-200/90 rounded-xl shadow-xs p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 pb-1.5 border-b border-stone-100">
              Kewenangan Tahapan
            </h3>

            <div className="p-3 bg-rose-50/40 rounded-lg border border-rose-100 text-xs space-y-1">
              <span className="font-bold text-[#701524] block">Tugas Pejabat Pengadaan:</span>
              <p className="text-stone-600">
                Bertanggung jawab melakukan evaluasi penawaran, klarifikasi teknis, negosiasi harga, dan menetapkan penyedia melalui BAHPL.
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs space-y-1">
              <span className="font-bold text-stone-800 block">Tugas PPK:</span>
              <p className="text-stone-600">
                Menyusun dokumen persiapan (KAK, HPS, Draft SPK) dan menerbitkan Surat Perintah Kerja (SPK) setelah menerima BAHPL dari Pejabat Pengadaan.
              </p>
            </div>
          </div>

          <div className="p-2 border border-stone-200 rounded-lg bg-stone-50 text-[10px] text-stone-400 text-center font-mono">
            Paket ID: {currentPkg.id}
          </div>
        </div>
      </div>
    </div>
  );
};
