import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Laptop,
  Monitor,
  Wifi,
  Radio,
  Send,
  CheckCircle2,
  User,
  Copy,
  Check,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { DevicePeer } from '../types';

interface PeerRadarProps {
  currentPeerId: string;
  peers: DevicePeer[];
  selectedTargetId: string | null;
  onSelectTarget: (peerId: string | null) => void;
  onOpenQrModal: () => void;
}

export const PeerRadar: React.FC<PeerRadarProps> = ({
  currentPeerId,
  peers,
  selectedTargetId,
  onSelectTarget,
  onOpenQrModal,
}) => {
  const [copiedIp, setCopiedIp] = useState(false);
  const [serverConfig, setServerConfig] = useState<{
    localIps?: string[];
    primaryIp?: string;
    androidHotspotIp?: string;
    port?: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setServerConfig(data))
      .catch(() => {});
  }, []);

  const otherPeers = peers.filter(p => p.id !== currentPeerId);
  const currentPeer = peers.find(p => p.id === currentPeerId);

  const hasAndroidPeer = peers.some(p => p.platform === 'Android');
  const isCurrentAndroid = currentPeer?.platform === 'Android';
  const isAndroidConnected = hasAndroidPeer || isCurrentAndroid;

  const androidTargetIp =
    serverConfig?.primaryIp && serverConfig.primaryIp !== '127.0.0.1'
      ? `${serverConfig.primaryIp}:${serverConfig.port || 3000}`
      : '192.168.43.1:3000';

  const handleCopyIp = () => {
    navigator.clipboard.writeText(`http://${androidTargetIp}`);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const getDeviceIcon = (peer: DevicePeer) => {
    if (peer.type === 'mobile') {
      return <Smartphone className="w-5 h-5 text-sky-400" />;
    }
    if (peer.platform === 'Windows' || peer.platform === 'Linux') {
      return <Monitor className="w-5 h-5 text-indigo-400" />;
    }
    return <Laptop className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-none transition-colors">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Dispositivos Conectados na Rede
          </h2>
          <span className="text-xs text-slate-600 dark:text-slate-500 font-mono">
            ({peers.length} {peers.length === 1 ? 'aparelho' : 'aparelhos'})
          </span>
        </div>

        {/* Target Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-600 dark:text-slate-400 hidden sm:inline font-medium">Destino:</span>
          <button
            onClick={() => onSelectTarget(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              selectedTargetId === null
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-transparent text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos ({otherPeers.length})
          </button>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Current Device Card */}
        {currentPeer && (
          <div className="relative p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-indigo-300 dark:border-indigo-500/40 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shrink-0">
                {getDeviceIcon(currentPeer)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentPeer.name}
                  </span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 px-1.5 py-0.2 rounded font-semibold">
                    Você
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  {currentPeer.platform || 'Online'}
                  {currentPeer.userEmail && ` · ${currentPeer.userEmail}`}
                </div>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Ativo</span>
            </div>
          </div>
        )}

        {/* Other Connected Devices */}
        {otherPeers.map(peer => {
          const isSelected = selectedTargetId === peer.id;
          return (
            <button
              key={peer.id}
              onClick={() => onSelectTarget(isSelected ? null : peer.id)}
              className={`relative p-3.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                isSelected
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-white dark:bg-slate-950/40 border-slate-300 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/60 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    peer.type === 'mobile'
                      ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20'
                      : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20'
                  }`}
                >
                  {getDeviceIcon(peer)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {peer.name}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                    {peer.platform}
                    {peer.userEmail ? ` · ${peer.userEmail}` : ' · Mesma Rede'}
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 dark:border-transparent dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {isSelected ? 'Destino' : 'Enviar'}
                </span>
              </div>
            </button>
          );
        })}

        {/* Quick Connect Another Device / iPhone Button Card */}
        {otherPeers.length === 0 && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-between gap-3 sm:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-200/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                <Radio className="w-4 h-4 text-sky-600 dark:text-sky-400 animate-pulse" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-300 block">
                  Aguardando conexão do iPhone ou outro PC
                </span>
                <span className="text-slate-600 dark:text-slate-500 font-medium">
                  Gere o QR Code no botão ao lado para conectar em 1 segundo.
                </span>
              </div>
            </div>
            <button
              onClick={onOpenQrModal}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-sm"
            >
              Exibir QR Code
            </button>
          </div>
        )}
      </div>

      {/* Android Connected Direct IP Banner */}
      {isAndroidConnected && (
        <div className="mt-3.5 p-3 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/30 border border-emerald-300 dark:border-emerald-700/60 text-xs shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900 dark:text-emerald-100">
                    Android Conectado
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold">
                    IP de Conexão Direta
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-emerald-300/90 font-medium">
                  Conexão via Wi-Fi local ou Roteador Hotspot do Android para transferências de alta velocidade:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 font-mono text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 shadow-xs">
                <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{androidTargetIp}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyIp}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs active:scale-95"
                title="Copiar URL completa com IP"
              >
                {copiedIp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIp ? 'Copiado!' : 'Copiar IP'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
