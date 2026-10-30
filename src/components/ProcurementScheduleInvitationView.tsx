/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { ProcurementPackage, DocumentChecklistItem } from '../types/procurement';
import { formatRupiah, formatDate } from '../utils/formatters';
import {
  Calendar,
  Printer,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  Building2,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Edit3,
  Eye,
  Upload,
  Image as ImageIcon,
  Paperclip,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export interface ScheduleItem {
  id: string;
  activity: string;
  dateRange: string;
  timeRange: string;
}

export type SignatureTemplateMode = 'TEMPLATE_OVAL' | 'UPLOADED' | 'DIGITAL_BLUE' | 'EMPTY';

interface ProcurementScheduleInvitationViewProps {
  procurementPackage: ProcurementPackage;
  onUpdatePackage: (updatedPkg: ProcurementPackage) => void;
  onNavigateToTab?: (tab: 'CHECKLIST_TABLE' | 'STAGE_WORKFLOW') => void;
}

export const ProcurementScheduleInvitationView: React.FC<ProcurementScheduleInvitationViewProps> = ({
  procurementPackage,
  onUpdatePackage,
  onNavigateToTab,
}) => {
  // Mode: 'SPLIT_VIEW' (Form + Live Paper Preview) vs 'FULL_PREVIEW'
  const [viewMode, setViewMode] = useState<'SPLIT_VIEW' | 'FULL_PREVIEW'>('SPLIT_VIEW');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Hidden File Input Refs for Logo & Signature Upload
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const sigInputRef = useRef<HTMLInputElement | null>(null);

  // LOGO STATE:
  // "logo di kosongkan dulu nanti saya yang taruh logonya siapkan strukturnya"
  // Default is null (empty structure prepared) or retrieved from localStorage if user placed one
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sipelang_official_logo');
    } catch {
      return null;
    }
  });

  // SIGNATURE TEMPLATE STATE:
  // "tanda tangan bisa kah di buat template untuk menempel tanda tangan dengan pdf"
  // Default is 'TEMPLATE_OVAL' matching image_d0126f30.png with dashed oval and blue signature
  const [signatureMode, setSignatureMode] = useState<SignatureTemplateMode>('TEMPLATE_OVAL');
  const [customSignature, setCustomSignature] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sipelang_official_signature');
    } catch {
      return null;
    }
  });
  const [signatureFileName, setSignatureFileName] = useState<string | null>(null);

  // Form State initialized with Package Data and Default Government values matching document
  const [nomorSurat, setNomorSurat] = useState(
    procurementPackage.registerNumber
      ? `154/PP-PK/PUPR-NGK/IX/2026`
      : '154/PP-PK/PUPR-NGK/IX/2026'
  );
  const [tanggalSurat, setTanggalSurat] = useState('29 September 2026');
  const [lampiran, setLampiran] = useState('1 (satu) berkas');
  const [namaPenyedia, setNamaPenyedia] = useState(
    procurementPackage.vendorName || 'CV. Bahtera Mandiri'
  );
  const [alamatPenyedia, setAlamatPenyedia] = useState('di tempat');
  const [perihal, setPerihal] = useState(
    `Pengadaan Langsung untuk Paket pekerjaan ${procurementPackage.name || 'Peningkatan Jalan Produksi ke Tambak Garam Rakyat di Desa Aeramo'} pada ${procurementPackage.skpdName || 'Dinas Pekerjaan Umum Dan Penataan Ruang'}`
  );

  // Scope of Work list (Lingkup Pekerjaan)
  const [scopeItems, setScopeItems] = useState<string[]>([
    'Pekerjaan Pendahuluan',
    'Pekerjaan Galian Tanah',
    'Pekerjaan Timbunan dan Pemadatan',
    'Pekerjaan Pasangan',
    'Pekerjaan Dewatering',
    'Pekerjaan Perpipaan',
  ]);
  const [newScopeInput, setNewScopeInput] = useState('');

  // Total HPS & Sumber Dana
  const [hpsValue, setHpsValue] = useState<number>(procurementPackage.hpsValue || 99945000);
  const [sumberDana, setSumberDana] = useState(
    `DPA ${procurementPackage.skpdName || 'Dinas Pekerjaan Umum Dan Penataan Ruang'} Tahun Anggaran ${procurementPackage.fiscalYear || 2026}`
  );

  // Pelaksanaan Pengadaan Info
  const [tempatPengadaan, setTempatPengadaan] = useState('Bagian Pengadaan Barang dan Jasa');
  const [teleponPengadaan, setTeleponPengadaan] = useState('-');
  const [websitePengadaan, setWebsitePengadaan] = useState('https://lpse.nagekeokab.go.id');

  // Schedule Table Rows (Penjadwalan Pengadaan Langsung)
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    {
      id: 'sch-1',
      activity: 'Pemasukan dan pembukaan dokumen',
      dateRange: 'Rabu/30 September s.d. Sabtu /3 Oktober 2026',
      timeRange: '15.00 s.d. 23.59',
    },
    {
      id: 'sch-2',
      activity: 'Evaluasi, klarifikasi teknis dan negosiasi harga',
      dateRange: 'Minggu /4 Oktober s.d. Selasa/6 Oktober 2026',
      timeRange: '00.00 s.d. 13.59',
    },
    {
      id: 'sch-3',
      activity: 'Penandatangan SPK',
      dateRange: 'Selasa/6 Oktober 2026',
      timeRange: '-',
    },
  ]);

  // Pejabat Pengadaan Signatory
  const [pejabatNama, setPejabatNama] = useState('Florentina Bupu, ST., MT');
  const [pejabatNip, setPejabatNip] = useState('19880810 201903 2 009');
  const [pejabatJabatan, setPejabatJabatan] = useState(
    `Pejabat Pengadaan pada ${procurementPackage.skpdName || 'Dinas Pekerjaan Umum dan Penataan Ruang'}`
  );

  // Scope handlers
  const handleAddScope = () => {
    if (newScopeInput.trim()) {
      setScopeItems([...scopeItems, newScopeInput.trim()]);
      setNewScopeInput('');
    }
  };

  const handleRemoveScope = (index: number) => {
    setScopeItems(scopeItems.filter((_, idx) => idx !== index));
  };

  // Schedule handlers
  const handleAddScheduleRow = () => {
    const newRow: ScheduleItem = {
      id: `sch-${Date.now()}`,
      activity: 'Kegiatan Tambahan',
      dateRange: 'Hari/Tanggal',
      timeRange: '08.00 s.d. 16.00',
    };
    setScheduleItems([...scheduleItems, newRow]);
  };

  const handleUpdateScheduleRow = (id: string, field: keyof ScheduleItem, val: string) => {
    setScheduleItems(
      scheduleItems.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleDeleteScheduleRow = (id: string) => {
    setScheduleItems(scheduleItems.filter((item) => item.id !== id));
  };

  // Handle Logo Upload / Clear
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCustomLogo(result);
      try {
        localStorage.setItem('sipelang_official_logo', result);
      } catch (err) {
        console.warn('Storage limit reached, retained in memory', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setCustomLogo(null);
    try {
      localStorage.removeItem('sipelang_official_logo');
    } catch {}
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  // Handle Signature Upload / Clear
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSignatureFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCustomSignature(result);
      setSignatureMode('UPLOADED');
      try {
        localStorage.setItem('sipelang_official_signature', result);
      } catch (err) {
        console.warn('Storage limit reached, retained in memory', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearSignature = () => {
    setCustomSignature(null);
    setSignatureFileName(null);
    setSignatureMode('EMPTY');
    try {
      localStorage.removeItem('sipelang_official_signature');
    } catch {}
    if (sigInputRef.current) sigInputRef.current.value = '';
  };

  // Save to SIPELANG and auto-fulfill Document Checklist Item #2 (Surat Undangan)
  const handleSaveDocumentAndSync = () => {
    // 1. Update checklist in package
    const existingChecklist = procurementPackage.documentChecklist || [];
    const updatedChecklist: DocumentChecklistItem[] = existingChecklist.map((ch, idx) => {
      // Find item related to "Undangan" or index 1
      if (idx === 1 || ch.title.toLowerCase().includes('undangan')) {
        return {
          ...ch,
          isDone: true,
          status: 'DISETUJUI',
          documentNumber: nomorSurat,
          date: new Date().toISOString().slice(0, 10),
          notes: `Telah diterbitkan Surat Undangan Pengadaan Langsung ke ${namaPenyedia} jadwal lengkap terlampir`,
        };
      }
      return ch;
    });

    // 2. Also ensure stage PERMINTAAN_PENAWARAN status reflects this
    const updatedStages = { ...procurementPackage.stages };
    if (updatedStages.PERMINTAAN_PENAWARAN) {
      updatedStages.PERMINTAAN_PENAWARAN = {
        ...updatedStages.PERMINTAAN_PENAWARAN,
        status: 'completed',
        completedDate: new Date().toISOString().slice(0, 10),
        notes: `Surat Undangan resmi No. ${nomorSurat} kepada ${namaPenyedia} telah diterbitkan dan terjadwal.`,
        checklists: (updatedStages.PERMINTAAN_PENAWARAN.checklists || []).map((c) => ({
          ...c,
          isDone: true,
        })),
      };
    }

    const updatedPackage: ProcurementPackage = {
      ...procurementPackage,
      registerNumber: nomorSurat,
      vendorName: namaPenyedia,
      documentChecklist: updatedChecklist,
      stages: updatedStages,
    };

    onUpdatePackage(updatedPackage);
    setSaveSuccessNotice(
      `Surat Undangan No. ${nomorSurat} berhasil disimpan! Baris #2 pada Tabel Ceklist otomatis Tercentang (√) dan Status Disetujui.`
    );

    setTimeout(() => {
      setSaveSuccessNotice(null);
    }, 7000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Hidden file inputs for uploading logo & signature */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleLogoUpload}
        className="hidden"
      />
      <input
        ref={sigInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        onChange={handleSignatureUpload}
        className="hidden"
      />

      {/* Top Banner Overview */}
      <div className="bg-stone-900 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl text-amber-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase bg-amber-500 text-stone-950 px-2 py-0.5 rounded font-mono">
                BAGIAN PENJADWALAN PENGADAAN LANGSUNG
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs font-mono text-stone-300">Format Resmi Pemkab Nagekeo</span>
            </div>
            <h2 className="text-base font-extrabold text-white mt-0.5">
              Surat Undangan Pengadaan Langsung & Penjadwalan Pelaksanaan
            </h2>
            <p className="text-xs text-stone-300 mt-0.5">
              Lengkapi data paket, lingkup pekerjaan, dan jadwal pengadaan lalu cetak dokumen resmi untuk audit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-300">
          <span className="px-2.5 py-1 bg-white/10 rounded-lg font-mono">
            Paket: <strong className="text-white">{procurementPackage.codeRUP}</strong>
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-3.5 text-xs font-medium flex items-center justify-between gap-3 shadow-xs animate-in fade-in print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('CHECKLIST_TABLE')}
              className="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950 shrink-0 cursor-pointer flex items-center gap-1"
            >
              <span>Lihat Tabel Ceklist</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Main Content Layout: Split or Full Preview */}
      <div
        className={`grid gap-5 ${
          viewMode === 'SPLIT_VIEW' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
        }`}
      >
        {/* LEFT COLUMN: INTERACTIVE FORM EDITOR (Hidden in FULL_PREVIEW mode & in Print) */}
        {viewMode === 'SPLIT_VIEW' && (
          <div className="lg:col-span-5 space-y-4 print:hidden">
            <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#701524]" />
                  <span>Isian Data Surat & Penjadwalan</span>
                </h3>
                <span className="text-[10px] text-stone-500 font-mono">Live Sync</span>
              </div>

              {/* Header Surat Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                      Nomor Surat Undangan
                    </label>
                    <input
                      type="text"
                      value={nomorSurat}
                      onChange={(e) => setNomorSurat(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#701524]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                      Tanggal Surat
                    </label>
                    <input
                      type="text"
                      value={tanggalSurat}
                      onChange={(e) => setTanggalSurat(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                      Nama Calon Rekanan / Penyedia
                    </label>
                    <input
                      type="text"
                      value={namaPenyedia}
                      onChange={(e) => setNamaPenyedia(e.target.value)}
                      placeholder="e.g. CV. Bahtera Mandiri"
                      className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-[#701524]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                      Tujuan Alamat
                    </label>
                    <input
                      type="text"
                      value={alamatPenyedia}
                      onChange={(e) => setAlamatPenyedia(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                    Perihal Surat
                  </label>
                  <textarea
                    rows={2}
                    value={perihal}
                    onChange={(e) => setPerihal(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                  />
                </div>
              </div>

              {/* Point 1: Paket Pengadaan Details */}
              <div className="pt-2 border-t border-stone-100 space-y-3">
                <h4 className="text-[11px] font-bold text-stone-800 uppercase tracking-wide">
                  1. Rincian Paket & Nilai HPS
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                      Nilai Total HPS (Rp)
                    </label>
                    <input
                      type="number"
                      value={hpsValue}
                      onChange={(e) => setHpsValue(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#701524]"
                    />
                    <span className="text-[10px] text-stone-500 font-mono mt-0.5 block">
                      {formatRupiah(hpsValue)}
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                      Sumber Pendanaan
                    </label>
                    <input
                      type="text"
                      value={sumberDana}
                      onChange={(e) => setSumberDana(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                    />
                  </div>
                </div>

                {/* Lingkup Pekerjaan (Editable List) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase block">
                    Lingkup Pekerjaan Konstruksi (Daftar Poin):
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {scopeItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 text-xs bg-stone-50 px-2 py-1 rounded border border-stone-200"
                      >
                        <span className="w-5 font-bold text-stone-500 shrink-0 font-mono">
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...scopeItems];
                            updated[idx] = e.target.value;
                            setScopeItems(updated);
                          }}
                          className="flex-1 bg-transparent border-none text-xs focus:outline-none font-medium text-stone-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveScope(idx)}
                          className="text-stone-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                          title="Hapus poin lingkup pekerjaan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={newScopeInput}
                      onChange={(e) => setNewScopeInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddScope()}
                      placeholder="Tambah butir lingkup pekerjaan baru..."
                      className="flex-1 px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                    />
                    <button
                      type="button"
                      onClick={handleAddScope}
                      className="px-2.5 py-1.5 bg-[#701524] hover:bg-[#59101c] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Point 2: Pelaksanaan Pengadaan */}
              <div className="pt-2 border-t border-stone-100 space-y-2.5">
                <h4 className="text-[11px] font-bold text-stone-800 uppercase tracking-wide">
                  2. Pelaksanaan Pengadaan
                </h4>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                    Tempat dan Alamat
                  </label>
                  <input
                    type="text"
                    value={tempatPengadaan}
                    onChange={(e) => setTempatPengadaan(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                  />
                </div>
              </div>

              {/* Tabel Penjadwalan Pengadaan */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-stone-800 uppercase tracking-wide">
                    Tabel Penjadwalan Pengadaan Langsung
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddScheduleRow}
                    className="text-[10px] font-bold text-[#701524] hover:text-[#59101c] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {scheduleItems.map((sch, idx) => (
                    <div
                      key={sch.id}
                      className="bg-stone-50 border border-stone-200 rounded-lg p-2.5 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-700 font-mono text-[11px]">
                          Kegiatan #{idx + 1}
                        </span>
                        {scheduleItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteScheduleRow(sch.id)}
                            className="text-stone-400 hover:text-red-600 p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={sch.activity}
                        onChange={(e) =>
                          handleUpdateScheduleRow(sch.id, 'activity', e.target.value)
                        }
                        placeholder="Nama kegiatan..."
                        className="w-full px-2 py-1 text-xs border border-stone-300 rounded font-medium bg-white"
                      />

                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={sch.dateRange}
                          onChange={(e) =>
                            handleUpdateScheduleRow(sch.id, 'dateRange', e.target.value)
                          }
                          placeholder="Hari/Tanggal (e.g. Rabu/30 Sept...)"
                          className="w-full px-2 py-1 text-[11px] border border-stone-300 rounded font-mono bg-white"
                        />
                        <input
                          type="text"
                          value={sch.timeRange}
                          onChange={(e) =>
                            handleUpdateScheduleRow(sch.id, 'timeRange', e.target.value)
                          }
                          placeholder="Waktu (e.g. 15.00 s.d. 23.59)"
                          className="w-full px-2 py-1 text-[11px] border border-stone-300 rounded font-mono bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pejabat Pengadaan Signatory */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
                <label className="text-[10px] font-bold text-stone-500 uppercase block">
                  Pejabat Pengadaan (Penandatangan)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={pejabatNama}
                    onChange={(e) => setPejabatNama(e.target.value)}
                    placeholder="Nama Pejabat Pengadaan"
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg font-bold"
                  />
                  <input
                    type="text"
                    value={pejabatNip}
                    onChange={(e) => setPejabatNip(e.target.value)}
                    placeholder="NIP Pejabat"
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg font-mono text-stone-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN (OR FULL WIDTH): OFFICIAL DOCUMENT LIVE PRINT PREVIEW */}
        <div
          className={`${
            viewMode === 'SPLIT_VIEW' ? 'lg:col-span-7' : 'max-w-4xl mx-auto w-full'
          } overflow-x-auto`}
        >
          {/* ========================================================================= */}
          {/* ACTION TOOLBAR NEATLY SITUATED DIRECTLY ABOVE DOCUMENT PREVIEW */}
          {/* "tombol di rapikan di atas dokumen" */}
          {/* ========================================================================= */}
          <div className="bg-stone-900 text-white rounded-2xl p-3 sm:p-4 shadow-md mb-3 space-y-3 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-stone-100">
                  Pratinjau Lembar Surat Resmi (A4 Standar)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-amber-300 font-mono">
                  Pemkab Nagekeo
                </span>
              </div>

              {/* View Mode Toggle */}
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'SPLIT_VIEW' ? 'FULL_PREVIEW' : 'SPLIT_VIEW')}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border border-stone-700 self-start sm:self-auto"
              >
                {viewMode === 'SPLIT_VIEW' ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Format Penuh A4</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mode Edit Isian</span>
                  </>
                )}
              </button>
            </div>

            {/* Neatly Aligned Action Controls Directly Above Document */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {/* Button 1: Logo Structure Control */}
              <div className="relative">
                {customLogo ? (
                  <div className="flex items-center gap-1 w-full">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="flex-1 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Ganti logo instansi"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate">Logo Terpasang</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearLogo}
                      className="px-2 py-2 bg-stone-800 hover:bg-red-900/60 text-stone-400 hover:text-red-300 rounded-xl border border-stone-700 cursor-pointer"
                      title="Kosongkan Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full px-3 py-2 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-200 text-xs font-bold rounded-xl border border-dashed border-stone-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Logo saat ini dikosongkan (struktur siap). Klik untuk menaruh logo Anda"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span className="truncate">Taruh Logo (PNG/JPG)</span>
                  </button>
                )}
              </div>

              {/* Button 2: Signature Template & Upload Control */}
              <div className="relative">
                {customSignature && signatureMode === 'UPLOADED' ? (
                  <div className="flex items-center gap-1 w-full">
                    <button
                      type="button"
                      onClick={() => sigInputRef.current?.click()}
                      className="flex-1 px-3 py-2 bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-bold rounded-xl border border-blue-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Ganti berkas tanda tangan yang ditempel"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-blue-300" />
                      <span className="truncate">TTD Ditempel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureMode('TEMPLATE_OVAL')}
                      className="px-2 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl border border-stone-700 cursor-pointer"
                      title="Kembalikan ke Template Oval"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 w-full">
                    <button
                      type="button"
                      onClick={() => sigInputRef.current?.click()}
                      className="flex-1 px-3 py-2 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Tempel tanda tangan dari file (PNG/JPG/PDF scan)"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                      <span className="truncate">Tempel TTD (PDF/Scan)</span>
                    </button>
                    <select
                      value={signatureMode}
                      onChange={(e) => setSignatureMode(e.target.value as SignatureTemplateMode)}
                      className="px-2 py-2 bg-stone-800 border border-stone-700 rounded-xl text-[11px] font-bold text-amber-300 cursor-pointer focus:outline-none"
                      title="Pilih Model Tanda Tangan"
                    >
                      <option value="TEMPLATE_OVAL">Template Oval</option>
                      <option value="DIGITAL_BLUE">Paraf Biru</option>
                      <option value="EMPTY">Kosong (Basah)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Button 3: Simpan & Sinkronkan Ceklist */}
              <button
                type="button"
                onClick={handleSaveDocumentAndSync}
                className="w-full px-3 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer border border-emerald-500/30"
                title="Simpan dokumen & otomatis centang (√) baris Dokumen #2 pada Formulir Ceklist"
              >
                <Save className="w-4 h-4 text-emerald-200" />
                <span className="truncate">Simpan & Sinkron Ceklist</span>
              </button>

              {/* Button 4: Cetak Dokumen Resmi PDF */}
              <button
                type="button"
                onClick={handlePrint}
                className="w-full px-3 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer border border-amber-300"
                title="Cetak format A4 resmi atau simpan sebagai PDF"
              >
                <Printer className="w-4 h-4 text-stone-950" />
                <span className="truncate">Cetak Dokumen (PDF)</span>
              </button>
            </div>
          </div>

          {/* Printable White Paper Box */}
          <div className="bg-white border border-stone-300/80 rounded-2xl shadow-lg p-6 sm:p-10 font-sans text-stone-900 leading-normal min-w-[650px] print:border-none print:shadow-none print:p-0 print:m-0">
            {/* KOP SURAT RESMI PEMERINTAH KABUPATEN NAGEKEO */}
            <div className="relative pb-3 border-b-[2.5px] border-stone-900 space-y-1">
              <div className="flex items-center justify-center gap-4">
                {/* ========================================================================= */}
                {/* STRUKTUR TEMPAT LOGO (DIKOSONGKAN SESUAI PERMINTAAN, STRUKTUR DISIAPKAN) */}
                {/* "logo di kosongkan dulu nanti saya yang taruh logonya siapkan strukturnya" */}
                {/* ========================================================================= */}
                <div className="w-20 h-24 shrink-0 flex items-center justify-center relative">
                  {customLogo ? (
                    <div className="relative group w-full h-full flex items-center justify-center">
                      <img
                        src={customLogo}
                        alt="Logo Resmi Instansi"
                        className="max-w-full max-h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleClearLogo}
                        className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity print:hidden cursor-pointer shadow-xs"
                        title="Hapus Logo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full h-full border-2 border-dashed border-stone-300 hover:border-[#701524] hover:bg-rose-50/20 rounded-xl flex flex-col items-center justify-center p-1 text-center transition-all cursor-pointer group print:border-none print:bg-transparent"
                      title="Struktur Logo Siap: Klik untuk menaruh logo instansi Anda (PNG / JPG / SVG)"
                    >
                      <div className="p-1 rounded bg-stone-100 group-hover:bg-rose-100 text-stone-400 group-hover:text-[#701524] transition-colors print:hidden">
                        <Upload className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-bold text-stone-500 group-hover:text-[#701524] leading-tight mt-1 print:hidden">
                        Struktur Logo
                      </span>
                      <span className="text-[8px] text-stone-400 group-hover:text-stone-600 print:hidden">
                        (Klik Pasang)
                      </span>
                    </div>
                  )}
                </div>

                {/* Header Text Centered */}
                <div className="text-center flex-1 pr-6">
                  <h1 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-900 leading-tight">
                    PEMERINTAH KABUPATEN NAGEKEO
                  </h1>
                  <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-stone-950 mt-0.5 leading-snug">
                    {procurementPackage.skpdName || 'DINAS PEKERJAAN UMUM DAN PENATAAN RUANG'}
                  </h2>
                  <p className="text-[11px] text-stone-700 font-medium">
                    Kompleks Bendungan Sutami - Mbay
                  </p>
                  <p className="text-xs font-extrabold tracking-[0.25em] text-stone-900 mt-0.5">
                    M B A Y
                  </p>
                </div>
              </div>

              {/* Second Thin Border Line of Indonesian Government Kop */}
              <div className="border-b border-stone-900 pt-0.5"></div>
            </div>

            {/* METADATA BAR: NOMOR, LAMPIRAN, TEMPAT/TANGGAL */}
            <div className="pt-4 pb-2 space-y-3 text-xs leading-relaxed">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5 w-1/2">
                  <div className="flex">
                    <span className="w-16 font-normal">Nomor</span>
                    <span className="w-3">:</span>
                    <span className="font-medium font-mono">{nomorSurat}</span>
                  </div>
                  <div className="flex">
                    <span className="w-16 font-normal">Lamp</span>
                    <span className="w-3">:</span>
                    <span className="font-normal">{lampiran}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span>Mbay, {tanggalSurat}</span>
                </div>
              </div>

              {/* RECIPIENT / YTH */}
              <div className="pt-1 space-y-0.5">
                <div className="flex">
                  <span className="w-16 font-normal">Yth.</span>
                  <div className="space-y-0.5">
                    <div className="font-bold text-stone-950">{namaPenyedia}</div>
                    <div>{alamatPenyedia}</div>
                  </div>
                </div>
              </div>

              {/* PERIHAL */}
              <div className="pt-1 flex items-start">
                <span className="w-16 font-normal shrink-0">Perihal</span>
                <span className="w-3 shrink-0">:</span>
                <div className="font-medium text-justify leading-snug">
                  {perihal}
                </div>
              </div>

              {/* OPENING STATEMENT */}
              <div className="pt-3 text-justify">
                <p>
                  Dengan ini Saudara kami undang untuk mengikuti proses Pengadaan Langsung secara elektronik paket Pengadaan Konstruksi sebagai berikut:
                </p>
              </div>

              {/* POINT 1: PAKET PENGADAAN */}
              <div className="space-y-1 pt-1">
                <div className="font-normal">1. Paket Pengadaan</div>
                <div className="pl-4 space-y-1">
                  <div className="flex items-start">
                    <span className="w-36 shrink-0">Nama paket pekerjaan</span>
                    <span className="w-3 shrink-0">:</span>
                    <span className="font-medium">{procurementPackage.name || 'Peningkatan Jalan Produksi ke Tambak Garam Rakyat di Desa Aeramo'}</span>
                  </div>

                  {/* Scope of Work */}
                  <div className="flex items-start">
                    <span className="w-36 shrink-0">Lingkup pekerjaan</span>
                    <span className="w-3 shrink-0">:</span>
                    <div className="flex-1 space-y-0.5">
                      <div>Ruang lingkup pekerjaan konstruksi meliputi :</div>
                      <ol className="list-decimal pl-5 space-y-0.5">
                        {scopeItems.map((item, idx) => (
                          <li key={idx} className="leading-snug">
                            {item}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* Nilai total HPS */}
                  <div className="flex items-start pt-1">
                    <span className="w-36 shrink-0">Nilai total HPS</span>
                    <span className="w-3 shrink-0">:</span>
                    <div className="flex items-center gap-1 font-mono font-medium">
                      <span>Rp</span>
                      <span className="pl-4">{hpsValue.toLocaleString('id-ID')},00</span>
                    </div>
                  </div>

                  {/* Sumber Pendanaan */}
                  <div className="flex items-start">
                    <span className="w-36 shrink-0">Sumber Pendanaan</span>
                    <span className="w-3 shrink-0">:</span>
                    <div className="flex-1 leading-snug">{sumberDana}</div>
                  </div>
                </div>
              </div>

              {/* POINT 2: PELAKSANAAN PENGADAAN */}
              <div className="space-y-1 pt-1">
                <div className="font-normal">2. Pelaksanaan Pengadaan</div>
                <div className="pl-4 space-y-0.5">
                  <div className="flex items-start">
                    <span className="w-36 shrink-0">Tempat dan alamat</span>
                    <span className="w-3 shrink-0">:</span>
                    <span>{tempatPengadaan}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-36 shrink-0">Telepon</span>
                    <span className="w-3 shrink-0">:</span>
                    <span>{teleponPengadaan}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-36 shrink-0">Website</span>
                    <span className="w-3 shrink-0">:</span>
                    <span>{websitePengadaan}</span>
                  </div>
                </div>
              </div>

              {/* SCHEDULE INSTRUCTION & OFFICIAL TABLE */}
              <div className="pt-2 space-y-2.5">
                <p>
                  Saudara diminta untuk memasukkan penawaran administrasi, teknis dan harga secara langsung sesuai dengan jadwal pelaksanaan sebagai berikut :
                </p>

                {/* EXACT TABLE FROM DOCUMENT (image_4384edf9.png) */}
                <table className="w-full text-left border-collapse border-2 border-stone-900 text-xs my-2">
                  <thead>
                    <tr className="bg-stone-50 border-b-2 border-stone-900 font-bold text-stone-900 text-center">
                      <th className="p-2 border-r-2 border-stone-900 w-10">No</th>
                      <th className="p-2 border-r-2 border-stone-900 w-1/2">Kegiatan</th>
                      <th className="p-2 border-r-2 border-stone-900 w-1/3">Hari/Tanggal</th>
                      <th className="p-2 border-stone-900 w-32">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-stone-900">
                    {scheduleItems.map((row, idx) => (
                      <tr key={row.id}>
                        <td className="p-2 text-center border-r-2 border-stone-900 font-bold align-middle">
                          {idx + 1}
                        </td>
                        <td className="p-2 border-r-2 border-stone-900 font-medium leading-snug">
                          {row.activity}
                        </td>
                        <td className="p-2 border-r-2 border-stone-900 font-medium leading-snug">
                          {row.dateRange}
                        </td>
                        <td className="p-2 border-stone-900 text-center font-mono align-middle">
                          {row.timeRange}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* CLOSING PARAGRAPHS */}
              <div className="space-y-2 pt-1">
                <p>
                  Apabila saudara membutuhkan keterangan dan penjelasan lebih lanjut, dapat menghubungi kami sesuai alamat tersebut di atas sampai batas akhir pemasukan dokumen penawaran.
                </p>
                <p>Demikian disampaikan untuk diketahui.</p>
              </div>

              {/* ========================================================================= */}
              {/* BLOK TANDA TANGAN DENGAN TEMPLATE MENEMPEL TANDA TANGAN (SESUAI GAMBAR) */}
              {/* "dan tanda tangan bisa kah di buat template untuk menempel tanda tangan dengan pdf" */}
              {/* ========================================================================= */}
              <div className="pt-6 flex justify-end">
                <div className="w-80 text-center space-y-1">
                  <div className="text-xs font-normal">
                    {pejabatJabatan}
                  </div>

                  {/* Template Zone for Signature (Height 85px) */}
                  <div className="relative py-1 flex items-center justify-center min-h-[85px]">
                    {signatureMode === 'UPLOADED' && customSignature ? (
                      /* Mode: Berkas Tanda Tangan Hasil Unggah (PDF scan / PNG / JPG) */
                      <div className="relative group flex items-center justify-center w-full h-20">
                        <img
                          src={customSignature}
                          alt="Tanda Tangan Ditempel"
                          className="max-h-20 max-w-[200px] object-contain select-none"
                        />
                        <button
                          type="button"
                          onClick={handleClearSignature}
                          className="absolute -top-1 right-8 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity print:hidden cursor-pointer shadow-xs"
                          title="Hapus Tanda Tangan"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : signatureMode === 'TEMPLATE_OVAL' ? (
                      /* Mode: Template Oval Menempel Tanda Tangan (Matches image_d0126f30.png) */
                      <div
                        onClick={() => sigInputRef.current?.click()}
                        className="relative w-full h-20 flex items-center justify-center cursor-pointer group"
                        title="Template Menempel Tanda Tangan: Klik untuk menempel berkas tanda tangan dari file / scan PDF"
                      >
                        {/* Blue ink signature stroke wave with dashed oval guideline matching image_d0126f30.png */}
                        <svg width="220" height="75" viewBox="0 0 220 75" className="select-none pointer-events-none">
                          {/* Dashed Oval Template Guideline (Template menempel tanda tangan) */}
                          <ellipse
                            cx="110"
                            cy="36"
                            rx="55"
                            ry="26"
                            fill="none"
                            stroke="#60a5fa"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                            className="group-hover:stroke-blue-600 transition-colors"
                          />
                          {/* Fluid blue ink signature curve */}
                          <path
                            d="M30,48 Q60,18 85,38 T135,28 Q155,50 175,22 T205,42"
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M75,25 C95,68 120,60 145,42 C165,30 160,65 180,50"
                            fill="none"
                            stroke="#1d4ed8"
                            strokeWidth="2"
                          />
                        </svg>

                        {/* Interactive prompt on hover in screen view */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50/70 rounded-lg print:hidden">
                          <span className="text-[10px] font-bold text-blue-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded shadow-xs border border-blue-200">
                            <Upload className="w-3 h-3" />
                            Klik utk Tempel File Tanda Tangan
                          </span>
                        </div>
                      </div>
                    ) : signatureMode === 'DIGITAL_BLUE' ? (
                      /* Mode: Paraf Tinta Biru tanpa Garis Oval */
                      <div className="relative w-full h-20 flex items-center justify-center">
                        <svg width="200" height="70" viewBox="0 0 200 70">
                          <path
                            d="M20,45 Q45,15 70,38 T120,28 Q140,50 160,22 T190,40"
                            fill="none"
                            stroke="#1d4ed8"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M60,22 C80,70 110,60 140,40 C160,30 150,65 170,50"
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    ) : (
                      /* Mode: Kosong untuk Tanda Tangan Basah Manual */
                      <div className="h-20 flex items-center justify-center print:border-none">
                        <span className="text-[10px] text-stone-300 italic print:hidden">
                          (Ruang tanda tangan basah & stempel manual)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="font-bold underline text-stone-950 text-xs tracking-wide">
                    {pejabatNama}
                  </div>
                  <div className="font-mono text-[11px] text-stone-700">
                    Nip. {pejabatNip}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
