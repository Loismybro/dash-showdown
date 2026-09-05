// game.js - Master Game Logic, Deterministic Sub-Step Physics & AI Ghost Engine

import { LEVEL_DATA } from './levels.js';
import { audio } from './audio.js';
import { GameRenderer } from './renderer.js';
import { DifficultyBadges } from './difficulty_badges.js';
import { MultiplayerManager } from './multiplayer.js';

class GameManager {
  constructor() {
    this.renderer = null;

    // Levels
    this.levels = LEVEL_DATA;
    this.currentLevelIndex = 0;
    this.level = this.levels[0];

    // Player State
    this.player = {
      x: 0,
      y: 0,
      vx: 10.5,
      vy: 0,
      rotationZ: 0,
      vehicleMode: "cube", // "cube", "ship", "wave"
      gravityDir: 1,       // 1 = normal (floor), -1 = inverted (ceiling)
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
    this.bestScores = [0, 0, 0, 0];
    this.loadBestScores();

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
    this.gameState = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'CRASHED', 'VICTORY'
    this.respawnTimer = 0;

    // Controls & Game Feel Juice: Jump Buffering & Coyote Time
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;

    // Meme Chaos State (Tung Tung Sahur, Smurf Cat & Audio Engine)
    this.deathSpotCounts = new Map();
    this.tungTungTimer = Math.random() * 8 + 15;
    this.isTungTungActive = false;
    this.chaosMode = 'normal'; // 'off', 'normal', 'high'
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
        this.bestScores = JSON.parse(saved);
      }
    } catch (e) {}
  }

  saveBestScores() {
    try {
      localStorage.setItem('dash_showdown_scores', JSON.stringify(this.bestScores));
    } catch (e) {}
  }

  loadLevel(index) {
    this.currentLevelIndex = index;
    this.level = this.levels[index];
    this.checkpoints = [];
    this.totalLevelGems = this.level.obstacles.filter(o => o.type === 'gem').length;
    this.gemsCollected.clear();
    this.brainrotMilestones.clear();

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
    if (this.multiplayer && this.multiplayer.players && this.multiplayer.players.size > 1) {
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

  resetPlayer(isFullReset = false) {
    if (this.practiceMode && this.checkpoints.length > 0 && !isFullReset) {
      // Respawn at last practice checkpoint
      const cp = this.checkpoints[this.checkpoints.length - 1];
      this.player.x = cp.x;
      this.player.y = cp.y;
      this.player.vy = cp.vy || 0;
      this.player.rotationZ = cp.rotationZ || 0;
      this.player.vehicleMode = cp.vehicleMode || "cube";
      this.player.gravityDir = cp.gravityDir || 1;
      this.player.isGrounded = false;
      this.player.isAlive = true;
      this.player.orbTriggered = new Set(cp.orbTriggered || []);
      if (cp.gems) {
        this.gemsCollected = new Set(cp.gems);
      } else {
        this.gemsCollected.clear();
      }
      this.updateGemHUD();
      if (this.renderer && this.renderer.resetGems) {
        this.renderer.resetGems(this.gemsCollected);
      }
    } else {
      // Normal restart from beginning
      this.gemsCollected.clear();
      this.brainrotMilestones.clear();
      this.updateGemHUD();
      if (this.renderer && this.renderer.resetGems) {
        this.renderer.resetGems(this.gemsCollected);
      }
      this.player.x = 0;
      this.player.y = (this.level.defaultVehicle === "cube" ? 0 : 2);
      this.player.vx = this.level.speed;
      this.player.vy = 0;
      this.player.rotationZ = 0;
      this.player.vehicleMode = this.level.defaultVehicle || "cube";
      this.player.gravityDir = 1;
      this.player.isGrounded = true;
      this.player.isAlive = true;
      this.player.orbTriggered.clear();
      audio.updateShipThrust(0);
    }
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.gameState = 'PLAYING';
  }

  onPlayerCrash() {
    if (!this.player.isAlive) return;

    this.player.isAlive = false;

    // Track repeated deaths in this 4-unit zone for Smurf Cat intervention
    const spotKey = Math.floor(this.player.x / 4) * 4;
    const spotDeaths = (this.deathSpotCounts.get(spotKey) || 0) + 1;
    this.deathSpotCounts.set(spotKey, spotDeaths);

    // 🍄 SMURF CAT REQUIREMENT:
    // Only after user dies at the same spot 2 or more times!
    if (spotDeaths >= 2 && !this.practiceMode) {
      this.triggerSmurfCatIntervention(spotKey, spotDeaths);
      return;
    }

    this.gameState = 'CRASHED';
    this.respawnTimer = 0.42; // 0.42s snappy respawn

    if (this.multiplayer) {
      this.multiplayer.sendCrashEvent(this.player.x, this.player.y);
    }
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    audio.playCrash();
    audio.updateShipThrust(0);

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

    // Trigger 3D shattered voxel explosion
    this.renderer.triggerDeathExplosion(
      new THREE.Vector3(this.player.x, this.player.y + 0.5 * this.player.gravityDir, 0),
      this.level.diffColor
    );

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

    this.resetPlayer(false);
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
    this.nearMissCooldown = 2.5;
    audio.playWhatTheSigma();
    if (this.renderer) {
      this.renderer.triggerComicHitText(x, y + 1.2, "WHAT THE SIGMA?! 🗿", "#00F0FF");
    }
    this.triggerBrainrotPop("sigma", "WHAT THE SIGMA?!", "NARROW ESCAPE! +5,000 AURA 🗿");
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
      if (obs.type === 'orb') {
        const dx = p.x - obs.x;
        const dy = (p.y + 0.5 * p.gravityDir) - obs.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= orbRadius && !p.orbTriggered.has(i)) {
          p.orbTriggered.add(i);
          audio.playOrbChime();

          // Trigger Squash & Orb Shockwave
          this.renderer.triggerJumpSquash();
          const orbMesh = this.renderer.orbMeshes.find(m => m.userData.obstacle === obs);
          if (orbMesh && orbMesh.userData.triggerOrb) {
            orbMesh.userData.triggerOrb();
          }

          if (obs.subType === 'yellow') {
            p.vy = 18.5 * p.gravityDir;
            p.isGrounded = false;
          } else if (obs.subType === 'pink') {
            p.vy = 14.0 * p.gravityDir;
            p.isGrounded = false;
          } else if (obs.subType === 'blue') {
            // Gravity Flip Orb!
            p.gravityDir *= -1;
            p.vy = (p.gravityDir === -1 ? 16.0 : -16.0);
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
    this.checkpoints.push({
      x: this.player.x,
      y: this.player.y,
      vy: this.player.vy,
      rotationZ: this.player.rotationZ,
      vehicleMode: this.player.vehicleMode,
      gravityDir: this.player.gravityDir,
      orbTriggered: Array.from(this.player.orbTriggered)
    });
    audio.playCheckpoint();
    this.renderer.renderCheckpoints(this.checkpoints);
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
          <span>🏆 Best: ${this.bestScores[idx]}%</span>
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
    if (this.gameState !== 'PLAYING' || !this.player.isAlive) {
      if (this.gameState === 'CRASHED') {
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) {
          this.resetPlayer(false);
        }
      }
      return;
    }

    // Substep integration for high-speed accuracy
    const substeps = 3;
    const subDt = dt / substeps;
    for (let step = 0; step < substeps; step++) {
      this.integratePlayerStep(subDt);
      if (!this.player.isAlive) break;
    }

    // Check Victory Reached
    if (this.player.x >= this.level.endX && this.gameState === 'PLAYING') {
      this.onPlayerVictory();
    }
  }

  integratePlayerStep(dt) {
    const p = this.player;

    // Update timers
    if (p.isGrounded) {
      this.coyoteTimer = 0.09;
    } else {
      this.coyoteTimer -= dt;
    }
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    // 1. Horizontal Motion
    p.x += this.level.speed * dt;

    // 2. Check auto-trigger orbs while holding
    if (p.isHolding) {
      this.checkOrbTrigger();
    }

    // 3. Vertical Motion per Vehicle Mode
    if (p.vehicleMode === 'cube') {
      const gravity = -48.0 * p.gravityDir;
      p.vy += gravity * dt;
      p.y += p.vy * dt;

      // Auto-Jump (Buffered Jump or Hold-to-Jump)
      if ((p.isGrounded || this.coyoteTimer > 0) && (this.jumpBufferTimer > 0 || p.isHolding)) {
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        p.vy = 16.5 * p.gravityDir;
        p.isGrounded = false;
        audio.playMechanicalJump();
        this.renderer.triggerJumpSquash();
      }

      if (!p.isGrounded) {
        p.rotationZ -= 8.5 * dt * p.gravityDir;
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

    // 4. World Boundary Collisions
    const ceilY = (this.level.id === 2 ? 9.0 : 10.0);
    const floorY = 0.0;

    if (p.gravityDir === 1) {
      if (p.y <= floorY) {
        if (!p.isGrounded && p.vehicleMode === 'cube') {
          audio.playMechanicalLanding();
          this.renderer.triggerLandingSquash();
        }
        p.y = floorY;
        p.vy = 0;
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
        p.vy = 0;
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

      if (obs.type === 'spike') {
        const halfW = 0.36; // Generous inner deadly hitbox (forgiving GD tolerance)
        const dx = Math.abs(px - obs.x);
        if (dx < halfW) {
          const slopeRatio = (1.0 - dx / halfW);
          if (obs.dir === 'down') {
            // Hanging spike pointing DOWN: base at obs.y, tip at obs.y - 0.85
            const deadlyY = obs.y - slopeRatio * 0.80;
            const playerTop = p.y + 0.90;
            const playerBottom = p.y + 0.05;
            // Player MUST be vertically within the spike's actual span!
            if (playerTop > deadlyY && playerBottom < obs.y) {
              this.onPlayerCrash();
              return;
            } else if (!obs.nearMiss && playerTop <= deadlyY && playerTop >= deadlyY - 0.22) {
              obs.nearMiss = true;
              this.onNearMissSpike(obs.x, obs.y);
            }
          } else {
            // Floor spike pointing UP: base at obs.y, tip at obs.y + 0.85
            const deadlyY = obs.y + slopeRatio * 0.80;
            const playerTop = p.y + 0.95;
            const playerBottom = p.y + 0.05;
            // Player MUST be vertically within the spike's actual span!
            if (playerBottom < deadlyY && playerTop > obs.y + 0.05) {
              this.onPlayerCrash();
              return;
            } else if (!obs.nearMiss && playerBottom >= deadlyY && playerBottom <= deadlyY + 0.22) {
              obs.nearMiss = true;
              this.onNearMissSpike(obs.x, obs.y);
            }
          }
        }
      }
      else if (obs.type === 'block') {
        const bx = obs.x;
        const by = obs.y;
        const bw = obs.w || 2;
        const bh = obs.h || 2;

        const left = bx;
        const right = bx + bw;
        const bottom = by;
        const top = by + bh;

        const playerLeft = px - 0.36;
        const playerRight = px + 0.36;
        const playerBottom = p.y;
        const playerTop = p.y + 1.0;

        if (playerRight > left + 0.05 && playerLeft < right - 0.05 && playerTop > bottom + 0.05 && playerBottom < top - 0.02) {
          if (p.vehicleMode === 'cube') {
            if (p.gravityDir === 1) {
              if (playerBottom >= top - 0.45) {
                if (p.vy <= 0.5) {
                  if (!p.isGrounded) {
                    audio.playMechanicalLanding();
                    this.renderer.triggerLandingSquash();
                  }
                  p.y = top;
                  p.vy = 0;
                  p.isGrounded = true;
                }
              } else {
                const isInternalSeam = this.level.obstacles.some(o => 
                  o.type === 'block' && o !== obs && 
                  Math.abs((o.x + (o.w || 2)) - left) < 0.15 && 
                  Math.abs((o.y + (o.h || 2)) - top) < 0.15
                );
                if (!isInternalSeam) {
                  this.onPlayerCrash();
                  return;
                }
              }
            }
            else if (p.gravityDir === -1) {
              if (playerTop <= bottom + 0.45) {
                if (p.vy >= -0.5) {
                  if (!p.isGrounded) {
                    audio.playMechanicalLanding();
                    this.renderer.triggerLandingSquash();
                  }
                  p.y = bottom - 1.0;
                  p.vy = 0;
                  p.isGrounded = true;
                }
              } else {
                const isInternalSeam = this.level.obstacles.some(o => 
                  o.type === 'block' && o !== obs && 
                  Math.abs((o.x + (o.w || 2)) - left) < 0.15 && 
                  Math.abs(o.y - bottom) < 0.15
                );
                if (!isInternalSeam) {
                  this.onPlayerCrash();
                  return;
                }
              }
            } else {
              this.onPlayerCrash();
              return;
            }
          } else if (p.vehicleMode === 'ship') {
            if (p.gravityDir === 1 && playerBottom >= top - 0.45) {
              p.y = top;
              p.vy = Math.max(0, p.vy);
            } else if (p.gravityDir === -1 && playerTop <= bottom + 0.45) {
              p.y = bottom - 1.0;
              p.vy = Math.min(0, p.vy);
            } else {
              this.onPlayerCrash();
              return;
            }
          } else {
            this.onPlayerCrash();
            return;
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
            this.triggerBrainrotPop("gem");
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

            if (obs.subType === 'yellow') {
              p.vy = 24.0 * p.gravityDir;
              p.isGrounded = false;
              audio.playPadLaunch();
            } else if (obs.subType === 'pink') {
              p.vy = 15.0 * p.gravityDir;
              p.isGrounded = false;
              audio.playPadLaunch();
            } else if (obs.subType === 'blue') {
              // Proper gravity flip launch!
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
              this.triggerBrainrotPop("gravity");
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
            this.triggerBrainrotPop("portal");
          } else if (obs.subType === 'wave' && p.vehicleMode !== 'wave') {
            p.vehicleMode = 'wave';
            audio.playPadLaunch();
            this.triggerBrainrotPop("portal");
          } else if (obs.subType === 'cube' && p.vehicleMode !== 'cube') {
            p.vehicleMode = 'cube';
            audio.updateShipThrust(0);
            audio.playPadLaunch();
          } else if (obs.subType === 'gravity_up' && p.gravityDir !== -1) {
            p.gravityDir = -1;
            audio.playGravityFlip(true);
            audio.playVineBoom();
            this.triggerBrainrotPop("gravity");
          } else if (obs.subType === 'gravity_down' && p.gravityDir !== 1) {
            p.gravityDir = 1;
            audio.playGravityFlip(false);
            audio.playVineBoom();
            this.triggerBrainrotPop("gravity");
          }
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

      // Lookahead obstacle detection
      const lookahead = 2.4;
      const upcomingSpike = this.level.obstacles.find(obs =>
        obs.type === 'spike' && (obs.x > g.x && obs.x < g.x + lookahead) && Math.abs(obs.y - g.y) < 1.0
      );

      if (upcomingSpike && g.jumpCooldown <= 0 && g.isGrounded) {
        if (Math.random() < g.skill) {
          g.vy = 16.5 * g.gravityDir;
          g.isGrounded = false;
          g.jumpCooldown = 0.55;
        } else {
          g.isAlive = false;
          g.respawnTimer = 2.0;
        }
      }

      // Gravity
      g.vy -= 48.0 * dt * g.gravityDir;
      g.y += g.vy * dt;

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

      this.renderer.updateGhost(g.id, g.x, g.y + 0.45, g.rotationZ, g.isAlive);
    });
  }

  // -------------------------------------------------------------
  // HUD & LEADERBOARD REFRESH
  // -------------------------------------------------------------

  updateHUD() {
    const progress = Math.min(100, Math.max(0, (this.player.x / this.level.endX) * 100));
    this.dom.progressBar.style.width = `${progress}%`;
    this.dom.progressPercent.textContent = `${progress.toFixed(1)}%`;
    this.dom.playerMarker.style.left = `${progress}%`;

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
    [25, 50, 75].forEach(pct => {
      if (progress >= pct && !this.brainrotMilestones.has(pct)) {
        this.brainrotMilestones.add(pct);
        if (pct === 25) this.triggerBrainrotPop("m25", "25% PASSED", "MEWING STREAK MAINTAINED 🤫🧏");
        else if (pct === 50) this.triggerBrainrotPop("m50", "HALFWAY THERE", "WE LIVE WE LOVE WE LIE 🍄🐱");
        else if (pct === 75) this.triggerBrainrotPop("m75", "75% CLIMAX", "WHAT THE SIGMA?! ULTRA AURA 🗿");
      }
    });
  }

  updateGemHUD() {
    if (!this.dom.gemCountText) return;
    this.dom.gemCountText.textContent = `${this.gemsCollected.size} / ${this.totalLevelGems}`;
  }

  triggerBrainrotPop(type, customTitle = "", customQuote = "") {
    if (!this.dom.brainrotPopup) return;

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
    }, 2000);
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
    const botFill = this.partyRoster.slice(1, 4).filter(b => !opponents.some(o => o.name === b.name));
    const allOpponents = [
      ...opponents.map(p => ({ ...p, isBot: false })),
      ...botFill.slice(0, Math.max(0, 3 - opponents.length)).map(b => ({ ...b, isBot: true }))
    ];

    this.ghostConfigs = allOpponents;
    this.ghostStates = this.ghostConfigs.map(cfg => ({
      id: cfg.id,
      name: cfg.name,
      colorHex: cfg.colorHex,
      color: cfg.color || parseInt((cfg.colorHex || '#FF007F').replace('#', '0x'), 16),
      isBot: cfg.isBot,
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
    const dt = Math.min(0.05, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    // A. Main Menu State: Gently drift ambient 3D camera without gameplay physics
    if (this.gameState === 'MENU') {
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
      }, dt * 0.35);
      requestAnimationFrame(t => this.gameLoop(t));
      return;
    }

    // B. Paused State: Freeze game loop & animations in place
    if (this.gameState === 'PAUSED') {
      this.renderer.update({
        x: this.player.x,
        y: this.player.y + (this.player.vehicleMode === 'cube' ? 0.5 : 0),
        vy: 0,
        rotationZ: this.player.rotationZ,
        vehicleMode: this.player.vehicleMode,
        gravityDir: this.player.gravityDir,
        isGrounded: this.player.isGrounded,
        isAlive: this.player.isAlive,
        isThrusting: false
      }, 0);
      requestAnimationFrame(t => this.gameLoop(t));
      return;
    }

    // 1. Update Player Physics & Collisions
    this.updatePhysics(dt);

    // 1b. Update Meme Chaos Timers (Tung Tung Sahur Random Event)
    if (this.gameState === 'PLAYING' && this.chaosMode !== 'off') {
      const interval = (this.chaosMode === 'high') ? 11 : 22;
      this.tungTungTimer -= dt;
      if (this.tungTungTimer <= 0 && this.player.isAlive) {
        this.triggerTungTungSahur();
        this.tungTungTimer = Math.random() * 8 + interval;
      }
    }
    if (this.nearMissCooldown > 0) {
      this.nearMissCooldown -= dt;
    }

    // 2. Update AI Ghost Racers
    this.updateGhosts(dt);

    // 3. Update 3D Visuals & Camera
    this.renderer.update({
      x: this.player.x,
      y: this.player.y + (this.player.vehicleMode === 'cube' ? 0.5 : 0),
      vy: this.player.vy,
      rotationZ: this.player.rotationZ,
      vehicleMode: this.player.vehicleMode,
      gravityDir: this.player.gravityDir,
      isGrounded: this.player.isGrounded,
      isAlive: this.player.isAlive,
      isThrusting: this.player.isHolding
    }, dt);

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
