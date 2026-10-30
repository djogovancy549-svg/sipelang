/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  UploadCloud,
  GitMerge,
  Archive,
  FileCheck2,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Building2,
  Menu,
  Calendar,
} from 'lucide-react';

export type MainNavTab = 
  | 'dashboard'
  | 'kelola-paket'
  | 'unggah-dokumen'
  | 'tahapan-proses'
  | 'jadwal-undangan'
  | 'pengarsipan'
  | 'review-dokumen'
  | 'penomoran-opd';

interface SidebarProps {
  activeTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  pendingReviewCount: number;
  totalPackageCount: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingReviewCount,
  totalPackageCount,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = isCollapsed !== undefined ? isCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  interface NavItem {
    id: MainNavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge: number | null;
    highlight?: boolean;
  }

  interface NavGroup {
    group: string;
    items: NavItem[];
  }

  const navItems: NavGroup[] = [
    {
      group: 'Menu Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { id: 'kelola-paket', label: 'Paket Pengadaan', icon: FolderKanban, badge: totalPackageCount },
      ],
    },
    {
      group: 'Operasional',
      items: [
        { id: 'unggah-dokumen', label: 'Unggah Dokumen', icon: UploadCloud, badge: null },
        { id: 'review-dokumen', label: 'Review Dokumen', icon: FileCheck2, badge: pendingReviewCount > 0 ? pendingReviewCount : null, highlight: true },
        { id: 'tahapan-proses', label: 'Tahapan Proses & Ceklist', icon: GitMerge, badge: null },
        { id: 'jadwal-undangan', label: 'Penjadwalan & Undangan', icon: Calendar, badge: null },
        { id: 'pengarsipan', label: 'Pengarsipan E-Arsip', icon: Archive, badge: null },
      ],
    },
    {
      group: 'Pengaturan',
      items: [
        { id: 'penomoran-opd', label: 'Penomoran OPD', icon: Sliders, badge: null },
      ],
    },
  ];

  return (
    <aside
      className={`bg-[#23090e] text-rose-100/90 flex flex-col shrink-0 min-h-screen border-r border-[#3a141b] select-none transition-all duration-300 relative z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Brand Header */}
      <div className="h-16 px-3.5 flex items-center justify-between border-b border-[#3a141b] overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-700/30 border border-rose-400/30 flex items-center justify-center text-rose-300 font-bold shadow-xs shrink-0">
            <Building2 className="w-5 h-5 text-rose-300" />
          </div>

          {!collapsed && (
            <div className="min-w-0 animate-fade-in">
              <div className="font-extrabold text-white text-sm tracking-tight flex items-center gap-1.5">
                <span className="truncate">SIPELANG</span>
                <span className="text-[9px] font-mono font-bold text-rose-200 bg-rose-900/80 px-1.5 py-0.2 rounded border border-rose-700/60 shrink-0">
                  PBJ
                </span>
              </div>
              <div className="text-[10px] text-rose-300/70 truncate">Pengadaan Langsung Nagekeo</div>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button */}
        <button
          type="button"
          onClick={handleToggle}
          title={collapsed ? 'Perluas Vertikal Bar' : 'Ciutkan Vertikal Bar'}
          className="p-1.5 rounded-lg text-rose-300/70 hover:text-white hover:bg-rose-950/80 transition-colors border border-transparent hover:border-rose-800/50 cursor-pointer shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="p-2.5 space-y-4 flex-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((group, groupIdx) => (
          <div key={groupIdx}>
            {!collapsed ? (
              <div className="px-2.5 mb-1.5 text-[10px] font-bold tracking-wider text-rose-300/60 uppercase truncate">
                {group.group}
              </div>
            ) : (
              <div className="h-px bg-rose-900/30 my-2" />
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    title={collapsed ? `${item.label} ${item.badge ? `(${item.badge})` : ''}` : undefined}
                    className={`w-full flex items-center ${
                      collapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2'
                    } rounded-xl text-xs font-semibold transition-all group relative cursor-pointer ${
                      isActive
                        ? 'bg-[#701524] text-white shadow-md shadow-rose-950/50 ring-1 ring-rose-500/30'
                        : 'text-rose-100/80 hover:bg-[#340f17] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-rose-300/70 group-hover:text-white'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!collapsed && item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-mono font-bold tabular-nums px-1.5 py-0.2 rounded-full shrink-0 ${
                          item.highlight
                            ? 'bg-rose-500 text-white shadow-2xs'
                            : 'bg-rose-950/80 text-rose-200 border border-rose-800/60'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Badge Dot for Collapsed Mode */}
                    {collapsed && item.badge !== null && item.badge !== undefined && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#23090e] animate-pulse" />
                    )}

                    {/* Tooltip for Collapsed Bar */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1 bg-stone-900 text-white text-[11px] font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                        {item.label}
                        {item.badge ? ` (${item.badge})` : ''}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Simplified Footer Reference */}
      {!collapsed ? (
        <div className="p-3 border-t border-[#3a141b] text-[11px] text-rose-200/70 space-y-1 bg-[#1a060a]">
          <div className="text-[10px] font-bold text-rose-300/70 uppercase tracking-wider">
            Batas Nilai PL (Perpres 12/2021)
          </div>
          <div className="flex justify-between text-[11px]">
            <span>Barang / Fisik</span>
            <span className="font-mono text-white font-bold">≤ 200 Jt</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span>Konsultansi</span>
            <span className="font-mono text-white font-bold">≤ 100 Jt</span>
          </div>
        </div>
      ) : (
        <div className="p-2 border-t border-[#3a141b] text-center text-[9px] font-mono text-rose-300/60 bg-[#1a060a]">
          PL '26
        </div>
      )}
    </aside>
  );
};

