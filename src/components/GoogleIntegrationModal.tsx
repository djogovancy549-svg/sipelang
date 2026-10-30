/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  getStoredIntegrationSettings,
  saveIntegrationSettings,
  sendWebhookPayload,
  fetchFilesFromDrive,
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
  RefreshCw,
  Copy,
  Check,
  Code2,
  FileCode,
  Globe,
} from 'lucide-react';
import { SecurityPinModal } from './SecurityPinModal';

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
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'CODE_GS' | 'INDEX_HTML'>('SETTINGS');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [isTestingSync, setIsTestingSync] = useState(false);
  const [copiedCodeGs, setCopiedCodeGs] = useState(false);
  const [copiedIndexHtml, setCopiedIndexHtml] = useState(false);
  const [isResetPinModalOpen, setIsResetPinModalOpen] = useState(false);

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
      testMessage: 'Uji koneksi Webhook Dokumen.KU Nagekeo ke Google Sheet & Drive',
      timestamp: new Date().toISOString(),
      driveDocsFolderUrl: settings.driveDocsFolderUrl,
      drivePhotosFolderUrl: settings.drivePhotosFolderUrl,
    });

    setIsTestingWebhook(false);
    onShowToast(res.message, res.success ? 'success' : 'error');
  };

  const handleTestSync = async () => {
    if (!settings.webhookUrl.trim()) {
      onShowToast('Mohon isi URL Webhook Apps Script terlebih dahulu.', 'error');
      return;
    }

    setIsTestingSync(true);
    saveIntegrationSettings(settings);

    const res = await fetchFilesFromDrive(settings.webhookUrl);
    setIsTestingSync(false);

    if (res.success && res.files) {
      onShowToast(`Koneksi Sukses! Ditemukan ${res.files.length} file di Google Drive.`, 'success');
    } else {
      onShowToast(res.message, 'error');
    }
  };

  const codeGsContent = `// =========================================================================
// DOKUMEN.KU NAGEKEO - GOOGLE APPS SCRIPT BACKEND (DRIVE & SPREADSHEET SYNC)
// =========================================================================

const FOLDER_DOC_ID = '1FI_KsR6FAUuDIYs3ule8eBbnz4oUH-gh';
const FOLDER_PHOTO_ID = '1oXZ8J4QG9j38x0ZkzqSQMlYH5WDuIejK';
const TIMEZONE = 'Asia/Makassar';

// Masukkan URL Google Spreadsheet target Anda di sini:
var SPREADSHEET_URL = "${settings.sheetUrl || ''}"; 

 * 1. Menangani Permintaan GET (Browser Web App & DOKUMEN.KU API)
 */
function doGet(e) {
  // Jika DOKUMEN.KU meminta seluruh data yang tersimpan di Google Sheet (?action=getAllData atau ?action=getEvaluations)
  if (e && e.parameter && (e.parameter.action === 'getAllData' || e.parameter.action === 'getEvaluations')) {
    var allData = getAllSpreadsheetData();
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: allData }))
           .setMimeType(ContentService.MimeType.JSON);
  }

  // Jika DOKUMEN.KU meminta sinkronisasi file (?action=getFiles atau ?action=sync)
  if (e && e.parameter && (e.parameter.action === 'getFiles' || e.parameter.action === 'sync')) {
    var files = listFiles();
    return ContentService.createTextOutput(JSON.stringify({ success: true, files: files }))
           .setMimeType(ContentService.MimeType.JSON);
  }

  // Jika DOKUMEN.KU meminta hapus file (?action=deleteFile&fileId=...)
  if (e && e.parameter && e.parameter.action === 'deleteFile' && e.parameter.fileId) {
    var deleteRes = deleteFile(e.parameter.fileId);
    return ContentService.createTextOutput(JSON.stringify(deleteRes))
           .setMimeType(ContentService.MimeType.JSON);
  }

  // Tampilkan antarmuka Web App Upload Dokumen & Foto
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('Dokumen.KU File Manager - Nagekeo')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * 2. Fungsi Unggah File (Digunakan oleh Web App & Otomatis Catat ke Sheet)
 */
function processForm(data) {
  var folderId = data.folderType === 'dokumen' ? FOLDER_DOC_ID : FOLDER_PHOTO_ID;
  var folder = DriveApp.getFolderById(folderId);
  var file = folder.createFile(data.file);

  // Akses siapa saja yang memiliki link dapat melihat & mengunduh
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}

  var fileUrl = file.getUrl();
  var fileId = file.getId();
  var fileName = file.getName();
  var fileSize = file.getSize();
  var created = file.getDateCreated();
  var timeStr = Utilities.formatDate(created, TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

  // CATAT KE GOOGLE SPREADSHEET AGAR DOKUMEN.KU MEMBACA DATA TERSEBUT
  try {
    if (SPREADSHEET_URL && SPREADSHEET_URL.trim() !== "") {
      var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
      var sheet = getOrCreateSheet(ss, "ArsipDokumen", ["Timestamp", "Judul", "Kategori", "Link File", "File ID", "Ukuran", "Folder"]);
      sheet.appendRow([
        timeStr,
        data.title || fileName,
        data.category || (data.folderType === 'dokumen' ? 'PERSIAPAN' : 'DOKUMENTASI_FOTO'),
        fileUrl,
        fileId,
        fileSize + " bytes",
        data.folderType
      ]);
    }
  } catch (sheetErr) {
    // Log kesalahan tanpa menggagalkan pengunggahan Drive
  }

  return {
    success: true,
    url: fileUrl,
    fileId: fileId,
    name: fileName,
    message: "File berhasil diunggah ke Google Drive dan dicatat ke Google Sheet."
  };
}

/**
 * 3. Ambil Daftar File dari Kedua Folder Drive (Lengkap Thumbnail & Link)
 */
function listFiles() {
  var sources = [
    { id: FOLDER_DOC_ID, key: 'dokumen' },
    { id: FOLDER_PHOTO_ID, key: 'foto' }
  ];
  var fileList = [];

  sources.forEach(function (src) {
    try {
      var folder = DriveApp.getFolderById(src.id);
      var files = folder.getFiles();
      while (files.hasNext()) {
        var f = files.next();
        var id = f.getId();
        var created = f.getDateCreated();
        fileList.push({
          id: id,
          name: f.getName(),
          url: f.getUrl(),
          mimeType: f.getMimeType(),
          size: f.getSize(),
          date: Utilities.formatDate(created, TIMEZONE, 'dd MMM yyyy'),
          ts: created.getTime(),
          folder: src.key,
          thumbnail: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w600',
          downloadUrl: 'https://drive.google.com/uc?export=download&id=' + id
        });
      }
    } catch (err) {}
  });

  // Urutkan file terbaru di paling atas
  fileList.sort(function (a, b) { return b.ts - a.ts; });
  return fileList;
}

/**
 * 4. Fungsi Hapus File (Di Drive & Sheet Sekaligus)
 */
function deleteFile(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    var fileUrl = file.getUrl();
    file.setTrashed(true);

    // Hapus juga baris yang cocok di Google Spreadsheet jika ada
    if (SPREADSHEET_URL && SPREADSHEET_URL.trim() !== "") {
      try {
        var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
        var sheet = ss.getSheetByName("ArsipDokumen");
        if (sheet) {
          var data = sheet.getDataRange().getValues();
          for (var r = data.length - 1; r >= 1; r--) {
            if (data[r][3] === fileUrl || data[r][4] === fileId) {
              sheet.deleteRow(r + 1);
            }
          }
        }
      } catch (err) {}
    }

    return { success: true, message: "File berhasil dihapus dari Drive dan Sheet." };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/**
 * 5. POST Webhook untuk DOKUMEN.KU (Logging Berbagai Event)
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    
    // Upload File via Base64 jika dikirim via POST
    if (payload.action === 'UPLOAD_FILE') {
      var folderId = getFolderIdFromUrl(payload.folderUrl) || FOLDER_DOC_ID;
      var folder = DriveApp.getFolderById(folderId);
      var base64Data = payload.fileData.split(',')[1];
      var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), payload.fileType, payload.fileName);
      var file = folder.createFile(blob);
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shErr) {}
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        fileUrl: file.getUrl(),
        fileId: file.getId()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Tangani aksi Hapus jika dikirim via POST
    if (payload.action === 'DELETE_FILE' && payload.fileId) {
      var delRes = deleteFile(payload.fileId);
      return ContentService.createTextOutput(JSON.stringify(delRes)).setMimeType(ContentService.MimeType.JSON);
    }

    // Tangani Logging Data ke Sheet
    if (!SPREADSHEET_URL || SPREADSHEET_URL.trim() === "") {
      return ContentService.createTextOutput("Success (Tanpa Sheet URL)").setMimeType(ContentService.MimeType.TEXT);
    }

    var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    var sheet;
    var dataRow = [payload.timestamp || new Date().toISOString()];

    switch (payload.eventType) {
      case 'PACKAGE_CREATED':
        sheet = getOrCreateSheet(ss, "Paket", ["Timestamp", "Nama Paket", "Nilai HPS", "SKPD", "Penyedia", "Kode RUP"]);
        dataRow.push(payload.name, payload.hpsValue, payload.skpdName, payload.vendorName, payload.codeRUP);
        break;
      case 'DOCUMENT_UPLOADED':
      case 'PHOTO_UPLOADED':
        sheet = getOrCreateSheet(ss, "ArsipDokumen", ["Timestamp", "Judul", "Kategori", "Link File"]);
        dataRow.push(payload.title, payload.category, payload.fileUrl || "Link_Belum_Ada");
        break;
      case 'STAGE_UPDATED':
        sheet = getOrCreateSheet(ss, "TahapanProses", ["Timestamp", "Nama Paket", "Tahapan", "Progres"]);
        dataRow.push(payload.name, payload.currentStage, payload.overallProgress + "%");
        break;
      case 'PACKAGE_ARCHIVED':
        sheet = getOrCreateSheet(ss, "Pengarsipan", ["Timestamp", "Nama Paket", "No. Kotak", "Verifikator"]);
        dataRow.push(payload.name, payload.archiveBoxNumber, payload.archiveVerifiedBy);
        break;
      case 'OPD_NUMBERING_UPDATED':
        sheet = getOrCreateSheet(ss, "PenomoranOPD", ["Timestamp", "Nama OPD", "Kode OPD", "Counter", "Aksi"]);
        dataRow.push(payload.opdName, payload.opdCode, payload.currentCounter, payload.action);
        break;
      case 'MATRIX_UPDATED':
        sheet = getOrCreateSheet(ss, "MatriksReview", ["Timestamp", "Package ID", "Doc ID", "Pertanyaan", "Status", "Catatan"]);
        dataRow.push(payload.packageId, payload.docId, payload.question, payload.evaluationStatus, payload.evidenceNotes);
        break;
      case 'EVALUATION_SAVED':
        sheet = getOrCreateSheet(ss, "EvaluasiPenawaran", ["Timestamp", "ID Dokumen", "Nomor Formulir", "Nama Paket", "Satuan Kerja", "Pejabat Pengadaan", "Hasil", "Detail Evaluasi (Text)"]);
        dataRow.push(payload.evaluationId || "", payload.documentNumber || "", payload.packageName || "", payload.workUnit || "", payload.officialName || "", payload.overallResult || "", payload.evaluationDetails || "-");
        break;
      case 'EVALUATION_DELETED':
        sheet = getOrCreateSheet(ss, "EvaluasiPenawaran", ["Timestamp", "ID Dokumen", "Nomor Formulir", "Nama Paket", "Satuan Kerja", "Pejabat Pengadaan", "Hasil", "Detail Evaluasi (Text)"]);
        dataRow.push("DELETED_" + (payload.evaluationId || ""), "-", payload.packageName || "", "-", "-", "-", "DIHAPUS", "Dihapus oleh Pejabat Pengadaan");
        break;
      case 'SCHEDULE_SAVED':
        sheet = getOrCreateSheet(ss, "JadwalPengadaan", ["Timestamp", "Nomor Undangan", "Nama Paket", "Penyedia", "Tanggal Undangan", "Detail Jadwal (Text)", "Lingkup (Text)"]);
        dataRow.push(payload.documentNumber || "", payload.packageName || "", payload.vendorName || "", payload.invitationDate || "", payload.scheduleDetails || "-", payload.scopeDetails || "-");
        break;
      case 'ALL_DATA_SYNC':
        sheet = getOrCreateSheet(ss, "BackupSinkronisasi", ["Timestamp", "Tipe Data", "Jumlah Item", "Payload JSON"]);
        dataRow.push(payload.syncType || "ALL", payload.itemCount || 0, JSON.stringify(payload.data || {}));
        break;
      default:
        return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
    }

    sheet.appendRow(dataRow);
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * 6. Ambil Seluruh Data Tersimpan dari Google Sheet untuk Dipanggil Kembali ke DOKUMEN.KU
 */
function getAllSpreadsheetData() {
  if (!SPREADSHEET_URL || SPREADSHEET_URL.trim() === "") {
    return { error: "SPREADSHEET_URL belum diatur" };
  }
  try {
    var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    var result = {
      packages: [],
      evaluations: [],
      schedules: [],
      documents: []
    };

    // Ambil Data Evaluasi Penawaran
    var evalSheet = ss.getSheetByName("EvaluasiPenawaran");
    if (evalSheet && evalSheet.getLastRow() > 1) {
      var evalRows = evalSheet.getRange(2, 1, evalSheet.getLastRow() - 1, 8).getValues();
      result.evaluations = evalRows.map(function(r) {
        var cats = [];
        try { cats = JSON.parse(r[7]); } catch(e) {}
        return {
          timestamp: r[0],
          id: r[1],
          documentNumber: r[2],
          packageName: r[3],
          workUnit: r[4],
          officialName: r[5],
          overallResult: r[6],
          categories: cats
        };
      });
    }

    // Ambil Data Jadwal Pengadaan
    var schedSheet = ss.getSheetByName("JadwalPengadaan");
    if (schedSheet && schedSheet.getLastRow() > 1) {
      var schedRows = schedSheet.getRange(2, 1, schedSheet.getLastRow() - 1, 6).getValues();
      result.schedules = schedRows.map(function(r) {
        var list = [];
        try { list = JSON.parse(r[5]); } catch(e) {}
        return {
          timestamp: r[0],
          documentNumber: r[1],
          packageName: r[2],
          vendorName: r[3],
          invitationDate: r[4],
          schedules: list
        };
      });
    }

    // Ambil Data Paket
    var pkgSheet = ss.getSheetByName("Paket");
    if (pkgSheet && pkgSheet.getLastRow() > 1) {
      var pkgRows = pkgSheet.getRange(2, 1, pkgSheet.getLastRow() - 1, 6).getValues();
      result.packages = pkgRows.map(function(r) {
        return {
          timestamp: r[0],
          name: r[1],
          hpsValue: r[2],
          skpdName: r[3],
          vendorName: r[4],
          codeRUP: r[5]
        };
      });
    }

    return result;
  } catch(e) {
    return { error: e.toString() };
  }
}

// Helper Functions
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function getFolderIdFromUrl(url) {
  if (!url) return null;
  var match = url.match(/folders\\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}`;

  const indexHtmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Dokumen.KU File Manager</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-stone-100 text-stone-800 min-h-screen p-4 sm:p-6 font-sans">
  <div class="max-w-4xl mx-auto space-y-6">

    <!-- Header -->
    <div class="bg-[#701524] text-white p-5 rounded-2xl shadow-lg flex items-center justify-between">
      <div>
        <h1 class="text-xl font-black tracking-tight">Dokumen.KU Nagekeo - Unggah Berkas & Foto</h1>
        <p class="text-xs text-rose-100 mt-1">Terintegrasi otomatis ke Google Drive & Google Sheet Dokumen.KU</p>
      </div>
      <i class="fa-solid fa-cloud-arrow-up text-3xl text-rose-200"></i>
    </div>

    <!-- Form Unggah -->
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-4">
      <h2 class="text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
        <i class="fa-solid fa-upload text-[#701524]"></i>
        <span>Formulir Unggah File Baru</span>
      </h2>

      <form id="uploadForm" onsubmit="handleFormSubmit(event)" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Folder Tujuan -->
          <div>
            <label class="block text-xs font-bold text-stone-700 mb-1">Target Folder Penyimpanan:</label>
            <select name="folderType" id="folderType" required class="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#701524] bg-stone-50">
              <option value="dokumen">📁 Folder Berkas Dokumen Resmi (KAK/HPS/SPK/BAST)</option>
              <option value="foto">📸 Folder Data Visual & Foto Lapangan</option>
            </select>
          </div>

          <!-- Kategori Dokumen -->
          <div>
            <label class="block text-xs font-bold text-stone-700 mb-1">Kategori Dokumen:</label>
            <select name="category" id="category" class="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#701524] bg-stone-50">
              <option value="PERSIAPAN">Persiapan PPK (KAK / HPS / Spesifikasi)</option>
              <option value="PENAWARAN">Penawaran Rekanan / Penyedia</option>
              <option value="EVALUASI_NEGOSIASI">BA Evaluasi & Klarifikasi Negosiasi</option>
              <option value="KONTRAK_HASIL">SPK / Surat Perjanjian Kontrak</option>
              <option value="SERAH_TERIMA">BAST (Berita Acara Serah Terima)</option>
              <option value="DOKUMENTASI_FOTO">Dokumentasi Visual / Foto Lapangan</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">Judul / Keterangan Berkas:</label>
          <input type="text" name="title" id="title" placeholder="Contoh: Dokumen KAK Pengadaan Laptop TA 2026" class="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#701524]" />
        </div>

        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">Pilih File:</label>
          <input type="file" name="file" id="fileInput" required class="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-stone-50 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#701524] file:text-white hover:file:bg-[#58101c] cursor-pointer" />
        </div>

        <div class="flex items-center justify-between pt-2">
          <div id="statusMessage" class="text-xs font-semibold text-stone-600"></div>
          <button type="submit" id="submitBtn" class="px-5 py-2.5 bg-[#701524] hover:bg-[#58101c] text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-arrow-up-from-bracket"></i>
            <span>UNGGAH SEKARANG</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Live File List -->
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-4">
      <div class="flex items-center justify-between border-b border-stone-100 pb-3">
        <h2 class="text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
          <i class="fa-solid fa-folder-tree text-stone-600"></i>
          <span>Daftar Berkas Terunggah di Google Drive</span>
        </h2>
        <button onclick="loadFiles()" class="px-3 py-1.5 text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer">
          <i class="fa-solid fa-rotate-right"></i>
          <span>Muat Ulang</span>
        </button>
      </div>

      <div id="fileContainer" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div class="col-span-full py-8 text-center text-xs text-stone-400">
          <i class="fa-solid fa-spinner fa-spin text-xl text-[#701524] mb-2"></i>
          <p>Memuat daftar file dari Google Drive...</p>
        </div>
      </div>
    </div>

  </div>

  <script>
    function handleFormSubmit(e) {
      e.preventDefault();
      var form = document.getElementById('uploadForm');
      var btn = document.getElementById('submitBtn');
      var status = document.getElementById('statusMessage');

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengunggah...';
      status.innerHTML = '<span class="text-amber-600 font-bold">Sedang menyimpan ke Drive & mencatat ke Sheet...</span>';

      google.script.run
        .withSuccessHandler(function(res) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-arrow-up-from-bracket"></i> UNGGAH SEKARANG';
          if (res.success) {
            status.innerHTML = '<span class="text-emerald-700 font-bold"><i class="fa-solid fa-check"></i> ' + res.message + '</span>';
            form.reset();
            loadFiles();
          } else {
            status.innerHTML = '<span class="text-rose-700 font-bold">' + (res.message || 'Gagal mengunggah') + '</span>';
          }
        })
        .withFailureHandler(function(err) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-arrow-up-from-bracket"></i> UNGGAH SEKARANG';
          status.innerHTML = '<span class="text-rose-700 font-bold">Error: ' + err.message + '</span>';
        })
        .processForm(form);
    }

    function loadFiles() {
      var container = document.getElementById('fileContainer');
      container.innerHTML = '<div class="col-span-full py-8 text-center text-xs text-stone-400"><i class="fa-solid fa-spinner fa-spin text-xl text-[#701524] mb-2"></i><p>Memuat file...</p></div>';

      google.script.run
        .withSuccessHandler(function(files) {
          if (!files || files.length === 0) {
            container.innerHTML = '<div class="col-span-full py-8 text-center text-xs text-stone-400">Belum ada file di folder Drive.</div>';
            return;
          }
          var html = '';
          files.forEach(function(f) {
            var isFoto = f.folder === 'foto';
            var badgeColor = isFoto ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800';
            var badgeText = isFoto ? '📸 Foto' : '📁 Dokumen';
            var sizeKB = (f.size / 1024).toFixed(1) + ' KB';

            html += '<div class="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 flex flex-col justify-between">';
            html += '  <div>';
            html += '    <div class="flex items-center justify-between mb-1.5"><span class="px-2 py-0.5 text-[10px] font-bold rounded ' + badgeColor + '">' + badgeText + '</span><span class="text-[10px] text-stone-400 font-mono">' + sizeKB + '</span></div>';
            if (isFoto) {
              html += '    <div class="aspect-video bg-stone-200 rounded-lg overflow-hidden mb-2"><img src="' + f.thumbnail + '" class="w-full h-full object-cover" onerror="this.style.display=\\'none\\'" /></div>';
            }
            html += '    <h3 class="text-xs font-bold text-stone-800 line-clamp-2 leading-tight">' + f.name + '</h3>';
            html += '    <p class="text-[10px] text-stone-400 mt-0.5">' + f.date + '</p>';
            html += '  </div>';
            html += '  <div class="pt-2 border-t border-stone-200 flex items-center justify-between">';
            html += '    <a href="' + f.url + '" target="_blank" class="text-xs text-blue-700 font-bold hover:underline"><i class="fa-solid fa-arrow-up-right-from-square"></i> Buka</a>';
            html += '    <div class="flex items-center gap-2">';
            html += '      <a href="' + f.downloadUrl + '" target="_blank" class="text-xs text-emerald-700 font-bold hover:underline"><i class="fa-solid fa-download"></i> Unduh</a>';
            html += '      <button onclick="confirmDelete(\\'' + f.id + '\\', \\'' + f.name.replace(/'/g, "\\\\'") + '\\')" class="text-xs text-rose-600 font-bold hover:text-rose-800"><i class="fa-solid fa-trash-can"></i></button>';
            html += '    </div>';
            html += '  </div>';
            html += '</div>';
          });
          container.innerHTML = html;
        })
        .withFailureHandler(function(err) {
          container.innerHTML = '<div class="col-span-full py-4 text-center text-xs text-rose-600">Gagal memuat file: ' + err.message + '</div>';
        })
        .listFiles();
    }

    function confirmDelete(fileId, fileName) {
      if (confirm('Apakah Anda yakin ingin menghapus file "' + fileName + '" dari Google Drive dan Sheet?')) {
        google.script.run
          .withSuccessHandler(function(res) {
            if (res.success) {
              alert('File berhasil dihapus.');
              loadFiles();
            } else {
              alert('Gagal menghapus: ' + (res.message || 'Error'));
            }
          })
          .deleteFile(fileId);
      }
    }

    // Load file otomatis saat pertama dibuka
    loadFiles();
  </script>
</body>
</html>`;

  const copyToClipboard = (text: string, type: 'gs' | 'html') => {
    navigator.clipboard.writeText(text);
    if (type === 'gs') {
      setCopiedCodeGs(true);
      setTimeout(() => setCopiedCodeGs(false), 2000);
    } else {
      setCopiedIndexHtml(true);
      setTimeout(() => setCopiedIndexHtml(false), 2000);
    }
    onShowToast('Kode berhasil disalin ke clipboard!', 'success');
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#701524] text-white p-5 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/20">
              <Webhook className="w-6 h-6 text-rose-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Integrasi Google Sheet, Drive & Apps Script
              </h2>
              <p className="text-xs text-rose-100/80 mt-0.5">
                Konfigurasi sinkronisasi dua arah dokumen, foto kegiatan, dan pencatatan Google Spreadsheet.
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

        {/* Modal Navigation Tabs */}
        <div className="flex items-center border-b border-stone-200 bg-stone-50 px-5 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('SETTINGS')}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'SETTINGS'
                ? 'border-[#701524] text-[#701524]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FolderCheck className="w-4 h-4" />
            <span>1. Pengaturan URL & Endpoint</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CODE_GS')}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'CODE_GS'
                ? 'border-[#701524] text-[#701524]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>2. Kode Code.gs (Apps Script)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INDEX_HTML')}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'INDEX_HTML'
                ? 'border-[#701524] text-[#701524]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>3. Kode index.html (Web Form)</span>
          </button>
        </div>

        {/* Tab 1: SETTINGS FORM */}
        {activeTab === 'SETTINGS' && (
          <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
            
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
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="url"
                    value={settings.webhookUrl}
                    onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701524] bg-white font-mono text-stone-900"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestSync}
                      disabled={isTestingSync}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                      title="Uji apakah Dokumen.KU bisa membaca file dari Google Drive via Apps Script"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingSync ? 'animate-spin' : ''}`} />
                      <span>{isTestingSync ? 'Membaca...' : 'Uji Tarik File'}</span>
                    </button>
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
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  URL ini digunakan untuk: (1) Menarik daftar file dari Google Drive ke Dokumen.KU, (2) Mengirim data paket/dokumen ke Google Sheet, and (3) Menghapus file secara sinkron.
                </p>
              </div>
            </div>

            {/* Clean Data Action */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsResetPinModalOpen(true)}
                className="px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset bersih seluruh database lokal"
              >
                <Trash2 className="w-4 h-4 text-rose-700" />
                <span>Hapus Semua Data Lokal (Reset)</span>
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
        )}

        {/* Tab 2: CODE.GS SCRIPT VIEWER */}
        {activeTab === 'CODE_GS' && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#701524]" />
                  <span>Kode Lengkap Google Apps Script (Code.gs)</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Salin dan tempel ke file <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">Code.gs</code> di editor Apps Script Anda.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(codeGsContent, 'gs')}
                className="px-4 py-2 bg-[#701524] hover:bg-[#58101c] text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {copiedCodeGs ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCodeGs ? 'Tersalin!' : 'Salin Code.gs'}</span>
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <strong>Catatan Integrasi:</strong>
              <p>
                Kode ini telah disesuaikan agar: (1) Saat file diunggah di web, otomatis tercatat di Google Sheet <code className="font-mono bg-white px-1 rounded">ArsipDokumen</code>, (2) Dokumen.KU dapat membaca seluruh berkas dari Drive secara real-time via <code className="font-mono bg-white px-1 rounded">?action=getFiles</code>, dan (3) Tombol hapus di Dokumen.KU langsung menghapus file di Drive.
              </p>
            </div>

            <pre className="p-4 bg-stone-900 text-stone-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[380px] leading-relaxed">
              {codeGsContent}
            </pre>
          </div>
        )}

        {/* Tab 3: INDEX.HTML VIEWER */}
        {activeTab === 'INDEX_HTML' && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#701524]" />
                  <span>Kode Tampilan Web Upload (index.html)</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Salin dan tempel ke file <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">index.html</code> di editor Apps Script Anda.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(indexHtmlContent, 'html')}
                className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {copiedIndexHtml ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedIndexHtml ? 'Tersalin!' : 'Salin index.html'}</span>
              </button>
            </div>

            <pre className="p-4 bg-stone-900 text-stone-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[420px] leading-relaxed">
              {indexHtmlContent}
            </pre>
          </div>
        )}

      </div>

      {/* SECURITY PIN CONFIRMATION MODAL FOR RESET */}
      <SecurityPinModal
        isOpen={isResetPinModalOpen}
        title="Reset & Hapus Seluruh Data Lokal"
        itemName="Seluruh Data Paket, Dokumen & Galeri Foto SIPELANG"
        itemTypeLabel="Database Lokal"
        warningNote="PERINGATAN: Tindakan ini akan mengosongkan seluruh database paket pengadaan, berkas dokumen, dan dokumentasi foto lokal kembali ke kondisi awal (0 data)."
        onConfirm={() => {
          onResetData();
          setIsResetPinModalOpen(false);
          onClose();
        }}
        onClose={() => setIsResetPinModalOpen(false)}
      />
    </div>
  );
};
