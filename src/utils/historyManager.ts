import { TransferHistoryItem } from '../types';
import {
  saveHistoryToIndexedDB,
  saveHistoryItemToIndexedDB,
  removeHistoryItemFromIndexedDB,
  clearHistoryInIndexedDB,
  getHistoryFromIndexedDB,
} from './indexedDbCache';

const STORAGE_KEY = 'airshare_transfer_history';

// Sample seed data spanning the last 7 days
const ONE_DAY = 1000 * 60 * 60 * 24;
const ONE_HOUR = 1000 * 60 * 60;

const SEED_HISTORY: TransferHistoryItem[] = [
  // Hoje (Day 0)
  {
    id: 'hist_seed_1',
    name: 'Fotos_Viagem_iPhone.zip',
    kind: 'package',
    direction: 'received',
    status: 'success',
    size: 42 * 1024 * 1024,
    fileCount: 4,
    senderName: 'iPhone 15 Pro de Carlos',
    targetName: 'Este Computador',
    timestamp: Date.now() - 1000 * 60 * 18,
    downloadUrl: '#',
  },
  {
    id: 'hist_seed_2',
    name: 'Contrato_Assinado_2026.pdf',
    kind: 'file',
    direction: 'sent',
    status: 'success',
    size: 3.4 * 1024 * 1024,
    mimetype: 'application/pdf',
    senderName: 'Este Computador',
    targetName: 'iPhone 15 Pro de Carlos',
    timestamp: Date.now() - 1000 * 60 * 85,
    downloadUrl: '#',
  },
  {
    id: 'hist_seed_3',
    name: 'Backup_Dados_Grande.rar',
    kind: 'file',
    direction: 'sent',
    status: 'error',
    size: 250 * 1024 * 1024,
    mimetype: 'application/x-rar-compressed',
    senderName: 'Este Computador',
    targetName: 'iPhone 15 Pro de Carlos',
    timestamp: Date.now() - ONE_HOUR * 4,
    errorMessage: 'Tempo limite de conexão esgotado (Wi-Fi oscilou)',
  },
  // Ontem (Day 1)
  {
    id: 'hist_seed_4',
    name: 'Apresentacao_Projeto_Q4.pptx',
    kind: 'file',
    direction: 'received',
    status: 'success',
    size: 18.2 * 1024 * 1024,
    mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    senderName: 'iPhone 15 Pro de Carlos',
    targetName: 'Este Computador',
    timestamp: Date.now() - ONE_DAY - ONE_HOUR * 2,
    downloadUrl: '#',
  },
  {
    id: 'hist_seed_5',
    name: 'Video_Gravacao_4K_001.mov',
    kind: 'file',
    direction: 'received',
    status: 'error',
    size: 420 * 1024 * 1024,
    mimetype: 'video/quicktime',
    senderName: 'iPhone 15 Pro de Carlos',
    targetName: 'Este Computador',
    timestamp: Date.now() - ONE_DAY - ONE_HOUR * 5,
    errorMessage: 'Transferência cancelada pelo usuário no iPhone',
  },
  // 2 dias atrás (Day 2)
  {
    id: 'hist_seed_6',
    name: 'Fotos_Evento_Aniversario.zip',
    kind: 'package',
    direction: 'received',
    status: 'success',
    size: 68.5 * 1024 * 1024,
    fileCount: 12,
    senderName: 'iPhone 15 Pro de Carlos',
    targetName: 'Este Computador',
    timestamp: Date.now() - ONE_DAY * 2 - ONE_HOUR * 3,
    downloadUrl: '#',
  },
  // 3 dias atrás (Day 3)
  {
    id: 'hist_seed_7',
    name: 'Relatorio_Mensal_Contabilidade.xlsx',
    kind: 'file',
    direction: 'sent',
    status: 'success',
    size: 24.3 * 1024 * 1024,
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    senderName: 'Este Computador',
    targetName: 'iPhone 15 Pro de Carlos',
    timestamp: Date.now() - ONE_DAY * 3 - ONE_HOUR * 6,
    downloadUrl: '#',
  },
  // 4 dias atrás (Day 4)
  {
    id: 'hist_seed_8',
    name: 'Video_Aula_Edicao_Final.mp4',
    kind: 'file',
    direction: 'received',
    status: 'success',
    size: 95.8 * 1024 * 1024,
    mimetype: 'video/mp4',
    senderName: 'iPhone 15 Pro de Carlos',
    targetName: 'Este Computador',
    timestamp: Date.now() - ONE_DAY * 4 - ONE_HOUR * 4,
    downloadUrl: '#',
  },
  // 5 dias atrás (Day 5)
  {
    id: 'hist_seed_9',
    name: 'Manual_Identidade_Visual.pdf',
    kind: 'file',
    direction: 'sent',
    status: 'success',
    size: 14.2 * 1024 * 1024,
    mimetype: 'application/pdf',
    senderName: 'Este Computador',
    targetName: 'iPhone 15 Pro de Carlos',
    timestamp: Date.now() - ONE_DAY * 5 - ONE_HOUR * 2,
    downloadUrl: '#',
  },
  // 6 dias atrás (Day 6)
  {
    id: 'hist_seed_10',
    name: 'Lote_Audios_Podcast.zip',
    kind: 'package',
    direction: 'received',
    status: 'success',
    size: 52.4 * 1024 * 1024,
    fileCount: 6,
    senderName: 'iPhone 15 Pro de Carlos',
    targetName: 'Este Computador',
    timestamp: Date.now() - ONE_DAY * 6 - ONE_HOUR * 5,
    downloadUrl: '#',
  },
];

export function getTransferHistory(): TransferHistoryItem[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_HISTORY));
    // Seed IndexedDB asynchronously
    saveHistoryToIndexedDB(SEED_HISTORY).catch(() => {});
    return SEED_HISTORY;
  }
  try {
    const parsed = JSON.parse(stored);
    // If user has old 5-item seed without older days, seed with full 7-day rich history
    if (Array.isArray(parsed) && parsed.length <= 5 && parsed[0]?.id?.startsWith('hist_seed_')) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_HISTORY));
      saveHistoryToIndexedDB(SEED_HISTORY).catch(() => {});
      return SEED_HISTORY;
    }
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Loads history from IndexedDB, falling back to localStorage if IndexedDB is empty.
 */
export async function syncHistoryWithIndexedDB(): Promise<TransferHistoryItem[]> {
  try {
    const idbItems = await getHistoryFromIndexedDB();
    if (idbItems && idbItems.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(idbItems));
      return idbItems;
    }
    const localItems = getTransferHistory();
    if (localItems && localItems.length > 0) {
      await saveHistoryToIndexedDB(localItems);
    }
    return localItems;
  } catch {
    return getTransferHistory();
  }
}

export function addTransferHistoryItem(
  item: Omit<TransferHistoryItem, 'id' | 'timestamp'> & { id?: string; timestamp?: number }
): TransferHistoryItem {
  const current = getTransferHistory();
  const newItem: TransferHistoryItem = {
    id: item.id || `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: item.name,
    kind: item.kind,
    direction: item.direction,
    status: item.status,
    size: item.size,
    fileCount: item.fileCount,
    mimetype: item.mimetype,
    senderName: item.senderName,
    targetName: item.targetName,
    timestamp: item.timestamp || Date.now(),
    errorMessage: item.errorMessage,
    downloadUrl: item.downloadUrl,
    fileId: item.fileId,
    packageId: item.packageId,
  };

  const updated = [newItem, ...current];
  if (updated.length > 200) updated.pop();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save transfer history:', err);
  }

  // Persist to IndexedDB
  saveHistoryItemToIndexedDB(newItem).catch(() => {});

  return newItem;
}

export function clearTransferHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  clearHistoryInIndexedDB().catch(() => {});
}

export function removeTransferHistoryItem(id: string): void {
  const current = getTransferHistory();
  const updated = current.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  removeHistoryItemFromIndexedDB(id).catch(() => {});
}

export interface DateGroupedHistory {
  dateLabel: string;
  rawDate: string;
  successCount: number;
  errorCount: number;
  totalBytes: number;
  items: TransferHistoryItem[];
}

export function groupTransfersByDate(items: TransferHistoryItem[]): DateGroupedHistory[] {
  const groupsMap = new Map<string, TransferHistoryItem[]>();

  const sorted = [...items].sort((a, b) => b.timestamp - a.timestamp);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  for (const item of sorted) {
    const d = new Date(item.timestamp);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (!groupsMap.has(dateKey)) {
      groupsMap.set(dateKey, []);
    }
    groupsMap.get(dateKey)!.push(item);
  }

  const result: DateGroupedHistory[] = [];

  for (const [dateKey, groupItems] of groupsMap.entries()) {
    let dateLabel = '';
    if (dateKey === todayStr) {
      dateLabel = 'Hoje';
    } else if (dateKey === yesterdayStr) {
      dateLabel = 'Ontem';
    } else {
      const [year, month, day] = dateKey.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      dateLabel = dateObj.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    const successCount = groupItems.filter(i => i.status === 'success').length;
    const errorCount = groupItems.filter(i => i.status === 'error').length;
    const totalBytes = groupItems.reduce((acc, i) => acc + (i.size || 0), 0);

    result.push({
      dateLabel,
      rawDate: dateKey,
      successCount,
      errorCount,
      totalBytes,
      items: groupItems,
    });
  }

  return result;
}

export interface DayVolumeMetric {
  dateKey: string;
  displayDay: string;
  weekday: string;
  fullDate: string;
  volumeMB: number;
  volumeBytes: number;
  transferCount: number;
  successCount: number;
  errorCount: number;
  isToday: boolean;
}

export interface SevenDaysMetrics {
  days: DayVolumeMetric[];
  totalVolumeBytes: number;
  totalVolumeMB: number;
  dailyAverageMB: number;
  peakDay: DayVolumeMetric | null;
  totalTransfers: number;
}

/**
 * Computes daily transfer volume and counts for the past 7 days (today down to 6 days ago).
 */
export function get7DaysTransferMetrics(history: TransferHistoryItem[]): SevenDaysMetrics {
  const days: DayVolumeMetric[] = [];
  const now = new Date();

  const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Build the 7 days array chronologically from 6 days ago to today
  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - i);
    targetDate.setHours(0, 0, 0, 0);

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    const weekday = weekdayNames[targetDate.getDay()];
    const isToday = i === 0;

    const fullDate = targetDate.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
    });

    const displayDay = isToday ? 'Hoje' : `${weekday} ${day}`;

    // Find all transfers belonging to this calendar date
    const dayTransfers = history.filter(item => {
      const itemDate = new Date(item.timestamp);
      const itemKey = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
      return itemKey === dateKey;
    });

    // Sum volume for successful transfers
    const successTransfers = dayTransfers.filter(t => t.status === 'success');
    const volumeBytes = successTransfers.reduce((acc, t) => acc + (t.size || 0), 0);
    const volumeMB = parseFloat((volumeBytes / (1024 * 1024)).toFixed(1));

    days.push({
      dateKey,
      displayDay,
      weekday,
      fullDate,
      volumeMB,
      volumeBytes,
      transferCount: dayTransfers.length,
      successCount: successTransfers.length,
      errorCount: dayTransfers.filter(t => t.status === 'error').length,
      isToday,
    });
  }

  const totalVolumeBytes = days.reduce((acc, d) => acc + d.volumeBytes, 0);
  const totalVolumeMB = parseFloat((totalVolumeBytes / (1024 * 1024)).toFixed(1));
  const dailyAverageMB = parseFloat((totalVolumeMB / 7).toFixed(1));
  const totalTransfers = days.reduce((acc, d) => acc + d.transferCount, 0);

  // Peak day
  let peakDay: DayVolumeMetric | null = null;
  for (const d of days) {
    if (!peakDay || d.volumeMB > peakDay.volumeMB) {
      peakDay = d;
    }
  }

  return {
    days,
    totalVolumeBytes,
    totalVolumeMB,
    dailyAverageMB,
    peakDay,
    totalTransfers,
  };
}
