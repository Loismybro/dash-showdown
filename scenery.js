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
      this.buildGothicCastleScenery();
    } else if (level.themeType === 'fairyland' || level.id === 2) {
      this.buildFairylandScenery();
    } else if (level.themeType === 'shark' || level.id === 3) {
      this.buildSunkenOceanScenery();
    } else {
      this.buildMetropolisScenery();
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // LEVEL 1: GOTHIC CASTLE FORTRESS (Blood Moon, Spired Citadels, Gargoyles & Bats)
  // ═════════════════════════════════════════════════════════════════
  buildGothicCastleScenery() {
    const W = 2048, H = 1024;

    // ── LAYER 1: Distant Crags, Mountain Fortresses & Blood Moon (Z = -105, speed = 0.0006) ──
    const ctxFar = this.canvasFar;
    ctxFar.width = W; ctxFar.height = H;
    const gFar = ctxFar.getContext('2d');
    gFar.clearRect(0, 0, W, H);

    // 1. Giant Blood Moon with glowing aura
    const moonX = W * 0.72, moonY = H * 0.32, moonR = 125;
    const mGlow = gFar.createRadialGradient(moonX, moonY, moonR * 0.4, moonX, moonY, moonR * 2.8);
    mGlow.addColorStop(0, 'rgba(255, 30, 80, 0.55)');
    mGlow.addColorStop(0.5, 'rgba(180, 10, 50, 0.22)');
    mGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    gFar.fillStyle = mGlow;
    gFar.beginPath();
    gFar.arc(moonX, moonY, moonR * 2.8, 0, Math.PI * 2);
    gFar.fill();

    // Moon Disc
    const mDisc = gFar.createRadialGradient(moonX - 25, moonY - 25, 20, moonX, moonY, moonR);
    mDisc.addColorStop(0, '#ffebee');
    mDisc.addColorStop(0.4, '#ff5252');
    mDisc.addColorStop(0.85, '#b71c1c');
    mDisc.addColorStop(1, '#4a0000');
    gFar.fillStyle = mDisc;
    gFar.beginPath();
    gFar.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    gFar.fill();

    // Dark lunar maria craters
    gFar.fillStyle = 'rgba(35, 5, 15, 0.45)';
    gFar.beginPath();
    gFar.arc(moonX - 35, moonY - 20, 36, 0, Math.PI * 2);
    gFar.arc(moonX + 45, moonY + 25, 28, 0, Math.PI * 2);
    gFar.arc(moonX - 15, moonY + 45, 22, 0, Math.PI * 2);
    gFar.arc(moonX + 20, moonY - 45, 18, 0, Math.PI * 2);
    gFar.fill();

    // Wispy storm clouds drifting across the moon
    gFar.fillStyle = 'rgba(15, 5, 25, 0.65)';
    for (let c = 0; c < 5; c++) {
      const cy = moonY - 40 + c * 25;
      gFar.beginPath();
      gFar.ellipse(moonX + (c % 2 === 0 ? -40 : 40), cy, 180 + c * 30, 14 + c * 4, 0, 0, Math.PI * 2);
      gFar.fill();
    }

    // 2. Distant Jagged Mountain Peaks & Far Citadel Silhouette
    gFar.fillStyle = '#0a0312';
    gFar.beginPath();
    gFar.moveTo(0, H);
    for (let x = 0; x <= W; x += 30) {
      const my = H * 0.46 + Math.sin(x * 0.005) * 110 + Math.sin(x * 0.015) * 55;
      gFar.lineTo(x, my);
    }
    gFar.lineTo(W, H);
    gFar.closePath();
    gFar.fill();

    // Distant mountain keep spires in silhouette
    for (let sp = 0; sp < 8; sp++) {
      const sx = sp * 260 + 120;
      const sy = H * 0.43 + Math.sin(sx * 0.005) * 80;
      gFar.fillStyle = '#06010a';
      gFar.beginPath();
      gFar.moveTo(sx - 20, sy);
      gFar.lineTo(sx, sy - 85);
      gFar.lineTo(sx + 20, sy);
      gFar.fill();
      // Cross finial on top
      gFar.strokeStyle = '#ff0055';
      gFar.lineWidth = 2;
      gFar.beginPath();
      gFar.moveTo(sx, sy - 95);
      gFar.lineTo(sx, sy - 85);
      gFar.moveTo(sx - 5, sy - 91);
      gFar.lineTo(sx + 5, sy - 91);
      gFar.stroke();
    }

    const texFar = new THREE.CanvasTexture(ctxFar);
    texFar.wrapS = THREE.RepeatWrapping;
    texFar.repeat.set(2, 1);
    const meshFar = new THREE.Mesh(
      new THREE.PlaneGeometry(350, 130),
      new THREE.MeshBasicMaterial({ map: texFar, transparent: true, depthWrite: false })
    );
    meshFar.position.set(60, 45, -105);
    this.sceneryGroup.add(meshFar);
    this.layers.push({ mesh: meshFar, texture: texFar, speed: 0.0006, baseOffset: 0 });

    // ── LAYER 2: Grand Gothic Castle Fortress & Cathedrals (Z = -70, speed = 0.002) ──
    const ctxMid = this.canvasMid;
    ctxMid.width = W; ctxMid.height = H;
    const gMid = ctxMid.getContext('2d');
    gMid.clearRect(0, 0, W, H);

    let cx = 0;
    while (cx < W) {
      const castleW = Math.floor(Math.random() * 180 + 160);
      const wallH = Math.floor(Math.random() * 200 + 260);
      const wallY = H - wallH;

      // Dark ancient stone wall gradient
      const wallGrad = gMid.createLinearGradient(0, wallY, 0, H);
      wallGrad.addColorStop(0, '#1c0c2a');
      wallGrad.addColorStop(0.5, '#12071c');
      wallGrad.addColorStop(1, '#08020d');
      gMid.fillStyle = wallGrad;
      gMid.fillRect(cx, wallY, castleW, wallH);

      // Castellated battlements / crenellations along the wall top
      const crenW = 18;
      const crenH = 20;
      gMid.fillStyle = '#220f33';
      for (let cr = cx; cr < cx + castleW - crenW; cr += crenW * 2) {
        gMid.fillRect(cr, wallY - crenH, crenW, crenH);
      }

      // Tower (Left or Main Tower)
      const towW = Math.floor(Math.random() * 60 + 50);
      const towH = wallH + Math.floor(Math.random() * 180 + 140);
      const towY = H - towH;
      const towX = cx + Math.floor(Math.random() * 30);

      const towGrad = gMid.createLinearGradient(0, towY, 0, H);
      towGrad.addColorStop(0, '#26103a');
      towGrad.addColorStop(0.5, '#150821');
      towGrad.addColorStop(1, '#09020e');
      gMid.fillStyle = towGrad;
      gMid.fillRect(towX, towY, towW, towH);

      // Machicolations (stone brackets under battlements)
      gMid.fillStyle = '#2d1445';
      gMid.fillRect(towX - 6, towY, towW + 12, 14);

      // Tower Crenellations
      for (let tcr = towX - 6; tcr < towX + towW + 6 - 12; tcr += 16) {
        gMid.fillRect(tcr, towY - 14, 10, 14);
      }

      // Tall Pointed Gothic Conical Roof / Spire
      const spireH = Math.floor(Math.random() * 90 + 70);
      gMid.fillStyle = '#180726';
      gMid.beginPath();
      gMid.moveTo(towX - 8, towY - 14);
      gMid.lineTo(towX + towW / 2, towY - 14 - spireH);
      gMid.lineTo(towX + towW + 8, towY - 14);
      gMid.closePath();
      gMid.fill();

      // Roof edge highlight
      gMid.strokeStyle = 'rgba(255, 0, 85, 0.4)';
      gMid.lineWidth = 2;
      gMid.stroke();

      // Spire Finial / Iron Cross
      const finX = towX + towW / 2;
      const finY = towY - 14 - spireH;
      gMid.strokeStyle = '#ff0055';
      gMid.lineWidth = 2.5;
      gMid.beginPath();
      gMid.moveTo(finX, finY - 24);
      gMid.lineTo(finX, finY);
      gMid.moveTo(finX - 7, finY - 16);
      gMid.lineTo(finX + 7, finY - 16);
      gMid.stroke();

      // Glowing Spire Tip Beacon
      gMid.fillStyle = '#ff0055';
      gMid.beginPath();
      gMid.arc(finX, finY - 24, 3, 0, Math.PI * 2);
      gMid.fill();

      // Pointed Gothic Stained-Glass Arched Windows
      const winCols = ['#ff0055', '#d500f9', '#ff5252', '#ffab00'];
      for (let wy = towY + 35; wy < H - 80; wy += 55) {
        const winW = 16, winH = 34;
        const winX = towX + towW / 2 - winW / 2;
        const winCol = winCols[Math.floor(Math.random() * winCols.length)];

        // Window glow
        gMid.shadowColor = winCol;
        gMid.shadowBlur = 15;
        gMid.fillStyle = winCol;

        // Gothic pointed arch shape
        gMid.beginPath();
        gMid.moveTo(winX, wy + winH);
        gMid.lineTo(winX, wy + winH * 0.45);
        gMid.bezierCurveTo(winX, wy, winX + winW / 2, wy - 6, winX + winW / 2, wy - 6);
        gMid.bezierCurveTo(winX + winW / 2, wy - 6, winX + winW, wy, winX + winW, wy + winH * 0.45);
        gMid.lineTo(winX + winW, wy + winH);
        gMid.closePath();
        gMid.fill();
        gMid.shadowBlur = 0;

        // Dark iron window mullions & tracery cross
        gMid.strokeStyle = '#0a0312';
        gMid.lineWidth = 2;
        gMid.beginPath();
        gMid.moveTo(winX + winW / 2, wy - 4);
        gMid.lineTo(winX + winW / 2, wy + winH);
        gMid.moveTo(winX, wy + winH * 0.5);
        gMid.lineTo(winX + winW, wy + winH * 0.5);
        gMid.stroke();
      }

      // Flying Buttresses / Arched Bridge between towers
      if (Math.random() > 0.35 && cx + castleW < W) {
        const archStartX = cx + castleW - 10;
        const archEndX = archStartX + 50;
        const archY = wallY + 40;
        gMid.strokeStyle = '#1d0c2c';
        gMid.lineWidth = 12;
        gMid.beginPath();
        gMid.moveTo(archStartX, archY);
        gMid.quadraticCurveTo(archStartX + 25, archY - 30, archEndX, archY);
        gMid.stroke();
      }

      // Torch Sconces on Wall with Amber Glow
      if (Math.random() > 0.4) {
        const tx = cx + Math.floor(castleW * 0.65);
        const ty = wallY + 70;
        gMid.fillStyle = 'rgba(255, 170, 0, 0.85)';
        gMid.shadowColor = '#ff5500';
        gMid.shadowBlur = 20;
        gMid.beginPath();
        gMid.arc(tx, ty, 8, 0, Math.PI * 2);
        gMid.fill();
        gMid.shadowBlur = 0;

        // Iron bracket
        gMid.strokeStyle = '#110518';
        gMid.lineWidth = 3;
        gMid.beginPath();
        gMid.moveTo(tx, ty + 8);
        gMid.lineTo(tx, ty + 20);
        gMid.lineTo(tx - 8, ty + 26);
        gMid.stroke();
      }

      cx += castleW + 12;
    }

    const texMid = new THREE.CanvasTexture(ctxMid);
    texMid.wrapS = THREE.RepeatWrapping;
    texMid.repeat.set(2, 1);
    const meshMid = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 105),
      new THREE.MeshBasicMaterial({ map: texMid, transparent: true, depthWrite: false })
    );
    meshMid.position.set(50, 32, -70);
    this.sceneryGroup.add(meshMid);
    this.layers.push({ mesh: meshMid, texture: texMid, speed: 0.002, baseOffset: 0 });

    // ── LAYER 3: Closer Parapets, Massive Gatehouse & Perched Gargoyles (Z = -45, speed = 0.004) ──
    const ctxNear = this.canvasNear;
    ctxNear.width = W; ctxNear.height = H;
    const gNear = ctxNear.getContext('2d');
    gNear.clearRect(0, 0, W, H);

    let nx = 0;
    while (nx < W) {
      const secW = Math.floor(Math.random() * 220 + 200);
      const secH = Math.floor(Math.random() * 220 + 160);
      const secY = H - secH;

      // Heavy carved stone rampart
      const rGrad = gNear.createLinearGradient(0, secY, 0, H);
      rGrad.addColorStop(0, '#150921');
      rGrad.addColorStop(0.4, '#0d0415');
      rGrad.addColorStop(1, '#050109');
      gNear.fillStyle = rGrad;
      gNear.fillRect(nx, secY, secW, secH);

      // Stone brick lines
      gNear.strokeStyle = 'rgba(45, 20, 65, 0.45)';
      gNear.lineWidth = 2;
      for (let by = secY + 16; by < H; by += 24) {
        gNear.beginPath();
        gNear.moveTo(nx, by);
        gNear.lineTo(nx + secW, by);
        gNear.stroke();
        const rowOffset = (by % 48 === 0) ? 0 : 25;
        for (let bx = nx + rowOffset; bx < nx + secW; bx += 50) {
          gNear.beginPath();
          gNear.moveTo(bx, by);
          gNear.lineTo(bx, by + 24);
          gNear.stroke();
        }
      }

      // Parapet top crenellations
      const cW = 24, cH = 28;
      gNear.fillStyle = '#1e0c2e';
      for (let bx = nx; bx < nx + secW - cW; bx += cW * 2) {
        gNear.fillRect(bx, secY - cH, cW, cH);
        gNear.fillStyle = '#ff0055';
        gNear.fillRect(bx, secY - cH, cW, 3);
        gNear.fillStyle = '#1e0c2e';
      }

      // Perched Stone Gargoyle Silhouette on Watchtower Corner
      if (Math.random() > 0.4) {
        const gx = nx + Math.floor(Math.random() * (secW - 60)) + 30;
        const gy = secY - cH - 24;
        // Body
        gNear.fillStyle = '#0b0211';
        gNear.beginPath();
        gNear.ellipse(gx, gy + 12, 16, 12, -Math.PI / 8, 0, Math.PI * 2);
        gNear.fill();
        // Head with horns
        gNear.beginPath();
        gNear.arc(gx + 12, gy + 4, 8, 0, Math.PI * 2);
        gNear.fill();
        gNear.beginPath();
        gNear.moveTo(gx + 14, gy + 2);
        gNear.lineTo(gx + 19, gy - 6);
        gNear.lineTo(gx + 10, gy + 1);
        gNear.fill();
        // Wings spread
        gNear.beginPath();
        gNear.moveTo(gx - 4, gy + 8);
        gNear.lineTo(gx - 26, gy - 16);
        gNear.lineTo(gx - 14, gy + 4);
        gNear.lineTo(gx - 20, gy + 14);
        gNear.closePath();
        gNear.fill();
        // Glowing ruby eyes!
        gNear.fillStyle = '#ff0055';
        gNear.shadowColor = '#ff0055';
        gNear.shadowBlur = 8;
        gNear.beginPath();
        gNear.arc(gx + 15, gy + 3, 2.5, 0, Math.PI * 2);
        gNear.fill();
        gNear.shadowBlur = 0;
      }

      // Grand Arched Iron Portcullis Entrance Gate
      if (Math.random() > 0.5 && secW > 240) {
        const gw = 64, gh = 90;
        const gx = nx + secW / 2 - gw / 2;
        const gy = H - gh;

        gNear.fillStyle = '#020005';
        gNear.beginPath();
        gNear.moveTo(gx, gy + gh);
        gNear.lineTo(gx, gy + 30);
        gNear.arc(gx + gw / 2, gy + 30, gw / 2, Math.PI, 0, false);
        gNear.lineTo(gx + gw, gy + gh);
        gNear.closePath();
        gNear.fill();

        gNear.strokeStyle = '#4a205a';
        gNear.lineWidth = 3;
        for (let px = gx + 10; px < gx + gw; px += 12) {
          gNear.beginPath();
          gNear.moveTo(px, gy + 20);
          gNear.lineTo(px, gy + gh);
          gNear.stroke();
        }
        for (let py = gy + 30; py < gy + gh; py += 16) {
          gNear.beginPath();
          gNear.moveTo(gx + 4, py);
          gNear.lineTo(gx + gw - 4, py);
          gNear.stroke();
        }
      }

      nx += secW + 15;
    }

    const texNear = new THREE.CanvasTexture(ctxNear);
    texNear.wrapS = THREE.RepeatWrapping;
    texNear.repeat.set(2, 1);
    const meshNear = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 85),
      new THREE.MeshBasicMaterial({ map: texNear, transparent: true, depthWrite: false })
    );
    meshNear.position.set(40, 22, -45);
    this.sceneryGroup.add(meshNear);
    this.layers.push({ mesh: meshNear, texture: texNear, speed: 0.004, baseOffset: 0 });

    // ── 3D Dynamic Bats Swarm (Flapping Wings & Swooping) ──
    const batGroup = new THREE.Group();
    batGroup.position.set(0, 28, -35);
    const bats = [];
    for (let b = 0; b < 14; b++) {
      const batObj = new THREE.Group();
      const bBody = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.7, 5),
        new THREE.MeshBasicMaterial({ color: 0x14041a })
      );
      bBody.rotation.x = Math.PI / 2;
      batObj.add(bBody);

      const lWingGeo = new THREE.BufferGeometry();
      const lVerts = new Float32Array([
        0, 0, 0,
        -1.2, 0.2, -0.4,
        -0.8, -0.3, 0.4
      ]);
      lWingGeo.setAttribute('position', new THREE.BufferAttribute(lVerts, 3));
      const wingMat = new THREE.MeshBasicMaterial({ color: 0x1f0628, side: THREE.DoubleSide });
      const lWing = new THREE.Mesh(lWingGeo, wingMat);
      batObj.add(lWing);

      const rWingGeo = new THREE.BufferGeometry();
      const rVerts = new Float32Array([
        0, 0, 0,
        1.2, 0.2, -0.4,
        0.8, -0.3, 0.4
      ]);
      rWingGeo.setAttribute('position', new THREE.BufferAttribute(rVerts, 3));
      const rWing = new THREE.Mesh(rWingGeo, wingMat);
      batObj.add(rWing);

      batObj.position.set((b * 22) - 80, Math.sin(b * 1.5) * 8, (b % 3) * 5 - 10);
      batGroup.add(batObj);
      bats.push({ obj: batObj, lWing, rWing, phase: b * 0.8, speed: Math.random() * 8 + 16 });
    }
    this.sceneryGroup.add(batGroup);

    this.animatedElements.push((time, delta) => {
      bats.forEach((bat) => {
        const flap = Math.sin(time * 18 + bat.phase) * 0.85;
        bat.lWing.rotation.z = flap;
        bat.rWing.rotation.z = -flap;
        bat.obj.position.x += delta * bat.speed;
        bat.obj.position.y += Math.sin(time * 2.5 + bat.phase) * 0.05;
        if (bat.obj.position.x > 240) {
          bat.obj.position.x = -120;
        }
      });
    });

    // ── 3D Flaming Castle Braziers with Floating Fire Particles ──
    const brazierCount = 6;
    for (let br = 0; br < brazierCount; br++) {
      const bz = new THREE.Group();
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.4, 0.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x110816, metalness: 0.9 })
      );
      bz.add(bowl);
      const fireCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff3300 })
      );
      fireCore.position.y = 0.35;
      bz.add(fireCore);

      bz.position.set(br * 65 - 30, 8, -22);
      this.sceneryGroup.add(bz);

      this.animatedElements.push((time) => {
        const fPulse = 0.9 + Math.sin(time * 12 + br) * 0.25;
        fireCore.scale.set(fPulse, fPulse * 1.2, fPulse);
      });
    }

    // ── 3D Rising Fire Sparks & Embers ──
    const sparkCount = 200;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i += 3) {
      sparkPos[i] = (Math.random() - 0.5) * 250;
      sparkPos[i + 1] = Math.random() * 35;
      sparkPos[i + 2] = (Math.random() - 0.5) * 30 - 20;
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xff2244,
      size: 1.4,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    this.sceneryGroup.add(sparkPoints);

    this.animatedElements.push((time, delta) => {
      const pos = sparkGeo.attributes.position.array;
      for (let i = 1; i < sparkCount * 3; i += 3) {
        pos[i] += delta * 9;
        pos[i - 1] += Math.sin(time * 2 + i) * 0.12;
        if (pos[i] > 38) pos[i] = 0;
      }
      sparkGeo.attributes.position.needsUpdate = true;
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // LEVEL 2: FAIRYLAND PALACE & LUMINESCENT MUSHROOM KINGDOM
  // ═════════════════════════════════════════════════════════════════
  buildFairylandScenery() {
    const W = 2048, H = 1024;

    // ── LAYER 1: Pastel Aurora & Fairy Castle Palace Spires (Z = -115, speed = 0.0005) ──
    const ctxFar = this.canvasFar;
    ctxFar.width = W; ctxFar.height = H;
    const gFar = ctxFar.getContext('2d');
    gFar.clearRect(0, 0, W, H);

    // Aurora curtains in pastel cyan & pink
    for (let a = 0; a < 3; a++) {
      gFar.beginPath();
      const aGrad = gFar.createLinearGradient(0, 80 + a * 120, 0, 480 + a * 120);
      aGrad.addColorStop(0, a % 2 === 0 ? 'rgba(0, 255, 170, 0.4)' : 'rgba(255, 128, 200, 0.35)');
      aGrad.addColorStop(1, 'rgba(0, 255, 170, 0)');
      gFar.fillStyle = aGrad;
      gFar.moveTo(0, 300);
      for (let x = 0; x <= W; x += 40) {
        const y = Math.sin(x * 0.006 + a * 2) * 80 + Math.sin(x * 0.014) * 40 + 220 + a * 50;
        gFar.lineTo(x, y);
      }
      gFar.lineTo(W, H);
      gFar.lineTo(0, H);
      gFar.closePath();
      gFar.fill();
    }

    // Fairy Twin Moons (Golden and Rose)
    gFar.fillStyle = '#fff59d';
    gFar.beginPath();
    gFar.arc(W * 0.22, H * 0.26, 48, 0, Math.PI * 2);
    gFar.fill();
    gFar.fillStyle = '#f48fb1';
    gFar.beginPath();
    gFar.arc(W * 0.28, H * 0.32, 26, 0, Math.PI * 2);
    gFar.fill();

    // Distant Fairy Palace Castle Spires with Pastel Rooftops
    const castlePalaceX = W * 0.58;
    const palaceSpireColors = ['#f48fb1', '#ce93d8', '#80deea', '#fff59d'];
    for (let sp = 0; sp < 9; sp++) {
      const sx = castlePalaceX - 220 + sp * 55;
      const sh = 180 + Math.sin(sp * 1.3) * 90;
      const sy = H * 0.65 - sh;
      const sw = 32 + (sp % 3) * 8;

      // Palace tower body
      gFar.fillStyle = '#1b1236';
      gFar.fillRect(sx - sw / 2, sy, sw, sh);

      // Pastel Cone Spire Roof
      gFar.fillStyle = palaceSpireColors[sp % palaceSpireColors.length];
      gFar.beginPath();
      gFar.moveTo(sx - sw / 2 - 4, sy);
      gFar.lineTo(sx, sy - 65);
      gFar.lineTo(sx + sw / 2 + 4, sy);
      gFar.closePath();
      gFar.fill();

      // Glowing crystal star finial
      gFar.fillStyle = '#ffffff';
      gFar.beginPath();
      gFar.arc(sx, sy - 68, 3.5, 0, Math.PI * 2);
      gFar.fill();
    }

    const texFar = new THREE.CanvasTexture(ctxFar);
    texFar.wrapS = THREE.RepeatWrapping;
    texFar.repeat.set(2, 1);
    const meshFar = new THREE.Mesh(
      new THREE.PlaneGeometry(350, 130),
      new THREE.MeshBasicMaterial({ map: texFar, transparent: true, depthWrite: false })
    );
    meshFar.position.set(60, 45, -115);
    this.sceneryGroup.add(meshFar);
    this.layers.push({ mesh: meshFar, texture: texFar, speed: 0.0005, baseOffset: 0 });

    // ── LAYER 2: Giant Bioluminescent Mushroom Forest & Floating Islands (Z = -70, speed = 0.002) ──
    const ctxMid = this.canvasMid;
    ctxMid.width = W; ctxMid.height = H;
    const gMid = ctxMid.getContext('2d');
    gMid.clearRect(0, 0, W, H);

    // Rolling mystical fairy hill slope
    gMid.fillStyle = '#120d2b';
    gMid.beginPath();
    gMid.moveTo(0, H);
    for (let x = 0; x <= W; x += 40) {
      const my = H * 0.6 + Math.sin(x * 0.007) * 90 + Math.cos(x * 0.016) * 45;
      gMid.lineTo(x, my);
    }
    gMid.lineTo(W, H);
    gMid.closePath();
    gMid.fill();

    // Giant Glowing Toadstools / Mushrooms
    for (let m = 0; m < 14; m++) {
      const mx = m * 150 + 60;
      const my = H * 0.6 + Math.sin(mx * 0.007) * 90;
      const mw = 55 + (m % 4) * 12;
      const mh = 90 + (m % 3) * 35;
      const capCol = ['#ff4081', '#00e5ff', '#76ff03', '#ffd600', '#e040fb'][m % 5];

      // Stalk
      gMid.fillStyle = '#e8eaf6';
      gMid.fillRect(mx - 8, my - mh, 16, mh);

      // Glowing Mushroom Cap
      gMid.fillStyle = capCol;
      gMid.shadowColor = capCol;
      gMid.shadowBlur = 18;
      gMid.beginPath();
      gMid.arc(mx, my - mh, mw / 2, Math.PI, 0, false);
      gMid.fill();
      gMid.shadowBlur = 0;

      // Bioluminescent polka dots on cap
      gMid.fillStyle = '#ffffff';
      gMid.beginPath();
      gMid.arc(mx - mw * 0.25, my - mh - 12, 5, 0, Math.PI * 2);
      gMid.arc(mx + mw * 0.2, my - mh - 16, 6, 0, Math.PI * 2);
      gMid.arc(mx, my - mh - 24, 7, 0, Math.PI * 2);
      gMid.fill();
    }

    const texMid = new THREE.CanvasTexture(ctxMid);
    texMid.wrapS = THREE.RepeatWrapping;
    texMid.repeat.set(2, 1);
    const meshMid = new THREE.Mesh(
      new THREE.PlaneGeometry(290, 100),
      new THREE.MeshBasicMaterial({ map: texMid, transparent: true, depthWrite: false })
    );
    meshMid.position.set(50, 28, -70);
    this.sceneryGroup.add(meshMid);
    this.layers.push({ mesh: meshMid, texture: texMid, speed: 0.002, baseOffset: 0 });

    // ── 3D Floating Crystals & Fireflies ──
    const crystalGeo = new THREE.OctahedronGeometry(2.0);
    for (let c = 0; c < 8; c++) {
      const cMat = new THREE.MeshStandardMaterial({
        color: c % 2 === 0 ? 0x00ffcc : 0xff80ab,
        emissive: c % 2 === 0 ? 0x008877 : 0x880055,
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
  // LEVEL 3: SUNKEN ATLANTIS ABYSS (Sunken Ruins, Corals & 3D Sharks)
  // ═════════════════════════════════════════════════════════════════
  buildSunkenOceanScenery() {
    const W = 2048, H = 1024;

    // ── LAYER 1: Deep Ocean Light Shafts & Sunken Temple Citadel (Z = -115, speed = 0.0006) ──
    const ctxFar = this.canvasFar;
    ctxFar.width = W; ctxFar.height = H;
    const gFar = ctxFar.getContext('2d');
    gFar.clearRect(0, 0, W, H);

    // Deep abyssal ocean gradient
    const oceanGrad = gFar.createLinearGradient(0, 0, 0, H);
    oceanGrad.addColorStop(0, '#002538');
    oceanGrad.addColorStop(0.5, '#001424');
    oceanGrad.addColorStop(1, '#000812');
    gFar.fillStyle = oceanGrad;
    gFar.fillRect(0, 0, W, H);

    // Caustic Sunbeams / Light Shafts piercing from surface
    for (let s = 0; s < 7; s++) {
      const sx = s * 300 + 80;
      gFar.beginPath();
      gFar.moveTo(sx, 0);
      gFar.lineTo(sx + 140, 0);
      gFar.lineTo(sx + 240, H);
      gFar.lineTo(sx + 60, H);
      gFar.closePath();
      const sGrad = gFar.createLinearGradient(sx, 0, sx + 150, H);
      sGrad.addColorStop(0, 'rgba(0, 240, 255, 0.22)');
      sGrad.addColorStop(0.7, 'rgba(0, 240, 255, 0.05)');
      sGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
      gFar.fillStyle = sGrad;
      gFar.fill();
    }

    // Distant Submerged Atlantis Castle Ruins / Colonnades
    for (let c = 0; c < 12; c++) {
      const cx = c * 170 + 40;
      const ch = 240 + Math.sin(c * 1.6) * 100;
      const cy = H - ch;
      gFar.fillStyle = '#021829';
      gFar.fillRect(cx, cy, 26, ch);

      // Broken capital arch
      gFar.fillRect(cx - 8, cy, 42, 14);
      if (c % 2 === 0) {
        gFar.fillRect(cx, cy - 20, 160, 16);
      }
    }

    const texFar = new THREE.CanvasTexture(ctxFar);
    texFar.wrapS = THREE.RepeatWrapping;
    texFar.repeat.set(2, 1);
    const meshFar = new THREE.Mesh(
      new THREE.PlaneGeometry(350, 130),
      new THREE.MeshBasicMaterial({ map: texFar, transparent: true, depthWrite: false })
    );
    meshFar.position.set(60, 45, -115);
    this.sceneryGroup.add(meshFar);
    this.layers.push({ mesh: meshFar, texture: texFar, speed: 0.0006, baseOffset: 0 });

    // ── LAYER 2: Towering Coral Reef Spires & Sunken Arches (Z = -65, speed = 0.002) ──
    const ctxMid = this.canvasMid;
    ctxMid.width = W; ctxMid.height = H;
    const gMid = ctxMid.getContext('2d');
    gMid.clearRect(0, 0, W, H);

    let px = 0;
    while (px < W) {
      const pw = Math.floor(Math.random() * 80 + 50);
      const ph = Math.floor(Math.random() * 380 + 260);
      const py = H - ph;

      // Dark coral basalt spire
      gMid.fillStyle = '#031926';
      gMid.fillRect(px, py, pw, ph);

      // Bioluminescent coral branches & glowing sea anemones
      const coralCol = ['#00e5ff', '#ff007f', '#00ff88', '#ffd600'][Math.floor(Math.random() * 4)];
      gMid.fillStyle = coralCol;
      gMid.shadowColor = coralCol;
      gMid.shadowBlur = 12;
      for (let cy = py + 20; cy < H - 40; cy += 30) {
        const cx = px + Math.floor(Math.random() * (pw - 10));
        gMid.beginPath();
        gMid.arc(cx, cy, 5, 0, Math.PI * 2);
        gMid.fill();
      }
      gMid.shadowBlur = 0;
      px += pw + 25;
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
    this.layers.push({ mesh: meshMid, texture: texMid, speed: 0.002, baseOffset: 0 });

    // ── 3D Swimming Sharks in Background ──
    const sharkGroup = new THREE.Group();
    sharkGroup.position.set(0, 22, -40);
    const sharks = [];
    for (let s = 0; s < 5; s++) {
      const shark = new THREE.Group();
      // Streamlined body
      const body = new THREE.Mesh(
        new THREE.ConeGeometry(0.8, 4.0, 7),
        new THREE.MeshStandardMaterial({ color: 0x0a2236, roughness: 0.3, metalness: 0.7 })
      );
      body.rotation.z = -Math.PI / 2;
      shark.add(body);

      // Dorsal Fin
      const dFin = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 1.2, 4),
        new THREE.MeshStandardMaterial({ color: 0x05131f, metalness: 0.8 })
      );
      dFin.position.set(-0.3, 0.9, 0);
      dFin.rotation.z = -Math.PI / 6;
      shark.add(dFin);

      // Tail Fin (animated waggle)
      const tailFin = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.6, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x0a2236, metalness: 0.7 })
      );
      tailFin.position.set(-2.2, 0, 0);
      shark.add(tailFin);

      shark.position.set(s * 55 - 40, Math.sin(s * 1.8) * 8, (s % 2) * 8 - 15);
      sharkGroup.add(shark);
      sharks.push({ obj: shark, tail: tailFin, phase: s * 1.2, speed: 18 + s * 4 });
    }
    this.sceneryGroup.add(sharkGroup);

    this.animatedElements.push((time, delta) => {
      sharks.forEach((sh) => {
        sh.tail.rotation.y = Math.sin(time * 6 + sh.phase) * 0.45;
        sh.obj.position.x += delta * sh.speed;
        sh.obj.position.y += Math.sin(time * 1.5 + sh.phase) * 0.04;
        if (sh.obj.position.x > 240) {
          sh.obj.position.x = -120;
        }
      });
    });

    // ── 3D Rising Air Bubble Particles ──
    const bubbleCount = 220;
    const bubbleGeo = new THREE.BufferGeometry();
    const bubblePos = new Float32Array(bubbleCount * 3);
    for (let i = 0; i < bubbleCount * 3; i += 3) {
      bubblePos[i] = (Math.random() - 0.5) * 250;
      bubblePos[i + 1] = Math.random() * 45;
      bubblePos[i + 2] = (Math.random() - 0.5) * 35 - 20;
    }
    bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePos, 3));
    const bubbleMat = new THREE.PointsMaterial({
      color: 0x80deea,
      size: 1.8,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const bubblePoints = new THREE.Points(bubbleGeo, bubbleMat);
    this.sceneryGroup.add(bubblePoints);

    this.animatedElements.push((time, delta) => {
      const pos = bubbleGeo.attributes.position.array;
      for (let i = 1; i < bubbleCount * 3; i += 3) {
        pos[i] += delta * 11;
        pos[i - 1] += Math.sin(time * 3 + i) * 0.1;
        if (pos[i] > 45) pos[i] = 0;
      }
      bubbleGeo.attributes.position.needsUpdate = true;
    });
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
