// Simple oscillator based audio + SpeechSynthesis
class AudioService {
  private ctx: AudioContext | null = null;
  private synth: SpeechSynthesis = window.speechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    this.loadVoice();
  }

  private loadVoice() {
    if (this.voice) return;
    const voices = this.synth.getVoices();
    // Prefer Chinese voice
    this.voice = voices.find(v => v.lang.includes('zh')) || voices[0] || null;
    
    // Some browsers load voices asynchronously
    if (!this.voice && voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            const updatedVoices = this.synth.getVoices();
            this.voice = updatedVoices.find(v => v.lang.includes('zh')) || updatedVoices[0] || null;
        };
    }
  }

  public speak(text: string) {
    // Cancel previous utterances to avoid queue buildup
    this.synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
        utterance.voice = this.voice;
    }
    utterance.lang = 'zh-CN';
    utterance.rate = 1.1; // Slightly faster for workout commands
    utterance.pitch = 1.0;
    
    this.synth.speak(utterance);
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
    // Voice handled in component
  }

  public playContract() {
    this.playTone(300, 0.1, 'triangle');
  }

  public playRelax() {
    this.playTone(500, 0.1, 'sine');
  }

  public playStep() {
    this.playTone(400, 0.05, 'square');
  }

  public playFinish() {
    this.playTone(523.25, 0.1);
    setTimeout(() => this.playTone(659.25, 0.1), 150);
    setTimeout(() => this.playTone(783.99, 0.4), 300);
    this.speak("训练完成，您真棒");
  }
}

export const audioService = new AudioService();
