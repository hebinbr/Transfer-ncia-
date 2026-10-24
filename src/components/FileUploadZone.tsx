import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Camera,
  Image,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  Layers,
  X,
  Plus,
  Send,
  Trash2,
  File,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TransferProgress } from '../types';
import { formatBytes, getFileCategory } from '../utils/formatters';

interface FileUploadZoneProps {
  roomCode: string;
  currentPeerId: string;
  senderName: string;
  targetPeerId: string | null;
  targetPeerName?: string;
  userEmail?: string;
  onFilesUploaded: () => void;
  onRecordTransfer?: (record: {
    name: string;
    kind: 'file' | 'package';
    direction: 'sent';
    status: 'success' | 'error';
    size: number;
    fileCount?: number;
    mimetype?: string;
    senderName: string;
    targetName?: string;
    errorMessage?: string;
  }) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  roomCode,
  currentPeerId,
  senderName,
  targetPeerId,
  targetPeerName,
  userEmail,
  onFilesUploaded,
  onRecordTransfer,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  // Staging queue for multi-file package creation
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [customPackageName, setCustomPackageName] = useState('');
  const [asSinglePackage, setAsSinglePackage] = useState(true);

  // Upload progress states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [transfers, setTransfers] = useState<TransferProgress[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const photoLibraryInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToStage(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToStage(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const addFilesToStage = (newFiles: File[]) => {
    setStagedFiles(prev => [...prev, ...newFiles]);
  };

  const removeStagedFile = (indexToRemove: number) => {
    setStagedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const clearStagedFiles = () => {
    setStagedFiles([]);
    setCustomPackageName('');
  };

  const totalStagedSize = stagedFiles.reduce((acc, f) => acc + f.size, 0);

  const handleSendStagedFiles = async () => {
    if (stagedFiles.length === 0 || isUploading) return;

    setIsUploading(true);
    setUploadPercent(0);
    setUploadStatusText(`Preparando ${stagedFiles.length} arquivos...`);

    const initialTransfers: TransferProgress[] = stagedFiles.map((file, i) => ({
      id: `tr_${Date.now()}_${i}`,
      filename: file.name,
      progress: 0,
      status: 'uploading',
    }));
    setTransfers(initialTransfers);

    const formData = new FormData();
    stagedFiles.forEach(file => {
      formData.append('files', file);
    });

    formData.append('roomCode', roomCode);
    formData.append('senderId', currentPeerId);
    formData.append('senderName', senderName);
    if (targetPeerId) formData.append('targetId', targetPeerId);
    if (userEmail) formData.append('userEmail', userEmail);

    const isPackage = asSinglePackage && stagedFiles.length > 1;
    formData.append('isPackage', isPackage ? 'true' : 'false');
    if (isPackage) {
      formData.append(
        'packageName',
        customPackageName.trim() || `Pacote com ${stagedFiles.length} arquivos`
      );
    }

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);

      xhr.upload.onprogress = event => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadPercent(percent);
          setUploadStatusText(
            isPackage
              ? `Enviando pacote (${percent}%) - ${formatBytes(event.loaded)} de ${formatBytes(event.total)}`
              : `Enviando arquivos (${percent}%)`
          );
          setTransfers(prev =>
            prev.map(item => ({
              ...item,
              progress: percent,
              status: percent >= 100 ? 'processing' : 'uploading',
            }))
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadPercent(100);
          setUploadStatusText('Pacote transferido com sucesso!');
          setTransfers(prev =>
            prev.map(item => ({
              ...item,
              progress: 100,
              status: 'completed',
            }))
          );

          // Record to transfer history
          if (onRecordTransfer) {
            if (isPackage) {
              onRecordTransfer({
                name: customPackageName.trim() || `Pacote com ${stagedFiles.length} arquivos`,
                kind: 'package',
                direction: 'sent',
                status: 'success',
                size: totalStagedSize,
                fileCount: stagedFiles.length,
                senderName,
                targetName: targetPeerName || 'Todos os Dispositivos',
              });
            } else {
              stagedFiles.forEach(f => {
                onRecordTransfer({
                  name: f.name,
                  kind: 'file',
                  direction: 'sent',
                  status: 'success',
                  size: f.size,
                  mimetype: f.type,
                  senderName,
                  targetName: targetPeerName || 'Todos os Dispositivos',
                });
              });
            }
          }

          try {
            confetti({
              particleCount: 65,
              spread: 70,
              origin: { y: 0.8 },
            });
          } catch {
            // ignore
          }

          onFilesUploaded();
          setTimeout(() => {
            clearStagedFiles();
            setTransfers([]);
            setIsUploading(false);
          }, 2000);
        } else {
          setUploadStatusText('Erro ao enviar os arquivos.');
          setTransfers(prev =>
            prev.map(item => ({
              ...item,
              status: 'error',
              error: 'Erro no envio',
            }))
          );

          if (onRecordTransfer) {
            onRecordTransfer({
              name: isPackage
                ? customPackageName.trim() || `Pacote com ${stagedFiles.length} arquivos`
                : stagedFiles[0]?.name || 'Arquivo',
              kind: isPackage ? 'package' : 'file',
              direction: 'sent',
              status: 'error',
              size: totalStagedSize,
              fileCount: stagedFiles.length,
              senderName,
              targetName: targetPeerName || 'Todos os Dispositivos',
              errorMessage: `Erro HTTP ${xhr.status}: Falha no servidor ou conexão rejeitada`,
            });
          }

          setIsUploading(false);
        }
      };

      xhr.onerror = () => {
        setUploadStatusText('Erro de conexão durante a transferência.');
        setTransfers(prev =>
          prev.map(item => ({
            ...item,
            status: 'error',
            error: 'Erro de rede',
          }))
        );

        if (onRecordTransfer) {
          onRecordTransfer({
            name: isPackage
              ? customPackageName.trim() || `Pacote com ${stagedFiles.length} arquivos`
              : stagedFiles[0]?.name || 'Arquivo',
            kind: isPackage ? 'package' : 'file',
            direction: 'sent',
            status: 'error',
            size: totalStagedSize,
            fileCount: stagedFiles.length,
            senderName,
            targetName: targetPeerName || 'Todos os Dispositivos',
            errorMessage: 'Erro de rede ou conexão interrompida durante a transferência',
          });
        }

        setIsUploading(false);
      };

      xhr.send(formData);
    } catch (err) {
      console.error('Upload exception:', err);
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
      {/* Target indicator banner */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span>Destino:</span>
          <strong className="text-white">
            {targetPeerName ? targetPeerName : 'Todos os Dispositivos'}
          </strong>
        </span>
        <span className="text-[11px] text-indigo-400 font-medium">
          Envio em lote e pacote unificado ativo
        </span>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-5 sm:p-7 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-indigo-500/50 bg-slate-950/40 hover:bg-slate-950/60'
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="w-13 h-13 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-2.5 shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Arraste múltiplos arquivos ou clique para selecionar
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Selecione vários arquivos de uma só vez para enviá-los como um pacote organizado.
          </p>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-950/60 border border-indigo-800/40 px-3 py-1 rounded-full">
            <Package className="w-3.5 h-3.5" />
            <span>Suporta envio de pacotes com fotos, PDFs, vídeos e zips</span>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>

      {/* Mobile-Friendly Quick Access Buttons (iPhone Native Actions) */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            cameraInputRef.current?.click();
          }}
          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all text-xs font-medium active:scale-95"
        >
          <Camera className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] sm:text-xs">Tirar Foto</span>
        </button>

        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            photoLibraryInputRef.current?.click();
          }}
          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all text-xs font-medium active:scale-95"
        >
          <Image className="w-4 h-4 text-sky-400" />
          <span className="text-[11px] sm:text-xs">Fototeca iPhone</span>
        </button>

        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all text-xs font-medium active:scale-95"
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="text-[11px] sm:text-xs">Mais Arquivos</span>
        </button>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileInputChange}
        />
        <input
          ref={photoLibraryInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>

      {/* Multi-File Staging Queue & Package Builder */}
      {stagedFiles.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border border-indigo-500/40 space-y-3.5 shadow-lg shadow-indigo-950/20">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-white tracking-tight">
                Pacote de Arquivos para Envio ({stagedFiles.length})
              </h4>
              <span className="text-xs font-mono text-slate-400">
                · {formatBytes(totalStagedSize)}
              </span>
            </div>

            <button
              onClick={clearStagedFiles}
              disabled={isUploading}
              className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpar fila</span>
            </button>
          </div>

          {/* Package Configuration */}
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Nome do Pacote (opcional)
              </label>
              <input
                type="text"
                disabled={isUploading}
                value={customPackageName}
                onChange={e => setCustomPackageName(e.target.value)}
                placeholder={`Ex: Pacote de Fotos e Documentos (${stagedFiles.length} arquivos)`}
                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={isUploading}
                checked={asSinglePackage}
                onChange={e => setAsSinglePackage(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
              />
              <span>
                Agrupar e disponibilizar download de todos em arquivo único <strong className="text-indigo-300">.ZIP</strong>
              </span>
            </label>
          </div>

          {/* Staged Files List (in sequential order) */}
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-900/60">
            {stagedFiles.map((file, idx) => {
              const { category } = getFileCategory(file.type, file.name);
              return (
                <div
                  key={`${file.name}-${idx}`}
                  className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] text-indigo-400 font-bold w-5 shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="text-slate-200 truncate max-w-[200px] sm:max-w-xs" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px] shrink-0">
                      ({formatBytes(file.size)})
                    </span>
                  </div>

                  {!isUploading && (
                    <button
                      onClick={() => removeStagedFile(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Remover arquivo do pacote"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Upload Action Button */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Mais</span>
            </button>

            <button
              type="button"
              disabled={isUploading}
              onClick={handleSendStagedFiles}
              className="flex-1 max-w-xs py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-98"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando Pacote...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    Enviar Pacote ({stagedFiles.length} {stagedFiles.length === 1 ? 'arquivo' : 'arquivos'})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Active Transfer Progress Bars */}
      {isUploading && (
        <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-indigo-300 font-medium">{uploadStatusText}</span>
            <span className="font-mono text-white font-bold">{uploadPercent}%</span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-200"
              style={{ width: `${uploadPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
