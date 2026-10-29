/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  getStoredIntegrationSettings,
  saveIntegrationSettings,
  sendWebhookPayload,
  GoogleIntegrationSettings,
} from '../utils/webhookService';
import {
  X,
  ExternalLink,
  FolderCheck,
  Camera,
  FileSpreadsheet,
  Webhook,
  Save,
  Send,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface GoogleIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export const GoogleIntegrationModal: React.FC<GoogleIntegrationModalProps> = ({
  isOpen,
  onClose,
  onResetData,
  onShowToast,
}) => {
  const [settings, setSettings] = useState<GoogleIntegrationSettings>(getStoredIntegrationSettings());
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getStoredIntegrationSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveIntegrationSettings(settings);
    onShowToast('Pengaturan integrasi Google Sheet & Drive berhasil disimpan.', 'success');
    onClose();
  };

  const handleTestWebhook = async () => {
    if (!settings.webhookUrl.trim()) {
      onShowToast('Mohon isi URL Webhook terlebih dahulu.', 'error');
      return;
    }

    setIsTestingWebhook(true);
    saveIntegrationSettings(settings);

    const res = await sendWebhookPayload('PACKAGE_CREATED', {
      testMessage: 'Uji koneksi Webhook SIPELANG Nagekeo ke Google Sheet & Drive',
      timestamp: new Date().toISOString(),
      driveDocsFolderUrl: settings.driveDocsFolderUrl,
      drivePhotosFolderUrl: settings.drivePhotosFolderUrl,
    });

    setIsTestingWebhook(false);
    onShowToast(res.message, res.success ? 'success' : 'error');
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-[#701524] text-white p-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/20">
              <Webhook className="w-6 h-6 text-rose-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Integrasi Google Sheet, Drive & Webhook
              </h2>
              <p className="text-xs text-rose-100/80 mt-0.5">
                Konfigurasi folder Google Drive, spreadsheet registrasi, dan endpoint Webhook Apps Script.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Quick Direct Links Card */}
          <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200/80 space-y-2.5">
            <h3 className="text-xs font-black text-[#701524] uppercase tracking-wider flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Akses Cepat Folder Google Drive Resmi</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <a
                href={settings.driveDocsFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-white rounded-xl border border-stone-200 hover:border-rose-400 hover:shadow-xs transition-all flex items-center justify-between font-bold text-stone-800 hover:text-[#701524]"
              >
                <div className="flex items-center gap-2 truncate">
                  <FolderCheck className="w-4 h-4 text-rose-700 shrink-0" />
                  <span className="truncate">Folder Drive Arsip Dokumen</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-stone-400" />
              </a>

              <a
                href={settings.drivePhotosFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-white rounded-xl border border-stone-200 hover:border-indigo-400 hover:shadow-xs transition-all flex items-center justify-between font-bold text-stone-800 hover:text-indigo-900"
              >
                <div className="flex items-center gap-2 truncate">
                  <Camera className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span className="truncate">Folder Drive Dokumentasi Foto</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-stone-400" />
              </a>
            </div>
          </div>

          {/* Drive Folder URLs Configuration */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                <FolderCheck className="w-3.5 h-3.5 text-rose-700" />
                <span>URL Folder Drive Arsip Dokumen Pengadaan</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={settings.driveDocsFolderUrl}
                  onChange={(e) => setSettings({ ...settings, driveDocsFolderUrl: e.target.value })}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524] bg-white font-mono text-stone-900"
                />
                <a
                  href={settings.driveDocsFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl flex items-center gap-1 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka</span>
                </a>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-700" />
                <span>URL Folder Drive Dokumentasi Foto Kegiatan</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={settings.drivePhotosFolderUrl}
                  onChange={(e) => setSettings({ ...settings, drivePhotosFolderUrl: e.target.value })}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-900 bg-white font-mono text-stone-900"
                />
                <a
                  href={settings.drivePhotosFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl flex items-center gap-1 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka</span>
                </a>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>URL Link Google Sheet Target Data</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={settings.sheetUrl}
                  onChange={(e) => setSettings({ ...settings, sheetUrl: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white font-mono text-stone-900"
                />
                {settings.sheetUrl && (
                  <a
                    href={settings.sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center gap-1 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Sheet</span>
                  </a>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                <Webhook className="w-3.5 h-3.5 text-[#701524]" />
                <span>URL Webhook Endpoint (Google Apps Script Web App URL)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={settings.webhookUrl}
                  onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524] bg-white font-mono text-stone-900"
                />
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={isTestingWebhook}
                  className="px-3.5 py-2 bg-[#701524] hover:bg-[#58101c] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isTestingWebhook ? 'Mengirim...' : 'Uji Webhook'}</span>
                </button>
              </div>
              <p className="text-[10px] text-stone-500 mt-1">
                Setiap kali paket baru, dokumen, atau foto diunggah, data otomatis dikirim sebagai payload JSON ke URL Webhook ini untuk dimasukkan ke Google Sheet & Drive.
              </p>
            </div>
          </div>

          {/* Clean Data Action */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Apakah Anda yakin ingin menghapus SELURUH data lokal (Paket, Dokumen, & Foto)? Data akan di-reset bersih ke 0.')) {
                  onResetData();
                  onClose();
                }
              }}
              className="px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-700" />
              <span>Hapus Semua Data Lokal (Reset Bersih)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
              >
                Tutup
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-[#701524] hover:bg-[#58101c] text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>SIMPAN KONFIGURASI</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
