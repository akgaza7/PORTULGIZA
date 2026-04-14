import { useCallback, useRef } from "react";

// Uses Web Audio API to generate subtle synthesised sounds — no files needed
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playNoiseBurst(ctx: AudioContext, startTime: number, duration: number, gainValue: number) {
  const sampleRate = ctx.sampleRate;
  const bufferSize = Math.ceil(sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 1400;
  bandpass.Q.value = 0.6;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  source.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(ctx.destination);
  source.start(startTime);
  source.stop(startTime + duration + 0.01);
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  gainValue: number,
  type: OscillatorType = "sine"
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (!ctxRef.current) ctxRef.current = getAudioContext();
    return ctxRef.current;
  }, []);

  // Pleasant ascending two-note chime — C5 then E5
  const playCorrect = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(ctx, 523.25, now, 0.25, 0.18);      // C5
    playTone(ctx, 659.25, now + 0.12, 0.3, 0.15); // E5
    playTone(ctx, 783.99, now + 0.22, 0.35, 0.12); // G5
  }, [getCtx]);

  // Short descending buzz — low dull thud feel
  const playWrong = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(ctx, 220, now, 0.18, 0.15, "sawtooth");
    playTone(ctx, 174.61, now + 0.1, 0.22, 0.12, "sawtooth"); // F3
  }, [getCtx]);

  // Tick sound for timer countdown
  const playTick = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(ctx, 880, now, 0.05, 0.06, "square");
  }, [getCtx]);

  // Enthusiastic applause — noise bursts with bandpass filter
  const playClapping = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Rising burst pattern: 8 claps speeding up then settling
    const offsets = [0, 0.20, 0.38, 0.54, 0.68, 0.80, 0.91, 1.01, 1.10, 1.19, 1.27];
    const gains   = [0.35, 0.40, 0.45, 0.42, 0.38, 0.36, 0.34, 0.32, 0.30, 0.28, 0.25];
    offsets.forEach((t, i) => playNoiseBurst(ctx, now + t, 0.13, gains[i]));
    // Cheer chord at the end
    playTone(ctx, 523.25, now + 1.35, 0.6, 0.10);
    playTone(ctx, 659.25, now + 1.35, 0.6, 0.08);
    playTone(ctx, 783.99, now + 1.35, 0.6, 0.07);
  }, [getCtx]);

  return { playCorrect, playWrong, playTick, playClapping };
}
