/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { OPDNumberingConfig } from '../types/procurement';
import { generateAllDocumentNumbers, formatWithCounter } from '../utils/numberingGenerator';
import {
  Binary,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Building2,
  FileText,
  Sparkles,
  HelpCircle,
  Hash,
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
      alert('Mohon isi nama OPD dan kode singkatan.');
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

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus konfigurasi penomoran untuk "${name}"?`)) {
      onDeleteOPD(id);
    }
  };

  // Live preview mockup for the form
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
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-stone-900 tracking-tight">
              Sistem Penomoran Otomatis Berdasarkan OPD
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-[#701524] border border-rose-200/60">
              {opdList.length} OPD Terdaftar
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Atur format penomoran surat, nomor register paket, BAHPL, dan SPK otomatis sesuai daftar list masing-masing OPD/SKPD.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-1.5 bg-[#701524] hover:bg-[#58101c] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Format OPD</span>
        </button>
      </div>

      {/* OPD Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opdList.map((opd) => {
          const nextNumbers = generateAllDocumentNumbers(opd);

          return (
            <div
              key={opd.id}
              className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between hover:border-stone-300 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#701524] flex items-center justify-center font-bold text-xs">
                      <Building2 className="w-3.5 h-3.5" />
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
                      onClick={() => handleOpenEdit(opd)}
                      title="Edit Format Penomoran"
                      className="p-1 text-stone-500 hover:text-[#701524] hover:bg-rose-50 rounded transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(opd.id, opd.opdName)}
                      title="Hapus OPD"
                      className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Counter Strip */}
                <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200/80 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-stone-400 block font-mono">Nomor Terakhir Terbit:</span>
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
                  
                  <div className="p-2 bg-rose-50/30 rounded border border-rose-100/70 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between items-center text-stone-600">
                      <span className="text-[10px] text-stone-400">Register Paket:</span>
                      <strong className="text-stone-900 truncate ml-2">{nextNumbers.packageRegNumber}</strong>
                    </div>
                    <div className="flex justify-between items-center text-stone-600">
                      <span className="text-[10px] text-stone-400">Undangan PL:</span>
                      <strong className="text-stone-800 truncate ml-2">{nextNumbers.invitationNumber}</strong>
                    </div>
                    <div className="flex justify-between items-center text-stone-600">
                      <span className="text-[10px] text-stone-400">BAHPL:</span>
                      <strong className="text-stone-800 truncate ml-2">{nextNumbers.bahplNumber}</strong>
                    </div>
                    <div className="flex justify-between items-center text-stone-600">
                      <span className="text-[10px] text-stone-400">SPK:</span>
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

      {/* Modal: Tambah / Edit OPD Numbering Config */}
      {isCreatingNew && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-xl w-full max-h-[90vh] shadow-xl border border-stone-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#701524]" />
                <h3 className="font-bold text-sm text-stone-900">
                  {editingOpd ? 'Edit Format Penomoran OPD' : 'Tambah OPD & Aturan Penomoran'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreatingNew(false)}
                className="text-stone-400 hover:text-stone-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* OPD Identity */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 pb-1 border-b border-stone-100">
                  1. Identitas Organisasi Perangkat Daerah (OPD)
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nama OPD / Dinas / SKPD <span className="text-[#701524]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dinas Komunikasi dan Informatika"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
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
                      className="w-full px-2.5 py-1.5 text-xs font-mono uppercase border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Kode Klasifikasi Surat
                    </label>
                    <input
                      type="text"
                      placeholder="027"
                      value={formClassification}
                      onChange={(e) => setFormClassification(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nomor Urut Terakhir (Counter)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formCounter}
                      onChange={(e) => setFormCounter(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                    />
                    <span className="text-[10px] text-stone-400 mt-0.5 block">Paket berikutnya akan bernomor {formCounter + 1}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Digit Nomor (Padding)
                    </label>
                    <select
                      value={formPadding}
                      onChange={(e) => setFormPadding(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
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
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    2. Pola / Format Template Penomoran
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setFormPackageTpl('{NO}/PP-{KODE_PENGADAAN}/{KODE_OPD}-NGK/{BULAN_ROMAWI}/{TAHUN}');
                      setFormInvitationTpl('{NO}/PP-{KODE_PENGADAAN}.UND/{KODE_OPD}-NGK/{BULAN_ROMAWI}/{TAHUN}');
                      setFormBahplTpl('{NO}/PP-{KODE_PENGADAAN}.BAHPL/{KODE_OPD}-NGK/{BULAN_ROMAWI}/{TAHUN}');
                      setFormSpkTpl('{NO}/PP-{KODE_PENGADAAN}.SPK/{KODE_OPD}-NGK/{BULAN_ROMAWI}/{TAHUN}');
                    }}
                    className="px-2 py-0.5 bg-rose-50 text-[#701524] hover:bg-rose-100 rounded text-[10px] font-semibold border border-rose-200 transition-colors self-start sm:self-auto"
                  >
                    ★ Terapkan Format Standar Nagekeo (LPSE)
                  </button>
                </div>
                <div className="text-[10px] font-mono text-stone-500 bg-stone-50 p-2 rounded border border-stone-200">
                  <span className="font-sans font-bold text-stone-700">Format Resmi: </span>
                  <span className="text-[#701524] font-bold">Nomor surat/PP-Kode Pengadaan/Kode dinas-NGK/Bulan (angka Romawi sesuai tanggal surat)/Tahun</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Format Nomor Register Paket PL
                  </label>
                  <input
                    type="text"
                    value={formPackageTpl}
                    onChange={(e) => setFormPackageTpl(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                  />
                  <span className="text-[10px] text-[#701524] font-mono mt-0.5 block">
                    Hasil: {livePreviews.packageRegNumber}
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
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                  />
                  <span className="text-[10px] text-stone-600 font-mono mt-0.5 block">
                    Hasil: {livePreviews.invitationNumber}
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
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                  />
                  <span className="text-[10px] text-stone-600 font-mono mt-0.5 block">
                    Hasil: {livePreviews.bahplNumber}
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
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                  />
                  <span className="text-[10px] text-[#701524] font-mono font-bold mt-0.5 block">
                    Hasil: {livePreviews.spkNumber}
                  </span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3.5 py-1.5 border border-stone-300 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#701524] hover:bg-[#58101c] text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Simpan Aturan OPD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
