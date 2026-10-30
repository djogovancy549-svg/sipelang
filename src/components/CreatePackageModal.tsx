/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProcurementPackage, ProcurementType, FundingSource, OPDNumberingConfig } from '../types/procurement';
import { getDefaultStageChecklists, getDefaultDocumentChecklist } from '../data/procurementStages';
import { formatRupiah } from '../utils/formatters';
import {
  generateNagekeoPackageNumber,
  getRomanMonth,
  generateAllDocumentNumbers,
} from '../utils/numberingGenerator';
import {
  X,
  FilePlus2,
  CheckCircle2,
  Building,
  DollarSign,
  User,
  ShieldAlert,
  Sparkles,
  Calendar,
  Hash,
  FileText,
} from 'lucide-react';

interface CreatePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPackageCreated: (pkg: ProcurementPackage) => void;
  opdList: OPDNumberingConfig[];
  onIncrementOPDCounter?: (opdId: string) => void;
}

export const CreatePackageModal: React.FC<CreatePackageModalProps> = ({
  isOpen,
  onClose,
  onPackageCreated,
  opdList,
  onIncrementOPDCounter,
}) => {
  const [selectedOpdId, setSelectedOpdId] = useState<string>(opdList[0]?.id || '');
  const [suratDate, setSuratDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [kodePengadaan, setKodePengadaan] = useState<string>('BRG');
  const [customCounter, setCustomCounter] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [codeRUP, setCodeRUP] = useState('');
  const [procurementType, setProcurementType] = useState<ProcurementType>('BARANG');
  const [fundingSource, setFundingSource] = useState<FundingSource>('APBD');
  const [fiscalYear, setFiscalYear] = useState<number>(2026);
  const [budgetCeiling, setBudgetCeiling] = useState<number>(150000000);
  const [hpsValue, setHpsValue] = useState<number>(142500000);
  const [vendorName, setVendorName] = useState('');
  const [vendorNpwp, setVendorNpwp] = useState('');
  const [ppkName, setPpkName] = useState('');
  const [ppName, setPpName] = useState('');
  const [ppAddress, setPpAddress] = useState('');
  const [location, setLocation] = useState('');
  const [executionDurationDays, setExecutionDurationDays] = useState<number>(30);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const activeOpd = opdList.find((o) => o.id === selectedOpdId) || opdList[0];
  const actualCounter = customCounter !== '' ? Number(customCounter) : (activeOpd ? activeOpd.currentCounter + 1 : 1);
  const paddedNo = String(actualCounter).padStart(activeOpd?.counterPadding || 3, '0');
  const cleanOpdCode = (activeOpd?.opdCode || 'OPD').replace(/-NGK$/i, '').trim().toUpperCase();
  const romanMonth = getRomanMonth(suratDate);
  const suratYear = new Date(suratDate).getFullYear() || 2026;

  // Exact format: Nommoe surat/PP-Kode Pengadaan/Kode dinas-NGK/Bulan (angka Romawi sesuai tanggal surat)/Tahun
  const autoRegisterNumber = generateNagekeoPackageNumber({
    counter: actualCounter,
    padding: activeOpd?.counterPadding || 3,
    kodePengadaan,
    kodeOpd: cleanOpdCode,
    suratDate,
  });

  const docPreviews = activeOpd
    ? generateAllDocumentNumbers(activeOpd, actualCounter, suratDate, kodePengadaan)
    : null;

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
      skpdName: activeOpd?.opdName || 'Organisasi Perangkat Daerah Nagekeo',
      budgetCeiling: Number(budgetCeiling),
      hpsValue: Number(hpsValue),
      vendorName: vendorName.trim() || 'Calon Rekanan Belum Ditetapkan',
      vendorNpwp: vendorNpwp.trim() || '00.000.000.0-000.000',
      ppkName: ppkName.trim(),
      ppName: ppName.trim(),
      ppAddress: ppAddress.trim() || 'Kompleks Civic Center',
      location: location.trim() || 'Kabupaten Nagekeo, Flores - NTT',
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
      documentChecklist: getDefaultDocumentChecklist(),
    };

    if (activeOpd && onIncrementOPDCounter) {
      onIncrementOPDCounter(activeOpd.id);
    }

    onPackageCreated(newPackage);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-50 text-[#701524] border border-rose-200/60">
              <FilePlus2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                Buat Paket Pengadaan Langsung
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Pengisian data paket pekerjaan dengan penomoran otomatis sesuai list OPD.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* OPD Selector & Exact Nagekeo LPSE Numbering Card */}
          <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-rose-200/60 gap-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#701524]">
                <Sparkles className="w-4 h-4 text-[#701524]" />
                <span>Format Penomoran Surat Pejabat Pengadaan (LPSE Nagekeo)</span>
              </div>
              <span className="text-[10px] font-mono text-[#701524] bg-white px-2 py-0.5 rounded border border-rose-200 font-semibold self-start sm:self-auto">
                No. Surat/PP-Kode/Dinas-NGK/Romawi/Tahun
              </span>
            </div>

            {/* Formula Explainer Strip */}
            <div className="px-3 py-2 bg-white/90 rounded-lg border border-rose-200/70 text-[11px] font-mono text-stone-700 flex flex-wrap items-center gap-1.5">
              <span className="text-stone-400 font-sans font-semibold text-[10px] uppercase">Format Baku:</span>
              <span className="px-1.5 py-0.5 bg-rose-100/70 text-[#701524] font-bold rounded">Nomor Surat</span>
              <span className="text-stone-400 font-bold">/</span>
              <span className="px-1.5 py-0.5 bg-stone-100 text-stone-800 font-bold rounded">PP-Kode Pengadaan</span>
              <span className="text-stone-400 font-bold">/</span>
              <span className="px-1.5 py-0.5 bg-stone-100 text-stone-800 font-bold rounded">Kode Dinas-NGK</span>
              <span className="text-stone-400 font-bold">/</span>
              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/60 font-bold rounded">Bulan (Romawi)</span>
              <span className="text-stone-400 font-bold">/</span>
              <span className="px-1.5 py-0.5 bg-stone-100 text-stone-800 font-bold rounded">Tahun</span>
            </div>

            {/* Inputs: OPD, Tanggal Surat, Kode Pengadaan, No Urut */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* OPD */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  OPD / Dinas Pengusul <span className="text-[#701524]">*</span>
                </label>
                <select
                  value={selectedOpdId}
                  onChange={(e) => setSelectedOpdId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-rose-200 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524] font-medium"
                  required
                >
                  {opdList.map((opd) => (
                    <option key={opd.id} value={opd.id}>
                      [{opd.opdCode.replace(/-NGK$/i, '')}-NGK] {opd.opdName}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  Kode instansi: <strong className="font-mono text-[#701524]">{cleanOpdCode}-NGK</strong>
                </p>
              </div>

              {/* Tanggal Surat */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1 flex items-center justify-between">
                  <span>Tanggal Surat</span>
                  <span className="text-[10px] font-mono text-[#701524] font-bold">Bulan: {romanMonth}</span>
                </label>
                <input
                  type="date"
                  value={suratDate}
                  onChange={(e) => setSuratDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-rose-200 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524] font-medium"
                  required
                />
                <p className="text-[10px] text-stone-500 mt-0.5">
                  Romawi: <strong className="font-mono text-stone-800">{romanMonth}</strong>
                </p>
              </div>

              {/* Kode Pengadaan */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Kode PP & Pengadaan
                </label>
                <select
                  value={kodePengadaan}
                  onChange={(e) => setKodePengadaan(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-rose-200 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524] font-medium"
                >
                  <option value="BRG">PP-BRG (Barang)</option>
                  <option value="KONS">PP-KONS (Konsultansi)</option>
                  <option value="KONSTR">PP-KONSTR (Konstruksi)</option>
                  <option value="PL">PP-PL (Pengadaan Langsung)</option>
                </select>
                <p className="text-[10px] text-stone-500 mt-0.5 font-mono">
                  Prefix: <strong className="text-stone-800">PP-{kodePengadaan}</strong>
                </p>
              </div>
            </div>

            {/* Big Live Number Result */}
            <div className="p-3 bg-white rounded-lg border border-rose-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-600">
                  Nomor Surat / Register Lengkap:
                </span>
                <span className="text-[10px] font-mono text-stone-400">
                  Urut: #{actualCounter}
                </span>
              </div>
              <div className="text-sm sm:text-base font-mono font-bold text-[#701524] tracking-tight bg-rose-50/70 p-2.5 rounded-lg border border-rose-200/80 break-all select-all">
                {autoRegisterNumber}
              </div>
              {/* Segment Badges */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-stone-500 flex-wrap pt-0.5">
                <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">No: {paddedNo}</span>
                <span>/</span>
                <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">PP-{kodePengadaan}</span>
                <span>/</span>
                <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">{cleanOpdCode}-NGK</span>
                <span>/</span>
                <span className="bg-amber-100/70 text-amber-900 px-1.5 py-0.5 rounded">Bulan: {romanMonth}</span>
                <span>/</span>
                <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">{suratYear}</span>
              </div>
            </div>

            {/* Preview Dokumen Terkait */}
            {docPreviews && (
              <div className="p-2.5 bg-stone-50/80 rounded-lg border border-stone-200 text-[10px] font-mono text-stone-600 space-y-1">
                <div className="font-semibold text-stone-700 flex items-center gap-1 mb-1">
                  <FileText className="w-3 h-3 text-[#701524]" />
                  <span>Pratinjau Nomor Dokumen Tahapan Pengadaan:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div className="truncate">Undangan: <strong className="text-stone-900">{docPreviews.invitationNumber}</strong></div>
                  <div className="truncate">BAHPL: <strong className="text-stone-900">{docPreviews.bahplNumber}</strong></div>
                  <div className="truncate">SPK: <strong className="text-[#701524]">{docPreviews.spkNumber}</strong></div>
                  <div className="truncate">BAST: <strong className="text-stone-900">{docPreviews.bastNumber}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Identitas Paket */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 pb-1 border-b border-stone-100">
              <Building className="w-3.5 h-3.5 text-[#701524]" />
              <span>1. Identitas Paket & Batas Regulasi</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Jenis Pengadaan Langsung <span className="text-[#701524]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: 'BARANG', label: 'Barang', limit: '≤ Rp 200 Jt' },
                  { type: 'KONSULTANSI', label: 'Konsultansi', limit: '≤ Rp 100 Jt' },
                  { type: 'KONSTRUKSI', label: 'Konstruksi', limit: '≤ Rp 200 Jt' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.type}
                    onClick={() => {
                      setProcurementType(item.type as any);
                      if (item.type === 'BARANG') setKodePengadaan('BRG');
                      else if (item.type === 'KONSULTANSI') setKodePengadaan('KONS');
                      else if (item.type === 'KONSTRUKSI') setKodePengadaan('KONSTR');
                    }}
                    className={`p-2 rounded-lg text-left transition-all border ${
                      procurementType === item.type
                        ? 'border-[#701524] bg-rose-50/50 text-[#701524] font-bold ring-1 ring-[#701524]'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    <div className="text-[10px] text-stone-400 font-mono">{item.limit}</div>
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
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Kode RUP (SiRUP) <span className="text-[#701524]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 54920188"
                  value={codeRUP}
                  onChange={(e) => setCodeRUP(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Sumber Dana</label>
                <select
                  value={fundingSource}
                  onChange={(e) => setFundingSource(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                >
                  <option value="APBD">APBD Kabupaten Nagekeo</option>
                  <option value="APBN">APBN</option>
                  <option value="DAK">DAK (Dana Alokasi Khusus)</option>
                  <option value="BLUD">BLUD</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Tahun Anggaran</label>
                <input
                  type="number"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Nilai Anggaran & HPS */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 pb-1 border-b border-stone-100">
              <DollarSign className="w-3.5 h-3.5 text-[#701524]" />
              <span>2. Nilai Pagu & HPS PPK</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Pagu Anggaran DPA (Rp) <span className="text-[#701524]">*</span>
                </label>
                <input
                  type="number"
                  step="500000"
                  value={budgetCeiling}
                  onChange={(e) => setBudgetCeiling(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
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
                  className={`w-full px-2.5 py-1.5 text-xs font-mono border rounded-lg focus:outline-none focus:ring-1 ${
                    isOverLimit || isHpsOverPagu ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-500' : 'border-stone-200 focus:ring-[#701524]'
                  }`}
                />
                <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">{formatRupiah(hpsValue)}</span>
              </div>
            </div>

            {isOverLimit && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-[#701524]">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Peringatan: Nilai HPS ({formatRupiah(hpsValue)}) melampaui batas maksimal {procurementType} ({formatRupiah(maxLimit)}).</span>
              </div>
            )}
          </div>

          {/* Section 3: Rekanan & Pejabat */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 pb-1 border-b border-stone-100">
              <User className="w-3.5 h-3.5 text-[#701524]" />
              <span>3. Calon Rekanan & Pelaksana</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nama Calon Penyedia / Rekanan</label>
                <input
                  type="text"
                  placeholder="Contoh: CV. Ebulobo Mandiri Sejahtera"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">NPWP Rekanan</label>
                <input
                  type="text"
                  placeholder="01.482.903.1-512.000"
                  value={vendorNpwp}
                  onChange={(e) => setVendorNpwp(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Pejabat Pembuat Komitmen (PPK)</label>
                <input
                  type="text"
                  value={ppkName}
                  onChange={(e) => setPpkName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Pejabat Pengadaan (PP)</label>
                <input
                  type="text"
                  value={ppName}
                  onChange={(e) => setPpName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Alamat Pejabat Pengadaan</label>
                <input
                  type="text"
                  value={ppAddress}
                  onChange={(e) => setPpAddress(e.target.value)}
                  placeholder="Contoh: Kompleks Civic Center"
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Jangka Waktu (Hari Kalender)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={executionDurationDays}
                  onChange={(e) => setExecutionDurationDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Target Selesai SPK</label>
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Catatan Lingkup Pekerjaan</label>
              <textarea
                rows={2}
                placeholder="Spesifikasi umum, lokasi fisik di Nagekeo, atau ketentuan lainnya..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
              />
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 text-stone-700 text-xs font-semibold rounded-lg hover:bg-stone-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#701524] hover:bg-[#58101c] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Simpan Paket & Terbitkan Nomor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
