import { useEffect, useState } from 'react';

export interface ShortcutToastState {
  key: string;
  label: string;
}

export interface UseKeyboardShortcutsOptions {
  onOpenScanner: () => void;
  onToggleHistory: () => void;
  onTriggerUpload: () => void;
  onToggleShortcuts: () => void;
  onOpenQrModal: () => void;
  onOpenRoomModal: () => void;
  onCloseModals: () => void;
}

export function useKeyboardShortcuts({
  onOpenScanner,
  onToggleHistory,
  onTriggerUpload,
  onToggleShortcuts,
  onOpenQrModal,
  onOpenRoomModal,
  onCloseModals,
}: UseKeyboardShortcutsOptions) {
  const [activeToast, setActiveToast] = useState<ShortcutToastState | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const showToast = (key: string, label: string) => {
      setActiveToast({ key, label });
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setActiveToast(null);
      }, 2200);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      const hasModifier = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const isMac =
        typeof navigator !== 'undefined' &&
        (/Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent) ||
          (navigator.platform && navigator.platform.toUpperCase().indexOf('MAC') >= 0));
      const modLabel = isMac ? '⌘' : 'Ctrl';

      // Escape: dismiss any open modal
      if (e.key === 'Escape') {
        onCloseModals();
        return;
      }

      // Single key '?' opens help when not typing inside an input
      if (!hasModifier && e.key === '?' && !isInputFocused) {
        e.preventDefault();
        showToast('?', 'Atalhos de Teclado');
        onToggleShortcuts();
        return;
      }

      // Modifier key combinations: Ctrl+... or Cmd+...
      if (hasModifier) {
        // Ctrl+K / Cmd+K: Open QR Scanner Modal
        if (key === 'k') {
          e.preventDefault();
          showToast(`${modLabel}+K`, 'Scanner QR Code');
          onOpenScanner();
          return;
        }

        // Ctrl+H / Cmd+H: Toggle History Tab
        if (key === 'h') {
          e.preventDefault();
          showToast(`${modLabel}+H`, 'Histórico de Transferências');
          onToggleHistory();
          return;
        }

        // Ctrl+U / Cmd+U: Trigger File Upload Dialog
        if (key === 'u') {
          e.preventDefault();
          showToast(`${modLabel}+U`, 'Upload de Arquivos');
          onTriggerUpload();
          return;
        }

        // Ctrl+/ / Cmd+/: Open Keyboard Shortcuts Help
        if (key === '/') {
          e.preventDefault();
          showToast(`${modLabel}+/`, 'Atalhos de Teclado');
          onToggleShortcuts();
          return;
        }

        // Ctrl+G / Cmd+G: Generate QR Code Modal
        if (key === 'g') {
          e.preventDefault();
          showToast(`${modLabel}+G`, 'QR Code de Pareamento');
          onOpenQrModal();
          return;
        }

        // Ctrl+J / Cmd+J: Join/Switch Room Code
        if (key === 'j') {
          e.preventDefault();
          showToast(`${modLabel}+J`, 'Trocar Sala');
          onOpenRoomModal();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [
    onOpenScanner,
    onToggleHistory,
    onTriggerUpload,
    onToggleShortcuts,
    onOpenQrModal,
    onOpenRoomModal,
    onCloseModals,
  ]);

  return { activeToast };
}
