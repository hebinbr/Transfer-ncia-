import React from 'react';
import {
  QrCode,
  Laptop,
  Smartphone,
  Scan,
  RefreshCw,
  Check,
  Copy,
  Clock,
  ArrowLeftRight,
  Bell,
  BellOff,
  Sun,
  Moon,
} from 'lucide-react';
import { UserAccount, DevicePeer } from '../types';
import { NotificationPermissionState } from '../utils/notificationManager';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentDevice: {
    type: 'mobile' | 'desktop';
    platform: DevicePeer['platform'];
    name: string;
  };
  roomCode: string;
  userAccount: UserAccount;
  peerCount: number;
  historyCount: number;
  activeTab: 'transfer' | 'history';
  notificationPermission: NotificationPermissionState;
  onOpenNotificationModal: () => void;
  onTabChange: (tab: 'transfer' | 'history') => void;
  onOpenQrModal: () => void;
  onOpenScannerModal: () => void;
  onOpenAuthModal: () => void;
  onSwitchRoom: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDevice,
  roomCode,
  userAccount,
  peerCount,
  historyCount,
  activeTab,
  notificationPermission,
  onOpenNotificationModal,
  onTabChange,
  onOpenQrModal,
  onOpenScannerModal,
  onOpenAuthModal,
  onSwitchRoom,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [copied, setCopied] = React.useState(false);

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-lg">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                AirShare
              </span>
              <span className="hidden sm:inline-block text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950/80 dark:border-indigo-800/60 rounded px-1.5 py-0.5">
                iPhone & PC
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation & Room Info */}
        <div className="hidden md:flex items-center gap-3">
          {/* Main View Segmented Control */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium">
            <button
              onClick={() => onTabChange('transfer')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
                activeTab === 'transfer'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Transferir</span>
            </button>
            <button
              onClick={() => onTabChange('history')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Histórico</span>
              {historyCount > 0 && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-semibold">
                  {historyCount}
                </span>
              )}
            </button>
          </div>

          {/* Room info */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Sala:</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-300 tracking-wider">
              {roomCode}
            </span>
            <button
              onClick={handleCopyRoom}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors p-0.5"
              title="Copiar código da sala"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={onSwitchRoom}
              className="text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white transition-colors text-[11px] flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-3 h-3" />
              Trocar
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 rounded-lg px-2.5 py-1.5 font-medium">
            {currentDevice.type === 'mobile' ? (
              <Smartphone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            ) : (
              <Laptop className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            )}
            <span className="text-slate-800 dark:text-slate-300 max-w-[120px] truncate">{currentDevice.name}</span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
              {peerCount} {peerCount === 1 ? 'dispositivo' : 'dispositivos'}
            </span>
          </div>
        </div>

        {/* Zone 3: Actions (Theme Toggle, Notifications, QR Code, Scanner, Google Login) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Mobile History View Button */}
          <button
            onClick={() => onTabChange(activeTab === 'history' ? 'transfer' : 'history')}
            className={`md:hidden flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-white border-slate-300 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
            }`}
            title="Ver histórico de transferências"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">{historyCount}</span>
          </button>

          {/* High-Contrast Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className={`flex items-center justify-center p-2 rounded-lg border transition-all active:scale-95 shadow-sm ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-amber-300 hover:text-amber-200 hover:border-amber-400/40 hover:bg-slate-800'
                : 'bg-white border-slate-300 text-slate-700 hover:text-indigo-600 hover:border-indigo-400 hover:bg-slate-50'
            }`}
            title={
              isDark
                ? 'Alternar para tema claro de alto contraste'
                : 'Alternar para modo escuro'
            }
            aria-label={
              isDark
                ? 'Alternar para tema claro de alto contraste'
                : 'Alternar para modo escuro'
            }
          >
            {isDark ? (
              <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Browser Notification Button */}
          <button
            onClick={onOpenNotificationModal}
            className={`relative flex items-center justify-center p-2 rounded-lg border transition-all active:scale-95 shadow-sm ${
              notificationPermission === 'granted'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100 dark:bg-slate-900 dark:border-indigo-500/40 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:border-indigo-400'
                : notificationPermission === 'denied'
                ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 dark:bg-slate-900 dark:border-rose-500/40 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:border-rose-400'
                : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-700'
            }`}
            title={
              notificationPermission === 'granted'
                ? 'Notificações ativadas para quando a aba estiver em segundo plano (clique para testar)'
                : notificationPermission === 'denied'
                ? 'Notificações bloqueadas pelo navegador (clique para ajuda)'
                : 'Ativar alertas de transferência em segundo plano'
            }
          >
            {notificationPermission === 'denied' ? (
              <BellOff className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            {notificationPermission === 'granted' && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 ring-2 ring-white dark:ring-slate-950" />
            )}
            {notificationPermission === 'default' && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse ring-2 ring-white dark:ring-slate-950" />
            )}
          </button>

          {/* QR Code Button */}
          <button
            onClick={onOpenQrModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/20 active:scale-95"
            title="Gerar QR Code para conectar iPhone"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Gerar QR Code</span>
            <span className="sm:hidden">QR</span>
          </button>

          {/* Camera Scanner Button */}
          <button
            onClick={onOpenScannerModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-800 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 dark:text-slate-200 dark:hover:text-white transition-all active:scale-95 shadow-sm dark:shadow-none"
            title="Escanear QR Code com a câmera"
          >
            <Scan className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="hidden sm:inline">Escanear</span>
          </button>

          {/* Google Account Profile Button */}
          <button
            onClick={onOpenAuthModal}
            className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              userAccount.isLoggedIn
                ? 'bg-white border-indigo-200 text-slate-800 hover:border-indigo-400 dark:bg-slate-900 dark:border-indigo-500/40 dark:text-slate-200 dark:hover:border-indigo-500 shadow-sm'
                : 'bg-slate-900 text-white hover:bg-slate-800 border-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 dark:border-transparent shadow-sm'
            }`}
          >
            {userAccount.isLoggedIn ? (
              <>
                {userAccount.avatar ? (
                  <img
                    src={userAccount.avatar}
                    alt={userAccount.name}
                    className="w-5 h-5 rounded-full object-cover border border-indigo-400/30"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                    {userAccount.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline max-w-[120px] truncate">{userAccount.name}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden sm:inline">Google Login</span>
                <span className="sm:hidden">Entrar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

