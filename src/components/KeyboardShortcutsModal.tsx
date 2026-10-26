import React from 'react';
import {
  X,
  Keyboard,
  Scan,
  Clock,
  UploadCloud,
  QrCode,
  ArrowLeftRight,
  SunMoon,
  Bell,
  Sparkles,
} from 'lucide-react';

export interface ShortcutDefinition {
  id: string;
  keys: string[];
  description: string;
  category: 'primary' | 'room' | 'system';
  icon: React.ReactNode;
  action: () => void;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScanner: () => void;
  onToggleHistory: () => void;
  onTriggerUpload: () => void;
  onOpenQrModal: () => void;
  onOpenRoomModal: () => void;
  onToggleTheme: () => void;
  onOpenNotifications: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onOpenScanner,
  onToggleHistory,
  onTriggerUpload,
  onOpenQrModal,
  onOpenRoomModal,
  onToggleTheme,
  onOpenNotifications,
}) => {
  if (!isOpen) return null;

  const isMac =
    typeof navigator !== 'undefined' &&
    (/Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent) ||
      (navigator.platform && navigator.platform.toUpperCase().indexOf('MAC') >= 0));

  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts: ShortcutDefinition[] = [
    {
      id: 'scanner',
      keys: [modKey, 'K'],
      description: 'Abrir Scanner de QR Code (Câmera)',
      category: 'primary',
      icon: <Scan className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      action: () => {
        onClose();
        onOpenScanner();
      },
    },
    {
      id: 'history',
      keys: [modKey, 'H'],
      description: 'Ver Histórico de Transferências (Alternar)',
      category: 'primary',
      icon: <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
      action: () => {
        onClose();
        onToggleHistory();
      },
    },
    {
      id: 'upload',
      keys: [modKey, 'U'],
      description: 'Abrir Menu de Upload de Arquivos',
      category: 'primary',
      icon: <UploadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      action: () => {
        onClose();
        onTriggerUpload();
      },
    },
    {
      id: 'qr',
      keys: [modKey, 'G'],
      description: 'Gerar QR Code de Pareamento para iPhone',
      category: 'room',
      icon: <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
      action: () => {
        onClose();
        onOpenQrModal();
      },
    },
    {
      id: 'room',
      keys: [modKey, 'J'],
      description: 'Trocar Código da Sala de Pareamento',
      category: 'room',
      icon: <ArrowLeftRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      action: () => {
        onClose();
        onOpenRoomModal();
      },
    },
    {
      id: 'theme',
      keys: [isMac ? '⌥' : 'Alt', 'T'],
      description: 'Alternar Tema Claro / Escuro',
      category: 'system',
      icon: <SunMoon className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      action: () => {
        onToggleTheme();
      },
    },
    {
      id: 'notifications',
      keys: [modKey, 'P'],
      description: 'Configurar Alertas e Notificações',
      category: 'system',
      icon: <Bell className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      action: () => {
        onClose();
        onOpenNotifications();
      },
    },
    {
      id: 'help',
      keys: [modKey, '/'],
      description: 'Abrir este painel de Atalhos de Teclado',
      category: 'system',
      icon: <Keyboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
      action: () => {},
    },
    {
      id: 'escape',
      keys: ['Esc'],
      description: 'Fechar janelas e modais ativos',
      category: 'system',
      icon: <X className="w-4 h-4 text-slate-400" />,
      action: () => {
        onClose();
      },
    },
  ];

  const primaryShortcuts = shortcuts.filter(s => s.category === 'primary');
  const otherShortcuts = shortcuts.filter(s => s.category !== 'primary');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 transition-colors duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="shortcuts-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"
              >
                <span>Atalhos de Teclado</span>
                <span className="text-[10px] font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                  {modKey} + K / H / U
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Navegue e execute ações rápidas sem tirar as mãos do teclado.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fechar atalhos"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Shortcut List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Main Requested Shortcuts Category */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ações Mais Usadas</span>
            </div>

            <div className="space-y-2">
              {primaryShortcuts.map(sc => (
                <div
                  key={sc.id}
                  onClick={sc.action}
                  className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 dark:bg-slate-950/70 dark:hover:bg-indigo-950/40 dark:border-slate-800/80 transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-xs">
                      {sc.icon}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                      {sc.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    {sc.keys.map((k, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span className="text-xs text-slate-400 font-bold">+</span>}
                        <kbd className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 shadow-xs group-hover:border-indigo-400 dark:group-hover:border-indigo-500">
                          {k}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Shortcuts */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Navegação e Sistema
            </div>

            <div className="space-y-1.5">
              {otherShortcuts.map(sc => (
                <div
                  key={sc.id}
                  onClick={sc.action}
                  className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400">
                      {sc.icon}
                    </div>
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate group-hover:text-slate-950 dark:group-hover:text-white">
                      {sc.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    {sc.keys.map((k, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span className="text-[10px] text-slate-400 font-bold">+</span>}
                        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
                          {k}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer tip */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span>Dica: Pressione</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono font-bold">
              ?
            </kbd>
            <span>a qualquer momento para ver esta tela.</span>
          </span>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
