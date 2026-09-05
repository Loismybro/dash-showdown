// scenery.js - High-End Procedural Parallax Scenery Engine for Dash Showdown

export class SceneryManager {
  constructor(scene) {
    this.scene = scene;
    this.currentLevelId = null;

    // Groups for parallax layers
    this.sceneryGroup = new THREE.Group();
    this.scene.add(this.sceneryGroup);

    this.layers = [];
    this.animatedElements = [];
    this.particleSystems = [];

    // Pre-create canvas texture generators
    this.canvasFar = document.createElement('canvas');
    this.canvasMid = document.createElement('canvas');
    this.canvasNear = document.createElement('canvas');

    // Colourmaxed Pixelated Dynamic Day/Night Cycle Sky Engine
    this.pixelSkyCanvas = document.createElement('canvas');
    this.pixelSkyCanvas.width = 480;
    this.pixelSkyCanvas.height = 270;
    this.pixelSkyCtx = this.pixelSkyCanvas.getContext('2d');
    this.pixelSkyTexture = new THREE.CanvasTexture(this.pixelSkyCanvas);
    this.pixelSkyTexture.minFilter = THREE.NearestFilter;
    this.pixelSkyTexture.magFilter = THREE.NearestFilter;
    this.pixelSkyTexture.generateMipmaps = false;
    this.pixelSkyMesh = null;

    // Pre-seeded pixel stars for crisp pixel art aesthetic
    this.pixelStars = [];
    for (let i = 0; i < 140; i++) {
      this.pixelStars.push({
        x: Math.floor(Math.random() * 480),
        y: Math.floor(Math.random() * 190),
        size: Math.random() > 0.75 ? 3 : 2,
        color: ['#ffffff', '#00f0ff', '#ff007f', '#ffe600', '#00ff88'][Math.floor(Math.random() * 5)],
        twinkleSpeed: Math.random() * 3 + 1.5,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }

    // Pre-seeded chunky pixel clouds
    this.pixelClouds = [
      { x: 30, y: 55, w: 76, h: 24, speed: 6 },
      { x: 160, y: 35, w: 92, h: 28, speed: 8 },
      { x: 310, y: 70, w: 68, h: 20, speed: 5 },
      { x: 430, y: 45, w: 86, h: 26, speed: 7 }
    ];
    this.flashColor = null;
    this.flashIntensity = 0;
  }

  triggerObstacleFlash(colorHex = 0xffffff, intensity = 1.0) {
    this.flashColor = colorHex;
    this.flashIntensity = Math.min(1.0, intensity);
  }

  setupDayNightPixelSky() {
    const geo = new THREE.PlaneGeometry(420, 160);
    const mat = new THREE.MeshBasicMaterial({
      map: this.pixelSkyTexture,
      depthWrite: false
    });
    this.pixelSkyMesh = new THREE.Mesh(geo, mat);
    this.pixelSkyMesh.position.set(60, 46, -125);
    this.sceneryGroup.add(this.pixelSkyMesh);
  }

  renderPixelSky(playerX, progressRatio = 0, time = 0, delta = 0.016) {
    const ctx = this.pixelSkyCtx;
    if (!ctx) return;
    const W = 480, H = 270;

    // Decay flash
    if (this.flashIntensity > 0) {
      this.flashIntensity = Math.max(0, this.flashIntensity - delta * 3.5);
    }

    const themeType = (this.currentLevel && this.currentLevel.themeType) || 
                      (this.currentLevelId === 1 ? 'gothic' : (this.currentLevelId === 2 ? 'fairyland' : (this.currentLevelId === 3 ? 'shark' : 'cyber')));

    // 4 Progressive Obstacle Zones per Theme
    let zones = [];
    if (themeType === 'gothic') {
      zones = [
        { zenith: [14, 5, 20], mid: [32, 10, 45], horizon: [64, 15, 60], fog: 0x12061a },
        { zenith: [28, 4, 16], mid: [85, 12, 35], horizon: [160, 20, 45], fog: 0x24050e },
        { zenith: [20, 6, 42], mid: [60, 16, 95], horizon: [130, 30, 180], fog: 0x190829 },
        { zenith: [45, 8, 12], mid: [140, 25, 20], horizon: [255, 60, 20], fog: 0x330806 }
      ];
    } else if (themeType === 'fairyland') {
      zones = [
        { zenith: [60, 120, 180], mid: [140, 190, 230], horizon: [240, 200, 220], fog: 0x14283b },
        { zenith: [75, 40, 120], mid: [180, 80, 160], horizon: [255, 140, 180], fog: 0x2e1236 },
        { zenith: [25, 15, 60], mid: [80, 45, 130], horizon: [0, 220, 180], fog: 0x120d2b },
        { zenith: [40, 10, 80], mid: [160, 40, 140], horizon: [0, 255, 136], fog: 0x190b2e }
      ];
    } else if (themeType === 'shark') {
      zones = [
        { zenith: [0, 90, 140], mid: [0, 160, 200], horizon: [60, 230, 240], fog: 0x05283b },
        { zenith: [2, 20, 60], mid: [5, 50, 110], horizon: [10, 110, 180], fog: 0x03132e },
        { zenith: [1, 5, 20], mid: [2, 18, 45], horizon: [0, 80, 90], fog: 0x020a17 },
        { zenith: [20, 25, 5], mid: [120, 100, 20], horizon: [255, 200, 50], fog: 0x261e05 }
      ];
    } else {
      zones = [
        { zenith: [10, 8, 30], mid: [25, 20, 75], horizon: [0, 180, 255], fog: 0x0a0c24 },
        { zenith: [25, 5, 50], mid: [80, 10, 120], horizon: [255, 0, 128], fog: 0x1f062b },
        { zenith: [5, 25, 20], mid: [10, 70, 50], horizon: [0, 255, 136], fog: 0x062118 },
        { zenith: [40, 0, 40], mid: [140, 0, 90], horizon: [255, 0, 80], fog: 0x2e001f }
      ];
    }

    // Progression interpolation (0 to 3)
    const clampedProgress = Math.max(0, Math.min(0.999, progressRatio));
    const rawZone = clampedProgress * 3;
    const zIdx = Math.floor(rawZone);
    const nextZIdx = Math.min(3, zIdx + 1);
    const zFactor = rawZone - zIdx;

    const cur = zones[zIdx];
    const nxt = zones[nextZIdx];

    const lerp = (a, b, f) => Math.round(a + (b - a) * f);
    let zR = lerp(cur.zenith[0], nxt.zenith[0], zFactor);
    let zG = lerp(cur.zenith[1], nxt.zenith[1], zFactor);
    let zB = lerp(cur.zenith[2], nxt.zenith[2], zFactor);

    let mR = lerp(cur.mid[0], nxt.mid[0], zFactor);
    let mG = lerp(cur.mid[1], nxt.mid[1], zFactor);
    let mB = lerp(cur.mid[2], nxt.mid[2], zFactor);

    let hR = lerp(cur.horizon[0], nxt.horizon[0], zFactor);
    let hG = lerp(cur.horizon[1], nxt.horizon[1], zFactor);
    let hB = lerp(cur.horizon[2], nxt.horizon[2], zFactor);

    // Obstacle flash burst
    if (this.flashIntensity > 0) {
      const flashHex = this.flashColor || 0xffffff;
      const fR = (flashHex >> 16) & 255;
      const fG = (flashHex >> 8) & 255;
      const fB = flashHex & 255;
      const fi = this.flashIntensity * 0.45;
      zR = lerp(zR, fR, fi); zG = lerp(zG, fG, fi); zB = lerp(zB, fB, fi);
      mR = lerp(mR, fR, fi); mG = lerp(mG, fG, fi); mB = lerp(mB, fB, fi);
      hR = lerp(hR, fR, fi); hG = lerp(hG, fG, fi); hB = lerp(hB, fB, fi);
    }

    // 1. Render Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0.0, `rgb(${zR},${zG},${zB})`);
    skyGrad.addColorStop(0.55, `rgb(${mR},${mG},${mB})`);
    skyGrad.addColorStop(1.0, `rgb(${hR},${hG},${hB})`);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    const t = (progressRatio * 0.75 + (time * 0.02)) % 1.0;

    // 2. Stars Visibility (max at night)
    let nightFactor = 0;
    if (t >= 0.65 && t < 0.95) {
      nightFactor = 1.0;
    } else if (t >= 0.50 && t < 0.65) {
      nightFactor = (t - 0.50) / 0.15;
    } else if (t >= 0.95 || t < 0.10) {
      nightFactor = t >= 0.95 ? 1.0 - (t - 0.95) / 0.15 : 1.0 - (t + 0.05) / 0.15;
    }
    nightFactor = Math.max(0, Math.min(1, nightFactor));

    if (nightFactor > 0.04) {
      this.pixelStars.forEach(s => {
        const tw = 0.5 + Math.sin(time * s.twinkleSpeed + s.twinklePhase) * 0.5;
        ctx.globalAlpha = tw * nightFactor;
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });
      ctx.globalAlpha = 1.0;
    }

    // 3. Waving Aurora Borealis Curtains (Active in Night & Dusk)
    if (nightFactor > 0.18) {
      const aAlpha = nightFactor * 0.42;
      for (let band = 0; band < 2; band++) {
        ctx.fillStyle = (band === 0 ? `rgba(0, 255, 136, ${aAlpha})` : `rgba(213, 0, 249, ${aAlpha * 0.8})`);
        const freq = 0.02 + band * 0.012;
        const speed = 1.4 + band * 0.7;
        const baseH = 65 + band * 22;
        for (let x = 0; x < W; x += 4) {
          const y = baseH + Math.sin(x * freq + time * speed) * 18 + Math.cos(x * 0.035 - time * 0.9) * 12;
          const curtainH = 28 + Math.sin(x * 0.01 + time) * 10;
          ctx.fillRect(x, y, 4, curtainH);
        }
      }
    }

    // 4. Celestial Bodies (Sun and Moon)
    // Sun arc: active from Dawn (0.95) through Day to Dusk (0.65)
    let sunActive = false;
    let sunProgress = 0;
    if (t >= 0.95 || t < 0.65) {
      sunActive = true;
      sunProgress = (t >= 0.95 ? (t - 0.95) : (t + 0.05)) / 0.70; // 0 to 1
    }

    if (sunActive) {
      const sunAngle = sunProgress * Math.PI;
      const sunX = W * 0.88 - (W * 0.76) * sunProgress;
      const sunY = H * 0.76 - Math.sin(sunAngle) * (H * 0.58);

      // Check if Sun is in Dusk / Synthwave Sunset phase (0.48 <= t < 0.65)
      const isDusk = (t >= 0.48 && t < 0.65);

      if (isDusk) {
        // ── RETRO HORIZONTAL SLICED SYNTHWAVE SUN ──
        const sunR = 34;

        // Radiant glow
        const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, sunR * 2.4);
        glow.addColorStop(0, 'rgba(255, 230, 0, 0.6)');
        glow.addColorStop(0.5, 'rgba(255, 0, 128, 0.25)');
        glow.addColorStop(1, 'rgba(255, 0, 128, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR * 2.4, 0, Math.PI * 2);
        ctx.fill();

        // Vertical sunset gradient disc
        const discGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
        discGrad.addColorStop(0.0, '#ffee00');
        discGrad.addColorStop(0.5, '#ff4400');
        discGrad.addColorStop(1.0, '#ff007f');
        ctx.fillStyle = discGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
        ctx.fill();

        // Horizontal sliced retro bars across the lower half
        const stripeBg = `rgb(${hR},${hG},${hB})`;
        for (let s = 0; s < 5; s++) {
          const sy = sunY + 3 + s * 6;
          const sh = 2 + s * 0.6;
          ctx.fillStyle = stripeBg;
          ctx.fillRect(sunX - sunR - 4, sy, (sunR + 4) * 2, sh);
        }
      } else {
        // Bright Radiant Solar Disc (Day / Dawn)
        const sunR = 24;
        const sGrad = ctx.createRadialGradient(sunX, sunY, sunR * 0.3, sunX, sunY, sunR * 1.8);
        sGrad.addColorStop(0, '#ffffff');
        sGrad.addColorStop(0.6, 'rgba(255, 240, 180, 0.85)');
        sGrad.addColorStop(1, 'rgba(255, 200, 50, 0)');
        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR * 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Diamond solar rays
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fillRect(sunX - 2, sunY - sunR * 1.6, 4, sunR * 3.2);
        ctx.fillRect(sunX - sunR * 1.6, sunY - 2, sunR * 3.2, 4);
      }
    }

    // Moon arc: active from Dusk (0.45) through Night to Dawn (1.05 / 0.05)
    let moonActive = false;
    let moonProgress = 0;
    if (t >= 0.45 && t < 1.05) {
      moonActive = true;
      moonProgress = (t - 0.45) / 0.60; // 0 to 1
    }

    if (moonActive && nightFactor > 0.25) {
      const moonAngle = moonProgress * Math.PI;
      const moonX = W * 0.85 - (W * 0.72) * moonProgress;
      const moonY = H * 0.74 - Math.sin(moonAngle) * (H * 0.55);
      const moonR = 22;

      // Moon outer glow
      const mGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 2.0);
      mGlow.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
      mGlow.addColorStop(0.6, 'rgba(0, 240, 255, 0.08)');
      mGlow.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = mGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR * 2.0, 0, Math.PI * 2);
      ctx.fill();

      // Moon sphere
      ctx.fillStyle = '#e2eafc';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();

      // Pixel craters
      ctx.fillStyle = 'rgba(60, 80, 130, 0.35)';
      ctx.beginPath();
      ctx.arc(moonX - 6, moonY - 4, 7, 0, Math.PI * 2);
      ctx.arc(moonX + 8, moonY + 5, 5.5, 0, Math.PI * 2);
      ctx.arc(moonX - 3, moonY + 9, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Drifting Chunky Pixel Clouds
    const cloudColor = (t >= 0.25 && t < 0.50) ? 'rgba(255, 255, 255, 0.55)' :
                       (t >= 0.50 && t < 0.70) ? 'rgba(255, 120, 180, 0.45)' :
                       'rgba(140, 170, 220, 0.35)';
    ctx.fillStyle = cloudColor;
    this.pixelClouds.forEach(c => {
      const cx = (c.x + time * c.speed) % (W + c.w) - c.w;
      // Pixel cloud puffs
      ctx.fillRect(cx, c.y + 6, c.w, c.h - 6);
      ctx.fillRect(cx + 8, c.y, c.w - 16, c.h);
      ctx.fillRect(cx + 16, c.y - 4, c.w - 32, c.h);
    });

    // 6. Update Fog Color in Three.js Scene
    if (this.scene && this.scene.fog) {
      this.scene.fog.color.setRGB(hR / 255 * 0.25, hG / 255 * 0.25, hB / 255 * 0.25);
    }

    if (this.pixelSkyTexture) {
      this.pixelSkyTexture.needsUpdate = true;
    }
  }

  setupLevelScenery(level) {
    this.clearScenery();
    this.currentLevel = level;
    this.currentLevelId = level.id;

    // 1. Setup Colourmaxed Pixelated Dynamic Sky Plane (Layer 0 at Z = -125)
    this.setupDayNightPixelSky();

    // 2. Build Level Foreground & Midground Parallax Structures
    if (level.themeType === 'gothic' || level.id === 1) {
      this.buildMetropolisScenery();
    } else if (level.themeType === 'fairyland' || level.id === 2) {
      this.buildCyberForestScenery();
    } else if (level.themeType === 'shark' || level.id === 3) {
      this.buildInfernoCavernScenery();
    } else {
      this.buildQuantumNebulaScenery();
    }
  }

  clearScenery() {
    while (this.sceneryGroup.children.length > 0) {
      const obj = this.sceneryGroup.children[0];
      this.sceneryGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else {
          if (obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      }
    }
    this.layers = [];
    this.animatedElements = [];
    this.particleSystems = [];
  }

  // ═════════════════════════════════════════════════════════════════
  // LEVEL 1: CYBERPUNK METROPOLIS (Neon City Skyline & Aerocars)
  // ═════════════════════════════════════════════════════════════════
  buildMetropolisScenery() {
    const W = 2048, H = 1024;

    // ── LAYER 2: Distant Mega-Skyscrapers (Z = -80, speed = 0.12) ──
    const ctxMid = this.canvasMid;
    ctxMid.width = W; ctxMid.height = H;
    const gMid = ctxMid.getContext('2d');
    gMid.clearRect(0, 0, W, H);

    // Distant building silhouettes
    let bx = 0;
    while (bx < W) {
      const bw = Math.floor(Math.random() * 70 + 60);
      const bh = Math.floor(Math.random() * 380 + 220);
      const by = H - bh;

      // Silhouette gradient
      const bGrad = gMid.createLinearGradient(0, by, 0, H);
      bGrad.addColorStop(0, '#10152e');
      bGrad.addColorStop(1, '#050713');
      gMid.fillStyle = bGrad;
      gMid.fillRect(bx, by, bw, bh);

      // Antenna beacon
      gMid.strokeStyle = '#ff0055';
      gMid.lineWidth = 2;
      gMid.beginPath();
      gMid.moveTo(bx + bw / 2, by);
      gMid.lineTo(bx + bw / 2, by - 35);
      gMid.stroke();
      gMid.fillStyle = '#ff0055';
      gMid.beginPath();
      gMid.arc(bx + bw / 2, by - 35, 3, 0, Math.PI * 2);
      gMid.fill();

      // Distant micro windows
      gMid.fillStyle = 'rgba(0, 229, 255, 0.4)';
      for (let wy = by + 25; wy < H - 40; wy += 22) {
        for (let wx = bx + 10; wx < bx + bw - 10; wx += 14) {
          if (Math.random() > 0.4) {
            gMid.fillRect(wx, wy, 4, 8);
          }
        }
      }

      bx += bw - 8;
    }

    const texMid = new THREE.CanvasTexture(ctxMid);
    texMid.wrapS = THREE.RepeatWrapping;
    texMid.wrapT = THREE.ClampToEdgeWrapping;
    texMid.repeat.set(2, 1);

    const meshMid = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 100),
      new THREE.MeshBasicMaterial({ map: texMid, transparent: true, depthWrite: false })
    );
    meshMid.position.set(50, 30, -80);
    this.sceneryGroup.add(meshMid);
    this.layers.push({ mesh: meshMid, texture: texMid, speed: 0.0012, baseOffset: 0 });

    // ── LAYER 3: Detailed Cyberpunk City with Lit Windows & Neon Signs (Z = -50, speed = 0.32) ──
    const ctxNear = this.canvasNear;
    ctxNear.width = W; ctxNear.height = H;
    const gNear = ctxNear.getContext('2d');
    gNear.clearRect(0, 0, W, H);

    bx = 0;
    const neonColors = ['#00ffaa', '#ff007f', '#00e5ff', '#ffd600', '#b000ff'];
    const signs = ['DASH', 'OVERDRIVE', 'RHYTHM', 'BLITZ', 'CYBER', 'BEAT', 'PULSE'];

    while (bx < W) {
      const bw = Math.floor(Math.random() * 110 + 90);
      const bh = Math.floor(Math.random() * 450 + 260);
      const by = H - bh;

      // Dark metallic facade
      const fGrad = gNear.createLinearGradient(0, by, 0, H);
      fGrad.addColorStop(0, '#121936');
      fGrad.addColorStop(0.5, '#090d20');
      fGrad.addColorStop(1, '#02040b');
      gNear.fillStyle = fGrad;
      gNear.fillRect(bx, by, bw, bh);

      // Neon outline edges on building roof & sides
      gNear.strokeStyle = neonColors[Math.floor(Math.random() * neonColors.length)];
      gNear.lineWidth = 3;
      gNear.beginPath();
      gNear.moveTo(bx, by + bh);
      gNear.lineTo(bx, by);
      gNear.lineTo(bx + bw, by);
      gNear.lineTo(bx + bw, by + bh);
      gNear.stroke();

      // Dense pixelated glowing windows
      for (let wy = by + 30; wy < H - 30; wy += 18) {
        for (let wx = bx + 12; wx < bx + bw - 12; wx += 16) {
          const rand = Math.random();
          if (rand > 0.5) {
            gNear.fillStyle = rand > 0.85 ? '#ffd54f' : (rand > 0.7 ? '#00e5ff' : '#ff4081');
            gNear.fillRect(wx, wy, 7, 10);
          }
        }
      }

      // Vertical or Horizontal Holographic Neon Billboard
      if (Math.random() > 0.4 && bw > 95) {
        const signText = signs[Math.floor(Math.random() * signs.length)];
        const signCol = neonColors[Math.floor(Math.random() * neonColors.length)];
        const signY = by + Math.floor(Math.random() * 120 + 30);

        // Sign background plate
        gNear.fillStyle = 'rgba(5, 10, 25, 0.85)';
        gNear.fillRect(bx + 10, signY - 8, bw - 20, 36);
        gNear.strokeStyle = signCol;
        gNear.lineWidth = 2;
        gNear.strokeRect(bx + 10, signY - 8, bw - 20, 36);

        // Neon typography glow
        gNear.font = 'bold 20px monospace';
        gNear.textAlign = 'center';
        gNear.fillStyle = signCol;
        gNear.shadowColor = signCol;
        gNear.shadowBlur = 12;
        gNear.fillText(signText, bx + bw / 2, signY + 18);
        gNear.shadowBlur = 0;
      }

      bx += bw + 8;
    }

    const texNear = new THREE.CanvasTexture(ctxNear);
    texNear.wrapS = THREE.RepeatWrapping;
    texNear.wrapT = THREE.ClampToEdgeWrapping;
    texNear.repeat.set(2, 1);

    const meshNear = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 85),
      new THREE.MeshBasicMaterial({ map: texNear, transparent: true, depthWrite: false })
    );
    meshNear.position.set(40, 22, -50);
    this.sceneryGroup.add(meshNear);
    this.layers.push({ mesh: meshNear, texture: texNear, speed: 0.0032, baseOffset: 0 });

    // ── Searchlights sweeping the sky ──
    for (let s = 0; s < 3; s++) {
      const beamGeo = new THREE.ConeGeometry(8, 70, 16, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: [0x00e5ff, 0xff007f, 0x00ff88][s],
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(-20 + s * 55, 15, -75);
      beam.rotation.z = Math.PI - 0.2;
      this.sceneryGroup.add(beam);

      this.animatedElements.push((time) => {
        beam.rotation.z = Math.PI + Math.sin(time * 1.2 + s * 2) * 0.4;
      });
    }

    // ── Flying Aerocars with streak lights ──
    const aerocarGroup = new THREE.Group();
    aerocarGroup.position.set(0, 26, -55);
    for (let c = 0; c < 5; c++) {
      const carMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.4, 0.8),
        new THREE.MeshBasicMaterial({ color: 0x00e5ff })
      );
      const tailLight = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.3, 0.8),
        new THREE.MeshBasicMaterial({ color: 0xff0055 })
      );
      tailLight.position.x = -1.3;
      carMesh.add(tailLight);
      carMesh.position.set(c * 50, (c % 3) * 6, 0);
      aerocarGroup.add(carMesh);
    }
    this.sceneryGroup.add(aerocarGroup);
    this.animatedElements.push((time, delta) => {
      aerocarGroup.children.forEach(car => {
        car.position.x += delta * 22;
        if (car.position.x > 220) car.position.x = -120;
      });
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // LEVEL 2: CYBER FOREST & ALIEN MONOLITHS (Aurora Borealis & Ruins)
  // ═════════════════════════════════════════════════════════════════
  buildCyberForestScenery() {
    const W = 2048, H = 1024;

    // ── LAYER 1: Deep Violet Sky with Wavy Aurora Borealis (Z = -120) ──
    const ctxFar = this.canvasFar;
    ctxFar.width = W; ctxFar.height = H;
    const gFar = ctxFar.getContext('2d');

    gFar.clearRect(0, 0, W, H);

    // Aurora Borealis Curtains
    for (let a = 0; a < 3; a++) {
      gFar.beginPath();
      const aGrad = gFar.createLinearGradient(0, 100 + a * 120, 0, 450 + a * 120);
      aGrad.addColorStop(0, a % 2 === 0 ? 'rgba(0, 255, 170, 0.45)' : 'rgba(213, 0, 249, 0.4)');
      aGrad.addColorStop(1, 'rgba(0, 255, 170, 0)');
      gFar.fillStyle = aGrad;

      gFar.moveTo(0, 300);
      for (let x = 0; x <= W; x += 40) {
        const y = Math.sin(x * 0.005 + a * 2) * 80 + Math.sin(x * 0.012) * 45 + 240 + a * 60;
        gFar.lineTo(x, y);
      }
      gFar.lineTo(W, H);
      gFar.lineTo(0, H);
      gFar.closePath();
      gFar.fill();
    }

    // Alien twin moons
    gFar.fillStyle = '#ffd54f';
    gFar.beginPath();
    gFar.arc(W * 0.25, H * 0.25, 45, 0, Math.PI * 2);
    gFar.fill();

    gFar.fillStyle = '#ff80ab';
    gFar.beginPath();
    gFar.arc(W * 0.32, H * 0.33, 24, 0, Math.PI * 2);
    gFar.fill();

    const texFar = new THREE.CanvasTexture(ctxFar);
    texFar.wrapS = THREE.RepeatWrapping;
    texFar.repeat.set(2, 1);

    const meshFar = new THREE.Mesh(
      new THREE.PlaneGeometry(350, 130),
      new THREE.MeshBasicMaterial({ map: texFar, transparent: true, depthWrite: false })
    );
    meshFar.position.set(60, 45, -120);
    this.sceneryGroup.add(meshFar);
    this.layers.push({ mesh: meshFar, texture: texFar, speed: 0.00035, baseOffset: 0 });

    // ── LAYER 2 & 3: Crystalline Peaks & Glowing Monoliths (Z = -70 & -45) ──
    const ctxMid = this.canvasMid;
    ctxMid.width = W; ctxMid.height = H;
    const gMid = ctxMid.getContext('2d');
    gMid.clearRect(0, 0, W, H);

    // Crystalline Mountain Ridge
    gMid.fillStyle = '#100b22';
    gMid.beginPath();
    gMid.moveTo(0, H);
    for (let x = 0; x <= W; x += 50) {
      const my = Math.sin(x * 0.008) * 160 + Math.sin(x * 0.02) * 80 + H * 0.52;
      gMid.lineTo(x, my);
    }
    gMid.lineTo(W, H);
    gMid.closePath();
    gMid.fill();

    // Floating Alien Monoliths with glowing runes
    for (let m = 0; m < 12; m++) {
      const mx = m * 170 + 80;
      const my = Math.sin(m * 1.5) * 60 + H * 0.45;
      const mw = 36, mh = 110;

      gMid.fillStyle = '#1c1335';
      gMid.fillRect(mx - mw / 2, my - mh / 2, mw, mh);
      gMid.strokeStyle = '#00e5ff';
      gMid.lineWidth = 2;
      gMid.strokeRect(mx - mw / 2, my - mh / 2, mw, mh);

      // Glowing center rune
      gMid.fillStyle = '#ffd54f';
      gMid.shadowColor = '#ffd54f';
      gMid.shadowBlur = 10;
      gMid.fillRect(mx - 4, my - 30, 8, 60);
      gMid.shadowBlur = 0;
    }

    const texMid = new THREE.CanvasTexture(ctxMid);
    texMid.wrapS = THREE.RepeatWrapping;
    texMid.repeat.set(2, 1);

    const meshMid = new THREE.Mesh(
      new THREE.PlaneGeometry(280, 95),
      new THREE.MeshBasicMaterial({ map: texMid, transparent: true, depthWrite: false })
    );
    meshMid.position.set(50, 26, -70);
    this.sceneryGroup.add(meshMid);
    this.layers.push({ mesh: meshMid, texture: texMid, speed: 0.0016, baseOffset: 0 });

    // ── 3D Floating Crystals hovering in the background ──
    const crystalGeo = new THREE.OctahedronGeometry(2.2);
    for (let c = 0; c < 8; c++) {
      const cMat = new THREE.MeshStandardMaterial({
        color: c % 2 === 0 ? 0x00ffaa : 0xff00bb,
        emissive: c % 2 === 0 ? 0x008855 : 0x880066,
        roughness: 0.1,
        metalness: 0.9
      });
      const crystal = new THREE.Mesh(crystalGeo, cMat);
      crystal.position.set(c * 35 - 30, Math.sin(c * 1.8) * 6 + 14, -35);
      this.sceneryGroup.add(crystal);

      this.animatedElements.push((time, delta) => {
        crystal.rotation.y += delta * 1.2;
        crystal.rotation.x += delta * 0.8;
        crystal.position.y += Math.sin(time * 2 + c) * 0.02;
      });
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // LEVEL 3: INFERNO MOLTEN CAVERN (Lava Falls & Volcanic Spines)
  // ═════════════════════════════════════════════════════════════════
  buildInfernoCavernScenery() {
    const W = 2048, H = 1024;

    // ── LAYER 1: Deep Volcanic Glow & Magma Rift (Z = -120) ──
    const ctxFar = this.canvasFar;
    ctxFar.width = W; ctxFar.height = H;
    const gFar = ctxFar.getContext('2d');

    gFar.clearRect(0, 0, W, H);

    // Jagged volcanic ceiling stalactites & floor magma lake
    gFar.fillStyle = '#1a0408';
    gFar.beginPath();
    gFar.moveTo(0, 0);
    for (let x = 0; x <= W; x += 40) {
      const cy = Math.sin(x * 0.01) * 90 + Math.sin(x * 0.03) * 60 + 120;
      gFar.lineTo(x, cy);
    }
    gFar.lineTo(W, 0);
    gFar.closePath();
    gFar.fill();

    const texFar = new THREE.CanvasTexture(ctxFar);
    texFar.wrapS = THREE.RepeatWrapping;
    texFar.repeat.set(2, 1);

    const meshFar = new THREE.Mesh(
      new THREE.PlaneGeometry(350, 130),
      new THREE.MeshBasicMaterial({ map: texFar, transparent: true, depthWrite: false })
    );
    meshFar.position.set(60, 45, -120);
    this.sceneryGroup.add(meshFar);
    this.layers.push({ mesh: meshFar, texture: texFar, speed: 0.0004, baseOffset: 0 });

    // ── LAYER 2: Cascading Lavafalls & Basalt Columns (Z = -65) ──
    const ctxMid = this.canvasMid;
    ctxMid.width = W; ctxMid.height = H;
    const gMid = ctxMid.getContext('2d');
    gMid.clearRect(0, 0, W, H);

    // Basalt pillars
    let px = 0;
    while (px < W) {
      const pw = Math.floor(Math.random() * 80 + 50);
      const ph = Math.floor(Math.random() * 400 + 300);
      const py = H - ph;

      gMid.fillStyle = '#0f0205';
      gMid.fillRect(px, py, pw, ph);

      // Lava fall streaming down pillar
      if (Math.random() > 0.45) {
        const lw = Math.floor(Math.random() * 16 + 10);
        const lx = px + Math.floor(Math.random() * (pw - lw));
        const lGrad = gMid.createLinearGradient(0, py, 0, H);
        lGrad.addColorStop(0, '#ff9100');
        lGrad.addColorStop(0.5, '#ff3d00');
        lGrad.addColorStop(1, '#ffeb3b');
        gMid.fillStyle = lGrad;
        gMid.shadowColor = '#ff3d00';
        gMid.shadowBlur = 16;
        gMid.fillRect(lx, py, lw, ph);
        gMid.shadowBlur = 0;
      }

      px += pw + 15;
    }

    const texMid = new THREE.CanvasTexture(ctxMid);
    texMid.wrapS = THREE.RepeatWrapping;
    texMid.repeat.set(2, 1);

    const meshMid = new THREE.Mesh(
      new THREE.PlaneGeometry(280, 95),
      new THREE.MeshBasicMaterial({ map: texMid, transparent: true, depthWrite: false })
    );
    meshMid.position.set(50, 24, -65);
    this.sceneryGroup.add(meshMid);
    this.layers.push({ mesh: meshMid, texture: texMid, speed: 0.0018, baseOffset: 0 });

    // ── 3D Rising Fire Embers Particles ──
    const emberCount = 350;
    const emberGeo = new THREE.BufferGeometry();
    const emberPos = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount * 3; i += 3) {
      emberPos[i] = (Math.random() - 0.5) * 250;
      emberPos[i + 1] = Math.random() * 50 - 5;
      emberPos[i + 2] = (Math.random() - 0.5) * 40 - 20;
    }
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
    const emberMat = new THREE.PointsMaterial({
      color: 0xff7700,
      size: 1.2,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const emberParticles = new THREE.Points(emberGeo, emberMat);
    this.sceneryGroup.add(emberParticles);

    this.animatedElements.push((time, delta) => {
      const pos = emberGeo.attributes.position.array;
      for (let i = 1; i < emberCount * 3; i += 3) {
        pos[i] += delta * 12; // rise up
        pos[i - 1] += Math.sin(time * 3 + i) * 0.15; // drift
        if (pos[i] > 45) pos[i] = -5;
      }
      emberGeo.attributes.position.needsUpdate = true;
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // LEVEL 4: QUANTUM NEBULA & HYPER-GRID (Deep Space, Saturn Rings)
  // ═════════════════════════════════════════════════════════════════
  buildQuantumNebulaScenery() {
    const W = 2048, H = 1024;

    // ── LAYER 1: Deep Cosmos & Swirling Volumetric Nebula (Z = -130) ──
    const ctxFar = this.canvasFar;
    ctxFar.width = W; ctxFar.height = H;
    const gFar = ctxFar.getContext('2d');

    gFar.clearRect(0, 0, W, H);

    // Multi-colored cosmic nebula clouds
    const nebulas = [
      { x: W * 0.3, y: H * 0.4, r: 350, c: 'rgba(213, 0, 249, 0.45)' },
      { x: W * 0.7, y: H * 0.35, r: 380, c: 'rgba(0, 229, 255, 0.4)' },
      { x: W * 0.5, y: H * 0.6, r: 320, c: 'rgba(118, 255, 3, 0.3)' },
      { x: W * 0.85, y: H * 0.65, r: 280, c: 'rgba(255, 0, 128, 0.35)' }
    ];
    nebulas.forEach(neb => {
      const nGrad = gFar.createRadialGradient(neb.x, neb.y, neb.r * 0.1, neb.x, neb.y, neb.r);
      nGrad.addColorStop(0, neb.c);
      nGrad.addColorStop(1, 'rgba(0,0,0,0)');
      gFar.fillStyle = nGrad;
      gFar.beginPath();
      gFar.arc(neb.x, neb.y, neb.r, 0, Math.PI * 2);
      gFar.fill();
    });

    // Giant Ringed Gas Planet
    const px = W * 0.75, py = H * 0.38, pr = 110;
    const pGrad = gFar.createLinearGradient(px - pr, py - pr, px + pr, py + pr);
    pGrad.addColorStop(0, '#7c4dff');
    pGrad.addColorStop(0.5, '#e040fb');
    pGrad.addColorStop(1, '#00b0ff');
    gFar.fillStyle = pGrad;
    gFar.beginPath();
    gFar.arc(px, py, pr, 0, Math.PI * 2);
    gFar.fill();

    // Planet Rings
    gFar.save();
    gFar.translate(px, py);
    gFar.rotate(-Math.PI / 6);
    gFar.scale(1, 0.28);
    gFar.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    gFar.lineWidth = 18;
    gFar.beginPath();
    gFar.arc(0, 0, pr * 1.8, 0, Math.PI * 2);
    gFar.stroke();
    gFar.strokeStyle = 'rgba(0, 229, 255, 0.5)';
    gFar.lineWidth = 10;
    gFar.beginPath();
    gFar.arc(0, 0, pr * 2.1, 0, Math.PI * 2);
    gFar.stroke();
    gFar.restore();

    const texFar = new THREE.CanvasTexture(ctxFar);
    texFar.wrapS = THREE.RepeatWrapping;
    texFar.repeat.set(2, 1);

    const meshFar = new THREE.Mesh(
      new THREE.PlaneGeometry(350, 130),
      new THREE.MeshBasicMaterial({ map: texFar, transparent: true, depthWrite: false })
    );
    meshFar.position.set(60, 45, -120);
    this.sceneryGroup.add(meshFar);
    this.layers.push({ mesh: meshFar, texture: texFar, speed: 0.0003, baseOffset: 0 });

    // ── LAYER 2: 3D Holographic Cyber Ring Gateways & Matrix Grid (Z = -55) ──
    for (let r = 0; r < 6; r++) {
      const ringTorus = new THREE.Mesh(
        new THREE.TorusGeometry(14 + r * 3, 0.4, 8, 32),
        new THREE.MeshBasicMaterial({
          color: [0xd500f9, 0x00e5ff, 0x00ff88, 0xff007f][r % 4],
          wireframe: true,
          transparent: true,
          opacity: 0.65
        })
      );
      ringTorus.position.set(r * 60 - 20, 24, -55);
      ringTorus.rotation.y = Math.PI / 4;
      this.sceneryGroup.add(ringTorus);

      this.animatedElements.push((time, delta) => {
        ringTorus.rotation.z += delta * (r % 2 === 0 ? 0.6 : -0.6);
        ringTorus.rotation.x += delta * 0.3;
      });
    }

    // Floating matrix data cubes
    const cubeGroup = new THREE.Group();
    cubeGroup.position.set(0, 20, -40);
    for (let i = 0; i < 20; i++) {
      const c = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.6, 1.6),
        new THREE.MeshBasicMaterial({
          color: 0x00ff88,
          wireframe: true,
          transparent: true,
          opacity: 0.7
        })
      );
      c.position.set((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20);
      cubeGroup.add(c);
    }
    this.sceneryGroup.add(cubeGroup);
    this.animatedElements.push((time, delta) => {
      cubeGroup.children.forEach((c, idx) => {
        c.rotation.x += delta * 1.5;
        c.rotation.y += delta * 1.2;
        c.position.y += Math.sin(time * 2 + idx) * 0.02;
      });
    });
  }

  // Update Parallax Offset as Player progresses
  update(playerX, progressRatio = 0, time = 0, delta = 0.016) {
    // 1. Render the Dynamic Obstacle-Reactive Sky
    this.renderPixelSky(playerX, progressRatio, time, delta);
    if (this.pixelSkyMesh) {
      this.pixelSkyMesh.position.x = playerX + 60;
    }

    // 2. Parallax scroll on canvas textures
    this.layers.forEach(layer => {
      if (layer.texture) {
        layer.texture.offset.x = playerX * layer.speed;
      }
      // Follow player on X with gentle lag so the scenery stays in viewport
      layer.mesh.position.x = playerX + 50;
    });

    // 3. Run active scenic element animations (searchlights, aerocars, crystals, embers)
    this.animatedElements.forEach(anim => anim(time, delta));
  }
}
