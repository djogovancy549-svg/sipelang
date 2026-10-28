/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ProcurementPackage, ProcurementType, FundingSource, OPDNumberingConfig } from '../types/procurement';
import { getDefaultStageChecklists } from '../data/procurementStages';
import { formatRupiah } from '../utils/formatters';
import { formatWithCounter, generateAllDocumentNumbers } from '../utils/numberingGenerator';
import {
  FilePlus2,
  CheckCircle2,
  Building,
  DollarSign,
  User,
  ShieldAlert,
  Hash,
  Sparkles,
} from 'lucide-react';

interface CreatePackageViewProps {
  onPackageCreated: (pkg: ProcurementPackage) => void;
  onCancel: () => void;
  opdList: OPDNumberingConfig[];
  onIncrementOPDCounter?: (opdId: string) => void;
}

export const CreatePackageView: React.FC<CreatePackageViewProps> = ({
  onPackageCreated,
  onCancel,
  opdList,
  onIncrementOPDCounter,
}) => {
  const [selectedOpdId, setSelectedOpdId] = useState<string>(opdList[0]?.id || '');
  const [name, setName] = useState('');
  const [codeRUP, setCodeRUP] = useState('');
  const [procurementType, setProcurementType] = useState<ProcurementType>('BARANG');
  const [fundingSource, setFundingSource] = useState<FundingSource>('APBD');
  const [fiscalYear, setFiscalYear] = useState<number>(2026);
  const [budgetCeiling, setBudgetCeiling] = useState<number>(150000000);
  const [hpsValue, setHpsValue] = useState<number>(142500000);
  const [vendorName, setVendorName] = useState('');
  const [vendorNpwp, setVendorNpwp] = useState('');
  const [ppkName, setPpkName] = useState('Drs. Agus Hidayat, M.M. (PPK)');
  const [ppName, setPpName] = useState('Bambang Pratama, S.Kom. (PP)');
  const [location, setLocation] = useState('');
  const [executionDurationDays, setExecutionDurationDays] = useState<number>(30);
  const [deadlineDate, setDeadlineDate] = useState('2026-11-30');
  const [notes, setNotes] = useState('');

  // Find active OPD config
  const activeOpd = opdList.find((o) => o.id === selectedOpdId) || opdList[0];

  // Auto-computed register number
  const autoRegisterNumber = activeOpd
    ? formatWithCounter(activeOpd.templatePackageReg, activeOpd, activeOpd.currentCounter + 1)
    : '';

  // Auto-computed preview document numbers
  const docPreviews = activeOpd
    ? generateAllDocumentNumbers(activeOpd, activeOpd.currentCounter + 1)
    : null;

  // Validation limits
  const maxLimit = procurementType === 'KONSULTANSI' ? 100000000 : 200000000;
  const isOverLimit = hpsValue > maxLimit;
  const isHpsOverPagu = hpsValue > budgetCeiling;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !codeRUP.trim()) {
      alert('Mohon isi nama paket pekerjaan dan kode RUP.');
      return;
    }

    if (isOverLimit) {
      const confirmProceed = window.confirm(
        `Perhatian: Nilai HPS (${formatRupiah(hpsValue)}) melebihi batas Pengadaan Langsung untuk ${procurementType} (${formatRupiah(maxLimit)}). Apakah Anda yakin ingin melanjutkan pencatatan?`
      );
      if (!confirmProceed) return;
    }

    const newPackage: ProcurementPackage = {
      id: `pkg-${Date.now()}`,
      codeRUP: codeRUP.trim(),
      registerNumber: autoRegisterNumber,
      opdId: activeOpd?.id,
      name: name.trim(),
      procurementType,
      fiscalYear,
      fundingSource,
      skpdName: activeOpd?.opdName || 'Organisasi Perangkat Daerah',
      budgetCeiling: Number(budgetCeiling),
      hpsValue: Number(hpsValue),
      vendorName: vendorName.trim() || 'Calon Rekanan Belum Ditetapkan',
      vendorNpwp: vendorNpwp.trim() || '00.000.000.0-000.000',
      ppkName: ppkName.trim(),
      ppName: ppName.trim(),
      location: location.trim() || 'Dalam Wilayah Kerja Pemerintah Daerah',
      executionDurationDays: Number(executionDurationDays),
      createdDate: new Date().toISOString().slice(0, 10),
      deadlineDate: deadlineDate,
      currentStage: 'PERSIAPAN_PPK',
      overallProgress: 15,
      isArchived: false,
      notes: notes.trim(),
      stages: {
        PERSIAPAN_PPK: {
          stageKey: 'PERSIAPAN_PPK',
          status: 'in_progress',
          startDate: new Date().toISOString().slice(0, 10),
          notes: 'Penerimaan berkas persiapan dari PPK (KAK, HPS, Draft SPK). Menunggu review Pejabat Pengadaan.',
          checklists: getDefaultStageChecklists('PERSIAPAN_PPK'),
        },
        PERMINTAAN_PENAWARAN: {
          stageKey: 'PERMINTAAN_PENAWARAN',
          status: 'pending',
          checklists: getDefaultStageChecklists('PERMINTAAN_PENAWARAN'),
        },
        EVALUASI_PENAWARAN: {
          stageKey: 'EVALUASI_PENAWARAN',
          status: 'pending',
          checklists: getDefaultStageChecklists('EVALUASI_PENAWARAN'),
        },
        KLARIFIKASI_NEGOSIASI: {
          stageKey: 'KLARIFIKASI_NEGOSIASI',
          status: 'pending',
          checklists: getDefaultStageChecklists('KLARIFIKASI_NEGOSIASI'),
        },
        PENETAPAN_BAHPL: {
          stageKey: 'PENETAPAN_BAHPL',
          status: 'pending',
          checklists: getDefaultStageChecklists('PENETAPAN_BAHPL'),
        },
        SPK_SELESAI: {
          stageKey: 'SPK_SELESAI',
          status: 'pending',
          checklists: getDefaultStageChecklists('SPK_SELESAI'),
        },
      },
    };

    // Increment OPD Counter
    if (activeOpd && onIncrementOPDCounter) {
      onIncrementOPDCounter(activeOpd.id);
    }

    onPackageCreated(newPackage);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-50 text-[#701524] border border-rose-200/60">
            <FilePlus2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-stone-900 tracking-tight">
              Buat Paket Pengadaan Langsung
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Penomoran paket dan dokumen akan otomatis diatur sesuai aturan OPD yang dipilih.
            </p>
          </div>
        </div>
      </div>

      {/* Simplified Clean Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-stone-200/90 rounded-xl shadow-xs p-5 space-y-5">
        {/* Section 0: Pemilihan OPD & Auto Numbering */}
        <div className="p-3.5 bg-rose-50/40 rounded-xl border border-rose-100 space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-rose-200/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#701524]">
              <Sparkles className="w-4 h-4 text-[#701524]" />
              <span>Sistem Penomoran Otomatis Berdasarkan OPD</span>
            </div>
            <span className="text-[10px] font-mono text-[#701524] bg-white px-2 py-0.5 rounded border border-rose-200 font-semibold">
              Otomatis Terbit
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Pilih Organisasi Perangkat Daerah (OPD) <span className="text-[#701524]">*</span>
              </label>
              <select
                value={selectedOpdId}
                onChange={(e) => setSelectedOpdId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-rose-200 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524] font-medium"
                required
              >
                {opdList.map((opd) => (
                  <option key={opd.id} value={opd.id}>
                    [{opd.opdCode}] {opd.opdName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Nomor Register Paket (Auto-Generated)
              </label>
              <div className="px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-mono font-bold text-[#701524] flex items-center justify-between">
                <span>{autoRegisterNumber}</span>
                <span className="text-[10px] font-normal text-stone-400">No. Urut: {activeOpd ? activeOpd.currentCounter + 1 : 1}</span>
              </div>
            </div>
          </div>

          {/* Document Preview Strip */}
          {docPreviews && (
            <div className="pt-2 border-t border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-stone-600">
              <span className="text-stone-400 text-[10px]">Preview No. Surat:</span>
              <div className="flex items-center gap-3 flex-wrap">
                <span>Undangan: <strong className="text-stone-800">{docPreviews.invitationNumber}</strong></span>
                <span>·</span>
                <span>BAHPL: <strong className="text-stone-800">{docPreviews.bahplNumber}</strong></span>
                <span>·</span>
                <span>SPK: <strong className="text-[#701524]">{docPreviews.spkNumber}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Section 1: Klasifikasi Pengadaan */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 pb-1 border-b border-stone-100">
            <Building className="w-3.5 h-3.5 text-[#701524]" />
            <span>1. Klasifikasi Pengadaan</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Jenis Pengadaan Langsung <span className="text-[#701524]">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { type: 'BARANG', label: 'Barang', limit: '≤ Rp 200 Jt' },
                { type: 'KONSULTANSI', label: 'Konsultansi', limit: '≤ Rp 100 Jt' },
                { type: 'KONSTRUKSI', label: 'Konstruksi', limit: '≤ Rp 200 Jt' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setProcurementType(item.type as any)}
                  className={`p-3 border rounded-lg text-left transition-all ${
                    procurementType === item.type
                      ? 'border-[#701524] bg-rose-50/50 text-[#701524] font-bold shadow-2xs'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <div className="text-xs">{item.label}</div>
                  <div className="text-[10px] text-stone-500 font-mono mt-0.5">{item.limit}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nama Paket Pekerjaan <span className="text-[#701524]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Pengadaan Alat Tulis Kantor dan Bahan Komputer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Kode RUP <span className="text-[#701524]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 54920188"
                value={codeRUP}
                onChange={(e) => setCodeRUP(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Sumber Dana</label>
              <select
                value={fundingSource}
                onChange={(e) => setFundingSource(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
              >
                <option value="APBD">APBD</option>
                <option value="APBN">APBN</option>
                <option value="BLUD">BLUD</option>
                <option value="DAK">DAK</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Tahun Anggaran</label>
              <input
                type="number"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Anggaran */}
        <div className="space-y-3 pt-3 border-t border-stone-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 pb-1 border-b border-stone-100">
            <DollarSign className="w-3.5 h-3.5 text-[#701524]" />
            <span>2. Nilai Anggaran & HPS</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Pagu Anggaran (Rp) <span className="text-[#701524]">*</span>
              </label>
              <input
                type="number"
                step="500000"
                value={budgetCeiling}
                onChange={(e) => setBudgetCeiling(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
              />
              <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">{formatRupiah(budgetCeiling)}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nilai HPS PPK (Rp) <span className="text-[#701524]">*</span>
              </label>
              <input
                type="number"
                step="500000"
                value={hpsValue}
                onChange={(e) => setHpsValue(Number(e.target.value))}
                className={`w-full px-3 py-1.5 text-xs font-mono border rounded-lg focus:outline-none focus:ring-1 ${
                  isOverLimit || isHpsOverPagu ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-500' : 'border-stone-200 focus:ring-[#701524]'
                }`}
              />
              <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">{formatRupiah(hpsValue)}</span>
            </div>
          </div>

          {isOverLimit && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-[#701524]">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Nilai HPS ({formatRupiah(hpsValue)}) melebihi batas regulasi {procurementType} ({formatRupiah(maxLimit)}).</span>
            </div>
          )}
        </div>

        {/* Section 3: Rekanan */}
        <div className="space-y-3 pt-3 border-t border-stone-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 pb-1 border-b border-stone-100">
            <User className="w-3.5 h-3.5 text-[#701524]" />
            <span>3. Rekanan & Pejabat</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Nama Calon Rekanan</label>
              <input
                type="text"
                placeholder="Contoh: CV. Rekatama Mandiri"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">NPWP Rekanan</label>
              <input
                type="text"
                placeholder="01.482.903.1-512.000"
                value={vendorNpwp}
                onChange={(e) => setVendorNpwp(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 border border-stone-300 text-stone-700 text-xs font-semibold rounded-lg hover:bg-stone-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 bg-[#701524] hover:bg-[#58101c] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Simpan Paket & Terbitkan Nomor</span>
          </button>
        </div>
      </form>
    </div>
  );
};
