import { DevicePeer } from '../types';

export function detectDevice(): {
  type: 'mobile' | 'desktop';
  platform: DevicePeer['platform'];
  defaultName: string;
} {
  if (typeof window === 'undefined') {
    return { type: 'desktop', platform: 'Other', defaultName: 'Computador' };
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const platformStr = navigator.platform || '';

  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platformStr === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS

  const isAndroid = /Android/.test(userAgent);
  const isMac = /Macintosh|Mac OS X/.test(userAgent) && !isIOS;
  const isWindows = /Windows NT|Win64|Win32/.test(userAgent);
  const isLinux = /Linux/.test(userAgent) && !isAndroid;

  if (isIOS) {
    const isPhone = /iPhone/.test(userAgent);
    return {
      type: 'mobile',
      platform: 'iOS',
      defaultName: isPhone ? 'iPhone' : 'iPad',
    };
  }

  if (isAndroid) {
    return {
      type: 'mobile',
      platform: 'Android',
      defaultName: 'Smartphone Android',
    };
  }

  if (isMac) {
    return {
      type: 'desktop',
      platform: 'macOS',
      defaultName: 'MacBook',
    };
  }

  if (isWindows) {
    return {
      type: 'desktop',
      platform: 'Windows',
      defaultName: 'PC Windows',
    };
  }

  if (isLinux) {
    return {
      type: 'desktop',
      platform: 'Linux',
      defaultName: 'Computador Linux',
    };
  }

  // Fallback check based on screen width
  const isMobileScreen = window.innerWidth <= 768;
  return {
    type: isMobileScreen ? 'mobile' : 'desktop',
    platform: 'Other',
    defaultName: isMobileScreen ? 'Celular' : 'Computador',
  };
}

export function getOrCreateDeviceId(): string {
  const KEY = 'airshare_device_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function getSavedDeviceName(): string {
  const KEY = 'airshare_device_name';
  const saved = localStorage.getItem(KEY);
  if (saved && saved.trim()) return saved.trim();

  const detected = detectDevice();
  const randomSuffix = Math.floor(10 + Math.random() * 90);
  const name = `${detected.defaultName} #${randomSuffix}`;
  localStorage.setItem(KEY, name);
  return name;
}

export function setSavedDeviceName(name: string): void {
  localStorage.setItem('airshare_device_name', name.trim());
}
