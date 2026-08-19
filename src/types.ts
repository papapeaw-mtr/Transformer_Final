export type OverallStatus = 'normal' | 'warning' | 'critical';

export interface InspectionData {
  id?: string;
  transformerId: string;
  inspectionDateTime: string; // ISO string
  inspectorName: string;
  overallStatus: OverallStatus;
  
  // Detailed Checklist
  oilLevel: 'normal' | 'low' | 'high' | 'not_applicable';
  tankCondition: 'good' | 'leaking' | 'rusty' | 'dented';
  silicaGelCondition: 'good_blue' | 'good_orange' | 'expired_pink' | 'expired_white';
  bushingCondition: 'good' | 'cracked' | 'dirty_flashover' | 'oil_leak';
  temperatureC?: number | string;
  noiseVibration: 'normal' | 'humming_loud' | 'buzzing_spark' | 'vibrating';
  groundingTerminal: 'secure' | 'loose' | 'overheating' | 'corroded';
  
  // Location
  latitude: number | null;
  longitude: number | null;
  accuracyMeters?: number | null;
  locationNotes?: string;
  
  // Notes
  notes: string;
  
  // Photos
  photos: InspectionPhoto[];
  driveFolderId?: string;
  spreadsheetId?: string;
}

export interface InspectionPhoto {
  id: string;
  file?: File;
  previewUrl: string;
  title: string;
  driveFileId?: string;
  driveViewLink?: string;
  uploadedAt?: string;
}

export interface InspectionRecord {
  rowNumber?: number;
  timestamp: string;
  transformerId: string;
  inspectorName: string;
  overallStatus: OverallStatus;
  oilLevel: string;
  tankCondition: string;
  silicaGel: string;
  bushing: string;
  temperature: string;
  noise: string;
  grounding: string;
  latitude: string;
  longitude: string;
  mapUrl: string;
  notes: string;
  photoLinks: string;
}

export interface AppConfig {
  spreadsheetId: string;
  driveFolderId: string;
  sheetName: string;
}
