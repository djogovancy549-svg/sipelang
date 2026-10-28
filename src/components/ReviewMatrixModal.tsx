/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  DocumentItem,
  ProcurementPackage,
  ReviewStatus,
  ReviewMatrixItem,
  MatrixEvaluationStatus,
  ReviewerRoleType,
  ReviewMatrixCategoryConfig,
} from '../types/procurement';
import {
  DEFAULT_REVIEW_MATRIX_ITEMS,
  DEFAULT_MATRIX_CATEGORIES,
  ROLE_LABELS,
} from '../data/reviewMatrixTemplates';
import { MarqueeTicker } from './MarqueeTicker';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Save,
  Check,
  FolderPlus,
  Tag,
} from 'lucide-react';

interface ReviewMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem;
  procurementPackage?: ProcurementPackage;
  onSaveEvaluation: (
    docId: string,
    newStatus: ReviewStatus,
    summaryNotes: string,
    items: ReviewMatrixItem[],
    reviewerName: string,
    reviewerRole: ReviewerRoleType
  ) => void;
  initialItems?: ReviewMatrixItem[];
}

export const ReviewMatrixModal: React.FC<ReviewMatrixModalProps> = ({
  isOpen,
  onClose,
  document,
  procurementPackage,
  onSaveEvaluation,
  initialItems,
}) => {
  // Categories State (Default + Dynamic Custom Categories)
  const [categories, setCategories] = useState<ReviewMatrixCategoryConfig[]>(() => {
    try {
      const cached = localStorage.getItem('sipelang_matrix_categories');
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return DEFAULT_MATRIX_CATEGORIES;
  });

  // Matrix Items State
  const [items, setItems] = useState<ReviewMatrixItem[]>(() => {
    try {
      const cached = localStorage.getItem(`sipelang_matrix_${document.id}`);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return initialItems && initialItems.length > 0
      ? initialItems
      : DEFAULT_REVIEW_MATRIX_ITEMS;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [reviewerRole, setReviewerRole] = useState<ReviewerRoleType>('PEJABAT_PENGADAAN');
  const [reviewerName, setReviewerName] = useState<string>(
    document.reviewerName || 'Bambang Pratama, S.Kom.'
  );
  const [reviewerNip, setReviewerNip] = useState<string>('19840215 200903 1 004');
  const [summaryNotes, setSummaryNotes] = useState<string>(
    document.notes || 'Seluruh kriteria telaah regulasi telah diverifikasi dan memenuhi ketentuan pengadaan langsung.'
  );

  // Add Question State
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newCategory, setNewCategory] = useState<string>('KAK');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newRegulationRef, setNewRegulationRef] = useState('');

  // Add Category Form State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');

  // Edit Question State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<string>('KAK');
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editRegulationRef, setEditRegulationRef] = useState('');

  // Undo Notification state
  const [deletedHistory, setDeletedHistory] = useState<{ item: ReviewMatrixItem; index: number } | null>(null);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter items by category
  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  // KPI Calculations
  const totalCount = items.length;
  const memenuhiCount = items.filter((i) => i.evaluationStatus === 'MEMENUHI').length;
  const catatanCount = items.filter((i) => i.evaluationStatus === 'ADA_CATATAN').length;
  const tidakMemenuhiCount = items.filter((i) => i.evaluationStatus === 'TIDAK_MEMENUHI').length;
  const fulfillmentRate = totalCount > 0 ? Math.round((memenuhiCount / totalCount) * 100) : 0;

  let recommendedConclusion: ReviewStatus = 'DISETUJUI';
  if (tidakMemenuhiCount > 0) {
    recommendedConclusion = 'PERLU_PERBAIKAN';
  } else if (catatanCount > 0 && fulfillmentRate < 80) {
    recommendedConclusion = 'PERLU_PERBAIKAN';
  }

  // Status toggle
  const handleStatusChange = (itemId: string, status: MatrixEvaluationStatus) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, evaluationStatus: status } : i))
    );
  };

  // Note change
  const handleNoteChange = (itemId: string, notes: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, evidenceNotes: notes } : i))
    );
  };

  // Add New Category Dynamically
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryLabel.trim()) return;

    const code = `CAT_${Date.now()}`;
    const nextNum = categories.length + 1;
    const cleanLabel = newCategoryLabel.trim();

    const newCatConfig: ReviewMatrixCategoryConfig = {
      id: `cat-custom-${Date.now()}`,
      code,
      label: cleanLabel,
      shortLabel: `${nextNum}. ${cleanLabel}`,
      isCustom: true,
    };

    const updatedCategories = [...categories, newCatConfig];
    setCategories(updatedCategories);

    try {
      localStorage.setItem('sipelang_matrix_categories', JSON.stringify(updatedCategories));
    } catch {
      // ignore
    }

    setNewCategory(code);
    setSelectedCategory(code);
    setNewCategoryLabel('');
    setIsAddingCategory(false);
    setShowNotification(`Kategori baru "${cleanLabel}" berhasil ditambahkan.`);
    setTimeout(() => setShowNotification(null), 3000);
  };

  // Delete Category
  const handleDeleteCategory = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const catToDelete = categories.find((c) => c.id === catId);
    if (!catToDelete) return;

    const updatedCategories = categories.filter((c) => c.id !== catId);
    setCategories(updatedCategories);

    try {
      localStorage.setItem('sipelang_matrix_categories', JSON.stringify(updatedCategories));
    } catch {
      // ignore
    }

    if (selectedCategory === catToDelete.code) {
      setSelectedCategory('ALL');
    }

    // Reassign any questions in this category to KAK
    setItems((prev) =>
      prev.map((i) =>
        i.category === catToDelete.code ? { ...i, category: 'KAK', categoryLabel: 'Kerangka Acuan Kerja (KAK) & Spesifikasi' } : i
      )
    );

    setShowNotification(`Kategori "${catToDelete.label}" berhasil dihapus.`);
    setTimeout(() => setShowNotification(null), 3500);
  };

  // Start Editing an Item
  const handleStartEdit = (item: ReviewMatrixItem) => {
    setEditingItemId(item.id);
    setEditCategory(item.category);
    setEditQuestionText(item.question);
    setEditRegulationRef(item.regulationReference);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItemId || !editQuestionText.trim()) return;

    const matchedCat = categories.find((c) => c.code === editCategory);

    setItems((prev) =>
      prev.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              category: editCategory,
              categoryLabel: matchedCat ? matchedCat.label : editCategory,
              question: editQuestionText.trim(),
              regulationReference: editRegulationRef.trim() || 'Perpres 12/2021',
            }
          : item
      )
    );

    setEditingItemId(null);
    setShowNotification('Perubahan kriteria berhasil disimpan.');
    setTimeout(() => setShowNotification(null), 3000);
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  // Delete Item
  const handleDeleteItem = (itemId: string) => {
    const itemIndex = items.findIndex((i) => i.id === itemId);
    const itemToDelete = items[itemIndex];
    if (!itemToDelete) return;

    setDeletedHistory({ item: itemToDelete, index: itemIndex });
    setItems((prev) => prev.filter((i) => i.id !== itemId));

    setShowNotification(`Kriteria "${itemToDelete.question.slice(0, 30)}..." berhasil dihapus.`);
    setTimeout(() => {
      setShowNotification((prev) => (prev?.includes('dihapus') ? null : prev));
    }, 4500);
  };

  // Undo Delete
  const handleUndoDelete = () => {
    if (!deletedHistory) return;
    const updated = [...items];
    updated.splice(deletedHistory.index, 0, deletedHistory.item);
    setItems(updated);
    setDeletedHistory(null);
    setShowNotification('Kriteria berhasil dipulihkan kembali.');
    setTimeout(() => setShowNotification(null), 3000);
  };

  // Add New Question
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    const matchedCat = categories.find((c) => c.code === newCategory);

    const newItem: ReviewMatrixItem = {
      id: `mat-custom-${Date.now()}`,
      category: newCategory,
      categoryLabel: matchedCat ? matchedCat.label : newCategory,
      question: newQuestionText.trim(),
      regulationReference:
        newRegulationRef.trim() || 'Perpres 12/2021 & Standar PBJ',
      evaluationStatus: 'MEMENUHI',
      evidenceNotes: 'Telah diperiksa dan diverifikasi.',
      addedByRole: reviewerRole,
      addedByName: reviewerName,
      isCustom: true,
    };

    setItems((prev) => [...prev, newItem]);
    setNewQuestionText('');
    setNewRegulationRef('');
    setIsAddingQuestion(false);
    setShowNotification('Kriteria baru berhasil ditambahkan.');
    setTimeout(() => setShowNotification(null), 3000);
  };

  // Save changes & apply
  const handleSaveAndApply = () => {
    try {
      localStorage.setItem(`sipelang_matrix_${document.id}`, JSON.stringify(items));
    } catch {
      // ignore
    }

    onSaveEvaluation(
      document.id,
      recommendedConclusion,
      summaryNotes,
      items,
      reviewerName,
      reviewerRole
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200/90 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Simplified Clean Header */}
        <div className="bg-[#701524] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-300" />
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                Matriks Penilaian Dokumen Pengadaan Langsung
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-rose-100/90">
              <span className="font-semibold">{document.title}</span>
              {procurementPackage && (
                <>
                  <span>•</span>
                  <span>{procurementPackage.skpdName}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/15 text-rose-100 hover:text-white transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Berjalan (Running Text / Marquee Ticker) sebagai Penghias */}
        <MarqueeTicker
          announcements={[
            `REVIEW MATRIKS DOKUMEN: ${document.title}`,
            `Pejabat Pengadaan (PP): ${reviewerName}`,
            `Selalu pastikan kesesuaian KAK, HPS, DPA SKPD, KSWP Ditjen Pajak & INAPROC LKPP terverifikasi sah`,
            `Gunakan opsi Tambah Kategori & Tambah Kriteria untuk penelaahan yang fleksibel dan akuntabel`,
          ]}
        />

        {/* Clean Top Toolbar */}
        <div className="bg-stone-50 border-b border-stone-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          {/* Reviewer Role & Info */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 font-medium">Peran:</span>
              <select
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value as ReviewerRoleType)}
                className="font-semibold text-stone-800 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-[#701524]"
              >
                <option value="PEJABAT_PENGADAAN">Pejabat Pengadaan (PP)</option>
                <option value="BAGIAN_PENGADAAN">Bagian Pengadaan / UKPBJ</option>
                <option value="STAF_PBJ">Staf Teknis PBJ</option>
                <option value="ADMIN_PBJ">Administrator</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 font-medium">Penilai:</span>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs w-44 font-semibold text-stone-800 focus:ring-1 focus:ring-[#701524]"
                placeholder="Nama Penilai"
              />
            </div>
          </div>

          {/* KPI Summary & Action Buttons */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg font-bold text-stone-700 shadow-2xs">
              {totalCount} Kriteria • <span className="text-emerald-700">{fulfillmentRate}% Sesuai</span>
            </span>

            <button
              type="button"
              onClick={() => {
                setIsAddingQuestion(!isAddingQuestion);
                setIsAddingCategory(false);
                setEditingItemId(null);
              }}
              className="px-3 py-1 bg-[#701524] hover:bg-[#59101c] text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kriteria</span>
            </button>
          </div>
        </div>

        {/* Temporary Notification Banner */}
        {showNotification && (
          <div className="bg-stone-900 text-white px-5 py-2 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-100 shrink-0">
            <span>{showNotification}</span>
            {deletedHistory && (
              <button
                type="button"
                onClick={handleUndoDelete}
                className="text-amber-300 hover:text-amber-200 font-bold underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Urungkan</span>
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          
          {/* Dynamic Category Tabs & Management Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-100 p-1.5 rounded-xl">
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-white text-stone-900 font-bold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Semua ({items.length})
              </button>

              {/* Dynamic Category Tabs */}
              {categories.map((cat) => {
                const count = items.filter((i) => i.category === cat.code).length;
                const isSelected = selectedCategory === cat.code;

                return (
                  <div
                    key={cat.id}
                    className={`group relative flex items-center rounded-lg text-[11px] font-medium transition-all ${
                      isSelected
                        ? 'bg-[#701524] text-white font-bold shadow-2xs'
                        : 'text-stone-700 bg-white/80 hover:bg-white border border-stone-200/80'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(cat.code)}
                      className="px-2.5 py-1 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{cat.shortLabel || cat.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-rose-900 text-rose-100' : 'bg-stone-200 text-stone-600 font-mono'
                        }`}
                      >
                        {count}
                      </span>
                    </button>

                    {/* Tombol Hapus Kategori (Dapat dihapus bila custom/tambahan) */}
                    {(cat.isCustom || categories.length > 5) && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCategory(cat.id, e)}
                        className={`pr-2 hover:scale-110 transition-transform cursor-pointer ${
                          isSelected ? 'text-rose-200 hover:text-white' : 'text-stone-400 hover:text-rose-600'
                        }`}
                        title={`Hapus kategori "${cat.label}"`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tombol Tambah Kategori Baru */}
            <button
              type="button"
              onClick={() => {
                setIsAddingCategory(!isAddingCategory);
                setIsAddingQuestion(false);
              }}
              className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
              title="Tambah Kategori Unsur Baru"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Kategori Baru</span>
            </button>
          </div>

          {/* Form Tambah Kategori Baru (Fleksibel) */}
          {isAddingCategory && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-800" />
                  <span>Tambah Kategori Unsur Penilaian Baru</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="text-stone-400 hover:text-stone-600 text-xs"
                >
                  Tutup
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                  placeholder="Contoh: 6. Dokumen K3 & Keselamatan Kerja, 7. Tingkat TKDN..."
                  className="flex-1 text-xs p-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#701524]"
                  required
                />
                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(false)}
                    className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white rounded-lg shadow-2xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Simpan Kategori</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Form Tambah Kriteria Baru */}
          {isAddingQuestion && (
            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3.5 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#701524] flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Butir Kriteria Baru
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingQuestion(false)}
                  className="text-stone-400 hover:text-stone-600 text-xs"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleAddQuestion} className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-stone-600 mb-1 font-medium">Pilih Kategori:</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full text-xs p-1.5 border border-stone-300 rounded-lg bg-white"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.code}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-stone-600 mb-1 font-medium">Dasar Regulasi / Acuan:</label>
                    <input
                      type="text"
                      value={newRegulationRef}
                      onChange={(e) => setNewRegulationRef(e.target.value)}
                      placeholder="Contoh: Perpres 12/2021 Pasal 38, Permen PU..."
                      className="w-full text-xs p-1.5 border border-stone-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-600 mb-1 font-medium">Teks Pertanyaan / Aspek Telaah:</label>
                  <textarea
                    rows={2}
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="Tuliskan aspek pertanyaan yang harus dinilai..."
                    className="w-full text-xs p-1.5 border border-stone-300 rounded-lg bg-white"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingQuestion(false)}
                    className="px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-100 rounded-md"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-semibold bg-[#701524] text-white hover:bg-[#59101c] rounded-md shadow-2xs"
                  >
                    Simpan Kriteria
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Form Edit Kriteria */}
          {editingItemId && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Butir Kriteria
                </span>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-stone-400 hover:text-stone-600 text-xs"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-stone-600 mb-1 font-medium">Kategori:</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full text-xs p-1.5 border border-stone-300 rounded-lg bg-white"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.code}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-stone-600 mb-1 font-medium">Dasar Regulasi / Acuan:</label>
                    <input
                      type="text"
                      value={editRegulationRef}
                      onChange={(e) => setEditRegulationRef(e.target.value)}
                      className="w-full text-xs p-1.5 border border-stone-300 rounded-lg bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-600 mb-1 font-medium">Teks Pertanyaan / Aspek Telaah:</label>
                  <textarea
                    rows={2}
                    value={editQuestionText}
                    onChange={(e) => setEditQuestionText(e.target.value)}
                    className="w-full text-xs p-1.5 border border-stone-300 rounded-lg bg-white"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-100 rounded-md"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-semibold bg-amber-800 text-white hover:bg-amber-900 rounded-md shadow-2xs flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Matrix Table */}
          <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 text-stone-700 text-[11px] font-bold uppercase tracking-wider border-b border-stone-200">
                  <th className="py-2.5 px-3 w-8 text-center">No</th>
                  <th className="py-2.5 px-3 w-5/12">Kategori & Aspek yang Dinilai</th>
                  <th className="py-2.5 px-3 w-3/12 text-center">Status Telaah</th>
                  <th className="py-2.5 px-3 w-3/12">Catatan / Bukti Telaah</th>
                  <th className="py-2.5 px-2 w-16 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredItems.map((item, idx) => {
                  const isMemenuhi = item.evaluationStatus === 'MEMENUHI';
                  const isCatatan = item.evaluationStatus === 'ADA_CATATAN';
                  const isTidak = item.evaluationStatus === 'TIDAK_MEMENUHI';

                  const catConfig = categories.find((c) => c.code === item.category);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        editingItemId === item.id ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* No */}
                      <td className="py-2.5 px-3 text-center text-stone-400 font-mono text-[11px] align-top">
                        {idx + 1}
                      </td>

                      {/* Aspek Pertanyaan */}
                      <td className="py-2.5 px-3 align-top space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 border border-stone-200">
                            {catConfig?.code || item.category}
                          </span>
                          {item.isCustom && (
                            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-800">
                              Tambahan
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-stone-800 text-xs leading-snug">
                          {item.question}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {item.regulationReference}
                        </p>
                      </td>

                      {/* Status Telaah (3 Buttons) */}
                      <td className="py-2.5 px-3 align-top text-center">
                        <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-50 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.id, 'MEMENUHI')}
                            className={`px-2 py-1 text-[11px] font-medium rounded transition-all flex items-center gap-1 cursor-pointer ${
                              isMemenuhi
                                ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                                : 'text-stone-600 hover:text-emerald-700'
                            }`}
                            title="Memenuhi / Sesuai"
                          >
                            <Check className="w-3 h-3" />
                            <span>Sesuai</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.id, 'ADA_CATATAN')}
                            className={`px-2 py-1 text-[11px] font-medium rounded transition-all flex items-center gap-1 cursor-pointer ${
                              isCatatan
                                ? 'bg-amber-500 text-white font-bold shadow-2xs'
                                : 'text-stone-600 hover:text-amber-700'
                            }`}
                            title="Ada Catatan"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>Catatan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.id, 'TIDAK_MEMENUHI')}
                            className={`px-2 py-1 text-[11px] font-medium rounded transition-all flex items-center gap-1 cursor-pointer ${
                              isTidak
                                ? 'bg-rose-600 text-white font-bold shadow-2xs'
                                : 'text-stone-600 hover:text-rose-700'
                            }`}
                            title="Tidak Memenuhi / Revisi"
                          >
                            <X className="w-3 h-3" />
                            <span>Revisi</span>
                          </button>
                        </div>
                      </td>

                      {/* Catatan Bukti */}
                      <td className="py-2.5 px-3 align-top">
                        <input
                          type="text"
                          value={item.evidenceNotes}
                          onChange={(e) => handleNoteChange(item.id, e.target.value)}
                          placeholder="Catatan telaah..."
                          className="w-full text-xs p-1.5 border border-stone-200 rounded-md bg-stone-50/50 hover:bg-white focus:bg-white focus:ring-1 focus:ring-[#701524]"
                        />
                      </td>

                      {/* Aksi: Edit & Hapus Buttons */}
                      <td className="py-2.5 px-2 align-top text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Tombol Edit */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 text-stone-500 hover:text-[#701524] hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                            title="Edit Kriteria Ini"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Hapus Kriteria Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Simple Bottom Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-stone-700">
              Catatan Kesimpulan Pejabat Pengadaan:
            </label>
            <textarea
              rows={2}
              value={summaryNotes}
              onChange={(e) => setSummaryNotes(e.target.value)}
              className="w-full text-xs p-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
              placeholder="Contoh: Berkas telah ditelaah dan memenuhi persyaratan pengadaan langsung..."
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-100 border-t border-stone-200 px-5 py-3 flex items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-700">Status:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                recommendedConclusion === 'DISETUJUI'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {recommendedConclusion === 'DISETUJUI' ? '✓ Memenuhi Syarat' : '⚠ Perlu Perbaikan'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-stone-700 hover:bg-stone-200 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="px-4 py-1.5 bg-[#701524] hover:bg-[#58101c] text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Terapkan Status</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
