/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProcurementType = 'BARANG' | 'KONSULTANSI' | 'KONSTRUKSI';

export type FundingSource = 'APBD' | 'APBN' | 'BLUD' | 'DAK';

export type ReviewStatus = 'DISETUJUI' | 'PERLU_PERBAIKAN' | 'MENUNGGU_REVIEW' | 'DRAFT';

export type DocumentCategory = 
  | 'PERSIAPAN' 
  | 'PENAWARAN' 
  | 'EVALUASI_NEGOSIASI' 
  | 'KONTRAK_HASIL' 
  | 'SERAH_TERIMA';

export type StageKey = 
  | 'PERSIAPAN_PPK'
  | 'PERMINTAAN_PENAWARAN'
  | 'EVALUASI_PENAWARAN'
  | 'KLARIFIKASI_NEGOSIASI'
  | 'PENETAPAN_BAHPL'
  | 'SPK_SELESAI';

export interface StageInfo {
  key: StageKey;
  stepNumber: number;
  title: string;
  shortTitle: string;
  description: string;
  responsibleRole: string;
}

export interface DocumentItem {
  id: string;
  packageId: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  uploadedBy: string;
  reviewStatus: ReviewStatus;
  notes?: string;
  reviewerName?: string;
  reviewDate?: string;
  fileType: 'pdf' | 'doc' | 'xls' | 'zip';
}

export interface StageChecklistItem {
  id: string;
  text: string;
  isDone: boolean;
  notes?: string;
  completedAt?: string;
}

export interface PackageStageState {
  stageKey: StageKey;
  status: 'pending' | 'in_progress' | 'completed' | 'needs_revision';
  startDate?: string;
  completedDate?: string;
  notes?: string;
  checklists: StageChecklistItem[];
}

export interface ProcurementPackage {
  id: string;
  codeRUP: string;
  registerNumber?: string; // Nomor Registrasi Pengadaan Langsung Otomatis
  opdId?: string; // ID OPD yang terkait
  name: string;
  procurementType: ProcurementType;
  fiscalYear: number;
  fundingSource: FundingSource;
  skpdName: string; // Dinas / Instansi
  budgetCeiling: number; // Pagu Anggaran (Rp)
  hpsValue: number; // Nilai HPS (Rp)
  bidValue?: number; // Nilai Penawaran (Rp)
  negotiationValue?: number; // Nilai Hasil Negosiasi (Rp)
  vendorName: string;
  vendorNpwp: string;
  ppkName: string; // Pejabat Pembuat Komitmen
  ppName: string; // Pejabat Pengadaan
  location: string;
  executionDurationDays: number;
  createdDate: string;
  deadlineDate: string;
  currentStage: StageKey;
  overallProgress: number; // 0 - 100%
  isArchived: boolean;
  archiveBoxNumber?: string;
  archiveDate?: string;
  archiveVerifiedBy?: string;
  stages: Record<StageKey, PackageStageState>;
  notes?: string;
}

export type MatrixEvaluationStatus = 'MEMENUHI' | 'ADA_CATATAN' | 'TIDAK_MEMENUHI';
export type ReviewerRoleType = 'PEJABAT_PENGADAAN' | 'BAGIAN_PENGADAAN' | 'STAF_PBJ' | 'ADMIN_PBJ';

export interface ReviewMatrixCategoryConfig {
  id: string;
  code: string;
  label: string;
  shortLabel: string;
  isCustom?: boolean;
}

export interface ReviewMatrixItem {
  id: string;
  category: string; // Dynamic category code e.g. "KAK", "HPS", "K3_KAPASITAS", etc.
  categoryLabel: string;
  question: string;
  regulationReference: string;
  evaluationStatus: MatrixEvaluationStatus;
  evidenceNotes: string;
  addedByRole?: ReviewerRoleType;
  addedByName?: string;
  isCustom?: boolean;
}

export interface DocumentReviewMatrixState {
  docId: string;
  reviewerRole: ReviewerRoleType;
  reviewerName: string;
  reviewerNip: string;
  reviewDate: string;
  finalConclusion: 'LAYAK' | 'PERLU_PERBAIKAN' | 'TIDAK_LAYAK';
  summaryNotes: string;
  items: ReviewMatrixItem[];
}

export interface ReviewChecklistCriteria {
  id: string;
  category: string;
  item: string;
  regulationReference: string;
  isChecked: boolean;
  remarks?: string;
}

export interface OPDNumberingConfig {
  id: string;
  opdName: string; // e.g. "Dinas Komunikasi, Informatika dan Statistik"
  opdCode: string; // e.g. "DISKOMINFO"
  classificationCode: string; // e.g. "027"
  currentCounter: number; // e.g. 15
  counterPadding: number; // 3 -> 015
  templatePackageReg: string; // e.g. "PL-{KODE_OPD}-{TAHUN}-{NO}"
  templateInvitation: string; // e.g. "{KLASIFIKASI}/{NO}/UND-PL/{KODE_OPD}/{BULAN_ROMAWI}/{TAHUN}"
  templateBAHPL: string; // e.g. "{KLASIFIKASI}/{NO}/BAHPL/{KODE_OPD}/{BULAN_ROMAWI}/{TAHUN}"
  templateSPK: string; // e.g. "{KLASIFIKASI}/{NO}/SPK/{KODE_OPD}/{BULAN_ROMAWI}/{TAHUN}"
  fiscalYear: number;
  lastUpdated: string;
}

