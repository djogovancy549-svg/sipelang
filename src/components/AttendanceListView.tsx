/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ProcurementPackage } from '../types/procurement';
import {
  Printer,
  Save,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Image as ImageIcon,
  UserCheck,
  Signature,
  ChevronDown,
  Paperclip,
  X
} from 'lucide-react';
import { sendWebhookPayload } from '../utils/webhookService';

interface AttendanceEntry {
  id: string;
  name: string;
  from: string;
  signature?: string | null;
}

interface AttendanceListViewProps {
  procurementPackage: ProcurementPackage;
  onUpdatePackage: (updatedPkg: ProcurementPackage) => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
}

export const AttendanceListView: React.FC<AttendanceListViewProps> = ({
  procurementPackage,
  onUpdatePackage,
  onShowToast,
}) => {
  const [viewMode, setViewMode] = useState<'SPLIT_VIEW' | 'FULL_PREVIEW'>('SPLIT_VIEW');
  
  const [kegiatan, setKegiatan] = useState('Klarifikasi teknis dan Negosiasi');
  const [pekerjaan, setPekerjaan] = useState(procurementPackage.name);
  const [tanggal, setTanggal] = useState('08 Oktober 2026');
  const [pukul, setPukul] = useState('11.30-12.00');

  const [entries, setEntries] = useState<AttendanceEntry[]>([
    { id: '1', name: 'ANTONIUS WANGGA POLE', from: 'CV. Bahtera Mandiri', signature: null },
    { id: '2', name: 'FLORENTINA BUPU', from: 'Pj. Pengadaan', signature: null },
    { id: '3', name: '', from: '', signature: null },
    { id: '4', name: '', from: '', signature: null },
    { id: '5', name: '', from: '', signature: null },
  ]);

  const [customLogo, setCustomLogo] = useState<string | null>(() => localStorage.getItem('sipelang_official_logo'));

  const handleAddEntry = () => {
    setEntries([...entries, { id: Date.now().toString(), name: '', from: '', signature: null }]);
  };

  const handleRemoveEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const handleSave = async () => {
    const payload = {
      action: 'SAVE_ATTENDANCE',
      packageId: procurementPackage.id,
      kegiatan,
      date: tanggal,
      attendees: entries.filter(e => e.name).map(e => `${e.name} (${e.from})`).join(', ')
    };
    await sendWebhookPayload('ATTENDANCE_SAVED', payload);
    if (onShowToast) onShowToast('Daftar hadir berhasil disimpan.', 'success');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <UserCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Daftar Hadir Kegiatan</h2>
            <p className="text-[10px] text-stone-400">Pencatatan kehadiran rapat/negosiasi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button
            onClick={() => setViewMode(viewMode === 'SPLIT_VIEW' ? 'FULL_PREVIEW' : 'SPLIT_VIEW')}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs font-bold rounded-lg border border-stone-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            {viewMode === 'SPLIT_VIEW' ? <Eye className="w-4 h-4 text-blue-400" /> : <Edit3 className="w-4 h-4 text-blue-400" />}
            <span>{viewMode === 'SPLIT_VIEW' ? 'Format Penuh A4' : 'Mode Edit'}</span>
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer"
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
                <Edit3 className="w-4 h-4 text-blue-600" />
                Informasi Kegiatan
              </h3>
              <p className="text-[10px] text-stone-400 italic">Lengkapi informasi kegiatan dan daftar hadir untuk dicantumkan dalam dokumen resmi.</p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Nama Kegiatan</label>
                  <input type="text" value={kegiatan} onChange={e => setKegiatan(e.target.value)} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Pekerjaan</label>
                  <textarea rows={2} value={pekerjaan} onChange={e => setPekerjaan(e.target.value)} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase">Tanggal</label>
                    <input type="text" value={tanggal} onChange={e => setTanggal(e.target.value)} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase">Pukul (WIB/WITA)</label>
                    <input type="text" value={pukul} onChange={e => setPukul(e.target.value)} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black uppercase text-blue-800">Daftar Peserta</h3>
                  <button onClick={handleAddEntry} className="p-1 bg-stone-100 hover:bg-stone-200 text-blue-600 rounded-lg">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {entries.map((item, idx) => (
                    <div key={item.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 relative group flex gap-2">
                      <div className="flex-1 space-y-2">
                        <input 
                          type="text" 
                          value={item.name} 
                          onChange={e => {
                            const newEntries = [...entries];
                            newEntries[idx].name = e.target.value;
                            setEntries(newEntries);
                          }} 
                          placeholder="Nama Lengkap" 
                          className="w-full bg-transparent font-bold text-xs focus:outline-none" 
                        />
                        <input 
                          type="text" 
                          value={item.from} 
                          onChange={e => {
                            const newEntries = [...entries];
                            newEntries[idx].from = e.target.value;
                            setEntries(newEntries);
                          }} 
                          placeholder="Asal Instansi/Perusahaan" 
                          className="w-full bg-transparent text-[11px] text-stone-500 focus:outline-none" 
                        />
                      </div>
                      <button onClick={() => handleRemoveEntry(item.id)} className="shrink-0 p-1 text-stone-300 hover:text-rose-600 opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
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

            <div className="mt-6 text-center">
              <h3 className="text-sm font-black underline uppercase tracking-tight">DAFTAR HADIR KEGIATAN PEJABAT PENGADAAN</h3>
            </div>

            <div className="mt-6">
               <table className="w-full border-collapse border border-stone-900 text-[11px]">
                 <tbody>
                   <tr>
                     <td className="border border-stone-900 p-1.5 font-bold w-[80px]">Kegiatan</td>
                     <td className="border border-stone-900 p-1.5">{kegiatan}</td>
                   </tr>
                   <tr>
                     <td className="border border-stone-900 p-1.5 font-bold">Pekerjaan</td>
                     <td className="border border-stone-900 p-1.5">{pekerjaan}</td>
                   </tr>
                   <tr>
                     <td className="border border-stone-900 p-1.5 font-bold">Tanggal</td>
                     <td className="border border-stone-900 p-1.5">{tanggal}</td>
                   </tr>
                   <tr>
                     <td className="border border-stone-900 p-1.5 font-bold">Pukul</td>
                     <td className="border border-stone-900 p-1.5">{pukul}</td>
                   </tr>
                 </tbody>
               </table>

               <table className="w-full border-collapse border border-stone-900 mt-6 text-[11px]">
                 <thead className="bg-stone-100">
                   <tr className="font-black text-center">
                     <th className="border border-stone-900 p-2 w-10">NO</th>
                     <th className="border border-stone-900 p-2">NAMA</th>
                     <th className="border border-stone-900 p-2">DARI</th>
                     <th className="border border-stone-900 p-2 w-48">TANDA TANGAN</th>
                   </tr>
                 </thead>
                 <tbody>
                   {entries.map((e, i) => (
                     <tr key={e.id} className="h-16">
                       <td className="border border-stone-900 p-2 text-center font-bold">{i + 1}</td>
                       <td className="border border-stone-900 p-2 font-bold uppercase">{e.name}</td>
                       <td className="border border-stone-900 p-2">{e.from}</td>
                       <td className="border border-stone-900 p-2 relative h-16 text-center align-middle">
                          <span className="absolute top-1 left-1 text-[8px] text-stone-300 font-mono italic">{i + 1}</span>
                          {e.signature ? (
                            <div className="relative group/sig inline-flex items-center justify-center h-12 mx-auto">
                              <img src={e.signature} alt="Tanda Tangan" className="max-h-12 max-w-[120px] object-contain" />
                              <button 
                                onClick={() => {
                                  const newEntries = [...entries];
                                  newEntries[i].signature = null;
                                  setEntries(newEntries);
                                }}
                                title="Hapus Tanda Tangan"
                                className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover/sig:opacity-100 transition-opacity shadow cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 border border-dashed border-stone-400 rounded-lg text-[10px] font-bold text-stone-700 transition-all shadow-2xs">
                              <Paperclip className="w-3 h-3 text-blue-600" />
                              <span>Tempel Tanda Tangan</span>
                              <input 
                                type="file" 
                                accept="image/png, image/jpeg, image/jpg" 
                                className="hidden" 
                                onChange={(evt) => {
                                  const file = evt.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (uploadEvent) => {
                                      const res = uploadEvent.target?.result as string;
                                      const newEntries = [...entries];
                                      newEntries[i].signature = res;
                                      setEntries(newEntries);
                                      if (onShowToast) onShowToast(`Tanda tangan untuk ${e.name || `Baris ${i+1}`} berhasil ditempel.`, 'success');
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>

            <div className="mt-12 text-[10px] italic text-stone-400 text-center">
               Dokumen ini dihasilkan secara otomatis oleh Sistem OPTIMA.DOK - Pemkab Nagekeo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
