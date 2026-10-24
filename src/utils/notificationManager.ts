import { formatBytes } from './formatters';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

// High-resolution SVG data URI icon for notifications
const AIRSHARE_NOTIFICATION_ICON = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="%236366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="24" height="24" rx="6" fill="%230f172a"/><path d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6L16 6a5 5 0 0 1 1 9.9M9 19l3 3m0 0l3-3m-3 3V10" stroke="%2338bdf8"/></svg>`;

/**
 * Checks whether the Notification API is supported by the current environment.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Gets the current notification permission state.
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Checks if the browser tab/document is currently in the background or not focused.
 */
export function isTabInBackground(): boolean {
  if (typeof document === 'undefined') return false;
  return document.hidden || document.visibilityState === 'hidden' || !document.hasFocus();
}

/**
 * Requests notification permission from the user.
 * Must be triggered by a direct user action (e.g. click).
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch (error) {
    console.warn('Error requesting notification permission:', error);
    return getNotificationPermission();
  }
}

interface NotificationOptionsExtended {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  force?: boolean; // Force trigger even if tab is in foreground (e.g. for testing)
  onClick?: () => void;
}

/**
 * Sends a browser notification only when tab is in background (unless forced).
 */
export function sendBackgroundNotification({
  title,
  body,
  icon = AIRSHARE_NOTIFICATION_ICON,
  tag,
  force = false,
  onClick,
}: NotificationOptionsExtended): Notification | null {
  if (!isNotificationSupported()) {
    return null;
  }

  if (Notification.permission !== 'granted') {
    return null;
  }

  // Only trigger when the browser tab is in background, unless explicitly forced
  if (!force && !isTabInBackground()) {
    return null;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: tag || `airshare-${Date.now()}`,
      silent: false,
    });

    notification.onclick = (event) => {
      event.preventDefault();
      try {
        window.focus();
      } catch (err) {
        console.warn('Could not focus window from notification click:', err);
      }
      if (onClick) {
        onClick();
      }
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error('Failed to display browser notification:', error);
    return null;
  }
}

/**
 * Dispatches notification for received files when in background.
 */
export function notifyReceivedFiles(
  files: Array<{ filename: string; size: number }>,
  senderName: string,
  force = false
): Notification | null {
  if (!files || files.length === 0) return null;

  if (files.length === 1) {
    const file = files[0];
    return sendBackgroundNotification({
      title: '📁 Novo arquivo recebido',
      body: `${senderName || 'Dispositivo'} enviou "${file.filename}" (${formatBytes(file.size)})`,
      tag: `file-${Date.now()}`,
      force,
    });
  }

  const names = files.slice(0, 2).map((f) => f.filename).join(', ');
  const remaining = files.length - 2;
  const summary = remaining > 0 ? `${names} e mais ${remaining} arquivo(s)` : names;
  const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);

  return sendBackgroundNotification({
    title: `📁 ${files.length} arquivos recebidos`,
    body: `${senderName || 'Dispositivo'} enviou: ${summary} (${formatBytes(totalBytes)})`,
    tag: `files-${Date.now()}`,
    force,
  });
}

/**
 * Dispatches notification for a received package (batch folder) when in background.
 */
export function notifyReceivedPackage(
  pkg: {
    name: string;
    fileCount: number;
    totalSize: number;
    senderName: string;
  },
  force = false
): Notification | null {
  return sendBackgroundNotification({
    title: '📦 Pacote de arquivos recebido',
    body: `${pkg.senderName || 'Dispositivo'} enviou o pacote "${pkg.name}" (${pkg.fileCount} arquivos, ${formatBytes(pkg.totalSize)})`,
    tag: `pkg-${Date.now()}`,
    force,
  });
}

/**
 * Dispatches a test notification to verify that notifications are working.
 */
export function sendTestNotification(): Notification | null {
  return sendBackgroundNotification({
    title: '🔔 AirShare: Notificações Ativadas!',
    body: 'Você receberá alertas como este sempre que novos arquivos chegarem enquanto esta aba estiver em segundo plano.',
    force: true,
  });
}
