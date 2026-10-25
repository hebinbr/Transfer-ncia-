/**
 * iOS Files & Storage helper
 * Facilitates saving files directly into the native Apple iOS "Arquivos" (Files app)
 * and iCloud Drive via Web Share API (with file payload) or direct WebKit download.
 */

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const platformStr = navigator.platform || '';

  const isIOSDevice =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platformStr === 'MacIntel' && navigator.maxTouchPoints > 1);

  return isIOSDevice;
}

/**
 * Triggers a short haptic vibration feedback if supported by the browser/device.
 * Typically 30ms to 50ms provides a crisp, pleasant physical tap response.
 */
export function triggerHapticFeedback(pattern: number | number[] = 40): boolean {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      return navigator.vibrate(pattern);
    } catch {
      // Haptics may be restricted by platform permissions or user settings
      return false;
    }
  }
  return false;
}

export interface SaveOptions {
  url: string;
  filename: string;
  mimetype?: string;
  totalSize?: number;
  onProgress?: (percent: number, loaded: number, total: number) => void;
}

export interface SaveResult {
  success: boolean;
  method: 'share' | 'download' | 'direct';
  error?: string;
}

/**
 * Saves a file to iOS "Arquivos" (Files) app.
 * Uses navigator.share with File payload to summon the native iOS action sheet
 * which features the "Salvar em Arquivos" (Save to Files) option.
 * Falls back to direct blob download trigger for Safari's download manager.
 */
export async function saveToIOSFiles(options: SaveOptions): Promise<SaveResult> {
  const { url, filename, mimetype, totalSize, onProgress } = options;

  // Trigger short tactile feedback when user initiates saving
  triggerHapticFeedback(45);

  try {
    // 1. Fetch file with real stream reading for download percentage
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao obter arquivo: ${response.statusText}`);
    }

    let blob: Blob;
    const contentLength = response.headers.get('content-length');
    const headerBytes = contentLength ? parseInt(contentLength, 10) : 0;
    const expectedTotal = headerBytes > 0 ? headerBytes : (totalSize || 0);

    if (response.body && typeof ReadableStream !== 'undefined') {
      const reader = response.body.getReader();
      let receivedBytes = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          receivedBytes += value.length;
          if (expectedTotal > 0 && onProgress) {
            const percent = Math.min(Math.round((receivedBytes / expectedTotal) * 100), 99);
            onProgress(percent, receivedBytes, expectedTotal);
          } else if (onProgress) {
            // If total is unknown, provide smooth progression
            onProgress(Math.min(90, Math.round(receivedBytes / 1024)), receivedBytes, 0);
          }
        }
      }

      const resolvedType = mimetype || response.headers.get('content-type') || 'application/octet-stream';
      blob = new Blob(chunks as any[], { type: resolvedType });
      if (onProgress) {
        onProgress(100, receivedBytes, expectedTotal || receivedBytes);
      }
    } else {
      blob = await response.blob();
      if (onProgress) {
        onProgress(100, blob.size, blob.size);
      }
    }

    const resolvedType = mimetype || blob.type || 'application/octet-stream';

    // 2. Attempt Web Share API with file support (Triggers iOS "Salvar em Arquivos")
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const fileObj = new File([blob], filename, { type: resolvedType });

        if (navigator.canShare && navigator.canShare({ files: [fileObj] })) {
          await navigator.share({
            files: [fileObj],
            title: filename,
            text: `Salvar ${filename} no app Arquivos`,
          });
          return { success: true, method: 'share' };
        }
      } catch (shareErr: any) {
        // User aborted the share sheet - not a system error
        if (shareErr.name === 'AbortError') {
          return { success: true, method: 'share' };
        }
        console.warn('Web Share API failed, falling back to download link:', shareErr);
      }
    }

    // 3. Fallback: Trigger Blob URL download (iOS Safari prompts "Deseja baixar?" saving to Arquivos/Downloads)
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 15000);

    return { success: true, method: 'download' };
  } catch (err: any) {
    console.error('Erro ao salvar no app Arquivos:', err);

    // Final fallback: direct navigation
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true, method: 'direct' };
    } catch (directErr: any) {
      return { success: false, method: 'direct', error: err.message || 'Falha ao salvar' };
    }
  }
}

/**
 * Saves an entire package (.ZIP) into iOS "Arquivos".
 * iOS Files app natively opens and extracts .ZIP archives directly on iPhone.
 */
export async function saveZipPackageToIOS(
  packageId: string,
  packageName: string,
  totalSize?: number,
  onProgress?: (percent: number, loaded: number, total: number) => void
): Promise<SaveResult> {
  const url = `/api/packages/${packageId}/zip`;
  const filename = packageName.endsWith('.zip') ? packageName : `${packageName}.zip`;
  return saveToIOSFiles({
    url,
    filename,
    mimetype: 'application/zip',
    totalSize,
    onProgress,
  });
}
