import React, { useState } from 'react';
import { Send, Copy, Check, MessageSquare, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { SharedTextItem } from '../types';
import { formatRelativeTime } from '../utils/formatters';

interface QuickTextShareProps {
  texts: SharedTextItem[];
  roomCode: string;
  senderId: string;
  senderName: string;
  onTextSent: () => void;
}

export const QuickTextShare: React.FC<QuickTextShareProps> = ({
  texts,
  roomCode,
  senderId,
  senderName,
  onTextSent,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const isUrl = (val: string) => {
    try {
      return val.startsWith('http://') || val.startsWith('https://');
    } catch {
      return false;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSending(true);
    const type = isUrl(inputText.trim()) ? 'url' : 'text';

    try {
      const res = await fetch('/api/share-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          type,
          senderId,
          senderName,
          roomCode,
        }),
      });

      if (res.ok) {
        setInputText('');
        onTextSent();
      }
    } catch (err) {
      console.error('Error sharing text:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-none transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Área de Transferência & Links Rápidos
          </h3>
        </div>
        <span className="text-[11px] text-slate-600 dark:text-slate-500 font-medium">
          Sincronização imediata iPhone & PC
        </span>
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Cole um link, texto, código ou nota para enviar ao outro aparelho..."
          className="flex-1 bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 focus:border-indigo-600 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors shadow-xs"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Enviar</span>
        </button>
      </form>

      {/* Shared Texts List */}
      {texts.length > 0 ? (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {texts.map(item => {
            const isLink = item.type === 'url' || isUrl(item.text);
            return (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-start justify-between gap-3 text-xs shadow-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-300">
                      {item.senderName}
                    </span>
                    <span>·</span>
                    <span>{formatRelativeTime(item.createdAt)}</span>
                  </div>

                  <p className="text-slate-900 dark:text-slate-100 break-words select-all font-medium">
                    {item.text}
                  </p>

                  {isLink && (
                    <a
                      href={item.text}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 hover:underline mt-1 font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Abrir link</span>
                    </a>
                  )}
                </div>

                <button
                  onClick={() => handleCopy(item.text, item.id)}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:border-transparent dark:text-slate-300 dark:hover:text-white shrink-0 transition-colors shadow-xs"
                  title="Copiar texto"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center py-4 text-xs text-slate-600 dark:text-slate-500 font-medium">
          Nenhum texto compartilhado recentemente. Envie notas ou links rápidos acima!
        </p>
      )}
    </div>
  );
};
