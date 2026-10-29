/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { OPDNumberingConfig } from '../types/procurement';
import { generateAllDocumentNumbers } from '../utils/numberingGenerator';
import { SecurityPinModal } from './SecurityPinModal';
import {
  Plus,
  Edit3,
  Trash2,
  Building2,
  FileText,
  Hash,
  BookOpen,
  Search,
  BookmarkCheck,
  Layers,
  Copy,
  Check,
} from 'lucide-react';

interface OPDNumberingViewProps {
  opdList: OPDNumberingConfig[];
  onAddOPD: (newOpd: OPDNumberingConfig) => void;
  onUpdateOPD: (updatedOpd: OPDNumberingConfig) => void;
  onDeleteOPD: (opdId: string) => void;
}

export const OPDNumberingView: React.FC<OPDNumberingViewProps> = ({
  opdList,
  onAddOPD,
  onUpdateOPD,
  onDeleteOPD,
}) => {
  const [editingOpd, setEditingOpd] = useState<OPDNumberingConfig | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'REGISTER_BOOK' | 'CARDS'>('REGISTER_BOOK');

  // Stateful deletion confirmation banner
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formClassification, setFormClassification] = useState('027');
  const [formCounter, setFormCounter] = useState<number>(0);
  const [formPadding, setFormPadding] = useState<number>(3);
  const [formPackageTpl, setFormPackageTpl] = useState('{NO}/PP-{KODE_PENGADAAN}/{KODE_OPD}-NGK/{BULAN_ROMAWI}/{TAHUN}');
  const [formInvitationTpl, setFormInvitationTpl] = useState('{NO}/PP-{KODE_PENGADAAN}.UND/{KODE_OPD}-NGK/{BULAN_ROMAWI}/{TAHUN}');
  const [formBahplTpl, setFormBahplTpl] = useState('{NO}/PP-{KODE_PENGADAAN}.BAHPL/{KODE_OPD}-NGK/{BULAN_ROMAWI}/{TAHUN}');
  const [formSpkTpl, setFormSpkTpl] = useState('{NO}/PP-{KODE_PENGADAAN}.SPK/{KODE_OPD}-NGK/{BULAN_ROMAWI}/{TAHUN}');

  // Copy indicator state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Open modal for new
  const handleOpenCreate = () => {
    setEditingOpd(null);
    setFormName('');
    setFormCode('');
    setFormClassification('027');
    setFormCounter(0);
    setFormPadding(3);
    setFormPackageTpl('{NO}/PP-{KODE_PENGADAAN}/{KODE_OPD}-NGK/{BULAN_ROMAWI}/{TAHUN}');
    setFormInvitationTpl('{NO}/PP-{KODE_PENGADAAN}.UND/{KODE_OPD}-NGK/{BULAN_ROMAWI}/{TAHUN}');
    setFormBahplTpl('{NO}/PP-{KODE_PENGADAAN}.BAHPL/{KODE_OPD}-NGK/{BULAN_ROMAWI}/{TAHUN}');
    setFormSpkTpl('{NO}/PP-{KODE_PENGADAAN}.SPK/{KODE_OPD}-NGK/{BULAN_ROMAWI}/{TAHUN}');
    setIsCreatingNew(true);
  };

  // Open modal for edit
  const handleOpenEdit = (opd: OPDNumberingConfig) => {
    setEditingOpd(opd);
    setFormName(opd.opdName);
    setFormCode(opd.opdCode);
    setFormClassification(opd.classificationCode);
    setFormCounter(opd.currentCounter);
    setFormPadding(opd.counterPadding || 3);
    setFormPackageTpl(opd.templatePackageReg);
    setFormInvitationTpl(opd.templateInvitation);
    setFormBahplTpl(opd.templateBAHPL);
    setFormSpkTpl(opd.templateSPK);
    setIsCreatingNew(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      return;
    }

    const opdPayload: OPDNumberingConfig = {
      id: editingOpd ? editingOpd.id : `opd-${Date.now()}`,
      opdName: formName.trim(),
      opdCode: formCode.trim().toUpperCase(),
      classificationCode: formClassification.trim(),
      currentCounter: Number(formCounter),
      counterPadding: Number(formPadding),
      templatePackageReg: formPackageTpl.trim(),
      templateInvitation: formInvitationTpl.trim(),
      templateBAHPL: formBahplTpl.trim(),
      templateSPK: formSpkTpl.trim(),
      fiscalYear: 2026,
      lastUpdated: new Date().toISOString().slice(0, 10),
    };

    if (editingOpd) {
      onUpdateOPD(opdPayload);
    } else {
      onAddOPD(opdPayload);
    }

    setIsCreatingNew(false);
    setEditingOpd(null);
  };

  const requestDelete = (id: string, name: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
  };

  const confirmDeleteAction = () => {
    if (deleteConfirmId) {
      onDeleteOPD(deleteConfirmId);
      setDeleteConfirmId(null);
      setDeleteConfirmName('');
    }
  };

  // Filter OPDs
  const filteredOpds = opdList.filter(
    (o) =>
      o.opdName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.opdCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.classificationCode.includes(searchQuery)
  );

  // Live preview mockup for the form modal
  const mockFormOpd: OPDNumberingConfig = {
    id: 'mock',
    opdName: formName || 'Nama OPD',
    opdCode: formCode.toUpperCase() || 'OPD',
    classificationCode: formClassification || '027',
    currentCounter: Number(formCounter) || 0,
    counterPadding: Number(formPadding) || 3,
    templatePackageReg: formPackageTpl,
    templateInvitation: formInvitationTpl,
    templateBAHPL: formBahplTpl,
    templateSPK: formSpkTpl,
    fiscalYear: 2026,
    lastUpdated: '',
  };

  const livePreviews = generateAllDocumentNumbers(mockFormOpd, Number(formCounter) + 1);

  return (
    <div className="space-y-6">
      
      {/* DELETION CONFIRMATION WITH DAILY PIN */}
      <SecurityPinModal
        isOpen={!!deleteConfirmId}
        title="Hapus Buku Registrasi OPD"
        itemName={deleteConfirmName}
        itemTypeLabel="Buku Register OPD"
        warningNote="Seluruh format rumus penomoran dan counter dokumen untuk OPD ini akan dihapus dari sistem SIPELANG."
        onConfirm={confirmDeleteAction}
        onClose={() => {
          setDeleteConfirmId(null);
          setDeleteConfirmName('');
        }}
      />

      {/* ASN OFFICIAL BUKU REGISTRASI HEADER CARD */}
      <div className="bg-[#23090e] text-rose-50 rounded-2xl p-5 shadow-md border border-[#3a141b] relative overflow-hidden">
        {/* Stamp Watermark Accent */}
        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none select-none">
          <BookOpen className="w-48 h-48 text-rose-300" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold bg-rose-900/80 text-rose-200 px-2.5 py-0.5 rounded-full border border-rose-700/60 uppercase">
                Buku Agenda & Register ASN
              </span>
              <span className="text-[10px] font-mono text-rose-300">
                Permendagri No. 1/2023 • Perpres No. 12/2021
              </span>
            </div>

            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-rose-400" />
              <span>Buku Registrasi Penomoran Surat OPD / SKPD</span>
            </h1>

            <p className="text-xs text-rose-200/80 max-w-2xl leading-relaxed">
              Buku Agenda Resmi Pengadaan Barang dan Jasa Kabupaten Nagekeo. Mengontrol nomor urut (*counter*), kode klasifikasi arsip, dan penomoran otomatis untuk berkas Paket, Surat Undangan, BAHPL, dan SPK.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer border border-rose-400/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Registrasi OPD Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTROLS BAR: SEARCH & BUKU AGENDA VIEW SWITCH */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama OPD / SKPD, kode singkatan, atau kode klasifikasi (027)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#701524]/20 focus:border-[#701524]"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex rounded-xl border border-stone-200 p-0.5 bg-stone-100 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('REGISTER_BOOK')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'REGISTER_BOOK'
                  ? 'bg-[#701524] text-white font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Tabel Buku Agenda</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'CARDS'
                  ? 'bg-[#701524] text-white font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lembar Kartu OPD</span>
            </button>
          </div>

          <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-xl border border-stone-200">
            {filteredOpds.length} SKPD
          </span>
        </div>
      </div>

      {/* VIEW MODE 1: TABEL BUKU AGENDA KENDALI SURAT (FAVORED BY ASN) */}
      {viewMode === 'REGISTER_BOOK' && (
        <div className="bg-white border border-stone-300 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Official Ledger Title Bar */}
          <div className="bg-stone-800 text-stone-100 p-3 px-4 flex items-center justify-between text-xs font-bold tracking-tight">
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-rose-400" />
              <span className="uppercase tracking-wider">BUKU REGISTER PENOMORAN SURAT OPD KABUPATEN NAGEKEO</span>
            </div>
            <span className="font-mono text-[11px] text-stone-400">FORMAT RESMI TAHUN 2026</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-300 text-stone-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <th className="p-3 pl-4 border-r border-stone-200 text-center w-12">No</th>
                  <th className="p-3 border-r border-stone-200">Organisasi Perangkat Daerah (OPD)</th>
                  <th className="p-3 border-r border-stone-200 text-center w-28">Kode OPD</th>
                  <th className="p-3 border-r border-stone-200 text-center w-28">Klasifikasi</th>
                  <th className="p-3 border-r border-stone-200 text-center w-36">Counter Terakhir</th>
                  <th className="p-3 border-r border-stone-200">Contoh Format Nomor Surat Berikutnya</th>
                  <th className="p-3 text-center w-24">Kendali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-sans">
                {filteredOpds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-500 italic">
                      Tidak ada data OPD yang ditemukan dalam Buku Register.
                    </td>
                  </tr>
                ) : (
                  filteredOpds.map((opd, idx) => {
                    const nextNumbers = generateAllDocumentNumbers(opd);
                    const formattedCounter = String(opd.currentCounter).padStart(opd.counterPadding || 3, '0');
                    const nextCounterFormatted = String(opd.currentCounter + 1).padStart(opd.counterPadding || 3, '0');

                    return (
                      <tr key={opd.id} className="hover:bg-rose-50/30 transition-colors">
                        {/* No */}
                        <td className="p-3 pl-4 border-r border-stone-200 text-center font-mono font-bold text-stone-500">
                          {String(idx + 1).padStart(2, '0')}
                        </td>

                        {/* Nama OPD */}
                        <td className="p-3 border-r border-stone-200">
                          <div className="font-bold text-stone-900 text-xs">
                            {opd.opdName}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                            Pola: <span className="text-stone-600 truncate">{opd.templatePackageReg}</span>
                          </div>
                        </td>

                        {/* Kode OPD */}
                        <td className="p-3 border-r border-stone-200 text-center font-mono font-bold text-stone-800 bg-stone-50/60">
                          <span className="bg-stone-200 px-2 py-0.5 rounded text-[11px]">
                            {opd.opdCode}
                          </span>
                        </td>

                        {/* Kode Klasifikasi */}
                        <td className="p-3 border-r border-stone-200 text-center font-mono font-bold text-rose-950">
                          <span className="bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                            {opd.classificationCode}
                          </span>
                        </td>

                        {/* Counter Terakhir & Berikutnya */}
                        <td className="p-3 border-r border-stone-200 text-center font-mono">
                          <div className="text-[10px] text-stone-400">Terakhir: <strong className="text-stone-900">{formattedCounter}</strong></div>
                          <div className="text-xs font-bold text-[#701524] mt-0.5">
                            Next: {nextCounterFormatted}
                          </div>
                        </td>

                        {/* Contoh Format Nomor Surat */}
                        <td className="p-3 border-r border-stone-200 font-mono text-[11px]">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between bg-rose-50/50 p-1 px-2 rounded border border-rose-100">
                              <span className="text-[10px] text-stone-500 font-sans">Register Paket:</span>
                              <strong className="text-stone-900 font-bold ml-2 truncate max-w-[280px]">
                                {nextNumbers.packageRegNumber}
                              </strong>
                              <button
                                type="button"
                                onClick={() => handleCopy(nextNumbers.packageRegNumber, `${opd.id}-pkg`)}
                                className="ml-1 p-0.5 text-stone-400 hover:text-[#701524] cursor-pointer"
                                title="Salin Nomor"
                              >
                                {copiedId === `${opd.id}-pkg` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>

                            <div className="flex items-center justify-between bg-stone-50 p-1 px-2 rounded border border-stone-100">
                              <span className="text-[10px] text-stone-500 font-sans">Surat SPK:</span>
                              <strong className="text-[#701524] font-bold ml-2 truncate max-w-[280px]">
                                {nextNumbers.spkNumber}
                              </strong>
                              <button
                                type="button"
                                onClick={() => handleCopy(nextNumbers.spkNumber, `${opd.id}-spk`)}
                                className="ml-1 p-0.5 text-stone-400 hover:text-[#701524] cursor-pointer"
                                title="Salin Nomor"
                              >
                                {copiedId === `${opd.id}-spk` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Kendali Action */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(opd)}
                              title="Edit Format OPD"
                              className="p-1.5 text-stone-600 hover:text-[#701524] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDelete(opd.id, opd.opdName)}
                              title="Hapus OPD"
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-stone-100 border-t border-stone-300 flex items-center justify-between text-[11px] text-stone-600 font-mono">
            <span>Buku Register Kendali Penomoran Surat OPD • Kabupaten Nagekeo</span>
            <span>Total Terdaftar: <strong>{opdList.length} SKPD</strong></span>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: LEMBAR KARTU OPD GRID */}
      {viewMode === 'CARDS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOpds.map((opd) => {
            const nextNumbers = generateAllDocumentNumbers(opd);

            return (
              <div
                key={opd.id}
                className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between hover:border-stone-300 transition-all hover:shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#701524] flex items-center justify-center font-bold text-xs shrink-0 border border-rose-200/60">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-stone-900 line-clamp-1">
                          {opd.opdName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-stone-400">
                          <span>Kode: <strong className="text-stone-700">{opd.opdCode}</strong></span>
                          <span>·</span>
                          <span>Klasifikasi: <strong className="text-stone-700">{opd.classificationCode}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(opd)}
                        title="Edit Format Penomoran"
                        className="p-1 text-stone-500 hover:text-[#701524] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(opd.id, opd.opdName)}
                        title="Hapus OPD"
                        className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Counter Strip */}
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-stone-400 block font-mono">Nomor Terakhir:</span>
                      <span className="font-mono font-bold text-stone-900 text-sm">
                        {String(opd.currentCounter).padStart(opd.counterPadding || 3, '0')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-stone-400 block font-mono">Berikutnya (Auto):</span>
                      <span className="font-mono font-bold text-[#701524] text-sm">
                        {String(opd.currentCounter + 1).padStart(opd.counterPadding || 3, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Generated Numbers Preview */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Simulasi Penomoran Otomatis Berikutnya:
                    </span>
                    
                    <div className="p-2.5 bg-rose-50/30 rounded-xl border border-rose-100/70 space-y-1 text-[11px] font-mono">
                      <div className="flex justify-between items-center text-stone-600">
                        <span className="text-[10px] text-stone-400 font-sans">Register Paket:</span>
                        <strong className="text-stone-900 truncate ml-2">{nextNumbers.packageRegNumber}</strong>
                      </div>
                      <div className="flex justify-between items-center text-stone-600">
                        <span className="text-[10px] text-stone-400 font-sans">Undangan PL:</span>
                        <strong className="text-stone-800 truncate ml-2">{nextNumbers.invitationNumber}</strong>
                      </div>
                      <div className="flex justify-between items-center text-stone-600">
                        <span className="text-[10px] text-stone-400 font-sans">BAHPL:</span>
                        <strong className="text-stone-800 truncate ml-2">{nextNumbers.bahplNumber}</strong>
                      </div>
                      <div className="flex justify-between items-center text-stone-600">
                        <span className="text-[10px] text-stone-400 font-sans">SPK:</span>
                        <strong className="text-[#701524] truncate ml-2">{nextNumbers.spkNumber}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                  <span>Padding: {opd.counterPadding || 3} Digit</span>
                  <span className="font-mono">TA {opd.fiscalYear}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT BUKU REGISTRASI PENOMORAN OPD */}
      {isCreatingNew && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-sm text-white">
                  {editingOpd ? 'Edit Penomoran OPD dalam Buku Register' : 'Tambah OPD Baru ke Buku Register'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-stone-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* OPD Identity */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 pb-1 border-b border-stone-100 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#701524]" />
                  <span>1. Identitas Perangkat Daerah (OPD / SKPD)</span>
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nama Resmi OPD / Dinas / SKPD <span className="text-[#701524]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dinas Komunikasi dan Informatika"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524]/20 focus:border-[#701524]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Kode Singkatan OPD <span className="text-[#701524]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="DISKOMINFO"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono uppercase border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524]/20 focus:border-[#701524]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Kode Klasifikasi Permendagri
                    </label>
                    <input
                      type="text"
                      placeholder="027"
                      value={formClassification}
                      onChange={(e) => setFormClassification(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524]/20 focus:border-[#701524]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nomor Urut Terakhir (*Counter*)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formCounter}
                      onChange={(e) => setFormCounter(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs font-mono border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524]/20 focus:border-[#701524]"
                    />
                    <span className="text-[10px] text-stone-400 mt-0.5 block">Nomor berikutnya otomatis: {formCounter + 1}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Digit Format (*Padding*)
                    </label>
                    <select
                      value={formPadding}
                      onChange={(e) => setFormPadding(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs font-mono border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524]/20 focus:border-[#701524] cursor-pointer"
                    >
                      <option value="2">2 Digit (misal: 01, 15)</option>
                      <option value="3">3 Digit (misal: 001, 015)</option>
                      <option value="4">4 Digit (misal: 0001, 0015)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Templates */}
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 border-b border-stone-100 gap-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#701524]" />
                    <span>2. Pola / Format Template Penomoran</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setFormPackageTpl('{NO}/PP-{KODE_PENGADAAN}/{KODE_OPD}-NGK/{BULAN_ROMAWI}/{TAHUN}');
                      setFormInvitationTpl('{NO}/PP-{KODE_PENGADAAN}.UND/{KODE_OPD}-NGK/{BULAN_ROMAWI}/{TAHUN}');
                      setFormBahplTpl('{NO}/PP-{KODE_PENGADAAN}.BAHPL/{KODE_OPD}-NGK/{BULAN_ROMAWI}/{TAHUN}');
                      setFormSpkTpl('{NO}/PP-{KODE_PENGADAAN}.SPK/{KODE_OPD}-NGK/{BULAN_ROMAWI}/{TAHUN}');
                    }}
                    className="px-2.5 py-1 bg-rose-50 text-[#701524] hover:bg-rose-100 rounded-lg text-[10px] font-bold border border-rose-200 transition-colors cursor-pointer"
                  >
                    ★ Terapkan Format Standar Nagekeo (LPSE)
                  </button>
                </div>

                <div className="text-[10px] font-mono text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="font-sans font-bold text-stone-800">Format Baku Surat Dinas: </span>
                  <span className="text-[#701524] font-bold block mt-0.5">
                    Nomor surat/PP-Kode Pengadaan/Kode dinas-NGK/Bulan (Romawi)/Tahun
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Format Nomor Register Paket PL
                  </label>
                  <input
                    type="text"
                    value={formPackageTpl}
                    onChange={(e) => setFormPackageTpl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#701524]"
                  />
                  <span className="text-[10px] text-[#701524] font-mono mt-0.5 block">
                    Contoh: {livePreviews.packageRegNumber}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Format Surat Permintaan Penawaran
                  </label>
                  <input
                    type="text"
                    value={formInvitationTpl}
                    onChange={(e) => setFormInvitationTpl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#701524]"
                  />
                  <span className="text-[10px] text-stone-500 font-mono mt-0.5 block">
                    Contoh: {livePreviews.invitationNumber}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Format Berita Acara Hasil Pengadaan Langsung (BAHPL)
                  </label>
                  <input
                    type="text"
                    value={formBahplTpl}
                    onChange={(e) => setFormBahplTpl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#701524]"
                  />
                  <span className="text-[10px] text-stone-500 font-mono mt-0.5 block">
                    Contoh: {livePreviews.bahplNumber}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Format Surat Perintah Kerja (SPK)
                  </label>
                  <input
                    type="text"
                    value={formSpkTpl}
                    onChange={(e) => setFormSpkTpl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#701524]"
                  />
                  <span className="text-[10px] text-[#701524] font-mono font-bold mt-0.5 block">
                    Contoh: {livePreviews.spkNumber}
                  </span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#701524] hover:bg-[#58101c] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Simpan ke Buku Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
