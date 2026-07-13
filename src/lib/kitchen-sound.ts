let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return audioContext;
}

function playTone(
  frequency: number,
  duration: number,
  volume = 0.35,
  type: OscillatorType = "sine"
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  oscillator.start(now);
  oscillator.stop(now + duration);
}

/** Pedido novo enviado à cozinha */
export function playNewOrderSound() {
  playTone(880, 0.12, 0.4);
  setTimeout(() => playTone(1100, 0.18, 0.4), 140);
}

/** Alerta vermelho (cancelamento, alteração, transferência) */
export function playKitchenAlertSound() {
  playTone(520, 0.2, 0.45, "square");
  setTimeout(() => playTone(390, 0.25, 0.45, "square"), 180);
  setTimeout(() => playTone(520, 0.2, 0.45, "square"), 420);
}
