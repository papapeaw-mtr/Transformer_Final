import { fetchWithRetry } from './apiHelpers';
import { InspectionData, InspectionRecord } from '../types';

export const DEFAULT_SPREADSHEET_ID = '1QHJwWOM-4_IRhqJ4n6Y72B9H4M14qaz-PDb9x6q_bwc';

export const SHEET_HEADERS = [
  'วัน-เวลาที่ตรวจ',
  'หมายเลขหม้อแปลง',
  'ผู้ตรวจสอบ',
  'ผลการตรวจสอบรวม',
  'ระดับน้ำมัน',
  'สภาพตัวถัง',
  'ซิลิกาเจล',
  'บุชชิ่ง',
  'อุณหภูมิ (°C)',
  'เสียง/การสั่น',
  'ระบบกราวด์/ขั้วต่อ',
  'ละติจูด',
  'ลองจิจูด',
  'พิกัด Google Maps',
  'หมายเหตุ/ข้อเสนอแนะ',
  'ลิงก์รูปถ่าย Google Drive'
];

// In-memory cache for resolved sheet tab titles
const sheetNameCache = new Map<string, string>();

/**
 * Dynamically resolves the actual sheet (tab) title in the Google Spreadsheet
 * (e.g. 'ชีต1' in Thai locale, 'Sheet1' in English locale, or custom renamed tab)
 */
export async function getActualSheetName(
  accessToken: string,
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID
): Promise<string> {
  if (sheetNameCache.has(spreadsheetId)) {
    return sheetNameCache.get(spreadsheetId)!;
  }

  try {
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title,index)`;
    const res = await fetchWithRetry(metaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.ok) {
      const meta = await res.json();
      if (meta.sheets && meta.sheets.length > 0) {
        // Sort by index to get the first tab
        const sortedSheets = [...meta.sheets].sort(
          (a, b) => (a.properties?.index ?? 0) - (b.properties?.index ?? 0)
        );
        const title = sortedSheets[0]?.properties?.title;
        if (title) {
          sheetNameCache.set(spreadsheetId, title);
          return title;
        }
      }
    }
  } catch (err) {
    console.warn('Could not query spreadsheet metadata to resolve tab name:', err);
  }

  // Fallback
  return 'Sheet1';
}

/**
 * Formats a sheet title safely into A1 notation (escaping single quotes)
 */
function formatA1Range(sheetTitle: string, range: string): string {
  const escapedTitle = sheetTitle.replace(/'/g, "''");
  return `'${escapedTitle}'!${range}`;
}

/**
 * Ensures header row exists in Google Sheet
 */
export async function ensureSheetHeaders(
  accessToken: string,
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID,
  customSheetName?: string
): Promise<string> {
  const actualSheetName = customSheetName || await getActualSheetName(accessToken, spreadsheetId);
  const rangeNotation = formatA1Range(actualSheetName, 'A1:P1');
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeNotation)}`;
  
  try {
    const res = await fetchWithRetry(getUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.values || data.values.length === 0 || !data.values[0] || data.values[0].length === 0) {
        // Write headers
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeNotation)}?valueInputOption=USER_ENTERED`;
        await fetchWithRetry(updateUrl, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [SHEET_HEADERS],
          }),
        });
      }
    }
  } catch (err) {
    console.warn('Could not verify/initialize sheet headers:', err);
  }

  return actualSheetName;
}

/**
 * Appends a new transformer inspection report to Google Sheet
 */
export async function appendInspectionToSheet(
  accessToken: string,
  data: InspectionData,
  driveLinks: string[],
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID,
  customSheetName?: string
): Promise<{ success: boolean; updatedRange?: string }> {
  // 1. Resolve actual sheet name and ensure header is initialized
  const actualSheetName = await ensureSheetHeaders(accessToken, spreadsheetId, customSheetName);

  // 2. Format localized strings
  const formattedDate = new Date(data.inspectionDateTime).toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const overallStatusMap: Record<string, string> = {
    normal: '✅ ปกติ (Normal)',
    warning: '⚠️ เฝ้าระวัง / ผิดปกติเล็กน้อย (Warning)',
    critical: '🚨 ผิดปกติ / ต้องแก้ไขด่วน (Critical)',
  };

  const oilMap: Record<string, string> = {
    normal: 'ปกติ',
    low: 'ต่ำกว่าเกณฑ์',
    high: 'สูงเกินเกณฑ์',
    not_applicable: 'ไม่ระบุ/ไม่ใช้น้ำมัน',
  };

  const tankMap: Record<string, string> = {
    good: 'สภาพดี / สะอาด',
    leaking: 'มีรอยน้ำมันรั่วซึม',
    rusty: 'มีสนิมเกาะ',
    dented: 'บุบ / เสียรูป',
  };

  const silicaMap: Record<string, string> = {
    good_blue: 'ปกติ (สีน้ำเงิน)',
    good_orange: 'ปกติ (สีส้ม)',
    expired_pink: 'เสื่อมสภาพ (สีชมพู)',
    expired_white: 'เสื่อมสภาพ (สีขาว)',
  };

  const bushingMap: Record<string, string> = {
    good: 'ปกติ / สะอาด',
    cracked: 'แตกร้าว / บิ่น',
    dirty_flashover: 'สกปรก / มีคราบ Flashover',
    oil_leak: 'มีคราบน้ำมันรั่วซึม',
  };

  const noiseMap: Record<string, string> = {
    normal: 'ปกติ (Humming สม่ำเสมอ)',
    humming_loud: 'เสียงฮัมดังผิดปกติ',
    buzzing_spark: 'มีเสียงสปาร์ค / เปรี๊ยะๆ',
    vibrating: 'สั่นสะเทือนแรง',
  };

  const groundingMap: Record<string, string> = {
    secure: 'แน่นหนา แข็งแรง',
    loose: 'หลวม คลอน',
    overheating: 'มีรอยไหม้ / ความร้อนสูง',
    corroded: 'ผุกร่อน เป็นสนิม',
  };

  const mapUrl = data.latitude && data.longitude 
    ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}` 
    : '';

  const photoLinksFormatted = driveLinks.length > 0 ? driveLinks.join('\n') : '-';

  const rowValues = [
    formattedDate,
    data.transformerId.trim(),
    data.inspectorName.trim(),
    overallStatusMap[data.overallStatus] || data.overallStatus,
    oilMap[data.oilLevel] || data.oilLevel,
    tankMap[data.tankCondition] || data.tankCondition,
    silicaMap[data.silicaGelCondition] || data.silicaGelCondition,
    bushingMap[data.bushingCondition] || data.bushingCondition,
    data.temperatureC !== undefined && data.temperatureC !== '' ? `${data.temperatureC} °C` : '-',
    noiseMap[data.noiseVibration] || data.noiseVibration,
    groundingMap[data.groundingTerminal] || data.groundingTerminal,
    data.latitude ? data.latitude.toString() : '-',
    data.longitude ? data.longitude.toString() : '-',
    mapUrl,
    data.notes || '-',
    photoLinksFormatted,
  ];

  const rangeNotation = formatA1Range(actualSheetName, 'A1');
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeNotation)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetchWithRetry(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Sheets append error:', errorText);
    
    // Invalidate cache in case tab was renamed
    sheetNameCache.delete(spreadsheetId);

    throw new Error(`Google Sheets Error (${response.status}): ${errorText || response.statusText}`);
  }

  const result = await response.json();
  return {
    success: true,
    updatedRange: result.updates?.updatedRange,
  };
}

/**
 * Fetches recent inspection records from Google Sheet for history view
 */
export async function fetchInspectionHistory(
  accessToken: string,
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID,
  customSheetName?: string
): Promise<InspectionRecord[]> {
  try {
    const actualSheetName = customSheetName || await getActualSheetName(accessToken, spreadsheetId);
    const rangeNotation = formatA1Range(actualSheetName, 'A2:P100');
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeNotation)}`;

    const response = await fetchWithRetry(getUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      if (response.status === 404) return [];
      const errorText = await response.text();
      console.warn('Google Sheets fetch warning:', errorText);
      sheetNameCache.delete(spreadsheetId);
      return [];
    }

    const data = await response.json();
    if (!data.values || !Array.isArray(data.values)) {
      return [];
    }

    return data.values.map((row: string[], index: number): InspectionRecord => {
      const overallRaw = row[3] || '';
      let overallStatus: 'normal' | 'warning' | 'critical' = 'normal';
      if (overallRaw.includes('วิกฤต') || overallRaw.includes('ด่วน') || overallRaw.includes('Critical') || overallRaw.includes('🚨')) {
        overallStatus = 'critical';
      } else if (overallRaw.includes('เฝ้าระวัง') || overallRaw.includes('Warning') || overallRaw.includes('⚠️')) {
        overallStatus = 'warning';
      }

      return {
        rowNumber: index + 2,
        timestamp: row[0] || '',
        transformerId: row[1] || '',
        inspectorName: row[2] || '',
        overallStatus,
        oilLevel: row[4] || '',
        tankCondition: row[5] || '',
        silicaGel: row[6] || '',
        bushing: row[7] || '',
        temperature: row[8] || '',
        noise: row[9] || '',
        grounding: row[10] || '',
        latitude: row[11] || '',
        longitude: row[12] || '',
        mapUrl: row[13] || '',
        notes: row[14] || '',
        photoLinks: row[15] || '',
      };
    }).reverse(); // Latest inspections first
  } catch (err) {
    console.error('Failed to fetch inspection history:', err);
    return [];
  }
}
