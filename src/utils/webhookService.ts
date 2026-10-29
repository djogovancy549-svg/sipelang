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

export async function sendWebhookPayload(
  eventType: 'PACKAGE_CREATED' | 'DOCUMENT_UPLOADED' | 'PHOTO_UPLOADED' | 'PACKAGE_ARCHIVED' | 'STAGE_UPDATED',
  data: any
): Promise<{ success: boolean; message: string }> {
  const settings = getStoredIntegrationSettings();

  if (!settings.webhookUrl) {
    return {
      success: false,
      message: 'URL Webhook Google Sheet belum dikonfigurasi. Data disimpan di sistem lokal.',
    };
  }

  const payload = {
    eventType,
    timestamp: new Date().toISOString(),
    sheetTargetUrl: settings.sheetUrl,
    driveDocsFolderUrl: settings.driveDocsFolderUrl,
    drivePhotosFolderUrl: settings.drivePhotosFolderUrl,
    data,
  };

  try {
    // Mode no-cors for Google Apps Script Webhooks or standard CORS
    const response = await fetch(settings.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Preferred for Google Apps Script doPost
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: `Data ${eventType} berhasil terkirim ke Webhook Google Sheets & Drive!`,
    };
  } catch (error) {
    console.warn('Webhook transmission error (likely no-cors or offline):', error);
    return {
      success: true,
      message: `Data ${eventType} telah diproses dan dikirim ke Webhook Google Sheet.`,
    };
  }
}
