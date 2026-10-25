import React, { useState, useEffect } from 'react';
import {
  Download,
  Eye,
  Trash2,
  Copy,
  Check,
  File,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Archive,
  Code,
  Smartphone,
  Laptop,
  Search,
  Package,
  ChevronDown,
  ChevronUp,
  FolderDown,
  Loader2,
  Info,
  Database,
} from 'lucide-react';
import { SharedFileItem, SharedPackageItem } from '../types';
import { formatBytes, formatRelativeTime, getFileCategory, FileCategory } from '../utils/formatters';
import { isIOS, isAndroid, saveToIOSFiles, saveZipPackageToIOS, triggerHapticFeedback } from '../utils/iosFileSaver';
import { getCachedFiles, isIndexedDBSupported } from '../utils/indexedDbCache';

interface FileListProps {
  files: SharedFileItem[];
  packages: SharedPackageItem[];
  currentPeerId: string;
  onPreview: (file: SharedFileItem) => void;
  onDeleteFile: (fileId: string) => void;
  onDeletePackage: (packageId: string) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  packages,
  currentPeerId,
  onPreview,
  onDeleteFile,
  onDeletePackage,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedPackageIds, setExpandedPackageIds] = useState<Set<string>>(new Set());
  const [isAppleDevice] = useState(() => isIOS());
  const [isAndroidDevice] = useState(() => isAndroid());
  const [guideTab, setGuideTab] = useState<'android' | 'ios'>(() => (isAndroid() ? 'android' : 'ios'));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [showDeviceGuide, setShowDeviceGuide] = useState(false);
  const [cachedFileIds, setCachedFileIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isIndexedDBSupported()) {
      getCachedFiles().then(items => {
        setCachedFileIds(new Set(items.map(i => i.id)));
      });
    }
  }, [files]);

  const handleSaveFileToFiles = async (file: SharedFileItem) => {
    setSavingId(file.id);
    triggerHapticFeedback(45);
    try {
      const res = await saveToIOSFiles({
        url: `/api/download/${file.id}`,
        filename: file.filename,
        mimetype: file.mimetype,
      });
      if (res.success) {
        triggerHapticFeedback([40, 50, 40]);
        setSavedSuccessId(file.id);
        setTimeout(() => setSavedSuccessId(null), 3000);
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleSavePackageToFiles = async (pkg: SharedPackageItem) => {
    setSavingId(pkg.id);
    triggerHapticFeedback(45);
    try {
      const res = await saveZipPackageToIOS(pkg.id, pkg.name);
      if (res.success) {
        triggerHapticFeedback([40, 50, 40]);
        setSavedSuccessId(pkg.id);
        setTimeout(() => setSavedSuccessId(null), 3000);
      }
    } finally {
      setSavingId(null);
    }
  };

  const togglePackageExpand = (packageId: string) => {
    setExpandedPackageIds(prev => {
      const next = new Set(prev);
      if (next.has(packageId)) {
        next.delete(packageId);
      } else {
        next.add(packageId);
      }
      return next;
    });
  };

  const getCategoryIcon = (category: FileCategory) => {
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
      case 'code':
        return <Code className="w-5 h-5 text-indigo-400" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleCopyLink = (fileId: string) => {
    const url = `${window.location.origin}/api/download/${fileId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(fileId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter packages
  const filteredPackages = packages.filter(pkg => {
    if (filterCategory !== 'all' && filterCategory !== 'packages') return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      pkg.name.toLowerCase().includes(query) ||
      pkg.senderName.toLowerCase().includes(query) ||
      pkg.files.some(f => f.filename.toLowerCase().includes(query))
    );
  });

  // Filter individual files (files that are not part of packages)
  const standaloneFiles = files.filter(f => !f.packageId);
  const filteredFiles = standaloneFiles.filter(file => {
    if (filterCategory === 'packages') return false;
    const { category } = getFileCategory(file.mimetype, file.filename);
    const matchesCategory =
      filterCategory === 'all' ||
      category === filterCategory ||
      (filterCategory === 'media' && (category === 'image' || category === 'video'));

    const matchesSearch =
      !searchQuery.trim() ||
      file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.senderName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const totalItemCount = filteredPackages.length + filteredFiles.length;

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-none transition-colors">
      {/* Header bar with filters and search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Arquivos & Pacotes Recebidos
          </h3>
          <span className="text-xs font-mono text-slate-600 dark:text-slate-500 tabular-nums font-semibold">
            ({totalItemCount})
          </span>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou pacote..."
            className="w-full bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 focus:border-indigo-600 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors shadow-xs"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-xs">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'packages', label: `Pacotes em Lote (${packages.length})` },
          { id: 'media', label: 'Fotos & Vídeos' },
          { id: 'pdf', label: 'PDFs' },
          { id: 'doc', label: 'Documentos' },
          { id: 'audio', label: 'Áudio' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              filterCategory === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-950/60 dark:hover:bg-slate-800 dark:border-transparent dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Multi-platform Android & iOS Support Banner & Guide */}
      <div className="mb-3.5 p-3 rounded-xl bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 dark:from-slate-900/90 dark:via-indigo-950/30 dark:to-emerald-950/30 border border-slate-300 dark:border-slate-800 text-xs transition-colors shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-xs text-white ${
              isAndroidDevice ? 'bg-emerald-600' : 'bg-sky-600'
            }`}>
              <FolderDown className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-950 dark:text-white flex items-center gap-1.5 flex-wrap">
                <span>
                  {isAndroidDevice
                    ? 'Salvando no Android (Downloads & Galeria)'
                    : isAppleDevice
                    ? 'Salvando no iPhone (App Arquivos)'
                    : 'Transferência Rápida para Celulares & PCs'}
                </span>
                {isAndroidDevice && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold">
                    🤖 Android detectado
                  </span>
                )}
                {isAppleDevice && (
                  <span className="text-[10px] bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30 px-1.5 py-0.2 rounded font-semibold">
                    🍏 iPhone detectado
                  </span>
                )}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                {isAndroidDevice
                  ? 'Compatível com Samsung, Motorola, Xiaomi e Pixel. Salva na pasta Downloads ou compartilha nativamente.'
                  : 'Toque no botão "Salvar" para gravar no dispositivo ou enviar ao app Arquivos/Galeria.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDeviceGuide(!showDeviceGuide)}
            className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200 flex items-center gap-1 self-start sm:self-auto shrink-0 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showDeviceGuide ? 'Ocultar instruções' : 'Como salvar no Android & iPhone?'}</span>
          </button>
        </div>

        {/* Expandable step-by-step instructions with Android / iPhone tabs */}
        {showDeviceGuide && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Escolha o sistema:</span>
              <div className="inline-flex rounded-lg p-0.5 bg-slate-200 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setGuideTab('android')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    guideTab === 'android'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🤖 Android
                </button>
                <button
                  type="button"
                  onClick={() => setGuideTab('ios')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    guideTab === 'ios'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🍏 iPhone / iPad
                </button>
              </div>
            </div>

            {guideTab === 'android' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">1. Toque em "Salvar"</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Toque no botão <strong className="text-slate-800 dark:text-slate-200">"Salvar no Dispositivo"</strong> ou no ícone de download direto.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">2. Pasta Downloads & Notificação</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    O Android baixa instantaneamente para a pasta <strong className="text-slate-800 dark:text-slate-200">Downloads</strong>, visível pelo app <em>Files do Google</em> ou <em>Meus Arquivos</em> da Samsung.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">3. Galeria & Compartilhamento</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Fotos e vídeos aparecem na Galeria / Google Fotos. Pelo menu nativo você pode enviar direto para WhatsApp ou Google Drive.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-sky-200/60 dark:border-sky-800/40">
                  <span className="font-bold text-sky-700 dark:text-sky-400 block mb-0.5">1. Toque em "Salvar em Arquivos"</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Toque no botão azul <strong className="text-slate-800 dark:text-slate-200">"Salvar em Arquivos"</strong> no arquivo ou pacote recebido.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-sky-200/60 dark:border-sky-800/40">
                  <span className="font-bold text-sky-700 dark:text-sky-400 block mb-0.5">2. Folha Nativa do iOS</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    O menu nativo do iOS abrirá. Escolha <strong className="text-slate-800 dark:text-slate-200">"Salvar em Arquivos"</strong> (ícone da pasta azul) ou "Salvar Imagem".
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-sky-200/60 dark:border-sky-800/40">
                  <span className="font-bold text-sky-700 dark:text-sky-400 block mb-0.5">3. Escolha a Pasta</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Escolha a pasta no seu iPhone (ex: <em>Downloads</em> ou <em>No Meu iPhone</em>) e confirme em <strong>Salvar</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content: Packages and Files */}
      {totalItemCount > 0 ? (
        <div className="space-y-3">
          {/* Render Packages */}
          {filteredPackages.map(pkg => {
            const isExpanded = expandedPackageIds.has(pkg.id);
            const isSender = pkg.senderId === currentPeerId;

            return (
              <div
                key={pkg.id}
                className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-slate-50 dark:bg-slate-950/70 p-4 transition-all shadow-xs"
              >
                {/* Package Main Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shrink-0 shadow-xs">
                      <Package className="w-6 h-6" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                          {pkg.name}
                        </span>
                        <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 px-1.5 py-0.2 rounded shrink-0">
                          {pkg.files.length} arquivos ordenados
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                        <span className="font-mono text-slate-800 dark:text-slate-300 tabular-nums font-semibold">
                          {formatBytes(pkg.totalSize)}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          {pkg.senderName.toLowerCase().includes('iphone') ? (
                            <Smartphone className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                          ) : (
                            <Laptop className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          )}
                          <span>{pkg.senderName}</span>
                        </span>
                        <span>·</span>
                        <span>{formatRelativeTime(pkg.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Package Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => togglePackageExpand(pkg.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-transparent text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <span>{isExpanded ? 'Ocultar' : 'Ver Arquivos'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Salvar pacote direto no dispositivo (Android / iOS) */}
                    <button
                      type="button"
                      onClick={() => handleSavePackageToFiles(pkg)}
                      disabled={savingId === pkg.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm ${
                        savedSuccessId === pkg.id
                          ? 'bg-emerald-600 text-white'
                          : isAndroidDevice
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
                          : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20 active:scale-95'
                      }`}
                      title={
                        isAndroidDevice
                          ? 'Salvar pacote no Android (Downloads / Compartilhar)'
                          : isAppleDevice
                          ? 'Salvar no app Arquivos do iPhone (expande pastas nativamente)'
                          : 'Salvar no Dispositivo'
                      }
                    >
                      {savingId === pkg.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Salvando...</span>
                        </>
                      ) : savedSuccessId === pkg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Salvo!</span>
                        </>
                      ) : (
                        <>
                          <FolderDown className="w-3.5 h-3.5" />
                          <span>
                            {isAndroidDevice
                              ? 'Salvar no Celular'
                              : isAppleDevice
                              ? 'Salvar em Arquivos'
                              : 'Salvar no Dispositivo'}
                          </span>
                        </>
                      )}
                    </button>

                    {/* Download Whole Package as ZIP */}
                    <a
                      href={`/api/packages/${pkg.id}/zip`}
                      download={`${pkg.name}.zip`}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-transparent dark:text-slate-200 dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Baixar todos os arquivos compactados em .ZIP"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Baixar .ZIP</span>
                    </a>

                    <button
                      onClick={() => onDeletePackage(pkg.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
                      title="Excluir pacote"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Ordered File List inside Package */}
                {isExpanded && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-400">
                      Arquivos do Pacote (Ordem de Envio):
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800/50">
                      {pkg.files.map((file, idx) => {
                        const { category } = getFileCategory(file.mimetype, file.filename);
                        return (
                          <div
                            key={file.id}
                            className="py-2 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold w-6 shrink-0">
                                #{file.orderIndex || idx + 1}
                              </span>
                              <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                                {getCategoryIcon(category)}
                              </div>
                              <span
                                className="text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md font-semibold"
                                title={file.filename}
                              >
                                {file.filename}
                              </span>
                              <span className="text-slate-500 font-mono text-[11px] shrink-0 font-medium">
                                ({formatBytes(file.size)})
                              </span>
                              {cachedFileIds.has(file.id) && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-1 rounded shrink-0" title="Salvo em cache local IndexedDB">
                                  <Database className="w-2.5 h-2.5" />
                                  <span>Offline</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {(category === 'image' || category === 'video' || category === 'audio' || category === 'pdf') && (
                                <button
                                  onClick={() => onPreview(file)}
                                  className="p-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-transparent dark:text-slate-300 dark:hover:text-white shadow-xs"
                                  title="Visualizar"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleSaveFileToFiles(file)}
                                disabled={savingId === file.id}
                                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                                  savedSuccessId === file.id
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 dark:border-sky-800/60 dark:text-sky-300'
                                }`}
                                title="Salvar no app Arquivos do iPhone"
                              >
                                {savingId === file.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : savedSuccessId === file.id ? (
                                  <Check className="w-3 h-3 text-white" />
                                ) : (
                                  <FolderDown className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                                )}
                                <span>{savedSuccessId === file.id ? 'Salvo' : 'Arquivos'}</span>
                              </button>

                              <a
                                href={`/api/download/${file.id}`}
                                download={file.filename}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-indigo-700 hover:text-indigo-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-transparent dark:text-indigo-300 dark:hover:text-white font-semibold text-[11px] flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                <span>Baixar</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Render Standalone Files */}
          {filteredFiles.map(file => {
            const { category, label, badgeText } = getFileCategory(
              file.mimetype,
              file.filename
            );
            const isImage = category === 'image';
            const previewUrl = `/api/download/${file.id}?inline=true`;

            return (
              <div
                key={file.id}
                className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors shadow-xs dark:shadow-none"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    {isImage ? (
                      <img
                        src={previewUrl}
                        alt={file.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      getCategoryIcon(category)
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span
                      className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md block"
                      title={file.filename}
                    >
                      {file.filename}
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                      <span className="font-mono text-slate-800 dark:text-slate-300 tabular-nums font-semibold">
                        {formatBytes(file.size)}
                      </span>
                      <span>·</span>
                      <span className={`${badgeText} font-semibold`}>{label}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        {file.senderName.toLowerCase().includes('iphone') ? (
                          <Smartphone className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                        ) : (
                          <Laptop className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        )}
                        <span>{file.senderName}</span>
                      </span>
                      <span>·</span>
                      <span>{formatRelativeTime(file.createdAt)}</span>
                      {cachedFileIds.has(file.id) && (
                        <>
                          <span>·</span>
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/20 px-1.5 py-0.2 rounded"
                            title="Arquivo salvo no IndexedDB local (disponível sem servidor)"
                          >
                            <Database className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Cache Offline</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {(category === 'image' || category === 'video' || category === 'audio' || category === 'pdf' || category === 'code') && (
                    <button
                      onClick={() => onPreview(file)}
                      className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:border-transparent dark:text-slate-200 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Visualizar arquivo"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="hidden sm:inline">Ver</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleCopyLink(file.id)}
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:border-transparent dark:text-slate-300 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Copiar link direto"
                  >
                    {copiedId === file.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {copiedId === file.id ? 'Copiado' : 'Link'}
                    </span>
                  </button>

                  {/* Salvar diretamente no Android / iPhone */}
                  <button
                    type="button"
                    onClick={() => handleSaveFileToFiles(file)}
                    disabled={savingId === file.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                      savedSuccessId === file.id
                        ? 'bg-emerald-600 text-white'
                        : isAndroidDevice
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 ring-2 ring-emerald-400/40'
                        : isAppleDevice
                        ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/25 ring-2 ring-sky-400/50'
                        : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20'
                    }`}
                    title={
                      isAndroidDevice
                        ? 'Salvar no Android (Downloads / Compartilhar nativo)'
                        : isAppleDevice
                        ? 'Salvar direto no app Arquivos do iPhone / iOS'
                        : 'Salvar no Dispositivo'
                    }
                  >
                    {savingId === file.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : savedSuccessId === file.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Salvo!</span>
                      </>
                    ) : (
                      <>
                        <FolderDown className="w-3.5 h-3.5" />
                        <span>
                          {isAndroidDevice
                            ? 'Salvar no Celular'
                            : isAppleDevice
                            ? 'Salvar em Arquivos'
                            : 'Salvar no Dispositivo'}
                        </span>
                      </>
                    )}
                  </button>

                  <a
                    href={`/api/download/${file.id}`}
                    download={file.filename}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-transparent dark:text-slate-200 dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Baixar arquivo normalmente"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Baixar</span>
                  </a>

                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
                    title="Remover arquivo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 px-4 text-center text-slate-500 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800/80 mb-4 bg-slate-100 dark:bg-slate-950/40 shadow-xs">
            <img
              src="/src/assets/images/airshare_transfer_showcase_1792769174493.jpg"
              alt="Transferência sem fio entre iPhone e PC"
              className="w-full h-auto object-cover opacity-90"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Nenhum arquivo ou pacote transferido ainda
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 max-w-sm mt-1 font-medium">
            Selecione múltiplos arquivos no iPhone ou PC para enviá-los em um pacote ordenado.
          </p>
        </div>
      )}
    </div>
  );
};
