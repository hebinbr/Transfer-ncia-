import React, { useState } from 'react';
import { X, Download, FileText, ExternalLink, FolderDown, Check, Loader2 } from 'lucide-react';
import { SharedFileItem } from '../types';
import { formatBytes, getFileCategory } from '../utils/formatters';
import { saveToIOSFiles, isIOS } from '../utils/iosFileSaver';

interface FilePreviewModalProps {
  file: SharedFileItem | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!file) return null;

  const { category, label } = getFileCategory(file.mimetype, file.filename);
  const fileUrl = `/api/download/${file.id}?inline=true`;

  const handleSaveToFiles = async () => {
    setIsSaving(true);
    try {
      const res = await saveToIOSFiles({
        url: `/api/download/${file.id}`,
        filename: file.filename,
        mimetype: file.mimetype,
      });
      if (res.success) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60">
          <div className="min-w-0 pr-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-lg" title={file.filename}>
              {file.filename}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {formatBytes(file.size)} · {label} · Enviado por {file.senderName}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Salvar diretamente no app Arquivos */}
            <button
              type="button"
              onClick={handleSaveToFiles}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95 ${
                isSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
              }`}
              title="Salvar no app Arquivos do iPhone ou Compartilhar"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvo!</span>
                </>
              ) : (
                <>
                  <FolderDown className="w-3.5 h-3.5" />
                  <span>Salvar em Arquivos</span>
                </>
              )}
            </button>

            <a
              href={`/api/download/${file.id}`}
              download={file.filename}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-transparent dark:text-slate-200 dark:hover:text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Baixar</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-100 dark:bg-slate-950/50">
          {category === 'image' && (
            <img
              src={fileUrl}
              alt={file.filename}
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg border border-slate-200 dark:border-transparent"
            />
          )}

          {category === 'video' && (
            <video
              src={fileUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[70vh] max-w-full rounded-lg shadow-lg"
            />
          )}

          {category === 'audio' && (
            <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 text-center shadow-lg">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-500/20">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">{file.filename}</h4>
              <audio src={fileUrl} controls autoPlay className="w-full" />
            </div>
          )}

          {category === 'pdf' && (
            <iframe
              src={fileUrl}
              title={file.filename}
              className="w-full h-[70vh] rounded-lg border border-slate-300 dark:border-slate-800 bg-white"
            />
          )}

          {category !== 'image' && category !== 'video' && category !== 'audio' && category !== 'pdf' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3 shadow-sm">
                <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Visualização direta não suportada</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto mb-4">
                Este tipo de arquivo pode ser baixado normalmente para seu computador ou iPhone.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveToFiles}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors shadow-md shadow-sky-600/20 active:scale-95"
                >
                  <FolderDown className="w-4 h-4" />
                  <span>Salvar no App Arquivos (iPhone)</span>
                </button>
                <a
                  href={`/api/download/${file.id}`}
                  download={file.filename}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-transparent text-slate-800 dark:text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Baixar Arquivo</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
