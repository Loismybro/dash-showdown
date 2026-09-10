// game.js - Master Game Logic, Deterministic Sub-Step Physics & AI Ghost Engine

import { LEVEL_DATA } from './levels.js';
import { audio } from './audio.js';
import { GameRenderer } from './renderer.js';
import { DifficultyBadges } from './difficulty_badges.js';
import { MultiplayerManager } from './multiplayer.js';
import { BossManager } from './boss.js';

class GameManager {
  constructor() {
    this.renderer = null;
    this.bossManager = null;

    // Levels
    this.levels = LEVEL_DATA;
    this.currentLevelIndex = 0;
    this.level = this.levels[0];
    this.currentSpeedMult = 1.0;

    // Player State
    this.player = {
      x: 0,
      y: 0,
      vx: 10.5,
      vy: 0,
      rotationZ: 0,
      vehicleMode: "cube", // "cube", "ship", "wave", "ufo"
      gravityDir: 1,       // 1 = normal (floor), -1 = inverted (ceiling)
      hasShield: false,
      invulnerableTimer: 0,
      isGrounded: true,
      isHolding: false,
      isAlive: true,
      orbTriggered: new Set()
    };

    // Practice Mode
    this.practiceMode = false;
    this.checkpoints = [];

    // Stats & Attempts
    this.attempts = 1;
    this.bestScores = [0, 0, 0, 0, 0];
    this.loadBestScores();

    // 🏆 Dynamic "Devil May Cry / ULTRAKILL" Rhythm Style & Combo Ranking Engine
    this.styleSystem = {
      score: 0,
      combo: 0,
      multiplier: 1.0,
      decayTimer: 0,
      rankIdx: 0,
      ranks: [
        { letter: 'D', label: 'DOPE', color: '#cd7f32', minScore: 0 },
        { letter: 'C', label: 'CRAZY', color: '#c0c0c0', minScore: 600 },
        { letter: 'B', label: 'BADASS', color: '#ffd700', minScore: 1500 },
        { letter: 'A', label: 'APOCALYPSE', color: '#00ff88', minScore: 2800 },
        { letter: 'S', label: 'SAVAGE', color: '#ff0055', minScore: 4500 },
        { letter: 'SS', label: 'SICK SKILLS', color: '#00f0ff', minScore: 6500 },
        { letter: 'SSS', label: 'GODLIKE', color: '#ff00ff', minScore: 9000 }
      ]
    };

    // Gem Collection System
    this.gemsCollected = new Set();
    this.totalLevelGems = 0;

    // Party / Multiplayer System
    this.partyMode = 'solo'; // 'solo', 'duo', 'trio', 'squad'
    this.partyRoomCode = 'DASH-' + Math.floor(1000 + Math.random() * 9000);
    this.partyRoster = [
      { id: "p1", name: "Host (You)", isHost: true, isPlayer: true, color: 0x00ff88, colorHex: "#00FF88", ready: true },
      { id: "p2", name: "NeonRider",   isHost: false, isPlayer: false, color: 0xff007f, colorHex: "#FF007F", skill: 0.95, offset: 0.1, ready: true },
      { id: "p3", name: "Vortex99",    isHost: false, isPlayer: false, color: 0xffd000, colorHex: "#FFD000", skill: 0.88, offset: -0.2, ready: true },
      { id: "p4", name: "AuraKing",    isHost: false, isPlayer: false, color: 0xd500f9, colorHex: "#D500F9", skill: 0.80, offset: -0.4, ready: true }
    ];

    // AI Ghost / Party Teammate Racers
    this.ghostConfigs = [];
    this.ghostStates = [];

    // Brainrot Meme Pop-up Engine
    this.brainrotMilestones = new Set();
    this.brainrotTimeout = null;
    this.brainrotMemes = [
      { avatar: "🚽", title: "SKIBIDI RIZZ", quote: "+1,000 AURA 🔥" },
      { avatar: "🍄🐱", title: "SMURF CAT", quote: "WE LIVE WE LOVE WE LIE 🎶" },
      { avatar: "🤫🧏‍♂️", title: "MOGGER", quote: "BYE BYE! MEWING STREAK UNBROKEN" },
      { avatar: "🗿", title: "WHAT THE SIGMA?!", quote: "+10,000 AURA 🤨" },
      { avatar: "👑", title: "THE RIZZLER", quote: "UNSPOKEN RIZZ UNLOCKED! 💥" },
      { avatar: "🐱", title: "HUH?!", quote: "THAT JUMP WAS HIGHWAY ROBBERY 💀" }
    ];

    // Timing & Game State
    this.lastTime = 0;
    this.gameState = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'CRASHED', 'VICTORY', 'COIL_TRANSITION'
    this.respawnTimer = 0;

    // ⚡ High-Power Inductor Coil Transition State
    this.coilTransitionTimer = 0;
    this.coilTransitionDuration = 2.2;
    this.coilStartX = 0;
    this.coilLength = 26.0;
    this.coilTargetY = 2.8;
    this.coilProgress = 0;

    // Controls & Game Feel Juice: Jump Buffering & Coyote Time
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;

    // Meme Chaos State (Tung Tung Sahur, Smurf Cat & Audio Engine)
    this.deathSpotCounts = new Map();
    this.tungTungTimer = Math.random() * 20 + 60;
    this.isTungTungActive = false;
    this.chaosMode = 'normal'; // 'off', 'normal', 'high'
    this.lastBrainrotPopTime = 0;
    this.nearMissCooldown = 0;
    this.playerSmurfAura = false;

    this.multiplayer = null;
    this.dom = {};
  }

  init() {
    this.cacheDOM();

    // 1. Initialize 3D Engine
    this.renderer = new GameRenderer('canvas-container');
    this.renderer.init();

    // 1b. Initialize Interactive Boss Battle Engine
    this.bossManager = new BossManager(this.renderer.scene, this.renderer);

    // 2. Bind Controls (Touch screen, Space, Click, Pause)
    this.bindControls();

    // 2b. Initialize WebRTC Peer-to-Peer Multiplayer
    this.multiplayer = new MultiplayerManager(this);
    this.multiplayer.init();
    if (this.dom.partyShareUrl) {
      this.dom.partyShareUrl.value = this.multiplayer.getInviteLink();
    }
    if (this.renderer) {
      this.renderer.setPlayerColor(this.multiplayer.playerColor);
    }

    // 3. Audio beat event listener for visual pulsing
    audio.onBeat((beat, isDrop) => {
      if (this.renderer) {
        this.renderer.triggerBeatPulse(beat, isDrop);
      }
    });

    // 4. Setup Start Screen & Pause Menu
    this.setupStartScreen();
    this.setupPauseMenu();

    // 5. Load First Level (Track & 3D Scenery)
    this.loadLevel(0);

    // 6. Start Game Loop
    this.lastTime = performance.now();
    requestAnimationFrame(t => this.gameLoop(t));
  }

  cacheDOM() {
    this.dom = {
      progressBar: document.getElementById('progress-bar-fill'),
      progressPercent: document.getElementById('progress-percent'),
      playerMarker: document.getElementById('player-marker'),
      levelName: document.getElementById('level-name'),
      diffBadge: document.getElementById('diff-badge'),
      // Stats & Gems
      attemptCount: document.getElementById('attempt-count'),
      bestRecord: document.getElementById('best-record'),
      gemCounter: document.getElementById('gem-counter'),
      gemCountText: document.getElementById('gem-count-text'),
      leaderboardList: document.getElementById('leaderboard-list'),

      // Buttons
      practiceBtn: document.getElementById('practice-toggle-btn'),
      placeCheckpointBtn: document.getElementById('place-cp-btn'),
      deleteCheckpointBtn: document.getElementById('delete-cp-btn'),
      checkpointDock: document.getElementById('checkpoint-dock'),
      levelSelectBtn: document.getElementById('level-select-btn'),
      partyBtn: document.getElementById('party-btn'),
      partyModeLabel: document.getElementById('party-mode-label'),
      partyCountBadge: document.getElementById('party-count-badge'),
      pauseBtn: document.getElementById('pause-btn'),
      muteBtn: document.getElementById('mute-btn'),
      restartBtn: document.getElementById('restart-btn'),

      // Leaderboard
      leaderboardPanel: document.getElementById('leaderboard-panel'),
      toggleLeaderboardBtn: document.getElementById('toggle-leaderboard-btn'),

      // Countdown
      raceCountdownOverlay: document.getElementById('race-countdown-overlay'),
      countdownNumber: document.getElementById('countdown-number'),
      countdownSub: document.getElementById('countdown-sub'),

      // Modals
      levelSelectModal: document.getElementById('level-select-modal'),
      closeLevelModal: document.getElementById('close-level-modal'),
      levelCardsContainer: document.getElementById('level-cards-container'),
      partyModal: document.getElementById('party-modal'),
      closePartyModal: document.getElementById('close-party-modal'),
      startPartyRunBtn: document.getElementById('start-party-run-btn'),
      partyShareUrl: document.getElementById('party-share-url'),
      partyCopyLinkBtn: document.getElementById('party-copy-link-btn'),
      partyNewCodeBtn: document.getElementById('party-new-code-btn'),
      partyMembersList: document.getElementById('party-members-list'),
      playerNameInput: document.getElementById('player-name-input'),
      lobbyPlayerCount: document.getElementById('lobby-player-count'),
      lobbyConnectionStatus: document.getElementById('lobby-connection-status'),
      joinRoomCodeInput: document.getElementById('join-room-code-input'),
      joinRoomBtn: document.getElementById('join-room-btn'),
      victoryModal: document.getElementById('victory-modal'),
      victoryNextBtn: document.getElementById('victory-next-btn'),
      victoryReplayBtn: document.getElementById('victory-replay-btn'),
      victoryAttempts: document.getElementById('victory-attempts'),
      gothicClimaxOverlay: document.getElementById('gothic-climax-overlay'),
      gothicNextBtn: document.getElementById('gothic-next-btn'),
      gothicReplayBtn: document.getElementById('gothic-replay-btn'),
      checkpointToast: document.getElementById('checkpoint-toast'),
      checkpointToastTitle: document.getElementById('cp-toast-title'),

      // Brainrot Pop-Up
      brainrotPopup: document.getElementById('brainrot-popup'),
      brainrotAvatar: document.getElementById('brainrot-avatar'),
      brainrotTitle: document.getElementById('brainrot-title'),
      brainrotQuote: document.getElementById('brainrot-quote'),

      // Screen Flash
      screenFlash: document.getElementById('screen-flash'),

      // 🥁 Tung Tung Sahur Alert Banner
      tungTungBanner: document.getElementById('tung-tung-banner'),
      tungTungBannerSub: document.getElementById('tung-tung-banner-sub'),

      // 🍄 Smurf Cat Philosophical Death Modal
      smurfModal: document.getElementById('smurf-cat-modal'),
      smurfDeathMsg: document.getElementById('smurf-death-msg'),
      smurfResumeBtn: document.getElementById('smurf-resume-btn'),

      // 🤪 Meme Chaos Dashboard
      memeChaosBtn: document.getElementById('meme-chaos-btn'),
      memeChaosModal: document.getElementById('meme-chaos-modal'),
      closeMemeChaosModal: document.getElementById('close-meme-chaos-modal'),
      summonTungTungBtn: document.getElementById('summon-tung-tung-btn'),
      summonSmurfCatBtn: document.getElementById('summon-smurf-cat-btn'),
      summonSigmaBtn: document.getElementById('summon-sigma-btn'),
      summonGigachadBtn: document.getElementById('summon-gigachad-btn'),
      summonEmotionalBtn: document.getElementById('summon-emotional-btn'),
      summonSkibidiBtn: document.getElementById('summon-skibidi-btn'),
      testMetalPipeBtn: document.getElementById('test-metal-pipe-btn'),
      testVineBoomBtn: document.getElementById('test-vine-boom-btn'),
      uploadTungTung: document.getElementById('upload-tung-tung'),
      uploadSmurfCat: document.getElementById('upload-smurf-cat'),
      uploadCrash: document.getElementById('upload-crash'),

      // Pause Modal
      pauseModal: document.getElementById('pause-modal'),
      closePauseModal: document.getElementById('close-pause-modal'),
      pauseTrackSub: document.getElementById('pause-track-sub'),
      pauseResumeBtn: document.getElementById('pause-resume-btn'),
      pauseRestartBtn: document.getElementById('pause-restart-btn'),
      pausePracticeBtn: document.getElementById('pause-practice-btn'),
      pausePracticeStatus: document.getElementById('pause-practice-status'),
      pausePartyBtn: document.getElementById('pause-party-btn'),
      pauseTracksBtn: document.getElementById('pause-tracks-btn'),
      pauseTitleBtn: document.getElementById('pause-title-btn'),

      // Starting Screen & Lobby
      startScreenOverlay: document.getElementById('start-screen-overlay'),
      mainMenuView: document.getElementById('main-menu-view'),
      menuLobbyView: document.getElementById('menu-lobby-view'),
      menuPlayerNameInput: document.getElementById('menu-player-name-input'),
      menuCubePreview: document.getElementById('menu-cube-preview'),
      menuPlaySoloBtn: document.getElementById('menu-play-solo-btn'),
      menuPlayFriendsBtn: document.getElementById('menu-play-friends-btn'),
      menuSelectTrackBtn: document.getElementById('menu-select-track-btn'),
      menuTrackTitle: document.getElementById('menu-track-title'),
      menuMemeChaosBtn: document.getElementById('menu-meme-chaos-btn'),
      menuLobbyRoomCode: document.getElementById('menu-lobby-room-code'),
      menuLobbyRolePill: document.getElementById('menu-lobby-role-pill'),
      menuLobbyBackBtn: document.getElementById('menu-lobby-back-btn'),
      menuLobbyLinkInput: document.getElementById('menu-lobby-link-input'),
      menuLobbyCopyBtn: document.getElementById('menu-lobby-copy-btn'),
      menuLobbyStatusText: document.getElementById('menu-lobby-status-text'),
      menuLobbyPlayerCount: document.getElementById('menu-lobby-player-count'),
      menuLobbyRoster: document.getElementById('menu-lobby-roster'),
      menuLobbyStartBtn: document.getElementById('menu-lobby-start-btn'),
      menuLobbyNewCodeBtn: document.getElementById('menu-lobby-new-code-btn')
    };
  }

  loadBestScores() {
    try {
      const saved = localStorage.getItem('dash_showdown_scores');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.bestScores = parsed;
        }
      }
    } catch (e) {}
    while (this.bestScores.length < this.levels.length) {
      this.bestScores.push(0);
    }
  }

  saveBestScores() {
    try {
      localStorage.setItem('dash_showdown_scores', JSON.stringify(this.bestScores));
    } catch (e) {}
  }

  loadLevel(index) {
    this.currentLevelIndex = index;
    this.level = this.levels[index];
    this.level.baseSpeed = this.level.baseSpeed || this.level.speed;
    this.currentSpeedMult = 1.0;
    this.attempts = 1;
    if (this.deathSpotCounts) this.deathSpotCounts.clear();
    this.isTimeFrozen = false;
    this.checkpoints = [];
    this.totalLevelGems = this.level.obstacles.filter(o => o.type === 'gem').length;
    this.gemsCollected.clear();
    this.brainrotMilestones.clear();

    // Dismiss Gothic Climax Overlay if open
    const gothicOverlay = document.getElementById('gothic-climax-overlay');
    if (gothicOverlay) {
      gothicOverlay.style.display = 'none';
      document.getElementById('gothic-flash-blast')?.classList.remove('flash-active');
      document.getElementById('gothic-shockwave-ring')?.classList.remove('wave-active');
      document.getElementById('gothic-card-container')?.classList.remove('slam-active');
    }

    if (this.renderer && this.renderer.sceneryManager) {
      this.renderer.sceneryManager.setFrozen(false);
    }
    if (this.renderer && this.renderer.resetUnstableBlocks) {
      this.renderer.resetUnstableBlocks();
    }

    // Reset Player
    this.resetPlayer(true);

    // If hosting multiplayer, synchronize level across connected friends
    if (this.multiplayer && this.multiplayer.isHost) {
      this.multiplayer.broadcast({
        type: 'level_change',
        levelIndex: index
      });
    }

    // Build 3D Track & Obstacles (and Scenery)
    this.renderer.buildTrack(this.level);

    // Initialize Party Ghosts
    this.setupGhosts();

    // Start Procedural Music (only if race is active)
    if (this.gameState === 'PLAYING') {
      audio.startMusic(this.level.bpm, this.level.theme);
    }

    // Update HUD
    this.updateHUDHeader();
    this.updateGemHUD();
    this.renderer.renderCheckpoints(this.checkpoints);
  }

  setupGhosts() {
    if (this.multiplayer && (this.multiplayer.roomCode || this.multiplayer.isConnected || (this.multiplayer.players && this.multiplayer.players.size > 1))) {
      this.onMultiplayerRosterUpdated(Array.from(this.multiplayer.players.values()));
      return;
    }

    if (this.partyMode === 'solo') {
      this.ghostConfigs = [];
    } else if (this.partyMode === 'duo') {
      this.ghostConfigs = [this.partyRoster[1]];
    } else if (this.partyMode === 'trio') {
      this.ghostConfigs = [this.partyRoster[1], this.partyRoster[2]];
    } else { // squad
      this.ghostConfigs = [this.partyRoster[1], this.partyRoster[2], this.partyRoster[3]];
    }

    this.ghostStates = this.ghostConfigs.map(cfg => ({
      id: cfg.id,
      name: cfg.name,
      colorHex: cfg.colorHex,
      isBot: true,
      x: 0,
      y: 0,
      vy: 0,
      rotationZ: 0,
      vehicleMode: "cube",
      gravityDir: 1,
      isGrounded: true,
      isAlive: true,
      skill: cfg.skill || 0.9,
      offset: cfg.offset || 0,
      respawnTimer: 0,
      jumpCooldown: 0
    }));

    this.renderer.setupGhosts(this.ghostConfigs);
  }

  // -------------------------------------------------------------
  // 🚩 COMPREHENSIVE 7-STATE CHECKPOINT ENGINE & SAFE RESPAWN
  // -------------------------------------------------------------

  createCheckpointSnapshot(x = this.player.x, y = this.player.y) {
    return {
      x: x,
      y: y,
      vy: this.player.vy || 0,
      vx: this.player.vx || this.level.speed,
      speed: this.level.speed,
      speedMult: this.currentSpeedMult || 1.0,
      vehicleMode: this.player.vehicleMode || "cube",
      rotationZ: this.player.rotationZ || 0,
      isGrounded: !!this.player.isGrounded,
      gravityDir: this.player.gravityDir || 1,
      hasShield: !!this.player.hasShield,
      score: this.styleSystem ? this.styleSystem.score : 0,
      combo: this.styleSystem ? this.styleSystem.combo : 0,
      multiplier: this.styleSystem ? this.styleSystem.multiplier : 1.0,
      decayTimer: this.styleSystem ? this.styleSystem.decayTimer : 0,
      rankIdx: this.styleSystem ? this.styleSystem.rankIdx : 0,
      gemsCollected: Array.from(this.gemsCollected),
      orbTriggered: Array.from(this.player.orbTriggered),
      beatPosition: (audio && typeof audio.getBeatPosition === 'function') ? audio.getBeatPosition() : null
    };
  }

  restoreCheckpointSnapshot(cp) {
    if (!cp) return;

    // 1. Player Position
    this.player.x = cp.x;
    this.player.y = cp.y;

    // 2. Velocity
    this.player.vy = cp.vy || 0;
    this.currentSpeedMult = cp.speedMult || 1.0;
    if (cp.speed) this.level.speed = cp.speed;
    this.player.vx = this.level.speed * this.currentSpeedMult;

    // 3. Movement State
    this.player.vehicleMode = cp.vehicleMode || "cube";
    this.player.rotationZ = cp.rotationZ || 0;
    this.player.isGrounded = !!cp.isGrounded;
    this.player.isHolding = false;
    this.player.isAlive = true;
    this.player.hasShield = !!cp.hasShield;
    this.player.invulnerableTimer = 1.0; // 1s grace period so you don't immediately die!

    // 4. Gravity State
    this.player.gravityDir = cp.gravityDir || 1;

    // 5. Score
    if (this.styleSystem && cp.score !== undefined) {
      this.styleSystem.score = cp.score;
    }
    if (cp.gemsCollected) {
      this.gemsCollected = new Set(cp.gemsCollected);
      this.updateGemHUD();
      if (this.renderer && this.renderer.resetGems) {
        this.renderer.resetGems(this.gemsCollected);
      }
    }

    // 6. Combo
    if (this.styleSystem) {
      if (cp.combo !== undefined) this.styleSystem.combo = cp.combo;
      if (cp.multiplier !== undefined) this.styleSystem.multiplier = cp.multiplier;
      if (cp.decayTimer !== undefined) this.styleSystem.decayTimer = cp.decayTimer;
      if (cp.rankIdx !== undefined) this.styleSystem.rankIdx = cp.rankIdx;
      this.updateStyleHUD();
    }

    // 7. Beat Position & Music Synchronization
    if (cp.beatPosition && typeof audio.setBeatPosition === 'function') {
      audio.setBeatPosition(cp.beatPosition.step, cp.beatPosition.bar, cp.beatPosition.trackProgression);
      if (!audio.isPlaying && this.level && this.level.bpm) {
        audio.startMusic(this.level.bpm, this.level.theme, cp.beatPosition.step, cp.beatPosition.bar);
      }
    } else if (this.level && this.level.bpm) {
      const progRatio = Math.max(0, Math.min(1.0, this.player.x / this.level.endX));
      audio.setTrackProgression(progRatio);
    }

    // Dismiss Gothic Living Environment Freeze & Overlay
    this.isTimeFrozen = false;
    const gothicOverlay = document.getElementById('gothic-climax-overlay');
    if (gothicOverlay) {
      gothicOverlay.style.display = 'none';
      document.getElementById('gothic-flash-blast')?.classList.remove('flash-active');
      document.getElementById('gothic-shockwave-ring')?.classList.remove('wave-active');
      document.getElementById('gothic-card-container')?.classList.remove('slam-active');
    }
    if (this.renderer && this.renderer.sceneryManager) {
      this.renderer.sceneryManager.setFrozen(false);
    }

    // Restore shield pickups based on checkpoint location
    if (this.level && this.level.obstacles) {
      this.level.obstacles.forEach(o => {
        if (o.type === 'shield') {
          o.collected = (o.x < cp.x && cp.hasShield);
        }
        if (o.unstable && o.x >= cp.x - 2) {
          o._shaking = false;
          o._fallen = false;
          o._shakeTimer = 0;
          if (this.renderer && this.renderer.unstableBlocks && this.renderer.unstableBlocks.has(o)) {
            const entry = this.renderer.unstableBlocks.get(o);
            entry.fallen = false;
            entry.shaking = false;
            entry.shakeTimer = 0;
            entry.vy = 0;
            entry.mesh.position.y = entry.initialY;
            entry.mesh.position.x = entry.initialX;
            entry.mesh.position.z = entry.initialZ;
            entry.mesh.visible = true;
          }
        }
      });
      if (this.renderer && this.renderer.shieldPickupMeshes) {
        this.renderer.shieldPickupMeshes.forEach(sp => {
          const obs = sp.userData.obstacle;
          const collected = obs ? !!obs.collected : false;
          sp.userData.isCollected = collected;
          sp.visible = !collected;
        });
      }
    }

    // Restore orbTriggered from checkpoint snapshot
    this.player.orbTriggered = new Set(cp.orbTriggered || []);

    const shieldInd = document.getElementById('player-shield-indicator');
    if (shieldInd) shieldInd.style.display = this.player.hasShield ? 'block' : 'none';

    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.player.z = 0;
    this.coilProgress = 0;
    this.coilTransitionTimer = 0;
    this.gameState = 'PLAYING';
  }

  showCheckpointToast(title = "CHECKPOINT REACHED") {
    if (this.dom.checkpointToast) {
      if (this.dom.checkpointToastTitle) {
        this.dom.checkpointToastTitle.textContent = title;
      }
      this.dom.checkpointToast.style.display = 'flex';
      this.dom.checkpointToast.classList.remove('show');
      void this.dom.checkpointToast.offsetWidth;
      this.dom.checkpointToast.classList.add('show');
      if (this.checkpointToastTimeout) clearTimeout(this.checkpointToastTimeout);
      this.checkpointToastTimeout = setTimeout(() => {
        if (this.dom.checkpointToast) {
          this.dom.checkpointToast.classList.remove('show');
          setTimeout(() => {
            if (this.dom.checkpointToast && !this.dom.checkpointToast.classList.contains('show')) {
              this.dom.checkpointToast.style.display = 'none';
            }
          }, 350);
        }
      }, 2200);
    }
  }

  resetPlayer(isFullReset = false) {
    this.physicsAccumulator = 0;
    if (isFullReset) {
      this.attempts = 1;
      this.checkpoints = [];
      this.lastCheckpoint = null;
    }

    const cp = (this.practiceMode && this.checkpoints.length > 0)
      ? this.checkpoints[this.checkpoints.length - 1]
      : (!isFullReset ? this.lastCheckpoint : null);

    if (cp && !isFullReset) {
      this.attempts++;
      this.restoreCheckpointSnapshot(cp);
      this.updateHUDHeader();
      return;
    }

    // Normal restart from beginning (x = 0)
    this.gemsCollected.clear();
    this.brainrotMilestones.clear();
    this.updateGemHUD();
    if (this.renderer && this.renderer.resetGems) {
      this.renderer.resetGems(this.gemsCollected);
    }
    this.player.x = 0;
    this.player.y = (this.level.defaultVehicle === "cube" ? 0 : 2);
    this.currentSpeedMult = 1.0;
    if (this.level.baseSpeed) {
      this.level.speed = this.level.baseSpeed;
    }
    this.player.vx = this.level.speed;
    this.player.vy = 0;
    this.player.rotationZ = 0;
    this.player.vehicleMode = this.level.defaultVehicle || "cube";
    this.player.gravityDir = 1;
    this.player.hasShield = false;
    this.player.invulnerableTimer = 0;
    this.player.isGrounded = true;
    this.player.isAlive = true;
    this.player.orbTriggered.clear();
    audio.updateShipThrust(0);

    // Initialize level starting checkpoint
    this.lastCheckpoint = this.createCheckpointSnapshot(0, this.player.y);

    // Reset Gothic Living Environment Freeze & Overlay
    this.isTimeFrozen = false;
    const gothicOverlay = document.getElementById('gothic-climax-overlay');
    if (gothicOverlay) {
      gothicOverlay.style.display = 'none';
      document.getElementById('gothic-flash-blast')?.classList.remove('flash-active');
      document.getElementById('gothic-shockwave-ring')?.classList.remove('wave-active');
      document.getElementById('gothic-card-container')?.classList.remove('slam-active');
    }
    if (this.renderer && this.renderer.sceneryManager) {
      this.renderer.sceneryManager.setFrozen(false);
    }
    if (this.renderer && this.renderer.resetUnstableBlocks) {
      this.renderer.resetUnstableBlocks();
    }

    // Reset Style Meter
    if (this.styleSystem) {
      this.styleSystem.score = 0;
      this.styleSystem.combo = 0;
      this.styleSystem.multiplier = 1.0;
      this.styleSystem.rankIdx = 0;
      this.updateStyleHUD();
    }

    // Reset boss entity
    if (this.bossManager) {
      this.bossManager.reset();
    }

    // Reset shield pickups & unstable blocks
    if (this.level && this.level.obstacles) {
      this.level.obstacles.forEach(o => {
        if (o.type === 'shield') o.collected = false;
        if (o.type === 'checkpoint') o._passed = false;
        if (o.unstable) {
          o._shaking = false;
          o._fallen = false;
          o._shakeTimer = 0;
        }
      });
    }
    if (this.renderer && this.renderer.shieldPickupMeshes) {
      this.renderer.shieldPickupMeshes.forEach(sp => {
        sp.userData.isCollected = false;
        sp.visible = true;
      });
    }

    const shieldInd = document.getElementById('player-shield-indicator');
    if (shieldInd) shieldInd.style.display = 'none';

    // Ensure rhythm beat alignment on full track restart
    if (isFullReset && this.level && this.level.bpm) {
      audio.startMusic(this.level.bpm, this.level.theme, 0, 0);
    }
    this.updateHUDHeader();
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.player.z = 0;
    this.coilProgress = 0;
    this.coilTransitionTimer = 0;
    if (this.renderer) {
      this.renderer.isCoilTransition = false;
      this.renderer.coilProgress = 0;
      if (this.renderer.camera) {
        this.renderer.camera.fov = this.renderer.defaultCameraFov;
        this.renderer.camera.rotation.z = 0;
        this.renderer.camera.updateProjectionMatrix();
      }
    }
    const warpOverlay = document.getElementById('coil-warp-overlay');
    if (warpOverlay) {
      warpOverlay.classList.remove('warp-active');
      warpOverlay.style.display = 'none';
    }
    if (typeof this.closeGothicEndingOverlay === 'function') {
      this.closeGothicEndingOverlay();
    }
    if (this.gameState === 'GOTHIC_CLIMAX' && this.level && this.level.bpm) {
      audio.startMusic(this.level.bpm, this.level.theme);
    }
    this.gameState = 'PLAYING';
  }

  onPlayerCrash(cause = 'spike') {
    if (!this.player.isAlive) return;

    // 🛡️ Active Energy Shield absorbs death impact with explosive deflection!
    if (this.player.hasShield) {
      this.player.hasShield = false;
      this.player.invulnerableTimer = 1.2; // Generous grace period
      audio.playShieldBreak();

      // Physical deflection & hazard clearance impulse
      this.player.vy = Math.max(15.0 * this.player.gravityDir, this.player.vy + 11.0 * this.player.gravityDir);
      this.player.isGrounded = false;

      if (this.renderer) {
        if (this.renderer.triggerShieldShatter) {
          this.renderer.triggerShieldShatter(this.player.x, this.player.y + 0.5);
        }
        if (this.renderer.triggerShockwave) {
          this.renderer.triggerShockwave(this.player.x, this.player.y + 0.5, 0x00f0ff, 4.8);
        }
        if (this.renderer.triggerScreenFlash) {
          this.renderer.triggerScreenFlash(0.35);
        }
        if (this.renderer.triggerComicHitText) {
          this.renderer.triggerComicHitText(this.player.x, this.player.y + 1.2, "SHIELD DEFLECT! 🛡️⚡", "#00F0FF");
        }
        this.renderer.cameraTrauma = Math.max(this.renderer.cameraTrauma, 0.45);
        if (this.renderer.faceExpression !== undefined) {
          this.renderer.faceExpression = 'shield_active';
        }
      }

      this.addStylePoints(800, "SHIELD PARRY! 🛡️⚡");

      const shieldInd = document.getElementById('player-shield-indicator');
      if (shieldInd) shieldInd.style.display = 'none';
      return;
    }

    // Grace period check from recent shield break
    if (this.player.invulnerableTimer && this.player.invulnerableTimer > 0) {
      return;
    }

    this.player.isAlive = false;

    // Track repeated deaths in this 4-unit zone for Smurf Cat intervention
    const spotKey = Math.floor(this.player.x / 4) * 4;
    const spotDeaths = (this.deathSpotCounts.get(spotKey) || 0) + 1;
    this.deathSpotCounts.set(spotKey, spotDeaths);

    // 🍄 SMURF CAT REQUIREMENT:
    // Only after user struggles at the same spot 5 or more times, and reset spot count to avoid continuous death loops!
    if (spotDeaths >= 5 && !this.practiceMode) {
      this.deathSpotCounts.set(spotKey, 0);
      this.triggerSmurfCatIntervention(spotKey, spotDeaths);
      return;
    }

    this.gameState = 'CRASHED';
    this.respawnTimer = 0.52; // Smooth 0.52s physics momentum slide before respawn

    // 🚀 NEVER STOP INSTANTLY (velocity.x = 0): Impart continuous crash momentum!
    const activeVx = this.player.vx || this.level.speed;
    this.player.crashVx = Math.max(activeVx * 0.88, 7.0);
    this.player.crashVy = Math.max(5.5 * this.player.gravityDir, (this.player.vy || 0) * 0.5 + 5.0 * this.player.gravityDir);
    this.player.crashRotV = (this.player.crashVx * 0.85 + 10.0) * this.player.gravityDir;

    if (this.multiplayer) {
      this.multiplayer.sendCrashEvent(this.player.x, this.player.y);
    }
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    audio.playCrash();
    audio.updateShipThrust(0);

    if (cause === 'lava') {
      audio.playLavaSizzle();
      if (this.renderer) {
        this.renderer.triggerLavaDeath(
          new THREE.Vector3(this.player.x, this.player.y + 0.5 * this.player.gravityDir, 0),
          this.player.crashVx
        );
        const lavaTexts = ["BOILING LAVA! 🌋", "INCINERATED! 🔥", "CRISPY! 💀", "EXTRA TOASTY! 🥓"];
        this.renderer.triggerComicHitText(
          this.player.x,
          this.player.y + 0.8,
          lavaTexts[Math.floor(Math.random() * lavaTexts.length)],
          "#FF4500"
        );
      }
    } else {
      // Chaos Mode / Custom SFX on Crash
      if (audio.customClips['crash']) {
        audio.playMemeClip('crash', 0.95);
      } else if (this.chaosMode === 'high' || (this.chaosMode === 'normal' && Math.random() < 0.45)) {
        if (Math.random() < 0.5) {
          audio.playMetalPipe(0.85);
          if (this.renderer) {
            this.renderer.triggerComicHitText(this.player.x, this.player.y + 0.8, "CLANGGG! 🔔", "#C0C0C0");
          }
        } else {
          audio.playVineBoom(0.95);
          if (this.renderer) {
            this.renderer.triggerComicHitText(this.player.x, this.player.y + 0.8, "BOOM! 💥", "#FF2244");
          }
        }
      }

      // Trigger standard 3D shattered voxel explosion with inherited forward momentum
      this.renderer.triggerDeathExplosion(
        new THREE.Vector3(this.player.x, this.player.y + 0.5 * this.player.gravityDir, 0),
        this.level.diffColor,
        this.player.crashVx,
        this.player.crashVy
      );
    }

    // Screen Flash Effect
    if (this.dom.screenFlash) {
      this.dom.screenFlash.classList.add('flash-active');
      setTimeout(() => this.dom.screenFlash.classList.remove('flash-active'), 160);
    }

    // Increment Attempt in normal mode
    if (!this.practiceMode || this.checkpoints.length === 0) {
      this.attempts++;
      this.dom.attemptCount.innerHTML = `ATTEMPT <span>${this.attempts}</span>`;
    }
  }

  // 🍄 Smurf Cat (Shailushai) Repeat Death Philosophical Event
  triggerSmurfCatIntervention(spotKey, spotDeaths) {
    this.gameState = 'SMURF_CAT';
    this.player.isAlive = false;
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    audio.updateShipThrust(0);
    audio.playCrash();

    // 3D Death voxel burst with cyan/blue Smurf tint
    this.renderer.triggerDeathExplosion(
      new THREE.Vector3(this.player.x, this.player.y + 0.5 * this.player.gravityDir, 0),
      "#00F0FF"
    );

    // Increment attempt counter
    this.attempts++;
    this.dom.attemptCount.innerHTML = `ATTEMPT <span>${this.attempts}</span>`;

    // Start playing the iconic Alan Walker "The Spectre" EDM melody & "We live, we love, we lie" vocal
    audio.playSmurfCat();

    // Populate and display the Smurf Cat dramatic modal
    if (this.dom.smurfDeathMsg) {
      this.dom.smurfDeathMsg.textContent = `You have fallen ${spotDeaths} times at this exact spot (X ≈ ${spotKey}m)!`;
    }
    if (this.dom.smurfModal) {
      this.dom.smurfModal.style.display = 'flex';
    }
  }

  closeSmurfCatModal() {
    if (this.dom.smurfModal) {
      this.dom.smurfModal.style.display = 'none';
    }
    audio.stopSmurfCat();

    // Grant Smurf Cat Blessed Cyan Aura and Halo over the player cube!
    this.playerSmurfAura = true;
    if (this.renderer) {
      this.renderer.setSmurfCatAura(true);
    }

    this.lastTime = performance.now();
    this.gameState = 'PLAYING';
    this.resetPlayer(false);
    audio.resumeMusic();
    this.triggerBrainrotPop("smurf", "SMURF CAT BLESSING", "WE LIVE WE LOVE WE LIE 🍄🐱 (+10,000 AURA)");
  }

  // 🥁 Tung Tung Sahur Pop-In & Whacking Event
  triggerTungTungSahur() {
    if (!this.player.isAlive || this.gameState !== 'PLAYING') return;
    this.isTungTungActive = true;

    // Show animated top alert banner
    if (this.dom.tungTungBanner) {
      this.dom.tungTungBanner.style.display = 'block';
      if (this.dom.tungTungBannerSub) {
        this.dom.tungTungBannerSub.textContent = "BEATING THE SULFUR CUBE! (SAHUR SAHUR!)";
      }
    }

    // Play authentic Indonesian audio: "Tung tung tung sahur! Sahur sahur, tung tung tung sahur!"
    audio.playTungTungSahur();

    // Trigger 3D character attack in renderer
    if (this.renderer) {
      this.renderer.triggerTungTungAttack(this.player.x, this.player.y, (strike) => {
        // Impact callback on each whack!
        audio.playBonk();

        // Bouncy comical reaction: give player a comical bouncy boost
        if (this.player.isGrounded || this.player.isHolding) {
          this.player.vy = Math.max(this.player.vy, 15.5 * this.player.gravityDir);
          this.player.isGrounded = false;
        }

        if (this.dom.tungTungBannerSub) {
          this.dom.tungTungBannerSub.textContent = `BEATING THE SULFUR CUBE! (WHACK ${strike}/6 💥)`;
        }

        if (strike >= 6) {
          setTimeout(() => {
            if (this.dom.tungTungBanner) {
              this.dom.tungTungBanner.style.display = 'none';
            }
            this.isTungTungActive = false;
          }, 1800);
        }
      });
    }
  }

  // 🗿 Near Miss Spike Dodge ("WHAT THE SIGMA?!")
  onNearMissSpike(x, y) {
    if (this.nearMissCooldown > 0) return;
    this.nearMissCooldown = 15.0;
    audio.playWhatTheSigma();
    if (this.renderer) {
      this.renderer.triggerComicHitText(x, y + 1.2, "WHAT THE SIGMA?! 🗿", "#00F0FF");
    }
    if (this.chaosMode === 'high') {
      this.triggerBrainrotPop("sigma", "WHAT THE SIGMA?!", "NARROW ESCAPE! +5,000 AURA 🗿");
    }
  }

  // 🤪 Meme Chaos Dashboard
  openMemeChaosModal() {
    if (this.dom.memeChaosModal) {
      this.dom.memeChaosModal.style.display = 'flex';
    }
  }

  closeMemeChaosModal() {
    if (this.dom.memeChaosModal) {
      this.dom.memeChaosModal.style.display = 'none';
    }
  }
  // -------------------------------------------------------------
  // 🏰 EPIC GOTHIC CASTLE CLIMAX: MUSIC CUT, TIME FREEZE & TITLE SLAM
  // -------------------------------------------------------------
  startGothicEndingSequence() {
    if (this.gameState === 'GOTHIC_CLIMAX' || this.gameState === 'VICTORY') return;
    this.gameState = 'GOTHIC_CLIMAX';
    this.isTimeFrozen = true;

    // 1. MUSIC CUTS INSTANTLY (Dead-Stop Silence)
    audio.cutMusicInstant();
    audio.stopShipHum();
    audio.updateShipThrust(0);

    // 2. EVERYTHING FREEZES (Time stopped in space - freeze frame)
    this.player.vy = 0;
    this.player.isHolding = false;
    if (this.renderer && typeof this.renderer.setCinematicFreeze === 'function') {
      this.renderer.setCinematicFreeze(true);
    }

    // 3. TENSION PAUSE... (1000ms dead silence)
    setTimeout(() => {
      if (this.gameState !== 'GOTHIC_CLIMAX') return;

      // 4. THEN: BOOM! (Sub-bass 808 explosion + cathedral gong + stone shatter)
      audio.playGothicEndingBoom();

      // Screen trauma & shrapnel debris explosion
      if (this.renderer && typeof this.renderer.triggerGothicEndingBoom === 'function') {
        this.renderer.triggerGothicEndingBoom(this.player.x, this.player.y + 0.5);
      }

      // 5. SLAM TITLE CARD (Full-Screen Visual Climax)
      const overlay = document.getElementById('gothic-climax-overlay');
      const flash = document.getElementById('gothic-flash-blast');
      const ring = document.getElementById('gothic-shockwave-ring');
      const card = document.getElementById('gothic-card-container');

      if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.add('active');
        if (flash) {
          flash.classList.remove('flash-active');
          void flash.offsetWidth;
          flash.classList.add('flash-active');
        }
        if (ring) {
          ring.classList.remove('wave-active');
          void ring.offsetWidth;
          ring.classList.add('wave-active');
        }
        if (card) {
          card.classList.remove('slam-active');
          void card.offsetWidth;
          card.classList.add('slam-active');
        }
      }

      // Populate gothic score & stats
      const statAttempts = document.getElementById('gothic-stat-attempts');
      const statGems = document.getElementById('gothic-stat-gems');
      const statAura = document.getElementById('gothic-stat-aura');
      if (statAttempts) statAttempts.textContent = `${this.attempts}`;
      if (statGems) statGems.textContent = `${this.gemsCollected.size} / ${this.totalLevelGems || 3}`;
      if (statAura) statAura.textContent = `+50,000 🔥`;

      // Record 100% completion in local storage
      this.bestScores[this.currentLevelIndex] = 100;
      this.saveBestScores();
    }, 1000);
  }

  closeGothicEndingOverlay() {
    const overlay = document.getElementById('gothic-climax-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.style.display = 'none';
      document.getElementById('gothic-flash-blast')?.classList.remove('flash-active');
      document.getElementById('gothic-shockwave-ring')?.classList.remove('wave-active');
      document.getElementById('gothic-card-container')?.classList.remove('slam-active');
    }
    this.isTimeFrozen = false;
    if (this.renderer && this.renderer.sceneryManager) {
      this.renderer.sceneryManager.setFrozen(false);
    }
    if (this.renderer && typeof this.renderer.setCinematicFreeze === 'function') {
      this.renderer.setCinematicFreeze(false);
    }
  }

  // -------------------------------------------------------------
  // ⚡ HIGH-POWER INDUCTOR COIL LEVEL FINISH TRANSITION
  // -------------------------------------------------------------
  startInductorCoilTransition() {
    if (this.gameState === 'COIL_TRANSITION' || this.gameState === 'VICTORY') return;

    this.gameState = 'COIL_TRANSITION';
    this.coilTransitionTimer = 0;
    this.coilTransitionDuration = 2.4;
    this.coilStartX = this.player.x;
    this.coilLength = 26.0;
    this.coilTargetY = 2.8; // Coil center tunnel axis
    this.coilProgress = 0;

    // Morph to iconic cube mode for the space-time bending experience
    this.player.vehicleMode = 'cube';
    this.player.isHolding = false;
    this.player.isGrounded = false;
    audio.stopShipHum();

    // Fire high-power alien sound with FM sweep, resonant filter, sub drone, electric arc snaps, and breach boom!
    audio.playAlienInductorTransition(this.coilTransitionDuration);

    // ⚡ Trigger 3D renderer camera FOV warp and relativistic tunnel transit
    if (this.renderer && typeof this.renderer.startCoilTransition === 'function') {
      this.renderer.startCoilTransition(this.player, this.coilTransitionDuration, () => {
        this.finishInductorCoilTransition();
      });
    }

    // Show visual warp overlay HUD
    const warpOverlay = document.getElementById('coil-warp-overlay');
    if (warpOverlay) {
      warpOverlay.style.display = 'flex';
      setTimeout(() => warpOverlay.classList.add('warp-active'), 10);
    }
  }

  updateCoilTransition(dt) {
    this.coilTransitionTimer += dt;
    const progress = Math.min(1.0, this.coilTransitionTimer / this.coilTransitionDuration);
    this.coilProgress = progress;

    // 1. Relativistic acceleration through the inductor coil
    const easeP = progress * progress * (3 - 2 * progress);
    this.player.x = this.coilStartX + easeP * (this.coilLength + 8.0);

    // 2. Magnetic central alignment
    const alignWeight = Math.min(1.0, progress * 4.5);
    const targetBaseY = this.coilTargetY;
    this.player.y = (1.0 - alignWeight) * this.player.y + alignWeight * targetBaseY;

    // 3. Space-Time Bending Sinusoidal Corkscrew Wave ("bending through coil")
    const bendEnvelope = Math.sin(progress * Math.PI);
    const waveFreq = 26.0;
    const bendAmp = 0.55 * bendEnvelope;
    this.player.y += Math.sin(this.coilTransitionTimer * waveFreq) * bendAmp * dt * 25.0;
    this.player.z = Math.cos(this.coilTransitionTimer * waveFreq) * bendAmp;

    // 4. Rapid relativistic multi-axis spin
    this.player.rotationZ -= (18.0 + progress * 28.0) * dt;

    // 5. Check transition complete (fallback in case renderer callback didn't trigger)
    if (progress >= 1.0 && this.gameState === 'COIL_TRANSITION') {
      this.finishInductorCoilTransition();
    }
  }

  finishInductorCoilTransition() {
    if (this.gameState === 'VICTORY') return;
    this.player.z = 0;
    this.coilProgress = 1.0;

    // Hide warp overlay
    const warpOverlay = document.getElementById('coil-warp-overlay');
    if (warpOverlay) {
      warpOverlay.classList.remove('warp-active');
      setTimeout(() => {
        warpOverlay.style.display = 'none';
      }, 350);
    }

    // Trigger explosive shockwave pulse at inductor coil exit
    if (this.renderer) {
      this.renderer.triggerExitShockwave(this.level.endX + 26.0, 2.8);
    }

    // Trigger level victory fanfare and modal
    this.onPlayerVictory();
  }

  onPlayerVictory() {
    this.gameState = 'VICTORY';
    audio.playVictory();

    // Record 100%
    this.bestScores[this.currentLevelIndex] = 100;
    this.saveBestScores();

    // Open Victory Modal
    this.dom.victoryAttempts.textContent = `Completed in ${this.attempts} Attempt${this.attempts === 1 ? '' : 's'}!`;
    this.dom.victoryModal.style.display = 'flex';
  }

  // -------------------------------------------------------------
  // CONTROLS & INPUT HANDLING
  // -------------------------------------------------------------

  bindControls() {
    // Audio Unlocker for iPad/Safari
    const unlockAudio = () => {
      audio.init();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });

    // Tap / Hold Input for Screen
    const handleInputStart = (e) => {
      if (this.gameState === 'SMURF_CAT') {
        this.closeSmurfCatModal();
        return;
      }
      if (this.gameState === 'MENU' || this.gameState === 'PAUSED') return;
      if (e.target.closest('.interactive-btn') || e.target.closest('.modal-card') || e.target.closest('.start-screen-overlay')) return;
      this.player.isHolding = true;
      this.handleJumpPress();
    };

    const handleInputEnd = (e) => {
      this.player.isHolding = false;
      audio.stopShipHum();
    };

    window.addEventListener('pointerdown', handleInputStart);
    window.addEventListener('pointerup', handleInputEnd);
    window.addEventListener('pointercancel', handleInputEnd);

    // Keyboard support
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.code === 'Escape') {
        if (this.gameState === 'PAUSED') {
          this.resumeGame();
        } else if (this.gameState === 'PLAYING') {
          this.pauseGame();
        }
        return;
      }
      if (this.gameState === 'PAUSED') {
        if (e.code === 'Space') {
          this.resumeGame();
        }
        return;
      }
      if (this.gameState === 'MENU') {
        if (e.code === 'Space' || e.code === 'Enter') {
          this.startGameSolo();
        }
        return;
      }
      if (this.gameState === 'SMURF_CAT') {
        this.closeSmurfCatModal();
        return;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.player.isHolding = true;
        this.handleJumpPress();
      } else if (e.code === 'KeyZ') {
        this.placeCheckpoint();
      } else if (e.code === 'KeyX') {
        this.deleteCheckpoint();
      } else if (e.code === 'KeyP') {
        this.togglePracticeMode();
      } else if (e.code === 'KeyR') {
        this.resetPlayer(true);
      } else if (e.code === 'KeyM') {
        this.toggleMute();
      } else if (e.code === 'KeyT') {
        // ⚡ Dev/Practice shortcut: teleport to Inductor Coil entrance
        if (this.gameState === 'PLAYING') {
          this.player.x = this.level.endX - 3.5;
          this.player.y = 0;
          this.player.vy = 0;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.player.isHolding = false;
        audio.stopShipHum();
      }
    });

    // Touch Button Handlers
    this.dom.practiceBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePracticeMode();
    });

    this.dom.placeCheckpointBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.placeCheckpoint();
    });

    this.dom.deleteCheckpointBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteCheckpoint();
    });

    this.dom.levelSelectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openLevelModal();
    });

    this.dom.closeLevelModal.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeLevelModal();
    });

    this.dom.muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMute();
    });

    this.dom.restartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.resetPlayer(true);
    });

    // Party & Multiplayer Modal Listeners
    if (this.dom.partyBtn) {
      this.dom.partyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openPartyModal();
      });
    }

    if (this.dom.closePartyModal) {
      this.dom.closePartyModal.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closePartyModal();
      });
    }

    if (this.dom.startPartyRunBtn) {
      this.dom.startPartyRunBtn.addEventListener('click', () => {
        this.closePartyModal();
        if (this.multiplayer) {
          this.multiplayer.requestStartRace();
        } else {
          this.resetPlayer(true);
        }
      });
    }

    if (this.dom.partyCopyLinkBtn) {
      this.dom.partyCopyLinkBtn.addEventListener('click', () => {
        const link = this.multiplayer ? this.multiplayer.getInviteLink() : window.location.href;
        const fallbackCopy = () => {
          if (this.dom.partyShareUrl) {
            this.dom.partyShareUrl.select();
            this.dom.partyShareUrl.setSelectionRange(0, 99999);
            document.execCommand('copy');
          }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(link).catch(fallbackCopy);
        } else {
          fallbackCopy();
        }
        this.dom.partyCopyLinkBtn.textContent = 'COPIED! ✓';
        this.dom.partyCopyLinkBtn.style.background = '#00ff88';
        this.triggerBrainrotPop("link", "LINK COPIED! 🎮", "SHARE WITH FRIENDS ON DISCORD / WHATSAPP");
        setTimeout(() => {
          if (this.dom.partyCopyLinkBtn) {
            this.dom.partyCopyLinkBtn.textContent = '📋 COPY INVITE LINK';
            this.dom.partyCopyLinkBtn.style.background = '';
          }
        }, 2200);
      });
    }

    if (this.dom.partyNewCodeBtn) {
      this.dom.partyNewCodeBtn.addEventListener('click', () => {
        const newCode = 'DASH-' + Math.floor(1000 + Math.random() * 9000);
        if (this.multiplayer) {
          this.multiplayer.startHost(newCode);
          if (this.dom.partyShareUrl) {
            this.dom.partyShareUrl.value = this.multiplayer.getInviteLink();
          }
        }
      });
    }

    if (this.dom.joinRoomBtn) {
      this.dom.joinRoomBtn.addEventListener('click', () => {
        let code = this.dom.joinRoomCodeInput ? this.dom.joinRoomCodeInput.value.trim() : '';
        if (!code) return;
        if (code.includes('room=')) {
          try {
            const u = new URL(code);
            code = u.searchParams.get('room') || code;
          } catch (e) {}
        }
        if (this.multiplayer) {
          this.multiplayer.connectAsClient(code);
        }
      });
    }

    if (this.dom.playerNameInput) {
      this.dom.playerNameInput.addEventListener('change', (e) => {
        if (this.multiplayer) {
          this.multiplayer.setProfile(e.target.value, this.multiplayer.playerColor);
        }
      });
    }

    document.querySelectorAll('.color-swatch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const c = btn.getAttribute('data-color');
        if (this.multiplayer) {
          this.multiplayer.setProfile(this.multiplayer.playerName, c);
        }
        if (this.renderer && this.renderer.setPlayerColor) {
          this.renderer.setPlayerColor(c);
        }
      });
    });

    if (this.dom.toggleLeaderboardBtn && this.dom.leaderboardPanel) {
      this.dom.toggleLeaderboardBtn.addEventListener('click', () => {
        this.dom.leaderboardPanel.classList.toggle('minimized');
        this.dom.toggleLeaderboardBtn.textContent = this.dom.leaderboardPanel.classList.contains('minimized') ? '+' : '−';
      });
    }

    this.dom.victoryNextBtn.addEventListener('click', () => {
      this.dom.victoryModal.style.display = 'none';
      const nextIdx = (this.currentLevelIndex + 1) % this.levels.length;
      this.loadLevel(nextIdx);
    });

    this.dom.victoryReplayBtn.addEventListener('click', () => {
      this.dom.victoryModal.style.display = 'none';
      this.loadLevel(this.currentLevelIndex);
    });

    // 🏰 Gothic Castle Climax Ending Modal Buttons
    const gothicNextBtn = document.getElementById('gothic-next-btn');
    if (gothicNextBtn) {
      gothicNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeGothicEndingOverlay();
        const nextIdx = (this.currentLevelIndex + 1) % this.levels.length;
        this.loadLevel(nextIdx);
      });
    }

    const gothicReplayBtn = document.getElementById('gothic-replay-btn');
    if (gothicReplayBtn) {
      gothicReplayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeGothicEndingOverlay();
        this.loadLevel(this.currentLevelIndex);
      });
    }

    // 🍄 Smurf Cat Modal Resume
    if (this.dom.smurfResumeBtn) {
      this.dom.smurfResumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeSmurfCatModal();
      });
    }

    // 🤪 Meme Chaos Dashboard Modal Listeners
    if (this.dom.memeChaosBtn) {
      this.dom.memeChaosBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openMemeChaosModal();
      });
    }

    if (this.dom.closeMemeChaosModal) {
      this.dom.closeMemeChaosModal.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeMemeChaosModal();
      });
    }

    if (this.dom.summonTungTungBtn) {
      this.dom.summonTungTungBtn.addEventListener('click', () => {
        this.closeMemeChaosModal();
        this.triggerTungTungSahur();
      });
    }

    if (this.dom.summonSmurfCatBtn) {
      this.dom.summonSmurfCatBtn.addEventListener('click', () => {
        this.closeMemeChaosModal();
        this.triggerSmurfCatIntervention(Math.floor(this.player.x / 4) * 4, 3);
      });
    }

    if (this.dom.summonSigmaBtn) {
      this.dom.summonSigmaBtn.addEventListener('click', () => {
        audio.playWhatTheSigma();
        if (this.renderer) {
          this.renderer.faceExpression = 'sigma';
          setTimeout(() => { if (this.renderer) this.renderer.faceExpression = 'normal'; }, 2200);
          this.renderer.triggerComicHitText(this.player.x, this.player.y + 1.2, "WHAT THE SIGMA?! 🗿", "#FFD000");
        }
        this.triggerBrainrotPop("sigma", "WHAT THE SIGMA?!", "MAXIMUM MEWING UNLOCKED! +10,000 AURA 🗿");
      });
    }

    if (this.dom.summonGigachadBtn) {
      this.dom.summonGigachadBtn.addEventListener('click', () => {
        audio.playGigachad();
        if (this.renderer) {
          this.renderer.faceExpression = 'gigachad';
          setTimeout(() => { if (this.renderer) this.renderer.faceExpression = 'normal'; }, 2500);
          this.renderer.triggerComicHitText(this.player.x, this.player.y + 1.2, "BYE BYE! 🤫🧏‍♂️", "#FF007F");
        }
        this.triggerBrainrotPop("chad", "GIGACHAD AURA", "CAN YOU FEEL MY HEART 🔥 +50,000 AURA");
      });
    }

    if (this.dom.summonEmotionalBtn) {
      this.dom.summonEmotionalBtn.addEventListener('click', () => {
        audio.playEmotionalDamage();
        if (this.renderer) {
          this.renderer.faceExpression = 'bonked';
          setTimeout(() => { if (this.renderer) this.renderer.faceExpression = 'normal'; }, 1800);
          this.renderer.triggerComicHitText(this.player.x, this.player.y + 1.2, "EMOTIONAL DAMAGE! 💔", "#FF0055");
        }
        this.triggerBrainrotPop("damage", "EMOTIONAL DAMAGE", "THAT WAS A CRITICAL HIT 💀");
      });
    }

    if (this.dom.summonSkibidiBtn) {
      this.dom.summonSkibidiBtn.addEventListener('click', () => {
        audio.playSkibidi();
        if (this.renderer) {
          this.renderer.triggerComicHitText(this.player.x, this.player.y + 1.2, "SKIBIDI RIZZ! 🚽", "#00FF88");
          this.renderer.triggerShockwave(this.player.x, this.player.y, 0x00ff88, 3.0);
        }
        this.triggerBrainrotPop("skibidi", "SKIBIDI RIZZ", "UNSPOKEN RIZZ OVERLOAD! +5,000 AURA 🔥");
      });
    }

    if (this.dom.testMetalPipeBtn) {
      this.dom.testMetalPipeBtn.addEventListener('click', () => {
        audio.playMetalPipe();
        if (this.renderer) {
          this.renderer.triggerComicHitText(this.player.x, this.player.y + 1, "CLANGGG! 🔔", "#A0C0FF");
        }
      });
    }

    if (this.dom.testVineBoomBtn) {
      this.dom.testVineBoomBtn.addEventListener('click', () => {
        audio.playVineBoom();
        if (this.renderer) {
          this.renderer.triggerShockwave(this.player.x, this.player.y, 0xff0000, 3.5);
        }
      });
    }

    // Meme Accessory Buttons
    document.querySelectorAll('.meme-acc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.meme-acc-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const acc = btn.getAttribute('data-acc');
        if (this.renderer) {
          this.renderer.setMemeAccessory(acc);
        }
        this.triggerBrainrotPop("acc", "ACCESSORY EQUIPPED", `${acc.toUpperCase()} EQUIPPED! ✨`);
      });
    });

    // Chaos Frequency Toggle Buttons
    document.querySelectorAll('.chaos-freq-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.chaos-freq-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.chaosMode = btn.getAttribute('data-freq');
        this.triggerBrainrotPop("freq", "CHAOS MODE", `${this.chaosMode.toUpperCase()} ENGAGED 🔥`);
      });
    });

    // Custom Audio File Uploaders (winging it with custom meme audio!)
    if (this.dom.uploadTungTung) {
      this.dom.uploadTungTung.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          audio.registerCustomAudio('tung_tung', e.target.files[0]);
          this.triggerBrainrotPop("custom", "AUDIO REPLACED", "TUNG TUNG MP3 LOADED 🥁");
        }
      });
    }

    if (this.dom.uploadSmurfCat) {
      this.dom.uploadSmurfCat.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          audio.registerCustomAudio('smurf_cat', e.target.files[0]);
          this.triggerBrainrotPop("custom", "AUDIO REPLACED", "SMURF CAT MP3 LOADED 🍄");
        }
      });
    }

    if (this.dom.uploadCrash) {
      this.dom.uploadCrash.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          audio.registerCustomAudio('crash', e.target.files[0]);
          this.triggerBrainrotPop("custom", "AUDIO REPLACED", "CRASH SFX LOADED 💥");
        }
      });
    }
  }

  checkOrbTrigger() {
    if (!this.player.isAlive || this.gameState !== 'PLAYING') return false;
    const p = this.player;
    const orbRadius = 2.4; // Generous trigger radius
    for (let i = 0; i < this.level.obstacles.length; i++) {
      const obs = this.level.obstacles[i];
      if (obs.type === 'orb' || obs.type === 'counter_orb') {
        const dx = p.x - obs.x;
        const dy = (p.y + 0.5 * p.gravityDir) - obs.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= orbRadius && !p.orbTriggered.has(i)) {
          p.orbTriggered.add(i);

          if (obs.type === 'counter_orb') {
            const turretMesh = this.renderer.counterOrbMeshes?.find(m => m.userData.obstacle === obs);
            if (turretMesh && turretMesh.userData.triggerTurret) {
              turretMesh.userData.triggerTurret();
            }
            if (this.bossManager) {
              this.bossManager.fireCounterMissile(p.x, p.y + 0.5);
            }
            p.vy = 16.5 * p.gravityDir;
            p.isGrounded = false;
            return true;
          }

          audio.playOrbChime();

          // Trigger Squash & Orb Shockwave
          this.renderer.triggerJumpSquash();
          const orbMesh = this.renderer.orbMeshes.find(m => m.userData.obstacle === obs);
          if (orbMesh && orbMesh.userData.triggerOrb) {
            orbMesh.userData.triggerOrb();
          }

          const targetVx = (this.level.speed || 11.0) * (this.currentSpeedMult || 1.0);
          if (obs.subType === 'yellow') {
            p.vy = 18.5 * p.gravityDir;
            p.vx = Math.max(p.vx + 2.5, targetVx * 1.12); // Forward aerial momentum kick!
            p.isGrounded = false;
          } else if (obs.subType === 'pink') {
            p.vy = 14.0 * p.gravityDir;
            p.vx = Math.max(p.vx + 1.8, targetVx * 1.08);
            p.isGrounded = false;
          } else if (obs.subType === 'blue') {
            // Gravity Flip Orb!
            p.gravityDir *= -1;
            p.vy = (p.gravityDir === -1 ? 16.0 : -16.0);
            p.vx = Math.max(p.vx + 2.2, targetVx * 1.10);
            p.isGrounded = false;
            audio.playGravityFlip(p.gravityDir < 0);
          }
          return true;
        }
      }
    }
    return false;
  }

  handleJumpPress() {
    if (!this.player.isAlive || this.gameState !== 'PLAYING') return;

    // 1. Buffer the jump for 160ms
    this.jumpBufferTimer = 0.16;

    // 2. Check for nearby Jump Orbs within trigger radius
    if (this.checkOrbTrigger()) return;

    // 3. Mode-Specific Immediate Jump
    if (this.player.vehicleMode === 'cube') {
      if (this.player.isGrounded || this.coyoteTimer > 0) {
        this.player.vy = 16.5 * this.player.gravityDir;
        this.player.isGrounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        audio.playMechanicalJump();
        this.renderer.triggerJumpSquash();
      }
    } else if (this.player.vehicleMode === 'wave') {
      // Detonate sharp turn shockwave at vertex
      this.renderer.triggerShockwave(this.player.x, this.player.y, 0xd500f9, 2.2);
    } else if (this.player.vehicleMode === 'ufo') {
      this.player.vy = 12.5 * this.player.gravityDir;
      audio.playUfoHop();
      this.renderer.triggerJumpSquash();
      this.renderer.triggerShockwave(this.player.x, this.player.y, 0xffa500, 2.0);
    }
  }

  togglePracticeMode() {
    this.practiceMode = !this.practiceMode;
    if (this.practiceMode) {
      this.dom.practiceBtn.classList.add('active-pill');
      if (this.dom.checkpointDock) this.dom.checkpointDock.style.display = 'flex';
      if (this.dom.placeCheckpointBtn) this.dom.placeCheckpointBtn.style.display = 'flex';
      if (this.dom.deleteCheckpointBtn) this.dom.deleteCheckpointBtn.style.display = 'flex';
    } else {
      this.dom.practiceBtn.classList.remove('active-pill');
      if (this.dom.checkpointDock) this.dom.checkpointDock.style.display = 'none';
      if (this.dom.placeCheckpointBtn) this.dom.placeCheckpointBtn.style.display = 'none';
      if (this.dom.deleteCheckpointBtn) this.dom.deleteCheckpointBtn.style.display = 'none';
      this.checkpoints = [];
      this.renderer.renderCheckpoints(this.checkpoints);
    }
  }

  placeCheckpoint() {
    if (!this.practiceMode || !this.player.isAlive) return;
    const snap = this.createCheckpointSnapshot(this.player.x, this.player.y);
    this.checkpoints.push(snap);
    audio.playCheckpoint();
    this.renderer.renderCheckpoints(this.checkpoints);
    this.showCheckpointToast("PRACTICE CHECKPOINT SET");
  }

  deleteCheckpoint() {
    if (!this.practiceMode || this.checkpoints.length === 0) return;
    this.checkpoints.pop();
    audio.playCheckpointRemove();
    this.renderer.renderCheckpoints(this.checkpoints);
  }

  toggleMute() {
    const isMuted = audio.toggleMute();
    this.dom.muteBtn.textContent = isMuted ? '🔇' : '🔊';
  }

  openLevelModal() {
    this.dom.levelCardsContainer.innerHTML = '';
    this.levels.forEach((lvl, idx) => {
      const card = document.createElement('div');
      card.className = `level-card ${idx === this.currentLevelIndex ? 'selected' : ''}`;
      const badgeSvg = DifficultyBadges.getBadge(lvl.difficulty);
      card.innerHTML = `
        <div class="level-card-header">
          <div style="display:flex; align-items:center; gap:10px;">
            ${badgeSvg}
            <span class="level-card-title">${lvl.name}</span>
          </div>
          <span class="level-card-diff" style="background:${lvl.diffColor}22; color:${lvl.diffColor}; border: 1px solid ${lvl.diffColor};">
            ${lvl.diffStars} ${lvl.difficulty}
          </span>
        </div>
        <div class="level-card-desc">${lvl.desc}</div>
        <div class="level-card-meta">
          <span>🎵 ${lvl.bpm} BPM</span>
          <span>🏆 Best: ${this.bestScores[idx] || 0}%</span>
        </div>
      `;
      card.addEventListener('click', () => {
        this.closeLevelModal();
        this.loadLevel(idx);
      });
      this.dom.levelCardsContainer.appendChild(card);
    });
    this.dom.levelSelectModal.style.display = 'flex';
  }

  closeLevelModal() {
    this.dom.levelSelectModal.style.display = 'none';
  }

  // -------------------------------------------------------------
  // PHYSICS UPDATE & COLLISION DETECTION
  // -------------------------------------------------------------

  updatePhysics(dt) {
    if (this.gameState === 'COIL_TRANSITION') {
      this.updateCoilTransition(dt);
      return;
    }

    if (this.gameState === 'GOTHIC_CLIMAX') {
      return;
    }

    if (this.gameState !== 'PLAYING' || !this.player.isAlive) {
      if (this.gameState === 'CRASHED') {
        this.respawnTimer -= dt;

        // 🚀 CONTINUOUS CRASH MOMENTUM: Never stop instantly (velocity.x = 0)!
        const p = this.player;
        const ceilY = (this.level && this.level.ceilY) ? this.level.ceilY : 10.0;

        // Smooth kinetic friction deceleration slide
        p.crashVx = (p.crashVx || 0) * Math.pow(0.22, dt);
        p.x += p.crashVx * dt;

        // Gravity arc & ground/ceiling deflection bounce
        p.crashVy = (p.crashVy || 0) - 38.0 * p.gravityDir * dt;
        p.y += p.crashVy * dt;

        if (p.gravityDir === 1 && p.y <= 0) {
          p.y = 0;
          p.crashVy = -p.crashVy * 0.38; // Rubber/metal bounce
          p.crashVx *= 0.85; // Ground friction bite
          if (this.renderer && Math.abs(p.crashVx) > 2.0) {
            this.renderer.emitSparkParticle(p.x, 0.1);
          }
        } else if (p.gravityDir === -1 && p.y >= ceilY - 1.0) {
          p.y = ceilY - 1.0;
          p.crashVy = -p.crashVy * 0.38;
          p.crashVx *= 0.85;
          if (this.renderer && Math.abs(p.crashVx) > 2.0) {
            this.renderer.emitSparkParticle(p.x, ceilY - 0.9);
          }
        }

        p.rotationZ -= (p.crashRotV || 10.0) * dt;
        p.crashRotV = (p.crashRotV || 10.0) * Math.pow(0.35, dt);

        // Keep active player vx synchronized
        p.vx = p.crashVx;

        if (this.respawnTimer <= 0) {
          this.resetPlayer(false);
        }
      }
      return;
    }

    if (this.player.invulnerableTimer && this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer -= dt;
    }

    // ── Update Unstable Blocks Shaking Timers ──
    if (this.level && this.level.obstacles) {
      for (let i = 0; i < this.level.obstacles.length; i++) {
        const obs = this.level.obstacles[i];
        if (obs.unstable && obs._shaking && !obs._fallen) {
          obs._shakeTimer -= dt;
          if (obs._shakeTimer <= 0) {
            obs._fallen = true;
            obs._shaking = false;
            if (this.renderer) {
              this.renderer.dropUnstableBlock(obs);
            }
          }
        }
      }
    }

    // Substep integration for high-speed accuracy
    const substeps = 3;
    const subDt = dt / substeps;
    for (let step = 0; step < substeps; step++) {
      this.integratePlayerStep(subDt);
      if (!this.player.isAlive) break;
    }

    // 👾 Check Interactive Boss Battle Encounter
    if (this.level.hasBoss && this.bossManager) {
      if (!this.bossManager.active && this.bossManager.state === 'dormant' && this.player.x >= (this.level.bossTriggerX || 780)) {
        this.bossManager.spawnBoss(this.player.x, 5.0);
      }
      if (this.bossManager.active) {
        this.bossManager.update(dt, this.player, this.level.speed);

        // Check boss collision / laser hits
        if (this.player.isAlive && (!this.player.invulnerableTimer || this.player.invulnerableTimer <= 0)) {
          const bossHit = this.bossManager.checkCollision(this.player.x, this.player.y + 0.5);
          if (bossHit) {
            this.onPlayerCrash();
          }
        }
      }
    }

    // ⚡ Check Level Finish: Gothic Sanctuary Climax vs Sci-Fi Inductor Coil Transition
    if (this.player.x >= this.level.endX && this.gameState === 'PLAYING') {
      if (this.level && this.level.themeType === 'gothic') {
        this.startGothicEndingSequence();
      } else {
        this.startInductorCoilTransition();
      }
    }
  }

  integratePlayerStep(dt) {
    const p = this.player;

    // Record pre-step position for robust continuous collision resolution
    p.prevX = p.x;
    p.prevY = p.y;

    // Update timers
    if (p.isGrounded) {
      this.coyoteTimer = 0.09;
    } else {
      this.coyoteTimer -= dt;
    }
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    // 1. Horizontal Motion with Real Physical Momentum & Dynamic Inertia
    const targetVx = (this.level.speed || 11.0) * (this.currentSpeedMult || 1.0);
    if (p.vx === undefined || isNaN(p.vx)) {
      p.vx = targetVx;
    }

    if (p.vx < targetVx) {
      // Crisp forward traction acceleration
      const accelRate = p.isGrounded ? 32.0 : 18.0;
      p.vx = Math.min(targetVx, p.vx + accelRate * dt);
    } else if (p.vx > targetVx) {
      // Surplus momentum preservation! (Air preserves speed much longer than ground)
      const dragRate = p.isGrounded ? 4.5 : 2.2;
      p.vx = Math.max(targetVx, p.vx - (p.vx - targetVx) * dragRate * dt);
    }

    p.x += p.vx * dt;

    // 2. Check auto-trigger orbs while holding
    if (p.isHolding) {
      this.checkOrbTrigger();
    }

    // 2b. 🌪️ Check Active Aero Fan Updraft Columns
    let inAeroFan = false;
    for (let i = 0; i < this.level.obstacles.length; i++) {
      const obs = this.level.obstacles[i];
      if (obs.type === 'fan' || obs.type === 'aero_fan') {
        const fanW = obs.w || 3.2;
        const fanH = obs.height || 7.5;
        if (p.x >= obs.x - 0.25 && p.x <= obs.x + fanW + 0.25 && p.y >= obs.y - 0.35 && p.y <= obs.y + fanH) {
          inAeroFan = true;
          const liftForce = obs.liftForce || 105.0;
          const maxVy = obs.maxLiftVy || 17.5;
          const relY = Math.max(0, p.y - obs.y);
          const taperStart = fanH * 0.62;
          let taper = 1.0;
          if (relY > taperStart) {
            const t = Math.min(1.0, (relY - taperStart) / (fanH - taperStart));
            taper = Math.max(0, Math.cos(t * Math.PI * 0.5));
          }

          const effectiveLift = liftForce * taper * p.gravityDir;
          p.vy += effectiveLift * dt;
          if (p.gravityDir === 1) {
            p.vy = Math.min(maxVy, p.vy);
          } else {
            p.vy = Math.max(-maxVy, p.vy);
          }
          p.isGrounded = false;
          audio.playAeroFanLift(0.45);

          // Tailwind forward momentum assist!
          p.vx = Math.min(targetVx * 1.35, p.vx + 16.0 * dt);

          // Interactive Aero Boost on Jump press inside wind column
          if (this.jumpBufferTimer > 0) {
            this.jumpBufferTimer = 0;
            p.vy = (maxVy + 2.5) * p.gravityDir;
            // Massive forward momentum boost!
            p.vx = Math.max(p.vx + 4.2, targetVx * 1.25);
            audio.playAeroBoost();
            if (this.renderer) {
              const boostColor = (obs.subType === 'magma' ? 0xff4500 : (obs.subType === 'emerald' ? 0x00ff88 : 0x00f0ff));
              this.renderer.triggerShockwave(p.x, p.y + 0.5, boostColor, 3.4);
              this.renderer.triggerJumpSquash();
            }
          }
          break;
        }
      }
    }

    // 3. Vertical Motion per Vehicle Mode
    if (p.vehicleMode === 'cube') {
      const gravity = -48.0 * p.gravityDir;
      p.vy += gravity * dt;
      p.y += p.vy * dt;

      // Auto-Jump (Buffered Jump or Hold-to-Jump)
      if (!inAeroFan && (p.isGrounded || this.coyoteTimer > 0) && (this.jumpBufferTimer > 0 || p.isHolding)) {
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        p.vy = 16.5 * p.gravityDir;
        p.isGrounded = false;
        audio.playMechanicalJump();
        this.renderer.triggerJumpSquash();
      }

      if (!p.isGrounded) {
        if (inAeroFan) {
          p.rotationZ = Math.sin(p.x * 3.5) * 0.15 * p.gravityDir;
        } else {
          p.rotationZ -= 8.5 * dt * p.gravityDir;
        }
      } else {
        const halfPi = Math.PI / 2;
        p.rotationZ = Math.round(p.rotationZ / halfPi) * halfPi;
      }
    }
    else if (p.vehicleMode === 'ship') {
      const thrustForce = 44.0 * p.gravityDir;
      const shipGravity = -28.0 * p.gravityDir;

      if (p.isHolding) {
        p.vy += thrustForce * dt;
        audio.updateShipThrust(1.0);
      } else {
        p.vy += shipGravity * dt;
        audio.updateShipThrust(0.0);
      }

      p.vy = Math.max(-12, Math.min(12, p.vy));
      p.y += p.vy * dt;

      // Dynamic flight pitch tilt
      p.rotationZ = (p.vy / 12.0) * 0.45 * p.gravityDir;
    }
    else if (p.vehicleMode === 'wave') {
      const waveVy = (p.isHolding ? 1 : -1) * this.level.speed * p.gravityDir;
      p.vy = waveVy;
      p.y += p.vy * dt;
    }
    else if (p.vehicleMode === 'ufo') {
      const ufoGravity = -32.0 * p.gravityDir;
      p.vy += ufoGravity * dt;
      p.vy = Math.max(-13, Math.min(13, p.vy));
      p.y += p.vy * dt;
      p.rotationZ = (p.vy / 13.0) * 0.35 * p.gravityDir;
    }

    // 4. World Boundary Collisions
    const ceilY = (this.level && this.level.ceilY) ? this.level.ceilY : (this.level.id === 2 ? 9.0 : 22.0);
    const floorY = 0.0;

    if (p.gravityDir === 1) {
      if (p.y <= floorY) {
        if (!p.isGrounded && p.vehicleMode === 'cube') {
          audio.playMechanicalLanding();
          this.renderer.triggerLandingSquash();
        }
        p.y = floorY;
        p.vy = (p.vehicleMode === 'ufo' ? Math.max(0, p.vy) : 0);
        p.isGrounded = true;
      } else {
        p.isGrounded = false;
      }

      if (p.y >= ceilY - 1.0) {
        if (p.vehicleMode === 'wave') {
          this.onPlayerCrash();
          return;
        } else {
          p.y = ceilY - 1.0;
          p.vy = Math.min(0, p.vy);
        }
      }
    } else {
      // Inverted gravity
      if (p.y >= ceilY - 1.0) {
        if (!p.isGrounded && p.vehicleMode === 'cube') {
          audio.playMechanicalLanding();
          this.renderer.triggerLandingSquash();
        }
        p.y = ceilY - 1.0;
        p.vy = (p.vehicleMode === 'ufo' ? Math.min(0, p.vy) : 0);
        p.isGrounded = true;
      } else {
        p.isGrounded = false;
      }

      if (p.y <= floorY) {
        if (p.vehicleMode === 'wave') {
          this.onPlayerCrash();
          return;
        } else {
          p.y = floorY;
          p.vy = Math.max(0, p.vy);
        }
      }
    }

    // Dynamic Safe Ground Auto-Checkpoint (every ~40 units on flat safe floor)
    if (!this.practiceMode && p.isGrounded && p.y <= 0.05 && p.vehicleMode === 'cube' && p.isAlive) {
      const lastCpX = this.lastCheckpoint ? this.lastCheckpoint.x : 0;
      if (p.x - lastCpX >= 42.0) {
        const hasDangerAhead = this.level.obstacles.some(o => 
          (o.type === 'spike' || o.type === 'lava' || o.type === 'lava_pit') && 
          o.x >= p.x && o.x <= p.x + 6.0
        );
        if (!hasDangerAhead) {
          this.lastCheckpoint = this.createCheckpointSnapshot(p.x, p.y);
        }
      }
    }

    // 5. Obstacle Collisions
    this.checkObstacleCollisions();
  }

  checkObstacleCollisions() {
    const p = this.player;
    const px = p.x;
    const py = p.y + 0.5;

    for (let i = 0; i < this.level.obstacles.length; i++) {
      const obs = this.level.obstacles[i];

      if (Math.abs(px - obs.x) > 6.0) continue;

      if (obs.type === 'checkpoint') {
        if (!obs._passed && px >= obs.x - 0.5 && px <= obs.x + 2.0) {
          obs._passed = true;
          this.lastCheckpoint = this.createCheckpointSnapshot(obs.x, obs.y || p.y);
          if (this.renderer && this.renderer.triggerCheckpointEffect) {
            this.renderer.triggerCheckpointEffect(obs.x, obs.y || p.y);
          }
          audio.playCheckpoint();
          this.showCheckpointToast(obs.title || "CHECKPOINT REACHED");
        }
        continue;
      }
      else if (obs.type === 'spike') {
        const halfW = 0.28; // Fair hitbox (GD standard forgiving inner hitbox)
        const dx = Math.abs(px - obs.x);
        if (dx < halfW) {
          const slopeRatio = (1.0 - dx / halfW);
          if (obs.dir === 'down') {
            // Hanging spike pointing DOWN: base at obs.y, tip at obs.y - 0.85
            const deadlyY = obs.y - slopeRatio * 0.72;
            const playerTop = p.y + 0.88;
            const playerBottom = p.y + 0.12;
            // Player MUST be vertically within the spike's actual span!
            if (playerTop > deadlyY && playerBottom < obs.y - 0.10) {
              if (p.invulnerableTimer && p.invulnerableTimer > 0) {
                // Invulnerability grace
              } else {
                this.onPlayerCrash();
                return;
              }
            } else if (!obs.nearMiss && playerTop <= deadlyY && playerTop >= deadlyY - 0.25) {
              obs.nearMiss = true;
              this.onNearMissSpike(obs.x, obs.y);
            }
          } else {
            // Floor spike pointing UP: base at obs.y, tip at obs.y + 0.85
            const deadlyY = obs.y + slopeRatio * 0.72;
            const playerTop = p.y + 0.88;
            const playerBottom = p.y + 0.12;
            // Player MUST be vertically within the spike's actual span!
            if (playerBottom < deadlyY && playerTop > obs.y + 0.10) {
              if (p.invulnerableTimer && p.invulnerableTimer > 0) {
                // Invulnerability grace
              } else {
                this.onPlayerCrash();
                return;
              }
            } else if (!obs.nearMiss && playerBottom >= deadlyY && playerBottom <= deadlyY + 0.25) {
              obs.nearMiss = true;
              this.onNearMissSpike(obs.x, obs.y);
            }
          }
        }
      }
      else if (obs.type === 'block') {
        if (obs._fallen) continue;
        const bx = obs.x;
        const by = obs.y;
        const bw = obs.w || 2;
        const bh = obs.h || 2;

        const left = bx;
        const right = bx + bw;
        const bottom = by;
        const top = by + bh;

        const playerHalfW = 0.36;
        const playerLeft = px - playerHalfW;
        const playerRight = px + playerHalfW;
        const playerBottom = p.y;
        const playerTop = p.y + 1.0;

        if (playerRight > left + 0.04 && playerLeft < right - 0.04 && playerTop > bottom + 0.04 && playerBottom < top - 0.02) {
          if (p.invulnerableTimer && p.invulnerableTimer > 0) {
            p.y = (p.gravityDir === 1 ? top : bottom - 1.0);
            p.vy = 0;
            p.isGrounded = true;
            continue;
          }

          if (p.vehicleMode === 'cube') {
            if (p.gravityDir === 1) {
              // 1. Top Landing Priority (always land on top if coming from above or near top edge)
              const isComingFromAbove = (p.prevY >= top - 0.28) || (p.y >= top - 0.45);
              if (isComingFromAbove) {
                if (!p.isGrounded) {
                  audio.playMechanicalLanding();
                  this.renderer.triggerLandingSquash();
                }
                p.y = top;
                p.vy = 0;
                p.isGrounded = true;
                if (obs.unstable && !obs._shaking && !obs._fallen) {
                  obs._shaking = true;
                  obs._shakeTimer = 0.38;
                  if (this.renderer) {
                    this.renderer.shakeUnstableBlock(obs, 0.38);
                  }
                }
                continue;
              }

              // 2. Head bump under floating block (bounce downwards, never crash)
              const isHittingUnderside = (p.prevY + 1.0 <= bottom + 0.28) || (p.y + 1.0 <= bottom + 0.35);
              if (isHittingUnderside && p.vy > 0) {
                p.y = bottom - 1.0;
                p.vy = Math.min(0, p.vy);
                continue;
              }

              // 3. Seam between consecutive contiguous blocks or stairs
              const isInternalSeam = this.level.obstacles.some(o => {
                if (o === obs || o._fallen) return false;
                if (o.type === 'block') {
                  return Math.abs((o.x + (o.w || 2)) - left) < 0.25 && 
                         o.y <= bottom + 0.25 && (o.y + (o.h || 2)) >= top - 0.25;
                }
                if (o.type === 'stairs') {
                  const sSteps = o.steps || 4;
                  const sStepW = o.stepW || 1.2;
                  const sStepH = o.stepH || 0.5;
                  const stairEnd = o.x + sSteps * sStepW;
                  const stairTop = (o.dir === 'down') ? (o.y + sStepH) : (o.y + sSteps * sStepH);
                  // Ascending stairs leading into block left wall
                  if (Math.abs(stairEnd - left) < 0.35 && Math.abs(stairTop - top) < 0.40) {
                    return true;
                  }
                }
                return false;
              });
              if (isInternalSeam) {
                if (p.gravityDir === 1 && p.y >= top - 0.60) {
                  p.y = top;
                  p.vy = 0;
                  p.isGrounded = true;
                }
                continue;
              }

              // 4. Genuine front crash into wall
              if (p.prevX + playerHalfW <= left + 0.25) {
                this.onPlayerCrash();
                return;
              } else {
                p.y = top;
                p.vy = 0;
                p.isGrounded = true;
              }
            } else {
              // Inverted gravity
              const isComingFromBelow = (p.prevY + 1.0 <= bottom + 0.28) || (p.y + 1.0 <= bottom + 0.45);
              if (isComingFromBelow) {
                if (!p.isGrounded) {
                  audio.playMechanicalLanding();
                  this.renderer.triggerLandingSquash();
                }
                p.y = bottom - 1.0;
                p.vy = 0;
                p.isGrounded = true;
                continue;
              }

              const isHittingTop = (p.prevY >= top - 0.28) || (p.y >= top - 0.35);
              if (isHittingTop && p.vy < 0) {
                p.y = top;
                p.vy = Math.max(0, p.vy);
                continue;
              }

              const isInternalSeam = this.level.obstacles.some(o => {
                if (o === obs || o._fallen) return false;
                if (o.type === 'block') {
                  return Math.abs((o.x + (o.w || 2)) - left) < 0.25 && 
                         o.y <= bottom + 0.25 && (o.y + (o.h || 2)) >= top - 0.25;
                }
                if (o.type === 'stairs') {
                  const sSteps = o.steps || 4;
                  const sStepW = o.stepW || 1.2;
                  const sStepH = o.stepH || 0.5;
                  const stairEnd = o.x + sSteps * sStepW;
                  const stairTop = (o.dir === 'down') ? (o.y - sStepH) : (o.y - sSteps * sStepH);
                  if (Math.abs(stairEnd - left) < 0.35 && Math.abs(stairTop - bottom) < 0.40) {
                    return true;
                  }
                }
                return false;
              });
              if (isInternalSeam) {
                if (p.gravityDir === -1 && p.y + 1.0 <= bottom + 0.60) {
                  p.y = bottom - 1.0;
                  p.vy = 0;
                  p.isGrounded = true;
                }
                continue;
              }

              if (p.prevX + playerHalfW <= left + 0.25) {
                this.onPlayerCrash();
                return;
              } else {
                p.y = bottom - 1.0;
                p.vy = 0;
                p.isGrounded = true;
              }
            }
          } else if (p.vehicleMode === 'ship' || p.vehicleMode === 'ufo') {
            if (p.gravityDir === 1 && (p.prevY >= top - 0.32 || playerBottom >= top - 0.45)) {
              p.y = top;
              p.vy = Math.max(0, p.vy);
              p.isGrounded = true;
              if (obs.unstable && !obs._shaking && !obs._fallen) {
                obs._shaking = true;
                obs._shakeTimer = 0.38;
                if (this.renderer) {
                  this.renderer.shakeUnstableBlock(obs, 0.38);
                }
              }
            } else if (p.gravityDir === -1 && (p.prevY + 1.0 <= bottom + 0.32 || playerTop <= bottom + 0.45)) {
              p.y = bottom - 1.0;
              p.vy = Math.min(0, p.vy);
              p.isGrounded = true;
            } else {
              if (p.prevX + playerHalfW <= left + 0.22) {
                this.onPlayerCrash();
                return;
              } else {
                p.y = p.gravityDir === 1 ? top : bottom - 1.0;
                p.vy = 0;
                p.isGrounded = true;
              }
            }
          } else {
            // Wave mode
            this.onPlayerCrash();
            return;
          }
        }
      }
      else if (obs.type === 'stairs') {
        const numSteps = obs.steps || 4;
        const stepW = obs.stepW || 1.2;
        const stepH = obs.stepH || 0.5;
        const dir = obs.dir || 'up';
        const totalW = numSteps * stepW;
        const sx = obs.x;
        const sy = obs.y;

        // Effective stairs horizontal footprint with step-up tolerance
        if (px >= sx - 0.35 && px <= sx + totalW + 0.35) {
          const relX = Math.max(0, Math.min(totalW - 0.001, px - sx));
          const stepIdx = Math.floor(relX / stepW);
          const stepTop = (dir === 'down')
            ? sy + (numSteps - stepIdx) * stepH
            : sy + (stepIdx + 1) * stepH;
          const prevStepTop = (dir === 'down')
            ? sy + (numSteps - Math.max(0, stepIdx - 1)) * stepH
            : sy + stepIdx * stepH;

          if (p.gravityDir === 1) {
            // Player lands or steps onto the tread:
            // 1. Falling from above onto the tread
            // 2. Climbing step-to-step smoothly
            // 3. Approaching step 0 from floor level
            const maxStepClimb = stepH + 0.30;
            const canLand = (p.prevY >= stepTop - 0.25) || 
                            (p.y >= stepTop - maxStepClimb) || 
                            (p.y >= sy - 0.15 && p.y <= stepTop + 0.55);

            if (canLand) {
              if (!p.isGrounded) {
                audio.playMechanicalLanding();
                this.renderer.triggerLandingSquash();
              } else if (Math.abs(p.y - stepTop) > 0.08) {
                audio.playStairStep(1.0 + stepIdx * 0.08);
              }
              p.y = stepTop;
              p.vy = 0;
              p.isGrounded = true;

              if (dir === 'down') {
                const targetVx = (this.level.speed || 11.0) * (this.currentSpeedMult || 1.0);
                p.vx = Math.min(targetVx * 1.22, p.vx + 7.5 * 0.016);
              }
            } else if (p.vehicleMode === 'wave') {
              this.onPlayerCrash();
              return;
            }
          } else {
            // Inverted gravity stair climbing
            const invTop = (dir === 'down')
              ? sy - (numSteps - stepIdx) * stepH
              : sy - (stepIdx + 1) * stepH;
            if (p.y <= invTop + 0.60) {
              p.y = invTop - 1.0;
              p.vy = 0;
              p.isGrounded = true;
            }
          }
        }
      }
      else if (obs.type === 'lava_crust') {
        // 🌋 Floating Volcanic Basalt Stepping Platform (Safe on top!)
        const cw = obs.w || 3.0;
        const ch = obs.h || 1.2;
        const left = obs.x;
        const right = obs.x + cw;
        const top = obs.y + ch;
        const playerHalfW = 0.34;
        const playerLeft = px - playerHalfW;
        const playerRight = px + playerHalfW;
        const playerBottom = p.y;
        const playerTop = p.y + 1.0;

        if (playerRight > left + 0.04 && playerLeft < right - 0.04 && playerTop > obs.y + 0.04 && playerBottom <= top + 0.15) {
          const isComingFromAbove = (p.prevY >= top - 0.30) || (p.y >= top - 0.50);
          if (isComingFromAbove || (p.invulnerableTimer && p.invulnerableTimer > 0)) {
            if (!p.isGrounded) {
              audio.playMechanicalLanding();
              this.renderer.triggerLandingSquash();
            }
            p.y = top;
            p.vy = 0;
            p.isGrounded = true;
          } else if (p.prevX + playerHalfW <= left + 0.22) {
            this.onPlayerCrash('lava');
            return;
          } else {
            p.y = top;
            p.vy = 0;
            p.isGrounded = true;
          }
        }
      }
      else if (obs.type === 'lava' || obs.type === 'lava_pit') {
        const lavaW = obs.w || 8.0;
        const lavaH = obs.h || 0.8;
        const lavaLeft = obs.x;
        const lavaRight = obs.x + lavaW;
        const lavaSurface = obs.y + lavaH;

        const playerHalfW = 0.32;
        const pLeft = px - playerHalfW;
        const pRight = px + playerHalfW;

        if (pRight > lavaLeft + 0.10 && pLeft < lavaRight - 0.10) {
          // Check if player is safely supported by a solid crust or block above the lava
          const isSupportedBySolid = this.level.obstacles.some(solid => {
            if (solid.type !== 'lava_crust' && solid.type !== 'block') return false;
            const sw = solid.w || (solid.type === 'lava_crust' ? 3.0 : 2.0);
            const sh = solid.h || (solid.type === 'lava_crust' ? 1.2 : 2.0);
            const sLeft = solid.x;
            const sRight = solid.x + sw;
            const sTop = solid.y + sh;
            if (pRight > sLeft + 0.04 && pLeft < sRight - 0.04) {
              if (p.y >= sTop - 0.35 || p.prevY >= sTop - 0.35) {
                return true;
              }
            }
            return false;
          });

          if (isSupportedBySolid) {
            continue;
          }

          if (p.y <= lavaSurface - 0.06) {
            if (!p.invulnerableTimer || p.invulnerableTimer <= 0) {
              this.onPlayerCrash('lava');
              return;
            }
          } else if (!obs.nearMiss && p.y <= lavaSurface + 0.32) {
            obs.nearMiss = true;
            audio.playLavaSizzle();
            if (this.renderer) {
              this.renderer.triggerScreenFlash(0.12);
              this.renderer.emitSparkParticle(px, lavaSurface + 0.2);
            }
          }
        }
      }
      else if (obs.type === 'lava_bubble') {
        const bw = obs.w || 2.2;
        const bh = obs.h || 1.4;
        if (px >= obs.x - 0.28 && px <= obs.x + bw + 0.28) {
          if (p.y >= obs.y - 0.2 && p.y <= obs.y + bh + 0.35) {
            if (!p.invulnerableTimer || p.invulnerableTimer <= 0) {
              this.onPlayerCrash('lava');
              return;
            }
          }
        }
      }
      else if (obs.type === 'lava_crystal') {
        const halfW = 0.36;
        const dx = Math.abs(px - obs.x);
        if (dx < halfW) {
          const slopeRatio = (1.0 - dx / halfW);
          if (obs.dir === 'down') {
            const deadlyY = obs.y - slopeRatio * 0.80;
            const playerTop = p.y + 0.90;
            const playerBottom = p.y + 0.05;
            if (playerTop > deadlyY && playerBottom < obs.y) {
              if (!p.invulnerableTimer || p.invulnerableTimer <= 0) {
                this.onPlayerCrash('lava');
                return;
              }
            }
          } else {
            const deadlyY = obs.y + slopeRatio * 0.80;
            const playerTop = p.y + 0.95;
            const playerBottom = p.y + 0.05;
            if (playerBottom < deadlyY && playerTop > obs.y + 0.05) {
              if (!p.invulnerableTimer || p.invulnerableTimer <= 0) {
                this.onPlayerCrash('lava');
                return;
              }
            }
          }
        }
      }
      else if (obs.type === 'gem') {
        // 💎 Sparkling Gem Collection
        if (!this.gemsCollected.has(i)) {
          const dx = px - obs.x;
          const dy = (p.y + 0.5) - obs.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1.35) {
            this.gemsCollected.add(i);
            audio.playGemCollect();
            this.renderer.triggerGemCollect(i, obs.x, obs.y, obs.color || 0x00ffff);
            this.updateGemHUD();
          }
        }
      }
      else if (obs.type === 'pad') {
        const padX = obs.x;
        const padY = obs.y;
        if (Math.abs(px - padX) < 0.9) {
          const isAtPadY = (p.gravityDir === 1 && Math.abs(p.y - padY) < 0.45) ||
                           (p.gravityDir === -1 && Math.abs((p.y + 1.0) - padY) < 0.45);

          if (isAtPadY) {
            const padMesh = this.renderer.padMeshes.find(m => m.userData.obstacle === obs);
            if (padMesh && padMesh.userData.triggerBounce) {
              padMesh.userData.triggerBounce();
            }

            this.renderer.triggerJumpSquash();
            if (this.renderer.sceneryManager) {
              this.renderer.sceneryManager.triggerObstacleFlash(obs.subType === 'pink' ? 0xff007f : (obs.subType === 'blue' ? 0x00f0ff : 0xffd000), 0.75);
            }

            const targetVx = (this.level.speed || 11.0) * (this.currentSpeedMult || 1.0);
            if (obs.subType === 'yellow') {
              p.vy = 24.0 * p.gravityDir;
              p.vx = Math.max(p.vx + 3.2, targetVx * 1.18); // Forward launch momentum kick!
              p.isGrounded = false;
              audio.playPadLaunch();
            } else if (obs.subType === 'pink') {
              p.vy = 15.0 * p.gravityDir;
              p.vx = Math.max(p.vx + 2.0, targetVx * 1.10);
              p.isGrounded = false;
              audio.playPadLaunch();
            } else if (obs.subType === 'blue') {
              // Proper gravity flip launch with momentum surge!
              p.vx = Math.max(p.vx + 2.6, targetVx * 1.14);
              if (p.gravityDir === 1) {
                p.gravityDir = -1;
                p.vy = 22.0; // Launches UP to ceiling
                audio.playGravityFlip(true);
              } else {
                p.gravityDir = 1;
                p.vy = -22.0; // Launches DOWN to floor
                audio.playGravityFlip(false);
              }
              p.isGrounded = false;
              audio.playVineBoom();
            }
          }
        }
      }
      else if (obs.type === 'portal') {
        if (Math.abs(px - obs.x) < 1.0 && Math.abs(py - obs.y) < 2.5) {
          if (this.renderer.sceneryManager) {
            this.renderer.sceneryManager.triggerObstacleFlash(0x00ff88, 0.9);
          }
          if (obs.subType === 'ship' && p.vehicleMode !== 'ship') {
            p.vehicleMode = 'ship';
            audio.playPadLaunch();
          } else if (obs.subType === 'wave' && p.vehicleMode !== 'wave') {
            p.vehicleMode = 'wave';
            audio.playPadLaunch();
          } else if (obs.subType === 'cube' && p.vehicleMode !== 'cube') {
            p.vehicleMode = 'cube';
            audio.updateShipThrust(0);
            audio.playPadLaunch();
          } else if (obs.subType === 'ufo' && p.vehicleMode !== 'ufo') {
            p.vehicleMode = 'ufo';
            audio.updateShipThrust(0);
            audio.playPadLaunch();
            this.renderer.triggerShockwave(obs.x, obs.y, 0xffa500, 2.8);
          } else if (obs.subType === 'gravity_up' && p.gravityDir !== -1) {
            p.gravityDir = -1;
            audio.playGravityFlip(true);
            audio.playVineBoom();
          } else if (obs.subType === 'gravity_down' && p.gravityDir !== 1) {
            p.gravityDir = 1;
            audio.playGravityFlip(false);
            audio.playVineBoom();
          }
        }
      }
      else if (obs.type === 'speed_gate') {
        if (Math.abs(px - obs.x) < 1.0 && Math.abs(py - (obs.y + 2.5)) < 3.2) {
          if (this.currentSpeedMult !== obs.speedMult) {
            this.currentSpeedMult = obs.speedMult;
            this.level.speed = (this.level.baseSpeed || 11.0) * obs.speedMult;
            p.vx = Math.max(p.vx, this.level.speed * 1.15); // Dynamic momentum surge!
            audio.playSpeedGate(obs.speedMult);
            if (this.renderer) {
              if (this.renderer.triggerShockwave) {
                this.renderer.triggerShockwave(obs.x, py, 0x00ffff, 3.8);
              }
              if (this.renderer.triggerScreenFlash) {
                this.renderer.triggerScreenFlash(0.2);
              }
              if (this.renderer.triggerComicHitText) {
                this.renderer.triggerComicHitText(obs.x, py + 1.2, `WARP ${obs.speedMult}X! ⚡`, "#00FFFF");
              }
              this.renderer.faceExpression = (obs.speedMult > 1.0 ? 'hyperspeed' : 'normal');
            }
            this.addStylePoints(500, `WARP ${obs.speedMult}X! ⚡`);
          }
        }
      }
      else if (obs.type === 'shield') {
        if (!obs.collected && Math.abs(px - obs.x) < 1.4 && Math.abs(py - obs.y) < 1.4) {
          obs.collected = true;
          p.hasShield = true;
          const shieldMesh = this.renderer?.shieldPickupMeshes?.find(m => m.userData.obstacle === obs);
          if (shieldMesh) {
            shieldMesh.userData.isCollected = true;
            shieldMesh.visible = false;
          }
          audio.playShieldCollect();
          if (this.renderer) {
            if (this.renderer.triggerShockwave) {
              this.renderer.triggerShockwave(obs.x, obs.y, 0x00f0ff, 3.4);
            }
            if (this.renderer.triggerComicHitText) {
              this.renderer.triggerComicHitText(obs.x, obs.y + 1.2, "SHIELD CHARGED! 🛡️", "#00F0FF");
            }
            this.renderer.faceExpression = 'shield_active';
          }
          this.addStylePoints(400, "SHIELD UP! 🛡️");
          const shieldInd = document.getElementById('player-shield-indicator');
          if (shieldInd) shieldInd.style.display = 'block';
        }
      }
    }
  }

  // -------------------------------------------------------------
  // AI GHOST RACER SIMULATION
  // -------------------------------------------------------------

  updateGhosts(dt) {
    this.ghostStates.forEach(g => {
      // If this is a connected human player, their position and rotation are driven by WebRTC
      if (!g.isBot) {
        return;
      }

      if (!g.isAlive) {
        g.respawnTimer -= dt;
        if (g.respawnTimer <= 0) {
          g.x = Math.max(0, this.player.x - 15);
          g.y = 0;
          g.vy = 0;
          g.isAlive = true;
          g.gravityDir = 1;
        }
        this.renderer.updateGhost(g.id, g.x, g.y, g.rotationZ, false);
        return;
      }

      g.x += (this.level.speed * (1.0 + g.offset * 0.05)) * dt;
      g.jumpCooldown -= dt;

      // Lookahead obstacle detection (spikes, lava pits, magma bubbles, crystals)
      const lookahead = 2.4;
      const upcomingHazard = this.level.obstacles.find(obs =>
        (obs.type === 'spike' || obs.type === 'lava' || obs.type === 'lava_bubble' || obs.type === 'lava_crystal') &&
        (obs.x > g.x && obs.x < g.x + lookahead) && Math.abs((obs.y || 0) - g.y) < 1.4
      );

      if (upcomingHazard && g.jumpCooldown <= 0 && g.isGrounded) {
        if (Math.random() < g.skill) {
          g.vy = 16.5 * g.gravityDir;
          g.isGrounded = false;
          g.jumpCooldown = 0.55;
        } else {
          g.isAlive = false;
          g.respawnTimer = 2.0;
        }
      }

      // 🌪️ Fan Updraft Lift for Ghost
      const currentFan = this.level.obstacles.find(obs =>
        (obs.type === 'fan' || obs.type === 'aero_fan') && (g.x >= obs.x - 0.2 && g.x <= obs.x + (obs.w || 3.2) + 0.2)
      );
      if (currentFan) {
        g.vy = Math.min(16.0, g.vy + (currentFan.liftForce || 105.0) * dt);
        g.isGrounded = false;
      }

      // Gravity
      g.vy -= 48.0 * dt * g.gravityDir;
      g.y += g.vy * dt;

      // 🪜 Check Stairs for Ghost
      let onGhostStair = false;
      const currentStair = this.level.obstacles.find(obs =>
        obs.type === 'stairs' && (g.x >= obs.x - 0.2 && g.x <= obs.x + (obs.steps || 4) * (obs.stepW || 1.2) + 0.2)
      );
      if (currentStair) {
        const numSteps = currentStair.steps || 4;
        const stepW = currentStair.stepW || 1.2;
        const stepH = currentStair.stepH || 0.5;
        const relX = Math.max(0, Math.min(numSteps * stepW - 0.001, g.x - currentStair.x));
        const stepIdx = Math.floor(relX / stepW);
        const stepTop = currentStair.dir === 'down'
          ? currentStair.y + (numSteps - stepIdx) * stepH
          : currentStair.y + (stepIdx + 1) * stepH;
        if (g.y <= stepTop + 0.25) {
          g.y = stepTop;
          g.vy = 0;
          g.isGrounded = true;
          onGhostStair = true;
        }
      }

      if (!onGhostStair) {
        if (g.y <= 0) {
          g.y = 0;
          g.vy = 0;
          g.isGrounded = true;
          const halfPi = Math.PI / 2;
          g.rotationZ = Math.round(g.rotationZ / halfPi) * halfPi;
        } else {
          g.isGrounded = false;
          g.rotationZ -= 8.5 * dt * g.gravityDir;
        }
      }

      this.renderer.updateGhost(g.id, g.x, g.y + 0.45, g.rotationZ, g.isAlive);
    });
  }

  // -------------------------------------------------------------
  // 🏆 DYNAMIC "ULTRAKILL / DEVIL MAY CRY" RHYTHM STYLE ENGINE
  // -------------------------------------------------------------

  addStylePoints(basePoints, label = '') {
    if (!this.player.isAlive || this.gameState !== 'PLAYING') return;
    if (!this.styleSystem) return;

    this.styleSystem.combo++;
    this.styleSystem.multiplier = Math.min(4.0, 1.0 + (this.styleSystem.combo - 1) * 0.12);
    const addedScore = Math.round(basePoints * this.styleSystem.multiplier);
    this.styleSystem.score += addedScore;
    this.styleSystem.decayTimer = 2.8;

    let currentIdx = 0;
    for (let i = this.styleSystem.ranks.length - 1; i >= 0; i--) {
      if (this.styleSystem.score >= this.styleSystem.ranks[i].minScore) {
        currentIdx = i;
        break;
      }
    }

    const prevIdx = this.styleSystem.rankIdx;
    this.styleSystem.rankIdx = currentIdx;
    const currentRank = this.styleSystem.ranks[currentIdx];

    if (currentIdx > prevIdx) {
      // Rank Up Fanfare!
      if (this.renderer && this.renderer.triggerComicHitText) {
        this.renderer.triggerComicHitText(
          this.player.x + 1.2,
          this.player.y + 1.6,
          `RANK ${currentRank.letter}! ${currentRank.label}`,
          currentRank.color
        );
      }
      if (this.renderer && this.renderer.triggerShockwave) {
        this.renderer.triggerShockwave(this.player.x, this.player.y + 0.5, parseInt(currentRank.color.replace('#', '0x')), 3.8);
      }
      audio.playOrbChime();
    }

    this.updateStyleHUD(label, addedScore);
  }

  updateStyleHUD(label = '', lastAdded = 0) {
    if (!this.styleSystem) return;
    const rank = this.styleSystem.ranks[this.styleSystem.rankIdx];
    const letterEl = document.getElementById('style-rank-letter');
    const labelEl = document.getElementById('style-rank-label');
    const comboEl = document.getElementById('style-combo-val');
    const scoreEl = document.getElementById('style-score-val');
    const multEl = document.getElementById('style-mult-val');
    const fillEl = document.getElementById('style-bar-fill');

    if (letterEl) {
      letterEl.textContent = rank.letter;
      letterEl.style.color = rank.color;
      letterEl.style.textShadow = `0 0 16px ${rank.color}`;
      letterEl.classList.remove('rank-pulse');
      void letterEl.offsetWidth;
      letterEl.classList.add('rank-pulse');
    }
    if (labelEl) {
      labelEl.textContent = rank.label;
      labelEl.style.color = rank.color;
    }
    if (comboEl) comboEl.textContent = `${this.styleSystem.combo}x`;
    if (multEl) multEl.textContent = `${this.styleSystem.multiplier.toFixed(1)}x`;
    if (scoreEl) scoreEl.textContent = this.styleSystem.score.toLocaleString();

    if (fillEl) {
      const nextRank = this.styleSystem.ranks[this.styleSystem.rankIdx + 1];
      if (nextRank) {
        const range = nextRank.minScore - rank.minScore;
        const progress = Math.min(1.0, (this.styleSystem.score - rank.minScore) / range);
        fillEl.style.width = `${(progress * 100).toFixed(0)}%`;
        fillEl.style.background = rank.color;
      } else {
        fillEl.style.width = '100%';
        fillEl.style.background = '#ff00ff';
      }
    }
  }

  updateStyleDecay(dt) {
    if (!this.styleSystem) return;
    if (this.styleSystem.decayTimer > 0) {
      this.styleSystem.decayTimer -= dt;
    } else if (this.styleSystem.score > 0) {
      this.styleSystem.score = Math.max(0, this.styleSystem.score - Math.round(160 * dt));
      this.styleSystem.combo = Math.max(0, this.styleSystem.combo - Math.round(1 * dt));
      this.styleSystem.multiplier = Math.max(1.0, 1.0 + (this.styleSystem.combo) * 0.1);

      let currentIdx = 0;
      for (let i = this.styleSystem.ranks.length - 1; i >= 0; i--) {
        if (this.styleSystem.score >= this.styleSystem.ranks[i].minScore) {
          currentIdx = i;
          break;
        }
      }
      this.styleSystem.rankIdx = currentIdx;
      this.updateStyleHUD();
    }
  }

  // -------------------------------------------------------------
  // HUD & LEADERBOARD REFRESH
  // -------------------------------------------------------------

  updateHUD() {
    const progress = Math.min(100, Math.max(0, (this.player.x / this.level.endX) * 100));
    this.dom.progressBar.style.width = `${progress}%`;
    this.dom.progressPercent.textContent = `${progress.toFixed(1)}%`;
    this.dom.playerMarker.style.left = `${progress}%`;

    // Update procedural music progression across the 5 acts
    audio.setTrackProgression(progress / 100);

    // Real-Time Speedometer Refresh with Dynamic Momentum
    const speedEl = document.getElementById('speedometer-val');
    if (speedEl) {
      const activeSpeed = (this.gameState === 'CRASHED' ? (this.player.crashVx || 0) : (this.player.vx || this.level.speed));
      const mach = (activeSpeed / 11.0).toFixed(1);
      const isSurging = activeSpeed > ((this.level.speed || 11.0) * (this.currentSpeedMult || 1.0) * 1.04);
      const mode = isSurging ? 'MOMENTUM SURGE ⚡' : (this.currentSpeedMult >= 2.0 ? 'WARP DRIVE' : (this.currentSpeedMult >= 1.5 ? 'HYPER DRIVE' : (this.currentSpeedMult < 1.0 ? 'SLOW-MO' : 'CRUISING')));
      speedEl.innerHTML = `⚡ MACH <span>${mach}</span> • ${mode}`;
    }

    // Best Record
    if (progress > this.bestScores[this.currentLevelIndex]) {
      this.bestScores[this.currentLevelIndex] = Math.floor(progress);
      this.saveBestScores();
      this.dom.bestRecord.innerHTML = `BEST <span>${this.bestScores[this.currentLevelIndex]}%</span>`;
    }

    // 2. Dynamic Live Leaderboard Ranking
    const localName = (this.multiplayer && this.multiplayer.playerName) ? (this.multiplayer.playerName + ' (You)') : 'YOU';
    const localColor = (this.multiplayer && this.multiplayer.playerColor) ? this.multiplayer.playerColor : '#00ff88';

    const racers = [
      { name: localName, progress: progress, isPlayer: true, color: localColor, isAlive: this.player.isAlive },
      ...this.ghostStates.map(g => ({
        name: g.name,
        progress: Math.min(100, Math.max(0, (g.x / this.level.endX) * 100)),
        isPlayer: false,
        color: g.colorHex,
        isAlive: g.isAlive
      }))
    ];

    racers.sort((a, b) => b.progress - a.progress);

    if (this.dom.leaderboardList) {
      this.dom.leaderboardList.innerHTML = racers.map((r, rank) => {
        const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;
        return `
          <div class="leaderboard-row ${r.isPlayer ? 'is-player' : ''} ${!r.isAlive ? 'is-dead' : ''}">
            <span class="rank-pill">${medal}</span>
            <span class="racer-name" style="color:${r.color};">${r.name}</span>
            <span class="racer-pct">${r.isAlive ? Math.floor(r.progress) + '%' : '💥'}</span>
          </div>
        `;
      }).join('');
    }

    // 3. Dynamic Brainrot Milestones (25%, 50%, 75%)
    if (this.chaosMode === 'high' || this.chaosMode === 'normal') {
      [25, 50, 75].forEach(pct => {
        if (progress >= pct && !this.brainrotMilestones.has(pct)) {
          this.brainrotMilestones.add(pct);
          if (pct === 25 && this.chaosMode === 'high') this.triggerBrainrotPop("m25", "25% PASSED", "MEWING STREAK MAINTAINED 🤫🧏");
          else if (pct === 50) this.triggerBrainrotPop("m50", "HALFWAY THERE", "WE LIVE WE LOVE WE LIE 🍄🐱");
          else if (pct === 75 && this.chaosMode === 'high') this.triggerBrainrotPop("m75", "75% CLIMAX", "WHAT THE SIGMA?! ULTRA AURA 🗿");
        }
      });
    }
  }

  updateGemHUD() {
    if (!this.dom.gemCountText) return;
    this.dom.gemCountText.textContent = `${this.gemsCollected.size} / ${this.totalLevelGems}`;
  }

  triggerBrainrotPop(type, customTitle = "", customQuote = "") {
    if (!this.dom.brainrotPopup) return;
    if (this.chaosMode === 'off') return;

    const now = performance.now();
    // Throttle in-game popups to at most once every 12 seconds during gameplay
    if (this.gameState === 'PLAYING' && (now - this.lastBrainrotPopTime < 12000) && !customTitle) {
      return;
    }
    this.lastBrainrotPopTime = now;

    let meme = this.brainrotMemes[Math.floor(Math.random() * this.brainrotMemes.length)];
    if (type === "gem") {
      meme = { avatar: "💎", title: "GEM ACQUIRED", quote: "THE RIZZLER IS PROUD (+500 AURA)" };
    } else if (type === "gravity") {
      meme = { avatar: "🔄", title: "WHAT THE SIGMA", quote: "GRAVITY FLIPPED?! 🤨" };
    } else if (type === "portal") {
      meme = { avatar: "🚀", title: "VEHICLE MORPH", quote: "SKIBIDI JET ENGAGED 🔥" };
    }

    if (customTitle) meme.title = customTitle;
    if (customQuote) meme.quote = customQuote;

    this.dom.brainrotAvatar.textContent = meme.avatar;
    this.dom.brainrotTitle.textContent = meme.title;
    this.dom.brainrotQuote.textContent = meme.quote;

    this.dom.brainrotPopup.style.display = 'block';
    audio.playBrainrotPop();

    if (this.brainrotTimeout) clearTimeout(this.brainrotTimeout);
    this.brainrotTimeout = setTimeout(() => {
      this.dom.brainrotPopup.style.display = 'none';
    }, 1800);
  }

  setPartyMode(mode) {
    this.partyMode = mode;
    if (this.dom.partyModeLabel) {
      this.dom.partyModeLabel.textContent = mode.toUpperCase();
    }

    document.querySelectorAll('.party-mode-btn').forEach(btn => {
      if (btn.getAttribute('data-mode') === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.renderPartyModalMembers();
    this.setupGhosts();
  }

  openPartyModal() {
    if (this.multiplayer) {
      if (this.dom.partyShareUrl) {
        this.dom.partyShareUrl.value = this.multiplayer.getInviteLink();
      }
      if (this.dom.playerNameInput) {
        this.dom.playerNameInput.value = this.multiplayer.playerName;
      }
      document.querySelectorAll('.color-swatch').forEach(btn => {
        if (btn.getAttribute('data-color') === this.multiplayer.playerColor) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
    this.renderPartyModalMembers();
    if (this.dom.partyModal) {
      this.dom.partyModal.style.display = 'flex';
    }
  }

  closePartyModal() {
    if (this.dom.partyModal) {
      this.dom.partyModal.style.display = 'none';
    }
  }

  renderPartyModalMembers() {
    if (!this.dom.partyMembersList) return;
    const players = this.multiplayer ? Array.from(this.multiplayer.players.values()) : this.partyRoster.slice(0, 1);

    if (this.dom.lobbyPlayerCount) {
      this.dom.lobbyPlayerCount.textContent = players.length;
    }

    this.dom.partyMembersList.innerHTML = players.map(m => `
      <div class="party-slot">
        <div class="party-slot-avatar" style="background:${m.colorHex}22; border-color:${m.colorHex}; color:${m.colorHex};">
          ${m.isHost ? '👑' : '🎮'}
        </div>
        <div class="party-slot-name">${m.name}</div>
        <span class="party-slot-status">${m.isHost ? 'HOST' : 'READY'}</span>
      </div>
    `).join('');
  }

  // -------------------------------------------------------------
  // PAUSE MENU & START SCREEN SYSTEMS
  // -------------------------------------------------------------

  setupPauseMenu() {
    if (this.dom.pauseBtn) {
      this.dom.pauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.gameState === 'PAUSED') {
          this.resumeGame();
        } else if (this.gameState === 'PLAYING') {
          this.pauseGame();
        }
      });
    }

    if (this.dom.closePauseModal) {
      this.dom.closePauseModal.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resumeGame();
      });
    }

    if (this.dom.pauseResumeBtn) {
      this.dom.pauseResumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resumeGame();
      });
    }

    if (this.dom.pauseRestartBtn) {
      this.dom.pauseRestartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resumeGame();
        this.resetPlayer(true);
      });
    }

    if (this.dom.pausePracticeBtn) {
      this.dom.pausePracticeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePracticeMode();
        if (this.dom.pausePracticeStatus) {
          this.dom.pausePracticeStatus.textContent = this.practiceMode ? 'ON' : 'OFF';
          this.dom.pausePracticeStatus.style.color = this.practiceMode ? '#00FF88' : '#FF0055';
        }
      });
    }

    if (this.dom.pausePartyBtn) {
      this.dom.pausePartyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openPartyModal();
      });
    }

    if (this.dom.pauseTracksBtn) {
      this.dom.pauseTracksBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openLevelModal();
      });
    }

    if (this.dom.pauseTitleBtn) {
      this.dom.pauseTitleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.returnToMainMenu();
      });
    }
  }

  pauseGame() {
    if (this.gameState !== 'PLAYING') return;
    this.gameState = 'PAUSED';
    audio.pauseMusic();
    if (this.dom.pauseModal) {
      if (this.dom.pauseTrackSub) {
        const pct = Math.min(100, Math.max(0, (this.player.x / this.level.endX) * 100));
        this.dom.pauseTrackSub.textContent = `${this.level.name.toUpperCase()} • ${pct.toFixed(1)}% COMPLETED`;
      }
      if (this.dom.pausePracticeStatus) {
        this.dom.pausePracticeStatus.textContent = this.practiceMode ? 'ON' : 'OFF';
        this.dom.pausePracticeStatus.style.color = this.practiceMode ? '#00FF88' : '#FF0055';
      }
      this.dom.pauseModal.style.display = 'flex';
    }
  }

  resumeGame() {
    if (this.gameState !== 'PAUSED') return;
    if (this.dom.pauseModal) {
      this.dom.pauseModal.style.display = 'none';
    }
    this.gameState = 'PLAYING';
    this.lastTime = performance.now();
    audio.resumeMusic();
  }

  returnToMainMenu() {
    if (this.dom.pauseModal) this.dom.pauseModal.style.display = 'none';
    if (this.dom.partyModal) this.dom.partyModal.style.display = 'none';
    if (this.dom.levelSelectModal) this.dom.levelSelectModal.style.display = 'none';
    if (this.dom.memeChaosModal) this.dom.memeChaosModal.style.display = 'none';
    if (this.dom.victoryModal) this.dom.victoryModal.style.display = 'none';
    if (this.dom.smurfModal) this.dom.smurfModal.style.display = 'none';
    if (this.dom.gothicClimaxOverlay) this.dom.gothicClimaxOverlay.style.display = 'none';

    audio.stopMusic();
    this.resetPlayer(true);
    this.gameState = 'MENU';

    if (this.dom.startScreenOverlay) {
      this.dom.startScreenOverlay.style.display = 'flex';
      if (this.dom.mainMenuView) this.dom.mainMenuView.style.display = 'flex';
      if (this.dom.menuLobbyView) this.dom.menuLobbyView.style.display = 'none';
    }
    if (this.dom.menuTrackTitle) {
      this.dom.menuTrackTitle.textContent = this.level.name;
    }
  }

  startGameSolo() {
    this.partyMode = 'solo';
    this.setupGhosts();
    if (this.dom.startScreenOverlay) {
      this.dom.startScreenOverlay.style.display = 'none';
    }
    if (this.dom.pauseModal) {
      this.dom.pauseModal.style.display = 'none';
    }
    this.gameState = 'PLAYING';
    this.resetPlayer(true);
    this.lastTime = performance.now();
    audio.startMusic(this.level.bpm, this.level.theme);
  }

  setupStartScreen() {
    const urlParams = new URLSearchParams(window.location.search);
    const joinRoom = urlParams.get('room');

    // Gamer Tag input
    if (this.dom.menuPlayerNameInput && this.multiplayer) {
      this.dom.menuPlayerNameInput.value = this.multiplayer.playerName;
      this.dom.menuPlayerNameInput.addEventListener('input', (e) => {
        const val = e.target.value.trim() || 'Player';
        this.multiplayer.setProfile(val, this.multiplayer.playerColor);
        if (this.dom.playerNameInput) this.dom.playerNameInput.value = val;
      });
    }

    // Color swatches on start screen
    document.querySelectorAll('#menu-color-swatches .color-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#menu-color-swatches .color-swatch').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const c = btn.getAttribute('data-color');
        if (this.multiplayer) {
          this.multiplayer.setProfile(this.multiplayer.playerName, c);
        }
        if (this.renderer && this.renderer.setPlayerColor) {
          this.renderer.setPlayerColor(c);
        }
        if (this.dom.menuCubePreview) {
          this.dom.menuCubePreview.style.background = c;
          this.dom.menuCubePreview.style.boxShadow = `0 0 25px ${c}99`;
        }
      });
    });

    // Play Solo Button
    if (this.dom.menuPlaySoloBtn) {
      this.dom.menuPlaySoloBtn.addEventListener('click', () => {
        this.startGameSolo();
      });
    }

    // Play With Friends Button
    if (this.dom.menuPlayFriendsBtn) {
      this.dom.menuPlayFriendsBtn.addEventListener('click', () => {
        this.openStartScreenLobby();
      });
    }

    // Secondary Track Selection
    if (this.dom.menuSelectTrackBtn) {
      this.dom.menuSelectTrackBtn.addEventListener('click', () => {
        this.openLevelModal();
      });
    }

    // Secondary Meme Chaos
    if (this.dom.menuMemeChaosBtn) {
      this.dom.menuMemeChaosBtn.addEventListener('click', () => {
        if (this.dom.memeChaosModal) this.dom.memeChaosModal.style.display = 'flex';
      });
    }

    // Lobby Back Button
    if (this.dom.menuLobbyBackBtn) {
      this.dom.menuLobbyBackBtn.addEventListener('click', () => {
        if (this.dom.mainMenuView) this.dom.mainMenuView.style.display = 'flex';
        if (this.dom.menuLobbyView) this.dom.menuLobbyView.style.display = 'none';
      });
    }

    // Lobby Copy Invite Link
    if (this.dom.menuLobbyCopyBtn) {
      this.dom.menuLobbyCopyBtn.addEventListener('click', () => {
        const link = this.multiplayer ? this.multiplayer.getInviteLink() : window.location.href;
        const fallback = () => {
          if (this.dom.menuLobbyLinkInput) {
            this.dom.menuLobbyLinkInput.select();
            this.dom.menuLobbyLinkInput.setSelectionRange(0, 99999);
            document.execCommand('copy');
          }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(link).catch(fallback);
        } else {
          fallback();
        }
        this.dom.menuLobbyCopyBtn.textContent = 'COPIED! ✓';
        this.dom.menuLobbyCopyBtn.style.background = '#00ff88';
        this.triggerBrainrotPop("link", "LINK COPIED! 🎮", "SHARE WITH FRIENDS ON DISCORD / WHATSAPP");
        setTimeout(() => {
          if (this.dom.menuLobbyCopyBtn) {
            this.dom.menuLobbyCopyBtn.textContent = '📋 COPY INVITE LINK';
            this.dom.menuLobbyCopyBtn.style.background = '';
          }
        }, 2200);
      });
    }

    // Lobby New Room Code
    if (this.dom.menuLobbyNewCodeBtn) {
      this.dom.menuLobbyNewCodeBtn.addEventListener('click', () => {
        const newCode = 'DASH-' + Math.floor(1000 + Math.random() * 9000);
        if (this.multiplayer) {
          this.multiplayer.startHost(newCode);
          this.updateLobbyDisplay();
        }
      });
    }

    // Lobby Start Race
    if (this.dom.menuLobbyStartBtn) {
      this.dom.menuLobbyStartBtn.addEventListener('click', () => {
        if (this.multiplayer) {
          this.multiplayer.requestStartRace();
        } else {
          this.startGameSolo();
        }
      });
    }

    // If visiting with an invite link (?room=ROOM_CODE), directly open lobby screen
    if (joinRoom && joinRoom.trim() !== '') {
      this.openStartScreenLobby();
    }
  }

  openStartScreenLobby() {
    if (this.dom.mainMenuView) this.dom.mainMenuView.style.display = 'none';
    if (this.dom.menuLobbyView) this.dom.menuLobbyView.style.display = 'block';
    this.updateLobbyDisplay();
    this.renderMenuLobbyRoster();
  }

  updateLobbyDisplay() {
    if (!this.multiplayer) return;
    if (this.dom.menuLobbyRoomCode) {
      this.dom.menuLobbyRoomCode.textContent = this.multiplayer.roomCode;
    }
    if (this.dom.menuLobbyRolePill) {
      this.dom.menuLobbyRolePill.textContent = this.multiplayer.isHost ? 'HOST' : 'CLIENT';
      this.dom.menuLobbyRolePill.style.background = this.multiplayer.isHost ? '#00FF88' : '#00F0FF';
    }
    if (this.dom.menuLobbyLinkInput) {
      this.dom.menuLobbyLinkInput.value = this.multiplayer.getInviteLink();
    }
    if (this.dom.partyShareUrl) {
      this.dom.partyShareUrl.value = this.multiplayer.getInviteLink();
    }
  }

  renderMenuLobbyRoster(playersList) {
    if (!this.dom.menuLobbyRoster) return;
    const players = playersList || (this.multiplayer ? Array.from(this.multiplayer.players.values()) : []);
    const count = players.length;

    if (this.dom.menuLobbyPlayerCount) {
      this.dom.menuLobbyPlayerCount.textContent = count;
    }
    if (this.dom.menuLobbyStatusText) {
      if (this.multiplayer && !this.multiplayer.isHost) {
        this.dom.menuLobbyStatusText.textContent = "CONNECTED • WAITING FOR HOST TO START RACE...";
      } else if (count > 1) {
        this.dom.menuLobbyStatusText.textContent = `${count} FRIENDS IN ROOM • READY TO RACE!`;
      } else {
        this.dom.menuLobbyStatusText.textContent = "WAITING UNTIL FRIENDS JOIN...";
      }
    }

    const slots = [];
    players.forEach(p => {
      slots.push(`
        <div class="lobby-roster-slot">
          <div class="slot-avatar-circle" style="background:${p.colorHex}22; border-color:${p.colorHex}; color:${p.colorHex};">
            ${p.isHost ? '👑' : '🎮'}
          </div>
          <div class="slot-name-text">${p.name}</div>
          <span class="slot-status-pill ${p.isHost ? 'host' : 'ready'}">${p.isHost ? 'HOST' : 'READY'}</span>
        </div>
      `);
    });

    const emptyNeeded = Math.max(1, 6 - count);
    for (let i = 0; i < emptyNeeded; i++) {
      slots.push(`
        <div class="lobby-roster-slot empty-slot">
          <div class="empty-avatar-circle">?</div>
          <div class="slot-name-text">Waiting...</div>
          <span class="slot-status-pill">OPEN</span>
        </div>
      `);
    }

    this.dom.menuLobbyRoster.innerHTML = slots.join('');
  }

  onMultiplayerRosterUpdated(playersList) {
    if (this.dom.partyCountBadge) {
      this.dom.partyCountBadge.textContent = playersList.length;
    }
    this.renderPartyModalMembers();
    this.renderMenuLobbyRoster(playersList);

    const opponents = playersList.filter(p => !p.isPlayer);
    // Real connected friends only in multiplayer! No bots in party/multiplayer!
    this.ghostConfigs = opponents.map(p => ({ ...p, isBot: false }));
    this.ghostStates = this.ghostConfigs.map(cfg => ({
      id: cfg.id,
      name: cfg.name,
      colorHex: cfg.colorHex,
      color: cfg.color || parseInt((cfg.colorHex || '#FF007F').replace('#', '0x'), 16),
      isBot: false,
      x: 0,
      y: 0,
      vy: 0,
      rotationZ: 0,
      vehicleMode: "cube",
      gravityDir: 1,
      isGrounded: true,
      isAlive: true,
      skill: cfg.skill || 0.9,
      offset: cfg.offset || 0,
      respawnTimer: 0,
      jumpCooldown: 0
    }));

    if (this.renderer) {
      this.renderer.setupGhosts(this.ghostConfigs);
    }
  }

  triggerSyncedCountdown(startTime) {
    if (this.dom.startScreenOverlay) {
      this.dom.startScreenOverlay.style.display = 'none';
    }
    if (this.dom.pauseModal) {
      this.dom.pauseModal.style.display = 'none';
    }
    this.closePartyModal();
    this.closeLevelModal();

    if (!this.dom.raceCountdownOverlay) return;

    this.dom.raceCountdownOverlay.style.display = 'flex';
    this.partyMode = 'multiplayer';
    if (this.multiplayer && this.multiplayer.players) {
      this.onMultiplayerRosterUpdated(Array.from(this.multiplayer.players.values()));
    }
    this.gameState = 'COUNTDOWN';
    this.resetPlayer(true);

    let count = 3;
    if (this.dom.countdownNumber) {
      this.dom.countdownNumber.textContent = count;
      this.dom.countdownNumber.style.color = '#FFD000';
    }
    audio.playCountdownBeep(count);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        if (this.dom.countdownNumber) {
          this.dom.countdownNumber.textContent = count;
          this.dom.countdownNumber.style.color = count === 2 ? '#FF7700' : '#FF0055';
        }
        audio.playCountdownBeep(count);
      } else if (count === 0) {
        if (this.dom.countdownNumber) {
          this.dom.countdownNumber.textContent = 'GO!';
          this.dom.countdownNumber.style.color = '#00FF88';
        }
        audio.playGoBeep();
        this.gameState = 'PLAYING';
        this.resetPlayer(true);
        audio.startMusic(this.level.bpm, this.level.theme);
      } else {
        clearInterval(interval);
        if (this.dom.raceCountdownOverlay) {
          this.dom.raceCountdownOverlay.style.display = 'none';
        }
      }
    }, 850);
  }

  updateHUDHeader() {
    this.dom.levelName.textContent = this.level.name;
    const badgeSvg = DifficultyBadges.getBadge(this.level.difficulty);
    this.dom.diffBadge.innerHTML = `${badgeSvg} <span>${this.level.diffStars} ${this.level.difficulty}</span>`;
    this.dom.diffBadge.style.background = `${this.level.diffColor}22`;
    this.dom.diffBadge.style.color = this.level.diffColor;
    this.dom.diffBadge.style.border = `1px solid ${this.level.diffColor}`;
    this.dom.attemptCount.innerHTML = `ATTEMPT <span>${this.attempts}</span>`;
    this.dom.bestRecord.innerHTML = `BEST <span>${this.bestScores[this.currentLevelIndex]}%</span>`;
    if (this.dom.menuTrackTitle) {
      this.dom.menuTrackTitle.textContent = this.level.name;
    }
    this.updateGemHUD();
  }

  // -------------------------------------------------------------
  // MASTER ANIMATION & GAME LOOP
  // -------------------------------------------------------------

  gameLoop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    const frameDt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    // A. Main Menu State: Gently drift ambient 3D camera without gameplay physics
    if (this.gameState === 'MENU') {
      this.physicsAccumulator = 0;
      this.renderer.update({
        x: 0,
        y: (this.player.vehicleMode === 'cube' ? 0.5 : 0),
        vy: 0,
        rotationZ: 0,
        vehicleMode: this.player.vehicleMode,
        gravityDir: 1,
        isGrounded: true,
        isAlive: true,
        isThrusting: false
      }, frameDt * 0.35);
      requestAnimationFrame(t => this.gameLoop(t));
      return;
    }

    // B. Paused / Smurf Cat State: Completely freeze game loop, physics & animations
    if (this.gameState === 'PAUSED' || this.gameState === 'SMURF_CAT') {
      this.physicsAccumulator = 0;
      this.renderer.update({
        x: this.player.x,
        y: this.player.y + (this.player.vehicleMode === 'cube' ? 0.5 : 0),
        vy: 0,
        rotationZ: this.player.rotationZ,
        vehicleMode: this.player.vehicleMode,
        gravityDir: this.player.gravityDir,
        isGrounded: this.player.isGrounded,
        isAlive: this.gameState === 'PAUSED' ? this.player.isAlive : false,
        isThrusting: false
      }, 0);
      requestAnimationFrame(t => this.gameLoop(t));
      return;
    }

    // C. Gothic Climax Ending State: Everything frozen in space, camera shake & shockwave
    if (this.gameState === 'GOTHIC_CLIMAX') {
      this.physicsAccumulator = 0;
      this.renderer.update({
        x: this.player.x,
        y: this.player.y + (this.player.vehicleMode === 'cube' ? 0.5 : 0),
        z: this.player.z || 0,
        vy: 0,
        rotationZ: this.player.rotationZ,
        vehicleMode: this.player.vehicleMode,
        gravityDir: this.player.gravityDir,
        hasShield: false,
        invulnerableTimer: 0,
        speedMult: 0,
        isGrounded: true,
        isAlive: true,
        isThrusting: false,
        isCoilTransition: false,
        coilProgress: 0
      }, frameDt);
      requestAnimationFrame(t => this.gameLoop(t));
      return;
    }

    // 1. Fixed-Timestep Physics Accumulator Loop (120Hz deterministic sub-stepping)
    const FIXED_PHYSICS_DT = 1 / 120;
    this.physicsAccumulator = (this.physicsAccumulator || 0) + frameDt;
    let subSteps = 0;
    const maxSubSteps = 8;
    while (this.physicsAccumulator >= FIXED_PHYSICS_DT && subSteps < maxSubSteps) {
      this.updatePhysics(FIXED_PHYSICS_DT);
      this.physicsAccumulator -= FIXED_PHYSICS_DT;
      subSteps++;
      if (!this.player.isAlive && this.gameState !== 'CRASHED') break;
    }
    if (this.physicsAccumulator > FIXED_PHYSICS_DT * 2) {
      this.physicsAccumulator = 0;
    }

    this.updateStyleDecay(frameDt);

    // Living environment audio progression (Castle 5-act evolution)
    if (this.gameState === 'PLAYING' && this.level && this.level.endX) {
      const progRatio = Math.max(0, Math.min(1.0, this.player.x / this.level.endX));
      audio.setTrackProgression(progRatio);
    }

    // 1b. Update Meme Chaos Timers (Tung Tung Sahur Random Event)
    if (this.gameState === 'PLAYING' && this.chaosMode !== 'off') {
      const interval = (this.chaosMode === 'high') ? 45 : 75;
      this.tungTungTimer -= frameDt;
      if (this.tungTungTimer <= 0 && this.player.isAlive) {
        this.triggerTungTungSahur();
        this.tungTungTimer = Math.random() * 15 + interval;
      }
    }
    if (this.nearMissCooldown > 0) {
      this.nearMissCooldown -= frameDt;
    }

    // 2. Update AI Ghost Racers
    this.updateGhosts(frameDt);

    // 3. Update 3D Visuals & Camera with Dynamic Momentum State
    this.renderer.update({
      x: this.player.x,
      y: this.player.y + (this.player.vehicleMode === 'cube' ? 0.5 : 0),
      z: this.player.z || 0,
      vx: (this.gameState === 'CRASHED' ? (this.player.crashVx || 0) : (this.player.vx || this.level.speed)),
      targetVx: (this.level.speed || 11.0) * (this.currentSpeedMult || 1.0),
      vy: this.player.vy,
      rotationZ: this.player.rotationZ,
      vehicleMode: this.player.vehicleMode,
      gravityDir: this.player.gravityDir,
      hasShield: this.player.hasShield,
      invulnerableTimer: this.player.invulnerableTimer || 0,
      speedMult: this.currentSpeedMult || 1.0,
      isGrounded: this.player.isGrounded,
      isAlive: this.player.isAlive,
      isCrashing: (this.gameState === 'CRASHED'),
      isThrusting: this.player.isHolding,
      isCoilTransition: (this.gameState === 'COIL_TRANSITION'),
      coilProgress: this.coilProgress || 0
    }, frameDt);

    // 4. Update HUD and Leaderboard
    this.updateHUD();

    // 5. Broadcast transform to multiplayer peers
    if (this.multiplayer) {
      const progress = Math.min(100, Math.max(0, (this.player.x / this.level.endX) * 100));
      this.multiplayer.sendLocalTransform(
        this.player.x,
        this.player.y + (this.player.vehicleMode === 'cube' ? 0.5 : 0),
        this.player.vy,
        this.player.rotationZ,
        this.player.vehicleMode,
        this.player.isAlive,
        progress
      );
    }

    requestAnimationFrame(t => this.gameLoop(t));
  }
}

// Boot on DOM ready
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('DOMContentLoaded', () => {
    const game = new GameManager();
    game.init();
  });
}

export { GameManager };
