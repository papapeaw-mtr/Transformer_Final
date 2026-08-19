import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Search, 
  ExternalLink, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileSpreadsheet, 
  FolderOpen, 
  Calendar, 
  User, 
  Eye, 
  X,
  Image as ImageIcon
} from 'lucide-react';
import { InspectionRecord, OverallStatus } from '../types';
import { fetchInspectionHistory } from '../services/googleSheets';

interface InspectionHistoryProps {
  accessToken: string | null;
  spreadsheetId: string;
  driveFolderId: string;
  onRequestSignIn: () => void;
  refreshTrigger: number;
}

export const InspectionHistory: React.FC<InspectionHistoryProps> = ({
  accessToken,
  spreadsheetId,
  driveFolderId,
  onRequestSignIn,
  refreshTrigger,
}) => {
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OverallStatus>('all');
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadRecords = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await fetchInspectionHistory(accessToken, spreadsheetId);
      setRecords(data);
    } catch (err: any) {
      console.error('Failed to load history:', err);
      setErrorMsg(`ไม่สามารถดึงข้อมูลจาก Google Sheet ได้: ${err.message || 'โปรดลองใหม่อีกครั้ง'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadRecords();
    }
  }, [accessToken, refreshTrigger, spreadsheetId]);

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.transformerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.inspectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.notes.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || r.overallStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: OverallStatus) => {
    switch (status) {
      case 'normal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> ปกติ
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> เฝ้าระวัง
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> ชำรุด/ด่วน
          </span>
        );
    }
  };

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  const driveUrl = `https://drive.google.com/drive/folders/${driveFolderId}`;

  if (!accessToken) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center space-y-4 max-w-lg mx-auto shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">ดูประวัติรายงานการตรวจสอบ</h3>
          <p className="text-xs text-gray-500 mt-1">
            กรุณาลงชื่อเข้าใช้ด้วย Google เพื่ออ่านข้อมูลรายงานที่บันทึกไว้ใน Google Sheet
          </p>
        </div>
        <button
          onClick={onRequestSignIn}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition shadow-md shadow-blue-200 cursor-pointer"
        >
          ลงชื่อเข้าใช้ด้วย Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header & Quick Links Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg text-gray-900">ประวัติรายงานการตรวจสอบหม้อแปลงไฟฟ้า</h2>
            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">
              {records.length} รายการ
            </span>
          </div>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            ข้อมูลอัปเดตแบบ Real-time โดยตรงจาก Google Sheet
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
            <span>เปิด Google Sheet</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </a>

          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200 transition"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>เปิด Google Drive</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </a>

          <button
            onClick={loadRecords}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="ค้นหาหมายเลขหม้อแปลง, ผู้ตรวจ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            ทั้งหมด ({records.length})
          </button>
          <button
            onClick={() => setStatusFilter('normal')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'normal'
                ? 'bg-green-600 text-white shadow-xs'
                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            }`}
          >
            ปกติ ({records.filter((r) => r.overallStatus === 'normal').length})
          </button>
          <button
            onClick={() => setStatusFilter('warning')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'warning'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            เฝ้าระวัง ({records.filter((r) => r.overallStatus === 'warning').length})
          </button>
          <button
            onClick={() => setStatusFilter('critical')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'critical'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            ชำรุด/ด่วน ({records.filter((r) => r.overallStatus === 'critical').length})
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">กำลังโหลดข้อมูลจาก Google Sheet...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center space-y-2">
          <FileSpreadsheet className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-semibold text-gray-700">ไม่พบรายการรายงานที่ค้นหา</p>
          <p className="text-xs text-gray-400">
            {records.length === 0
              ? 'ยังไม่มีการบันทึกรายงานใน Google Sheet นี้ สามารถเริ่มต้นกรอกรายงานใหม่ได้ทันที'
              : 'ลองปรับคำค้นหาหรือตัวกรองสถานะใหม่'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">วัน-เวลาที่ตรวจ</th>
                  <th className="px-4 py-3.5">หมายเลขหม้อแปลง</th>
                  <th className="px-4 py-3.5">ผู้ตรวจสอบ</th>
                  <th className="px-4 py-3.5">ผลการตรวจ</th>
                  <th className="px-4 py-3.5">พิกัด GPS</th>
                  <th className="px-4 py-3.5">รูปถ่าย Drive</th>
                  <th className="px-4 py-3.5 text-right">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50/80 transition">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-gray-800">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {record.timestamp}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                        {record.transformerId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-gray-400" />
                        {record.inspectorName}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(record.overallStatus)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {record.mapUrl && record.mapUrl !== '-' ? (
                        <a
                          href={record.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 font-mono hover:underline font-medium"
                        >
                          <MapPin className="w-3 h-3 text-blue-500" />
                          {record.latitude ? `${parseFloat(record.latitude).toFixed(4)}, ${parseFloat(record.longitude).toFixed(4)}` : 'ดูแผนที่'}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {record.photoLinks && record.photoLinks !== '-' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium text-[11px]">
                          <ImageIcon className="w-3 h-3" /> มีภาพแนบ
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> ดูฉบับเต็ม
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-400" />
                <h3 className="font-bold text-base">
                  รายงานการตรวจ: หม้อแปลง {selectedRecord.transformerId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-gray-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-400 block text-[11px]">หมายเลขหม้อแปลง:</span>
                  <span className="font-bold text-sm text-gray-900 font-mono">{selectedRecord.transformerId}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">ผู้ตรวจสอบ:</span>
                  <span className="font-semibold text-gray-800">{selectedRecord.inspectorName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">วันและเวลา:</span>
                  <span className="text-gray-800">{selectedRecord.timestamp}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">ผลการตรวจรวม:</span>
                  <div className="mt-0.5">{getStatusBadge(selectedRecord.overallStatus)}</div>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">อุณหภูมิ (°C):</span>
                  <span className="font-medium text-gray-800">{selectedRecord.temperature}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">พิกัด GPS:</span>
                  {selectedRecord.mapUrl && selectedRecord.mapUrl !== '-' ? (
                    <a
                      href={selectedRecord.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1 font-mono font-medium"
                    >
                      <MapPin className="w-3 h-3" /> เปิด Google Maps
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-3.5 py-2 bg-gray-100 font-bold text-gray-700 text-xs border-b border-gray-200">
                  รายการตรวจสอบทางเทคนิค
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="grid grid-cols-2 p-2.5">
                    <span className="text-gray-500">1. ระดับน้ำมันหม้อแปลง:</span>
                    <span className="font-medium text-gray-800">{selectedRecord.oilLevel}</span>
                  </div>
                  <div className="grid grid-cols-2 p-2.5">
                    <span className="text-gray-500">2. สภาพตัวถังและครีบ:</span>
                    <span className="font-medium text-gray-800">{selectedRecord.tankCondition}</span>
                  </div>
                  <div className="grid grid-cols-2 p-2.5">
                    <span className="text-gray-500">3. สารดูดความชื้น (Silica Gel):</span>
                    <span className="font-medium text-gray-800">{selectedRecord.silicaGel}</span>
                  </div>
                  <div className="grid grid-cols-2 p-2.5">
                    <span className="text-gray-500">4. สภาพบุชชิ่ง (HV/LV):</span>
                    <span className="font-medium text-gray-800">{selectedRecord.bushing}</span>
                  </div>
                  <div className="grid grid-cols-2 p-2.5">
                    <span className="text-gray-500">5. เสียงและการสั่นสะเทือน:</span>
                    <span className="font-medium text-gray-800">{selectedRecord.noise}</span>
                  </div>
                  <div className="grid grid-cols-2 p-2.5">
                    <span className="text-gray-500">6. ระบบกราวด์และจุดต่อ:</span>
                    <span className="font-medium text-gray-800">{selectedRecord.grounding}</span>
                  </div>
                </div>
              </div>

              {selectedRecord.notes && selectedRecord.notes !== '-' && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1">
                  <span className="font-bold text-amber-900 block">หมายเหตุและข้อเสนอแนะ:</span>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.notes}</p>
                </div>
              )}

              {selectedRecord.photoLinks && selectedRecord.photoLinks !== '-' && (
                <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-2">
                  <span className="font-bold text-blue-900 block flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-blue-600" /> รูปภาพที่แนบใน Google Drive:
                  </span>
                  <div className="space-y-1.5">
                    {selectedRecord.photoLinks.split('\n').map((line, idx) => {
                      const match = line.match(/(https:\/\/drive\.google\.com\S+)/);
                      const url = match ? match[1] : null;
                      const label = url ? line.replace(url, '').replace(/:\s*$/, '') : line;
                      return (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-blue-100">
                          <span className="font-medium text-gray-800 truncate max-w-xs">{label || `รูปภาพ #${idx + 1}`}</span>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 hover:underline shrink-0 ml-2"
                            >
                              เปิดดูภาพ <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-gray-400">{line}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
