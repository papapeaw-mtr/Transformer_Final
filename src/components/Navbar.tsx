import React from 'react';
import { 
  Zap, 
  FileSpreadsheet, 
  FolderOpen, 
  Settings, 
  LogOut, 
  FileEdit, 
  History, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  user: User | null;
  accessToken: string | null;
  activeTab: 'form' | 'history';
  setActiveTab: (tab: 'form' | 'history') => void;
  spreadsheetId: string;
  driveFolderId: string;
  onOpenConfig: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  isSigningIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  accessToken,
  activeTab,
  setActiveTab,
  spreadsheetId,
  driveFolderId,
  onOpenConfig,
  onSignIn,
  onSignOut,
  isSigningIn,
}) => {
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  const driveUrl = `https://drive.google.com/drive/folders/${driveFolderId}`;

  return (
    <header className="bg-white text-gray-800 sticky top-0 z-40 border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-gray-900">
                  ระบบรายงานตรวจสอบหม้อแปลง
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium hidden sm:block">
                Transformer Inspection Portal • Google Workspace Integrated
              </p>
            </div>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Google Integration Status Badge */}
            {accessToken ? (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Connected to Sheets & Drive</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-full border border-gray-200 text-xs font-medium">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Offline / Not Signed In</span>
              </div>
            )}

            {/* Quick External Links */}
            <div className="hidden lg:flex items-center gap-1.5">
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="เปิดดู Google Sheet"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                <span>Sheet</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>

              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="เปิดโฟลเดอร์ Google Drive"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200 transition"
              >
                <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Drive</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            </div>

            {/* Config button */}
            <button
              onClick={onOpenConfig}
              title="ตั้งค่า Spreadsheet และ Drive Folder"
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition border border-gray-200"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Auth Section */}
            {user && accessToken ? (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-xl">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-full border border-gray-300"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-gray-900 max-w-[110px] truncate leading-tight">
                    {user.displayName || user.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-gray-400 leading-tight">เจ้าหน้าที่ภาคสนาม</p>
                </div>
                <button
                  onClick={onSignOut}
                  title="ออกจากระบบ"
                  className="p-1 text-gray-400 hover:text-rose-500 transition ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5 bg-white rounded-full p-0.5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isSigningIn ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบ Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-2 border-t border-gray-100 pt-2 pb-2">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'form'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            แบบฟอร์มบันทึกการตรวจ
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            ประวัติรายงานใน Google Sheet
          </button>
        </div>
      </div>
    </header>
  );
};
