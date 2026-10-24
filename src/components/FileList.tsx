import React, { useState } from 'react';
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
} from 'lucide-react';
import { SharedFileItem, SharedPackageItem } from '../types';
import { formatBytes, formatRelativeTime, getFileCategory, FileCategory } from '../utils/formatters';

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
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
      {/* Header bar with filters and search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Arquivos & Pacotes Recebidos
          </h3>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            ({totalItemCount})
          </span>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou pacote..."
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
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
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterCategory === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
                className="rounded-xl border border-indigo-500/30 bg-slate-950/70 p-4 transition-all"
              >
                {/* Package Main Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                          {pkg.name}
                        </span>
                        <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded shrink-0">
                          {pkg.files.length} arquivos ordenados
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono text-slate-300 tabular-nums">
                          {formatBytes(pkg.totalSize)}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          {pkg.senderName.toLowerCase().includes('iphone') ? (
                            <Smartphone className="w-3 h-3 text-sky-400" />
                          ) : (
                            <Laptop className="w-3 h-3 text-indigo-400" />
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
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? 'Ocultar' : 'Ver Arquivos'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Download Whole Package as ZIP */}
                    <a
                      href={`/api/packages/${pkg.id}/zip`}
                      download={`${pkg.name}.zip`}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-600/20"
                      title="Baixar todos os arquivos compactados em .ZIP"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar .ZIP</span>
                    </a>

                    <button
                      onClick={() => onDeletePackage(pkg.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Excluir pacote"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Ordered File List inside Package */}
                {isExpanded && (
                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400">
                      Arquivos do Pacote (Ordem de Envio):
                    </div>

                    <div className="divide-y divide-slate-800/50">
                      {pkg.files.map((file, idx) => {
                        const { category } = getFileCategory(file.mimetype, file.filename);
                        return (
                          <div
                            key={file.id}
                            className="py-2 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-[10px] text-indigo-400 font-bold w-6 shrink-0">
                                #{file.orderIndex || idx + 1}
                              </span>
                              <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                                {getCategoryIcon(category)}
                              </div>
                              <span
                                className="text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md font-medium"
                                title={file.filename}
                              >
                                {file.filename}
                              </span>
                              <span className="text-slate-500 font-mono text-[11px] shrink-0">
                                ({formatBytes(file.size)})
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {(category === 'image' || category === 'video' || category === 'audio' || category === 'pdf') && (
                                <button
                                  onClick={() => onPreview(file)}
                                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                  title="Visualizar"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <a
                                href={`/api/download/${file.id}`}
                                download={file.filename}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white font-medium text-[11px] flex items-center gap-1"
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
                className="p-3 sm:p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
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
                      className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md block"
                      title={file.filename}
                    >
                      {file.filename}
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <span className="font-mono text-slate-300 tabular-nums">
                        {formatBytes(file.size)}
                      </span>
                      <span>·</span>
                      <span className={`${badgeText} font-medium`}>{label}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        {file.senderName.toLowerCase().includes('iphone') ? (
                          <Smartphone className="w-3 h-3 text-sky-400" />
                        ) : (
                          <Laptop className="w-3 h-3 text-indigo-400" />
                        )}
                        <span>{file.senderName}</span>
                      </span>
                      <span>·</span>
                      <span>{formatRelativeTime(file.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {(category === 'image' || category === 'video' || category === 'audio' || category === 'pdf' || category === 'code') && (
                    <button
                      onClick={() => onPreview(file)}
                      className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title="Visualizar arquivo"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="hidden sm:inline">Ver</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleCopyLink(file.id)}
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                    title="Copiar link direto"
                  >
                    {copiedId === file.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {copiedId === file.id ? 'Copiado' : 'Link'}
                    </span>
                  </button>

                  <a
                    href={`/api/download/${file.id}`}
                    download={file.filename}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar</span>
                  </a>

                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
          <div className="w-full max-w-sm rounded-xl overflow-hidden border border-slate-800/80 mb-4 bg-slate-950/40 shadow-inner">
            <img
              src="/src/assets/images/airshare_transfer_showcase_1792769174493.jpg"
              alt="Transferência sem fio entre iPhone e PC"
              className="w-full h-auto object-cover opacity-90"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-xs font-bold text-slate-200">
            Nenhum arquivo ou pacote transferido ainda
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm mt-1">
            Selecione múltiplos arquivos no iPhone ou PC para enviá-los em um pacote ordenado.
          </p>
        </div>
      )}
    </div>
  );
};
