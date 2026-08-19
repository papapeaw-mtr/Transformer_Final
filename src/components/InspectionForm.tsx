import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Send, 
  Calendar, 
  User, 
  Hash, 
  Thermometer, 
  Volume2, 
  Zap, 
  Droplet, 
  ShieldCheck, 
  FileText, 
  Clock, 
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { InspectionData, InspectionPhoto, OverallStatus } from '../types';
import { LocationPicker } from './LocationPicker';
import { PhotoUploader } from './PhotoUploader';
import { ConfirmDialog } from './ConfirmDialog';
import { uploadPhotoToDrive } from '../services/googleDrive';
import { appendInspectionToSheet } from '../services/googleSheets';
import confetti from 'canvas-confetti';

interface InspectionFormProps {
  accessToken: string | null;
  userEmail?: string | null;
  spreadsheetId: string;
  driveFolderId: string;
  onSuccessSubmit: () => void;
  onRequestSignIn: () => void;
}

export const InspectionForm: React.FC<InspectionFormProps> = ({
  accessToken,
  userEmail,
  spreadsheetId,
  driveFolderId,
  onSuccessSubmit,
  onRequestSignIn,
}) => {
  const getNowLocalISO = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [formData, setFormData] = useState<InspectionData>({
    transformerId: '',
    inspectionDateTime: getNowLocalISO(),
    inspectorName: userEmail ? userEmail.split('@')[0] : '',
    overallStatus: 'normal',
    oilLevel: 'normal',
    tankCondition: 'good',
    silicaGelCondition: 'good_blue',
    bushingCondition: 'good',
    temperatureC: '',
    noiseVibration: 'normal',
    groundingTerminal: 'secure',
    latitude: null,
    longitude: null,
    accuracyMeters: null,
    locationNotes: '',
    notes: '',
    photos: [],
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<{ id: string; time: string } | null>(null);

  useEffect(() => {
    if (userEmail && !formData.inspectorName) {
      setFormData((prev) => ({ ...prev, inspectorName: userEmail.split('@')[0] }));
    }
  }, [userEmail]);

  const handleResetForm = () => {
    setFormData({
      transformerId: '',
      inspectionDateTime: getNowLocalISO(),
      inspectorName: userEmail ? userEmail.split('@')[0] : '',
      overallStatus: 'normal',
      oilLevel: 'normal',
      tankCondition: 'good',
      silicaGelCondition: 'good_blue',
      bushingCondition: 'good',
      temperatureC: '',
      noiseVibration: 'normal',
      groundingTerminal: 'secure',
      latitude: null,
      longitude: null,
      accuracyMeters: null,
      locationNotes: '',
      notes: '',
      photos: [],
    });
    setErrorMessage(null);
  };

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.transformerId.trim()) {
      setErrorMessage('กรุณาระบุหมายเลขหม้อแปลงไฟฟ้า (Transformer ID)');
      return;
    }
    if (!formData.inspectorName.trim()) {
      setErrorMessage('กรุณาระบุชื่อผู้ตรวจสอบ (Inspector Name)');
      return;
    }
    if (!accessToken) {
      setErrorMessage('กรุณาลงชื่อเข้าใช้ด้วย Google (Sign in with Google) ก่อนบันทึกข้อมูล');
      onRequestSignIn();
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    if (!accessToken) {
      setShowConfirm(false);
      onRequestSignIn();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const driveLinks: string[] = [];

      if (formData.photos.length > 0) {
        for (let i = 0; i < formData.photos.length; i++) {
          const photo = formData.photos[i];
          setUploadProgressText(`กำลังอัปโหลดรูปภาพที่ ${i + 1}/${formData.photos.length} (${photo.title}) ไปยัง Google Drive...`);

          if (photo.file) {
            const uploadRes = await uploadPhotoToDrive(
              accessToken,
              photo.file,
              driveFolderId,
              formData.transformerId
            );
            driveLinks.push(`${photo.title}: ${uploadRes.webViewLink}`);
          }
        }
      }

      setUploadProgressText('กำลังบันทึกข้อมูลรายงานการตรวจสอบลงใน Google Sheet...');
      await appendInspectionToSheet(
        accessToken,
        formData,
        driveLinks,
        spreadsheetId
      );

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }

      setSuccessBanner({
        id: formData.transformerId,
        time: new Date().toLocaleTimeString('th-TH'),
      });

      setShowConfirm(false);
      handleResetForm();
      onSuccessSubmit();
    } catch (err: any) {
      console.error('Submit inspection report error:', err);
      setErrorMessage(`เกิดข้อผิดพลาดในการบันทึก: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setIsSubmitting(false);
      setUploadProgressText('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3 text-emerald-900 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">
                บันทึกรายงานหม้อแปลง {successBanner.id} สำเร็จเรียบร้อยแล้ว!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                ข้อมูลถูกส่งเข้า Google Sheet และรูปภาพถูกจัดเก็บลง Google Drive แล้วเมื่อเวลา {successBanner.time}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-emerald-100/60"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900 shadow-xs animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">ข้อผิดพลาด</p>
            <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 text-xs font-semibold px-2 py-1"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Clean Minimalism Inspection Form */}
      <form onSubmit={handleSubmitAttempt} className="space-y-6">
        
        {/* Two Column Layout on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. ข้อมูลพื้นฐาน (Basic Information) */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2.5 flex items-center justify-between">
                <span>1. ข้อมูลพื้นฐานหม้อแปลง</span>
                <span className="text-[10px] text-gray-400 normal-case font-normal">* จำเป็นต้องกรอก</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* หมายเลขหม้อแปลง */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-blue-600" /> หมายเลขหม้อแปลง (Serial ID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น TR-BK-2024-00892"
                    value={formData.transformerId}
                    onChange={(e) => setFormData({ ...formData, transformerId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm font-mono text-gray-900 transition"
                  />
                </div>

                {/* ผู้ตรวจสอบ */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-600" /> ผู้ตรวจสอบ (Inspector Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ระบุชื่อ-นามสกุลผู้ตรวจ"
                    value={formData.inspectorName}
                    onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm text-gray-900 transition"
                  />
                </div>

                {/* วันและเวลาในการกรอก */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" /> วันและเวลาในการกรอก <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, inspectionDateTime: getNowLocalISO() })}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" /> ตั้งเป็นเวลาปัจจุบัน
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    required
                    value={formData.inspectionDateTime}
                    onChange={(e) => setFormData({ ...formData, inspectionDateTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm text-gray-900 transition"
                  />
                </div>
              </div>
            </div>

            {/* 2. ผลการตรวจสอบ (Inspection Result) */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2.5">
                2. ผลการตรวจสอบรวม
              </h2>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  สถานะการทำงาน (Work Result Status)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, overallStatus: 'normal' })}
                    className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      formData.overallStatus === 'normal'
                        ? 'border-2 border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ปกติ (Normal)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, overallStatus: 'warning' })}
                    className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      formData.overallStatus === 'warning'
                        ? 'border-2 border-amber-500 bg-amber-50 text-amber-800 shadow-xs'
                        : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>เฝ้าระวัง (Warning)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, overallStatus: 'critical' })}
                    className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      formData.overallStatus === 'critical'
                        ? 'border-2 border-rose-600 bg-rose-50 text-rose-700 shadow-xs'
                        : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>ชำรุด/ด่วน (Defect)</span>
                  </button>
                </div>
              </div>

              {/* 3. รายการตรวจสอบย่อยทางเทคนิค (Checklist) */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-500 mb-3">
                  รายการตรวจสอบสภาพทางเทคนิค (Technical Checks)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* ระดับน้ำมัน */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1">
                    <label className="block text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-blue-600" /> 1. ระดับน้ำมัน (Oil Level)
                    </label>
                    <select
                      value={formData.oilLevel}
                      onChange={(e) => setFormData({ ...formData, oilLevel: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="normal">✅ ปกติ (ตามขีดมาตรฐาน)</option>
                      <option value="low">⚠️ ต่ำกว่าเกณฑ์</option>
                      <option value="high">⚠️ สูงเกินเกณฑ์</option>
                      <option value="not_applicable">⚪ ไม่ระบุ/หม้อแปลงแห้ง</option>
                    </select>
                  </div>

                  {/* สภาพตัวถัง */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1">
                    <label className="block text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-gray-600" /> 2. สภาพตัวถัง (Tank Condition)
                    </label>
                    <select
                      value={formData.tankCondition}
                      onChange={(e) => setFormData({ ...formData, tankCondition: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="good">✅ สภาพดี สะอาด</option>
                      <option value="leaking">🚨 มีรอยน้ำมันรั่วซึม</option>
                      <option value="rusty">⚠️ มีสนิมเกาะ</option>
                      <option value="dented">⚠️ บุบ / เสียรูป</option>
                    </select>
                  </div>

                  {/* สารดูดความชื้น */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1">
                    <label className="block text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" /> 3. สารดูดความชื้น (Silica Gel)
                    </label>
                    <select
                      value={formData.silicaGelCondition}
                      onChange={(e) => setFormData({ ...formData, silicaGelCondition: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="good_blue">✅ ปกติ (สีน้ำเงินเข้ม)</option>
                      <option value="good_orange">✅ ปกติ (สีส้ม)</option>
                      <option value="expired_pink">🚨 เสื่อมสภาพ (สีชมพู)</option>
                      <option value="expired_white">🚨 เสื่อมสภาพ (สีขาว)</option>
                    </select>
                  </div>

                  {/* บุชชิ่ง */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1">
                    <label className="block text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" /> 4. บุชชิ่ง (Bushings)
                    </label>
                    <select
                      value={formData.bushingCondition}
                      onChange={(e) => setFormData({ ...formData, bushingCondition: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="good">✅ สะอาด สมบูรณ์</option>
                      <option value="cracked">🚨 แตกร้าว / บิ่น</option>
                      <option value="dirty_flashover">⚠️ มีคราบ Flashover</option>
                      <option value="oil_leak">⚠️ น้ำมันซึมซีล</option>
                    </select>
                  </div>

                  {/* อุณหภูมิ */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1">
                    <label className="block text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-rose-500" /> 5. อุณหภูมิ (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="เช่น 65.5"
                      value={formData.temperatureC}
                      onChange={(e) => setFormData({ ...formData, temperatureC: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* เสียงการสั่น */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1">
                    <label className="block text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-teal-600" /> 6. เสียง/สั่น (Noise)
                    </label>
                    <select
                      value={formData.noiseVibration}
                      onChange={(e) => setFormData({ ...formData, noiseVibration: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="normal">✅ เสียงฮัมปกติ</option>
                      <option value="humming_loud">⚠️ ฮัมดังผิดปกติ</option>
                      <option value="buzzing_spark">🚨 สปาร์ค/เปรี๊ยะๆ</option>
                      <option value="vibrating">⚠️ สั่นสะเทือนแรง</option>
                    </select>
                  </div>

                  {/* กราวด์ */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1 sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 7. จุดต่อสาย/กราวด์ (Grounding)
                    </label>
                    <select
                      value={formData.groundingTerminal}
                      onChange={(e) => setFormData({ ...formData, groundingTerminal: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="secure">✅ แน่นหนา สายกราวด์สมบูรณ์</option>
                      <option value="loose">⚠️ น็อตขั้วต่อหลวม คลอน</option>
                      <option value="overheating">🚨 มีรอยไหม้ / ความร้อนสูง</option>
                      <option value="corroded">⚠️ ผุกร่อนเป็นสนิม</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* รายละเอียดเพิ่มเติม (Notes) */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  รายละเอียดเพิ่มเติม / ข้อแนะนำ (Inspection Notes)
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ระบุรายละเอียดเพิ่มเติม เช่น ตรวจสอบระดับน้ำมันปกติ แรงดันไฟฟ้าฝั่งขาออกคงที่ ไม่พบเสียงดังผิดปกติหรือรอยรั่วซึม..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none transition"
                />
              </div>
            </div>

          </div>

          {/* Right Column (col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 3. พิกัดตำแหน่ง (GPS Location) */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2.5 mb-4">
                3. พิกัดตำแหน่ง (GPS Location)
              </h2>
              <LocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                accuracy={formData.accuracyMeters}
                locationNotes={formData.locationNotes}
                onChange={(lat, lng, acc, notes) =>
                  setFormData({
                    ...formData,
                    latitude: lat,
                    longitude: lng,
                    accuracyMeters: acc,
                    locationNotes: notes || '',
                  })
                }
              />
            </div>

            {/* 4. รูปถ่ายหน้างาน (On-site Photos for Drive) */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2.5 mb-4">
                4. รูปถ่ายหน้างาน (Google Drive)
              </h2>
              <PhotoUploader
                photos={formData.photos}
                onChange={(photos: InspectionPhoto[]) => setFormData({ ...formData, photos })}
              />
            </div>

          </div>
        </div>

        {/* Clean Minimalism Footer Action Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-mono text-[11px]">SYNC_SHEET_ID: {spreadsheetId.slice(0, 6)}...{spreadsheetId.slice(-4)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="font-mono text-[11px]">DRIVE_DIR: {driveFolderId.slice(0, 6)}...{driveFolderId.slice(-4)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs transition w-full sm:w-auto"
            >
              ล้างข้อมูล
            </button>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>บันทึกและส่งข้อมูล (Submit Report)</span>
            </button>
          </div>
        </div>
      </form>

      {/* Safe Confirmation Modal */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
        data={formData}
        isLoading={isSubmitting}
        uploadProgressText={uploadProgressText}
      />
    </div>
  );
};
