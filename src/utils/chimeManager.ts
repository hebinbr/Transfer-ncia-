/**
 * Chime & Notification Audio Manager
 * Generates synthetic notification chimes via Web Audio API.
 * Works 100% offline, requires zero external audio files, zero network requests,
 * and maintains user sound preference in localStorage.
 */

export type ChimeSoundType = 'airdrop' | 'crystal' | 'pop' | 'marimba' | 'none';

export interface ChimeOption {
  id: ChimeSoundType;
  name: string;
  description: string;
}

export const CHIME_OPTIONS: ChimeOption[] = [
  {
    id: 'airdrop',
    name: 'AirDrop (Padrão)',
    description: 'Tom duplo moderno e nítido (D5 → A5)',
  },
  {
    id: 'crystal',
    name: 'Cristal Harmônico',
    description: 'Acorde brilhante e cristalino (C6, E6, G6)',
  },
  {
    id: 'pop',
    name: 'Pop Suave',
    description: 'Clique de bolha sutil e discreto',
  },
  {
    id: 'marimba',
    name: 'Marimba Acústica',
    description: 'Toque aveludado e relaxante de madeira',
  },
  {
    id: 'none',
    name: 'Desativado (Mudo)',
    description: 'Nenhum som ao receber arquivos ou pacotes',
  },
];

const CHIME_STORAGE_KEY = 'airshare_chime_sound';

/**
 * Retrieves the user's stored chime preference from localStorage.
 */
export function getChimeSound(): ChimeSoundType {
  if (typeof window === 'undefined') return 'airdrop';
  const saved = localStorage.getItem(CHIME_STORAGE_KEY);
  if (saved && ['airdrop', 'crystal', 'pop', 'marimba', 'none'].includes(saved)) {
    return saved as ChimeSoundType;
  }
  return 'airdrop';
}

/**
 * Persists the user's chime preference into localStorage.
 */
export function setChimeSound(sound: ChimeSoundType): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHIME_STORAGE_KEY, sound);
}

// Shared AudioContext instance (lazy initialized to comply with browser autoplay policies)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * Plays the specified chime sound, or defaults to the user's saved preference.
 */
export function playChime(soundType?: ChimeSoundType): void {
  const sound = soundType || getChimeSound();
  if (sound === 'none') return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  try {
    switch (sound) {
      case 'airdrop': {
        // Tone 1: D5 (587.33 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);

        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.18, now + 0.015);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.13);

        // Tone 2: A5 (880 Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.08);

        gain2.gain.setValueAtTime(0, now + 0.08);
        gain2.gain.linearRampToValueAtTime(0.24, now + 0.095);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.52);
        break;
      }

      case 'crystal': {
        // Bright staggered triad: C6 (1046.5Hz), E6 (1318.5Hz), G6 (1567.98Hz)
        const notes = [
          { freq: 1046.5, delay: 0 },
          { freq: 1318.5, delay: 0.04 },
          { freq: 1567.98, delay: 0.08 },
        ];

        notes.forEach(({ freq, delay }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + delay);

          gain.gain.setValueAtTime(0, now + delay);
          gain.gain.linearRampToValueAtTime(0.14, now + delay + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.65);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.68);
        });
        break;
      }

      case 'pop': {
        // Bubble pop sound (frequency sweep)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }

      case 'marimba': {
        // Warm mallet strike (fundamental C5 + gentle harmonic)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, now);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.5, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.37);
        osc2.stop(now + 0.37);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.warn('Audio chime playback warning:', err);
  }
}
