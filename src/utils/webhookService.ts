/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GoogleIntegrationSettings {
  webhookUrl: string;
  sheetUrl: string;
  driveDocsFolderUrl: string;
  drivePhotosFolderUrl: string;
  autoSyncEnabled: boolean;
}

export const DEFAULT_INTEGRATION_SETTINGS: GoogleIntegrationSettings = {
  webhookUrl: localStorage.getItem('sipelang_webhook_url') || 'https://script.google.com/macros/s/AKfycbwxcZPZWk5LNJf-l2k3Qjeq_IUQ-zqGxJrbDQt9x5i0PxX6PrIF7VJU-QNUAMro_hgdIw/exec',
  sheetUrl: localStorage.getItem('sipelang_sheet_url') || '',
  driveDocsFolderUrl: 'https://drive.google.com/drive/folders/1FI_KsR6FAUuDIYs3ule8eBbnz4oUH-gh?usp=sharing',
  drivePhotosFolderUrl: 'https://drive.google.com/drive/folders/1oXZ8J4QG9j38x0ZkzqSQMlYH5WDuIejK?usp=sharing',
  autoSyncEnabled: true,
};

export function getStoredIntegrationSettings(): GoogleIntegrationSettings {
  try {
    const saved = localStorage.getItem('sipelang_google_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_INTEGRATION_SETTINGS,
        ...parsed,
        webhookUrl: parsed.webhookUrl || DEFAULT_INTEGRATION_SETTINGS.webhookUrl,
      };
    }
  } catch (e) {
    console.error('Error loading Google integration settings:', e);
  }
  return DEFAULT_INTEGRATION_SETTINGS;
}

export function saveIntegrationSettings(settings: GoogleIntegrationSettings): void {
  try {
    localStorage.setItem('sipelang_google_settings', JSON.stringify(settings));
    if (settings.webhookUrl) localStorage.setItem('sipelang_webhook_url', settings.webhookUrl);
    if (settings.sheetUrl) localStorage.setItem('sipelang_sheet_url', settings.sheetUrl);
  } catch (e) {
    console.error('Error saving Google integration settings:', e);
  }
}

export async function uploadFileToDrive(
  file: File,
  folderType: 'DOCS' | 'PHOTOS'
): Promise<string> {
  const settings = getStoredIntegrationSettings();
  const folderUrl = folderType === 'DOCS' ? settings.driveDocsFolderUrl : settings.drivePhotosFolderUrl;
  
  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve) => {
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
  const base64 = await base64Promise;

  const payload = {
    action: 'UPLOAD_FILE',
    folderUrl,
    fileName: file.name,
    fileType: file.type,
    fileData: base64,
  };

  const response = await fetch(settings.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  return result.fileUrl; // Expecting Google Apps Script to return the drive file URL
}

export async function sendWebhookPayload(
  eventType:
    | 'PACKAGE_CREATED'
    | 'DOCUMENT_UPLOADED'
    | 'PHOTO_UPLOADED'
    | 'PACKAGE_ARCHIVED'
    | 'STAGE_UPDATED'
    | 'OPD_NUMBERING_UPDATED'
    | 'MATRIX_UPDATED',
  data: Record<string, any> // Expecting a flat object
): Promise<{ success: boolean; message: string }> {
  const settings = getStoredIntegrationSettings();

  if (!settings.webhookUrl) {
    return {
      success: false,
      message: 'URL Webhook Google Sheet belum dikonfigurasi.',
    };
  }

  const payload = {
    eventType,
    timestamp: new Date().toISOString(),
    ...data, // Assume data is already flattened
  };

  try {
    await fetch(settings.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: `Data ${eventType} berhasil terkirim!`,
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return { success: false, message: 'Gagal mengirim data.' };
  }
}

export interface DriveSyncedFile {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  date: string;
  ts: number;
  folder: 'dokumen' | 'foto';
  thumbnail: string;
  downloadUrl: string;
}

export function formatDriveBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Fetch all files directly from Google Drive via the Apps Script Web App (?action=getFiles)
 */
export async function fetchFilesFromDrive(
  customWebhookUrl?: string
): Promise<{ success: boolean; files?: DriveSyncedFile[]; message: string }> {
  const settings = getStoredIntegrationSettings();
  const url = (customWebhookUrl || settings.webhookUrl || '').trim();

  if (!url) {
    return {
      success: false,
      message: 'URL Webhook Google Apps Script belum dikonfigurasi di Pengaturan.',
    };
  }

  try {
    const separator = url.includes('?') ? '&' : '?';
    const requestUrl = `${url}${separator}action=getFiles&_t=${Date.now()}`;
    const response = await fetch(requestUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    let fileList: DriveSyncedFile[] = [];

    if (Array.isArray(data)) {
      fileList = data;
    } else if (data && Array.isArray(data.files)) {
      fileList = data.files;
    } else {
      throw new Error('Format data tidak sesuai, pastikan Code.gs sudah diperbarui');
    }

    return {
      success: true,
      files: fileList,
      message: `Berhasil menarik ${fileList.length} file dari Google Drive!`,
    };
  } catch (error) {
    console.error('Error fetching files from Drive Apps Script:', error);
    return {
      success: false,
      message: `Gagal membaca data dari Apps Script: ${error instanceof Error ? error.message : String(error)}. Pastikan Web App di-deploy dengan akses "Anyone".`,
    };
  }
}

/**
 * Request Apps Script to delete a file by ID from Drive
 */
export async function deleteFileFromDrive(
  fileId: string,
  customWebhookUrl?: string
): Promise<{ success: boolean; message: string }> {
  const settings = getStoredIntegrationSettings();
  const url = (customWebhookUrl || settings.webhookUrl || '').trim();

  if (!url) {
    return {
      success: false,
      message: 'URL Webhook belum dikonfigurasi.',
    };
  }

  try {
    const separator = url.includes('?') ? '&' : '?';
    const requestUrl = `${url}${separator}action=deleteFile&fileId=${encodeURIComponent(fileId)}&_t=${Date.now()}`;
    const response = await fetch(requestUrl, {
      method: 'GET',
    });

    const data = await response.json();
    if (data && data.success) {
      return { success: true, message: 'File berhasil dihapus dari Google Drive & Sheet!' };
    }
    return { success: false, message: data?.message || 'Gagal menghapus file dari Drive.' };
  } catch (error) {
    console.error('Error deleting file via Apps Script:', error);
    return {
      success: false,
      message: `Gagal menghubungi server Apps Script: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

