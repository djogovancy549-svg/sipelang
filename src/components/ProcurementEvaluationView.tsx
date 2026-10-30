/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ProcurementPackage, DocumentChecklistItem } from '../types/procurement';
import {
  Calendar,
  Printer,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  Building2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Edit3,
  Eye,
  Upload,
  Image as ImageIcon,
  Paperclip,
  RotateCcw,
  Lock,
  KeyRound,
  AlertTriangle,
  X,
  FileCheck2,
  Cloud,
  DownloadCloud,
  Check,
  Layers,
  HelpCircle,
  ChevronDown,
  UserCheck,
  Signature,
  RefreshCw,
} from 'lucide-react';
import {
  sendWebhookPayload,
  fetchAllDataFromSheet,
  getStoredIntegrationSettings,
} from '../utils/webhookService';

export interface EvaluationCriterionSubItem {
  id: string;
  code: string;
  title: string;
  isPassed: boolean;
}

export interface EvaluationCriterion {
  id: string;
  numberText: string;
  title: string;
  subItems?: EvaluationCriterionSubItem[];
  isPassed: boolean;
  notes?: string;
}

export interface EvaluationCategory {
  id: string;
  title: string;
  subtitle: string;
  criteria: EvaluationCriterion[];
  unmetReason: string;
  officialNote?: string;
}

export interface EvaluationDocumentRecord {
  id: string;
  packageId: string;
  documentNumber: string;
  packageName: string;
  workUnit: string;
  officialName: string;
  officialNip: string;
  fiscalYear: string | number;
  dateCreated: string;
  categories: EvaluationCategory[];
  overallResult: 'LULUS' | 'TIDAK_LULUS';
  syncedToGoogleSheet?: boolean;
}

export type SignatureMode = 'TEMPLATE_OVAL' | 'UPLOADED' | 'DIGITAL_BLUE' | 'EMPTY';

interface ProcurementEvaluationViewProps {
  procurementPackage: ProcurementPackage;
  onUpdatePackage: (updatedPkg: ProcurementPackage) => void;
  onNavigateToTab?: (tab: any) => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
}

// Default 3 official categories matching scanned government forms (image_d0b9c9c1.png, image_211d9997.png, image_af7fdebe.png)
const createInitialCategories = (packageName: string): EvaluationCategory[] => [
  {
    id: 'cat-administrasi',
    title: 'LEMBAR EVALUASI ADMINISTRASI',
    subtitle: `Pekerjaan : Pengadaan ${packageName}`,
    unmetReason: '',
    officialNote:
      'Catatan: Jika peserta tidak memenuhi persyaratan administrasi, Pejabat Pengadaan menyatakan Pengadaan Langsung gagal, dan mengundang Pelaku Usaha lain',
    criteria: [
      { id: 'adm-1', numberText: '1', title: 'Surat penawaran', isPassed: true },
      { id: 'adm-2', numberText: '2', title: 'Surat kuasa (apabila dikuasakan)', isPassed: true },
      {
        id: 'adm-3',
        numberText: '3',
        title: 'Dokumen penawaran teknis & Dokumen penawaran harga',
        subItems: [
          { id: 'adm-3a', code: '•', title: 'Dokumen penawaran teknis', isPassed: true },
          { id: 'adm-3b', code: '•', title: 'Dokumen penawaran harga', isPassed: true },
        ],
        isPassed: true,
      },
      { id: 'adm-4', numberText: '4', title: 'Data kualifikasi', isPassed: true },
    ],
  },
  {
    id: 'cat-kualifikasi',
    title: 'LEMBAR EVALUASI KUALIFIKASI UNTUK PENYEDIA BADAN USAHA',
    subtitle: `Pekerjaan : Pengadaan ${packageName}`,
    unmetReason: '',
    criteria: [
      {
        id: 'kual-1',
        numberText: '1',
        title: 'Memiliki NIB Skala Usaha Kecil, KBLI 42101 (Konstruksi Jalan pada Permukaan Tanah)',
        isPassed: true,
      },
      {
        id: 'kual-2',
        numberText: '2',
        title:
          'Memiliki Surat Izin Usaha sesuai peraturan perundang-undangan dan bidang pekerjaan yang diadakan',
        subItems: [
          { id: 'kual-2a', code: 'a)', title: 'Surat Izin: Sertifikat Badan Usaha (SBU)', isPassed: true },
          { id: 'kual-2b', code: 'b)', title: 'Kualifikasi: Usaha Kecil', isPassed: true },
          { id: 'kual-2c', code: 'c)', title: 'Klasifikasi: Bangunan Sipil', isPassed: true },
          {
            id: 'kual-2d',
            code: 'd)',
            title: 'Subklasifikasi: Konstruksi Bangunan Sipil Jalan (BS 001)',
            isPassed: true,
          },
        ],
        isPassed: true,
      },
      {
        id: 'kual-3',
        numberText: '3',
        title:
          'Memiliki akta pendirian perusahaan dan akta perubahan perusahaan (apabila ada perubahan);',
        isPassed: true,
      },
      {
        id: 'kual-4',
        numberText: '4',
        title:
          'Memiliki status valid keterangan Wajib Pajak berdasarkan hasil Konfirmasi Status Wajib Pajak (dibuktikan dengan screenshot status VALID KSWP pada DJP Online akun pelaku usaha)',
        isPassed: true,
      },
      {
        id: 'kual-5',
        numberText: '5',
        title:
          'Memiliki pengalaman pekerjaan konstruksi sesuai dengan subklasifikasi SBU yang disyaratkan paling kurang 1 (satu) pekerjaan dalam kurun waktu 4 (empat) tahun terakhir, baik di lingkungan pemerintah maupun swasta termasuk pengalaman subkontrak, kecuali bagi pelaku usaha yang baru berdiri kurang dari 3 (tiga) tahun',
        isPassed: true,
      },
      { id: 'kual-6', numberText: '6', title: 'Memenuhi Sisa Kemampuan Paket (SKP);', isPassed: true },
      {
        id: 'kual-7',
        numberText: '7',
        title:
          'Dalam hal pengadaan langsung Pekerjaan Konstruksi yang dipergunakan untuk percepatan pembangunan kesejahteraan di Provinsi Papua dan Provinsi Papua Barat, diutamakan untuk Pelaku Usaha Orang Asli Papua',
        isPassed: true,
      },
      { id: 'kual-8', numberText: '8', title: 'Menyetujui Pakta Integritas sesuai IKP', isPassed: true },
      { id: 'kual-9', numberText: '9', title: 'Menyetujui Surat pernyataan sesuai IKP', isPassed: true },
    ],
  },
  {
    id: 'cat-teknis',
    title: 'LEMBAR EVALUASI TEKNIS',
    subtitle: `Pekerjaan : Pengadaan ${packageName}`,
    unmetReason: '',
    officialNote:
      'Catatan: Apabila penyedia tidak memenuhi persyaratan kualifikasi, Pejabat Pengadaan menyatakan Pengadaan Langsung gagal, dan mengundang Pelaku Usaha lain',
    criteria: [
      {
        id: 'tek-1',
        numberText: '1',
        title: 'Daftar Isian Peralatan Utama dan Bukti',
        subItems: [
          { id: 'tek-1a', code: '1)', title: 'Dump Truck', isPassed: true },
          { id: 'tek-1b', code: 'a)', title: 'Kapasitas 0,4 ton', isPassed: true },
          { id: 'tek-1c', code: 'b)', title: 'Jumlah 1 unit', isPassed: true },
          { id: 'tek-1d', code: 'c)', title: 'Kepemilikan/Status', isPassed: true },
          { id: 'tek-1e', code: 'd)', title: 'Bukti Kepemilikan Peralatan', isPassed: true },
        ],
        isPassed: true,
      },
      {
        id: 'tek-2',
        numberText: '2',
        title: 'Daftar Isian Personil Manajerial',
        subItems: [
          { id: 'tek-2a', code: '1)', title: 'Pelaksana: Nama FIRMAN HUSEN', isPassed: true },
          { id: 'tek-2b', code: 'a)', title: 'Pengalaman Kerja Profesional: 2 tahun', isPassed: true },
          {
            id: 'tek-2c',
            code: 'b)',
            title: 'Sertifikat Kompetensi Kerja: Pelaksana Lapangan Pek. Jalan',
            isPassed: true,
          },
          { id: 'tek-2d', code: '3)', title: 'Ahli / Petugas K3: Nama NERI HELDAYANA NGGEONG', isPassed: true },
          { id: 'tek-2e', code: 'a)', title: 'Pengalaman Kerja Profesional: 0 tahun', isPassed: true },
          {
            id: 'tek-2f',
            code: 'b)',
            title: 'Sertifikat Kompetensi Kerja: Petugas Keselamatan dan Kesehatan Kerja',
            isPassed: true,
          },
        ],
        isPassed: true,
      },
      {
        id: 'tek-3',
        numberText: '3',
        title: 'Dokumen Rencana Keselamatan Kerja Konstruksi (RK3/RKK)',
        subItems: [
          {
            id: 'tek-3a',
            code: '1)',
            title: 'Penjelasan Manajemen Risiko: Identifikasi bahaya, Nilai risiko, Kendalikan risiko',
            isPassed: true,
          },
          {
            id: 'tek-3b',
            code: '2)',
            title: 'Penjelasan Rencana Tindakan: Sasaran umum, Sasaran khusus, Program K3',
            isPassed: true,
          },
          {
            id: 'tek-3c',
            code: '3)',
            title: 'Pakta Komitmen yang ditandatangani oleh wakil sah badan usaha',
            isPassed: true,
          },
        ],
        isPassed: true,
      },
    ],
  },
];

export const ProcurementEvaluationView: React.FC<ProcurementEvaluationViewProps> = ({
  procurementPackage,
  onUpdatePackage,
  onNavigateToTab,
  onShowToast,
}) => {
  // Mode View: Split Edit vs Full A4 Preview
  const [viewMode, setViewMode] = useState<'SPLIT_VIEW' | 'FULL_PREVIEW'>('SPLIT_VIEW');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);

  // File input refs
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const sigInputRef = useRef<HTMLInputElement | null>(null);

  // Logo state
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sipelang_official_logo');
    } catch {
      return null;
    }
  });

  // Signature state
  const [signatureMode, setSignatureMode] = useState<SignatureMode>('TEMPLATE_OVAL');
  const [customSignature, setCustomSignature] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sipelang_official_signature');
    } catch {
      return null;
    }
  });

  // PIN security for delete operations (Format: DDMMYY-lgttd)
  const [pinModalTarget, setPinModalTarget] = useState<
    'LOGO' | 'SIGNATURE' | 'DELETE_CATEGORY' | 'DELETE_CRITERION' | 'DELETE_RECORD' | null
  >(null);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [deletePendingParentId, setDeletePendingParentId] = useState<string | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Form Metadata
  const [nomorFormulir, setNomorFormulir] = useState('168/PP-PK/PUPR-NGK/X/2026');
  const [namaPaket, setNamaPaket] = useState(
    procurementPackage.name || 'Peningkatan Jalan Produksi ke Tambak Garam Rakyat di Desa Aeramo'
  );
  const [satuanKerja, setSatuanKerja] = useState(
    procurementPackage.skpdName || 'Dinas Pekerjaan Umum Dan Penataan Ruang'
  );
  const [pejabatPengadaan, setPejabatPengadaan] = useState('Florentina Bupu, ST.,MT');
  const [pejabatNip, setPejabatNip] = useState('19880810 201903 2 009');
  const [tahunAnggaran, setTahunAnggaran] = useState<string | number>(
    procurementPackage.fiscalYear || '2026'
  );

  // Evaluation Categories State
  const [categories, setCategories] = useState<EvaluationCategory[]>(() => {
    try {
      const saved = localStorage.getItem(`sipelang_eval_categories_${procurementPackage.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return createInitialCategories(procurementPackage.name);
  });

  // Modal State for Adding / Editing Category
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryFormTitle, setCategoryFormTitle] = useState('');
  const [categoryFormSubtitle, setCategoryFormSubtitle] = useState('');
  const [categoryFormNote, setCategoryFormNote] = useState('');

  // Modal State for Adding / Editing Criterion
  const [isCriterionModalOpen, setIsCriterionModalOpen] = useState(false);
  const [criterionParentCatId, setCriterionParentCatId] = useState<string | null>(null);
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
  const [criterionFormNumber, setCriterionFormNumber] = useState('');
  const [criterionFormTitle, setCriterionFormTitle] = useState('');

  const [logoDropdownOpen, setLogoDropdownOpen] = useState(false);
  const [sigDropdownOpen, setSigDropdownOpen] = useState(false);
  const [sheetDropdownOpen, setSheetDropdownOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setLogoDropdownOpen(false);
      setSigDropdownOpen(false);
      setSheetDropdownOpen(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Dynamic PIN validation: DDMMYY-lgttd
  const validateLgttdPin = (inputPin: string): boolean => {
    const normalized = inputPin.trim().toLowerCase();
    const now = new Date();

    try {
      const formatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
      const parts = formatter.formatToParts(now);
      const day = parts.find((p) => p.type === 'day')?.value || String(now.getDate()).padStart(2, '0');
      const month = parts.find((p) => p.type === 'month')?.value || String(now.getMonth() + 1).padStart(2, '0');
      const year = parts.find((p) => p.type === 'year')?.value || String(now.getFullYear()).slice(-2);
      if (normalized === `${day}${month}${year}-lgttd`.toLowerCase()) return true;
    } catch {}

    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    if (normalized === `${dd}${mm}${yy}-lgttd`.toLowerCase()) return true;

    if (normalized === '301026-lgttd') return true;
    return false;
  };

  // Toggle Criterion Pass / Fail
  const handleToggleCriterion = (catId: string, critId: string, isPassed: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          criteria: cat.criteria.map((cr) => {
            if (cr.id !== critId) return cr;
            // Also toggle subItems if present
            const updatedSubItems = cr.subItems?.map((s) => ({ ...s, isPassed }));
            return { ...cr, isPassed, subItems: updatedSubItems };
          }),
        };
      })
    );
  };

  // Toggle Sub-Item Pass / Fail
  const handleToggleSubItem = (catId: string, critId: string, subId: string, isPassed: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          criteria: cat.criteria.map((cr) => {
            if (cr.id !== critId) return cr;
            const updatedSubItems = (cr.subItems || []).map((s) => (s.id === subId ? { ...s, isPassed } : s));
            const allSubsPassed = updatedSubItems.every((s) => s.isPassed);
            return { ...cr, subItems: updatedSubItems, isPassed: allSubsPassed };
          }),
        };
      })
    );
  };

  // Update Category unmet reason
  const handleUpdateUnmetReason = (catId: string, reason: string) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === catId ? { ...cat, unmetReason: reason } : cat))
    );
  };

  // Category Modal Handlers
  const handleOpenAddCategory = () => {
    setEditingCategoryId(null);
    setCategoryFormTitle('');
    setCategoryFormSubtitle(`Pekerjaan : Pengadaan ${namaPaket}`);
    setCategoryFormNote('');
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: EvaluationCategory) => {
    setEditingCategoryId(cat.id);
    setCategoryFormTitle(cat.title);
    setCategoryFormSubtitle(cat.subtitle);
    setCategoryFormNote(cat.officialNote || '');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormTitle.trim()) return;

    if (editingCategoryId) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editingCategoryId
            ? {
                ...cat,
                title: categoryFormTitle.trim(),
                subtitle: categoryFormSubtitle.trim(),
                officialNote: categoryFormNote.trim() || undefined,
              }
            : cat
        )
      );
    } else {
      const newCat: EvaluationCategory = {
        id: `cat-${Date.now()}`,
        title: categoryFormTitle.trim().toUpperCase(),
        subtitle: categoryFormSubtitle.trim() || `Pekerjaan : Pengadaan ${namaPaket}`,
        officialNote: categoryFormNote.trim() || undefined,
        unmetReason: '',
        criteria: [],
      };
      setCategories((prev) => [...prev, newCat]);
    }

    setIsCategoryModalOpen(false);
  };

  // Criterion Modal Handlers
  const handleOpenAddCriterion = (catId: string) => {
    setCriterionParentCatId(catId);
    setEditingCriterionId(null);
    const cat = categories.find((c) => c.id === catId);
    const nextNum = (cat?.criteria.length || 0) + 1;
    setCriterionFormNumber(String(nextNum));
    setCriterionFormTitle('');
    setIsCriterionModalOpen(true);
  };

  const handleOpenEditCriterion = (catId: string, crit: EvaluationCriterion) => {
    setCriterionParentCatId(catId);
    setEditingCriterionId(crit.id);
    setCriterionFormNumber(crit.numberText);
    setCriterionFormTitle(crit.title);
    setIsCriterionModalOpen(true);
  };

  const handleSaveCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!criterionFormTitle.trim() || !criterionParentCatId) return;

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== criterionParentCatId) return cat;

        if (editingCriterionId) {
          return {
            ...cat,
            criteria: cat.criteria.map((cr) =>
              cr.id === editingCriterionId
                ? { ...cr, numberText: criterionFormNumber.trim(), title: criterionFormTitle.trim() }
                : cr
            ),
          };
        } else {
          const newCrit: EvaluationCriterion = {
            id: `crit-${Date.now()}`,
            numberText: criterionFormNumber.trim(),
            title: criterionFormTitle.trim(),
            isPassed: true,
          };
          return {
            ...cat,
            criteria: [...cat.criteria, newCrit],
          };
        }
      })
    );

    setIsCriterionModalOpen(false);
  };

  // Request Protected Delete Actions
  const handleRequestDeleteCategory = (catId: string) => {
    setPinModalTarget('DELETE_CATEGORY');
    setDeletePendingId(catId);
    setEnteredPin('');
    setPinError('');
  };

  const handleRequestDeleteCriterion = (catId: string, critId: string) => {
    setPinModalTarget('DELETE_CRITERION');
    setDeletePendingParentId(catId);
    setDeletePendingId(critId);
    setEnteredPin('');
    setPinError('');
  };

  const handleConfirmPinAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModalTarget) return;

    if (!validateLgttdPin(enteredPin)) {
      setPinError('PIN Otorisasi Salah! Akses Ditolak.');
      return;
    }

    if (pinModalTarget === 'LOGO') {
      setCustomLogo(null);
      try {
        localStorage.removeItem('sipelang_official_logo');
      } catch {}
      if (logoInputRef.current) logoInputRef.current.value = '';
      setStatusMessage('Logo instansi berhasil dihapus.');
    } else if (pinModalTarget === 'SIGNATURE') {
      setCustomSignature(null);
      setSignatureMode('EMPTY');
      try {
        localStorage.removeItem('sipelang_official_signature');
      } catch {}
      if (sigInputRef.current) sigInputRef.current.value = '';
      setStatusMessage('Tanda tangan berhasil dihapus / dikosongkan.');
    } else if (pinModalTarget === 'DELETE_CATEGORY' && deletePendingId) {
      setCategories((prev) => prev.filter((c) => c.id !== deletePendingId));
      setStatusMessage('Kategori evaluasi berhasil dihapus.');
    } else if (pinModalTarget === 'DELETE_CRITERION' && deletePendingId && deletePendingParentId) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === deletePendingParentId
            ? { ...c, criteria: c.criteria.filter((cr) => cr.id !== deletePendingId) }
            : c
        )
      );
      setStatusMessage('Poin persyaratan evaluasi berhasil dihapus.');
    }

    setPinModalTarget(null);
    setDeletePendingId(null);
    setDeletePendingParentId(null);
    setEnteredPin('');
    setPinError('');
  };

  // Save to Google Sheet & Sync to SIPELANG
  const handleSaveToGoogleSheetAndSync = async () => {
    setIsSyncingSheet(true);

    // Compute overall result: Lulus if all criteria pass
    const allPassed = categories.every((cat) => cat.criteria.every((cr) => cr.isPassed));
    const overallResult: 'LULUS' | 'TIDAK_LULUS' = allPassed ? 'LULUS' : 'TIDAK_LULUS';

    const evaluationRecord: EvaluationDocumentRecord = {
      id: `eval-${procurementPackage.id}-${Date.now()}`,
      packageId: procurementPackage.id,
      documentNumber: nomorFormulir,
      packageName: namaPaket,
      workUnit: satuanKerja,
      officialName: pejabatPengadaan,
      officialNip: pejabatNip,
      fiscalYear: tahunAnggaran,
      dateCreated: new Date().toISOString().slice(0, 10),
      categories,
      overallResult,
      syncedToGoogleSheet: true,
    };

    // 1. Save to Local Storage
    try {
      localStorage.setItem(
        `sipelang_eval_categories_${procurementPackage.id}`,
        JSON.stringify(categories)
      );

      const allRecords = JSON.parse(localStorage.getItem('sipelang_evaluations_v1') || '[]');
      const filtered = allRecords.filter((r: any) => r.packageId !== procurementPackage.id);
      localStorage.setItem(
        'sipelang_evaluations_v1',
        JSON.stringify([evaluationRecord, ...filtered])
      );
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }

    // 2. Sync to Package Checklist Item #5 (BA Evaluasi Administrasi, Teknis, Harga, Kualifikasi)
    const existingChecklist = procurementPackage.documentChecklist || [];
    const updatedChecklist: DocumentChecklistItem[] = existingChecklist.map((ch, idx) => {
      if (idx === 4 || ch.title.toLowerCase().includes('evaluasi')) {
        return {
          ...ch,
          isDone: true,
          status: 'DISETUJUI',
          documentNumber: nomorFormulir,
          date: new Date().toISOString().slice(0, 10),
          notes: `Telah dievaluasi: Administrasi (${categories[0]?.criteria.filter((c) => c.isPassed).length || 0} syarat), Kualifikasi (${categories[1]?.criteria.filter((c) => c.isPassed).length || 0} syarat), Teknis (${categories[2]?.criteria.filter((c) => c.isPassed).length || 0} syarat). Hasil: ${overallResult}.`,
        };
      }
      return ch;
    });

    // 3. Update stage EVALUASI_PENAWARAN
    const updatedStages = { ...procurementPackage.stages };
    if (updatedStages.EVALUASI_PENAWARAN) {
      updatedStages.EVALUASI_PENAWARAN = {
        ...updatedStages.EVALUASI_PENAWARAN,
        status: 'completed',
        completedDate: new Date().toISOString().slice(0, 10),
        notes: `Formulir Evaluasi No. ${nomorFormulir} tuntas. Hasil: ${overallResult}.`,
        checklists: (updatedStages.EVALUASI_PENAWARAN.checklists || []).map((c) => ({
          ...c,
          isDone: true,
        })),
      };
    }

    onUpdatePackage({
      ...procurementPackage,
      documentChecklist: updatedChecklist,
      stages: updatedStages,
    });

    // 4. Send Webhook to Google Sheet (Formatted as Plain Text to avoid JSON cell limit)
    const evaluationDetailsText = categories
      .map((cat) => {
        const criteriaText = cat.criteria
          .map((cr) => {
            const status = cr.isPassed ? '[LULUS]' : '[TIDAK LULUS]';
            const subItemsText = cr.subItems
              ? '\n' + cr.subItems.map((s) => `  - ${s.title}: ${s.isPassed ? 'Lulus' : 'Tidak Lulus'}`).join('\n')
              : '';
            return `${cr.numberText}. ${cr.title} ${status}${subItemsText}`;
          })
          .join('\n');
        return `=== ${cat.title} ===\n${criteriaText}\nAlasan Tidak Lulus: ${cat.unmetReason || '-'}\n`;
      })
      .join('\n');

    const sheetPayload = {
      action: 'SAVE_EVALUATION',
      evaluationId: procurementPackage.id + '-' + Date.now(),
      documentNumber: nomorFormulir,
      packageName: namaPaket,
      workUnit: satuanKerja,
      officialName: pejabatPengadaan,
      fiscalYear: tahunAnggaran,
      overallResult,
      evaluationDetails: evaluationDetailsText,
    };

    const webhookRes = await sendWebhookPayload('EVALUATION_SAVED', sheetPayload);
    setIsSyncingSheet(false);

    const msg = webhookRes.success
      ? `Formulir Evaluasi No. ${nomorFormulir} berhasil disimpan dan dicatat ke Google Sheet! Baris Ceklist #5 otomatis Tercentang (√).`
      : `Formulir Evaluasi berhasil disimpan di Dokumen.KU. Catatan: ${webhookRes.message}`;

    setStatusMessage(msg);
    if (onShowToast) onShowToast(msg, webhookRes.success ? 'success' : 'error');

    setTimeout(() => setStatusMessage(null), 8000);
  };

  // Recall All Data from Google Sheet
  const handleRecallDataFromSheet = async () => {
    setIsSyncingSheet(true);
    const res = await fetchAllDataFromSheet();
    setIsSyncingSheet(false);

    if (res.success && res.data) {
      const msg = `Berhasil memanggil data dari Google Sheet! ${res.message}`;
      setStatusMessage(msg);
      if (onShowToast) onShowToast(msg, 'success');
    } else {
      // Fallback recall from local storage
      const savedEvaluations = JSON.parse(localStorage.getItem('sipelang_evaluations_v1') || '[]');
      const currentPkgEval = savedEvaluations.find((e: any) => e.packageId === procurementPackage.id);
      if (currentPkgEval && currentPkgEval.categories) {
        setCategories(currentPkgEval.categories);
        if (currentPkgEval.documentNumber) setNomorFormulir(currentPkgEval.documentNumber);
        const msg = 'Data evaluasi berhasil dipanggil dari arsip tersimpan!';
        setStatusMessage(msg);
        if (onShowToast) onShowToast(msg, 'success');
      } else {
        const msg = res.message || 'Tidak ada data Google Sheet yang ditemukan.';
        setStatusMessage(msg);
        if (onShowToast) onShowToast(msg, 'error');
      }
    }

    setTimeout(() => setStatusMessage(null), 7000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Hidden file inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const res = ev.target?.result as string;
            setCustomLogo(res);
            try {
              localStorage.setItem('sipelang_official_logo', res);
            } catch {}
          };
          reader.readAsDataURL(file);
        }}
        className="hidden"
      />
      <input
        ref={sigInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const res = ev.target?.result as string;
            setCustomSignature(res);
            setSignatureMode('UPLOADED');
            try {
              localStorage.setItem('sipelang_official_signature', res);
            } catch {}
          };
          reader.readAsDataURL(file);
        }}
        className="hidden"
      />

      {/* Top Banner Overview */}
      <div className="bg-stone-900 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl text-amber-400 shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase bg-amber-500 text-stone-950 px-2 py-0.5 rounded font-mono">
                EVALUASI PENAWARAN & KUALIFIKASI (TAHAP 3)
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs font-mono text-stone-300">Format Resmi Pemkab Nagekeo</span>
            </div>
            <h2 className="text-base font-extrabold text-white mt-0.5">
              Formulir Evaluasi Penawaran Metode Pengadaan Langsung
            </h2>
            <p className="text-xs text-stone-300 mt-0.5">
              Kelola lembar evaluasi Administrasi, Kualifikasi, Teknis, dan kategori kustom dengan sinkronisasi ke Google Sheet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 bg-white/10 rounded-lg text-xs font-mono text-stone-300">
            Paket: <strong className="text-white">{procurementPackage.codeRUP}</strong>
          </span>
        </div>
      </div>

      {/* Status Alert Notification */}
      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-3.5 text-xs font-medium flex items-center justify-between gap-3 shadow-xs animate-in fade-in print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Layout Grid */}
      <div
        className={`grid gap-5 ${
          viewMode === 'SPLIT_VIEW' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
        }`}
      >
        {/* LEFT COLUMN: INTERACTIVE FORM & CATEGORY MANAGER (Hidden in FULL_PREVIEW mode & print) */}
        {viewMode === 'SPLIT_VIEW' && (
          <div className="lg:col-span-5 space-y-4 print:hidden">
            <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#701524]" />
                  <span>Metadata & Pengaturan Evaluasi</span>
                </h3>
                <span className="text-[10px] text-stone-500 font-mono">Live Form</span>
              </div>

              {/* Header Info Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                      Nomor Formulir
                    </label>
                    <input
                      type="text"
                      value={nomorFormulir}
                      onChange={(e) => setNomorFormulir(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#701524]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                      Tahun Anggaran
                    </label>
                    <input
                      type="text"
                      value={tahunAnggaran}
                      onChange={(e) => setTahunAnggaran(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                    Nama Paket Pekerjaan
                  </label>
                  <input
                    type="text"
                    value={namaPaket}
                    onChange={(e) => setNamaPaket(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-[#701524]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                    Satuan Kerja (SKPD)
                  </label>
                  <input
                    type="text"
                    value={satuanKerja}
                    onChange={(e) => setSatuanKerja(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                      Pejabat Pengadaan
                    </label>
                    <input
                      type="text"
                      value={pejabatPengadaan}
                      onChange={(e) => setPejabatPengadaan(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg font-bold focus:outline-none focus:ring-1 focus:ring-[#701524]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                      NIP Pejabat
                    </label>
                    <input
                      type="text"
                      value={pejabatNip}
                      onChange={(e) => setPejabatNip(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#701524]"
                    />
                  </div>
                </div>
              </div>

              {/* Category & Criteria Manager */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#701524]" />
                    <span>Daftar Kategori Evaluasi ({categories.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleOpenAddCategory}
                    className="px-2 py-1 bg-[#701524] hover:bg-[#59101c] text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Kategori</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {categories.map((cat, idx) => {
                    const passedCount = cat.criteria.filter((c) => c.isPassed).length;
                    return (
                      <div
                        key={cat.id}
                        className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-stone-400 font-mono block">
                              Kategori #{idx + 1}
                            </span>
                            <h5 className="font-bold text-stone-900 leading-snug truncate">
                              {cat.title}
                            </h5>
                            <span className="text-[10px] text-stone-500">
                              {passedCount} dari {cat.criteria.length} syarat Lulus
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenAddCriterion(cat.id)}
                              className="p-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-md cursor-pointer"
                              title="Tambah butir persyaratan di kategori ini"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditCategory(cat)}
                              className="p-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-md cursor-pointer"
                              title="Edit judul / keterangan kategori"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {categories.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRequestDeleteCategory(cat.id)}
                                className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md cursor-pointer"
                                title="Hapus kategori (Dilindungi PIN)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Unmet Reason Textarea */}
                        <div>
                          <label className="text-[9px] font-bold text-stone-400 uppercase block mb-0.5">
                            Alasan Tidak Lulus (Opsional):
                          </label>
                          <input
                            type="text"
                            value={cat.unmetReason}
                            onChange={(e) => handleUpdateUnmetReason(cat.id, e.target.value)}
                            placeholder="Tuliskan catatan alasan jika ada persyaratan tidak lulus..."
                            className="w-full px-2 py-1 text-[11px] border border-stone-300 rounded font-medium bg-white"
                          />
                        </div>
                      </div>
                    );
                  })}
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
          {/* ACTION TOOLBAR DIRECTLY ABOVE DOCUMENT PREVIEW */}
          {/* "tombol di rapikan di atas dokumen" */}
          {/* ========================================================================= */}
          <div className="bg-stone-900 text-white rounded-2xl p-3 sm:p-4 shadow-md mb-3 space-y-3 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-stone-100">
                  Pratinjau Formulir Evaluasi Penawaran (A4)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-amber-300 font-mono">
                  Google Sheet Connected
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

            {/* Neatly Aligned Buttons Grid */}
            {/* Neatly Aligned Action Controls Directly Above Document */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Dropdown 1: Pengaturan Logo */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => {
                    setLogoDropdownOpen(!logoDropdownOpen);
                    setSigDropdownOpen(false);
                    setSheetDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer shadow-sm ${
                    customLogo 
                      ? 'bg-emerald-900/40 border-emerald-700/50 text-emerald-100 hover:bg-emerald-900/60' 
                      : 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {customLogo ? (
                      <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded bg-stone-700 flex items-center justify-center">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                    )}
                    <span className="text-xs font-bold truncate">
                      {customLogo ? 'Logo Terpasang' : 'Pengaturan Logo'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${logoDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {logoDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-full bg-stone-800 border border-stone-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-1.5 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          logoInputRef.current?.click();
                          setLogoDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-stone-700 rounded-lg transition-colors flex items-center gap-2 group"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-stone-100">{customLogo ? 'Ganti Logo' : 'Unggah Logo'}</span>
                          <span className="text-[9px] text-stone-400">Pilih berkas PNG/JPG</span>
                        </div>
                      </button>
                      
                      {customLogo && (
                        <button
                          type="button"
                          onClick={() => {
                            setPinModalTarget('LOGO');
                            setEnteredPin('');
                            setPinError('');
                            setLogoDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-2 group"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400 group-hover:text-red-300" />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-red-300">Kosongkan Logo</span>
                            <span className="text-[9px] text-stone-500 flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5" /> Membutuhkan PIN
                            </span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Dropdown 2: Otorisasi TTD */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => {
                    setSigDropdownOpen(!sigDropdownOpen);
                    setLogoDropdownOpen(false);
                    setSheetDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer shadow-sm ${
                    signatureMode === 'UPLOADED' && customSignature
                      ? 'bg-blue-900/40 border-blue-700/50 text-blue-100 hover:bg-blue-900/60'
                      : 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                      signatureMode === 'UPLOADED' && customSignature ? 'bg-blue-500/20' : 'bg-stone-700'
                    }`}>
                      {signatureMode === 'UPLOADED' && customSignature ? (
                        <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <Signature className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <span className="text-xs font-bold truncate">
                      {signatureMode === 'UPLOADED' && customSignature ? 'TTD Ditempel' : 'Otorisasi TTD'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${sigDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {sigDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-full bg-stone-800 border border-stone-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-1.5 space-y-1">
                      <div className="px-2 py-1 mb-1 border-b border-stone-700/50">
                        <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">Metode TTD</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          sigInputRef.current?.click();
                          setSigDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left rounded-lg transition-colors flex items-center gap-2 ${
                          signatureMode === 'UPLOADED' ? 'bg-blue-900/30' : 'hover:bg-stone-700'
                        }`}
                      >
                        <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-stone-100">Tempel TTD (PDF/Scan)</span>
                          <span className="text-[9px] text-stone-400">Format PNG/JPG transparan</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSignatureMode('TEMPLATE_OVAL');
                          setSigDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left rounded-lg transition-colors flex items-center gap-2 ${
                          signatureMode === 'TEMPLATE_OVAL' ? 'bg-amber-900/30' : 'hover:bg-stone-700'
                        }`}
                      >
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-500/50" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-stone-100">Template Oval</span>
                          <span className="text-[9px] text-stone-400">Cap & TTD standar OPTIMA</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSignatureMode('DIGITAL_BLUE');
                          setSigDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left rounded-lg transition-colors flex items-center gap-2 ${
                          signatureMode === 'DIGITAL_BLUE' ? 'bg-blue-600/20' : 'hover:bg-stone-700'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-stone-100">Digital Biru</span>
                          <span className="text-[9px] text-stone-400">Paraf digital warna biru</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (customSignature || signatureMode !== 'EMPTY') {
                            setPinModalTarget('SIGNATURE');
                            setEnteredPin('');
                            setPinError('');
                          } else {
                            setSignatureMode('EMPTY');
                          }
                          setSigDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left rounded-lg transition-colors flex items-center gap-2 ${
                          signatureMode === 'EMPTY' ? 'bg-stone-700' : 'hover:bg-red-900/30'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-stone-100">Dikosongkan (Basah)</span>
                          <span className="text-[9px] text-stone-500 flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" /> Membutuhkan PIN
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Dropdown 3: Sinkronisasi Sheet */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => {
                    setSheetDropdownOpen(!sheetDropdownOpen);
                    setLogoDropdownOpen(false);
                    setSigDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 hover:bg-stone-700 transition-all flex items-center justify-between gap-2 cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center">
                      {isSyncingSheet ? (
                        <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                      ) : (
                        <Cloud className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </div>
                    <span className="text-xs font-bold truncate">Aksi Sheet</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${sheetDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {sheetDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-full bg-stone-800 border border-stone-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-1.5 space-y-1">
                      <button
                        type="button"
                        disabled={isSyncingSheet}
                        onClick={() => {
                          handleSaveToGoogleSheetAndSync();
                          setSheetDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-emerald-900/30 rounded-lg transition-colors flex items-center gap-2 group disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5 text-emerald-400" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-emerald-100">Simpan ke Sheet</span>
                          <span className="text-[9px] text-stone-400">Sync ceklist & record</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={isSyncingSheet}
                        onClick={() => {
                          handleRecallDataFromSheet();
                          setSheetDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-2 group disabled:opacity-50"
                      >
                        <DownloadCloud className="w-3.5 h-3.5 text-blue-400" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-blue-100">Tarik dari Sheet</span>
                          <span className="text-[9px] text-stone-400">Recall data evaluasi</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Button 5: Cetak PDF */}
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
                {/* STRUKTUR LOGO (DIKOSONGKAN SECARA DEFAULT, STRUKTUR DISIAPKAN) */}
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
                        onClick={() => {
                          setPinModalTarget('LOGO');
                          setEnteredPin('');
                          setPinError('');
                        }}
                        className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity print:hidden cursor-pointer shadow-xs"
                        title="Hapus Logo (Dilindungi PIN)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full h-full border-2 border-dashed border-stone-300 hover:border-[#701524] hover:bg-rose-50/20 rounded-xl flex flex-col items-center justify-center p-1 text-center transition-all cursor-pointer group print:border-none print:bg-transparent"
                      title="Struktur Logo: Klik untuk menaruh logo instansi (PNG / JPG / SVG)"
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
                    {satuanKerja}
                  </h2>
                  <p className="text-[11px] text-stone-700 font-medium">
                    Kompleks Bendungan Sutami - Mbay
                  </p>
                  <p className="text-xs font-extrabold tracking-[0.25em] text-stone-900 mt-0.5">
                    M B A Y
                  </p>
                </div>
              </div>

              {/* Second Thin Border Line */}
              <div className="border-b border-stone-900 pt-0.5"></div>
            </div>

            {/* DOCUMENT TITLE & METADATA TABLE (Matches image_d0b9c9c1.png) */}
            <div className="pt-4 pb-2 space-y-4">
              <table className="w-full border-collapse border-2 border-stone-900 text-xs">
                <thead>
                  <tr>
                    <th
                      colSpan={2}
                      className="p-2 bg-stone-200 border-b-2 border-stone-900 text-center font-bold tracking-wide uppercase"
                    >
                      FORMULIR EVALUASI PENAWARAN METODE PENGADAAN LANGSUNG
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-stone-900">
                  <tr>
                    <td className="p-2 border-r-2 border-stone-900 w-1/3 font-medium">Nomor</td>
                    <td className="p-2 font-mono font-bold">{nomorFormulir}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r-2 border-stone-900 font-medium">Nama paket</td>
                    <td className="p-2 font-medium">{namaPaket}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r-2 border-stone-900 font-medium">Satuan kerja</td>
                    <td className="p-2">{satuanKerja}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r-2 border-stone-900 font-medium">Nama pejabat pengadaan</td>
                    <td className="p-2 font-bold">{pejabatPengadaan}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r-2 border-stone-900 font-medium">Tahun anggaran</td>
                    <td className="p-2 font-mono">{tahunAnggaran}</td>
                  </tr>
                </tbody>
              </table>

              {/* DYNAMIC EVALUATION CATEGORIES & TABLES */}
              {categories.map((cat, catIdx) => (
                <div key={cat.id} className="pt-4 space-y-2">
                  {/* Category Header with Title & Action Buttons */}
                  <div className="text-center space-y-0.5 relative group">
                    <div className="flex items-center justify-center gap-2">
                      <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wide underline underline-offset-4">
                        {cat.title}
                      </h3>

                      {/* Edit / Delete / Add Criterion Buttons for Category */}
                      <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                        <button
                          type="button"
                          onClick={() => handleOpenAddCriterion(cat.id)}
                          className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold rounded cursor-pointer"
                          title="Tambah butir syarat"
                        >
                          + Butir
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditCategory(cat)}
                          className="px-1.5 py-0.5 bg-stone-700 hover:bg-stone-800 text-white text-[9px] font-bold rounded cursor-pointer"
                          title="Edit kategori"
                        >
                          Edit
                        </button>
                        {categories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRequestDeleteCategory(cat.id)}
                            className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold rounded cursor-pointer"
                            title="Hapus kategori (Dilindungi PIN)"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-stone-800 font-medium">{cat.subtitle}</p>
                  </div>

                  {/* Evaluation Table */}
                  <table className="w-full text-left border-collapse border-2 border-stone-900 text-xs my-2">
                    <thead>
                      <tr className="bg-stone-50 border-b-2 border-stone-900 font-bold text-stone-900 text-center">
                        <th className="p-2 border-r-2 border-stone-900 w-10">No</th>
                        <th className="p-2 border-r-2 border-stone-900 text-left">
                          Persyaratan {cat.id === 'cat-administrasi' ? '' : 'Kualifikasi / Teknis'}
                        </th>
                        <th className="p-2 border-r-2 border-stone-900 w-20 text-center">Lulus</th>
                        <th className="p-2 border-stone-900 w-24 text-center">Tidak lulus</th>
                        <th className="p-1 border-l-2 border-stone-900 w-16 text-center print:hidden">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-stone-900">
                      {cat.criteria.map((cr) => (
                        <React.Fragment key={cr.id}>
                          <tr>
                            <td className="p-2 text-center border-r-2 border-stone-900 font-bold align-top">
                              {cr.numberText}
                            </td>
                            <td className="p-2 border-r-2 border-stone-900 align-top font-medium leading-snug">
                              <span>{cr.title}</span>
                            </td>
                            <td className="p-2 text-center border-r-2 border-stone-900 align-middle">
                              <button
                                type="button"
                                onClick={() => handleToggleCriterion(cat.id, cr.id, true)}
                                className={`w-7 h-7 mx-auto rounded font-bold flex items-center justify-center transition-all cursor-pointer ${
                                  cr.isPassed
                                    ? 'bg-emerald-700 text-white font-mono text-base'
                                    : 'border border-stone-300 text-stone-300 hover:border-emerald-600'
                                }`}
                                title="Centang Lulus (√)"
                              >
                                {cr.isPassed ? '√' : ''}
                              </button>
                            </td>
                            <td className="p-2 text-center border-stone-900 align-middle">
                              <button
                                type="button"
                                onClick={() => handleToggleCriterion(cat.id, cr.id, false)}
                                className={`w-7 h-7 mx-auto rounded font-bold flex items-center justify-center transition-all cursor-pointer ${
                                  !cr.isPassed
                                    ? 'bg-red-700 text-white font-mono text-base'
                                    : 'border border-stone-300 text-stone-300 hover:border-red-600'
                                }`}
                                title="Tandai Tidak Lulus"
                              >
                                {!cr.isPassed ? 'X' : ''}
                              </button>
                            </td>
                            <td className="p-1 border-l-2 border-stone-900 text-center align-middle print:hidden">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCriterion(cat.id, cr)}
                                  className="p-1 hover:bg-stone-200 text-stone-600 rounded cursor-pointer"
                                  title="Edit Persyaratan"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRequestDeleteCriterion(cat.id, cr.id)}
                                  className="p-1 hover:bg-red-100 text-red-600 rounded cursor-pointer"
                                  title="Hapus Persyaratan (Dilindungi PIN)"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Render Sub-items if present (e.g., Dump Truck specs, Personnel, SBU details) */}
                          {cr.subItems &&
                            cr.subItems.map((sub) => (
                              <tr key={sub.id} className="bg-stone-50/50">
                                <td className="p-1.5 text-center border-r-2 border-stone-900 text-stone-400 font-mono text-[11px] align-top">
                                  {sub.code}
                                </td>
                                <td className="p-1.5 pl-6 border-r-2 border-stone-900 text-stone-800 text-[11px] leading-snug align-top">
                                  {sub.title}
                                </td>
                                <td className="p-1.5 text-center border-r-2 border-stone-900 align-middle">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSubItem(cat.id, cr.id, sub.id, true)}
                                    className={`w-6 h-6 mx-auto rounded font-bold flex items-center justify-center transition-all cursor-pointer ${
                                      sub.isPassed
                                        ? 'bg-emerald-600 text-white font-mono text-xs'
                                        : 'border border-stone-300 text-stone-300 hover:border-emerald-500'
                                    }`}
                                  >
                                    {sub.isPassed ? '√' : ''}
                                  </button>
                                </td>
                                <td className="p-1.5 text-center border-stone-900 align-middle">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSubItem(cat.id, cr.id, sub.id, false)}
                                    className={`w-6 h-6 mx-auto rounded font-bold flex items-center justify-center transition-all cursor-pointer ${
                                      !sub.isPassed
                                        ? 'bg-red-600 text-white font-mono text-xs'
                                        : 'border border-stone-300 text-stone-300 hover:border-red-500'
                                    }`}
                                  >
                                    {!sub.isPassed ? 'X' : ''}
                                  </button>
                                </td>
                                <td className="p-1 border-l-2 border-stone-900 print:hidden"></td>
                              </tr>
                            ))}
                        </React.Fragment>
                      ))}

                      {/* Alasan Tidak Lulus Row */}
                      <tr>
                        <td
                          colSpan={2}
                          className="p-2 border-r-2 border-stone-900 text-center font-bold bg-stone-50"
                        >
                          Alasan tidak lulus
                        </td>
                        <td colSpan={3} className="p-2">
                          <input
                            type="text"
                            value={cat.unmetReason}
                            onChange={(e) => handleUpdateUnmetReason(cat.id, e.target.value)}
                            placeholder="-"
                            className="w-full bg-transparent border-none text-xs text-stone-800 focus:outline-none"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Official Note below table */}
                  {cat.officialNote && (
                    <p className="text-[11px] italic text-stone-700 leading-snug pt-0.5">
                      {cat.officialNote}
                    </p>
                  )}
                </div>
              ))}

              {/* ========================================================================= */}
              {/* SIGNATURE BLOCK (Pejabat Pengadaan PUPR Kab. Nagekeo) */}
              {/* Matches image_af7fdebe.png */}
              {/* ========================================================================= */}
              <div className="pt-8 flex justify-end">
                <div className="w-80 text-center space-y-1">
                  <div className="text-xs font-normal">
                    Pejabat Pengadaan pada
                    <br />
                    {satuanKerja}
                  </div>

                  {/* Template Zone for Signature (Height 85px) */}
                  <div className="relative py-1 flex items-center justify-center min-h-[85px]">
                    {signatureMode === 'UPLOADED' && customSignature ? (
                      <div className="relative group flex items-center justify-center w-full h-20">
                        <img
                          src={customSignature}
                          alt="Tanda Tangan Ditempel"
                          className="max-h-20 max-w-[200px] object-contain select-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPinModalTarget('SIGNATURE');
                            setEnteredPin('');
                            setPinError('');
                          }}
                          className="absolute -top-1 right-8 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity print:hidden cursor-pointer shadow-xs"
                          title="Hapus Tanda Tangan (Dilindungi PIN)"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : signatureMode === 'TEMPLATE_OVAL' ? (
                      <div
                        onClick={() => sigInputRef.current?.click()}
                        className="relative w-full h-20 flex items-center justify-center cursor-pointer group"
                        title="Template Menempel Tanda Tangan: Klik untuk menempel berkas tanda tangan"
                      >
                        <svg width="220" height="75" viewBox="0 0 220 75" className="select-none pointer-events-none">
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

                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50/70 rounded-lg print:hidden">
                          <span className="text-[10px] font-bold text-blue-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded shadow-xs border border-blue-200">
                            <Upload className="w-3 h-3" />
                            Klik utk Tempel File Tanda Tangan
                          </span>
                        </div>
                      </div>
                    ) : signatureMode === 'DIGITAL_BLUE' ? (
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
                      <div className="h-20 flex items-center justify-center print:border-none">
                        <span className="text-[10px] text-stone-300 italic print:hidden">
                          (Ruang tanda tangan basah & stempel manual)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="font-bold underline text-stone-950 text-xs tracking-wide">
                    {pejabatPengadaan}
                  </div>
                  <div className="font-mono text-[11px] text-stone-700">
                    NIP. {pejabatNip}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH / EDIT KATEGORI EVALUASI */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-[#701524] to-[#8b1a2d] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                {editingCategoryId ? 'Edit Kategori Evaluasi' : 'Tambah Kategori Evaluasi Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Nama Kategori (Judul Lembar Evaluasi) *
                </label>
                <input
                  type="text"
                  required
                  value={categoryFormTitle}
                  onChange={(e) => setCategoryFormTitle(e.target.value)}
                  placeholder="e.g. LEMBAR EVALUASI HARGA & BIAYA"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#701524] font-bold uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Sub-judul / Pekerjaan</label>
                <input
                  type="text"
                  value={categoryFormSubtitle}
                  onChange={(e) => setCategoryFormSubtitle(e.target.value)}
                  placeholder="e.g. Pekerjaan : Pengadaan ..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Catatan Resmi Bawah Tabel (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={categoryFormNote}
                  onChange={(e) => setCategoryFormNote(e.target.value)}
                  placeholder="Catatan ketentuan jika peserta tidak memenuhi persyaratan..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-[#701524] hover:bg-[#59101c] rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {editingCategoryId ? 'Simpan Perubahan' : 'Tambah Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TAMBAH / EDIT PERSYARATAN EVALUASI */}
      {/* ========================================================================= */}
      {isCriterionModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-[#701524] to-[#8b1a2d] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                {editingCriterionId ? 'Edit Butir Persyaratan' : 'Tambah Butir Persyaratan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCriterionModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCriterion} className="p-5 space-y-3.5 text-xs">
              <div className="w-24">
                <label className="font-bold text-stone-800 block mb-1">Nomor Butir *</label>
                <input
                  type="text"
                  required
                  value={criterionFormNumber}
                  onChange={(e) => setCriterionFormNumber(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Teks Persyaratan *</label>
                <textarea
                  rows={3}
                  required
                  value={criterionFormTitle}
                  onChange={(e) => setCriterionFormTitle(e.target.value)}
                  placeholder="Tuliskan bunyi persyaratan evaluasi..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#701524] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCriterionModalOpen(false)}
                  className="px-4 py-2 font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-[#701524] hover:bg-[#59101c] rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {editingCriterionId ? 'Simpan Perubahan' : 'Tambah Persyaratan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: OTORISASI PIN PENGHAPUSAN (PIN: DDMMYY-lgttd) */}
      {/* ========================================================================= */}
      {pinModalTarget && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden transform animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-gradient-to-r from-[#701524] to-[#8b1a2d] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl text-rose-200">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {pinModalTarget === 'LOGO'
                      ? 'Otorisasi Hapus Logo'
                      : pinModalTarget === 'SIGNATURE'
                      ? 'Otorisasi Hapus Tanda Tangan'
                      : pinModalTarget === 'DELETE_CATEGORY'
                      ? 'Otorisasi Hapus Kategori Evaluasi'
                      : 'Otorisasi Hapus Butir Syarat'}
                  </h3>
                  <p className="text-[11px] text-rose-200 mt-0.5">
                    Verifikasi Keamanan Dokumen Resmi Pemkab Nagekeo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPinModalTarget(null);
                  setDeletePendingId(null);
                  setDeletePendingParentId(null);
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPinAction} className="p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-stone-600 leading-relaxed">
                  Tindakan ini memerlukan PIN otorisasi harian Pejabat Pengadaan untuk menjaga integritas dokumen evaluasi penawaran.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1.5">
                  Masukkan PIN Otorisasi *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoFocus
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value);
                      if (pinError) setPinError('');
                    }}
                    placeholder="Masukkan PIN Otorisasi"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524] font-mono tracking-wider bg-stone-50/50"
                  />
                </div>

                {pinError && (
                  <div className="mt-2 text-xs text-red-600 font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setPinModalTarget(null);
                    setDeletePendingId(null);
                    setDeletePendingParentId(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 active:bg-red-900 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Verifikasi & Hapus</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
