/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ProcurementPackage, DocumentChecklistItem } from '../types/procurement';
import { formatRupiah, formatDate } from '../utils/formatters';
import { sendWebhookPayload } from '../utils/webhookService';
import { SecurityPinModal } from './SecurityPinModal';
import {
  Calendar,
  Printer,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  Building2,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Edit3,
  Eye,
  Upload,
  Image as ImageIcon,
  Paperclip,
  Check,
  RotateCcw,
  Sparkles,
  Lock,
  KeyRound,
  AlertTriangle,
  X,
  ChevronDown,
  UserCheck,
  Signature,
  Sliders,
  Table as TableIcon
} from 'lucide-react';

interface NegotiationItem {
  id: string;
  description: string;
  vol: number;
  sat: string;
  hpsUnit: number;
  bidUnit: number;
  negUnit: number;
}

interface ClarificationItem {
  id: string;
  question: string;
  answer: string;
}

interface ProcurementNegotiationViewProps {
  procurementPackage: ProcurementPackage;
  onUpdatePackage: (updatedPkg: ProcurementPackage) => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
}

export const ProcurementNegotiationView: React.FC<ProcurementNegotiationViewProps> = ({
  procurementPackage,
  onUpdatePackage,
  onShowToast,
}) => {
  const [viewMode, setViewMode] = useState<'SPLIT_VIEW' | 'FULL_PREVIEW'>('SPLIT_VIEW');
  const [logoDropdownOpen, setLogoDropdownOpen] = useState(false);
  const [sigDropdownOpen, setSigDropdownOpen] = useState(false);
  
  // Form State
  const [nomorBA, setNomorBA] = useState(`170/PP-PK/PUPR-NGK/X/${new Date().getFullYear()}`);
  const [hariTanggal, setHariTanggal] = useState('Kamis, 08 Oktober 2026');
  const [tempat, setTempat] = useState('Bagian Pengadaan Barang dan Jasa');
  
  // Pihak Pertama (PP)
  const [ppNama, setPpNama] = useState('Florentina Bupu, ST.,MT');
  const [ppNip, setPpNip] = useState('19880810 201903 2 009');
  const [ppJabatan, setPpJabatan] = useState('Pejabat Pengadaan pada Dinas Pekerjaan Umum dan Penataan Ruang');
  const [ppAlamat, setPpAlamat] = useState(procurementPackage.ppAddress || 'Kompleks Civic Center');

  // Pihak Kedua (Penyedia)
  const [vendorNama, setVendorNama] = useState('ANTONIUS WANGGA POLE');
  const [vendorJabatan, setVendorJabatan] = useState(`Direktur CV. Bahtera Mandiri`);
  const [vendorAlamat, setVendorAlamat] = useState('Kelurahan Danga Kec. Aesesa Kab. Nagekeo');

  const [clarifications, setClarifications] = useState<ClarificationItem[]>([
    { id: '1', question: 'Tidak ada hal yang diklarifikasi', answer: '-' }
  ]);

  const [negItems, setNegItems] = useState<NegotiationItem[]>([
    { id: '1', description: 'Pekerjaan Mobilisasi dan Demobilisasi', vol: 1, sat: 'Ls', hpsUnit: 1500000, bidUnit: 1500000, negUnit: 1500000 },
    { id: '2', description: 'Papan Nama Proyek', vol: 1, sat: 'Bh', hpsUnit: 450000, bidUnit: 400000, negUnit: 399482 },
  ]);

  // Logo & Sig
  const [customLogo, setCustomLogo] = useState<string | null>(() => localStorage.getItem('sipelang_official_logo'));
  const [signatureMode, setSignatureMode] = useState<'TEMPLATE_OVAL' | 'UPLOADED' | 'DIGITAL_BLUE' | 'EMPTY'>('TEMPLATE_OVAL');
  const [customSignature, setCustomSignature] = useState<string | null>(() => localStorage.getItem('sipelang_official_signature'));
  
  // Table & PIN State
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinAction, setPinAction] = useState<{ type: 'edit' | 'delete', id: string } | null>(null);
  const [pinError, setPinError] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

  const getDailyPin = () => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    return `${d}${m}${y}-pbj`;
  };

  const handleVerifyPin = () => {
    const correctPin = getDailyPin();
    if (pinInput === correctPin) {
      if (pinAction?.type === 'edit') {
        setEditingRowId(pinAction.id);
      } else if (pinAction?.type === 'delete') {
        setNegItems(negItems.filter(n => n.id !== pinAction.id));
      }
      setPinModalOpen(false);
      setPinInput('');
      setPinAction(null);
      setPinError(false);
    } else {
      setPinError(true);
      if (onShowToast) onShowToast('PIN Salah! Silakan periksa kembali.', 'error');
    }
  };

  const requestPinAction = (type: 'edit' | 'delete', id: string) => {
    setPinAction({ type, id });
    setPinModalOpen(true);
    setPinInput('');
    setPinError(false);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setLogoDropdownOpen(false);
      setSigDropdownOpen(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleAddClarification = () => {
    setClarifications([...clarifications, { id: Date.now().toString(), question: '', answer: '' }]);
  };

  const handleRemoveClarification = (id: string) => {
    setClarifications(clarifications.filter(c => c.id !== id));
  };

  const handleAddNegItem = () => {
    setNegItems([...negItems, { id: Date.now().toString(), description: '', vol: 1, sat: '', hpsUnit: 0, bidUnit: 0, negUnit: 0 }]);
  };

  const handleRemoveNegItem = (id: string) => {
    setNegItems(negItems.filter(n => n.id !== id));
  };

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'neg' | 'clarification'; id: string; name: string } | null>(null);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'neg') {
      setNegItems(negItems.filter(n => n.id !== deleteTarget.id));
      if (onShowToast) onShowToast('Item pekerjaan negosiasi berhasil dihapus.', 'success');
    } else {
      setClarifications(clarifications.filter(c => c.id !== deleteTarget.id));
      if (onShowToast) onShowToast('Butir klarifikasi berhasil dihapus.', 'success');
    }
    setDeleteTarget(null);
  };

  const calculateTotal = (items: NegotiationItem[], key: 'hpsUnit' | 'bidUnit' | 'negUnit') => {
    return items.reduce((sum, item) => sum + (item[key] * item.vol), 0);
  };

  const handleSave = async () => {
    const totalNeg = calculateTotal(negItems, 'negUnit');

    // Update package stage
    const updatedPkg = {
      ...procurementPackage,
      negotiationValue: totalNeg,
      stages: {
        ...procurementPackage.stages,
        KLARIFIKASI_NEGOSIASI: {
          ...procurementPackage.stages.KLARIFIKASI_NEGOSIASI,
          status: 'completed' as const,
          completedDate: new Date().toISOString().slice(0, 10),
          notes: `Negosiasi selesai dengan nilai kesepakatan ${formatRupiah(totalNeg)} (Exc. PPN)`
        }
      }
    };
    onUpdatePackage(updatedPkg);

    // Sync to sheet
    const payload = {
      action: 'SAVE_NEGOTIATION',
      packageId: procurementPackage.id,
      documentNumber: nomorBA,
      negotiationValue: totalNeg,
      details: negItems.map(n => `${n.description}: ${formatRupiah(n.negUnit)}`).join('\n')
    };
    
    await sendWebhookPayload('NEGOSIASI_SAVED', payload);
    if (onShowToast) onShowToast('Berita Acara Negosiasi berhasil disimpan dan disinkronkan.', 'success');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* TOOLBAR */}
      <div className="bg-stone-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-xl">
            <Sliders className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Klarifikasi & Negosiasi Harga</h2>
            <p className="text-[10px] text-stone-400">Penyusunan Berita Acara Hasil Negosiasi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button
            onClick={() => setViewMode(viewMode === 'SPLIT_VIEW' ? 'FULL_PREVIEW' : 'SPLIT_VIEW')}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs font-bold rounded-lg border border-stone-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            {viewMode === 'SPLIT_VIEW' ? <Eye className="w-4 h-4 text-amber-400" /> : <Edit3 className="w-4 h-4 text-amber-400" />}
            <span>{viewMode === 'SPLIT_VIEW' ? 'Format Penuh A4' : 'Mode Edit'}</span>
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Simpan & Sync</span>
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
        {/* LEFT: EDITING FORM */}
        {viewMode === 'SPLIT_VIEW' && (
          <div className="lg:col-span-5 space-y-4 print:hidden">
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-stone-500 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#701524]" />
                Metadata Berita Acara
              </h3>
              <p className="text-[10px] text-stone-400 italic">Isi kolom di bawah ini untuk memperbarui informasi pada dokumen pratinjau di sebelah kanan.</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Nomor BA</label>
                  <input type="text" value={nomorBA} onChange={e => setNomorBA(e.target.value)} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Hari/Tanggal</label>
                  <input type="text" value={hariTanggal} onChange={e => setHariTanggal(e.target.value)} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase">Tempat Kegiatan</label>
                <input type="text" value={tempat} onChange={e => setTempat(e.target.value)} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none" />
              </div>

              <div className="pt-4 border-t border-stone-100">
                <h3 className="text-[10px] font-black uppercase text-rose-800 mb-3">Pihak Pertama (PP)</h3>
                <div className="space-y-3">
                  <input type="text" value={ppNama} onChange={e => setPpNama(e.target.value)} placeholder="Nama Pejabat" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                  <input type="text" value={ppNip} onChange={e => setPpNip(e.target.value)} placeholder="NIP Pejabat" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                  <input type="text" value={ppJabatan} onChange={e => setPpJabatan(e.target.value)} placeholder="Jabatan Pejabat" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                  <textarea rows={2} value={ppAlamat} onChange={e => setPpAlamat(e.target.value)} placeholder="Alamat Pejabat Pengadaan" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <h3 className="text-[10px] font-black uppercase text-blue-800 mb-3">Pihak Kedua (Penyedia)</h3>
                <div className="space-y-3">
                  <input type="text" value={vendorNama} onChange={e => setVendorNama(e.target.value)} placeholder="Nama Direktur/Wakil" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  <input type="text" value={vendorJabatan} onChange={e => setVendorJabatan(e.target.value)} placeholder="Jabatan (e.g. Direktur CV. ...)" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  <textarea rows={2} value={vendorAlamat} onChange={e => setVendorAlamat(e.target.value)} placeholder="Alamat Lengkap Perusahaan" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black uppercase text-stone-800 flex items-center gap-2">
                    <TableIcon className="w-3.5 h-3.5 text-rose-600" />
                    Input Item Pekerjaan & Harga Negosiasi
                  </h3>
                  <button onClick={handleAddNegItem} className="px-2 py-1 bg-[#701524] text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5 hover:bg-rose-900 transition-colors cursor-pointer">
                    <Plus className="w-3 h-3" />
                    Tambah Item
                  </button>
                </div>
                
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {negItems.map((item, idx) => (
                    <div key={item.id} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-stone-500 font-mono">Item #{idx + 1}</span>
                        <button 
                          type="button"
                          onClick={() => setDeleteTarget({ type: 'neg', id: item.id, name: item.description || `Item #${idx + 1}` })}
                          className="p-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all text-[10px] flex items-center gap-1 cursor-pointer"
                          title="Hapus Item"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>

                      <input 
                        type="text" 
                        value={item.description} 
                        onChange={e => {
                          const newItems = [...negItems];
                          newItems[idx].description = e.target.value;
                          setNegItems(newItems);
                        }} 
                        placeholder="Uraian Pekerjaan" 
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg font-bold text-xs focus:ring-2 focus:ring-[#701524] focus:outline-none" 
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-stone-500 uppercase block mb-0.5">Volume</label>
                          <input 
                            type="number" 
                            value={item.vol} 
                            onChange={e => {
                              const newItems = [...negItems];
                              newItems[idx].vol = Number(e.target.value);
                              setNegItems(newItems);
                            }} 
                            className="w-full px-2 py-1 text-xs border border-stone-300 rounded-lg bg-white" 
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-stone-500 uppercase block mb-0.5">Satuan</label>
                          <input 
                            type="text" 
                            value={item.sat} 
                            onChange={e => {
                              const newItems = [...negItems];
                              newItems[idx].sat = e.target.value;
                              setNegItems(newItems);
                            }} 
                            className="w-full px-2 py-1 text-xs border border-stone-300 rounded-lg bg-white uppercase" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-stone-500 uppercase block mb-0.5">HPS Satuan (Rp)</label>
                          <input 
                            type="number" 
                            value={item.hpsUnit} 
                            onChange={e => {
                              const newItems = [...negItems];
                              newItems[idx].hpsUnit = Number(e.target.value);
                              setNegItems(newItems);
                            }} 
                            className="w-full px-2 py-1 text-xs border border-stone-300 rounded-lg bg-white font-mono" 
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-stone-500 uppercase block mb-0.5">Penawaran (Rp)</label>
                          <input 
                            type="number" 
                            value={item.bidUnit} 
                            onChange={e => {
                              const newItems = [...negItems];
                              newItems[idx].bidUnit = Number(e.target.value);
                              setNegItems(newItems);
                            }} 
                            className="w-full px-2 py-1 text-xs border border-stone-300 rounded-lg bg-white font-mono" 
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-[#701524] uppercase block mb-0.5">Negosiasi (Rp)</label>
                          <input 
                            type="number" 
                            value={item.negUnit} 
                            onChange={e => {
                              const newItems = [...negItems];
                              newItems[idx].negUnit = Number(e.target.value);
                              setNegItems(newItems);
                            }} 
                            className="w-full px-2 py-1 text-xs border border-rose-300 rounded-lg bg-rose-50 font-mono font-bold text-[#701524]" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT: PREVIEW */}
        <div className={`${viewMode === 'SPLIT_VIEW' ? 'lg:col-span-7' : 'max-w-4xl mx-auto w-full'} overflow-x-auto`}>
          <div className="bg-white border border-stone-300 rounded-2xl shadow-lg p-10 font-sans text-stone-900 leading-normal min-w-[700px] print:shadow-none print:border-none print:p-0 print:m-0">
            {/* KOP SURAT */}
            <div className="relative pb-3 border-b-[2.5px] border-stone-900 flex items-center justify-center gap-4">
               <div className="w-20 h-24 shrink-0 flex items-center justify-center">
                  {customLogo ? (
                    <img src={customLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="w-full h-full border-2 border-dashed border-stone-200 rounded-xl flex items-center justify-center text-stone-300">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
               </div>
               <div className="text-center flex-1 pr-10">
                  <h1 className="text-sm font-bold uppercase tracking-wider text-stone-950">PEMERINTAH KABUPATEN NAGEKEO</h1>
                  <h2 className="text-base font-extrabold uppercase tracking-wide mt-0.5 text-stone-950">{procurementPackage.skpdName}</h2>
                  <p className="text-[11px] text-stone-700 font-medium tracking-tight">Kompleks Bendungan Sutami - Mbay</p>
                  <p className="text-xs font-extrabold tracking-[0.25em] mt-1 text-stone-950">M B A Y</p>
               </div>
            </div>

            <div className="mt-6 text-center">
              <h3 className="text-sm font-bold underline uppercase">BERITA ACARA KLARIFIKASI DAN NEGOSIASI</h3>
              <p className="text-xs font-bold mt-1 text-stone-900">Nomor : {nomorBA}</p>
            </div>

            <div className="mt-6 text-[11px] space-y-3 leading-relaxed text-justify">
              <p>
                Pada hari ini <span className="font-bold">{hariTanggal}</span>, bertempat di <span className="font-bold">{tempat}</span>, kami yang bertanda tangan di bawah ini:
              </p>
              
              <div className="grid grid-cols-[80px_10px_1fr] gap-x-1 pl-4">
                <div className="font-bold">1 Nama</div><div>:</div><div className="font-bold">{ppNama}</div>
                <div className="font-bold pl-3 text-stone-600">NIP</div><div>:</div><div>{ppNip}</div>
                <div className="font-bold pl-3 text-stone-600">Jabatan</div><div>:</div><div>{ppJabatan}</div>
                <div className="font-bold pl-3 text-stone-600">Alamat</div><div>:</div><div>{ppAlamat}</div>
                <div className="font-bold col-span-3 pt-1 italic text-stone-800">yang selanjutnya disebut sebagai PIHAK PERTAMA</div>
              </div>

              <div className="grid grid-cols-[80px_10px_1fr] gap-x-1 pl-4">
                <div className="font-bold">2 Nama</div><div>:</div><div className="font-bold">{vendorNama}</div>
                <div className="font-bold pl-3 text-stone-600">Jabatan</div><div>:</div><div>{vendorJabatan}</div>
                <div className="font-bold pl-3 text-stone-600">Alamat</div><div>:</div><div>{vendorAlamat}</div>
                <div className="font-bold col-span-3 pt-1 italic text-stone-800">yang selanjutnya disebut sebagai PIHAK KEDUA</div>
              </div>

              <p>
                Telah melakukan Klarifikasi Teknis dan Negosiasi Harga untuk <span className="font-bold">{procurementPackage.name}</span> dengan hasil sebagai berikut :
              </p>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-[11px] font-black uppercase text-stone-800">I. Klarifikasi</h4>
                <table className="w-full border-collapse border border-stone-900 mt-1 text-[10px]">
                  <thead>
                    <tr className="bg-stone-100">
                      <th className="border border-stone-900 p-1 w-10">No</th>
                      <th className="border border-stone-900 p-1 w-1/2">Pertanyaan Klarifikasi</th>
                      <th className="border border-stone-900 p-1">Jawaban Klarifikasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clarifications.map((c, i) => (
                      <tr key={c.id}>
                        <td className="border border-stone-900 p-1 text-center font-bold">{i + 1}</td>
                        <td className="border border-stone-900 p-1">{c.question}</td>
                        <td className="border border-stone-900 p-1">{c.answer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="text-[11px] font-black uppercase text-stone-800">II. Negosiasi Harga</h4>
                <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-stone-900 mt-1 text-[9px]">
                  <thead className="bg-stone-100">
                    <tr>
                      <th rowSpan={2} className="border border-stone-900 p-1 w-6">NO</th>
                      <th rowSpan={2} className="border border-stone-900 p-1">URAIAN PEKERJAAN</th>
                      <th rowSpan={2} className="border border-stone-900 p-1 w-8">VOL.</th>
                      <th rowSpan={2} className="border border-stone-900 p-1 w-8">SAT.</th>
                      <th colSpan={3} className="border border-stone-900 p-1">H P S</th>
                      <th colSpan={3} className="border border-stone-900 p-1">PENAWARAN</th>
                      <th rowSpan={2} className="border border-stone-900 p-1 w-8">HPS (%)</th>
                      <th colSpan={3} className="border border-stone-900 p-1 bg-amber-50/50 text-[#701524]">NEGOSIASI</th>
                      <th rowSpan={2} className="border border-stone-900 p-1 w-10">SELISIH</th>
                    </tr>
                    <tr>
                      <th className="border border-stone-900 p-1 font-mono text-[8px]">Hrg Satuan</th>
                      <th className="border border-stone-900 p-1 font-mono text-[8px]">Jml Harga</th>
                      <th className="border border-stone-900 p-1 font-mono text-[8px]">Jml + PPN</th>
                      <th className="border border-stone-900 p-1 font-mono text-[8px]">Hrg Satuan</th>
                      <th className="border border-stone-900 p-1 font-mono text-[8px]">Jml Harga</th>
                      <th className="border border-stone-900 p-1 font-mono text-[8px]">Jml + PPN</th>
                      <th className="border border-stone-900 p-1 font-mono text-[8px] bg-amber-50/50 text-[#701524]">Hrg Satuan</th>
                      <th className="border border-stone-900 p-1 font-mono text-[8px] bg-amber-50/50 text-[#701524]">Jml Harga</th>
                      <th className="border border-stone-900 p-1 font-mono text-[8px] bg-amber-50/50 text-[#701524]">Jml + PPN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {negItems.map((n, i) => {
                      const hpsTotal = n.vol * n.hpsUnit;
                      const bidTotal = n.vol * n.bidUnit;
                      const negTotal = n.vol * n.negUnit;
                      const diff = bidTotal - negTotal;
                      return (
                        <tr key={n.id}>
                          <td className="border border-stone-900 p-1 text-center font-bold">{i + 1}</td>
                          <td className="border border-stone-900 p-1 font-bold leading-tight uppercase text-[8.5px]">{n.description}</td>
                          <td className="border border-stone-900 p-1 text-center">{n.vol}</td>
                          <td className="border border-stone-900 p-1 text-center font-bold uppercase">{n.sat}</td>
                          <td className="border border-stone-900 p-1 text-right font-mono">{formatRupiah(n.hpsUnit).replace('Rp ', '')}</td>
                          <td className="border border-stone-900 p-1 text-right font-mono font-bold">{formatRupiah(hpsTotal).replace('Rp ', '')}</td>
                          <td className="border border-stone-900 p-1 text-right font-mono italic opacity-70">{formatRupiah(hpsTotal * 1.11).replace('Rp ', '')}</td>
                          <td className="border border-stone-900 p-1 text-right font-mono">{formatRupiah(n.bidUnit).replace('Rp ', '')}</td>
                          <td className="border border-stone-900 p-1 text-right font-mono font-bold">{formatRupiah(bidTotal).replace('Rp ', '')}</td>
                          <td className="border border-stone-900 p-1 text-right font-mono italic opacity-70">{formatRupiah(bidTotal * 1.11).replace('Rp ', '')}</td>
                          <td className="border border-stone-900 p-1 text-center font-bold">{Math.round((negTotal/hpsTotal)*100)}%</td>
                          <td className="border border-stone-900 p-1 text-right font-mono font-bold text-[#701524] bg-amber-50/20">{formatRupiah(n.negUnit).replace('Rp ', '')}</td>
                          <td className="border border-stone-900 p-1 text-right font-mono font-black text-[#701524] bg-amber-50/20">{formatRupiah(negTotal).replace('Rp ', '')}</td>
                          <td className="border border-stone-900 p-1 text-right font-mono italic text-[#701524] bg-amber-50/20">{formatRupiah(negTotal * 1.11).replace('Rp ', '')}</td>
                          <td className="border border-stone-900 p-1 text-right font-mono font-bold text-rose-600">{formatRupiah(diff).replace('Rp ', '')}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-stone-50 font-black">
                      <td colSpan={4} className="border border-stone-900 p-1 text-center text-[10px] uppercase">Total Kesepakatan Harga (Tanpa PPN)</td>
                      <td colSpan={10} className="border border-stone-900 p-1 text-right text-base text-[#701524] font-mono tracking-tighter">
                        {formatRupiah(calculateTotal(negItems, 'negUnit'))}
                      </td>
                      <td className="border border-stone-900 p-1 text-right text-rose-600 font-mono text-[10px]">
                        {formatRupiah(calculateTotal(negItems, 'bidUnit') - calculateTotal(negItems, 'negUnit')).replace('Rp ', '')}
                      </td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-10 text-center text-[11px]">
              <div className="space-y-16">
                <div>
                  <p className="font-bold uppercase tracking-tight">PIHAK PERTAMA</p>
                  <p className="font-medium text-stone-600 mt-1">{ppJabatan}</p>
                </div>
                <div className="relative flex flex-col items-center">
                  {/* Template Signature Rendering here */}
                  <div className="w-32 h-16 border border-dashed border-stone-300 rounded-full flex items-center justify-center opacity-30 scale-125">
                    <span className="text-[7px] font-mono text-stone-400">OPTIMA TEMPLATE SIGN</span>
                  </div>
                  <div className="mt-4">
                    <p className="font-bold underline uppercase text-stone-950">{ppNama}</p>
                    <p className="font-mono text-[10px] mt-0.5">NIP. {ppNip}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-16">
                <div>
                  <p className="font-bold uppercase tracking-tight">PIHAK KEDUA</p>
                  <p className="font-medium text-stone-600 mt-1 uppercase">{procurementPackage.vendorName}</p>
                </div>
                <div className="relative flex flex-col items-center">
                   <div className="w-32 h-16 border border-dashed border-stone-300 rounded-full flex items-center justify-center opacity-30 scale-125">
                    <span className="text-[7px] font-mono text-stone-400">OPTIMA TEMPLATE SIGN</span>
                  </div>
                  <div className="mt-4">
                    <p className="font-bold underline uppercase text-stone-950">{vendorNama}</p>
                    <p className="font-medium text-stone-600 mt-0.5">{vendorJabatan}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
      
      {/* PIN MODAL */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#701524]" />
              </div>
              <h3 className="text-lg font-black text-stone-800 uppercase tracking-tight">Verifikasi Keamanan</h3>
              <p className="text-xs text-stone-500 mt-2">
                Masukkan PIN harian untuk melakukan aksi <span className="font-bold text-rose-600 uppercase">{pinAction?.type === 'edit' ? 'Edit' : 'Hapus'}</span>.
              </p>
              <p className="text-[10px] text-stone-400 mt-1 italic">Format: DDMMYY-pbj (Contoh: 301026-pbj)</p>
              
              <div className="mt-6 space-y-4">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input 
                    type="password"
                    value={pinInput}
                    onChange={e => {
                      setPinInput(e.target.value);
                      setPinError(false);
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleVerifyPin()}
                    autoFocus
                    placeholder="Masukkan PIN"
                    className={`w-full pl-10 pr-4 py-3 bg-stone-50 border ${pinError ? 'border-rose-500 ring-2 ring-rose-200' : 'border-stone-200'} rounded-xl text-center font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all`}
                  />
                </div>
                
                {pinError && (
                  <div className="p-2 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 animate-bounce">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>PIN yang Anda masukkan salah!</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex border-t border-stone-100">
              <button 
                onClick={() => {
                  setPinModalOpen(false);
                  setPinInput('');
                  setPinAction(null);
                  setPinError(false);
                }}
                className="flex-1 px-4 py-4 text-xs font-bold text-stone-400 hover:bg-stone-50 transition-colors uppercase"
              >
                Batal
              </button>
              <button 
                onClick={handleVerifyPin}
                className="flex-1 px-4 py-4 text-xs font-black text-white bg-[#701524] hover:bg-rose-900 transition-colors uppercase"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Security PIN Confirmation Modal */}
      <SecurityPinModal
        isOpen={!!deleteTarget}
        title="Konfirmasi Penghapusan dengan PIN"
        itemName={deleteTarget?.name}
        itemTypeLabel={deleteTarget?.type === 'neg' ? 'Item Pekerjaan Negosiasi' : 'Butir Klarifikasi'}
        warningNote="Data yang dihapus dari tabel negosiasi tidak dapat dikembalikan."
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
