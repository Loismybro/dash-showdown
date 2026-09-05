// audio.js - High-Octane Procedural Hungry Shark Action & EDM Rhythm Engine + Realistic SFX
// Features Tom Salta style hybrid cinematic scoring: Taiko sub kicks, Jaws chromatic brass stabs,
// driving 16th synth bass, Gold Rush frenzy drops, real-time pitch-bending rocket thruster, and mechanical SFX.

class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.isPlaying = false;
    this.bpm = 130;
    this.step = 0; // 0 to 15 (16th notes per bar)
    this.bar = 0;
    this.nextNoteTime = 0;
    this.timerID = null;
    this.lookahead = 20.0; // ms
    this.scheduleAheadTime = 0.12; // seconds

    // Beat callbacks
    this.beatListeners = [];

    // Master bus
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    // Current track theme
    this.trackTheme = 1;
    this.isGoldRush = false;

    // Waveshaper distortion curve for brass growl and taiko punch
    this.driveCurve = null;

    // Continuous Rocket Thruster Audio Nodes
    this.thrusterActive = false;
    this.thrusterOsc = null;
    this.thrusterNoise = null;
    this.thrusterFilter = null;
    this.thrusterHissFilter = null;
    this.thrusterHissGain = null;
    this.thrusterMasterGain = null;

    // Hilarious Meme Audio Library
    this.memeClips = {};
    this.audioBuffers = {};
    this.customClips = {};
    this.pendingBuffers = {};
    this.activeSmurfAudio = null;
    this.preloadMemeAudio();
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.driveCurve = this.createDistortionCurve(20);
        this.setupBuses();
        this.setupContinuousThruster();
      }
    }
    if (this.ctx && this.pendingBuffers) {
      for (const [key, buf] of Object.entries(this.pendingBuffers)) {
        try {
          this.ctx.decodeAudioData(buf.slice(0), decoded => {
            this.audioBuffers[key] = decoded;
          }, () => {});
        } catch (e) {}
      }
      this.pendingBuffers = {};
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  createDistortionCurve(k = 20) {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  setupBuses() {
    if (!this.ctx) return;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.95, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);
  }

  setupContinuousThruster() {
    if (!this.ctx) return;
    try {
      // 1. Sub rumble saw oscillator
      this.thrusterOsc = this.ctx.createOscillator();
      this.thrusterOsc.type = 'sawtooth';
      this.thrusterOsc.frequency.setValueAtTime(42, this.ctx.currentTime);

      // 2. Brown noise buffer for rocket exhaust
      const bSize = this.ctx.sampleRate * 2;
      const nBuf = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
      const d = nBuf.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bSize; i++) {
        const white = Math.random() * 2 - 1;
        d[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = d[i];
      }
      this.thrusterNoise = this.ctx.createBufferSource();
      this.thrusterNoise.buffer = nBuf;
      this.thrusterNoise.loop = true;

      this.thrusterFilter = this.ctx.createBiquadFilter();
      this.thrusterFilter.type = 'lowpass';
      this.thrusterFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.thrusterHissFilter = this.ctx.createBiquadFilter();
      this.thrusterHissFilter.type = 'highpass';
      this.thrusterHissFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);

      this.thrusterHissGain = this.ctx.createGain();
      this.thrusterHissGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

      this.thrusterMasterGain = this.ctx.createGain();
      this.thrusterMasterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      // Connect graph
      this.thrusterOsc.connect(this.thrusterFilter);
      this.thrusterNoise.connect(this.thrusterFilter);
      this.thrusterFilter.connect(this.thrusterMasterGain);

      this.thrusterNoise.connect(this.thrusterHissFilter);
      this.thrusterHissFilter.connect(this.thrusterHissGain);
      this.thrusterHissGain.connect(this.thrusterMasterGain);

      this.thrusterMasterGain.connect(this.sfxGain);

      this.thrusterOsc.start();
      this.thrusterNoise.start();
    } catch (e) {
      console.warn("Thruster init error:", e);
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.9, this.ctx.currentTime, 0.03);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  onBeat(listener) {
    this.beatListeners.push(listener);
  }

  dispatchBeat(beatIndex, isBar, isDrop) {
    for (let i = 0; i < this.beatListeners.length; i++) {
      try {
        this.beatListeners[i]({
          beat: beatIndex,
          bar: this.bar,
          isBar: isBar,
          isDrop: isDrop,
          bpm: this.bpm
        });
      } catch (err) {}
    }
  }

  // -------------------------------------------------------------
  // PROCEDURAL HUNGRY SHARK / HYBRID CINEMATIC MUSIC ENGINE
  // -------------------------------------------------------------

  startMusic(bpm = 130, trackTheme = 1) {
    this.init();
    if (!this.ctx) return;

    this.bpm = bpm;
    this.trackTheme = trackTheme;
    this.step = 0;
    this.bar = 0;
    this.isPlaying = true;
    this.isGoldRush = (trackTheme >= 3);

    this.stopShipHum();

    this.nextNoteTime = this.ctx.currentTime + 0.05;
    if (this.timerID) clearInterval(this.timerID);
    this.timerID = setInterval(() => this.scheduler(), this.lookahead);
  }

  stopMusic() {
    this.isPlaying = false;
    if (this.timerID) {
      clearInterval(this.timerID);
      this.timerID = null;
    }
    this.stopShipHum();
  }

  scheduler() {
    if (!this.isPlaying || !this.ctx) return;
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.step, this.bar, this.nextNoteTime);
      this.advanceStep();
    }
  }

  advanceStep() {
    const secondsPer16th = (60.0 / this.bpm) / 4.0;
    this.nextNoteTime += secondsPer16th;
    this.step++;
    if (this.step >= 16) {
      this.step = 0;
      this.bar = (this.bar + 1) % 8; // 8-bar progression
    }
  }

  getTrackScales(theme) {
    switch (theme) {
      case 1: // Gothic Castle (Scary Gothic Church Organ & Choir in D Minor / Harmonic Minor)
        return {
          root: 73.42, // D2
          stabs: [73.42, 77.78], // D2 -> Eb2
          fanfareChords: [
            [146.83, 220.00, 349.23, 440.00], // Dm (D3, A3, F4, A4)
            [116.54, 174.61, 233.08, 349.23], // Bb (Bb2, F3, Bb3, F4)
            [98.00,  146.83, 196.00, 293.66], // Gm (G2, D3, G3, D4)
            [110.00, 164.81, 220.00, 277.18]  // A  (A2, E3, A3, C#4 - Harmonic Minor Leading Tone!)
          ],
          bassNotes: [73.42, 58.27, 49.00, 55.00],
          leadScale: [293.66, 311.13, 349.23, 392.00, 440.00, 466.16, 554.37, 587.33]
        };
      case 2: // Fairyland (Upbeat Cute Bubblegum Pop in C Major / F Major)
        return {
          root: 65.41, // C2
          stabs: [130.81, 164.81], // C3 -> E3
          fanfareChords: [
            [261.63, 329.63, 392.00, 523.25], // C Major  (C4, E4, G4, C5)
            [196.00, 246.94, 293.66, 392.00], // G Major  (G3, B3, D4, G4)
            [220.00, 261.63, 329.63, 440.00], // A Minor  (A3, C4, E4, A4)
            [174.61, 220.00, 261.63, 349.23]  // F Major  (F3, A3, C4, F4)
          ],
          bassNotes: [65.41, 49.00, 55.00, 43.65],
          leadScale: [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51] // High sparkling bells!
        };
      case 3: // Hungry Shark (Tom Salta Hybrid Cinematic Predator & Gold Rush Action)
        return {
          root: 73.42, // D2
          stabs: [73.42, 77.78], // D2 -> Eb2 (Iconic predator half-step motif!)
          fanfareChords: [
            [146.83, 220.00, 293.66], // Dm (D3, A3, D4)
            [116.54, 174.61, 233.08], // Bb (Bb2, F3, Bb3)
            [130.81, 196.00, 261.63], // C  (C3, G3, C4)
            [146.83, 220.00, 293.66]  // Dm
          ],
          bassNotes: [73.42, 58.27, 65.41, 73.42],
          leadScale: [293.66, 329.63, 349.23, 392.00, 440.00, 466.16, 523.25, 587.33]
        };
      case 4: // Cyber Matrix (Demon Predator Fury & Synthwave 152 BPM)
        return {
          root: 55.00, // A1
          stabs: [55.00, 58.27], // A1 -> Bb1
          fanfareChords: [
            [220.00, 261.63, 329.63], // Am
            [174.61, 220.00, 261.63], // F
            [196.00, 246.94, 293.66], // G
            [207.65, 261.63, 329.63]  // E / Am
          ],
          bassNotes: [55.00, 43.65, 49.00, 55.00],
          leadScale: [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 523.25]
        };
      default:
        return this.getTrackScales(1);
    }
  }

  scheduleStep(step, bar, time) {
    const isQuarter = (step % 4 === 0);
    const beatIndex = Math.floor(step / 4);
    const isDrop = (bar >= 4) || this.isGoldRush;
    const scale = this.getTrackScales(this.trackTheme);
    const chordIndex = Math.floor(bar / 2) % 4;

    // Dispatch beat pulse for visuals
    if (isQuarter) {
      const isBarStart = (step === 0);
      const delayMs = Math.max(0, (time - this.ctx.currentTime) * 1000);
      setTimeout(() => {
        this.dispatchBeat(beatIndex, isBarStart, isDrop);
      }, delayMs);
    }

    if (this.trackTheme === 1) {
      // 🏰 GOTHIC CASTLE: Scary Church Organ, Tolling Funeral Bells & Timpani
      this.scheduleGothicStep(step, bar, time, scale, chordIndex, isDrop);
    } else if (this.trackTheme === 2) {
      // 🧚 FAIRYLAND: Upbeat Cute Bubbly Pop, Kawaii Sparkling Bells & Pop Claps
      this.scheduleFairylandStep(step, bar, time, scale, chordIndex, isDrop);
    } else if (this.trackTheme === 3) {
      // 🦈 HUNGRY SHARK: Tom Salta Predator Brass Stabs & Gold Rush Frenzy
      this.scheduleSharkStep(step, bar, time, scale, chordIndex, isDrop);
    } else {
      // ⚡ CYBER MATRIX: Supersonic Cyber Bass, Laser Leads & Fast Drums
      this.scheduleCyberStep(step, bar, time, scale, chordIndex, isDrop);
    }
  }

  // ── 🏰 GOTHIC CASTLE SCHEDULER ──
  scheduleGothicStep(step, bar, time, scale, chordIndex, isDrop) {
    const isQuarter = (step % 4 === 0);

    // Ominous Church Funeral Bell on Bar 0 and Bar 4 downbeat
    if ((bar === 0 || bar === 4) && step === 0) {
      this.playChurchBell(time);
    }

    // Heavy Timpani & Gothic Sub Kick
    let playKick = false;
    let kickVol = 0.9;
    if (isDrop) {
      if (isQuarter) { playKick = true; kickVol = 1.0; }
      else if (step === 14) { playKick = true; kickVol = 0.8; }
    } else {
      if (step === 0 || step === 8) { playKick = true; kickVol = 0.85; }
      else if (bar % 2 === 1 && step === 14) { playKick = true; kickVol = 0.7; }
    }
    if (playKick) this.playCinematicTaiko(time, kickVol);

    // Gothic Snare / Rimshot on 4 & 12
    if (step === 4 || step === 12) {
      this.playSynthSnare(time, isDrop ? 0.7 : 0.5);
    }

    // High Hat Shiver
    this.playActionHat(time, step % 4 === 2, isDrop ? 0.35 : 0.2);

    // Church Pipe Organ Chords on downbeats and syncopations
    if (step === 0 || step === 6 || (step === 12 && isDrop)) {
      const chord = scale.fanfareChords[chordIndex];
      this.playGothicOrganChord(time, chord, isDrop ? 0.38 : 0.65, isDrop ? 0.32 : 0.26);
    }

    // Minor Bass
    const bassFreq = scale.bassNotes[chordIndex];
    if (step % 2 === 0 || isDrop) {
      this.playGoldRushSynthBass(time, bassFreq, step === 0 || step === 8, isDrop);
    }

    // Haunting Gothic Minor Organ Solo / Arpeggio
    if (step % 2 === 0 || step === 7 || step === 15) {
      const notes = scale.leadScale;
      const pattern = [0, 2, 4, 7, 5, 4, 2, 0, 3, 5, 6, 7, 6, 4, 2, 0];
      const noteIdx = (pattern[step] + (bar * 2)) % notes.length;
      this.playLeadPluck(time, notes[noteIdx], isDrop ? 0.32 : 0.22);
    }
  }

  // ── 🧚 FAIRYLAND CUTE POP SCHEDULER ──
  scheduleFairylandStep(step, bar, time, scale, chordIndex, isDrop) {
    const isQuarter = (step % 4 === 0);

    // Four-on-the-Floor Cheerful Pop Kick
    if (isQuarter) {
      this.playCutePopKick(time, isDrop ? 0.95 : 0.8);
    }

    // Snappy Pop Handclap on Beats 2 & 4 (steps 4 and 12)
    if (step === 4 || step === 12) {
      this.playPopClap(time);
    }

    // Shimmering Pop Hi-Hats on 16ths
    this.playActionHat(time, step % 4 === 2, isDrop ? 0.32 : 0.22);

    // Bubbly Cute Pop Chords on Upbeats (steps 2, 6, 10, 14)
    if (step === 2 || step === 6 || step === 10 || step === 14) {
      const chord = scale.fanfareChords[chordIndex];
      this.playCutePopChord(time, chord, 0.24);
    }

    // Bubbly Slap Pop Bass
    const bassFreq = scale.bassNotes[chordIndex];
    if (step % 2 === 0 || isDrop) {
      const isSlap = (step === 2 || step === 8 || step === 14);
      this.playCuteBubbleBass(time, bassFreq * (isSlap ? 2 : 1), isSlap);
    }

    // High Sparkling Kawaii Bell Arpeggios
    const notes = scale.leadScale;
    const kawaiiArp = [0, 2, 4, 7, 4, 2, 4, 7, 2, 4, 7, 9, 7, 4, 2, 0];
    const noteIdx = (kawaiiArp[step] + bar) % notes.length;
    if (step % 2 === 0 || step === 3 || step === 7 || step === 11 || step === 15) {
      this.playCutePopBell(time, notes[noteIdx], isDrop ? 0.35 : 0.25);
    }
  }

  // ── 🦈 HUNGRY SHARK SCHEDULER ──
  scheduleSharkStep(step, bar, time, scale, chordIndex, isDrop) {
    const isQuarter = (step % 4 === 0);
    let playTaiko = false;
    let taikoIntensity = 0.85;

    if (isDrop) {
      if (isQuarter) { playTaiko = true; taikoIntensity = 1.0; }
      else if (step === 14 || (bar % 2 === 1 && step === 10)) { playTaiko = true; taikoIntensity = 0.8; }
    } else {
      if (step === 0 || step === 8) { playTaiko = true; taikoIntensity = 0.9; }
      else if (bar % 2 === 1 && step === 14) { playTaiko = true; taikoIntensity = 0.75; }
    }
    if (bar === 3 && step >= 8 && step % 2 === 0) {
      playTaiko = true;
      taikoIntensity = 0.5 + (step - 8) * 0.06;
    }
    if (playTaiko) this.playCinematicTaiko(time, taikoIntensity);

    if (step === 4 || step === 12) {
      this.playSynthSnare(time, isDrop ? 0.75 : 0.55);
    } else if (bar === 3 && step >= 10) {
      this.playSynthSnare(time, 0.35 + (step - 10) * 0.08);
    }

    this.playActionHat(time, step % 4 === 2, isDrop ? 0.45 : 0.28);

    if (!isDrop && bar < 4) {
      if (step === 0) this.playPredatorBrass(time, scale.stabs[0], false, 0.45);
      else if (step === 6) this.playPredatorBrass(time, scale.stabs[1], false, 0.38);
      else if (step === 12 && bar % 2 === 1) this.playPredatorBrass(time, scale.stabs[0], true, 0.6);
    }

    const bassFreq = scale.bassNotes[chordIndex];
    if (isDrop || step % 2 === 0) {
      const isAccented = (step === 0 || step === 8 || step === 14);
      const octave = (isDrop && (step === 2 || step === 6 || step === 10 || step === 14)) ? 2 : 1;
      this.playGoldRushSynthBass(time, bassFreq * octave, isAccented, isDrop);
    }

    if (isDrop) {
      if (step === 0 || step === 6 || (step === 12 && bar % 2 === 1)) {
        const chord = scale.fanfareChords[chordIndex];
        this.playGoldRushBrassChord(time, chord, 0.26);
      }
      const leadNotes = scale.leadScale;
      const arpOffsets = [0, 2, 4, 7, 5, 4, 2, 0, 3, 5, 7, 9, 7, 5, 4, 2];
      const noteIdx = (arpOffsets[step] + (bar * 2)) % leadNotes.length;
      if (step % 2 === 0 || step === 7 || step === 15) {
        this.playLeadPluck(time, leadNotes[noteIdx], 0.28);
      }
    } else if (bar !== 3) {
      if (step === 4 || step === 10 || step === 14) {
        const noteIdx = (step + bar) % scale.leadScale.length;
        this.playLeadPluck(time, scale.leadScale[noteIdx], 0.18);
      }
    }
  }

  // ── ⚡ CYBER MATRIX SCHEDULER ──
  scheduleCyberStep(step, bar, time, scale, chordIndex, isDrop) {
    const isQuarter = (step % 4 === 0);
    if (isQuarter || (isDrop && step % 2 === 0)) {
      this.playCinematicTaiko(time, isQuarter ? 1.0 : 0.7);
    }
    if (step === 4 || step === 12) {
      this.playSynthSnare(time, 0.75);
    }
    this.playActionHat(time, step % 2 === 1, 0.35);

    const bassFreq = scale.bassNotes[chordIndex];
    this.playGoldRushSynthBass(time, bassFreq * (step % 4 === 2 ? 2 : 1), step === 0 || step === 8, true);

    if (isDrop && (step === 0 || step === 6 || step === 10)) {
      const chord = scale.fanfareChords[chordIndex];
      this.playGoldRushBrassChord(time, chord, 0.28);
    }
    const leadNotes = scale.leadScale;
    const noteIdx = (step * 3 + bar * 2) % leadNotes.length;
    this.playLeadPluck(time, leadNotes[noteIdx], 0.3);
  }

  // -------------------------------------------------------------
  // THEMED INSTRUMENTS, GEM COLLECTION & BRAINROT SFX
  // -------------------------------------------------------------

  // 💎 Sparkling 4-Tone Gem Collection Chime
  playGemCollect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const tones = [1318.51, 1661.22, 1975.53, 2637.02]; // E6, G#6, B6, E7
    tones.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.032);
      gain.gain.setValueAtTime(0.28, now + idx * 0.032);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.032 + 0.32);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.032);
      osc.stop(now + idx * 0.032 + 0.35);
    });
  }

  // 🏁 Synced Multiplayer Race Countdown Beeps
  playCountdownBeep(count) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(count === 1 ? 880 : 660, now);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playGoBeep() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1320, now);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.48);
  }

  // 🤪 Funny Brainrot Character Comic Pop / Boing
  playBrainrotPop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.16);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.20);
  }

  // -------------------------------------------------------------
  // 🔊 HILARIOUS MEME AUDIO ENGINE & CUSTOM CLIPS
  // -------------------------------------------------------------

  preloadMemeAudio() {
    if (typeof window === 'undefined') return;

    const soundPaths = {
      tung_tung: 'assets/sounds/tung_tung_sahur.mp3',
      smurf_cat: 'assets/sounds/smurf_cat.mp3',
      bonk: 'assets/sounds/bonk.mp3',
      metal_pipe: 'assets/sounds/metal_pipe.mp3',
      vine_boom: 'assets/sounds/vine_boom.mp3',
      what_the_sigma: 'assets/sounds/voice_what_the_sigma.mp3'
    };

    for (const [key, path] of Object.entries(soundPaths)) {
      // 1. HTML5 Audio backup
      const audioEl = new Audio();
      audioEl.src = path;
      audioEl.preload = 'auto';
      this.memeClips[key] = audioEl;

      // 2. Web Audio ArrayBuffer for zero latency
      fetch(path)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then(buffer => {
          if (this.ctx) {
            this.ctx.decodeAudioData(buffer.slice(0), decoded => {
              this.audioBuffers[key] = decoded;
            }, () => {});
          } else {
            this.pendingBuffers[key] = buffer;
          }
        })
        .catch(err => {
          // Graceful fallback to procedural generation
        });
    }
  }

  playMemeClip(key, volume = 0.85) {
    if (this.muted) return;
    this.init();

    // 1. Custom user-uploaded clip (takes highest priority)
    if (this.customClips[key]) {
      try {
        const customEl = this.customClips[key].cloneNode();
        customEl.volume = Math.min(1.0, volume);
        customEl.play().catch(() => {});
        return customEl;
      } catch (e) {}
    }

    // 2. High-precision Web Audio buffer
    if (this.ctx && this.audioBuffers[key]) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.audioBuffers[key];
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
        source.connect(gainNode);
        gainNode.connect(this.sfxGain || this.masterGain || this.ctx.destination);
        source.start(0);
        return source;
      } catch (e) {}
    }

    // 3. HTML5 Audio element fallback
    if (this.memeClips[key]) {
      try {
        const audioEl = this.memeClips[key].cloneNode();
        audioEl.volume = Math.min(1.0, volume);
        audioEl.play().catch(() => {});
        return audioEl;
      } catch (e) {}
    }

    // 4. Pure Procedural Synthesizer Fallback
    this.playProceduralMemeFallback(key, volume);
    return null;
  }

  // 🥁 Tung Tung Sahur Call & Wooden Percussion
  playTungTungSahur(volume = 0.95) {
    return this.playMemeClip('tung_tung', volume);
  }

  // 🍄 Smurf Cat Alan Walker "We Live, We Love, We Lie"
  playSmurfCat(volume = 0.95) {
    // Duck background music for cinematic solemn meme atmosphere
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(0.06, this.ctx.currentTime, 0.1);
    }
    const clip = this.playMemeClip('smurf_cat', volume);
    this.activeSmurfAudio = clip;
    return clip;
  }

  stopSmurfCat() {
    if (this.activeSmurfAudio) {
      try {
        if (typeof this.activeSmurfAudio.stop === 'function') {
          this.activeSmurfAudio.stop();
        } else if (typeof this.activeSmurfAudio.pause === 'function') {
          this.activeSmurfAudio.pause();
        }
      } catch (e) {}
      this.activeSmurfAudio = null;
    }
    // Restore music volume
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(0.75, this.ctx.currentTime, 0.2);
    }
  }

  // 💥 Comic Whack / Bonk on the Cube
  playBonk(volume = 0.9) {
    return this.playMemeClip('bonk', volume);
  }

  // 🔔 Reverberating Falling Metal Pipe
  playMetalPipe(volume = 0.85) {
    return this.playMemeClip('metal_pipe', volume);
  }

  // 💥 Deep 808 Distorted Vine Boom
  playVineBoom(volume = 1.0) {
    return this.playMemeClip('vine_boom', volume);
  }

  // 🗿 "What the Sigma?!" Vocal
  playWhatTheSigma(volume = 0.9) {
    return this.playMemeClip('what_the_sigma', volume);
  }

  // 💪 Gigachad "Can You Feel My Heart" Synth Riff
  playGigachad(volume = 0.95) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f: 329.63, t: 0, d: 0.22 },
      { f: 392.00, t: 0.24, d: 0.22 },
      { f: 369.99, t: 0.48, d: 0.22 },
      { f: 329.63, t: 0.72, d: 0.48 }
    ];
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(volume * 0.7, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain || this.ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.05);
    });
    const sub = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(80, now);
    sub.frequency.exponentialRampToValueAtTime(35, now + 0.8);
    sGain.gain.setValueAtTime(volume, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    sub.connect(sGain);
    sGain.connect(this.sfxGain || this.masterGain || this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.9);
  }

  // 💔 "Emotional Damage!" Comedic Vocal / Impact SFX
  playEmotionalDamage(volume = 0.95) {
    if (this.muted) return;
    this.init();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const u = new SpeechSynthesisUtterance("Emotional Damage!");
        u.pitch = 1.4;
        u.rate = 1.25;
        u.volume = Math.min(1.0, volume);
        window.speechSynthesis.speak(u);
      } catch (e) {}
    }
    if (this.ctx) {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.45);
      gain.gain.setValueAtTime(volume * 0.75, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  }

  // 🚽 Skibidi Bouncy Phonk Riff
  playSkibidi(volume = 0.9) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f: 220, t: 0, d: 0.12 },
      { f: 220, t: 0.14, d: 0.12 },
      { f: 261.63, t: 0.28, d: 0.14 },
      { f: 293.66, t: 0.44, d: 0.25 }
    ];
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(volume * 0.6, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain || this.ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.05);
    });
  }

  // Register user custom meme audio file (MP3/WAV)
  registerCustomAudio(key, fileOrUrl) {
    try {
      let src = fileOrUrl;
      if (fileOrUrl instanceof Blob || fileOrUrl instanceof File) {
        src = URL.createObjectURL(fileOrUrl);
      }
      const el = new Audio(src);
      el.preload = 'auto';
      this.customClips[key] = el;
      console.log(`[Audio] Custom audio registered for '${key}'`);
      return true;
    } catch (e) {
      console.error(`[Audio] Failed to register custom audio for ${key}:`, e);
      return false;
    }
  }

  // Pure Web Audio procedural backup if no files are available
  playProceduralMemeFallback(key, volume = 0.8) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    if (key === 'bonk') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.16);
      gain.gain.setValueAtTime(volume * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.19);
    } else if (key === 'vine_boom') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.8);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 1.25);
    } else if (key === 'metal_pipe') {
      [180, 360, 720, 1440, 2880].forEach(f => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime((volume * 0.25) / Math.sqrt(f / 100), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 1.85);
      });
    }
  }

  // 🔔 Gothic Funeral Church Bell
  playChurchBell(time) {
    if (!this.ctx || this.muted) return;
    const now = time || this.ctx.currentTime;
    const partials = [110, 242, 352, 528, 880];
    partials.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = (idx % 2 === 0) ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      const vol = 0.35 / (idx + 1);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 2.3);
    });
  }

  // 🏰 Gothic Pipe Organ Chord
  playGothicOrganChord(time, freqs, duration = 0.5, gainLevel = 0.28) {
    if (!this.ctx || this.muted) return;
    const now = time || this.ctx.currentTime;
    freqs.forEach(freq => {
      // 8' principal pipe
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, now);

      // 4' octave up pipe
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq * 2, now);
      osc2.detune.setValueAtTime(5, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1900, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainLevel * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration + 0.05);
      osc2.stop(now + duration + 0.05);
    });
  }

  // 🧚 Fairyland Kawaii Pop Bells
  playCutePopBell(time, freq, gainLevel = 0.25) {
    if (!this.ctx || this.muted) return;
    const now = time || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainLevel, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  // 🧚 Cute Bubbly Pop Chords
  playCutePopChord(time, freqs, gainLevel = 0.2) {
    if (!this.ctx || this.muted) return;
    const now = time || this.ctx.currentTime;
    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(gainLevel, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.2);
    });
  }

  // 🧚 Bouncy Cute Pop Kick
  playCutePopKick(time, gainLevel = 0.8) {
    if (!this.ctx || this.muted) return;
    const now = time || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
    gain.gain.setValueAtTime(gainLevel, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  // 🧚 Snappy Pop Handclap
  playPopClap(time) {
    if (!this.ctx || this.muted) return;
    const now = time || this.ctx.currentTime;
    [0, 0.012, 0.024].forEach((delay, idx) => {
      const noise = this.ctx.createBufferSource();
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.08), this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now + delay);
      filter.Q.setValueAtTime(2.5, now + delay);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(idx === 2 ? 0.45 : 0.25, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      noise.start(now + delay);
      noise.stop(now + delay + 0.08);
    });
  }

  // 🧚 Cute Bubble Slap Bass
  playCuteBubbleBass(time, freq, isSlap = false) {
    if (!this.ctx || this.muted) return;
    const now = time || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = isSlap ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isSlap ? 1800 : 950, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.12);
    filter.Q.setValueAtTime(isSlap ? 4.5 : 2.5, now);

    gain.gain.setValueAtTime(isSlap ? 0.35 : 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // -------------------------------------------------------------
  // SYNTHESIZED INSTRUMENTS
  // -------------------------------------------------------------

  playCinematicTaiko(time, intensity = 1.0) {
    if (!this.ctx || this.muted) return;
    const now = time || this.ctx.currentTime;

    // Sub Boom
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(125, now);
    subOsc.frequency.exponentialRampToValueAtTime(36, now + 0.11);
    subGain.gain.setValueAtTime(0.95 * intensity, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    // Mallet Thwack
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(260, now);
    clickOsc.frequency.exponentialRampToValueAtTime(55, now + 0.035);
    clickGain.gain.setValueAtTime(0.7 * intensity, now);
    clickGain.gain.linearRampToValueAtTime(0.001, now + 0.04);

    subOsc.connect(subGain);
    clickOsc.connect(clickGain);
    subGain.connect(this.musicGain);
    clickGain.connect(this.musicGain);

    subOsc.start(now);
    subOsc.stop(now + 0.85);
    clickOsc.start(now);
    clickOsc.stop(now + 0.045);
  }

  playPredatorBrass(time, freq, isSwell = false, duration = 0.5) {
    if (!this.ctx || this.muted) return;
    const now = time || this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const oscSub = this.ctx.createOscillator();
    const masterGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, now);
    osc1.detune.setValueAtTime(-8, now);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.setValueAtTime(+8, now);

    oscSub.type = 'square';
    oscSub.frequency.setValueAtTime(freq * 0.5, now);

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(4.0, now);

    if (isSwell) {
      filter.frequency.setValueAtTime(140, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + duration * 0.8);
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(0.5, now + duration * 0.7);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } else {
      filter.frequency.setValueAtTime(2800, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + duration * 0.7);
      masterGain.gain.setValueAtTime(0.6, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    }

    osc1.connect(filter);
    osc2.connect(filter);
    oscSub.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(this.musicGain);

    osc1.start(now);
    osc2.start(now);
    oscSub.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
    oscSub.stop(now + duration + 0.05);
  }

  playGoldRushSynthBass(time, freq, isAccented = false, isDrop = false) {
    if (!this.ctx || this.muted) return;
    const now = time || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = isDrop ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(freq, now);

    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq * 0.5, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isAccented ? 2800 : 1200, now);
    filter.frequency.exponentialRampToValueAtTime(240, now + 0.1);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(isAccented ? 0.45 : 0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    sub.start(now);
    osc.stop(now + 0.13);
    sub.stop(now + 0.13);
  }

  playGoldRushBrassChord(time, freqs, gainLevel = 0.22) {
    if (!this.ctx || this.muted) return;
    const now = time || this.ctx.currentTime;
    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3800, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + 0.25);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(gainLevel, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  playSynthSnare(time, gainLevel = 0.6) {
    if (!this.ctx || this.muted) return;
    const now = time || this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.14);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1100, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(gainLevel, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(190, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(75, now + 0.07);
    bodyGain.gain.setValueAtTime(gainLevel * 0.8, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.musicGain);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.14);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.08);
  }

  playActionHat(time, isOpen = false, gainLevel = 0.25) {
    if (!this.ctx || this.muted) return;
    const now = time || this.ctx.currentTime;
    const dur = isOpen ? 0.14 : 0.038;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainLevel, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(now);
    noise.stop(now + dur);
  }

  playLeadPluck(time, freq, gainLevel = 0.25) {
    if (!this.ctx || this.muted) return;
    const now = time || this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 1.006, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3400, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.14);

    gain.gain.setValueAtTime(gainLevel, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.17);
    osc2.stop(now + 0.17);
  }

  // -------------------------------------------------------------
  // ARCADE & SIMULATION SOUND EFFECTS (SFX)
  // -------------------------------------------------------------

  // Punchy Hydraulic Mechanical Jump
  playMechanicalJump() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Sub Bass Pop
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(195, now);
    popOsc.frequency.exponentialRampToValueAtTime(45, now + 0.038);
    popGain.gain.setValueAtTime(0.85, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    popOsc.connect(popGain);
    popGain.connect(this.sfxGain);
    popOsc.start(now);
    popOsc.stop(now + 0.13);

    // 2. Hydraulic Piston Air Release
    const bSize = Math.floor(this.ctx.sampleRate * 0.07);
    const nBuf = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
    const d = nBuf.getChannelData(0);
    for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
    const nSrc = this.ctx.createBufferSource();
    nSrc.buffer = nBuf;
    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(3200, now);
    bpf.frequency.exponentialRampToValueAtTime(900, now + 0.06);
    bpf.Q.setValueAtTime(3.5, now);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.5, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    nSrc.connect(bpf);
    bpf.connect(nGain);
    nGain.connect(this.sfxGain);
    nSrc.start(now);
    nSrc.stop(now + 0.08);

    // 3. Mechanical Servo Chirp
    const sOsc = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    sOsc.type = 'triangle';
    sOsc.frequency.setValueAtTime(140, now);
    sOsc.frequency.exponentialRampToValueAtTime(620, now + 0.05);
    sGain.gain.setValueAtTime(0.35, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    sOsc.connect(sGain);
    sGain.connect(this.sfxGain);
    sOsc.start(now);
    sOsc.stop(now + 0.07);
  }

  // Alias for backward compatibility
  playJump() {
    this.playMechanicalJump();
  }

  // Solid Mechanical Landing Thud
  playMechanicalLanding(velocityFactor = 1.0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const scale = Math.min(1.2, Math.max(0.4, velocityFactor));

    // 1. Sub Floor Impact
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(88, now);
    sub.frequency.exponentialRampToValueAtTime(28, now + 0.11);
    subGain.gain.setValueAtTime(0.85 * scale, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.14);

    // 2. Chassis Clank
    [310, 475].forEach(freq => {
      const clank = this.ctx.createOscillator();
      const clankGain = this.ctx.createGain();
      clank.type = 'triangle';
      clank.frequency.setValueAtTime(freq, now);
      clankGain.gain.setValueAtTime(0.35 * scale, now);
      clankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      clank.connect(clankGain);
      clankGain.connect(this.sfxGain);
      clank.start(now);
      clank.stop(now + 0.04);
    });
  }

  // Dynamic Spaceship Thruster Engine (Continuous Pitch & Hiss Modulation)
  updateShipThrust(boostRatio = 0.0) {
    if (this.muted || !this.thrusterMasterGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    const clamped = Math.max(0, Math.min(1, boostRatio));

    if (clamped > 0.01) {
      // Bends higher under thrust (42 Hz -> 105 Hz)
      const targetFreq = 42 + clamped * 63;
      this.thrusterOsc.frequency.setTargetAtTime(targetFreq, now, 0.06);

      const targetCutoff = 140 + Math.pow(clamped, 1.8) * 1450;
      this.thrusterFilter.frequency.setTargetAtTime(targetCutoff, now, 0.06);

      // Flame afterburner hiss
      this.thrusterHissGain.gain.setTargetAtTime(clamped * 0.4, now, 0.06);
      this.thrusterMasterGain.gain.setTargetAtTime(0.18 + clamped * 0.55, now, 0.05);
    } else {
      // Idle coasting rumble
      this.thrusterOsc.frequency.setTargetAtTime(42, now, 0.12);
      this.thrusterFilter.frequency.setTargetAtTime(140, now, 0.12);
      this.thrusterHissGain.gain.setTargetAtTime(0.001, now, 0.1);
      this.thrusterMasterGain.gain.setTargetAtTime(0.0001, now, 0.12);
    }
  }

  startShipHum() {
    this.updateShipThrust(1.0);
  }

  stopShipHum() {
    this.updateShipThrust(0.0);
  }

  // Jump Pad Launch (Rocket launch whistle)
  playPadLaunch() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(1450, now + 0.22);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(760, now);
    osc2.frequency.exponentialRampToValueAtTime(2900, now + 0.22);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.25);
    osc2.stop(now + 0.25);
  }

  // Orb Trigger Chime
  playOrbChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.02);

      gain.gain.setValueAtTime(0.28, now + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.02 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.02);
      osc.stop(now + idx * 0.02 + 0.26);
    });
  }

  // Gravity Flip Whoosh
  playGravityFlip(isInverting = true) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    if (isInverting) {
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(850, now + 0.16);
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(2600, now + 0.16);
    } else {
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.16);
      filter.frequency.setValueAtTime(2600, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.16);
    }

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  // Crash / Shatter Explosion
  playCrash() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.38);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.32);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.75, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    // Deep Sub Impact
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(22, now + 0.32);
    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.38);
    subOsc.start(now);
    subOsc.stop(now + 0.35);
  }

  // Level Complete Victory Fanfare
  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.stopMusic();
    const now = this.ctx.currentTime;
    const fanfareNotes = [
      { f: 587.33, t: 0.00, d: 0.15 }, // D5
      { f: 739.99, t: 0.12, d: 0.15 }, // F#5
      { f: 880.00, t: 0.24, d: 0.15 }, // A5
      { f: 1174.66, t: 0.36, d: 0.60 }, // D6
      { f: 1479.98, t: 0.52, d: 0.80 }, // F#6
      { f: 1760.00, t: 0.70, d: 1.20 }  // A6
    ];

    fanfareNotes.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);

      gain.gain.setValueAtTime(0.42, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + note.t);
      osc.stop(now + note.t + note.d + 0.05);
    });
  }

  // Practice Mode Checkpoint Sounds
  playCheckpoint() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playCheckpointRemove() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.11);
  }
}

export const audio = new AudioManager();

