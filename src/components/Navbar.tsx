/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell } from 'lucide-react';

interface NavbarProps {
  currentMenuTitle: string;
  onQuickCreate?: () => void;
  pendingReviewCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMenuTitle,
  onQuickCreate,
  pendingReviewCount,
}) => {
  return (
    <header className="h-16 bg-white border-b border-rose-100/70 px-6 flex items-center justify-between gap-6 shrink-0 sticky top-0 z-20">
      {/* Zone 1: Context Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium text-stone-500">SIPELANG</span>
        <span className="text-stone-300">/</span>
        <span className="font-semibold text-rose-950">{currentMenuTitle}</span>
        <span className="hidden sm:inline-block ml-2 text-[10px] font-mono text-[#701524] bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
          Perpres 12/2021 PBJ
        </span>
      </div>

      {/* Zone 2: Status & Pejabat Pengadaan User Tag */}
      <div className="flex items-center gap-3.5">
        {pendingReviewCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200/80 rounded-md text-[11px] text-[#701524] font-medium">
            <Bell className="w-3.5 h-3.5 text-[#701524]" />
            <span><strong className="font-bold tabular-nums">{pendingReviewCount}</strong> review tertunda</span>
          </div>
        )}

        <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
          <div className="w-7 h-7 rounded-full bg-[#701524] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            BP
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-stone-900 leading-tight">Bambang Pratama, S.Kom.</div>
            <div className="text-[10px] text-stone-500">Pejabat Pengadaan (PP)</div>
          </div>
        </div>
      </div>
    </header>
  );
};
