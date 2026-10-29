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
  webhookUrl: localStorage.getItem('sipelang_webhook_url') || '',
  sheetUrl: localStorage.getItem('sipelang_sheet_url') || '',
  driveDocsFolderUrl: 'https://drive.google.com/drive/folders/1FI_KsR6FAUuDIYs3ule8eBbnz4oUH-gh?usp=sharing',
  drivePhotosFolderUrl: 'https://drive.google.com/drive/folders/1oXZ8J4QG9j38x0ZkzqSQMlYH5WDuIejK?usp=sharing',
  autoSyncEnabled: true,
};

export function getStoredIntegrationSettings(): GoogleIntegrationSettings {
  try {
    const saved = localStorage.getItem('sipelang_google_settings');
    if (saved) {
      return {
        ...DEFAULT_INTEGRATION_SETTINGS,
        ...JSON.parse(saved),
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
  eventType: 'PACKAGE_CREATED' | 'DOCUMENT_UPLOADED' | 'PHOTO_UPLOADED' | 'PACKAGE_ARCHIVED' | 'STAGE_UPDATED',
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
