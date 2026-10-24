import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, AlertCircle, ArrowRight, Keyboard } from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (roomCode: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onJoinRoom,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(
        'Não foi possível acessar a câmera. Você pode usar a Câmera nativa do iPhone ou digitar o código abaixo.'
      );
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onJoinRoom(manualCode.trim().toUpperCase());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-2">
            <Camera className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Escanear QR Code ou Entrar
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Aponte a câmera para a tela do computador ou digite o código de pareamento.
          </p>
        </div>

        {/* Camera Viewfinder */}
        {!cameraError ? (
          <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-black border-2 border-indigo-500/50 shadow-inner flex items-center justify-center mb-5">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Scanning Laser Animation */}
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-sky-400 shadow-[0_0_12px_#38bdf8] animate-pulse" />
            <div className="absolute inset-6 border-2 border-dashed border-white/40 rounded-xl pointer-events-none" />
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5 mb-5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Câmera não disponível no navegador</p>
              <p className="text-amber-400/80 mt-0.5">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Manual Code Input */}
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ou digite o código da sala mostrado no PC:</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value.toUpperCase())}
              placeholder="Ex: AIR-489"
              maxLength={12}
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-sm font-mono font-bold tracking-wider uppercase text-white placeholder-slate-600 outline-none"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
            >
              <span>Conectar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
