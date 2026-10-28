/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  UploadCloud,
  GitMerge,
  Archive,
  FileCheck2,
  Building2,
  Sliders,
} from 'lucide-react';

export type MainNavTab = 
  | 'dashboard'
  | 'kelola-paket'
  | 'unggah-dokumen'
  | 'tahapan-proses'
  | 'pengarsipan'
  | 'review-dokumen'
  | 'penomoran-opd';

interface SidebarProps {
  activeTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  pendingReviewCount: number;
  totalPackageCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingReviewCount,
  totalPackageCount,
}) => {

  return (
    <aside className="w-64 bg-[#23090e] text-rose-100/90 flex flex-col shrink-0 min-h-screen border-r border-[#3a141b] select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-[#3a141b]">
        <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-400/30 flex items-center justify-center text-rose-300 font-bold">
          <Building2 className="w-4 h-4 text-rose-300" />
        </div>
        <div>
          <div className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
            <span>SIPELANG</span>
            <span className="text-[10px] font-mono text-rose-200 bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-800/60">
              PBJ
            </span>
          </div>
          <div className="text-[11px] text-rose-200/70">Pengadaan Langsung</div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="p-3.5 space-y-5 flex-1 overflow-y-auto">
        {/* Menu Utama */}
        <div>
          <div className="px-2.5 mb-1.5 text-[10px] font-bold tracking-wider text-rose-300/60 uppercase">
            Menu Utama
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-[#701524] text-white font-semibold shadow-xs'
                  : 'text-rose-100/80 hover:bg-[#340f17] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-rose-300/70'}`} />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => onTabChange('kelola-paket')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'kelola-paket'
                  ? 'bg-[#701524] text-white font-semibold shadow-xs'
                  : 'text-rose-100/80 hover:bg-[#340f17] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderKanban className={`w-4 h-4 ${activeTab === 'kelola-paket' ? 'text-white' : 'text-rose-300/70'}`} />
                <span>Paket Pengadaan</span>
              </div>
              <span className="text-[10px] font-mono tabular-nums text-rose-200/70 bg-[#1c070b] px-1.5 py-0.2 rounded">
                {totalPackageCount}
              </span>
            </button>
          </div>
        </div>

        {/* Operasional Dokumen */}
        <div>
          <div className="px-2.5 mb-1.5 text-[10px] font-bold tracking-wider text-rose-300/60 uppercase">
            Operasional
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onTabChange('unggah-dokumen')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'unggah-dokumen'
                  ? 'bg-[#701524] text-white font-semibold shadow-xs'
                  : 'text-rose-100/80 hover:bg-[#340f17] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UploadCloud className={`w-4 h-4 ${activeTab === 'unggah-dokumen' ? 'text-white' : 'text-rose-300/70'}`} />
                <span>Unggah Dokumen</span>
              </div>
            </button>

            <button
              onClick={() => onTabChange('review-dokumen')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'review-dokumen'
                  ? 'bg-[#701524] text-white font-semibold shadow-xs'
                  : 'text-rose-100/80 hover:bg-[#340f17] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileCheck2 className={`w-4 h-4 ${activeTab === 'review-dokumen' ? 'text-white' : 'text-rose-300/70'}`} />
                <span>Review Dokumen</span>
              </div>
              {pendingReviewCount > 0 && (
                <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-100 font-semibold">
                  {pendingReviewCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('tahapan-proses')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'tahapan-proses'
                  ? 'bg-[#701524] text-white font-semibold shadow-xs'
                  : 'text-rose-100/80 hover:bg-[#340f17] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GitMerge className={`w-4 h-4 ${activeTab === 'tahapan-proses' ? 'text-white' : 'text-rose-300/70'}`} />
                <span>Tahapan Proses</span>
              </div>
            </button>

            <button
              onClick={() => onTabChange('pengarsipan')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'pengarsipan'
                  ? 'bg-[#701524] text-white font-semibold shadow-xs'
                  : 'text-rose-100/80 hover:bg-[#340f17] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Archive className={`w-4 h-4 ${activeTab === 'pengarsipan' ? 'text-white' : 'text-rose-300/70'}`} />
                <span>Pengarsipan</span>
              </div>
            </button>
          </div>
        </div>

        {/* Master Data OPD */}
        <div>
          <div className="px-2.5 mb-1.5 text-[10px] font-bold tracking-wider text-rose-300/60 uppercase">
            Pengaturan
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onTabChange('penomoran-opd')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'penomoran-opd'
                  ? 'bg-[#701524] text-white font-semibold shadow-xs'
                  : 'text-rose-100/80 hover:bg-[#340f17] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className={`w-4 h-4 ${activeTab === 'penomoran-opd' ? 'text-white' : 'text-rose-300/70'}`} />
                <span>Penomoran OPD</span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Simplified Footer Reference */}
      <div className="p-3.5 border-t border-[#3a141b] text-[11px] text-rose-200/70 space-y-1">
        <div className="text-[10px] font-bold text-rose-300/70 uppercase">
          Batas Pengadaan Langsung
        </div>
        <div className="flex justify-between text-[11px]">
          <span>Barang / Fisik</span>
          <span className="font-mono text-white">≤ 200 Jt</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span>Konsultansi</span>
          <span className="font-mono text-white">≤ 100 Jt</span>
        </div>
      </div>
    </aside>
  );
};
