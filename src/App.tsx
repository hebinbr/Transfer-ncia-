import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Laptop,
  Wifi,
  QrCode,
  Scan,
  RefreshCw,
  Edit2,
  Check,
  X,
  Shield,
  Package,
  Clock,
  ArrowLeftRight,
  AlertTriangle,
  FolderDown,
  Loader2,
} from 'lucide-react';
import { isIOS, saveToIOSFiles, saveZipPackageToIOS, triggerHapticFeedback } from './utils/iosFileSaver';
import { Header } from './components/Header';
import { PeerRadar } from './components/PeerRadar';
import { FileUploadZone } from './components/FileUploadZone';
import { FileList } from './components/FileList';
import { QuickTextShare } from './components/QuickTextShare';
import { TransferHistory } from './components/TransferHistory';
import { QrCodeModal } from './components/QrCodeModal';
import { CameraScannerModal } from './components/CameraScannerModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { FilePreviewModal } from './components/FilePreviewModal';
import { NotificationModal } from './components/NotificationModal';
import { NotificationBanner } from './components/NotificationBanner';
import {
  NotificationPermissionState,
  getNotificationPermission,
  notifyReceivedFiles,
  notifyReceivedPackage,
  sendBackgroundNotification,
} from './utils/notificationManager';
import {
  detectDevice,
  getOrCreateDeviceId,
  getSavedDeviceName,
  setSavedDeviceName,
} from './utils/deviceDetector';
import {
  getTransferHistory,
  addTransferHistoryItem,
  clearTransferHistory,
  removeTransferHistoryItem,
} from './utils/historyManager';
import {
  DevicePeer,
  SharedFileItem,
  SharedPackageItem,
  SharedTextItem,
  UserAccount,
  TransferHistoryItem,
} from './types';

export default function App() {
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());
  const [deviceInfo] = useState(() => detectDevice());
  const [deviceName, setDeviceName] = useState<string>(() => getSavedDeviceName());
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(deviceName);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'transfer' | 'history'>('transfer');

  // Room state
  const [roomCode, setRoomCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom && urlRoom.trim()) {
        return urlRoom.trim().toUpperCase();
      }
      const saved = localStorage.getItem('airshare_room_code');
      if (saved && saved.trim()) return saved.trim();
    }
    const randomCode = `AIR-${Math.floor(1000 + Math.random() * 9000)}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('airshare_room_code', randomCode);
    }
    return randomCode;
  });

  // Google Account state
  const [userAccount, setUserAccount] = useState<UserAccount>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlEmail = params.get('email');
      const urlName = params.get('name');
      const urlAvatar = params.get('avatar');
      if (urlEmail) {
        const acc: UserAccount = {
          email: urlEmail,
          name: urlName || urlEmail.split('@')[0],
          avatar: urlAvatar || undefined,
          isLoggedIn: true,
        };
        localStorage.setItem('airshare_google_user', JSON.stringify(acc));
        return acc;
      }

      const saved = localStorage.getItem('airshare_google_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return {
      email: '',
      name: '',
      isLoggedIn: false,
    };
  });

  // Peer & Transfer State
  const [peers, setPeers] = useState<DevicePeer[]>([]);
  const [files, setFiles] = useState<SharedFileItem[]>([]);
  const [packages, setPackages] = useState<SharedPackageItem[]>([]);
  const [texts, setTexts] = useState<SharedTextItem[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  // Transfer History State
  const [transferHistory, setTransferHistory] = useState<TransferHistoryItem[]>(() =>
    getTransferHistory()
  );

  // Modals
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<SharedFileItem | null>(null);
  const [isSwitchRoomOpen, setIsSwitchRoomOpen] = useState(false);
  const [customRoomInput, setCustomRoomInput] = useState('');

  // Notification API state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>(() =>
    getNotificationPermission()
  );
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Incoming transfer quick alert (especially convenient on iPhone to save immediately into Arquivos)
  const [receivedAlert, setReceivedAlert] = useState<{
    id: string;
    title: string;
    subtitle: string;
    kind: 'file' | 'package';
    url: string;
    filename: string;
    mimetype?: string;
    packageId?: string;
    size?: number;
  } | null>(null);
  const [isAlertSaving, setIsAlertSaving] = useState(false);
  const [isAlertSaved, setIsAlertSaved] = useState(false);
  const [alertDownloadProgress, setAlertDownloadProgress] = useState<number | null>(null);

  const handleSaveAlert = async () => {
    if (!receivedAlert) return;
    // Provide a short physical vibration tap response (45ms) when initiating save
    triggerHapticFeedback(45);
    setIsAlertSaving(true);
    setAlertDownloadProgress(0);
    try {
      if (receivedAlert.kind === 'package' && receivedAlert.packageId) {
        await saveZipPackageToIOS(
          receivedAlert.packageId,
          receivedAlert.title,
          receivedAlert.size,
          (percent) => setAlertDownloadProgress(percent)
        );
      } else {
        await saveToIOSFiles({
          url: receivedAlert.url,
          filename: receivedAlert.filename,
          mimetype: receivedAlert.mimetype,
          totalSize: receivedAlert.size,
          onProgress: (percent) => setAlertDownloadProgress(percent),
        });
      }
      setAlertDownloadProgress(100);
      // Success haptic confirmation pattern (double vibration pulse)
      triggerHapticFeedback([40, 50, 40]);
      setIsAlertSaved(true);
      setTimeout(() => {
        setIsAlertSaved(false);
        setReceivedAlert(null);
        setAlertDownloadProgress(null);
      }, 3200);
    } finally {
      setIsAlertSaving(false);
    }
  };

  useEffect(() => {
    const handlePermissionSync = () => {
      setNotificationPermission(getNotificationPermission());
    };
    window.addEventListener('focus', handlePermissionSync);
    document.addEventListener('visibilitychange', handlePermissionSync);
    return () => {
      window.removeEventListener('focus', handlePermissionSync);
      document.removeEventListener('visibilitychange', handlePermissionSync);
    };
  }, []);

  // Audio tone on file/package arrival
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playChime = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio context might be restricted
    }
  };

  // Record history item helper
  const handleRecordTransfer = (record: {
    name: string;
    kind: 'file' | 'package';
    direction: 'sent' | 'received';
    status: 'success' | 'error';
    size: number;
    fileCount?: number;
    mimetype?: string;
    senderName: string;
    targetName?: string;
    errorMessage?: string;
    downloadUrl?: string;
    fileId?: string;
    packageId?: string;
  }) => {
    const newItem = addTransferHistoryItem(record);
    setTransferHistory(prev => [newItem, ...prev]);
  };

  const handleClearHistory = () => {
    clearTransferHistory();
    setTransferHistory([]);
  };

  const handleRemoveHistoryItem = (id: string) => {
    removeTransferHistoryItem(id);
    setTransferHistory(prev => prev.filter(item => item.id !== id));
  };

  // SSE Real-time connection
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('peerId', deviceId);
    params.set('room', roomCode);
    params.set('name', deviceName);
    params.set('type', deviceInfo.type);
    params.set('platform', deviceInfo.platform);
    if (userAccount.isLoggedIn) {
      params.set('userEmail', userAccount.email);
      params.set('userName', userAccount.name);
      if (userAccount.avatar) params.set('userAvatar', userAccount.avatar);
    }

    const eventSource = new EventSource(`/api/events?${params.toString()}`);

    eventSource.addEventListener('connected', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.peers) setPeers(data.peers);
        if (data.files) setFiles(data.files.reverse());
        if (data.packages) setPackages(data.packages.reverse());
        if (data.texts) setTexts(data.texts.reverse());
      } catch (err) {
        console.error('Error parsing connected event:', err);
      }
    });

    eventSource.addEventListener('peer-joined', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.peers) setPeers(data.peers);
      } catch (err) {
        console.error('Error parsing peer-joined:', err);
      }
    });

    eventSource.addEventListener('peer-left', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.peers) setPeers(data.peers);
      } catch (err) {
        console.error('Error parsing peer-left:', err);
      }
    });

    eventSource.addEventListener('files-added', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.files) {
          setFiles(prev => [...data.files, ...prev]);
          if (data.senderId !== deviceId) {
            playChime();
            // Trigger browser Notification API if tab is in background
            notifyReceivedFiles(data.files, data.files[0]?.senderName || 'Dispositivo');
            // Trigger quick save alert for iOS / iPhone users
            if (data.files.length > 0) {
              const first = data.files[0];
              setReceivedAlert({
                id: first.id,
                title: data.files.length === 1 ? first.filename : `${data.files.length} arquivos recebidos`,
                subtitle: `Enviado por ${first.senderName}`,
                kind: 'file',
                url: `/api/download/${first.id}`,
                filename: first.filename,
                mimetype: first.mimetype,
                size: first.size,
              });
            }
            // Record received files in history
            data.files.forEach((f: SharedFileItem) => {
              handleRecordTransfer({
                name: f.filename,
                kind: 'file',
                direction: 'received',
                status: 'success',
                size: f.size,
                mimetype: f.mimetype,
                senderName: f.senderName,
                targetName: deviceName,
                downloadUrl: `/api/download/${f.id}`,
                fileId: f.id,
              });
            });
          }
        }
      } catch (err) {
        console.error('Error parsing files-added:', err);
      }
    });

    eventSource.addEventListener('package-added', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.package) {
          setPackages(prev => [data.package, ...prev]);
          if (data.package.senderId !== deviceId) {
            playChime();
            // Trigger browser Notification API if tab is in background
            notifyReceivedPackage(data.package);
            // Trigger quick save alert for iOS / iPhone users
            setReceivedAlert({
              id: data.package.id,
              title: data.package.name,
              subtitle: `Pacote ordenado com ${data.package.files.length} arquivos · Por ${data.package.senderName}`,
              kind: 'package',
              url: `/api/packages/${data.package.id}/zip`,
              filename: `${data.package.name}.zip`,
              packageId: data.package.id,
              size: data.package.totalSize,
            });
            // Record received package in history
            handleRecordTransfer({
              name: data.package.name,
              kind: 'package',
              direction: 'received',
              status: 'success',
              size: data.package.totalSize,
              fileCount: data.package.files.length,
              senderName: data.package.senderName,
              targetName: deviceName,
              downloadUrl: `/api/packages/${data.package.id}/zip`,
              packageId: data.package.id,
            });
          }
        }
      } catch (err) {
        console.error('Error parsing package-added:', err);
      }
    });

    eventSource.addEventListener('package-deleted', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.packageId) {
          setPackages(prev => prev.filter(p => p.id !== data.packageId));
        }
      } catch (err) {
        console.error('Error parsing package-deleted:', err);
      }
    });

    eventSource.addEventListener('text-added', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.item) {
          setTexts(prev => [data.item, ...prev]);
          if (data.item.senderId !== deviceId) {
            playChime();
            sendBackgroundNotification({
              title: '💬 Texto compartilhado recebido',
              body: `${data.item.senderName}: "${data.item.text.slice(0, 80)}${data.item.text.length > 80 ? '...' : ''}"`,
              tag: `text-${data.item.id}`,
            });
          }
        }
      } catch (err) {
        console.error('Error parsing text-added:', err);
      }
    });

    eventSource.addEventListener('file-deleted', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.fileId) {
          setFiles(prev => prev.filter(f => f.id !== data.fileId));
        }
      } catch (err) {
        console.error('Error parsing file-deleted:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [deviceId, roomCode, deviceName, deviceInfo, userAccount]);

  const handleSaveDeviceName = () => {
    if (tempName.trim()) {
      setDeviceName(tempName.trim());
      setSavedDeviceName(tempName.trim());
      setIsEditingName(false);
    }
  };

  const handleGoogleLogin = (email: string, name: string, avatar?: string) => {
    const acc: UserAccount = {
      email,
      name,
      avatar,
      isLoggedIn: true,
    };
    setUserAccount(acc);
    localStorage.setItem('airshare_google_user', JSON.stringify(acc));

    const emailRoom = `GOOGLE-${email.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()}`;
    setRoomCode(emailRoom);
    localStorage.setItem('airshare_room_code', emailRoom);
  };

  const handleGoogleLogout = () => {
    const emptyAcc: UserAccount = { email: '', name: '', isLoggedIn: false };
    setUserAccount(emptyAcc);
    localStorage.removeItem('airshare_google_user');
  };

  const handleJoinRoom = (code: string) => {
    setRoomCode(code);
    localStorage.setItem('airshare_room_code', code);
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    try {
      await fetch(`/api/packages/${packageId}`, { method: 'DELETE' });
      setPackages(prev => prev.filter(p => p.id !== packageId));
    } catch (err) {
      console.error('Failed to delete package:', err);
    }
  };

  const targetPeer = peers.find(p => p.id === selectedTargetId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* 3-Zone Top Bar */}
      <Header
        currentDevice={{
          type: deviceInfo.type,
          platform: deviceInfo.platform,
          name: deviceName,
        }}
        roomCode={roomCode}
        userAccount={userAccount}
        peerCount={peers.length}
        historyCount={transferHistory.length}
        activeTab={activeTab}
        notificationPermission={notificationPermission}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        onTabChange={setActiveTab}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenScannerModal={() => setIsScannerModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSwitchRoom={() => {
          setCustomRoomInput(roomCode);
          setIsSwitchRoomOpen(true);
        }}
      />

      {/* Gentle Banner for Browser Notification Permission */}
      <NotificationBanner
        permissionState={notificationPermission}
        onPermissionChange={setNotificationPermission}
        onOpenSettings={() => setIsNotificationModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Subheader / Device Presence Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900/90 dark:via-slate-900/60 dark:to-indigo-950/40 border border-slate-300 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
              {deviceInfo.type === 'mobile' ? (
                <Smartphone className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              ) : (
                <Laptop className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={tempName}
                      onChange={e => setTempName(e.target.value)}
                      className="bg-white dark:bg-slate-950 border border-indigo-600 rounded px-2 py-0.5 text-xs text-slate-900 dark:text-white outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveDeviceName}
                      className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="p-1 rounded bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      {deviceName}
                    </h1>
                    <button
                      onClick={() => {
                        setTempName(deviceName);
                        setIsEditingName(true);
                      }}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5"
                      title="Editar nome deste aparelho"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </>
                )}

                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 dark:text-emerald-400 dark:bg-emerald-950/60 dark:border-emerald-800/60 rounded px-1.5 py-0.2">
                  Pronto para transferir
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                {userAccount.isLoggedIn ? (
                  <span>
                    Conectado com a conta Google <strong className="text-indigo-700 dark:text-indigo-300 font-bold">{userAccount.email}</strong> · Histórico sincronizado por data com status de sucesso e falhas.
                  </span>
                ) : (
                  <span>
                    Transfira pacotes ordenados entre iPhone e Computador e consulte o histórico por data.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {/* View Switch Button */}
            <button
              onClick={() => setActiveTab(activeTab === 'transfer' ? 'history' : 'transfer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white shadow-xs'
              }`}
            >
              {activeTab === 'history' ? (
                <>
                  <ArrowLeftRight className="w-4 h-4 text-white" />
                  <span>Voltar para Transferência</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Ver Histórico por Data ({transferHistory.length})</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 dark:bg-slate-800/90 dark:hover:bg-slate-800 dark:text-slate-200 dark:hover:text-white text-xs font-semibold dark:border-slate-700 transition-colors shadow-xs"
            >
              <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Gerar QR Code</span>
            </button>
          </div>
        </div>

        {/* 403 Mobile Safari Guidance Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-xs text-amber-950 dark:text-amber-200 shadow-xs transition-colors">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-300">Deu erro "Google 403 - Você não tem acesso" ao escanear com o iPhone?</span>
              <span className="block sm:inline sm:ml-1 text-slate-700 dark:text-slate-300 font-medium">
                No Safari do seu iPhone, basta entrar em <strong className="text-slate-900 dark:text-white">accounts.google.com</strong> com a conta <strong className="text-amber-800 dark:text-amber-300 font-bold">{userAccount.isLoggedIn ? userAccount.email : 'contosf47@gmail.com'}</strong> para autorizar o acesso.
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-300 dark:hover:text-white font-semibold text-[11px] whitespace-nowrap transition-colors border border-amber-600 dark:border-amber-500/40 shadow-xs"
          >
            Abrir QR Code e Instruções
          </button>
        </div>

        {/* View Switch Condition */}
        {activeTab === 'history' ? (
          <TransferHistory
            history={transferHistory}
            onClearHistory={handleClearHistory}
            onRemoveItem={handleRemoveHistoryItem}
          />
        ) : (
          /* 2-Column Responsive Transfer Dashboard */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Connected Devices Radar & Upload Box */}
            <div className="lg:col-span-6 space-y-6">
              <PeerRadar
                currentPeerId={deviceId}
                peers={peers}
                selectedTargetId={selectedTargetId}
                onSelectTarget={setSelectedTargetId}
                onOpenQrModal={() => setIsQrModalOpen(true)}
              />

              <FileUploadZone
                roomCode={roomCode}
                currentPeerId={deviceId}
                senderName={deviceName}
                targetPeerId={selectedTargetId}
                targetPeerName={targetPeer?.name}
                userEmail={userAccount.isLoggedIn ? userAccount.email : undefined}
                onFilesUploaded={() => {}}
                onRecordTransfer={handleRecordTransfer}
              />
            </div>

            {/* Right Column: Received Files, Packages & Clipboard Text Share */}
            <div className="lg:col-span-6 space-y-6">
              <FileList
                files={files}
                packages={packages}
                currentPeerId={deviceId}
                onPreview={setPreviewFile}
                onDeleteFile={handleDeleteFile}
                onDeletePackage={handleDeletePackage}
              />

              <QuickTextShare
                texts={texts}
                roomCode={roomCode}
                senderId={deviceId}
                senderName={deviceName}
                onTextSent={() => {}}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-600 dark:text-slate-500 font-medium transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AirShare · Envio ordenado e histórico de transferências entre iPhone & PC</span>
          <div className="flex items-center gap-4 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1 font-semibold">
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Transferência Direta e Segura
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Histórico Separado por Data
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        roomCode={roomCode}
        userAccount={userAccount}
      />

      <CameraScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onJoinRoom={handleJoinRoom}
      />

      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        userAccount={userAccount}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
      />

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* Switch Room Modal */}
      {isSwitchRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-5 shadow-2xl transition-colors">
            <button
              onClick={() => setIsSwitchRoomOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Trocar Código da Sala
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 font-medium">
              Digite o código de pareamento para entrar na mesma rede do seu outro dispositivo.
            </p>
            <input
              type="text"
              value={customRoomInput}
              onChange={e => setCustomRoomInput(e.target.value.toUpperCase())}
              placeholder="Ex: AIR-4890"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold tracking-wider text-slate-900 dark:text-white uppercase outline-none mb-3 shadow-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSwitchRoomOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (customRoomInput.trim()) {
                    handleJoinRoom(customRoomInput.trim());
                    setIsSwitchRoomOpen(false);
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
              >
                Entrar na Sala
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Incoming Transfer Prompt (Immediate 1-tap Save to iOS Files / Download) */}
      {receivedAlert && (
        <aside
          aria-label="Notificação de transferência recebida"
          className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-slide-up"
        >
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-sky-500/80 dark:border-sky-500 shadow-2xl shadow-sky-950/30 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  <FolderDown className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block">
                    {deviceInfo.platform === 'iOS' ? '📱 Recebido no iPhone' : '📥 Arquivo Recebido'}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={receivedAlert.title}>
                    {receivedAlert.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {receivedAlert.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceivedAlert(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Fechar alerta"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleSaveAlert}
                disabled={isAlertSaving}
                className={`relative overflow-hidden flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center transition-all duration-300 shadow-md active:scale-95 group ${
                  isAlertSaved
                    ? 'animate-success-pop bg-emerald-600 text-white ring-4 ring-emerald-400/40 shadow-emerald-600/30'
                    : isAlertSaving
                    ? 'bg-sky-800 text-white cursor-wait ring-2 ring-sky-400/40 shadow-sky-700/30'
                    : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/30 hover:shadow-sky-600/40 ring-2 ring-sky-400/30'
                }`}
                title="Salvar direto no app Arquivos com resposta tátil (navigator.vibrate)"
              >
                {/* Visual Download Progress Bar Fill with smooth width transition */}
                {isAlertSaving && alertDownloadProgress !== null && (
                  <div
                    className="absolute inset-y-0 left-0 bg-sky-500/90 dark:bg-sky-500/80 transition-all duration-200 ease-out z-0"
                    style={{ width: `${alertDownloadProgress}%` }}
                  />
                )}

                {/* Button Content with smooth state transition */}
                <div className="relative z-10 flex items-center justify-center gap-2 w-full">
                  {isAlertSaving ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                        <span className="truncate font-semibold">Baixando...</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold tabular-nums ml-2 bg-black/30 text-white px-2 py-0.5 rounded-full shrink-0 shadow-xs">
                        {alertDownloadProgress !== null ? `${alertDownloadProgress}%` : '0%'}
                      </span>
                    </div>
                  ) : isAlertSaved ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </span>
                      <span className="font-bold">Salvo em Arquivos!</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 w-full">
                      <FolderDown className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                      <span>Salvar no App Arquivos</span>
                    </div>
                  )}
                </div>
              </button>

              <a
                href={receivedAlert.url}
                download={receivedAlert.filename}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-transparent text-slate-800 dark:text-white text-xs font-semibold flex items-center justify-center transition-colors shadow-xs"
                title="Baixar diretamente"
              >
                Baixar
              </a>
            </div>
          </div>
        </aside>
      )}

      {/* Browser Notification API Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        permissionState={notificationPermission}
        onPermissionChange={setNotificationPermission}
      />
    </div>
  );
}
