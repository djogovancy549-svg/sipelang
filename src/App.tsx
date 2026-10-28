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

export default function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  // Sync to localStorage
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
  };

  const handleAddOPD = (newOpd: OPDNumberingConfig) => {
    setOpdList((prev) => [...prev, newOpd]);
  };

  const handleUpdateOPD = (updatedOpd: OPDNumberingConfig) => {
    setOpdList((prev) => prev.map((o) => (o.id === updatedOpd.id ? updatedOpd : o)));
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

  const handleDocumentUploaded = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleUpdatePackageStage = (updatedPkg: ProcurementPackage) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === updatedPkg.id ? updatedPkg : p))
    );
  };

  const handleUpdateDocumentReview = (docId: string, status: ReviewStatus, notes: string) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            reviewStatus: status,
            notes,
            reviewDate: new Date().toISOString().slice(0, 10),
            reviewerName: 'Bambang Pratama, S.Kom. (PP)',
          };
        }
        return doc;
      })
    );
  };

  const handleArchivePackage = (pkgId: string, boxNumber: string, verifier: string) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id === pkgId) {
          return {
            ...pkg,
            isArchived: true,
            archiveBoxNumber: boxNumber,
            archiveVerifiedBy: verifier,
            archiveDate: new Date().toISOString().slice(0, 10),
          };
        }
        return pkg;
      })
    );
  };

  const openReviewForDocument = (doc: DocumentItem) => {
    setReviewSelectedDocId(doc.id);
    setActiveTab('review-dokumen');
  };

  const openStageTrackerForPackage = (pkg: ProcurementPackage) => {
    setStageTrackerPackageId(pkg.id);
    setActiveTab('tahapan-proses');
  };

  const openUploadForPackage = (pkgId: string) => {
    setUploadPreselectedPackageId(pkgId);
    setActiveTab('unggah-dokumen');
  };

  const openReviewForPackage = (pkg: ProcurementPackage) => {
    const pkgDoc = documents.find((d) => d.packageId === pkg.id);
    if (pkgDoc) {
      setReviewSelectedDocId(pkgDoc.id);
    }
    setActiveTab('review-dokumen');
  };

  // Derive title for top breadcrumb
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Utama';
      case 'kelola-paket':
        return 'Kelola Paket Pengadaan';
      case 'unggah-dokumen':
        return 'Unggah Dokumen Pengadaan';
      case 'tahapan-proses':
        return 'Tahapan Proses (Monitoring)';
      case 'pengarsipan':
        return 'Pengarsipan Dokumen (E-Arsip)';
      case 'review-dokumen':
        return 'Review Dokumen (Telaah Kelayakan)';
      case 'penomoran-opd':
        return 'Pengaturan Penomoran Otomatis OPD';
    }
  };

  const pendingReviewCount = documents.filter((d) => d.reviewStatus === 'MENUNGGU_REVIEW').length;

  return (
    <div className="flex h-screen bg-stone-100/70 font-sans text-stone-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        pendingReviewCount={pendingReviewCount}
        totalPackageCount={packages.length}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Navbar
          currentMenuTitle={getTabTitle()}
          onQuickCreate={() => setIsCreateModalOpen(true)}
          pendingReviewCount={pendingReviewCount}
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
              />
            )}

            {activeTab === 'tahapan-proses' && (
              <StageProcessView
                packages={packages}
                documents={documents}
                onUpdatePackageStage={handleUpdatePackageStage}
                selectedPackageId={stageTrackerPackageId}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenReviewDoc={(doc) => openReviewForDocument(doc)}
                onUpdateDocumentReview={handleUpdateDocumentReview}
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
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      {selectedPackageForDetail && (
        <PackageDetailModal
          pkg={selectedPackageForDetail}
          documents={documents}
          onClose={() => setSelectedPackageForDetail(null)}
          onOpenStageTracker={(pkg) => openStageTrackerForPackage(pkg)}
          onOpenUpload={(pkgId) => openUploadForPackage(pkgId)}
          onReviewDoc={(doc) => openReviewForDocument(doc)}
        />
      )}

      {/* Create Package Modal (Mode Modal Sesuai Request) */}
      <CreatePackageModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPackageCreated={handlePackageCreated}
        opdList={opdList}
        onIncrementOPDCounter={handleIncrementOPDCounter}
      />
    </div>
  );
}
