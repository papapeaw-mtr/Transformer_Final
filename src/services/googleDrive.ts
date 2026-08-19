import { fetchWithRetry, compressImage } from './apiHelpers';

export const DEFAULT_DRIVE_FOLDER_ID = '1L6iSiAwihdScJrVC2D-oKtor3At7Fjmw';

export interface UploadResult {
  fileId: string;
  name: string;
  webViewLink: string;
  thumbnailLink?: string;
}

/**
 * Uploads an image file to a designated Google Drive folder with multipart upload
 */
export async function uploadPhotoToDrive(
  accessToken: string,
  rawFile: File,
  folderId: string = DEFAULT_DRIVE_FOLDER_ID,
  transformerId?: string
): Promise<UploadResult> {
  // 1. Optimize and compress image for field upload
  const file = await compressImage(rawFile);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedId = transformerId ? transformerId.trim().replace(/[^a-zA-Z0-9_-]/g, '_') : 'TR';
  const fileName = `${sanitizedId}_${timestamp}_${file.name.replace(/\.[^/.]+$/, '')}.jpg`;

  // 2. Prepare metadata
  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : undefined,
    description: `รูปภาพการตรวจสอบหม้อแปลงไฟฟ้า: ${transformerId || 'N/A'} วันที่: ${new Date().toLocaleString('th-TH')}`,
    mimeType: file.type || 'image/jpeg',
  };

  // 3. Prepare multipart boundary
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const fileBytes = await fileDataPromise;

  // Build multipart body
  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const mediaHeader = `${delimiter}Content-Type: ${file.type || 'image/jpeg'}\r\nContent-Transfer-Encoding: binary\r\n\r\n`;

  const metadataBlob = new Blob([metadataPart], { type: 'text/plain' });
  const mediaHeaderBlob = new Blob([mediaHeader], { type: 'text/plain' });
  const mediaBlob = new Blob([fileBytes], { type: file.type || 'image/jpeg' });
  const closeBlob = new Blob([closeDelimiter], { type: 'text/plain' });

  const multipartBody = new Blob([metadataBlob, mediaHeaderBlob, mediaBlob, closeBlob]);

  const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,thumbnailLink';

  const response = await fetchWithRetry(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Drive upload error:', errorText);
    throw new Error(`Google Drive Error (${response.status}): ${errorText || response.statusText}`);
  }

  const result = await response.json();

  // Try to create public view permission for easy linking in sheet
  try {
    await fetchWithRetry(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permErr) {
    console.warn('Could not set public permission on uploaded file:', permErr);
  }

  return {
    fileId: result.id,
    name: result.name,
    webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
    thumbnailLink: result.thumbnailLink,
  };
}
