import React, { useState } from 'react';
import { X, Check, LogOut, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { UserAccount } from '../types';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAccount: UserAccount;
  onLogin: (email: string, name: string, avatar?: string) => void;
  onLogout: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  userAccount,
  onLogin,
  onLogout,
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!isOpen) return null;

  // Default suggested account from user context
  const defaultEmail = 'contosf47@gmail.com';
  const defaultName = 'Carlos Santos';

  const handleQuickLogin = (email: string, name: string) => {
    const avatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`;
    onLogin(email, name, avatar);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const name = customName.trim() || customEmail.split('@')[0];
    const avatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(customEmail)}`;
    onLogin(customEmail.trim().toLowerCase(), name, avatar);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-lg p-2.5 mb-3">
            <svg className="w-full h-full" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {userAccount.isLoggedIn ? 'Conta Google Conectada' : 'Login com Conta Google'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Faça login com a mesma conta no iPhone e no Computador para sincronizar e enviar arquivos automaticamente.
          </p>
        </div>

        {userAccount.isLoggedIn ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30 flex items-center gap-3">
              {userAccount.avatar ? (
                <img
                  src={userAccount.avatar}
                  alt={userAccount.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-sm">
                  {userAccount.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {userAccount.name}
                </div>
                <div className="text-xs text-indigo-300 truncate font-mono">
                  {userAccount.email}
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Check className="w-3 h-3" />
                  <span>Sincronização ativa entre aparelhos</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Desconectar desta Conta</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Quick 1-Click Login Option */}
            <button
              onClick={() => handleQuickLogin(defaultEmail, defaultName)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 transition-all font-medium text-sm shadow-md active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  C
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900">
                    Continuar como {defaultName}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {defaultEmail}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Toggle another account */}
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="w-full text-center py-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Entrar com outro e-mail Google
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="pt-2 space-y-3 border-t border-slate-800">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    E-mail Google (@gmail.com)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={customEmail}
                      onChange={e => setCustomEmail(e.target.value)}
                      placeholder="seu.email@gmail.com"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Seu Nome (opcional)
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="Ex: Carlos"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-md shadow-indigo-600/20"
                >
                  Confirmar e Conectar
                </button>
              </form>
            )}

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-center gap-1.5 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Sincronização instantânea na mesma rede sem salvar senhas.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
