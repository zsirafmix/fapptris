/**
 * Flapptris - SoundManager Class
 * Procedural retro arcade audio using Web Audio API
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = this.loadMuteState();
    this.masterGain = null;
    this.initialized = false;
  }

  loadMuteState() {
    try {
      return localStorage.getItem('flapptris_muted') === 'true';
    } catch (e) {
      return false;
    }
  }

  saveMuteState() {
    try {
      localStorage.setItem('flapptris_muted', this.muted ? 'true' : 'false');
    } catch (e) {}
  }

  init() {
    if (this.initialized && this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.2, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.init();
    this.muted = !this.muted;
    this.saveMuteState();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.2, this.ctx.currentTime);
    }
    return this.muted;
  }

  playTone(freq, type, duration, targetFreq = null) {
    if (this.muted || !this.ctx) return;
    this.resume();

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type || 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(freq, now);

      if (targetFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, targetFreq), now + duration);
      }

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  playFlap() {
    // Upward pitch sweep (Flap / Jump)
    this.playTone(280, 'sine', 0.12, 600);
  }

  playRotate() {
    // Quick tech blip
    this.playTone(440, 'triangle', 0.08, 660);
  }

  playSlide() {
    // Subtle low tick
    this.playTone(150, 'sine', 0.05, 120);
  }

  playLock() {
    // Solid click / thump
    this.playTone(320, 'square', 0.14, 110);
  }

  playLineClear(lines = 1) {
    if (this.muted || !this.ctx) return;
    this.resume();

    // Reward chime / arpeggio
    const baseFreqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const count = Math.min(lines, 4);

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.playTone(baseFreqs[i], 'square', 0.15, baseFreqs[i] * 1.2);
      }, i * 70);
    }
  }

  playTetris() {
    // Epic 4-line fanfare
    if (this.muted || !this.ctx) return;
    this.resume();

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.22, freq * 1.05);
      }, idx * 80);
    });
  }

  playGameOver() {
    if (this.muted || !this.ctx) return;
    this.resume();

    // Descending sad synth buzz
    this.playTone(350, 'sawtooth', 0.4, 60);
    setTimeout(() => {
      this.playTone(180, 'sawtooth', 0.5, 45);
    }, 200);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundManager;
}
