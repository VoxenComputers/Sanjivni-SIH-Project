// Web Audio API Synthesizer for Zero-Dependency Audible Feedback

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenInterval: any = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended' && typeof document !== 'undefined' && !document.hidden) {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Duolingo-style warm ascending chime for task / game victory
  playSuccessChime(): void {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      // Ascending major notes: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.5);
      });
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  }

  // Tactile click pop for buttons
  playClickSound(): void {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      // Audio context might need gesture
    }
  }

  // Card flip click
  playCardFlipSound(): void {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(580, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      // ignore
    }
  }

  // Correct match cheerful pair
  playMatchSound(): void {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.2);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    } catch (e) {
      // ignore
    }
  }

  // Caregiver SOS emergency alert siren - continuous alarm loop until explicitly stopped
  startSiren(): void {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (this.sirenInterval) return;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      let highTone = true;

      const playTone = () => {
        if (!this.sirenInterval) return;
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(highTone ? 920 : 620, ctx.currentTime);
          gain.gain.setValueAtTime(0.35, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.38);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
          highTone = !highTone;
        } catch (err) {
          // ignore
        }
      };

      playTone();
      this.sirenInterval = setInterval(playTone, 450);
    } catch (e) {
      console.warn('Siren failed:', e);
    }
  }

  stopSiren(): void {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
      } catch (e) {
        // ignore
      }
      this.sirenOsc = null;
    }
  }

  playEmergencyAlert(): void {
    this.startSiren();
    setTimeout(() => {
      this.stopSiren();
    }, 2500);
  }

  stopAll(): void {
    this.stopSiren();
    if (this.ctx && this.ctx.state === 'running') {
      try {
        this.ctx.suspend();
      } catch (e) {
        // ignore
      }
    }
  }

  resumeAudio(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        this.ctx.resume();
      } catch (e) {
        // ignore
      }
    }
  }
}

export const soundFx = new SoundSynthesizer();
