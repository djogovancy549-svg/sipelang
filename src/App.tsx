/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ProcurementPackage,
  DocumentItem,
  ReviewStatus,
  OPDNumberingConfig,
} from './types/procurement';
import { INITIAL_PACKAGES, INITIAL_DOCUMENTS } from './data/mockData';
import { INITIAL_OPD_CONFIGS } from './data/opdNumberingData';
import { sendWebhookPayload } from './utils/webhookService';
import { Navbar } from './components/Navbar';
import { Sidebar, MainNavTab } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { ManagePackages } from './components/ManagePackages';
import { UploadDocumentView } from './components/UploadDocumentView';
import { StageProcessView } from './components/StageProcessView';
import { ArchivingView } from './components/ArchivingView';
import { ReviewWorkbenchView } from './components/ReviewWorkbenchView';
import { OPDNumberingView } from './components/OPDNumberingView';
import { PackageDetailModal } from './components/PackageDetailModal';
import { CreatePackageModal } from './components/CreatePackageModal';
import { GoogleIntegrationModal } from './components/GoogleIntegrationModal';
import { OfficialDocumentsArchive, DocumentRecord } from './components/OfficialDocumentsArchive';
import { PackageReportingView } from './components/PackageReportingView';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Persistence via localStorage with fallbacks
  const [packages, setPackages] = useState<ProcurementPackage[]>(() => {
    try {
      const saved = localStorage.getItem('sipelang_packages_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load packages from localStorage', e);
    }
    return INITIAL_PACKAGES;
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem('sipelang_documents_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load documents from localStorage', e);
    }
    return INITIAL_DOCUMENTS;
  });

  const [opdList, setOpdList] = useState<OPDNumberingConfig[]>(() => {
    try {
      const saved = localStorage.getItem('sipelang_opd_configs_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load OPD configs from localStorage', e);
    }
    return INITIAL_OPD_CONFIGS;
  });

  const [activeTab, setActiveTab] = useState<MainNavTab>('dashboard');
  const [selectedPackageForDetail, setSelectedPackageForDetail] = useState<ProcurementPackage | null>(null);
  const [stageTrackerPackageId, setStageTrackerPackageId] = useState<string | undefined>(undefined);
  const [reviewSelectedDocId, setReviewSelectedDocId] = useState<string | undefined>(undefined);
  const [uploadPreselectedPackageId, setUploadPreselectedPackageId] = useState<string | undefined>(undefined);

  // Ensure initial packages load if storage is empty
  useEffect(() => {
    if (packages.length === 0 && INITIAL_PACKAGES.length > 0) {
      setPackages(INITIAL_PACKAGES);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sipelang_packages_v1', JSON.stringify(packages));
    } catch (e) {
      console.error(e);
    }
  }, [packages]);

  useEffect(() => {
    try {
      localStorage.setItem('sipelang_documents_v1', JSON.stringify(documents));
    } catch (e) {
      console.error(e);
    }
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem('sipelang_opd_configs_v1', JSON.stringify(opdList));
    } catch (e) {
      console.error(e);
    }
  }, [opdList]);

  // Handlers
  const handlePackageCreated = (newPkg: ProcurementPackage) => {
    setPackages((prev) => [newPkg, ...prev]);
    setIsCreateModalOpen(false);
    setActiveTab('kelola-paket');

    // Trigger Webhook Sync
    sendWebhookPayload('PACKAGE_CREATED', newPkg).then((res) => {
      showToast(res.message, res.success ? 'success' : 'error');
    });
  };

  const handleAddOPD = (newOpd: OPDNumberingConfig) => {
    setOpdList((prev) => [...prev, newOpd]);
    sendWebhookPayload('OPD_NUMBERING_UPDATED', { ...newOpd, action: 'ADD' });
  };

  const handleUpdateOPD = (updatedOpd: OPDNumberingConfig) => {
    setOpdList((prev) => prev.map((o) => (o.id === updatedOpd.id ? updatedOpd : o)));
    sendWebhookPayload('OPD_NUMBERING_UPDATED', { ...updatedOpd, action: 'UPDATE' });
  };

  const handleDeleteOPD = (opdId: string) => {
    setOpdList((prev) => prev.filter((o) => o.id !== opdId));
  };

  const handleIncrementOPDCounter = (opdId: string) => {
    setOpdList((prev) =>
      prev.map((o) =>
        o.id === opdId
          ? { ...o, currentCounter: o.currentCounter + 1, lastUpdated: new Date().toISOString().slice(0, 10) }
          : o
      )
    );
  };

  const openUploadForPackage = (pkgId: string) => {
    setUploadPreselectedPackageId(pkgId);
    setActiveTab('unggah-dokumen');
  };

  const handleDocumentUploaded = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);

    // Trigger Webhook Sync (Photo vs Document)
    const eventType = newDoc.category === 'DOKUMENTASI_FOTO' ? 'PHOTO_UPLOADED' : 'DOCUMENT_UPLOADED';
    sendWebhookPayload(eventType, newDoc).then((res) => {
      showToast(res.message, res.success ? 'success' : 'error');
    });
  };

  const handleDocumentsSynced = (syncedDocs: DocumentItem[]) => {
    setDocuments((prev) => {
      // Avoid duplicates by matching driveFileId or id
      const existingDriveIds = new Set(prev.map((d) => d.driveFileId).filter(Boolean));
      const existingIds = new Set(prev.map((d) => d.id));
      
      const toAdd = syncedDocs.filter((d) => {
        if (d.driveFileId && existingDriveIds.has(d.driveFileId)) return false;
        if (existingIds.has(d.id)) return false;
        return true;
      });

      return [...toAdd, ...prev];
    });
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleUpdatePackageStage = (updatedPkg: ProcurementPackage) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === updatedPkg.id ? updatedPkg : p))
    );

    sendWebhookPayload('STAGE_UPDATED', updatedPkg);
  };

  const handleUpdatePackageReport = (updatedPkg: ProcurementPackage) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === updatedPkg.id ? updatedPkg : p))
    );
  };

  const handleUpdateDocumentReview = (docId: string, status: ReviewStatus, notes: string) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          const updatedDoc = {
            ...doc,
            reviewStatus: status,
            notes,
            reviewDate: new Date().toISOString().slice(0, 10),
            reviewerName: 'Bambang Pratama, S.Kom. (PP)',
          };

          sendWebhookPayload('MATRIX_UPDATED', {
            docId: updatedDoc.id,
            question: updatedDoc.title,
            evaluationStatus: status,
            evidenceNotes: notes,
            packageId: updatedDoc.packageId
          });

          return updatedDoc;
        }
        return doc;
      })
    );
  };

  const handleArchivePackage = (pkgId: string, boxNumber: string, verifier: string) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id === pkgId) {
          const archived = {
            ...pkg,
            isArchived: true,
            archiveBoxNumber: boxNumber,
            archiveVerifiedBy: verifier,
            archiveDate: new Date().toISOString().slice(0, 10),
          };
          sendWebhookPayload('PACKAGE_ARCHIVED', archived);
          return archived;
        }
        return pkg;
      })
    );
    showToast(`Paket berhasil diarsipkan di Kotak Arsip ${boxNumber}`, 'success');
  };

  // Reset ALL Data Function
  const handleResetData = () => {
    setPackages([]);
    setDocuments([]);
    localStorage.removeItem('sipelang_packages_v1');
    localStorage.removeItem('sipelang_documents_v1');
    showToast('Seluruh data dummy & lokal berhasil dihapus bersih (Reset 0 Data).', 'success');
  };

  const openReviewForDocument = (doc: DocumentItem) => {
    setReviewSelectedDocId(doc.id);
    setActiveTab('review-dokumen');
  };

  const openStageTrackerForPackage = (pkg: ProcurementPackage) => {
    setStageTrackerPackageId(pkg.id);
    setActiveTab('tahapan-proses');
  };

  const openReviewForPackage = (pkg: ProcurementPackage) => {
    const pkgDoc = documents.find((d) => d.packageId === pkg.id);
    if (pkgDoc) {
      setReviewSelectedDocId(pkgDoc.id);
    }
    setActiveTab('review-dokumen');
  };

  const handleEditDocument = (record: DocumentRecord) => {
    setStageTrackerPackageId(record.packageId);
    if (record.documentType === 'EVALUASI') {
      setActiveTab('evaluasi-penawaran');
    } else {
      setActiveTab('jadwal-undangan');
    }
  };

  // Derive title for top breadcrumb
  const getTabTitle = (): string => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Utama';
      case 'kelola-paket':
        return 'Kelola Paket Pengadaan';
      case 'unggah-dokumen':
        return 'Unggah Dokumen & Data Visual';
      case 'tahapan-proses':
        return 'Tahapan Proses (Monitoring & Ceklist)';
      case 'jadwal-undangan':
        return 'Penjadwalan Pengadaan & Surat Undangan';
      case 'evaluasi-penawaran':
        return 'Formulir Evaluasi Penawaran Pengadaan Langsung';
      case 'daftar-dokumen':
        return 'Daftar Dokumen Resmi (OPTIMA.DOK Record)';
      case 'pengarsipan':
        return 'Pengarsipan Dokumen (E-Arsip)';
      case 'review-dokumen':
        return 'Review Dokumen (Telaah Kelayakan)';
      case 'penomoran-opd':
        return 'Pengaturan Penomoran Otomatis OPD';
      case 'pelaporan-paket':
        return 'Pelaporan Paket Pengadaan (Tender & PL)';
      default:
        return 'OPTIMA.DOK Nagekeo';
    }
  };

  const pendingReviewCount = documents.filter((d) => d.reviewStatus === 'MENUNGGU_REVIEW').length;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-stone-100/70 font-sans text-stone-900 overflow-hidden">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : 'bg-rose-900 text-rose-100 border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toast.text}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/70 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        pendingReviewCount={pendingReviewCount}
        totalPackageCount={packages.length}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Navbar
          currentMenuTitle={getTabTitle()}
          onQuickCreate={() => setIsCreateModalOpen(true)}
          pendingReviewCount={pendingReviewCount}
          onOpenGoogleSettings={() => setIsGoogleModalOpen(true)}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardOverview
                packages={packages}
                documents={documents}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onSelectPackage={(pkg) => setSelectedPackageForDetail(pkg)}
                onReviewDocument={(doc) => openReviewForDocument(doc)}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
              />
            )}

            {activeTab === 'kelola-paket' && (
              <ManagePackages
                packages={packages}
                onCreateNew={() => setIsCreateModalOpen(true)}
                onSelectPackage={(pkg) => setSelectedPackageForDetail(pkg)}
                onOpenStageTracker={(pkg) => openStageTrackerForPackage(pkg)}
                onOpenReviewForPackage={(pkg) => openReviewForPackage(pkg)}
              />
            )}

            {activeTab === 'unggah-dokumen' && (
              <UploadDocumentView
                packages={packages}
                documents={documents}
                onDocumentUploaded={handleDocumentUploaded}
                onReviewDocument={(doc) => openReviewForDocument(doc)}
                preselectedPackageId={uploadPreselectedPackageId}
                onDocumentsSynced={handleDocumentsSynced}
                onDeleteDocument={handleDeleteDocument}
                onOpenGoogleSettings={() => setIsGoogleModalOpen(true)}
              />
            )}

            {activeTab === 'tahapan-proses' && (
              <StageProcessView
                packages={packages}
                documents={documents}
                onUpdatePackageStage={handleUpdatePackageStage}
                selectedPackageId={stageTrackerPackageId}
                initialSubTab="CHECKLIST_TABLE"
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenReviewDoc={(doc) => openReviewForDocument(doc)}
                onUpdateDocumentReview={handleUpdateDocumentReview}
              />
            )}

            {activeTab === 'jadwal-undangan' && (
              <StageProcessView
                packages={packages}
                documents={documents}
                onUpdatePackageStage={handleUpdatePackageStage}
                selectedPackageId={stageTrackerPackageId}
                initialSubTab="JADWAL_UNDANGAN"
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenReviewDoc={(doc) => openReviewForDocument(doc)}
                onUpdateDocumentReview={handleUpdateDocumentReview}
              />
            )}

            {activeTab === 'evaluasi-penawaran' && (
              <StageProcessView
                packages={packages}
                documents={documents}
                onUpdatePackageStage={handleUpdatePackageStage}
                selectedPackageId={stageTrackerPackageId}
                initialSubTab="EVALUASI_PENAWARAN"
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenReviewDoc={(doc) => openReviewForDocument(doc)}
                onUpdateDocumentReview={handleUpdateDocumentReview}
              />
            )}

            {activeTab === 'negosiasi-harga' && (
              <StageProcessView
                packages={packages}
                documents={documents}
                onUpdatePackageStage={handleUpdatePackageStage}
                selectedPackageId={stageTrackerPackageId}
                initialSubTab="NEGOSIASI_HARGA"
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenReviewDoc={(doc) => openReviewForDocument(doc)}
                onUpdateDocumentReview={handleUpdateDocumentReview}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'daftar-hadir' && (
              <StageProcessView
                packages={packages}
                documents={documents}
                onUpdatePackageStage={handleUpdatePackageStage}
                selectedPackageId={stageTrackerPackageId}
                initialSubTab="DAFTAR_HADIR"
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenReviewDoc={(doc) => openReviewForDocument(doc)}
                onUpdateDocumentReview={handleUpdateDocumentReview}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'dokumentasi-foto' && (
              <StageProcessView
                packages={packages}
                documents={documents}
                onUpdatePackageStage={handleUpdatePackageStage}
                selectedPackageId={stageTrackerPackageId}
                initialSubTab="DOKUMENTASI_FOTO"
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenReviewDoc={(doc) => openReviewForDocument(doc)}
                onUpdateDocumentReview={handleUpdateDocumentReview}
              />
            )}

            {activeTab === 'daftar-dokumen' && (
              <OfficialDocumentsArchive
                packages={packages}
                onEditDocument={handleEditDocument}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'pengarsipan' && (
              <ArchivingView
                packages={packages}
                documents={documents}
                onArchivePackage={handleArchivePackage}
              />
            )}

            {activeTab === 'review-dokumen' && (
              <ReviewWorkbenchView
                documents={documents}
                packages={packages}
                onUpdateDocumentReview={handleUpdateDocumentReview}
                selectedDocId={reviewSelectedDocId}
              />
            )}

            {activeTab === 'penomoran-opd' && (
              <OPDNumberingView
                opdList={opdList}
                onAddOPD={handleAddOPD}
                onUpdateOPD={handleUpdateOPD}
                onDeleteOPD={handleDeleteOPD}
              />
            )}

            {activeTab === 'pelaporan-paket' && (
              <PackageReportingView
                packages={packages}
                onUpdatePackage={handleUpdatePackageReport}
                onShowToast={showToast}
              />
            )}
          </div>
        </main>
      </div>

      {/* PACKAGE DETAIL MODAL */}
      {selectedPackageForDetail && (
        <PackageDetailModal
          pkg={selectedPackageForDetail}
          documents={documents.filter((d) => d.packageId === selectedPackageForDetail.id)}
          onClose={() => setSelectedPackageForDetail(null)}
          onOpenStageTracker={(pkg) => {
            setSelectedPackageForDetail(null);
            openStageTrackerForPackage(pkg);
          }}
          onOpenUpload={(pkgId) => {
            setSelectedPackageForDetail(null);
            openUploadForPackage(pkgId);
          }}
          onReviewDoc={(doc) => {
            setSelectedPackageForDetail(null);
            openReviewForDocument(doc);
          }}
        />
      )}

      {/* CREATE PACKAGE MODAL */}
      {isCreateModalOpen && (
        <CreatePackageModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onPackageCreated={handlePackageCreated}
          opdList={opdList}
          onIncrementOPDCounter={handleIncrementOPDCounter}
        />
      )}

      {/* GOOGLE INTEGRATION & WEBHOOK SETTINGS MODAL */}
      <GoogleIntegrationModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onResetData={handleResetData}
        onShowToast={showToast}
      />
    </div>
  );
}
