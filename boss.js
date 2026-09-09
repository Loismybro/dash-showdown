// boss.js - Dash Showdown 3D Interactive Cyber Boss Engine: V.E.X.O.R. The Quantum Core
// Features multi-phase state machine, telegraphed death lasers, homing plasma mines, and counter-attack missile salvos.

import { audio } from './audio.js';

export class BossManager {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.active = false;
    this.bossMesh = null;
    this.coreMesh = null;
    this.irisMesh = null;
    this.innerSphere = null;
    this.statorRings = [];
    this.cannons = [];
    this.wingProngs = [];

    // Boss Combat State
    this.maxHp = 100;
    this.hp = 100;
    this.phase = 1; // 1: Stable, 2: Enraged, 3: Meltdown, 4: Defeated
    this.state = 'dormant'; // 'dormant', 'intro', 'fighting', 'defeated'
    this.introTimer = 0;
    this.flashTimer = 0;

    // Attack State & Timers
    this.attackTimer = 2.0;
    this.activeLasers = [];       // { startX, endX, y, thickness, isCharging, chargeTimer, fireTimer, mesh, lineMesh }
    this.plasmaMines = [];        // { mesh, x, y, vy, life }
    this.counterMissiles = [];    // { mesh, x, y, vx, vy, targetX, targetY, life }
    this.debrisParticles = [];

    // DOM HUD Cache
    this.bossHud = document.getElementById('boss-hud');
    this.bossHpFill = document.getElementById('boss-hp-fill');
    this.bossHpGhost = document.getElementById('boss-hp-ghost');
    this.bossHpNum = document.getElementById('boss-hp-num');
    this.bossPhaseBadge = document.getElementById('boss-phase');
    this.warningBanner = document.getElementById('boss-warning-banner');

    this.initMesh();
  }

  initMesh() {
    this.bossMesh = new THREE.Group();
    this.bossMesh.visible = false;

    // 1. Central Quantum Core: Dark Obsidian Icosahedron Eye
    const coreGeo = new THREE.IcosahedronGeometry(1.6, 1);
    this.coreMat = new THREE.MeshStandardMaterial({
      color: 0x050a16,
      roughness: 0.15,
      metalness: 0.95,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.5
    });
    this.coreMesh = new THREE.Mesh(coreGeo, this.coreMat);
    this.bossMesh.add(this.coreMesh);

    // Wireframe Cage for the Core
    const wireGeo = new THREE.WireframeGeometry(coreGeo);
    this.coreWireMat = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
    const wire = new THREE.LineSegments(wireGeo, this.coreWireMat);
    this.coreMesh.add(wire);

    // Inner Pulsing Plasma Core
    const innerGeo = new THREE.SphereGeometry(0.85, 16, 16);
    this.innerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    this.innerSphere = new THREE.Mesh(innerGeo, this.innerMat);
    this.bossMesh.add(this.innerSphere);

    // Glowing Cyber Iris Disc (Pupil looking down track)
    const irisGeo = new THREE.RingGeometry(0.3, 0.7, 24);
    this.irisMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide
    });
    this.irisMesh = new THREE.Mesh(irisGeo, this.irisMat);
    this.irisMesh.rotation.y = Math.PI / 2;
    this.irisMesh.position.x = -1.62;
    this.bossMesh.add(this.irisMesh);

    // 2. Concentric Gyroscope Stator Rings
    const ringColors = [0x00f0ff, 0xd500f9, 0xffaa00];
    const ringRadii = [2.2, 2.75, 3.3];
    for (let r = 0; r < 3; r++) {
      const ringGroup = new THREE.Group();
      const rGeo = new THREE.TorusGeometry(ringRadii[r], 0.12, 10, 36);
      const rMat = new THREE.MeshStandardMaterial({
        color: 0x0a1424,
        emissive: ringColors[r],
        emissiveIntensity: 0.7,
        metalness: 0.9,
        roughness: 0.2
      });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      ringGroup.add(rMesh);

      // Capacitor nodes on each ring
      for (let n = 0; n < 4; n++) {
        const node = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.28, 0.4),
          new THREE.MeshBasicMaterial({ color: ringColors[r] })
        );
        const a = (n / 4) * Math.PI * 2;
        node.position.set(Math.cos(a) * ringRadii[r], Math.sin(a) * ringRadii[r], 0);
        ringGroup.add(node);
      }

      this.bossMesh.add(ringGroup);
      this.statorRings.push({
        group: ringGroup,
        speedX: (r === 0 ? 1.5 : (r === 1 ? -1.8 : 2.2)),
        speedY: (r === 1 ? 1.2 : -1.4),
        speedZ: (r === 2 ? 1.6 : -1.1)
      });
    }

    // 3. Lateral Twin Death Laser Cannons
    [-2.2, 2.2].forEach((zOffset, idx) => {
      const cannonGroup = new THREE.Group();
      cannonGroup.position.set(-0.8, -0.6, zOffset);

      // Heavy Gunmetal Barrel
      const barrelGeo = new THREE.CylinderGeometry(0.35, 0.45, 2.6, 12);
      const barrelMat = new THREE.MeshStandardMaterial({
        color: 0x060c16,
        metalness: 0.95,
        roughness: 0.15
      });
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.rotation.z = Math.PI / 2;
      cannonGroup.add(barrel);

      // Cannon Emitter Muzzle Ring
      const muzzleGeo = new THREE.TorusGeometry(0.38, 0.08, 8, 20);
      const muzzleMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
      const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
      muzzle.rotation.y = Math.PI / 2;
      muzzle.position.x = -1.35;
      cannonGroup.add(muzzle);

      this.bossMesh.add(cannonGroup);
      this.cannons.push(cannonGroup);
    });

    // 4. Ambient Point Light inside Boss Core
    this.bossLight = new THREE.PointLight(0x00f0ff, 4.5, 30);
    this.bossMesh.add(this.bossLight);

    this.scene.add(this.bossMesh);
  }

  // Awakening Trigger (Act III Entry)
  spawnBoss(startX, startY = 5.0) {
    this.active = true;
    this.state = 'intro';
    this.introTimer = 1.8;
    this.hp = this.maxHp;
    this.phase = 1;
    this.attackTimer = 2.2;

    this.bossMesh.position.set(startX + 22, startY + 6.0, 0);
    this.bossMesh.visible = true;
    this.bossMesh.scale.set(0.2, 0.2, 0.2);

    // Audio Alert
    audio.playBossAlert();
    if (this.renderer && this.renderer.triggerScreenFlash) {
      this.renderer.triggerScreenFlash(0.6);
    }
    this.renderer.cameraTrauma = Math.max(this.renderer.cameraTrauma, 0.6);

    // Show Boss HUD & Intro Warning
    if (this.bossHud) this.bossHud.style.display = 'flex';
    if (this.warningBanner) {
      this.warningBanner.textContent = "⚠ WARNING: V.E.X.O.R. THE QUANTUM CORE AWAKENED ⚠";
      this.warningBanner.style.display = 'block';
      setTimeout(() => {
        if (this.warningBanner) this.warningBanner.style.display = 'none';
      }, 2500);
    }
    this.updateHUD();
  }

  update(dt, player, levelSpeed) {
    if (!this.active) return;
    const time = this.renderer.clock ? this.renderer.clock.getElapsedTime() : Date.now() * 0.001;

    // Intro Entrance Animation
    if (this.state === 'intro') {
      this.introTimer -= dt;
      const t = Math.max(0, this.introTimer / 1.8);
      // Swoop in smoothly ahead of player
      const targetX = player.x + 18.0;
      const targetY = 5.0;
      this.bossMesh.position.x += (targetX - this.bossMesh.position.x) * Math.min(1, 5.0 * dt);
      this.bossMesh.position.y += (targetY - this.bossMesh.position.y) * Math.min(1, 5.0 * dt);
      const curScale = 1.0 - t * 0.8;
      this.bossMesh.scale.set(curScale, curScale, curScale);

      if (this.introTimer <= 0) {
        this.state = 'fighting';
        this.bossMesh.scale.set(1.0, 1.0, 1.0);
      }
    }
    else if (this.state === 'fighting') {
      // Hover ahead of player with dynamic floating oscillation
      const hoverDistance = 17.5;
      const targetX = player.x + hoverDistance;
      const targetY = 4.8 + Math.sin(time * 2.2) * 1.6;
      this.bossMesh.position.x += (targetX - this.bossMesh.position.x) * Math.min(1, 8.0 * dt);
      this.bossMesh.position.y += (targetY - this.bossMesh.position.y) * Math.min(1, 4.0 * dt);

      // Attack Loop Management
      this.updateAttacks(dt, player);
    }
    else if (this.state === 'defeated') {
      // Defeated Meltdown: Shrink, shake, fracture
      this.bossMesh.position.x += (player.x + 16 - this.bossMesh.position.x) * Math.min(1, 4.0 * dt);
      this.bossMesh.position.y -= dt * 1.5;
      this.bossMesh.rotation.z += dt * 8.0;
      const s = Math.max(0, this.bossMesh.scale.x - dt * 0.4);
      this.bossMesh.scale.set(s, s, s);
      if (s <= 0.05) {
        this.bossMesh.visible = false;
        this.active = false;
      }
    }

    // Gyroscope Stator Rings Rotation
    const phaseSpeedMult = (this.phase === 1) ? 1.0 : (this.phase === 2 ? 2.2 : 3.5);
    this.statorRings.forEach(r => {
      r.group.rotation.x += dt * r.speedX * phaseSpeedMult;
      r.group.rotation.y += dt * r.speedY * phaseSpeedMult;
      r.group.rotation.z += dt * r.speedZ * phaseSpeedMult;
    });

    // Core Pulse & Hit Flash Handling
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      this.coreMat.emissive.setHex(0xffffff);
      this.coreMat.emissiveIntensity = 2.5;
    } else {
      const coreColor = (this.phase === 1) ? 0x00f0ff : (this.phase === 2 ? 0xff0055 : 0xff3300);
      this.coreMat.emissive.setHex(coreColor);
      this.coreMat.emissiveIntensity = 0.6 + Math.sin(time * 8) * 0.35;
    }

    // Inner Plasma Sphere Pulse
    const pulseS = 0.9 + Math.sin(time * 12) * 0.15;
    this.innerSphere.scale.set(pulseS, pulseS, pulseS);

    // Update active lasers
    this.updateActiveLasers(dt, player);

    // Update counter missiles
    this.updateCounterMissiles(dt);

    // Update debris particles
    this.updateDebris(dt);
  }

  updateAttacks(dt, player) {
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      if (this.phase === 1) {
        // Phase 1: Telegraphed Single Laser (Charges 1.1s, fires 0.7s)
        const laserY = (Math.random() > 0.5) ? 1.5 : 5.5;
        this.spawnTelegraphLaser(laserY, 1.1, 0.75, 1.8);
        this.attackTimer = 3.6;
      }
      else if (this.phase === 2) {
        // Phase 2: Dual Crossfire Lasers (Top & Bottom beams, middle corridor is safe!)
        this.spawnTelegraphLaser(1.2, 0.95, 0.85, 1.8);
        this.spawnTelegraphLaser(6.8, 0.95, 0.85, 1.8);
        this.attackTimer = 3.2;
      }
      else if (this.phase === 3) {
        // Phase 3 Meltdown: Rapid Sweeps
        const laserY = 2.0 + Math.random() * 4.5;
        this.spawnTelegraphLaser(laserY, 0.75, 0.65, 2.2);
        this.attackTimer = 2.4;
      }
    }
  }

  // Spawn Telegraphed Laser Cannon Beam
  spawnTelegraphLaser(targetY, chargeDuration = 1.1, fireDuration = 0.75, thickness = 1.8) {
    audio.playLaserCharge();

    // 1. Aiming Telegraph Line (Thin Red Pulsing Line across track)
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array([-100, targetY, 0, 100, targetY, 0]);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xff0044,
      transparent: true,
      opacity: 0.75,
      linewidth: 2
    });
    const lineMesh = new THREE.Line(lineGeo, lineMat);
    this.scene.add(lineMesh);

    // 2. Lethal Beam Cylinder Mesh (Hidden during charge, active during fire)
    const beamLength = 80;
    const beamGeo = new THREE.CylinderGeometry(thickness / 2, thickness / 2, beamLength, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: (this.phase === 1) ? 0xff0055 : 0xff1100,
      transparent: true,
      opacity: 0.85
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.rotation.z = Math.PI / 2;
    beamMesh.visible = false;
    this.scene.add(beamMesh);

    // Inner White-Hot Laser Core
    const coreBeamGeo = new THREE.CylinderGeometry(thickness * 0.25, thickness * 0.25, beamLength, 12);
    const coreBeamMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const coreBeam = new THREE.Mesh(coreBeamGeo, coreBeamMat);
    coreBeam.rotation.z = Math.PI / 2;
    beamMesh.add(coreBeam);

    this.activeLasers.push({
      targetY,
      thickness,
      chargeDuration,
      fireDuration,
      timer: 0,
      isFiring: false,
      lineMesh,
      beamMesh
    });

    // Alert Banner on HUD
    if (this.warningBanner) {
      this.warningBanner.textContent = "⚠ DEATH LASER LOCK-ON // EVADE NOW ⚠";
      this.warningBanner.style.display = 'block';
      setTimeout(() => {
        if (this.warningBanner && this.warningBanner.textContent.includes("DEATH LASER")) {
          this.warningBanner.style.display = 'none';
        }
      }, chargeDuration * 1000);
    }
  }

  updateActiveLasers(dt, player) {
    for (let i = this.activeLasers.length - 1; i >= 0; i--) {
      const laser = this.activeLasers[i];
      laser.timer += dt;

      // Follow player along X-axis
      laser.lineMesh.position.x = player.x;
      laser.beamMesh.position.x = player.x;
      laser.lineMesh.position.y = laser.targetY;
      laser.beamMesh.position.y = laser.targetY;

      if (!laser.isFiring) {
        // Charging phase: flicker aiming line
        laser.lineMesh.visible = (Math.sin(laser.timer * 35) > -0.4);
        if (laser.timer >= laser.chargeDuration) {
          // Switch to Firing Lethal Beam!
          laser.isFiring = true;
          laser.lineMesh.visible = false;
          laser.beamMesh.visible = true;
          audio.playLaserFire();
          this.renderer.cameraTrauma = Math.max(this.renderer.cameraTrauma, 0.45);
        }
      } else {
        // Firing phase
        const fireProgress = (laser.timer - laser.chargeDuration) / laser.fireDuration;
        const beamScale = 1.0 + Math.sin(fireProgress * Math.PI) * 0.25;
        laser.beamMesh.scale.set(beamScale, 1, beamScale);

        if (fireProgress >= 1.0) {
          // Clean up laser
          this.scene.remove(laser.lineMesh);
          this.scene.remove(laser.beamMesh);
          laser.lineMesh.geometry.dispose();
          laser.beamMesh.geometry.dispose();
          this.activeLasers.splice(i, 1);
        }
      }
    }
  }

  // Launch Player Counter-Attack Photon Torpedo
  fireCounterMissile(startX, startY) {
    if (!this.active || this.state === 'defeated') return;

    audio.playCounterAttack();

    const missileGroup = new THREE.Group();
    // Missile Fuselage
    const mGeo = new THREE.ConeGeometry(0.28, 1.1, 8);
    const mMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const mMesh = new THREE.Mesh(mGeo, mMat);
    mMesh.rotation.z = -Math.PI / 2;
    missileGroup.add(mMesh);

    // Glowing Trail Core
    const glowGeo = new THREE.SphereGeometry(0.22, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.x = -0.55;
    missileGroup.add(glow);

    missileGroup.position.set(startX, startY, 0);
    this.scene.add(missileGroup);

    this.counterMissiles.push({
      mesh: missileGroup,
      x: startX,
      y: startY,
      speed: 36.0,
      life: 1.2
    });
  }

  updateCounterMissiles(dt) {
    const bx = this.bossMesh.position.x;
    const by = this.bossMesh.position.y;

    for (let i = this.counterMissiles.length - 1; i >= 0; i--) {
      const m = this.counterMissiles[i];
      m.life -= dt;

      // Home directly toward Boss Core
      const dx = bx - m.x;
      const dy = by - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1.8 || m.life <= 0) {
        // Direct Impact!
        this.scene.remove(m.mesh);
        m.mesh.geometry?.dispose();
        this.counterMissiles.splice(i, 1);

        if (dist < 2.5) {
          this.damageBoss(14);
        }
      } else {
        const nx = dx / dist;
        const ny = dy / dist;
        m.x += nx * m.speed * dt;
        m.y += ny * m.speed * dt;
        m.mesh.position.set(m.x, m.y, 0);
        m.mesh.rotation.z = Math.atan2(ny, nx);
      }
    }
  }

  // Inflict Damage on Boss
  damageBoss(amount = 14) {
    if (this.state === 'defeated') return;

    this.hp = Math.max(0, this.hp - amount);
    this.flashTimer = 0.16;
    audio.playBossHit();
    this.renderer.cameraTrauma = Math.max(this.renderer.cameraTrauma, 0.42);
    this.renderer.triggerShockwave(this.bossMesh.position.x, this.bossMesh.position.y, 0xffaa00, 3.8);

    // Spawn Impact Debris Shards
    this.spawnHitDebris(this.bossMesh.position.x, this.bossMesh.position.y);

    // Check Phase Transitions
    if (this.hp <= 0) {
      this.defeatBoss();
    } else if (this.hp <= 25 && this.phase < 3) {
      this.phase = 3;
      audio.playBossAlert();
      this.attackTimer = 1.2;
      if (this.warningBanner) {
        this.warningBanner.textContent = "⚡ CRITICAL MELTDOWN // CORE INSTABILITY ⚡";
        this.warningBanner.style.display = 'block';
        setTimeout(() => { if (this.warningBanner) this.warningBanner.style.display = 'none'; }, 2000);
      }
    } else if (this.hp <= 60 && this.phase < 2) {
      this.phase = 2;
      audio.playBossAlert();
      this.attackTimer = 1.5;
      if (this.warningBanner) {
        this.warningBanner.textContent = "⚡ OVERDRIVE ENGAGED // DUAL CROSSFIRE ACTIVE ⚡";
        this.warningBanner.style.display = 'block';
        setTimeout(() => { if (this.warningBanner) this.warningBanner.style.display = 'none'; }, 2000);
      }
    }

    this.updateHUD();
  }

  defeatBoss() {
    this.state = 'defeated';
    this.phase = 4;
    audio.playBossExplode();
    this.renderer.cameraTrauma = 1.0;
    if (this.renderer && this.renderer.triggerScreenFlash) {
      this.renderer.triggerScreenFlash(1.0);
    }
    this.renderer.triggerShockwave(this.bossMesh.position.x, this.bossMesh.position.y, 0xffffff, 9.0);

    // Clear active attacks
    this.activeLasers.forEach(l => {
      this.scene.remove(l.lineMesh);
      this.scene.remove(l.beamMesh);
    });
    this.activeLasers = [];

    // Massive Explosion Shards
    for (let s = 0; s < 45; s++) {
      this.spawnHitDebris(this.bossMesh.position.x, this.bossMesh.position.y, 14.0);
    }

    // Hide Boss HUD & Announce Victory
    if (this.warningBanner) {
      this.warningBanner.textContent = "🏆 V.E.X.O.R. QUANTUM CORE DESTROYED // ESCAPE NOW! 🏆";
      this.warningBanner.style.display = 'block';
      setTimeout(() => {
        if (this.warningBanner) this.warningBanner.style.display = 'none';
        if (this.bossHud) this.bossHud.style.display = 'none';
      }, 3500);
    }
  }

  spawnHitDebris(x, y, speedMult = 8.0) {
    const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const mat = new THREE.MeshBasicMaterial({
      color: (Math.random() > 0.5) ? 0x00ffff : 0xff0055
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, (Math.random() - 0.5) * 1.5);
    this.scene.add(mesh);

    const angle = Math.random() * Math.PI * 2;
    const spd = (Math.random() * 0.8 + 0.4) * speedMult;
    this.debrisParticles.push({
      mesh,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      vz: (Math.random() - 0.5) * 4.0,
      life: 0.85
    });
  }

  updateDebris(dt) {
    for (let i = this.debrisParticles.length - 1; i >= 0; i--) {
      const d = this.debrisParticles[i];
      d.life -= dt;
      if (d.life <= 0) {
        this.scene.remove(d.mesh);
        d.mesh.geometry?.dispose();
        this.debrisParticles.splice(i, 1);
      } else {
        d.mesh.position.x += d.vx * dt;
        d.mesh.position.y += d.vy * dt;
        d.mesh.position.z += d.vz * dt;
        d.mesh.rotation.x += dt * 6;
        d.mesh.rotation.y += dt * 6;
        const s = d.life / 0.85;
        d.mesh.scale.set(s, s, s);
      }
    }
  }

  // Lethal Laser / Hazard Collision Check against Player
  checkCollision(px, py, radius = 0.45) {
    if (!this.active || this.state === 'defeated') return false;

    // Check firing death lasers
    for (let i = 0; i < this.activeLasers.length; i++) {
      const laser = this.activeLasers[i];
      if (laser.isFiring) {
        const halfThick = laser.thickness / 2;
        if (py + radius >= laser.targetY - halfThick && py - radius <= laser.targetY + halfThick) {
          return { hit: true, type: 'laser' };
        }
      }
    }

    // Check direct collision with Boss Hull
    const bx = this.bossMesh.position.x;
    const by = this.bossMesh.position.y;
    const dx = px - bx;
    const dy = py - by;
    if (Math.sqrt(dx * dx + dy * dy) < 2.6) {
      return { hit: true, type: 'boss_body' };
    }

    return false;
  }

  updateHUD() {
    const pct = Math.max(0, Math.min(100, Math.round((this.hp / this.maxHp) * 100)));
    if (this.bossHpNum) this.bossHpNum.textContent = `${pct}%`;
    if (this.bossHpFill) this.bossHpFill.style.width = `${pct}%`;
    if (this.bossHpGhost) {
      setTimeout(() => {
        if (this.bossHpGhost) this.bossHpGhost.style.width = `${pct}%`;
      }, 250);
    }
    if (this.bossPhaseBadge) {
      if (this.phase === 1) {
        this.bossPhaseBadge.textContent = "PHASE 1: QUANTUM STABLE";
        this.bossPhaseBadge.style.color = "#00ff88";
      } else if (this.phase === 2) {
        this.bossPhaseBadge.textContent = "PHASE 2: OVERCLOCK ENRAGED";
        this.bossPhaseBadge.style.color = "#ffaa00";
      } else if (this.phase === 3) {
        this.bossPhaseBadge.textContent = "PHASE 3: CORE MELTDOWN";
        this.bossPhaseBadge.style.color = "#ff0055";
      } else {
        this.bossPhaseBadge.textContent = "OFFLINE: DEFEATED";
        this.bossPhaseBadge.style.color = "#888888";
      }
    }
  }

  reset() {
    this.active = false;
    this.state = 'dormant';
    this.hp = this.maxHp;
    this.phase = 1;
    this.bossMesh.visible = false;

    // Clean up lasers
    this.activeLasers.forEach(l => {
      this.scene.remove(l.lineMesh);
      this.scene.remove(l.beamMesh);
    });
    this.activeLasers = [];

    // Clean up missiles
    this.counterMissiles.forEach(m => {
      this.scene.remove(m.mesh);
    });
    this.counterMissiles = [];

    // Clean up debris
    this.debrisParticles.forEach(d => {
      this.scene.remove(d.mesh);
    });
    this.debrisParticles = [];

    if (this.bossHud) this.bossHud.style.display = 'none';
    if (this.warningBanner) this.warningBanner.style.display = 'none';
  }
}
