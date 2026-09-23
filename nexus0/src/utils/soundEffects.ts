/**
 * Web Audio API based sound effect engine for Nexus Arena
 * Provides crystal-clear, zero-latency esports audio cues without external assets.
 */

export interface SoundConfig {
  isMuted: boolean;
  messageSoundEnabled: boolean;
  friendRequestSoundEnabled: boolean;
}

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private messageSoundEnabled: boolean = true;
  private friendRequestSoundEnabled: boolean = true;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('nexus_sound_config');
      if (saved) {
        const parsed: Partial<SoundConfig> = JSON.parse(saved);
        this.isMuted = Boolean(parsed.isMuted);
        this.messageSoundEnabled = parsed.messageSoundEnabled !== false;
        this.friendRequestSoundEnabled = parsed.friendRequestSoundEnabled !== false;
      }
    } catch {}
  }

  public saveSettings(settings: SoundConfig) {
    this.isMuted = settings.isMuted;
    this.messageSoundEnabled = settings.messageSoundEnabled;
    this.friendRequestSoundEnabled = settings.friendRequestSoundEnabled;
    try {
      localStorage.setItem('nexus_sound_config', JSON.stringify({
        isMuted: this.isMuted,
        messageSoundEnabled: this.messageSoundEnabled,
        friendRequestSoundEnabled: this.friendRequestSoundEnabled,
      }));
    } catch {}
  }

  public getSettings(): SoundConfig {
    return {
      isMuted: this.isMuted,
      messageSoundEnabled: this.messageSoundEnabled,
      friendRequestSoundEnabled: this.friendRequestSoundEnabled,
    };
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.saveSettings({
      isMuted: this.isMuted,
      messageSoundEnabled: this.messageSoundEnabled,
      friendRequestSoundEnabled: this.friendRequestSoundEnabled,
    });
    return this.isMuted;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!this.audioCtx) {
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Futuristic crisp DM chat message chime (sine chime)
   */
  public playMessageSound() {
    if (this.isMuted || !this.messageSoundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch {
      // Audio autoplay restrictions or unsupported
    }
  }

  /**
   * Valorant-style tactical 3-tone ascending chime for incoming friend request
   */
  public playFriendRequestSound() {
    if (this.isMuted || !this.friendRequestSoundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Note 1 (C5 - 523.25Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Note 2 (E5 - 659.25Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, now + 0.1);
      gain2.gain.setValueAtTime(0.18, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.27);

      // Note 3 (A5 - 880Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(880, now + 0.22);
      gain3.gain.setValueAtTime(0.2, now + 0.22);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.22);
      osc3.stop(now + 0.5);
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
