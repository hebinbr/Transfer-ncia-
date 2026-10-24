export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 20) return 'agora mesmo';
  if (seconds < 60) return `há ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export type FileCategory = 'image' | 'video' | 'audio' | 'pdf' | 'archive' | 'code' | 'doc' | 'other';

export function getFileCategory(mimetype: string, filename: string): {
  category: FileCategory;
  label: string;
  badgeBg: string;
  badgeText: string;
} {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (mimetype.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'svg', 'bmp'].includes(ext)) {
    return { category: 'image', label: 'Foto / Imagem', badgeBg: 'bg-emerald-500/10', badgeText: 'text-emerald-400' };
  }
  if (mimetype.startsWith('video/') || ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi'].includes(ext)) {
    return { category: 'video', label: 'Vídeo', badgeBg: 'bg-purple-500/10', badgeText: 'text-purple-400' };
  }
  if (mimetype.startsWith('audio/') || ['mp3', 'm4a', 'wav', 'aac', 'flac', 'ogg'].includes(ext)) {
    return { category: 'audio', label: 'Áudio / Música', badgeBg: 'bg-amber-500/10', badgeText: 'text-amber-400' };
  }
  if (mimetype === 'application/pdf' || ext === 'pdf') {
    return { category: 'pdf', label: 'Documento PDF', badgeBg: 'bg-red-500/10', badgeText: 'text-red-400' };
  }
  if (
    mimetype.includes('zip') ||
    mimetype.includes('compressed') ||
    mimetype.includes('tar') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return { category: 'archive', label: 'Arquivo Compactado', badgeBg: 'bg-blue-500/10', badgeText: 'text-blue-400' };
  }
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'html', 'css', 'cpp', 'c', 'java', 'sql', 'sh'].includes(ext)) {
    return { category: 'code', label: 'Código Fonte', badgeBg: 'bg-indigo-500/10', badgeText: 'text-indigo-400' };
  }
  if (['doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'].includes(ext)) {
    return { category: 'doc', label: 'Documento', badgeBg: 'bg-cyan-500/10', badgeText: 'text-cyan-400' };
  }

  return { category: 'other', label: ext.toUpperCase() || 'Arquivo', badgeBg: 'bg-slate-700/30', badgeText: 'text-slate-300' };
}
