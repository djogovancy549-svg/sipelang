/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ProcurementPackage, DocumentItem, ReviewMatrixItem } from '../types/procurement';
import { formatRupiah, formatDate } from '../utils/formatters';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';

interface ReviewPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentItem: DocumentItem;
  procurementPackage?: ProcurementPackage;
  matrixItems: ReviewMatrixItem[];
  reviewerName?: string;
}

export const ReviewPrintModal: React.FC<ReviewPrintModalProps> = ({
  isOpen,
  onClose,
  documentItem,
  procurementPackage,
  matrixItems,
  reviewerName = 'Florentina Bupu, ST., MT',
}) => {
  if (!isOpen) return null;

  const pkgName = procurementPackage?.name || documentItem.title;
  const skpdName = procurementPackage?.skpdName || 'Dinas Pekerjaan Umum dan Penataan Ruang';
  const paguVal = procurementPackage?.paguValue || 100000000;
  const hpsVal = procurementPackage?.hpsValue || 99945000;
  const codeRUP = procurementPackage?.codeRUP || '66036644';
  const vendorName = procurementPackage?.vendorName || 'CV. Bahtera Mandiri';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Toolbar (Screen only) */}
        <div className="bg-[#701524] text-white px-5 py-3.5 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-rose-300" />
            <h2 className="text-sm sm:text-base font-bold tracking-tight">
              Cetak Berita Acara Reviu Dokumen Persiapan Pengadaan
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-white text-[#701524] hover:bg-rose-50 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Cetak PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-rose-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-10 text-stone-900 text-xs font-serif leading-normal bg-white print:p-0 print:overflow-visible">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* KOP SURAT PEMKAB NAGEKEO */}
            <div className="text-center border-b-2 border-stone-900 pb-3 space-y-1">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-14 bg-stone-100 border border-stone-300 rounded flex items-center justify-center text-[10px] font-sans font-bold text-stone-500">
                  LAMBANG NAGEKEO
                </div>
                <div>
                  <h1 className="text-sm font-bold uppercase tracking-wide">PEMERINTAH KABUPATEN NAGEKEO</h1>
                  <h2 className="text-base font-black uppercase tracking-wider">{skpdName.toUpperCase()}</h2>
                  <p className="text-[10px] font-sans text-stone-600">Kompleks Bendungan Sutami - Mbay, Kode Pos 86472</p>
                  <p className="text-[11px] font-sans font-bold tracking-widest text-stone-800">M B A Y</p>
                </div>
              </div>
            </div>

            {/* TITLE */}
            <div className="text-center space-y-1 pt-1">
              <h3 className="font-bold text-xs underline uppercase tracking-wide">
                BERITA ACARA REVIU DOKUMEN PERSIAPAN PENGADAAN DAN KERTAS KERJA PERSIAPAN PEMILIHAN
              </h3>
              <p className="text-[11px] font-mono">Nomor : 139/PP-PK/PUPR-NGK/IX/2026</p>
            </div>

            {/* PREAMBLE */}
            <p className="text-justify leading-relaxed text-[11px]">
              Pada hari ini <strong>Senin</strong> Tanggal <strong>Dua Puluh Delapan Bulan September Tahun Dua Ribu Dua Puluh Enam</strong>, bertempat di Bagian Pengadaan Barang dan Jasa, kami yang bertandatangan di dalam dokumen Berita Acara ini, telah melakukan Reviu Dokumen Persiapan Pengadaan dan sekaligus menetapkan kertas kerja persiapan pemilihan oleh Pejabat Pengadaan untuk :
            </p>

            {/* DATA PAKET */}
            <div className="p-3 bg-stone-50/50 border border-stone-300 rounded-lg space-y-1.5 text-[11px] font-sans">
              <div className="grid grid-cols-12">
                <span className="col-span-4 font-semibold text-stone-600">Nama Paket Pengadaan</span>
                <span className="col-span-8 font-bold text-stone-900">: {pkgName}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 font-semibold text-stone-600">Satuan Kerja</span>
                <span className="col-span-8">: {skpdName}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 font-semibold text-stone-600">Tahun Anggaran / Kode RUP</span>
                <span className="col-span-8">: 2026 / ID RUP {codeRUP}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 font-semibold text-stone-600">Sumber Dana</span>
                <span className="col-span-8">: DAU / APBD Kabupaten Nagekeo</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 font-semibold text-stone-600">Nilai Pagu Anggaran</span>
                <span className="col-span-8 font-mono font-bold">: {formatRupiah(paguVal)}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 font-semibold text-stone-600">Nilai HPS</span>
                <span className="col-span-8 font-mono font-bold text-emerald-800">: {formatRupiah(hpsVal)}</span>
              </div>
            </div>

            {/* MATRIKS EVALUASI REVIU */}
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-800 font-sans border-b border-stone-300 pb-1">
                BAGIAN KESATU: DOKUMENTASI & KERTAS KERJA REVIU
              </h4>

              <table className="w-full text-left border-collapse border border-stone-400 text-[10px] font-sans">
                <thead>
                  <tr className="bg-stone-100 text-stone-800 font-bold border-b border-stone-400">
                    <th className="p-2 border-r border-stone-400 w-8 text-center">No</th>
                    <th className="p-2 border-r border-stone-400 w-5/12">Uraian / Aspek Pertanyaan Reviu</th>
                    <th className="p-2 border-r border-stone-400 w-2/12 text-center">Status</th>
                    <th className="p-2">Catatan / Pembahasan Reviu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-300">
                  {matrixItems.map((item, idx) => (
                    <tr key={item.id} className="align-top">
                      <td className="p-2 border-r border-stone-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border-r border-stone-300 space-y-0.5">
                        <p className="font-semibold text-stone-900">{item.question}</p>
                        <p className="text-[9px] text-stone-500 italic">{item.regulationReference}</p>
                      </td>
                      <td className="p-2 border-r border-stone-300 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          item.evaluationStatus === 'MEMENUHI'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.evaluationStatus === 'MEMENUHI' ? 'MEMENUHI' : 'CATATAN'}
                        </span>
                      </td>
                      <td className="p-2 italic text-stone-700">{item.evidenceNotes || 'Sudah dicantumkan dan diverifikasi.'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* BAGIAN KEDUA: PENETAPAN METODE */}
            <div className="space-y-2 pt-3 font-sans">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-800 border-b border-stone-300 pb-1">
                BAGIAN KEDUA: PENETAPAN METODE PEMILIHAN & KUALIFIKASI
              </h4>

              <div className="grid grid-cols-2 gap-3 text-[10px] bg-stone-50 p-3 rounded border border-stone-300">
                <div>
                  <p className="font-bold text-stone-700">1. Metode Pemilihan Penyedia:</p>
                  <p className="font-semibold text-stone-900">Pengadaan Langsung (Nilai di bawah Rp 200 Juta)</p>
                </div>
                <div>
                  <p className="font-bold text-stone-700">2. Metode Kualifikasi:</p>
                  <p className="font-semibold text-stone-900">Pascakualifikasi (Sistem Gugur)</p>
                </div>
                <div>
                  <p className="font-bold text-stone-700">3. Metode Evaluasi Penawaran:</p>
                  <p className="font-semibold text-stone-900">Harga Terendah Sistem Gugur</p>
                </div>
                <div>
                  <p className="font-bold text-stone-700">4. Metode Penyampaian Penawaran:</p>
                  <p className="font-semibold text-stone-900">1 File (Melalui SPSE / Offline Direct)</p>
                </div>
              </div>
            </div>

            {/* TANDA TANGAN REVIU */}
            <div className="pt-6 font-sans text-[11px] space-y-4">
              <p className="text-right text-stone-600">Disusun di Mbay, Tanggal 28 September 2026</p>

              <div className="grid grid-cols-3 gap-4 text-center pt-2">
                <div className="space-y-12">
                  <div>
                    <p className="font-bold text-stone-800">Pejabat Pembuat Komitmen</p>
                    <p className="text-[10px] text-stone-500">Dinas PUPR Kab. Nagekeo</p>
                  </div>
                  <div>
                    <p className="font-bold underline text-stone-900">Muthalib Ismail, ST</p>
                    <p className="text-[9px] text-stone-500">NIP. 19820510 200801 1 008</p>
                  </div>
                </div>

                <div className="space-y-12">
                  <div>
                    <p className="font-bold text-stone-800">Pejabat Pengadaan</p>
                    <p className="text-[10px] text-stone-500">Dinas PUPR Kab. Nagekeo</p>
                  </div>
                  <div>
                    <p className="font-bold underline text-stone-900">{reviewerName}</p>
                    <p className="text-[9px] text-stone-500">NIP. 19880810 201903 2 009</p>
                  </div>
                </div>

                <div className="space-y-12">
                  <div>
                    <p className="font-bold text-stone-800">Pengelola Pengadaan</p>
                    <p className="text-[10px] text-stone-500">Barang/Jasa Ahli Pertama</p>
                  </div>
                  <div>
                    <p className="font-bold underline text-stone-900">Theresia Laura Da Costa, S.T</p>
                    <p className="text-[9px] text-stone-500">NIP. 19930412 202012 2 015</p>
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
