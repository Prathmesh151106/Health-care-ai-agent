/**
 * features/reminders/alerts/sound.ts
 * Gentle synthesizer alert chime using the Web Audio API.
 * No external media file dependency.
 * Plays only when user enabled sound in preferences and browser allows it.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

export async function playReminderChime(volume = 0.7): Promise<boolean> {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.min(1.0, Math.max(0.0, volume)), now);
    masterGain.connect(ctx.destination);

    // Two pleasant harmonious notes (C5 -> G5)
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(523.25, now, 0.4);        // C5
    playTone(783.99, now + 0.25, 0.6); // G5

    return true;
  } catch {
    return false;
  }
}
