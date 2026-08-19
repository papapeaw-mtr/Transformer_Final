import React, { useRef } from 'react';
import { Camera, Upload, Trash2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { InspectionPhoto } from '../types';

interface PhotoUploaderProps {
  photos: InspectionPhoto[];
  onChange: (photos: InspectionPhoto[]) => void;
  maxPhotos?: number;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onChange,
  maxPhotos = 8,
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPhotos: InspectionPhoto[] = [];
    const remainingSlots = maxPhotos - photos.length;
    const countToAdd = Math.min(files.length, remainingSlots);

    for (let i = 0; i < countToAdd; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const previewUrl = URL.createObjectURL(file);
      const defaultTitles = [
        'ภาพรวมหม้อแปลง',
        'ป้ายเนมเพลท (Nameplate)',
        'เกจวัดระดับน้ำมัน',
        'ซิลิกาเจล (Silica Gel)',
        'บุชชิ่งแรงสูง-ต่ำ',
        'จุดต่อสาย/กราวด์',
        'จุดที่พบความผิดปกติ',
      ];
      const title = defaultTitles[photos.length + i] || `รูปถ่าย #${photos.length + i + 1}`;

      newPhotos.push({
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        previewUrl,
        title,
      });
    }

    if (newPhotos.length > 0) {
      onChange([...photos, ...newPhotos]);
    }
  };

  const handleRemovePhoto = (id: string) => {
    const photoToRemove = photos.find((p) => p.id === id);
    if (photoToRemove?.previewUrl) {
      URL.revokeObjectURL(photoToRemove.previewUrl);
    }
    onChange(photos.filter((p) => p.id !== id));
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    onChange(
      photos.map((p) => (p.id === id ? { ...p, title: newTitle } : p))
    );
  };

  return (
    <div className="space-y-3">
      {/* Upload Action Triggers */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">
          แนบแล้ว {photos.length}/{maxPhotos} รูป
        </span>

        <div className="flex gap-2">
          {/* Direct Camera Button */}
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFilesAdded(e.target.files)}
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={photos.length >= maxPhotos}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-xs disabled:opacity-40 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            ถ่ายรูป
          </button>

          {/* File Picker Button */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFilesAdded(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photos.length >= maxPhotos}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium border border-gray-200 transition disabled:opacity-40 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            เลือกไฟล์
          </button>
        </div>
      </div>

      {/* Main Drag & Drop Zone when empty */}
      {photos.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100/80 transition-colors cursor-pointer group py-8 px-4"
        >
          <svg className="w-10 h-10 text-gray-300 group-hover:text-blue-500 mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <p className="text-xs font-medium text-gray-600">คลิกหรือลากไฟล์ภาพถ่ายมาวางที่นี่</p>
          <p className="text-[10px] text-gray-400 mt-1">(ระบบจะบันทึกและจัดเก็บเข้า Google Drive โดยอัตโนมัติ)</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs group flex flex-col"
            >
              <div className="relative aspect-4/3 bg-gray-100">
                <img
                  src={photo.previewUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold rounded">
                  #{index + 1}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(photo.id)}
                  className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-md opacity-80 hover:opacity-100 transition cursor-pointer"
                  title="ลบรูปภาพ"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div className="p-2 space-y-1">
                <input
                  type="text"
                  value={photo.title}
                  onChange={(e) => handleTitleChange(photo.id, e.target.value)}
                  placeholder="คำอธิบายรูป"
                  className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[11px] font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>{photo.file ? `${(photo.file.size / (1024 * 1024)).toFixed(2)} MB` : 'พร้อมส่ง'}</span>
                  <span className="text-blue-600 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> บีบอัดอัตโนมัติ
                  </span>
                </div>
              </div>
            </div>
          ))}

          {photos.length < maxPhotos && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 hover:border-blue-400 bg-gray-50 hover:bg-blue-50/20 rounded-xl min-h-[110px] flex flex-col items-center justify-center gap-1 cursor-pointer transition text-gray-400 hover:text-blue-600"
            >
              <Camera className="w-4 h-4" />
              <span className="text-[11px] font-medium">+ เพิ่มรูปอีก</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
