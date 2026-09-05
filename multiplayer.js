// multiplayer.js - Real-Time WebRTC Peer-to-Peer Multiplayer for GitHub Pages
// Zero backend server required. Uses free public PeerJS STUN broker.

export class MultiplayerManager {
  constructor(game) {
    this.game = game;
    this.peer = null;
    this.connections = new Map(); // peerId -> DataConnection (host)
    this.hostConnection = null;   // DataConnection to host (client)
    this.isHost = true;
    this.roomCode = '';
    this.localPlayerId = 'p_' + Math.random().toString(36).substring(2, 9);
    
    // Player Profile
    this.playerName = localStorage.getItem('dash_player_name') || 'Mognetic';
    this.playerColor = localStorage.getItem('dash_player_color') || '#00FF88';
    
    // Connected racers map: id -> { id, name, colorHex, color, isHost, isPlayer, x, y, vy, rot, vehicle, isAlive, progress }
    this.players = new Map();
    
    // Network update throttler
    this.lastSendTime = 0;
    this.sendInterval = 28; // ~35 Hz smooth transform sync
  }

  init() {
    // 1. Check URL parameters for ?room=ROOM_CODE
    const urlParams = new URLSearchParams(window.location.search);
    const joinRoom = urlParams.get('room');

    if (joinRoom && joinRoom.trim() !== '') {
      this.isHost = false;
      this.roomCode = joinRoom.trim().toUpperCase();
      this.connectAsClient(this.roomCode);
    } else {
      this.isHost = true;
      this.roomCode = 'DASH-' + Math.floor(1000 + Math.random() * 9000);
      this.startHost(this.roomCode);
    }

    // Register local player in roster
    this.updateLocalPlayerInRoster();
  }

  getInviteLink() {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return origin + pathname + '?room=' + this.roomCode;
  }

  setProfile(name, color) {
    this.playerName = name.trim() || 'Player';
    this.playerColor = color || '#00FF88';
    localStorage.setItem('dash_player_name', this.playerName);
    localStorage.setItem('dash_player_color', this.playerColor);
    this.updateLocalPlayerInRoster();

    // Broadcast profile update
    this.broadcast({
      type: 'profile_update',
      id: this.localPlayerId,
      name: this.playerName,
      colorHex: this.playerColor
    });
  }

  updateLocalPlayerInRoster() {
    this.players.set(this.localPlayerId, {
      id: this.localPlayerId,
      name: this.playerName + ' (You)',
      rawName: this.playerName,
      colorHex: this.playerColor,
      color: parseInt(this.playerColor.replace('#', '0x'), 16),
      isHost: this.isHost,
      isPlayer: true,
      ready: true,
      x: 0,
      y: 0,
      progress: 0,
      isAlive: true
    });
    this.notifyRosterChanged();
  }

  // ── HOST INITIALIZATION ──
  startHost(roomCode) {
    this.isHost = true;
    this.roomCode = roomCode;
    const peerId = 'dash-gd3d-' + roomCode.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (typeof Peer === 'undefined') {
      console.warn('[Multiplayer] PeerJS not loaded yet. Running in solo/bot mode.');
      return;
    }

    try {
      this.peer = new Peer(peerId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        console.log('[Multiplayer] Host registered with PeerID:', id);
        this.updateStatusPill('🟢 HOSTING ROOM', 'status-hosting');
      });

      this.peer.on('connection', (conn) => {
        this.handleClientJoin(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('[Multiplayer] Host Peer error:', err.type);
        if (err.type === 'unavailable-id') {
          this.roomCode = 'DASH-' + Math.floor(1000 + Math.random() * 9000);
          this.startHost(this.roomCode);
        }
      });
    } catch (e) {
      console.error('[Multiplayer] Failed to initialize host peer:', e);
    }
  }

  handleClientJoin(conn) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      console.log('[Multiplayer] Client connected:', conn.peer);

      // Send initial room snapshot: current level & current roster
      conn.send({
        type: 'room_snapshot',
        levelIndex: this.game.currentLevelIndex,
        hostId: this.localPlayerId,
        roster: Array.from(this.players.values())
      });

      conn.on('data', (data) => {
        this.handleMessageFromClient(conn, data);
      });

      conn.on('close', () => {
        this.connections.delete(conn.peer);
        for (const [pid, p] of this.players.entries()) {
          if (p.connPeerId === conn.peer) {
            this.players.delete(pid);
            if (this.game.renderer && this.game.renderer.removeGhost) {
              this.game.renderer.removeGhost(pid);
            }
          }
        }
        this.notifyRosterChanged();
        this.broadcastRoster();
      });
    });
  }

  // ── CLIENT INITIALIZATION ──
  connectAsClient(roomCode) {
    this.isHost = false;
    this.roomCode = roomCode;
    const targetHostPeerId = 'dash-gd3d-' + roomCode.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (typeof Peer === 'undefined') {
      console.warn('[Multiplayer] PeerJS not loaded yet.');
      return;
    }

    try {
      this.peer = new Peer({
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        }
      });

      this.updateStatusPill('🟡 CONNECTING...', 'status-connecting');

      this.peer.on('open', () => {
        console.log('[Multiplayer] Client peer ready. Connecting to host ' + targetHostPeerId);
        const conn = this.peer.connect(targetHostPeerId, { reliable: true });
        this.hostConnection = conn;

        conn.on('open', () => {
          console.log('[Multiplayer] Connected to host!');
          this.updateStatusPill('🟢 CONNECTED TO HOST', 'status-connected');

          conn.send({
            type: 'join',
            id: this.localPlayerId,
            name: this.playerName,
            colorHex: this.playerColor
          });
        });

        conn.on('data', (data) => {
          this.handleMessageFromHost(data);
        });

        conn.on('close', () => {
          console.warn('[Multiplayer] Disconnected from host.');
          this.updateStatusPill('🔴 DISCONNECTED', 'status-disconnected');
        });

        conn.on('error', (err) => {
          console.error('[Multiplayer] Host connection error:', err);
          this.updateStatusPill('⚠️ ROOM NOT FOUND', 'status-error');
        });
      });

      this.peer.on('error', (err) => {
        console.warn('[Multiplayer] Client peer error:', err);
        this.updateStatusPill('⚠️ CONNECTION FAILED', 'status-error');
      });
    } catch (e) {
      console.error('[Multiplayer] Failed to connect as client:', e);
    }
  }

  // ── MESSAGE ROUTING ──
  handleMessageFromClient(conn, msg) {
    if (!msg || !msg.type) return;

    if (msg.type === 'join') {
      const colorVal = parseInt((msg.colorHex || '#FF007F').replace('#', '0x'), 16);
      this.players.set(msg.id, {
        id: msg.id,
        connPeerId: conn.peer,
        name: msg.name || 'Friend',
        rawName: msg.name || 'Friend',
        colorHex: msg.colorHex || '#FF007F',
        color: colorVal,
        isHost: false,
        isPlayer: false,
        ready: true,
        x: 0,
        y: 0,
        progress: 0,
        isAlive: true
      });
      this.notifyRosterChanged();
      this.broadcastRoster();
    }
    else if (msg.type === 'profile_update') {
      const p = this.players.get(msg.id);
      if (p) {
        p.name = msg.name;
        p.rawName = msg.name;
        p.colorHex = msg.colorHex;
        p.color = parseInt((msg.colorHex || '#FF007F').replace('#', '0x'), 16);
        this.notifyRosterChanged();
        this.broadcastRoster();
      }
    }
    else if (msg.type === 'pos') {
      const p = this.players.get(msg.id);
      if (p) {
        p.x = msg.x;
        p.y = msg.y;
        p.vy = msg.vy;
        p.rot = msg.rot;
        p.vehicle = msg.vehicle;
        p.isAlive = msg.isAlive;
        p.progress = msg.progress || 0;

        // Keep game ghostStates synchronized for live leaderboard ranking
        if (this.game && this.game.ghostStates) {
          const gs = this.game.ghostStates.find(item => item.id === msg.id);
          if (gs) {
            gs.x = msg.x;
            gs.y = msg.y;
            gs.rotationZ = msg.rot;
            gs.isAlive = msg.isAlive;
          }
        }

        if (this.game.renderer) {
          this.game.renderer.updateGhost(msg.id, msg.x, msg.y, msg.rot, msg.isAlive);
        }
      }
      this.broadcastToOthers(conn.peer, msg);
    }
    else if (msg.type === 'crash') {
      if (this.game && this.game.ghostStates) {
        const gs = this.game.ghostStates.find(item => item.id === msg.id);
        if (gs) gs.isAlive = false;
      }
      if (this.game.renderer && this.game.renderer.triggerDeathExplosion) {
        const color = this.players.get(msg.id)?.colorHex || '#FF0055';
        this.game.renderer.triggerDeathExplosion(new THREE.Vector3(msg.x, msg.y, 0), color);
      }
      this.broadcastToOthers(conn.peer, msg);
    }
    else if (msg.type === 'request_start_race') {
      this.requestStartRace();
    }
  }

  handleMessageFromHost(msg) {
    if (!msg || !msg.type) return;

    if (msg.type === 'room_snapshot') {
      if (msg.levelIndex !== undefined && msg.levelIndex !== this.game.currentLevelIndex) {
        this.game.loadLevel(msg.levelIndex);
      }
      this.players.clear();
      this.updateLocalPlayerInRoster();

      if (Array.isArray(msg.roster)) {
        msg.roster.forEach(item => {
          if (item.id !== this.localPlayerId) {
            this.players.set(item.id, item);
          }
        });
      }
      this.notifyRosterChanged();
    }
    else if (msg.type === 'roster_update') {
      if (Array.isArray(msg.roster)) {
        this.players.clear();
        this.updateLocalPlayerInRoster();
        msg.roster.forEach(item => {
          if (item.id !== this.localPlayerId) {
            this.players.set(item.id, item);
          }
        });
        this.notifyRosterChanged();
      }
    }
    else if (msg.type === 'start_race') {
      this.game.triggerSyncedCountdown(msg.startTime);
    }
    else if (msg.type === 'level_change') {
      if (msg.levelIndex !== this.game.currentLevelIndex) {
        this.game.loadLevel(msg.levelIndex);
      }
    }
    else if (msg.type === 'pos') {
      if (msg.id !== this.localPlayerId) {
        const p = this.players.get(msg.id);
        if (p) {
          p.x = msg.x;
          p.y = msg.y;
          p.rot = msg.rot;
          p.isAlive = msg.isAlive;
          p.progress = msg.progress || 0;

          // Keep game ghostStates synchronized for live leaderboard ranking
          if (this.game && this.game.ghostStates) {
            const gs = this.game.ghostStates.find(item => item.id === msg.id);
            if (gs) {
              gs.x = msg.x;
              gs.y = msg.y;
              gs.rotationZ = msg.rot;
              gs.isAlive = msg.isAlive;
            }
          }

          if (this.game.renderer) {
            this.game.renderer.updateGhost(msg.id, msg.x, msg.y, msg.rot, msg.isAlive);
          }
        }
      }
    }
    else if (msg.type === 'crash') {
      if (msg.id !== this.localPlayerId) {
        if (this.game && this.game.ghostStates) {
          const gs = this.game.ghostStates.find(item => item.id === msg.id);
          if (gs) gs.isAlive = false;
        }
        if (this.game.renderer && this.game.renderer.triggerDeathExplosion) {
          const color = this.players.get(msg.id)?.colorHex || '#FF0055';
          this.game.renderer.triggerDeathExplosion(new THREE.Vector3(msg.x, msg.y, 0), color);
        }
      }
    }
  }

  broadcast(msg) {
    if (this.isHost) {
      for (const conn of this.connections.values()) {
        if (conn.open) conn.send(msg);
      }
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(msg);
    }
  }

  broadcastToOthers(excludePeerId, msg) {
    if (!this.isHost) return;
    for (const [peerId, conn] of this.connections.entries()) {
      if (peerId !== excludePeerId && conn.open) {
        conn.send(msg);
      }
    }
  }

  broadcastRoster() {
    this.broadcast({
      type: 'roster_update',
      roster: Array.from(this.players.values())
    });
  }

  requestStartRace() {
    if (this.isHost) {
      const startTime = Date.now() + 3200;
      this.broadcast({
        type: 'start_race',
        startTime: startTime
      });
      this.game.triggerSyncedCountdown(startTime);
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send({ type: 'request_start_race' });
    }
  }

  sendLocalTransform(x, y, vy, rot, vehicle, isAlive, progress) {
    const now = performance.now();
    if (now - this.lastSendTime < this.sendInterval) return;
    this.lastSendTime = now;

    const msg = {
      type: 'pos',
      id: this.localPlayerId,
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      vy: Number(vy.toFixed(2)),
      rot: Number(rot.toFixed(3)),
      vehicle: vehicle,
      isAlive: isAlive,
      progress: Number(progress.toFixed(1))
    };

    const local = this.players.get(this.localPlayerId);
    if (local) {
      local.x = x;
      local.y = y;
      local.progress = progress;
      local.isAlive = isAlive;
    }

    this.broadcast(msg);
  }

  sendCrashEvent(x, y) {
    this.broadcast({
      type: 'crash',
      id: this.localPlayerId,
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2))
    });
  }

  notifyRosterChanged() {
    if (this.game && typeof this.game.onMultiplayerRosterUpdated === 'function') {
      this.game.onMultiplayerRosterUpdated(Array.from(this.players.values()));
    }
  }

  updateStatusPill(text, className) {
    const pill = document.getElementById('lobby-connection-status');
    if (pill) {
      pill.textContent = text;
      pill.className = 'connection-status-pill ' + className;
    }
  }
}
