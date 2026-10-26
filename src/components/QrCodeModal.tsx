import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  Wifi,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Globe,
  HardDrive,
  Info,
  ExternalLink,
} from 'lucide-react';
import { UserAccount } from '../types';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  userAccount: UserAccount;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  userAccount,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [includeAccount, setIncludeAccount] = useState(true);
  const [connectionMode, setConnectionMode] = useState<'cloud' | 'local'>('cloud');
  const [localIp, setLocalIp] = useState<string>('192.168.43.1:3000');
  const [show403Help, setShow403Help] = useState(true);
  const [serverConfig, setServerConfig] = useState<{
    appUrl?: string;
    sharedUrl?: string;
    devUrl?: string;
    userEmail?: string;
    localIps?: string[];
    primaryIp?: string;
    androidHotspotIp?: string;
    port?: number;
  } | null>(null);

  // Fetch server config on open
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setServerConfig(data);
        if (data.primaryIp && data.primaryIp !== '127.0.0.1') {
          setLocalIp(`${data.primaryIp}:${data.port || 3000}`);
        } else if (data.androidHotspotIp) {
          setLocalIp(`${data.androidHotspotIp}:${data.port || 3000}`);
        }
      })
      .catch(err => console.warn('Could not fetch server config:', err));
  }, [isOpen]);

  // Construct pairing URL based on selected mode
  const getPairingUrl = () => {
    if (typeof window === 'undefined') return '';

    let base = window.location.origin + window.location.pathname;

    if (connectionMode === 'local') {
      const cleanIp = localIp.trim().replace(/^https?:\/\//, '');
      base = `http://${cleanIp}`;
    } else if (serverConfig?.appUrl) {
      base = serverConfig.appUrl;
    }

    const params = new URLSearchParams();
    params.set('room', roomCode);

    if (includeAccount && (userAccount.isLoggedIn || serverConfig?.userEmail)) {
      const email = userAccount.isLoggedIn ? userAccount.email : serverConfig?.userEmail || 'contosf47@gmail.com';
      const name = userAccount.isLoggedIn ? userAccount.name : 'Carlos Santos';
      params.set('email', email);
      params.set('name', name);
      if (userAccount.avatar) params.set('avatar', userAccount.avatar);
    }

    return `${base}${base.includes('?') ? '&' : '?'}${params.toString()}`;
  };

  const pairingUrl = getPairingUrl();

  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(pairingUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR Code:', err));
  }, [isOpen, pairingUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pairingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const activeEmail = userAccount.isLoggedIn
    ? userAccount.email
    : serverConfig?.userEmail || 'contosf47@gmail.com';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 text-slate-900 dark:text-slate-100 my-8 transition-colors">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 mb-2">
            <Smartphone className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Conectar iPhone ao Computador
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Abra a <strong className="text-slate-900 dark:text-slate-200 font-semibold">Câmera do seu iPhone</strong> e aponte para o QR Code abaixo.
          </p>
        </div>

        {/* Diagnostic 403 Solution Alert Box */}
        <div className="mb-4 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/90 dark:bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Apareceu o erro "Google 403 - Você não tem acesso"?</span>
            </div>
            <button
              type="button"
              onClick={() => setShow403Help(!show403Help)}
              className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 flex items-center gap-0.5 shrink-0"
            >
              <span>{show403Help ? 'Recolher' : 'Como resolver'}</span>
              {show403Help ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {show403Help && (
            <div className="pt-1.5 border-t border-amber-200 dark:border-amber-500/20 space-y-2 text-slate-700 dark:text-slate-300 text-[11px]">
              <p>
                O ambiente de desenvolvimento do Google Cloud Run protege o acesso exigindo que o navegador Safari do iPhone esteja conectado com a mesma conta Google (<strong className="text-amber-800 dark:text-amber-300">{activeEmail}</strong>).
              </p>
              <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-lg border border-amber-300 dark:border-amber-500/30 space-y-1.5 font-medium">
                <p className="text-amber-900 dark:text-amber-200 font-bold">Como resolver em 2 passos rápidos no iPhone:</p>
                <div className="flex items-start gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-200 dark:bg-amber-400/20 text-amber-900 dark:text-amber-300 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">1</span>
                  <span>
                    No Safari do seu iPhone, abra <a href="https://accounts.google.com" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 underline font-semibold">accounts.google.com</a> e faça login com a conta <strong className="text-amber-900 dark:text-amber-300">{activeEmail}</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-200 dark:bg-amber-400/20 text-amber-900 dark:text-amber-300 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">2</span>
                  <span>
                    Aponte a Câmera do iPhone para este QR Code novamente. Ele abrirá o aplicativo direto, sem nenhum erro 403!
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Connection Mode Selector */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Origem do Link para o QR Code:</span>
            <span className="text-[10px] text-slate-500">Alternar se necessário</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setConnectionMode('cloud')}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                connectionMode === 'cloud'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Link Nuvem (AI Studio)</span>
            </button>

            <button
              type="button"
              onClick={() => setConnectionMode('local')}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                connectionMode === 'local'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800 dark:hover:text-white'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>IP Local Wi-Fi (Sem 403)</span>
            </button>
          </div>

          {/* Local IP manual override & presets */}
          {connectionMode === 'local' && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-slate-700 dark:text-slate-400 font-semibold">
                  IP para Conexão Direta (porta :3000):
                </label>
                <span className="text-[10px] text-slate-500 font-medium">1-clique para preencher:</span>
              </div>

              {/* Android Hotspot & Local LAN IP Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLocalIp('192.168.43.1:3000')}
                  className="px-2 py-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-950/80 dark:hover:bg-emerald-900/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-mono text-[10px] font-bold flex items-center gap-1 transition-colors"
                >
                  <span>🤖 Hotspot Android (192.168.43.1)</span>
                </button>

                {serverConfig?.primaryIp && serverConfig.primaryIp !== '192.168.43.1' && (
                  <button
                    type="button"
                    onClick={() => setLocalIp(`${serverConfig.primaryIp}:${serverConfig.port || 3000}`)}
                    className="px-2 py-1 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>💻 IP Wi-Fi ({serverConfig.primaryIp})</span>
                  </button>
                )}
              </div>

              <input
                type="text"
                value={localIp}
                onChange={e => setLocalIp(e.target.value)}
                placeholder="192.168.43.1:3000"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono outline-none"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                No Android com Ponto de Acesso ativado, use <strong>192.168.43.1:3000</strong>. Os aparelhos conectam sem precisar de internet ou login do Google.
              </span>
            </div>
          )}
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mx-auto max-w-[240px]">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code de Pareamento iPhone"
              className="w-full h-auto rounded-lg"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
              Gerando QR Code...
            </div>
          )}
        </div>

        {/* Room Code Badge & Copy Link */}
        <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-800">
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Código da Sala</div>
            <div className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
              {roomCode}
            </div>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? 'Copiado!' : 'Copiar Link Completo'}
          </button>
        </div>

        {/* Google Account Auto-Sync Checkbox */}
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-300 dark:border-slate-800/60">
          <input
            type="checkbox"
            checked={includeAccount}
            onChange={e => setIncludeAccount(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
          />
          <span>
            Vincular conta Google <strong className="text-indigo-600 dark:text-indigo-300 font-semibold">{activeEmail}</strong> no iPhone
          </span>
        </label>

        {/* Footer info */}
        <div className="mt-4 border-t border-slate-200 dark:border-slate-800/80 pt-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Computador e iPhone devem estar conectados na mesma rede Wi-Fi.</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Transferência direta ponta a ponta sem limite de tamanho ou formato.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
