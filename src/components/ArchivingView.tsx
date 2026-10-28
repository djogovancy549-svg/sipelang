/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProcurementPackage, DocumentItem } from '../types/procurement';
import { formatRupiah, getProcurementTypeLabel } from '../utils/formatters';
import {
  Archive,
  FolderArchive,
  FileText,
  Printer,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface ArchivingViewProps {
  packages: ProcurementPackage[];
  documents: DocumentItem[];
  onArchivePackage: (pkgId: string, boxNumber: string, verifier: string) => void;
}

export const ArchivingView: React.FC<ArchivingViewProps> = ({
  packages,
  documents,
  onArchivePackage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackageForKendali, setSelectedPackageForKendali] = useState<ProcurementPackage | null>(null);
  
  const [targetPkgToArchive, setTargetPkgToArchive] = useState<ProcurementPackage | null>(null);
  const [boxNumber, setBoxNumber] = useState('');
  const [verifierName, setVerifierName] = useState('Inspektorat Daerah / APIP');

  const readyToArchivePackages = packages.filter((p) => !p.isArchived && p.overallProgress >= 80);

  const filteredArchived = packages.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.codeRUP.includes(searchQuery) ||
      p.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  const handleConfirmArchive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPkgToArchive) return;
    if (!boxNumber.trim()) {
      alert('Mohon isi Nomor Box Arsip.');
      return;
    }
    onArchivePackage(targetPkgToArchive.id, boxNumber.trim(), verifierName.trim());
    setTargetPkgToArchive(null);
    setBoxNumber('');
    alert('Paket berhasil diarsipkan.');
  };

  const handlePrintKendali = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-stone-900 tracking-tight">
            Pengarsipan Dokumen PBJ (E-Arsip)
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manajemen berkas digital dan pencetakan Lembar Kendali pengawasan audit APIP & BPK.
          </p>
        </div>

        <div className="px-3 py-1 bg-stone-100 rounded-lg text-xs font-mono text-stone-700">
          Terarsip: <strong>{packages.filter((p) => p.isArchived).length}</strong> Paket
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Packages ready for archiving */}
        <div className="lg:col-span-1 bg-white border border-stone-200/90 rounded-xl shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <FolderArchive className="w-4 h-4 text-[#701524]" />
              <span>Siap Diarsipkan ({readyToArchivePackages.length})</span>
            </h2>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto">
            {readyToArchivePackages.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                Tidak ada paket yang menunggu pengarsipan saat ini.
              </div>
            ) : (
              readyToArchivePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-3 border border-stone-200 rounded-lg hover:border-stone-300 transition-colors space-y-1.5"
                >
                  <div>
                    <span className="text-[10px] font-mono text-stone-400">RUP: {pkg.codeRUP}</span>
                    <h4 className="font-semibold text-xs text-stone-900 line-clamp-1">{pkg.name}</h4>
                    <span className="text-[11px] text-stone-500 font-mono">{formatRupiah(pkg.hpsValue)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-stone-500">Progres: {pkg.overallProgress}%</span>
                    <button
                      onClick={() => {
                        setTargetPkgToArchive(pkg);
                        setBoxNumber(`BOX-2026-${pkg.procurementType}-${Math.floor(Math.random() * 90 + 10)}`);
                      }}
                      className="px-2.5 py-1 bg-[#701524] hover:bg-[#58101c] text-white rounded text-[10px] font-medium transition-colors"
                    >
                      Arsipkan
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Master Archived Table & Search */}
        <div className="lg:col-span-2 bg-white border border-stone-200/90 rounded-xl shadow-xs p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
            <h2 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#701524]" />
              <span>Daftar Arsip Dokumen Pengadaan</span>
            </h2>

            <div className="relative sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Cari RUP, paket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
              />
            </div>
          </div>

          <div className="divide-y divide-stone-100 max-h-[460px] overflow-y-auto">
            {filteredArchived.map((pkg) => {
              const typeBadge = getProcurementTypeLabel(pkg.procurementType);
              const pkgDocs = documents.filter((d) => d.packageId === pkg.id);

              return (
                <div key={pkg.id} className="py-2.5 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeBadge.badgeClass}`}>
                          {typeBadge.label}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400">RUP: {pkg.codeRUP}</span>
                        {pkg.isArchived && (
                          <span className="text-[10px] font-mono text-[#701524] bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200/60 flex items-center gap-1 font-semibold">
                            <Archive className="w-2.5 h-2.5" />
                            <span>{pkg.archiveBoxNumber || 'TERARSIP'}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold text-xs text-stone-900">
                        {pkg.name}
                      </h4>

                      <div className="text-[11px] text-stone-500 flex items-center gap-2 flex-wrap">
                        <span>Penyedia: <strong className="text-stone-700">{pkg.vendorName}</strong></span>
                        <span>·</span>
                        <span className="font-mono">{formatRupiah(pkg.hpsValue)}</span>
                        <span>·</span>
                        <span>{pkgDocs.length} Dokumen Digital</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button
                        onClick={() => setSelectedPackageForKendali(pkg)}
                        className="px-2.5 py-1 text-xs font-medium border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-stone-500" />
                        <span>Lembar Kendali</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Input Nomor Box Arsip */}
      {targetPkgToArchive && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-lg border border-stone-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900">Arsipkan Paket PBJ</h3>
              <button
                onClick={() => setTargetPkgToArchive(null)}
                className="text-stone-400 hover:text-stone-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmArchive} className="space-y-3">
              <div>
                <span className="text-[10px] font-mono text-stone-400">Paket:</span>
                <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{targetPkgToArchive.name}</h4>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nomor Box Arsip <span className="text-[#701524]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={boxNumber}
                  onChange={(e) => setBoxNumber(e.target.value)}
                  placeholder="BOX-2026-BARANG-01"
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Verifikator Audit
                </label>
                <input
                  type="text"
                  value={verifierName}
                  onChange={(e) => setVerifierName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#701524]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetPkgToArchive(null)}
                  className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-medium text-stone-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#701524] hover:bg-[#58101c] text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Simpan Arsip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Printable: Lembar Kendali Reviu */}
      {selectedPackageForKendali && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[88vh] shadow-xl border border-stone-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-xs text-stone-900">
                Lembar Kendali Pengadaan Langsung
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintKendali}
                  className="px-2.5 py-1 bg-white border border-stone-300 rounded text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5 text-stone-500" />
                  <span>Cetak</span>
                </button>
                <button
                  onClick={() => setSelectedPackageForKendali(null)}
                  className="text-stone-400 hover:text-stone-600 font-bold text-xs px-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="text-center pb-2 border-b border-stone-200">
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  LEMBAR KENDALI DOKUMEN PENGADAAN LANGSUNG
                </h2>
                <p className="text-[11px] text-stone-500">Perpres No. 12 Tahun 2021</p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-xs">
                <div>
                  <span className="text-stone-400 block text-[10px]">Paket:</span>
                  <span className="font-bold text-stone-900">{selectedPackageForKendali.name}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">RUP:</span>
                  <span className="font-mono text-stone-800">{selectedPackageForKendali.codeRUP}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">HPS:</span>
                  <span className="font-mono font-bold text-stone-900">{formatRupiah(selectedPackageForKendali.hpsValue)}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Penyedia:</span>
                  <span className="font-semibold text-stone-900">{selectedPackageForKendali.vendorName}</span>
                </div>
              </div>

              <table className="w-full border-collapse border border-stone-200 text-left text-xs">
                <thead>
                  <tr className="bg-stone-100 text-[10px] font-semibold text-stone-700">
                    <th className="border border-stone-200 p-1.5 w-8 text-center">No</th>
                    <th className="border border-stone-200 p-1.5">Item Berkas</th>
                    <th className="border border-stone-200 p-1.5 w-24 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {[
                    'Dokumen KAK & Spesifikasi Teknis',
                    'Dokumen HPS & Kertas Kerja Pasar',
                    'Bukti Ketersediaan Anggaran DPA',
                    'Surat Permintaan Penawaran',
                    'Surat Penawaran Teknis & Harga Rekanan',
                    'Dokumen Kualifikasi Rekanan (NIB, KSWP)',
                    'Berita Acara Evaluasi Penawaran',
                    'Berita Acara Klarifikasi & Negosiasi',
                    'Berita Acara Hasil Pengadaan Langsung (BAHPL)',
                    'Surat Perintah Kerja (SPK)',
                  ].map((title, idx) => (
                    <tr key={idx}>
                      <td className="border border-stone-200 p-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-stone-200 p-1.5 font-medium text-stone-800">{title}</td>
                      <td className="border border-stone-200 p-1.5 text-center text-stone-700 font-semibold text-[11px]">
                        ✓ Lengkap
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-2 pt-4 text-center text-xs">
                <div>
                  <p className="text-stone-500 text-[11px]">Pejabat Pembuat Komitmen (PPK)</p>
                  <div className="h-10" />
                  <p className="font-bold underline text-stone-900">{selectedPackageForKendali.ppkName.split('(')[0]}</p>
                </div>
                <div>
                  <p className="text-stone-500 text-[11px]">Pejabat Pengadaan (PP)</p>
                  <div className="h-10" />
                  <p className="font-bold underline text-stone-900">{selectedPackageForKendali.ppName.split('(')[0]}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
