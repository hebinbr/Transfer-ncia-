import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Package,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File,
  Search,
  Trash2,
  Download,
  Calendar,
  Check,
  Copy,
  AlertTriangle,
  X,
  Smartphone,
  Laptop,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  BarChart3,
  FolderDown,
  Loader2,
} from 'lucide-react';
import { TransferHistoryItem } from '../types';
import { groupTransfersByDate } from '../utils/historyManager';
import { formatBytes, getFileCategory } from '../utils/formatters';
import { saveToIOSFiles, isIOS } from '../utils/iosFileSaver';
import { TransferVolumeChart } from './TransferVolumeChart';

interface TransferHistoryProps {
  history: TransferHistoryItem[];
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
  onClose?: () => void;
}

export const TransferHistory: React.FC<TransferHistoryProps> = ({
  history,
  onClearHistory,
  onRemoveItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  const handleSaveToFiles = async (item: TransferHistoryItem) => {
    if (!item.downloadUrl || item.downloadUrl === '#') return;
    setSavingId(item.id);
    try {
      const res = await saveToIOSFiles({
        url: item.downloadUrl,
        filename: item.name,
        mimetype: item.mimetype || (item.kind === 'package' ? 'application/zip' : undefined),
      });
      if (res.success) {
        setSavedSuccessId(item.id);
        setTimeout(() => setSavedSuccessId(null), 3000);
      }
    } finally {
      setSavingId(null);
    }
  };

  // Filter items by status, direction, and multi-field search (filename, sender, receiver, error)
  const filteredItems = history.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesDirection = directionFilter === 'all' || item.direction === directionFilter;

    if (!matchesStatus || !matchesDirection) return false;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    // Check individual keywords for combined search (e.g. "iphone pdf")
    const keywords = query.split(/\s+/).filter(Boolean);
    const targetText = [
      item.name,
      item.senderName,
      item.targetName || '',
      item.errorMessage || '',
      item.kind === 'package' ? 'pacote zip lote' : 'arquivo',
    ]
      .join(' ')
      .toLowerCase();

    return keywords.every(kw => targetText.includes(kw));
  });

  // Group by date
  const groupedHistory = groupTransfersByDate(filteredItems);

  // Overall Statistics
  const totalCount = history.length;
  const successCount = history.filter(i => i.status === 'success').length;
  const errorCount = history.filter(i => i.status === 'error').length;
  const totalVolume = history
    .filter(i => i.status === 'success')
    .reduce((acc, i) => acc + (i.size || 0), 0);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getItemIcon = (item: TransferHistoryItem) => {
    if (item.kind === 'package') {
      return <Package className="w-5 h-5 text-indigo-400" />;
    }
    const { category } = getFileCategory(item.mimetype || '', item.name);
    switch (category) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-amber-400" />;
      case 'pdf':
      case 'doc':
        return <FileText className="w-5 h-5 text-cyan-400" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-blue-400" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  const getDeviceIcon = (name: string) => {
    if (name.toLowerCase().includes('iphone') || name.toLowerCase().includes('celular') || name.toLowerCase().includes('ipad')) {
      return <Smartphone className="w-3.5 h-3.5 text-sky-400" />;
    }
    return <Laptop className="w-3.5 h-3.5 text-indigo-400" />;
  };

  const quickSearchTags = ['iPhone', 'Computador', 'PDF', 'Fotos', 'ZIP'];

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm dark:shadow-none transition-colors">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Histórico de Transferências
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Registro detalhado de envios e recebimentos ordenados por data
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setShowChart(!showChart)}
              className="text-xs text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-white bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={showChart ? 'Ocultar gráfico de 7 dias' : 'Exibir gráfico de 7 dias'}
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{showChart ? 'Ocultar Gráfico' : 'Gráfico 7 Dias'}</span>
              {showChart ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Clear History Button */}
          {history.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Tem certeza que deseja limpar todo o histórico de transferências?')) {
                  onClearHistory();
                }
              }}
              className="text-xs text-slate-700 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-500/30 transition-colors flex items-center gap-1.5 font-semibold shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">Total de Transferências</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">{totalCount}</span>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-slate-950/70 border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Concluídas com Sucesso
          </span>
          <span className="text-xl font-bold text-emerald-800 dark:text-emerald-300 font-mono tabular-nums">{successCount}</span>
        </div>

        <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-slate-950/70 border border-rose-200 dark:border-rose-500/20 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Falhas Registradas
          </span>
          <span className="text-xl font-bold text-rose-800 dark:text-rose-300 font-mono tabular-nums">{errorCount}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">Volume Total Concluído</span>
          <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300 font-mono tabular-nums">{formatBytes(totalVolume)}</span>
        </div>
      </div>

      {/* 7-Day Transfer Volume Visualization Chart with Recharts */}
      {showChart && history.length > 0 && (
        <TransferVolumeChart history={history} />
      )}

      {/* Dedicated Search Bar Section */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/90 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome do arquivo ou dispositivo (remetente / destinatário)..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter buttons */}
          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-800 text-xs shrink-0 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Todos ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('success')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
                statusFilter === 'success'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Sucesso ({successCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('error')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
                statusFilter === 'error'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300'
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>Falhas ({errorCount})</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Tags & Direction Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-900 text-xs">
          {/* Quick search suggestion tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-600 dark:text-slate-500 font-semibold">Filtrar rapidamente por:</span>
            {quickSearchTags.map(tag => {
              const isActive = searchQuery.toLowerCase().includes(tag.toLowerCase());
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchQuery(isActive ? '' : tag)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white border border-indigo-500 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-800 shadow-xs'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* Direction Filter */}
          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-300 dark:border-slate-800/80 text-[11px]">
            <button
              onClick={() => setDirectionFilter('all')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                directionFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Ambos os Fluxos
            </button>
            <button
              onClick={() => setDirectionFilter('sent')}
              className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                directionFilter === 'sent'
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>Enviados</span>
            </button>
            <button
              onClick={() => setDirectionFilter('received')}
              className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                directionFilter === 'received'
                  ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-3 h-3 text-sky-600 dark:text-sky-400" />
              <span>Recebidos</span>
            </button>
          </div>
        </div>

        {/* Active Search / Filter Feedback Info */}
        {(searchQuery || statusFilter !== 'all' || directionFilter !== 'all') && (
          <div className="flex items-center justify-between pt-1 text-[11px] text-indigo-900 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/40 font-medium">
            <span>
              Exibindo <strong>{filteredItems.length}</strong> de <strong>{totalCount}</strong> transferências
              {searchQuery && (
                <>
                  {' '}correspondentes a <strong className="text-slate-900 dark:text-white">"{searchQuery}"</strong>
                </>
              )}
              {statusFilter !== 'all' && (
                <>
                  {' '}com status <strong className="text-slate-900 dark:text-white">{statusFilter === 'success' ? 'Sucesso' : 'Falha'}</strong>
                </>
              )}
              {directionFilter !== 'all' && (
                <>
                  {' '}em <strong className="text-slate-900 dark:text-white">{directionFilter === 'sent' ? 'Enviados' : 'Recebidos'}</strong>
                </>
              )}
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDirectionFilter('all');
              }}
              className="text-indigo-700 hover:text-indigo-900 dark:text-slate-400 dark:hover:text-white underline ml-2 font-semibold"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* Date-Separated Sections */}
      {groupedHistory.length > 0 ? (
        <div className="space-y-6 pt-1">
          {groupedHistory.map(group => (
            <div key={group.rawDate} className="space-y-3">
              {/* Date Section Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide uppercase">
                    {group.dateLabel}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    · {group.items.length} {group.items.length === 1 ? 'registro' : 'registros'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-mono tabular-nums font-semibold">
                  <span className="text-emerald-700 dark:text-emerald-400">{group.successCount} com sucesso</span>
                  {group.errorCount > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-rose-700 dark:text-rose-400">{group.errorCount} falhas</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{formatBytes(group.totalBytes)}</span>
                </div>
              </div>

              {/* Items in this date group */}
              <div className="space-y-2.5">
                {group.items.map(item => {
                  const isSuccess = item.status === 'success';
                  const isSent = item.direction === 'sent';
                  const itemTime = new Date(item.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const senderDisplay = item.senderName || 'Dispositivo';
                  const receiverDisplay = item.targetName || 'Dispositivo na rede';

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSuccess
                          ? 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-slate-700 shadow-xs dark:shadow-none'
                          : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 hover:border-rose-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Left: Icon & Details */}
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          {/* Type Icon */}
                          <div className="relative w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-xs">
                            {getItemIcon(item)}
                            {/* Direction Indicator Badge */}
                            <span
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                isSent ? 'bg-indigo-600 text-white' : 'bg-sky-600 text-white'
                              }`}
                              title={isSent ? 'Arquivo enviado' : 'Arquivo recebido'}
                            >
                              {isSent ? (
                                <ArrowUpRight className="w-2.5 h-2.5" />
                              ) : (
                                <ArrowDownLeft className="w-2.5 h-2.5" />
                              )}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md block"
                                title={item.name}
                              >
                                {item.name}
                              </span>

                              {/* Status Badge */}
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1 shrink-0 ${
                                  isSuccess
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                    : 'bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                                }`}
                              >
                                {isSuccess ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Concluído</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3" />
                                    <span>Falhou</span>
                                  </>
                                )}
                              </span>

                              {item.kind === 'package' && (
                                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 px-1.5 py-0.2 rounded shrink-0">
                                  {item.fileCount || 'Múltiplos'} arquivos
                                </span>
                              )}
                            </div>

                            {/* Trajectory: Explicit Remetente and Destinatário */}
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
                              <span className="font-mono text-slate-900 dark:text-slate-300 tabular-nums font-semibold">
                                {formatBytes(item.size)}
                              </span>
                              <span>·</span>
                              <span className="font-mono text-slate-500 dark:text-slate-400">{itemTime}</span>
                              <span>·</span>

                              {/* Remetente Badge */}
                              <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md text-slate-800 dark:text-slate-300">
                                {getDeviceIcon(senderDisplay)}
                                <span className="text-slate-500">De:</span>
                                <strong className="font-semibold text-slate-900 dark:text-slate-200">{senderDisplay}</strong>
                              </span>

                              <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" />

                              {/* Destinatário Badge */}
                              <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md text-slate-800 dark:text-slate-300">
                                {getDeviceIcon(receiverDisplay)}
                                <span className="text-slate-500">Para:</span>
                                <strong className="font-semibold text-slate-900 dark:text-slate-200">{receiverDisplay}</strong>
                              </span>
                            </div>

                            {/* Error description if failed */}
                            {!isSuccess && item.errorMessage && (
                              <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300 flex items-center gap-2 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                                <span>{item.errorMessage}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          {isSuccess && item.downloadUrl && item.downloadUrl !== '#' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveToFiles(item)}
                                disabled={savingId === item.id}
                                className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs ${
                                  savedSuccessId === item.id
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 dark:border-sky-800/60 dark:text-sky-300'
                                }`}
                                title="Salvar diretamente no app Arquivos do iPhone"
                              >
                                {savingId === item.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : savedSuccessId === item.id ? (
                                  <Check className="w-3.5 h-3.5 text-white" />
                                ) : (
                                  <FolderDown className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                )}
                                <span className="hidden sm:inline">
                                  {savedSuccessId === item.id ? 'Salvo' : 'Arquivos'}
                                </span>
                              </button>

                              <a
                                href={item.downloadUrl}
                                download={item.name}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-indigo-700 hover:text-indigo-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-transparent dark:text-indigo-300 dark:hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                                title="Baixar novamente"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Baixar</span>
                              </a>
                            </>
                          )}

                          <button
                            onClick={() => handleCopy(item.name, item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                            title="Copiar nome do arquivo"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
                            title="Remover deste registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-400 mb-2 shadow-xs">
            <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Nenhuma transferência encontrada
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 max-w-sm mt-1 font-medium">
            {searchQuery
              ? `Nenhum resultado corresponde à busca por "${searchQuery}" em nomes de arquivo, remetente ou destinatário.`
              : 'Nenhuma transferência corresponde aos filtros selecionados.'}
          </p>
          {(searchQuery || statusFilter !== 'all' || directionFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDirectionFilter('all');
              }}
              className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              Limpar filtros de busca
            </button>
          )}
        </div>
      )}
    </div>
  );
};
