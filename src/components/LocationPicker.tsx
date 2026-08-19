import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, AlertTriangle, Check, RefreshCw } from 'lucide-react';

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  accuracy?: number | null;
  locationNotes?: string;
  onChange: (lat: number | null, lng: number | null, accuracy?: number | null, notes?: string) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  accuracy,
  locationNotes = '',
  onChange,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('อุปกรณ์ไม่รองรับการระบุพิกัด GPS');
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const acc = Math.round(pos.coords.accuracy);
        onChange(lat, lng, acc, locationNotes);
      },
      (err) => {
        setIsLocating(false);
        let message = 'ไม่สามารถดึงตำแหน่งพิกัดได้';
        if (err.code === err.PERMISSION_DENIED) {
          message = 'กรุณาอนุญาตการเข้าถึง Location Permission ในเบราว์เซอร์';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'สัญญาณ GPS ไม่พร้อมใช้งานในขณะนี้';
        } else if (err.code === err.TIMEOUT) {
          message = 'หมดเวลาในการค้นหาตำแหน่ง GPS โปรดลองใหม่อีกครั้ง';
        }
        setErrorMsg(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange(isNaN(val) ? null : val, longitude, accuracy, locationNotes);
  };

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange(latitude, isNaN(val) ? null : val, accuracy, locationNotes);
  };

  const googleMapsUrl = latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : null;
  const osmEmbedUrl = latitude && longitude 
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005}%2C${latitude - 0.003}%2C${longitude + 0.005}%2C${latitude + 0.003}&layer=mapnik&marker=${latitude}%2C${longitude}`
    : null;

  return (
    <div className="space-y-3">
      {/* Visual GPS Radar Map Box */}
      <div className="relative h-32 w-full bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-center overflow-hidden">
        {osmEmbedUrl ? (
          <iframe
            title="Location Map Preview"
            src={osmEmbedUrl}
            className="w-full h-full border-0 pointer-events-none"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
        )}

        <div className="z-10 flex flex-col items-center pointer-events-none">
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
          <span className="text-[10px] font-bold text-blue-800 bg-white/90 px-2 py-0.5 rounded shadow-xs mt-1 font-mono">
            {latitude && longitude ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : 'รอการระบุพิกัด GPS'}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Lat & Long Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">ละติจูด (LAT)</label>
          <input
            type="number"
            step="0.000001"
            placeholder="13.7563"
            value={latitude !== null ? latitude : ''}
            onChange={handleLatChange}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">ลองจิจูด (LNG)</label>
          <input
            type="number"
            step="0.000001"
            placeholder="100.5018"
            value={longitude !== null ? longitude : ''}
            onChange={handleLngChange}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Action button & Status */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200 transition disabled:opacity-60 cursor-pointer"
        >
          {isLocating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>กำลังดึง GPS...</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
              <span>ดึงพิกัด GPS อัตโนมัติ</span>
            </>
          )}
        </button>

        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 hover:underline"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
