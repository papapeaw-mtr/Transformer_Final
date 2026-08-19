import React from 'react';
import { AlertCircle, CheckCircle2, FileText, Image as ImageIcon, MapPin, X } from 'lucide-react';
import { InspectionData } from '../types';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: InspectionData;
  isLoading: boolean;
  uploadProgressText?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  data,
  isLoading,
  uploadProgressText,
}) => {
  if (!isOpen) return null;

  const statusLabel = {
    normal: { text: 'ปกติ (Normal)', color: 'text-green-700 bg-green-50 border-green-200' },
    warning: { text: 'เฝ้าระวัง (Warning)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    critical: { text: 'ชำรุด/ด่วน (Defect)', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  }[data.overallStatus];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">ยืนยันการส่งรายงานการตรวจสอบ</h3>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-gray-700">
          <p className="text-gray-600">
            โปรดยืนยันการบันทึกข้อมูลการตรวจสอบหม้อแปลงไฟฟ้าเข้าสู่ <strong>Google Sheet</strong> และอัปโหลดภาพถ่ายไปยัง <strong>Google Drive</strong>
          </p>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2.5">
            <div className="flex justify-between items-center py-1 border-b border-gray-200/80">
              <span className="text-gray-500">หมายเลขหม้อแปลง:</span>
              <span className="font-bold text-gray-900 text-sm font-mono">{data.transformerId || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-200/80">
              <span className="text-gray-500">ผู้ตรวจสอบ:</span>
              <span className="font-semibold text-gray-800">{data.inspectorName || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-200/80">
              <span className="text-gray-500">วันและเวลา:</span>
              <span className="text-gray-800">
                {new Date(data.inspectionDateTime).toLocaleString('th-TH')}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-200/80">
              <span className="text-gray-500">ผลการตรวจสอบรวม:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusLabel.color}`}>
                {statusLabel.text}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-200/80">
              <span className="text-gray-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> พิกัด GPS:
              </span>
              <span className="font-mono text-xs text-gray-700">
                {data.latitude && data.longitude
                  ? `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`
                  : 'ไม่ได้ระบุ'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-gray-400" /> รูปภาพหน้างาน:
              </span>
              <span className="font-semibold text-blue-600">
                {data.photos.length} รูป (จัดเก็บลง Google Drive)
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-900">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <div>
                <p className="font-semibold text-xs">{uploadProgressText || 'กำลังบันทึกข้อมูลและอัปโหลดรูปภาพ...'}</p>
                <p className="text-[11px] text-blue-700 mt-0.5">โปรดอย่าปิดหน้าจอนี้จนกว่าจะเสร็จสิ้น</p>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
              ⚡ ระบบจะเขียนแถวใหม่ลงใน Google Sheet และอัปโหลดไฟล์รูปภาพเข้าโฟลเดอร์ Google Drive ทันที
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition disabled:opacity-50 text-xs cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-200 flex items-center gap-2 transition disabled:opacity-50 text-xs cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังดำเนินการ...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                ยืนยันและบันทึกข้อมูล
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
