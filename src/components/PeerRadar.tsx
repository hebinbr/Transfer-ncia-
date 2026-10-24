import React from 'react';
import { Smartphone, Laptop, Monitor, Wifi, Radio, Send, CheckCircle2, User } from 'lucide-react';
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
  const otherPeers = peers.filter(p => p.id !== currentPeerId);
  const currentPeer = peers.find(p => p.id === currentPeerId);

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
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-sm font-semibold text-white tracking-tight">
            Dispositivos Conectados na Rede
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            ({peers.length} {peers.length === 1 ? 'aparelho' : 'aparelhos'})
          </span>
        </div>

        {/* Target Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 hidden sm:inline">Destino:</span>
          <button
            onClick={() => onSelectTarget(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedTargetId === null
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/70 text-slate-300 hover:text-white'
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
          <div className="relative p-3.5 rounded-xl bg-slate-950/70 border border-indigo-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                {getDeviceIcon(currentPeer)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate">
                    {currentPeer.name}
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-medium">
                    Você
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {currentPeer.platform || 'Online'}
                  {currentPeer.userEmail && ` · ${currentPeer.userEmail}`}
                </div>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
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
                  ? 'bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    peer.type === 'mobile'
                      ? 'bg-sky-500/10 border-sky-500/20'
                      : 'bg-indigo-500/10 border-indigo-500/20'
                  }`}
                >
                  {getDeviceIcon(peer)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">
                      {peer.name}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {peer.platform}
                    {peer.userEmail ? ` · ${peer.userEmail}` : ' · Mesma Rede'}
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300'
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
          <div className="p-3.5 rounded-xl bg-slate-950/30 border border-dashed border-slate-800 flex items-center justify-between gap-3 sm:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800/60 text-slate-400 flex items-center justify-center">
                <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-slate-300 block">
                  Aguardando conexão do iPhone ou outro PC
                </span>
                <span className="text-slate-500">
                  Gere o QR Code no botão ao lado para conectar em 1 segundo.
                </span>
              </div>
            </div>
            <button
              onClick={onOpenQrModal}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shrink-0 transition-colors shadow-sm"
            >
              Exibir QR Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
