// Simple oscillator based audio to avoid external file dependencies
class AudioService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public playTone(frequency: number = 440, duration: number = 0.1, type: OscillatorType = 'sine') {
    try {
      this.init();
      if (!this.ctx) return;
      
      // Resume context if suspended (browser policy)
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  }

  public playStart() {
    this.playTone(600, 0.2, 'sine');
    setTimeout(() => this.playTone(800, 0.4, 'sine'), 200);
  }

  public playContract() {
    this.playTone(300, 0.3, 'triangle');
  }

  public playRelax() {
    this.playTone(500, 0.3, 'sine');
  }

  public playFinish() {
    this.playTone(523.25, 0.1);
    setTimeout(() => this.playTone(659.25, 0.1), 150);
    setTimeout(() => this.playTone(783.99, 0.4), 300);
  }
}

export const audioService = new AudioService();