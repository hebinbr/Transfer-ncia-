import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import {
  NotificationPermissionState,
  requestNotificationPermission,
  sendTestNotification,
} from '../utils/notificationManager';

interface NotificationBannerProps {
  permissionState: NotificationPermissionState;
  onPermissionChange: (state: NotificationPermissionState) => void;
  onOpenSettings: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  permissionState,
  onPermissionChange,
  onOpenSettings,
}) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('airshare_notif_banner_dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  if (permissionState !== 'default' || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('airshare_notif_banner_dismissed', 'true');
  };

  const handleEnable = async () => {
    const res = await requestNotificationPermission();
    onPermissionChange(res);
    if (res === 'granted') {
      sendTestNotification();
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-3 pb-1">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-white dark:bg-gradient-to-r dark:from-indigo-950/70 dark:via-slate-900/90 dark:to-sky-950/70 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl shadow-md dark:shadow-indigo-950/20 backdrop-blur-md transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-200">
              Receba avisos quando arquivos chegarem e a aba estiver em segundo plano
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              Notificações nativas do navegador sem interrupções.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <button
            onClick={handleEnable}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            Ativar Alertas
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Ignorar por enquanto"
            aria-label="Fechar banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
