import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  ExternalLink,
  Sparkles,
  Timer,
} from 'lucide-react';
import {
  NotificationPermissionState,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  isTabInBackground,
} from '../utils/notificationManager';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissionState: NotificationPermissionState;
  onPermissionChange: (state: NotificationPermissionState) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  permissionState,
  onPermissionChange,
}) => {
  const [testSent, setTestSent] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    let timer: any;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      // Send test notification after countdown
      sendTestNotification();
      setTestSent(true);
      setCountdown(null);
      setTimeout(() => setTestSent(false), 5000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    onPermissionChange(result);
    if (result === 'granted') {
      sendTestNotification();
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    }
  };

  const handleImmediateTest = () => {
    sendTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
  };

  const handleDelayed5sTest = () => {
    setCountdown(5);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notificações em Segundo Plano</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Notification API do navegador</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="mb-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Status da Permissão
            </span>
            {permissionState === 'granted' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ativada
              </span>
            )}
            {permissionState === 'default' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                <AlertCircle className="w-3.5 h-3.5" />
                Pendente
              </span>
            )}
            {permissionState === 'denied' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
                <BellOff className="w-3.5 h-3.5" />
                Bloqueada
              </span>
            )}
            {permissionState === 'unsupported' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20">
                Não suportada
              </span>
            )}
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {permissionState === 'granted' &&
              'O navegador tem permissão para exibir alertas. Você será avisado sempre que arquivos forem recebidos enquanto esta aba estiver minimizada ou em segundo plano.'}
            {permissionState === 'default' &&
              'Permita que o navegador envie notificações nativas para você saber no instante exato em que fotos ou arquivos forem transferidos.'}
            {permissionState === 'denied' &&
              'As notificações foram bloqueadas nas configurações do seu navegador. Para ativá-las, clique no ícone de cadeado/configurações ao lado da URL na barra de endereços.'}
            {permissionState === 'unsupported' &&
              'Este navegador ou dispositivo não possui suporte nativo à Notification API.'}
          </p>
        </div>

        {/* Feature Explanations */}
        <div className="space-y-2.5 mb-6 text-xs text-slate-700 dark:text-slate-300 font-medium">
          <div className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1.5 shrink-0" />
            <span>
              <strong className="text-slate-900 dark:text-white">Alerta inteligente:</strong> O alerta sonoro toca sempre, mas a notificação do sistema só aparece quando a aba está em segundo plano para não atrapalhar.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1.5 shrink-0" />
            <span>
              <strong className="text-slate-900 dark:text-white">Foco em um clique:</strong> Clicar na notificação traz imediatamente a janela do AirShare para o primeiro plano.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1.5 shrink-0" />
            <span>
              <strong className="text-slate-900 dark:text-white">Detalhes completos:</strong> O alerta exibe o remetente, nome dos arquivos e tamanho do pacote transferido.
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3">
          {permissionState === 'default' && (
            <button
              onClick={handleRequestPermission}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
            >
              <Bell className="w-4 h-4" />
              Ativar Notificações Agora
            </button>
          )}

          {permissionState === 'granted' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleImmediateTest}
                  disabled={countdown !== null}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200 transition-all active:scale-95 disabled:opacity-50 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Testar Imediato
                </button>

                <button
                  onClick={handleDelayed5sTest}
                  disabled={countdown !== null}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 dark:border-indigo-500/30 dark:text-indigo-300 transition-all active:scale-95 disabled:opacity-50 shadow-xs"
                  title="Inicia 5 segundos para você trocar de aba e ver o alerta em segundo plano!"
                >
                  <Timer className="w-3.5 h-3.5" />
                  {countdown !== null ? `Mude de aba (${countdown}s)` : 'Testar em 5s'}
                </button>
              </div>

              {countdown !== null && (
                <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 text-center text-xs text-indigo-900 dark:text-indigo-200 font-semibold animate-pulse">
                  ⏳ <strong>Troque de aba agora!</strong> A notificação será disparada em {countdown} segundo(s).
                </div>
              )}

              {testSent && (
                <p className="text-center text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                  ✓ Notificação de teste disparada pelo navegador!
                </p>
              )}
            </div>
          )}

          {permissionState === 'denied' && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-900 dark:text-rose-200">
              <div className="font-bold mb-1 flex items-center gap-1.5 text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Como desbloquear:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 ml-1 font-medium">
                <li>Clique no cadeado ou botão de permissões na barra de endereço do navegador.</li>
                <li>Mude &quot;Notificações&quot; para <strong>Permitir</strong>.</li>
                <li>Recarregue a página para aplicar a alteração.</li>
              </ol>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
