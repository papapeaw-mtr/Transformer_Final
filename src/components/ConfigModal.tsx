import React, { useState } from 'react';
import { Settings, FileSpreadsheet, FolderOpen, ExternalLink, RotateCcw, X, Check } from 'lucide-react';
import { DEFAULT_SPREADSHEET_ID } from '../services/googleSheets';
import { DEFAULT_DRIVE_FOLDER_ID } from '../services/googleDrive';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetId: string;
  driveFolderId: string;
  onSave: (sheetId: string, folderId: string) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  spreadsheetId,
  driveFolderId,
  onSave,
}) => {
  const [sheetIdInput, setSheetIdInput] = useState(spreadsheetId);
  const [folderIdInput, setFolderIdInput] = useState(driveFolderId);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(sheetIdInput.trim(), folderIdInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleResetToDefault = () => {
    setSheetIdInput(DEFAULT_SPREADSHEET_ID);
    setFolderIdInput(DEFAULT_DRIVE_FOLDER_ID);
  };

  const currentSheetUrl = `https://docs.google.com/spreadsheets/d/${sheetIdInput}/edit`;
  const currentDriveUrl = `https://drive.google.com/drive/folders/${folderIdInput}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">การตั้งค่า Google Sheet & Drive</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          <p className="text-gray-600">
            ระบบถูกกำหนดค่าเริ่มต้นให้เชื่อมโยงกับ Google Sheet และ Google Drive ตามที่ระบุ สามารถตรวจสอบหรือแก้ไข ID ได้ที่นี่:
          </p>

          {/* Spreadsheet ID Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-gray-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-green-600" /> Google Spreadsheet ID
              </label>
              <a
                href={currentSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 hover:underline"
              >
                เปิด Sheet <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="text"
              required
              value={sheetIdInput}
              onChange={(e) => setSheetIdInput(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Drive Folder ID Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-gray-800 flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-blue-600" /> Google Drive Folder ID
              </label>
              <a
                href={currentDriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 hover:underline"
              >
                เปิดโฟลเดอร์ <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="text"
              required
              value={folderIdInput}
              onChange={(e) => setFolderIdInput(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> คืนค่าเริ่มต้น
            </button>

            {savedSuccess && (
              <span className="text-green-600 font-semibold flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" /> บันทึกเรียบร้อย
              </span>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
