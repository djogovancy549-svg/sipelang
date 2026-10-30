/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ProcurementPackage, DocumentItem } from '../types/procurement';
import {
  Printer,
  Edit3,
  Eye,
  Image as ImageIcon,
  Camera,
  LayoutGrid,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';

interface ActivityDocumentationViewProps {
  procurementPackage: ProcurementPackage;
  documents: DocumentItem[];
  onShowToast?: (message: string, type: 'success' | 'error') => void;
}

export const ActivityDocumentationView: React.FC<ActivityDocumentationViewProps> = ({
  procurementPackage,
  documents,
}) => {
  const [viewMode, setViewMode] = useState<'SPLIT_VIEW' | 'FULL_PREVIEW'>('SPLIT_VIEW');
  
  const [kegiatan, setKegiatan] = useState('Klarifikasi teknis dan Negosiasi');
  const [pekerjaan, setPekerjaan] = useState(procurementPackage.name);
  const [tanggal, setTanggal] = useState('08 Oktober 2026');

  // Filter only photo category documents
  const photos = documents.filter(d => d.category === 'DOKUMENTASI_FOTO' || d.fileType === 'jpg' || d.fileType === 'png');
  
  const [selectedPhotoIds, setSelectedSelectedPhotoIds] = useState<string[]>([]);

  useEffect(() => {
    // Select first two photos by default if any
    if (photos.length > 0 && selectedPhotoIds.length === 0) {
      setSelectedSelectedPhotoIds(photos.slice(0, 4).map(p => p.id));
    }
  }, [photos]);

  const [customLogo, setCustomLogo] = useState<string | null>(() => localStorage.getItem('sipelang_official_logo'));

  const togglePhotoSelection = (id: string) => {
    if (selectedPhotoIds.includes(id)) {
      setSelectedSelectedPhotoIds(selectedPhotoIds.filter(pid => pid !== id));
    } else {
      setSelectedSelectedPhotoIds([...selectedPhotoIds, id]);
    }
  };

  const selectedPhotos = photos.filter(p => selectedPhotoIds.includes(p.id));

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl">
            <Camera className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Dokumentasi Foto Kegiatan</h2>
            <p className="text-[10px] text-stone-400">Penyusunan lampiran foto resmi kegiatan</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button
            onClick={() => setViewMode(viewMode === 'SPLIT_VIEW' ? 'FULL_PREVIEW' : 'SPLIT_VIEW')}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs font-bold rounded-lg border border-stone-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            {viewMode === 'SPLIT_VIEW' ? <Eye className="w-4 h-4 text-emerald-400" /> : <Edit3 className="w-4 h-4 text-emerald-400" />}
            <span>{viewMode === 'SPLIT_VIEW' ? 'Format Penuh A4' : 'Mode Edit'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${viewMode === 'SPLIT_VIEW' ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
        {viewMode === 'SPLIT_VIEW' && (
          <div className="lg:col-span-5 space-y-4 print:hidden">
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-stone-500 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                Informasi Dokumen
              </h3>
              <p className="text-[10px] text-stone-400 italic">Pilih foto dari hasil unggahan sebelumnya untuk dilampirkan dalam lembar dokumentasi.</p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Nama Kegiatan</label>
                  <input type="text" value={kegiatan} onChange={e => setKegiatan(e.target.value)} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Pekerjaan</label>
                  <textarea rows={2} value={pekerjaan} onChange={e => setPekerjaan(e.target.value)} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Tanggal</label>
                  <input type="text" value={tanggal} onChange={e => setTanggal(e.target.value)} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl" />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    Pilih Foto dari Unggahan ({photos.length})
                  </h3>
                </div>
                
                {photos.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                    <ImageIcon className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                    <p className="text-xs text-stone-500">Belum ada foto yang diunggah untuk paket ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
                    {photos.map(photo => (
                      <div 
                        key={photo.id} 
                        onClick={() => togglePhotoSelection(photo.id)}
                        className={`relative rounded-xl overflow-hidden aspect-square cursor-pointer border-2 transition-all ${
                          selectedPhotoIds.includes(photo.id) ? 'border-emerald-500 shadow-md ring-2 ring-emerald-100' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={photo.fileUrl || '/placeholder-img.png'} alt={photo.title} className="w-full h-full object-cover" />
                        {selectedPhotoIds.includes(photo.id) && (
                          <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/50 text-[8px] text-white truncate">
                          {photo.title}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={`${viewMode === 'SPLIT_VIEW' ? 'lg:col-span-7' : 'max-w-4xl mx-auto w-full'} overflow-x-auto`}>
          <div className="bg-white border border-stone-300 rounded-2xl shadow-lg p-10 font-sans text-stone-900 leading-normal min-w-[700px] print:shadow-none print:border-none print:p-0 print:m-0">
             <div className="relative pb-3 border-b-[2.5px] border-stone-900 flex items-center justify-center gap-4">
               <div className="w-16 h-20 shrink-0 flex items-center justify-center">
                  {customLogo ? (
                    <img src={customLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="w-full h-full border-2 border-dashed border-stone-200 rounded-xl" />
                  )}
               </div>
               <div className="text-center flex-1 pr-10">
                  <h1 className="text-xs font-bold uppercase tracking-wider text-stone-950">PEMERINTAH KABUPATEN NAGEKEO</h1>
                  <h2 className="text-base font-extrabold uppercase tracking-wide mt-0.5 text-stone-950">{procurementPackage.skpdName}</h2>
                  <p className="text-[10px] text-stone-600 font-medium tracking-tight italic">Kompleks Bendungan Sutami - Mbay</p>
                  <p className="text-xs font-extrabold tracking-[0.25em] mt-1 text-stone-950">M B A Y</p>
               </div>
            </div>

            <div className="mt-8 text-center">
              <h3 className="text-sm font-black underline uppercase tracking-tight">DOKUMENTASI KEGIATAN PEJABAT PENGADAAN</h3>
            </div>

            <div className="mt-6">
               <table className="w-full border-collapse border border-stone-900 text-[11px]">
                 <tbody>
                   <tr>
                     <td className="border border-stone-900 p-2 font-bold w-[80px]">Kegiatan</td>
                     <td className="border border-stone-900 p-2 font-medium">{kegiatan}</td>
                   </tr>
                   <tr>
                     <td className="border border-stone-900 p-2 font-bold">Pekerjaan</td>
                     <td className="border border-stone-900 p-2 font-medium">{pekerjaan}</td>
                   </tr>
                   <tr>
                     <td className="border border-stone-900 p-2 font-bold">Tanggal</td>
                     <td className="border border-stone-900 p-2 font-medium">{tanggal}</td>
                   </tr>
                 </tbody>
               </table>

               <div className="mt-8">
                 <h4 className="text-center font-black uppercase text-sm mb-6 tracking-widest border-b border-stone-200 pb-2">FOTO DOKUMENTASI</h4>
                 
                 {selectedPhotos.length === 0 ? (
                   <div className="py-20 text-center text-stone-300 italic text-[11px]">
                     (Belum ada foto yang dipilih untuk ditampilkan)
                   </div>
                 ) : (
                   <div className="grid grid-cols-2 gap-4">
                     {selectedPhotos.map(photo => (
                       <div key={photo.id} className="border-[3px] border-stone-900 p-1 shadow-sm">
                         <div className="aspect-[4/3] relative overflow-hidden bg-stone-100">
                           <img src={photo.fileUrl || '/placeholder-img.png'} alt={photo.title} className="w-full h-full object-cover" />
                         </div>
                         <div className="mt-1 text-center font-mono text-[9px] uppercase font-bold text-stone-600 border-t border-stone-200 pt-1">
                           {photo.title}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>

            <div className="mt-20 text-[9px] text-stone-400 text-center font-mono uppercase tracking-widest">
               Lampiran Dokumentasi Visual - OPTIMA.DOK Record System
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
