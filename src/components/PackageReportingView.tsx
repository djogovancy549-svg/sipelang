/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProcurementPackage } from '../types/procurement';
import { formatRupiah, formatDate } from '../utils/formatters';
import { sendWebhookPayload } from '../utils/webhookService';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Printer,
  Calendar,
  Building2,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Save,
  Layers,
  FileText,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { SecurityPinModal } from './SecurityPinModal';

interface PackageReportingViewProps {
  packages: ProcurementPackage[];
  onUpdatePackage: (updatedPkg: ProcurementPackage) => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
}

export const PackageReportingView: React.FC<PackageReportingViewProps> = ({
  packages,
  onUpdatePackage,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'TENDER' | 'PL'>('ALL');
  const [timelyFilter, setTimelyFilter] = useState<string>('ALL');

  // Edit / Add modal state
  const [editingPkg, setEditingPkg] = useState<ProcurementPackage | null | 'NEW'>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProcurementPackage | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinAction, setPinAction] = useState<{ type: 'delete', pkg: ProcurementPackage } | null>(null);

  // Form fields state (reset when editingPkg changes)
  const [formMethod, setFormMethod] = useState<'TENDER' | 'PL'>('PL');
  const [formName, setFormName] = useState('');
  const [formContractNo, setFormContractNo] = useState('');
  const [formCcoList, setFormCcoList] = useState<string[]>(['']);
  const [formContractDate, setFormContractDate] = useState('');
  const [formContractEndDate, setFormContractEndDate] = useState('');
  const [formContractValue, setFormContractValue] = useState<number>(0);
  const [formExecutionPeriod, setFormExecutionPeriod] = useState('60 Hari Kalender');
  const [formProgressStatus, setFormProgressStatus] = useState<number>(0);
  const [formTimelyStatus, setFormTimelyStatus] = useState<'Tepat Waktu' | 'PHK' | 'Selesai' | 'Perpanjangan Waktu' | 'Sampai Tanggal'>('Tepat Waktu');
  const [formTimelyUntilDate, setFormTimelyUntilDate] = useState('');
  const [formContractorName, setFormContractorName] = useState('');
  const [formDinasName, setFormDinasName] = useState('');
  const [formBidangName, setFormBidangName] = useState('');
  const [formHandoverWork, setFormHandoverWork] = useState('Belum Serah Terima');
  const [formFinancialStatus, setFormFinancialStatus] = useState('Uang Muka 20%, Termin 1 50%');
  const [formPpkName, setFormPpkName] = useState('');
  const [formPptkName, setFormPptkName] = useState('');

  const getDailyPin = () => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    return `${d}${m}${y}-pbj`;
  };

  const handleVerifyPin = () => {
    const correctPin = getDailyPin();
    if (pinInput === correctPin) {
      if (pinAction?.type === 'delete') {
        handleDeleteConfirmed();
      }
      setPinModalOpen(false);
      setPinInput('');
      setPinAction(null);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pinAction?.pkg) return;
    await sendWebhookPayload('PACKAGE_REPORT_DELETED', { packageId: pinAction.pkg.id, packageName: pinAction.pkg.name });
    if (onShowToast) onShowToast('Paket laporan berhasil dihapus.', 'success');
    setPinAction(null);
  };

  const handleOpenAdd = () => {
    setEditingPkg('NEW');
    setFormMethod('PL');
    setFormName('');
    setFormContractNo('');
    setFormCcoList(['']);
    setFormContractDate('');
    setFormContractEndDate('');
    setFormContractValue(0);
    setFormExecutionPeriod('60 Hari Kalender');
    setFormProgressStatus(0);
    setFormTimelyStatus('Tepat Waktu');
    setFormTimelyUntilDate('');
    setFormContractorName('');
    setFormDinasName('');
    setFormBidangName('');
    setFormHandoverWork('');
    setFormFinancialStatus('');
    setFormPpkName('');
    setFormPptkName('');
  };

  const handleOpenEdit = (pkg: ProcurementPackage) => {
    setEditingPkg(pkg);
    setFormMethod(pkg.methodType || 'PL');
    setFormName(pkg.name || '');
    setFormContractNo(pkg.contractNo || '');
    setFormCcoList(pkg.ccoNumbers && pkg.ccoNumbers.length > 0 ? [...pkg.ccoNumbers] : ['']);
    setFormContractDate(pkg.contractDate || '');
    setFormContractEndDate(pkg.contractEndDate || '');
    setFormContractValue(pkg.contractValue || 0);
    setFormExecutionPeriod(pkg.executionPeriod || '');
    setFormProgressStatus(pkg.progressStatus !== undefined ? pkg.progressStatus : 0);
    setFormTimelyStatus(pkg.timelyStatus || 'Tepat Waktu');
    setFormTimelyUntilDate(pkg.timelyUntilDate || '');
    setFormContractorName(pkg.contractorName || '');
    setFormDinasName(pkg.dinasName || '');
    setFormBidangName(pkg.bidangName || '');
    setFormHandoverWork(pkg.handoverWork || '');
    setFormFinancialStatus(pkg.financialStatus || '');
    setFormPpkName(pkg.ppkName || '');
    setFormPptkName(pkg.pptkName || '');
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPkg) return;

    const updated: ProcurementPackage = {
      ...(editingPkg === 'NEW' ? { id: Date.now().toString(), name: formName } : editingPkg),
      name: formName,
      methodType: formMethod,
      contractNo: formContractNo,
      ccoNumbers: formCcoList.filter(c => c.trim() !== ''),
      contractDate: formContractDate,
      contractEndDate: formContractEndDate,
      contractValue: Number(formContractValue),
      executionPeriod: formExecutionPeriod,
      progressStatus: Number(formProgressStatus),
      overallProgress: Number(formProgressStatus),
      timelyStatus: formTimelyStatus,
      timelyUntilDate: formTimelyUntilDate,
      contractorName: formContractorName,
      skpdName: formDinasName,
      dinasName: formDinasName,
      bidangName: formBidangName,
      handoverWork: formHandoverWork,
      financialStatus: formFinancialStatus,
      ppkName: formPpkName,
      pptkName: formPptkName,
    };

    onUpdatePackage(updated);
    setEditingPkg(null);

    // Sync to Google Sheet webhook
    try {
      await sendWebhookPayload(editingPkg === 'NEW' ? 'PACKAGE_CREATED' : 'PACKAGE_REPORT_UPDATED', {
        packageId: updated.id,
        packageName: updated.name,
      });
      if (onShowToast) onShowToast('Laporan paket berhasil disimpan & disinkronkan ke Google Sheet.', 'success');
    } catch (err) {
      if (onShowToast) onShowToast('Laporan disimpan lokal, sinkronisasi cloud tertunda.', 'success');
    }
  };

  const addCcoField = () => {
    setFormCcoList([...formCcoList, '']);
  };

  const removeCcoField = (index: number) => {
    setFormCcoList(formCcoList.filter((_, i) => i !== index));
  };

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkg.contractNo && pkg.contractNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pkg.contractorName || pkg.vendorName).toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.ppkName.toLowerCase().includes(searchQuery.toLowerCase());

    const method = pkg.methodType || 'PL';
    const matchesMethod = methodFilter === 'ALL' || method === methodFilter;
    const timely = pkg.timelyStatus || 'Tepat Waktu';
    const matchesTimely = timelyFilter === 'ALL' || timely === timelyFilter;

    return matchesSearch && matchesMethod && matchesTimely;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER & CONTROLS */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#701524] text-white text-[10px] font-bold rounded font-mono">
                MONITORING KINERJA & KONTRAK
              </span>
              <h1 className="text-lg font-bold text-stone-900 tracking-tight">
                Pelaporan Paket Pengadaan (Tender & PL)
              </h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Rekapitulasi lengkap data kontrak, CCO, progres fisik, status tepat waktu, keuangan, PPK, dan PPTK.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#701524] hover:bg-rose-900 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Paket</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-stone-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama paket, kontrak, penyedia, PPK..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#701524]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-bold shrink-0">Metode:</span>
            <select
              value={methodFilter}
              onChange={(e: any) => setMethodFilter(e.target.value)}
              className="w-full py-2 px-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#701524]"
            >
              <option value="ALL">Semua Metode (Tender & PL)</option>
              <option value="TENDER">Tender / Seleksi</option>
              <option value="PL">Pengadaan Langsung (PL)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-bold shrink-0">Status:</span>
            <select
              value={timelyFilter}
              onChange={(e) => setTimelyFilter(e.target.value)}
              className="w-full py-2 px-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#701524]"
            >
              <option value="ALL">Semua Status Waktu</option>
              <option value="Tepat Waktu">Tepat Waktu</option>
              <option value="Selesai">Selesai</option>
              <option value="Perpanjangan Waktu">Perpanjangan Waktu</option>
              <option value="Sampai Tanggal">Sampai Tanggal</option>
              <option value="PHK">PHK</option>
            </select>
          </div>
        </div>
      </div>

      {/* REPORTING MASTER TABLE */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="text-xs font-black text-stone-700 uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#701524]" />
            <span>Daftar Pelaporan Kontrak & Kinerja ({filteredPackages.length} Paket)</span>
          </div>
          <span className="text-[10px] font-mono text-stone-500 bg-stone-200 px-2 py-0.5 rounded">
            Sinkronisasi Google Sheet: Aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-black uppercase text-[10px] border-b border-stone-200">
                <th className="p-3 w-10 text-center">No</th>
                <th className="p-3 min-w-[200px]">Nama Paket / Dinas / Bidang</th>
                <th className="p-3">Metode & Kontrak</th>
                <th className="p-3">No. CCO</th>
                <th className="p-3">Tanggal Kontrak & Akhir</th>
                <th className="p-3 text-right">Nilai Kontrak (Rp)</th>
                <th className="p-3 text-center">Masa Pelaksanaan</th>
                <th className="p-3 text-center">Progres & Tepat Waktu</th>
                <th className="p-3">Pelaksana (CV/PT)</th>
                <th className="p-3">Serah Terima & Keuangan</th>
                <th className="p-3">PPK & PPTK</th>
                <th className="p-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-medium text-stone-800">
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-stone-400 text-xs italic">
                    Belum ada data pelaporan paket yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg, idx) => {
                  const method = pkg.methodType || 'PL';
                  const ccos = pkg.ccoNumbers || [];
                  const timely = pkg.timelyStatus || 'Tepat Waktu';
                  const progress = pkg.progressStatus !== undefined ? pkg.progressStatus : (pkg.overallProgress || 0);

                  let timelyBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  if (timely === 'PHK') timelyBadge = 'bg-rose-100 text-rose-800 border-rose-300';
                  if (timely === 'Perpanjangan Waktu') timelyBadge = 'bg-amber-100 text-amber-800 border-amber-300';
                  if (timely === 'Selesai') timelyBadge = 'bg-blue-100 text-blue-800 border-blue-300';

                  return (
                    <tr key={pkg.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="p-3 text-center font-bold text-stone-500">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-stone-900 leading-snug">{pkg.name}</div>
                        <div className="text-[10px] text-stone-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-stone-700">{pkg.skpdName || pkg.dinasName}</span>
                          <span>·</span>
                          <span className="text-stone-400">{pkg.bidangName || 'Bidang Teknis'}</span>
                        </div>
                      </td>
                      <td className="p-3 space-y-1">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-mono font-bold rounded ${method === 'TENDER' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {method === 'TENDER' ? 'TENDER / SELEKSI' : 'PENGADAAN LANGSUNG'}
                        </span>
                        <div className="font-mono text-stone-700 text-[11px] font-bold">{pkg.contractNo || 'Belum Ada Kontrak'}</div>
                      </td>
                      <td className="p-3">
                        {ccos.length > 0 ? (
                          <div className="space-y-1">
                            {ccos.map((cco, cIdx) => (
                              <span key={cIdx} className="inline-block px-1.5 py-0.5 bg-stone-100 text-stone-700 text-[10px] font-mono font-bold rounded border border-stone-300 mr-1">
                                CCO #{cIdx + 1}: {cco}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic text-[11px]">- (Tanpa CCO)</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                        <div>Mulai: {pkg.contractDate || '-'}</div>
                        <div className="text-stone-900 font-bold">Akhir: {pkg.contractEndDate || pkg.deadlineDate || '-'}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#701524]">
                        {formatRupiah(pkg.contractValue || pkg.negotiationValue || pkg.hpsValue || 0)}
                      </td>
                      <td className="p-3 text-center text-stone-600 font-medium">
                        {pkg.executionPeriod || `${pkg.executionDurationDays || 60} Hari`}
                      </td>
                      <td className="p-3 text-center space-y-1.5">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-16 bg-stone-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-[#701524] h-2 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="font-mono text-[10px] font-bold">{progress}%</span>
                        </div>
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded border ${timelyBadge}`}>
                          {timely} {pkg.timelyStatus === 'Perpanjangan Waktu' && pkg.timelyUntilDate ? `s.d ${pkg.timelyUntilDate}` : ''}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-stone-900">
                        {pkg.contractorName || pkg.vendorName || '-'}
                      </td>
                      <td className="p-3 text-[11px] space-y-1">
                        <div className="font-semibold text-stone-800">{pkg.handoverWork || 'Belum Serah Terima'}</div>
                        <div className="text-stone-500 font-mono text-[10px]">{pkg.financialStatus || 'Uang Muka 20%'}</div>
                      </td>
                      <td className="p-3 text-[11px] space-y-0.5">
                        <div className="font-bold text-stone-900">PPK: {pkg.ppkName || '-'}</div>
                        <div className="text-stone-500">PPTK: {pkg.pptkName || 'Ir. Budi Santoso'}</div>
                      </td>
                      <td className="p-3 text-center flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(pkg)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#701524] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer mx-auto"
                          title="Edit Laporan Paket"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPinAction({ type: 'delete', pkg });
                            setPinModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer mx-auto"
                          title="Hapus Laporan Paket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT / ADD REPORT MODAL */}
      {editingPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#23090e] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wide">Edit Pelaporan Kinerja & Kontrak Paket</h3>
                <p className="text-[11px] text-rose-200/80 mt-0.5 truncate max-w-xl">{editingPkg.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPkg(null)}
                className="p-1.5 rounded-xl text-rose-200 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReport} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Metode Pengadaan</label>
                  <select
                    value={formMethod}
                    onChange={(e: any) => setFormMethod(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold focus:ring-2 focus:ring-[#701524]"
                  >
                    <option value="PL">Pengadaan Langsung (PL)</option>
                    <option value="TENDER">Tender / Seleksi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Nomor Kontrak</label>
                  <input
                    type="text"
                    value={formContractNo}
                    onChange={(e) => setFormContractNo(e.target.value)}
                    placeholder="Contoh: KONTRAK/PUPR/2026/012"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-[#701524]"
                    required
                  />
                </div>
              </div>

              {/* DYNAMIC CCO NUMBERS */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-stone-700 uppercase text-[11px] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#701524]" />
                    <span>Nomor CCO (Contract Change Order - Bisa Bertambah)</span>
                  </label>
                  <button
                    type="button"
                    onClick={addCcoField}
                    className="px-2 py-1 bg-[#701524] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-rose-900 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah CCO</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {formCcoList.map((ccoVal, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ccoVal}
                        onChange={(e) => {
                          const updated = [...formCcoList];
                          updated[cIdx] = e.target.value;
                          setFormCcoList(updated);
                        }}
                        placeholder={`No. CCO #${cIdx + 1} (Misal: CCO-01/KONTRAK/2026)`}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono focus:ring-2 focus:ring-[#701524]"
                      />
                      {formCcoList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCcoField(cIdx)}
                          className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 cursor-pointer"
                          title="Hapus CCO"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Tanggal Kontrak</label>
                  <input
                    type="date"
                    value={formContractDate}
                    onChange={(e) => setFormContractDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Tanggal Akhir Kontrak</label>
                  <input
                    type="date"
                    value={formContractEndDate}
                    onChange={(e) => setFormContractEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Nilai Kontrak (Rp)</label>
                  <input
                    type="number"
                    value={formContractValue}
                    onChange={(e) => setFormContractValue(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-[#701524]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Masa Pelaksanaan</label>
                  <input
                    type="text"
                    value={formExecutionPeriod}
                    onChange={(e) => setFormExecutionPeriod(e.target.value)}
                    placeholder="Contoh: 60 Hari Kalender"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Status Kemajuan (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formProgressStatus}
                    onChange={(e) => setFormProgressStatus(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Status Tepat Waktu</label>
                  <select
                    value={formTimelyStatus}
                    onChange={(e: any) => setFormTimelyStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  >
                    <option value="Tepat Waktu">Tepat Waktu</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Perpanjangan Waktu">Perpanjangan Waktu</option>
                    <option value="Sampai Tanggal">Sampai Tanggal</option>
                    <option value="PHK">PHK</option>
                  </select>
                </div>
              </div>

              {formTimelyStatus === 'Perpanjangan Waktu' && (
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Perpanjangan Waktu Sampai Tanggal</label>
                  <input
                    type="date"
                    value={formTimelyUntilDate}
                    onChange={(e) => setFormTimelyUntilDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Nama CV / PT Pelaksana</label>
                  <input
                    type="text"
                    value={formContractorName}
                    onChange={(e) => setFormContractorName(e.target.value)}
                    placeholder="Contoh: CV. Nagekeo Konstruksi"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Nama Dinas / Instansi</label>
                  <input
                    type="text"
                    value={formDinasName}
                    onChange={(e) => setFormDinasName(e.target.value)}
                    placeholder="Dinas PUPR Kab. Nagekeo"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Nama Bidang</label>
                  <input
                    type="text"
                    value={formBidangName}
                    onChange={(e) => setFormBidangName(e.target.value)}
                    placeholder="Bidang Cipta Karya"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Serah Terima Pekerjaan (PHO / FHO)</label>
                  <input
                    type="text"
                    value={formHandoverWork}
                    onChange={(e) => setFormHandoverWork(e.target.value)}
                    placeholder="PHO 100% Selesai Tanggal ..."
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Status Keuangan (Uang Muka & Termin)</label>
                  <input
                    type="text"
                    value={formFinancialStatus}
                    onChange={(e) => setFormFinancialStatus(e.target.value)}
                    placeholder="Uang Muka 20%, Termin 1 50%, Termin 2 30%"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Nama PPK (Pejabat Pembuat Komitmen)</label>
                  <input
                    type="text"
                    value={formPpkName}
                    onChange={(e) => setFormPpkName(e.target.value)}
                    placeholder="Nama & Gelar PPK"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Nama PPTK</label>
                  <input
                    type="text"
                    value={formPptkName}
                    onChange={(e) => setFormPptkName(e.target.value)}
                    placeholder="Nama & Gelar PPTK"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPkg(null)}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#701524] hover:bg-rose-900 text-white font-extrabold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan & Sinkronkan ke Google Sheet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <SecurityPinModal
        isOpen={pinModalOpen}
        title="Konfirmasi Penghapusan dengan PIN"
        itemName={pinAction?.pkg?.name}
        itemTypeLabel="Paket Laporan"
        warningNote="Data paket yang dihapus tidak dapat dikembalikan."
        onConfirm={handleDeleteConfirmed}
        onClose={() => {
          setPinModalOpen(false);
          setPinInput('');
          setPinAction(null);
          setPinError(false);
        }}
      />
    </div>
  );
};
