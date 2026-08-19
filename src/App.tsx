import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout 
} from './lib/firebase';
import { Navbar } from './components/Navbar';
import { InspectionForm } from './components/InspectionForm';
import { InspectionHistory } from './components/InspectionHistory';
import { ConfigModal } from './components/ConfigModal';
import { DEFAULT_SPREADSHEET_ID } from './services/googleSheets';
import { DEFAULT_DRIVE_FOLDER_ID } from './services/googleDrive';
import { 
  FileSpreadsheet, 
  FolderOpen, 
  CheckCircle2, 
  Zap, 
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [spreadsheetId, setSpreadsheetId] = useState(DEFAULT_SPREADSHEET_ID);
  const [driveFolderId, setDriveFolderId] = useState(DEFAULT_DRIVE_FOLDER_ID);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setAuthError(null);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err.message || 'เกิดข้อผิดพลาดในการลงชื่อเข้าใช้ Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSuccessSubmit = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1F2937] flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navbar in Clean Minimalism style */}
      <Navbar
        user={user}
        accessToken={accessToken}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        spreadsheetId={spreadsheetId}
        driveFolderId={driveFolderId}
        onOpenConfig={() => setIsConfigOpen(true)}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isSigningIn={isSigningIn}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Clean Minimalism Auth Notice Banner when not connected */}
        {!accessToken && (
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 text-xs font-semibold">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Google Workspace Sync Ready</span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                ลงชื่อเข้าใช้ Google เพื่อเริ่มต้นบันทึกและส่งรายงานการตรวจเช็คหม้อแปลง
              </h2>

              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                ระบบจะจัดเก็บตารางบันทึกผลการตรวจสอบลง <strong>Google Sheet</strong> และอัปโหลดรูปภาพหน้างานจริงลง <strong>Google Drive</strong> โดยอัตโนมัติ
              </p>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 mt-2">
                  {authError}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3 shrink-0">
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-blue-200 disabled:opacity-60 cursor-pointer w-full sm:w-auto justify-center"
              >
                <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                {isSigningIn ? 'กำลังเชื่อมต่อ...' : 'ลงชื่อเข้าใช้ Google'}
              </button>

              <div className="flex items-center gap-3 text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> OAuth 2.0 ปลอดภัย
                </span>
              </div>
            </div>
          </div>
        )}

        {/* View Content based on active tab */}
        {activeTab === 'form' ? (
          <InspectionForm
            accessToken={accessToken}
            userEmail={user?.email}
            spreadsheetId={spreadsheetId}
            driveFolderId={driveFolderId}
            onSuccessSubmit={handleSuccessSubmit}
            onRequestSignIn={handleSignIn}
          />
        ) : (
          <InspectionHistory
            accessToken={accessToken}
            spreadsheetId={spreadsheetId}
            driveFolderId={driveFolderId}
            onRequestSignIn={handleSignIn}
            refreshTrigger={refreshTrigger}
          />
        )}
      </main>

      {/* Clean Minimalism Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-8 mt-auto text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-mono text-[11px] text-gray-600">SHEET: {spreadsheetId.slice(0, 8)}...</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="font-mono text-[11px] text-gray-600">DRIVE: {driveFolderId.slice(0, 8)}...</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> สเปรดชีต Google Sheet
            </a>
            <a
              href={`https://drive.google.com/drive/folders/${driveFolderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
            >
              <FolderOpen className="w-3.5 h-3.5" /> โฟลเดอร์รูปภาพ Drive
            </a>
          </div>
        </div>
      </footer>

      {/* Config Settings Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        spreadsheetId={spreadsheetId}
        driveFolderId={driveFolderId}
        onSave={(sheetId, folderId) => {
          setSpreadsheetId(sheetId);
          setDriveFolderId(folderId);
        }}
      />
    </div>
  );
}
