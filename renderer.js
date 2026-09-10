// renderer.js - AAA Arcade 3D WebGL Engine for Dash Showdown in Three.js

import { SceneryManager } from './scenery.js';

// Polyfill CanvasRenderingContext2D.prototype.roundRect for cross-platform support (iOS/older Safari)
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r = 0) {
    let radius = typeof r === 'number' ? [r, r, r, r] : r;
    const [tl, tr, br, bl] = radius;
    this.beginPath();
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + tr);
    this.lineTo(x + w, y + h - br);
    this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    this.lineTo(x + bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - bl);
    this.lineTo(x, y + tl);
    this.quadraticCurveTo(x, y, x + tl, y);
    this.closePath();
    return this;
  };
}

// ⚡ Helical 3D Curve for Inductor Coil Superconducting Windings
class InductorHelixCurve extends THREE.Curve {
  constructor(startX, length, radius, turns, centerY, phase = 0) {
    super();
    this.startX = startX;
    this.length = length;
    this.radius = radius;
    this.turns = turns;
    this.centerY = centerY;
    this.phase = phase;
  }
  getPoint(t, optionalTarget = new THREE.Vector3()) {
    const x = this.startX + t * this.length;
    const angle = t * this.turns * Math.PI * 2 + this.phase;
    const y = this.centerY + Math.sin(angle) * this.radius;
    const z = Math.cos(angle) * this.radius;
    return optionalTarget.set(x, y, z);
  }
}

export class GameRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Track theme colors
    this.themeColor = new THREE.Color(0x00ff88);
    this.accentColor = new THREE.Color(0x00f0ff);

    // Track Groups
    this.trackGroup = new THREE.Group();
    this.groundMesh = null;
    this.ceilingMesh = null;
    this.obstaclesGroup = new THREE.Group();
    this.portalMeshes = [];
    this.orbMeshes = [];
    this.padMeshes = [];
    this.checkpointMeshes = [];
    this.spikeMeshes = [];
    this.stairMeshes = [];
    this.fanMeshes = [];
    this.lavaMeshes = [];
    this.lavaCanvas = null;
    this.lavaCtx = null;
    this.lavaTexture = null;
    this.lastLavaTextureTime = 0;
    this.shockwaves = []; // Dynamic expanding rings for pads/orbs/turns

    // ⚡ Massive 3D Sci-Fi Inductor Coil Transition Rig
    this.inductorCoilGroup = null;
    this.inductorRotorRings = [];
    this.inductorPulseRings = [];
    this.inductorArcs = [];
    this.inductorCoreLight = null;
    this.isCoilTransition = false;
    this.coilProgress = 0;
    this.defaultCameraFov = 54;
    this.plasmaStreamParticles = [];
    this.plasmaPoints = null;

    // Procedural Scenery Manager (Parallax Metropolis, Alien Ruins, Inferno, Quantum Nebula)
    this.sceneryManager = null;
    this.unstableBlocks = new Map();
    this.cameraShakeIntensity = 0;
    this.cameraShakeTimer = 0;

    // 🏰 Gothic Living Castle Systems & Ending Climax
    this.gothicSanctuaryGate = null;
    this.gothicFloorMeshes = [];
    this.unstableBlockMeshes = [];
    this.isCinematicFrozen = false;
    this.gothicBoomParticles = [];
    this.groundEdge = null;
    this.gridMesh = null;

    // Player Vehicles & High-End Animation Systems
    this.playerGroup = new THREE.Group();
    this.cubeMesh = null;
    this.cubeBody = null;
    this.cubeVisor = null;
    this.faceCanvas = null;
    this.faceCtx = null;
    this.faceTexture = null;
    this.faceExpression = 'normal';
    this.expressionTimer = 0;
    this.shipMesh = null;
    this.shipFlames = [];
    this.waveMesh = null;
    this.waveArrow = null;
    this.currentVehicle = "cube";

    // "Thousand Dollar Budget" Juice Variables
    this.cubeScale = new THREE.Vector3(1, 1, 1);
    this.cubeTargetScale = new THREE.Vector3(1, 1, 1);
    this.cubeRotationZ = 0;
    this.prevGrounded = true;
    this.eyeBlinkTimer = 3.0;

    // Trail Ribbon
    this.playerTrail = null;
    this.trailHistory = [];

    // Thruster & Ground Spark Particles
    this.thrusterParticles = [];
    this.sparkParticles = [];

    // Shatter Death Explosion Voxel System (24 physical pieces)
    this.voxelPieces = [];
    this.isExploding = false;

    // Ghost Racers / Party Members
    this.ghosts = [];

    // Collectible 3D Gems
    this.gemMeshes = [];
    this.gemParticles = [];

    // Camera & Screen Shake Trauma
    this.cameraTrauma = 0;
    this.cameraBaseY = 4.5;
    this.clock = new THREE.Clock();

    // 🥁 Hilarious Tung Tung Sahur 3D Meme Entity & Whacking Rig
    this.tungTungGroup = null;
    this.tungTungArm = null;
    this.tungTungLeftArm = null;
    this.tungTungLegs = [];
    this.tungTungState = {
      active: false,
      phase: 'idle',
      timer: 0,
      whackTimer: 0,
      strikes: 0,
      lastHitCycle: -1,
      exitVelX: 0,
      exitVelY: 0,
      whackCallback: null
    };

    // 🍄 Smurf Cat Blessing Aura & Halo
    this.smurfCatAuraActive = false;
    this.smurfCatHalo = null;
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene with Deep Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02040a);
    this.scene.fog = new THREE.FogExp2(0x040814, 0.011);

    // 2. Camera (2.5D Isometric side-scroller view)
    this.camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 900);
    this.camera.position.set(0, 4.5, 16);

    // 3. High Performance Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      stencil: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.container.appendChild(this.renderer.domElement);

    // 4. Dynamic Lighting
    this.setupLighting();

    // 5. Initialize Procedural Scenery Manager
    this.sceneryManager = new SceneryManager(this.scene, this);

    // 6. Track & Obstacles Groups
    this.scene.add(this.trackGroup);
    this.trackGroup.add(this.obstaclesGroup);

    // 7. Player Models with High-Budget Rigs
    this.setupPlayerModels();

    // 8. Death Voxel Fragments (24 Pieces)
    this.setupDeathVoxels();

    // 9. Particle Systems (Sparks & Thrusters)
    this.setupParticles();

    // 10. Shockwave Pool
    this.setupShockwaves();

    // 11. Tung Tung Sahur 3D Meme Whacking Rig
    this.setupTungTungCharacter();

    // 11b. 🌋 Dynamic Churning Procedural Lava Texture Engine
    this.setupLavaTexture();

    // 12. Window & Mobile Viewport Resize
    window.addEventListener('resize', () => this.onWindowResize());
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.onWindowResize());
    }
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.onWindowResize(), 150);
    });
  }

  // 🌋 High-Performance Animated Procedural Magma Texture Canvas
  setupLavaTexture() {
    this.lavaCanvas = document.createElement('canvas');
    this.lavaCanvas.width = 128;
    this.lavaCanvas.height = 64;
    this.lavaCtx = this.lavaCanvas.getContext('2d');
    this.lavaTexture = new THREE.CanvasTexture(this.lavaCanvas);
    this.lavaTexture.wrapS = THREE.RepeatWrapping;
    this.lavaTexture.wrapT = THREE.RepeatWrapping;
    this.lavaTexture.repeat.set(2, 1);
    this.updateLavaTexture(0);
  }

  updateLavaTexture(time) {
    if (!this.lavaCtx) return;
    const ctx = this.lavaCtx;
    const w = 128, h = 64;
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = x * 0.085;
        const ny = y * 0.12;
        const v1 = Math.sin(nx + time * 2.2);
        const v2 = Math.sin(ny - time * 1.8);
        const v3 = Math.sin((nx + ny) * 0.8 + time * 3.0);
        const v = (v1 + v2 + v3 + 3) / 6.0;

        const idx = (y * w + x) * 4;
        if (v < 0.42) {
          const t = v / 0.42;
          data[idx] = Math.floor(180 + t * 75);
          data[idx + 1] = Math.floor(20 + t * 70);
          data[idx + 2] = Math.floor(5 + t * 15);
        } else if (v < 0.78) {
          const t = (v - 0.42) / 0.36;
          data[idx] = 255;
          data[idx + 1] = Math.floor(90 + t * 130);
          data[idx + 2] = Math.floor(20 + t * 40);
        } else {
          const t = (v - 0.78) / 0.22;
          data[idx] = 255;
          data[idx + 1] = Math.floor(220 + t * 35);
          data[idx + 2] = Math.floor(60 + t * 195);
        }
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    this.lavaTexture.needsUpdate = true;
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x223355, 1.4);
    this.scene.add(ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.dirLight.position.set(25, 40, 30);
    this.scene.add(this.dirLight);

    // Dynamic track underglow point light following player
    this.underglow = new THREE.PointLight(0x00ff88, 3.0, 32);
    this.underglow.position.set(0, 2, 4);
    this.scene.add(this.underglow);
  }

  buildTrack(level) {
    // Clear old obstacles
    while (this.obstaclesGroup.children.length > 0) {
      const obj = this.obstaclesGroup.children[0];
      this.obstaclesGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }
    this.portalMeshes = [];
    this.orbMeshes = [];
    this.padMeshes = [];
    this.checkpointMeshes = [];
    this.spikeMeshes = [];
    this.gemMeshes = [];
    this.stairMeshes = [];
    this.fanMeshes = [];
    this.lavaMeshes = [];
    this.shieldPickupMeshes = [];
    this.counterOrbMeshes = [];
    this.speedGateMeshes = [];
    if (this.unstableBlocks) this.unstableBlocks.clear();
    if (this.shieldShatterPool) {
      this.shieldShatterPool.forEach(s => { s.active = false; s.mesh.visible = false; });
    }
    this.currentLevel = level;

    // Clean up previous Inductor Coil elements
    if (this.inductorCoreLight) {
      this.scene.remove(this.inductorCoreLight);
      this.inductorCoreLight = null;
    }
    this.inductorCoilGroup = null;
    this.inductorRotorRings = [];
    this.inductorPulseRings = [];
    this.inductorArcs = [];
    this.isCoilTransition = false;
    this.coilProgress = 0;
    if (this.camera) {
      this.camera.fov = this.defaultCameraFov;
      this.camera.updateProjectionMatrix();
    }

    // Clean up Gothic Castle specific elements
    if (this.gothicSanctuaryGate) {
      this.trackGroup.remove(this.gothicSanctuaryGate);
      this.gothicSanctuaryGate.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      this.gothicSanctuaryGate = null;
    }
    if (this.gothicFloorMeshes && this.gothicFloorMeshes.length > 0) {
      this.gothicFloorMeshes.forEach(obj => {
        this.trackGroup.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    }
    this.gothicFloorMeshes = [];
    this.unstableBlockMeshes = [];
    this.isCinematicFrozen = false;

    // Set Level Theme Color
    this.themeColor.set(level.diffColor || "#00FF88");
    if (this.underglow) this.underglow.color.copy(this.themeColor);

    // Setup Multi-Layered Procedural Scenery (Metropolis / Alien Ruins / Inferno / Quantum Nebula / Gothic Castle)
    this.sceneryManager.setupLevelScenery(level);

    const isGothic = (level.themeType === 'gothic');
    const groundLength = level.endX + 120;
    const groundGeo = new THREE.BoxGeometry(groundLength, 4, 14);

    // 1. Track Floor - Gothic Dark Stone vs Cyber Neon
    if (this.groundMesh) {
      this.trackGroup.remove(this.groundMesh);
      this.groundMesh.geometry.dispose();
      this.groundMesh = null;
    }
    if (this.groundEdge) {
      this.trackGroup.remove(this.groundEdge);
      this.groundEdge.geometry.dispose();
      this.groundEdge = null;
    }
    if (this.gridMesh) {
      this.trackGroup.remove(this.gridMesh);
      this.gridMesh.geometry.dispose();
      this.gridMesh = null;
    }

    if (isGothic) {
      // Authentic Dark Medieval Slate Stone Masonry Floor (NO glowing neon strip, NO cyber grid!)
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x14161d,
        roughness: 0.94,
        metalness: 0.12
      });
      this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
      this.groundMesh.position.set(groundLength / 2 - 20, -2, 0);
      this.trackGroup.add(this.groundMesh);

      // Build Stone Parapets, Corbel Arches & Wall Torch Sconces
      this.buildGothicFloorDetails(groundLength);
    } else {
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x060810,
        roughness: 0.3,
        metalness: 0.85
      });
      this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
      this.groundMesh.position.set(groundLength / 2 - 20, -2, 0);
      this.trackGroup.add(this.groundMesh);

      // Glowing Neon Top Edge Strip
      const edgeGeo = new THREE.BoxGeometry(groundLength, 0.16, 0.5);
      const edgeMat = new THREE.MeshBasicMaterial({ color: this.themeColor });
      this.groundEdge = new THREE.Mesh(edgeGeo, edgeMat);
      this.groundEdge.position.set(groundLength / 2 - 20, 0.08, 2.5);
      this.trackGroup.add(this.groundEdge);

      // Track Grid Lines on Floor
      const gridGeo = new THREE.PlaneGeometry(groundLength, 8, Math.floor(groundLength / 2), 4);
      const gridMat = new THREE.MeshBasicMaterial({
        color: this.themeColor,
        wireframe: true,
        transparent: true,
        opacity: 0.12
      });
      this.gridMesh = new THREE.Mesh(gridGeo, gridMat);
      this.gridMesh.rotation.x = -Math.PI / 2;
      this.gridMesh.position.set(groundLength / 2 - 20, 0.02, 0);
      this.trackGroup.add(this.gridMesh);
    }

    // Neon Ceiling Platform (for Ship / Gravity Inversion levels)
    if (this.ceilingMesh) {
      this.trackGroup.remove(this.ceilingMesh);
      this.ceilingMesh.geometry.dispose();
      this.ceilingMesh = null;
    }
    if (level.id >= 2) {
      const ceilGeo = new THREE.BoxGeometry(groundLength, 4, 14);
      const ceilMat = new THREE.MeshStandardMaterial({
        color: 0x060810,
        roughness: 0.3,
        metalness: 0.85
      });
      this.ceilingMesh = new THREE.Mesh(ceilGeo, ceilMat);
      const ceilY = (level.id === 2) ? 9 : 10;
      this.ceilingMesh.position.set(groundLength / 2 - 20, ceilY + 2, 0);
      this.trackGroup.add(this.ceilingMesh);

      // Glowing Neon Ceiling Edge Strip
      const ceilEdgeGeo = new THREE.BoxGeometry(groundLength, 0.16, 0.5);
      const ceilEdgeMat = new THREE.MeshBasicMaterial({ color: this.themeColor });
      const ceilEdge = new THREE.Mesh(ceilEdgeGeo, ceilEdgeMat);
      ceilEdge.position.set(groundLength / 2 - 20, ceilY - 0.08, 2.5);
      this.trackGroup.add(ceilEdge);
    }

    // 2. Build Handcrafted Obstacles from Level Data
    level.obstacles.forEach((obs, index) => {
      this.createObstacleMesh(obs, index);
    });

    // 3. Level Finish: Gothic Sanctuary Gate vs Sci-Fi Inductor Coil
    if (isGothic) {
      this.createGothicSanctuaryGate(level.endX);
    } else {
      this.createInductorCoil(level.endX);
    }
  }

  createObstacleMesh(obs, index) {
    const { type, x, y } = obs;

    if (type === "spike") {
      const isGothic = (this.currentLevel && this.currentLevel.themeType === 'gothic');
      if (isGothic) {
        // 🏰 Authentic Dark Medieval Forged Iron Pike on Weathered Stone Pedestal (Zero Neon!)
        const spikeGroup = new THREE.Group();
        const height = 1.1;
        const radius = 0.48;

        // 1. Heavy Weathered Stone Octagonal Pedestal Base
        const baseGeo = new THREE.CylinderGeometry(radius * 1.2, radius * 1.35, 0.16, 8);
        const baseMat = new THREE.MeshStandardMaterial({
          color: 0x1c1e24,
          roughness: 0.92,
          metalness: 0.12
        });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = 0.08;
        spikeGroup.add(baseMesh);

        // 2. Forged Black Iron Spire Pike with 4 Chiseled Blade Facets
        const pikeGeo = new THREE.ConeGeometry(radius, height, 4);
        const pikeMat = new THREE.MeshStandardMaterial({
          color: 0x121316,
          roughness: 0.42,
          metalness: 0.85,
          flatShading: true
        });
        const pikeMesh = new THREE.Mesh(pikeGeo, pikeMat);
        pikeMesh.position.y = 0.16 + height / 2;
        pikeMesh.rotation.y = Math.PI / 4;
        spikeGroup.add(pikeMesh);

        // 3. Forged Iron Collar Ring
        const collarGeo = new THREE.CylinderGeometry(radius * 0.75, radius * 0.85, 0.08, 8);
        const collarMat = new THREE.MeshStandardMaterial({
          color: 0x22242a,
          roughness: 0.5,
          metalness: 0.85
        });
        const collar = new THREE.Mesh(collarGeo, collarMat);
        collar.position.y = 0.18;
        spikeGroup.add(collar);

        if (obs.dir === "down") {
          spikeGroup.rotation.z = Math.PI;
          spikeGroup.position.set(x, y, 0);
        } else {
          spikeGroup.position.set(x, y, 0);
        }

        spikeGroup.userData = { obstacle: obs, isGothic: true };
        this.spikeMeshes.push(spikeGroup);
        this.obstaclesGroup.add(spikeGroup);
      } else {
        // Realistic 3D Obsidian Crystal Spike with Hex Steel Base & Glowing Energy Core
        const spikeGroup = new THREE.Group();
        const height = 1.08;
        const radius = 0.52;

        // 1. Heavy Gunmetal Hexagonal Base Plate with Neon Hazard Trim
        const baseGeo = new THREE.CylinderGeometry(radius * 1.15, radius * 1.25, 0.12, 6);
        const baseMat = new THREE.MeshStandardMaterial({
          color: 0x0e1320,
          roughness: 0.28,
          metalness: 0.94
        });
        const basePlate = new THREE.Mesh(baseGeo, baseMat);
        basePlate.position.y = 0.06;
        spikeGroup.add(basePlate);

        // Warning hazard wireframe around hexagonal base
        const baseWireGeo = new THREE.EdgesGeometry(baseGeo);
        const hazardColor = obs.dir === "down" ? 0xff0055 : 0xffaa00;
        const baseWireMat = new THREE.LineBasicMaterial({ color: hazardColor, linewidth: 1.5 });
        basePlate.add(new THREE.LineSegments(baseWireGeo, baseWireMat));

        // 2. Multi-faceted 8-Facet Obsidian Crystal Cone with Metallic Specular Sheen
        const coneGeo = new THREE.ConeGeometry(radius, height, 8);
        const coneMat = new THREE.MeshStandardMaterial({
          color: 0x080c18,
          roughness: 0.06,
          metalness: 0.98,
          flatShading: true
        });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.y = 0.12 + height / 2;
        spikeGroup.add(cone);

        // 3. Razor-Sharp Saturated Glowing Neon Bevel Wireframe
        const wireGeo = new THREE.EdgesGeometry(coneGeo);
        const wireColor = obs.dir === "down" ? 0xff0055 : 0x00f0ff;
        const wireMat = new THREE.LineBasicMaterial({ color: wireColor, linewidth: 2.5 });
        const wire = new THREE.LineSegments(wireGeo, wireMat);
        cone.add(wire);

        // 4. Floating Pulsing Internal Energy Core (Octahedron)
        const coreGeo = new THREE.OctahedronGeometry(0.18, 0);
        const coreMat = new THREE.MeshBasicMaterial({
          color: wireColor,
          transparent: true,
          opacity: 0.95
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.y = 0.42;
        spikeGroup.add(core);

        if (obs.dir === "down") {
          spikeGroup.rotation.z = Math.PI;
          spikeGroup.position.set(x, y, 0);
        } else {
          spikeGroup.position.set(x, y, 0);
        }

        spikeGroup.userData = {
          core: core,
          wireColor: wireColor,
          pulseOffset: Math.random() * Math.PI * 2
        };
        this.spikeMeshes.push(spikeGroup);
        this.obstaclesGroup.add(spikeGroup);
      }
    }
    else if (type === "block") {
      const w = obs.w || 2;
      const h = obs.h || 2;
      const isUnstable = !!obs.unstable;
      const isGothic = (this.currentLevel && this.currentLevel.themeType === 'gothic');
      const isFairyland = (this.currentLevel && this.currentLevel.themeType === 'fairyland');
      const isShark = (this.currentLevel && this.currentLevel.themeType === 'shark');

      if (isGothic) {
        // 🏰 Medieval Fortress Masonry Block with Forged Iron Straps & Stone Battlement Details (Zero Neon!)
        const blockGeo = new THREE.BoxGeometry(w, h, 2.2);
        const blockMat = new THREE.MeshStandardMaterial({
          color: isUnstable ? 0x22171c : 0x161820,
          roughness: 0.9,
          metalness: 0.18
        });
        const block = new THREE.Mesh(blockGeo, blockMat);

        // Carved Dark Stone Coping Bevel (Top)
        const stoneCopingGeo = new THREE.BoxGeometry(w + 0.04, 0.12, 2.24);
        const stoneCopingMat = new THREE.MeshStandardMaterial({
          color: isUnstable ? 0x341a22 : 0x242730,
          roughness: 0.85,
          metalness: 0.15
        });
        const stoneCopingTop = new THREE.Mesh(stoneCopingGeo, stoneCopingMat);
        stoneCopingTop.position.y = h / 2 - 0.06;
        block.add(stoneCopingTop);

        // Forged Black Iron Straps / Corner Brackets
        const strapGeo = new THREE.BoxGeometry(0.18, h * 0.9, 2.22);
        const strapMat = new THREE.MeshStandardMaterial({
          color: 0x0f1013,
          roughness: 0.4,
          metalness: 0.85
        });
        const strapL = new THREE.Mesh(strapGeo, strapMat);
        strapL.position.x = -w / 2 + 0.25;
        block.add(strapL);
        const strapR = new THREE.Mesh(strapGeo, strapMat);
        strapR.position.x = w / 2 - 0.25;
        block.add(strapR);

        // Battlement Crenellations for ramparts (NO glowing wire!)
        if (!isUnstable && h >= 1.5 && w >= 3) {
          const crenCount = Math.floor(w / 1.5);
          for (let cr = 0; cr < crenCount; cr += 2) {
            const cren = new THREE.Mesh(
              new THREE.BoxGeometry(0.7, 0.45, 2.22),
              new THREE.MeshStandardMaterial({ color: 0x1e2028, roughness: 0.85, metalness: 0.15 })
            );
            cren.position.set(-w / 2 + 0.5 + cr * 1.5, h / 2 + 0.22, 0);
            block.add(cren);
          }
        }

        block.position.set(x + w / 2, y + h / 2, 0);
        block.userData = {
          obstacle: obs,
          isGothic: true,
          isUnstable: isUnstable,
          baseX: x + w / 2,
          baseY: y + h / 2,
          baseZ: 0,
          jitterPhase: Math.random() * Math.PI * 2
        };

        if (isUnstable) {
          this.unstableBlockMeshes.push(block);
          if (!this.unstableBlocks) this.unstableBlocks = new Map();
          this.unstableBlocks.set(obs, {
            mesh: block,
            initialX: x + w / 2,
            initialY: y + h / 2,
            initialZ: 0,
            shake: 0,
            shakeTimer: 0,
            falling: false,
            vy: 0,
            rotVel: 0
          });
        }
        this.obstaclesGroup.add(block);
      } else {
        // Themed Track Block with Neon Edges
        const themeBlockColor = isUnstable ? 0x240610 : 0x090d18;
        const themeWireColor = isUnstable ? 0xff1744 : (isFairyland ? 0x00ff88 : (isShark ? 0x00e5ff : 0xd500f9));

        const geo = new THREE.BoxGeometry(w, h, 2.2);
        const mat = new THREE.MeshStandardMaterial({
          color: themeBlockColor,
          roughness: isUnstable ? 0.65 : 0.25,
          metalness: 0.85
        });
        const block = new THREE.Mesh(geo, mat);

        const wireGeo = new THREE.EdgesGeometry(geo);
        const wireMat = new THREE.LineBasicMaterial({ color: themeWireColor, linewidth: isUnstable ? 2.5 : 2 });
        block.add(new THREE.LineSegments(wireGeo, wireMat));

        // Inner glowing pattern
        const innerGeo = new THREE.PlaneGeometry(w * 0.78, h * 0.78);
        const innerMat = new THREE.MeshBasicMaterial({
          color: themeWireColor,
          transparent: true,
          opacity: isUnstable ? 0.35 : 0.15
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        inner.position.z = 1.11;
        block.add(inner);

        block.position.set(x + w / 2, y + h / 2, 0);
        block.userData = {
          obstacle: obs,
          isUnstable: isUnstable,
          baseX: x + w / 2,
          baseY: y + h / 2,
          baseZ: 0,
          jitterPhase: Math.random() * Math.PI * 2
        };

        if (isUnstable) {
          this.unstableBlockMeshes.push(block);
          if (!this.unstableBlocks) this.unstableBlocks = new Map();
          this.unstableBlocks.set(obs, {
            mesh: block,
            initialX: x + w / 2,
            initialY: y + h / 2,
            initialZ: 0,
            shake: 0,
            shakeTimer: 0,
            falling: false,
            vy: 0,
            rotVel: 0
          });
        }
        this.obstaclesGroup.add(block);
      }
    }
    else if (type === "pad") {
      // High-Impact Jump Pad (Yellow / Pink / Red)
      const padGroup = new THREE.Group();
      let padColor = 0xffd000;
      if (obs.subType === "pink") padColor = 0xff007f;
      else if (obs.subType === "red") padColor = 0xff1744;

      // Base Plate
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.12, 1.6),
        new THREE.MeshStandardMaterial({ color: 0x111624, metalness: 0.9 })
      );
      padGroup.add(base);

      // Spring Launch Top
      const topGeo = new THREE.BoxGeometry(1.4, 0.18, 1.4);
      const topMat = new THREE.MeshBasicMaterial({ color: padColor });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = 0.15;
      padGroup.add(top);

      // Spring Column
      const springGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 8);
      const springMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9 });
      const spring = new THREE.Mesh(springGeo, springMat);
      spring.position.y = 0.08;
      padGroup.add(spring);

      const isCeiling = (obs.y > 5);
      if (isCeiling) {
        padGroup.rotation.z = Math.PI;
        padGroup.position.set(x, obs.y - 0.1, 0);
      } else {
        padGroup.position.set(x, obs.y + 0.1, 0);
      }

      padGroup.userData = {
        obstacle: obs,
        topMesh: top,
        springMesh: spring,
        padColor: padColor,
        bounceTimer: 0,
        triggerBounce: () => {
          padGroup.userData.bounceTimer = 1.0;
          this.triggerShockwave(padGroup.position.x, padGroup.position.y, padColor, 2.5);
        }
      };
      this.padMeshes.push(padGroup);
      this.obstaclesGroup.add(padGroup);
    }
    else if (type === "orb") {
      // Floating Jump Orb (Yellow / Pink / Blue Gravity)
      const orbGroup = new THREE.Group();
      let orbColor = 0xffd000;
      if (obs.subType === "blue") orbColor = 0x00f0ff;
      else if (obs.subType === "pink") orbColor = 0xff007f;

      // Glowing Core Sphere
      const coreGeo = new THREE.SphereGeometry(0.48, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({ color: orbColor });
      const core = new THREE.Mesh(coreGeo, coreMat);
      orbGroup.add(core);

      // Outer Dual Torus Gyro Rings
      const ringGeo = new THREE.TorusGeometry(0.9, 0.08, 12, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: orbColor });
      const ring1 = new THREE.Mesh(ringGeo, ringMat);
      const ring2 = ring1.clone();
      ring2.rotation.y = Math.PI / 3;
      ring2.rotation.x = Math.PI / 6;
      orbGroup.add(ring1);
      orbGroup.add(ring2);

      orbGroup.position.set(x, y, 0);
      orbGroup.userData = {
        obstacle: obs,
        ring1: ring1,
        ring2: ring2,
        orbColor: orbColor,
        pulseVal: 0,
        triggerOrb: () => {
          orbGroup.userData.pulseVal = 1.0;
          this.triggerShockwave(x, y, orbColor, 3.2);
        }
      };
      this.orbMeshes.push(orbGroup);
      this.obstaclesGroup.add(orbGroup);
    }
    else if (type === "portal") {
      // Glowing 3D Dimensional Portal
      const portalGroup = new THREE.Group();
      let portalColor = 0x00ff88;
      if (obs.subType === "wave") portalColor = 0x00f0ff;
      else if (obs.subType === "cube") portalColor = 0xffd000;
      else if (obs.subType === "gravity_up") portalColor = 0x00b0ff;
      else if (obs.subType === "gravity_down") portalColor = 0xff7700;
      else if (obs.subType === "ufo") portalColor = 0xffa500;

      // Arched Outer Frame
      const ringGeo = new THREE.TorusGeometry(1.7, 0.22, 16, 40);
      const ringMat = new THREE.MeshStandardMaterial({
        color: portalColor,
        emissive: portalColor,
        emissiveIntensity: 0.9,
        roughness: 0.2
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      portalGroup.add(ring);

      // Swirling Dimensional Vortex Disc
      const discGeo = new THREE.CircleGeometry(1.5, 32);
      const discMat = new THREE.MeshBasicMaterial({
        color: portalColor,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide
      });
      const disc = new THREE.Mesh(discGeo, discMat);
      portalGroup.add(disc);

      portalGroup.position.set(x, y, 0);
      portalGroup.userData = {
        obstacle: obs,
        ringMesh: ring,
        discMesh: disc,
        rotSpeed: 3.5
      };
      this.portalMeshes.push(portalGroup);
      this.obstaclesGroup.add(portalGroup);
    }
    else if (type === "gem") {
      // 💎 3D Faceted Crystal Gem with Metallic Specular Sheen & Sparkle Aura
      const gemGroup = new THREE.Group();
      const gemColor = obs.color || 0x00f0ff;

      const gemGeo = new THREE.OctahedronGeometry(0.52, 0);
      const gemMat = new THREE.MeshStandardMaterial({
        color: gemColor,
        roughness: 0.12,
        metalness: 0.95,
        emissive: gemColor,
        emissiveIntensity: 0.5
      });
      const gemMesh = new THREE.Mesh(gemGeo, gemMat);
      gemMesh.scale.set(1.0, 1.45, 1.0);
      gemGroup.add(gemMesh);

      const wireGeo = new THREE.WireframeGeometry(gemGeo);
      const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2, transparent: true, opacity: 0.85 });
      const wire = new THREE.LineSegments(wireGeo, wireMat);
      wire.scale.set(1.02, 1.47, 1.02);
      gemGroup.add(wire);

      // 3 Orbiting Sparkle Specks
      const sparkleGroup = new THREE.Group();
      for (let s = 0; s < 3; s++) {
        const spk = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.12, 0.12),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        const angle = (s / 3) * Math.PI * 2;
        spk.position.set(Math.cos(angle) * 0.85, Math.sin(angle) * 0.3, Math.sin(angle) * 0.85);
        sparkleGroup.add(spk);
      }
      gemGroup.add(sparkleGroup);

      gemGroup.position.set(x, y, 0);
      gemGroup.userData = {
        obstacle: obs,
        gemMesh: gemMesh,
        wireMesh: wire,
        sparkleGroup: sparkleGroup,
        baseY: y,
        isCollected: false
      };
      this.gemMeshes.push(gemGroup);
      this.obstaclesGroup.add(gemGroup);
    }
    else if (type === "speed_gate") {
      // ⚡ High-Speed Quantum Acceleration Gate
      const gateGroup = new THREE.Group();
      const mult = obs.speedMult || 2.0;
      let gateColor = 0x00ff88;
      if (mult <= 0.75) gateColor = 0xff8800;
      else if (mult === 1.0) gateColor = 0xffd700;
      else if (mult === 2.0) gateColor = 0x00ff88;
      else if (mult === 3.0) gateColor = 0xd500f9;
      else if (mult >= 4.0) gateColor = 0x00ffff;

      // Twin Slanted Arch Pylons
      const pylonGeo = new THREE.BoxGeometry(0.35, 5.0, 0.45);
      const pylonMat = new THREE.MeshStandardMaterial({
        color: 0x0c1424,
        roughness: 0.2,
        metalness: 0.9
      });
      const pylonL = new THREE.Mesh(pylonGeo, pylonMat);
      pylonL.position.set(-0.2, 2.5, -2.0);
      const pylonR = new THREE.Mesh(pylonGeo, pylonMat);
      pylonR.position.set(-0.2, 2.5, 2.0);
      gateGroup.add(pylonL);
      gateGroup.add(pylonR);

      // Glowing Neon Pylon Wireframes
      const pylonWireMat = new THREE.LineBasicMaterial({ color: gateColor, linewidth: 2 });
      pylonL.add(new THREE.LineSegments(new THREE.EdgesGeometry(pylonGeo), pylonWireMat));
      pylonR.add(new THREE.LineSegments(new THREE.EdgesGeometry(pylonGeo), pylonWireMat));

      // 3 Floating Directional Speed Chevrons '>>>'
      const chevronsGroup = new THREE.Group();
      for (let c = 0; c < 3; c++) {
        const chevGeo = new THREE.ConeGeometry(0.55, 0.7, 3);
        const chevMat = new THREE.MeshBasicMaterial({
          color: gateColor,
          transparent: true,
          opacity: 0.85
        });
        const chev = new THREE.Mesh(chevGeo, chevMat);
        chev.rotation.z = -Math.PI / 2;
        chev.position.set((c - 1) * 0.9, 2.5, 0);
        chevronsGroup.add(chev);
      }
      gateGroup.add(chevronsGroup);

      // Top Sign Header
      const signGeo = new THREE.BoxGeometry(1.6, 0.45, 0.15);
      const signMat = new THREE.MeshBasicMaterial({ color: gateColor });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(0, 5.1, 0);
      gateGroup.add(sign);

      gateGroup.position.set(x, y, 0);
      gateGroup.userData = {
        obstacle: obs,
        chevrons: chevronsGroup,
        color: gateColor,
        mult: mult
      };
      this.obstaclesGroup.add(gateGroup);
      if (!this.speedGateMeshes) this.speedGateMeshes = [];
      this.speedGateMeshes.push(gateGroup);
    }
    else if (type === "shield") {
      // 🛡️ Collectible 3D Energy Shield Orb & Vertical Light Beacon
      const shieldGroup = new THREE.Group();

      // Vertical Holy Light Beacon Pillar
      const beaconGeo = new THREE.CylinderGeometry(0.06, 0.06, 24.0, 8);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = 12.0;
      shieldGroup.add(beacon);

      // Core Octahedron Crystal
      const coreGeo = new THREE.OctahedronGeometry(0.44, 0);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00c8ff,
        emissiveIntensity: 1.2,
        metalness: 0.95,
        roughness: 0.1
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      shieldGroup.add(core);

      // Outer Pulsing Hexagonal Wire Cage
      const cageGeo = new THREE.IcosahedronGeometry(0.76, 1);
      const cageMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        wireframe: true,
        transparent: true,
        opacity: 0.75
      });
      const cage = new THREE.Mesh(cageGeo, cageMat);
      shieldGroup.add(cage);

      // Floating Orbiting Gyro Ring
      const ringGeo = new THREE.TorusGeometry(0.92, 0.035, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 3;
      shieldGroup.add(ring);

      shieldGroup.position.set(x, y, 0);
      shieldGroup.userData = {
        obstacle: obs,
        core: core,
        cage: cage,
        ring: ring,
        beacon: beacon,
        isCollected: false
      };
      this.obstaclesGroup.add(shieldGroup);
      if (!this.shieldPickupMeshes) this.shieldPickupMeshes = [];
      this.shieldPickupMeshes.push(shieldGroup);
    }
    else if (type === "counter_orb") {
      // 🚀 Rhythm Counter-Attack Turret Orb
      const turretGroup = new THREE.Group();
      const ring1Geo = new THREE.TorusGeometry(0.85, 0.08, 12, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffa500,
        emissiveIntensity: 0.9,
        metalness: 0.9,
        roughness: 0.1
      });
      const ring1 = new THREE.Mesh(ring1Geo, ringMat);
      turretGroup.add(ring1);

      const ring2Geo = new THREE.TorusGeometry(0.65, 0.06, 12, 28);
      const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.rotation.x = Math.PI / 2;
      turretGroup.add(ring2);

      // Inner Glowing Target Crosshair
      const crossGeo = new THREE.OctahedronGeometry(0.25, 0);
      const crossMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const cross = new THREE.Mesh(crossGeo, crossMat);
      turretGroup.add(cross);

      turretGroup.position.set(x, y, 0);
      turretGroup.userData = {
        obstacle: obs,
        ring1: ring1,
        ring2: ring2,
        cross: cross,
        pulseVal: 0,
        triggerTurret: () => {
          turretGroup.userData.pulseVal = 1.2;
          this.triggerShockwave(x, y, 0xffd700, 3.5);
        }
      };
      this.obstaclesGroup.add(turretGroup);
      if (!this.counterOrbMeshes) this.counterOrbMeshes = [];
      this.counterOrbMeshes.push(turretGroup);
    }
    else if (type === "stairs") {
      const stairGroup = new THREE.Group();
      const numSteps = obs.steps || 4;
      const stepW = obs.stepW || 1.2;
      const stepH = obs.stepH || 0.5;
      const dir = obs.dir || "up";
      const isGothic = (this.currentLevel && this.currentLevel.themeType === 'gothic');
      const isFairyland = (this.currentLevel && this.currentLevel.themeType === 'fairyland');
      const isShark = (this.currentLevel && this.currentLevel.themeType === 'shark');

      if (isGothic) {
        // 🏰 Medieval Chiseled Dark Stone Steps with Forged Iron Rivet Detailing (Zero Neon!)
        for (let i = 0; i < numSteps; i++) {
          const stepIdx = (dir === "down") ? (numSteps - 1 - i) : i;
          const currentH = (stepIdx + 1) * stepH;
          const stepX = x + i * stepW + stepW / 2;
          const stepY = y + currentH / 2;

          const stepGeo = new THREE.BoxGeometry(stepW, currentH, 2.4);
          const stepMat = new THREE.MeshStandardMaterial({
            color: 0x1c1e26,
            roughness: 0.88,
            metalness: 0.15
          });
          const stepMesh = new THREE.Mesh(stepGeo, stepMat);
          stepMesh.position.set(stepX, stepY, 0);

          // Chiseled Stone Nosing along tread edge
          const nosingGeo = new THREE.BoxGeometry(stepW * 1.02, 0.08, 0.15);
          const nosingMat = new THREE.MeshStandardMaterial({
            color: 0x2c2f3a,
            roughness: 0.8,
            metalness: 0.2
          });
          const nosing = new THREE.Mesh(nosingGeo, nosingMat);
          nosing.position.set(0, currentH / 2 - 0.04, 1.22);
          stepMesh.add(nosing);

          // Black Iron Bracket Stud on outer face
          const studGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 6);
          const studMat = new THREE.MeshStandardMaterial({
            color: 0x101114,
            roughness: 0.35,
            metalness: 0.85
          });
          const stud = new THREE.Mesh(studGeo, studMat);
          stud.rotation.x = Math.PI / 2;
          stud.position.set(0, currentH / 2 - 0.14, 1.22);
          stepMesh.add(stud);

          stairGroup.add(stepMesh);
        }

        stairGroup.userData = {
          obstacle: obs,
          isGothic: true,
          steps: numSteps,
          stepW: stepW,
          stepH: stepH,
          dir: dir
        };
        this.stairMeshes.push(stairGroup);
        this.obstaclesGroup.add(stairGroup);
      } else {
        // 🪜 Premium 3D Multi-Tier Architectural Staircase with LED Light Runners
        const stairBaseColor = isFairyland ? 0x1a0d28 : (isShark ? 0x071b2c : 0x090f1d);
        const stairNeonColor = isFairyland ? 0x00ff88 : (isShark ? 0x00e5ff : 0xd500f9);

        const stepRunners = [];
        const riserPanels = [];

        for (let i = 0; i < numSteps; i++) {
          const stepIdx = (dir === "down") ? (numSteps - 1 - i) : i;
          const currentH = (stepIdx + 1) * stepH;
          const stepX = x + i * stepW + stepW / 2;
          const stepY = y + currentH / 2;

          // 1. Step Base Body
          const stepGeo = new THREE.BoxGeometry(stepW, currentH, 2.4);
          const stepMat = new THREE.MeshStandardMaterial({
            color: stairBaseColor,
            roughness: 0.3,
            metalness: 0.85
          });
          const stepMesh = new THREE.Mesh(stepGeo, stepMat);
          stepMesh.position.set(stepX, stepY, 0);

          // Edge wireframe
          const wire = new THREE.LineSegments(
            new THREE.EdgesGeometry(stepGeo),
            new THREE.LineBasicMaterial({ color: stairNeonColor, linewidth: 1.5, transparent: true, opacity: 0.85 })
          );
          stepMesh.add(wire);

          // 2. Glowing Tread Lip Neon Runner (Top-front edge)
          const runnerGeo = new THREE.BoxGeometry(stepW * 0.96, 0.08, 0.18);
          const runnerMat = new THREE.MeshBasicMaterial({ color: stairNeonColor });
          const runner = new THREE.Mesh(runnerGeo, runnerMat);
          runner.position.set(0, currentH / 2 + 0.04, 1.15);
          stepMesh.add(runner);
          stepRunners.push(runner);

          // 3. Illuminated Riser Panel on vertical face
          const riserGeo = new THREE.PlaneGeometry(stepW * 0.85, Math.max(0.2, stepH * 0.7));
          const riserMat = new THREE.MeshBasicMaterial({
            color: stairNeonColor,
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide
          });
          const riser = new THREE.Mesh(riserGeo, riserMat);
          riser.position.set(0, currentH / 2 - stepH / 2, 1.21);
          stepMesh.add(riser);
          riserPanels.push(riser);

          stairGroup.add(stepMesh);
        }

        stairGroup.userData = {
          obstacle: obs,
          runners: stepRunners,
          risers: riserPanels,
          neonColor: stairNeonColor,
          steps: numSteps,
          stepW: stepW,
          stepH: stepH,
          dir: dir,
          pulseOffset: Math.random() * Math.PI * 2
        };
        this.stairMeshes.push(stairGroup);
        this.obstaclesGroup.add(stairGroup);
      }
    }
    else if (type === "fan" || type === "aero_fan") {
      // 🌪️ High-Tech Aerodynamic Updraft Turbine Rig
      const fanGroup = new THREE.Group();
      const fanW = obs.w || 3.2;
      const fanH = obs.height || 7.5;
      let fanColor = 0x00f0ff;
      if (obs.subType === "magma") fanColor = 0xff4500;
      else if (obs.subType === "emerald") fanColor = 0x00ff88;
      else if (obs.subType === "amethyst") fanColor = 0xd500f9;

      // 1. Heavy Industrial Hexagonal Turbine Cowling
      const baseGeo = new THREE.BoxGeometry(fanW, 0.45, 2.6);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x0c1220,
        roughness: 0.2,
        metalness: 0.95
      });
      const fanBase = new THREE.Mesh(baseGeo, baseMat);
      fanBase.position.set(x + fanW / 2, y + 0.22, 0);
      fanGroup.add(fanBase);

      // Warning hazard wireframe around turbine base
      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(baseGeo),
        new THREE.LineBasicMaterial({ color: fanColor, linewidth: 2 })
      );
      fanBase.add(wire);

      // Glowing Intake Bevel Rim
      const rimGeo = new THREE.CylinderGeometry(fanW * 0.42, fanW * 0.45, 0.16, 16);
      const rimMat = new THREE.MeshBasicMaterial({ color: fanColor });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.set(0, 0.28, 0);
      fanBase.add(rim);

      // Protective Intake Grille
      const grilleGeo = new THREE.PlaneGeometry(fanW * 0.8, 1.8);
      const grilleMat = new THREE.MeshBasicMaterial({
        color: fanColor,
        wireframe: true,
        transparent: true,
        opacity: 0.35
      });
      const grille = new THREE.Mesh(grilleGeo, grilleMat);
      grille.rotation.x = -Math.PI / 2;
      grille.position.set(0, 0.35, 0);
      fanBase.add(grille);

      // 2. High-Speed Rotating Aerodynamic Rotor Hub & Multi-Blade Propeller
      const rotorGroup = new THREE.Group();
      const hubGeo = new THREE.ConeGeometry(0.35, 0.55, 12);
      const hubMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95 });
      const hub = new THREE.Mesh(hubGeo, hubMat);
      hub.position.y = 0.28;
      rotorGroup.add(hub);

      // 6 Aerodynamic Curved Fan Blades
      const bladeGeo = new THREE.BoxGeometry(fanW * 0.38, 0.06, 0.22);
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0x1a2638,
        emissive: fanColor,
        emissiveIntensity: 0.25,
        metalness: 0.9
      });
      for (let b = 0; b < 6; b++) {
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        const angle = (b / 6) * Math.PI * 2;
        blade.rotation.y = angle;
        blade.rotation.z = 0.25;
        blade.position.set(Math.cos(angle) * (fanW * 0.2), 0.15, Math.sin(angle) * (fanW * 0.2));
        rotorGroup.add(blade);
      }
      fanBase.add(rotorGroup);

      // 3. Volumetric Updraft Wind Beam Stream
      const windColGeo = new THREE.CylinderGeometry(fanW * 0.44, fanW * 0.38, fanH, 16, 1, true);
      const windColMat = new THREE.MeshBasicMaterial({
        color: fanColor,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const windColumn = new THREE.Mesh(windColGeo, windColMat);
      windColumn.position.set(x + fanW / 2, y + fanH / 2 + 0.45, 0);
      fanGroup.add(windColumn);

      // 4. Spiraling Upward Wind Helical Ribbons
      const ribbons = [];
      for (let r = 0; r < 3; r++) {
        const ribGeo = new THREE.TorusGeometry(fanW * 0.36, 0.04, 8, 24, Math.PI * 1.5);
        const ribMat = new THREE.MeshBasicMaterial({
          color: fanColor,
          transparent: true,
          opacity: 0.65
        });
        const rib = new THREE.Mesh(ribGeo, ribMat);
        rib.rotation.x = Math.PI / 2;
        rib.userData = { basePhase: (r / 3) * Math.PI * 2, yOffset: (r / 3) * fanH };
        ribbons.push(rib);
        fanGroup.add(rib);
      }

      // 5. Upward Pulsing Gust Rings
      const gustRings = [];
      for (let g = 0; g < 4; g++) {
        const gGeo = new THREE.TorusGeometry(fanW * 0.32, 0.05, 8, 28);
        const gMat = new THREE.MeshBasicMaterial({
          color: fanColor,
          transparent: true,
          opacity: 0.55
        });
        const gRing = new THREE.Mesh(gGeo, gMat);
        gRing.rotation.x = Math.PI / 2;
        gRing.userData = { phase: g / 4 };
        gustRings.push(gRing);
        fanGroup.add(gRing);
      }

      fanGroup.userData = {
        obstacle: obs,
        rotor: rotorGroup,
        windColumn: windColumn,
        ribbons: ribbons,
        gustRings: gustRings,
        fanColor: fanColor,
        fanW: fanW,
        fanH: fanH,
        baseX: x + fanW / 2,
        baseY: y,
        spinSpeed: 24.0
      };
      this.fanMeshes.push(fanGroup);
      this.obstaclesGroup.add(fanGroup);
    }
    else if (type === "lava" || type === "lava_pit") {
      // 🌋 Dynamic Molten Lava Lake with Churning Magma Canvas & Volcanic Basalt Rocks
      const lavaGroup = new THREE.Group();
      const lavaW = obs.w || 8.0;
      const lavaH = obs.h || 0.8;

      // 1. Heavy Volcanic Basalt Basin
      const basinGeo = new THREE.BoxGeometry(lavaW + 0.4, 0.35, 3.0);
      const basinMat = new THREE.MeshStandardMaterial({
        color: 0x100604,
        roughness: 0.85,
        metalness: 0.2
      });
      const basin = new THREE.Mesh(basinGeo, basinMat);
      basin.position.set(x + lavaW / 2, y + 0.12, 0);
      lavaGroup.add(basin);

      // Glowing Ember Fissure Wireframe around basin edge
      const basinWire = new THREE.LineSegments(
        new THREE.EdgesGeometry(basinGeo),
        new THREE.LineBasicMaterial({ color: 0xff3700, linewidth: 1.5 })
      );
      basin.add(basinWire);

      // 2. Molten Liquid Lava Surface Plane with Procedural Animated Magma Texture
      const lavaGeo = new THREE.PlaneGeometry(lavaW, 2.6, Math.max(4, Math.floor(lavaW)), 4);
      const lavaMat = new THREE.MeshBasicMaterial({
        map: this.lavaTexture,
        side: THREE.DoubleSide
      });
      const lavaSurface = new THREE.Mesh(lavaGeo, lavaMat);
      lavaSurface.rotation.x = -Math.PI / 2;
      lavaSurface.position.set(x + lavaW / 2, y + lavaH, 0);
      lavaGroup.add(lavaSurface);

      // 3. Shimmering Atmospheric Heat Haze Layer
      const hazeGeo = new THREE.PlaneGeometry(lavaW, 2.6);
      const hazeMat = new THREE.MeshBasicMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 0.18,
        depthWrite: false
      });
      const haze = new THREE.Mesh(hazeGeo, hazeMat);
      haze.rotation.x = -Math.PI / 2;
      haze.position.set(x + lavaW / 2, y + lavaH + 0.12, 0);
      lavaGroup.add(haze);

      // 4. Floating Volcanic Obsidian Crust Islands
      const crustCount = Math.max(1, Math.floor(lavaW / 3.5));
      const crusts = [];
      for (let c = 0; c < crustCount; c++) {
        const cGeo = new THREE.BoxGeometry(1.2, 0.14, 1.4);
        const cMat = new THREE.MeshStandardMaterial({
          color: 0x180705,
          roughness: 0.6,
          metalness: 0.3
        });
        const crust = new THREE.Mesh(cGeo, cMat);
        const cx = x + 1.2 + c * (lavaW / crustCount);
        crust.position.set(cx, y + lavaH + 0.02, (Math.random() - 0.5) * 0.8);
        crust.userData = { bobPhase: Math.random() * Math.PI * 2, baseX: cx, baseY: y + lavaH + 0.02 };
        crusts.push(crust);
        lavaGroup.add(crust);
      }

      // 5. Active Magma Bubbles on Surface
      const bubbleCount = Math.max(2, Math.floor(lavaW / 2.5));
      const bubbles = [];
      for (let b = 0; b < bubbleCount; b++) {
        const bGeo = new THREE.SphereGeometry(0.24, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const bMat = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
        const bubble = new THREE.Mesh(bGeo, bMat);
        const bx = x + 0.8 + b * (lavaW / bubbleCount) + (Math.random() - 0.5) * 0.6;
        bubble.position.set(bx, y + lavaH, (Math.random() - 0.5) * 1.2);
        bubble.userData = {
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 2.5 + 2.0,
          maxScale: Math.random() * 0.6 + 0.8
        };
        bubbles.push(bubble);
        lavaGroup.add(bubble);
      }

      lavaGroup.userData = {
        obstacle: obs,
        surface: lavaSurface,
        haze: haze,
        crusts: crusts,
        bubbles: bubbles,
        lavaW: lavaW,
        lavaH: lavaH
      };
      this.lavaMeshes.push(lavaGroup);
      this.obstaclesGroup.add(lavaGroup);
    }
    else if (type === "lava_bubble") {
      // 🌋 Active Magma Bubble Hazard Block
      const bubbleGroup = new THREE.Group();
      const bw = obs.w || 2.2;
      const bh = obs.h || 1.4;

      const bGeo = new THREE.BoxGeometry(bw, bh, 2.2);
      const bMat = new THREE.MeshStandardMaterial({
        color: 0x140502,
        roughness: 0.75,
        metalness: 0.3
      });
      const rock = new THREE.Mesh(bGeo, bMat);
      rock.position.set(x + bw / 2, y + bh / 2, 0);
      bubbleGroup.add(rock);

      const rockWire = new THREE.LineSegments(
        new THREE.EdgesGeometry(bGeo),
        new THREE.LineBasicMaterial({ color: 0xff4500, linewidth: 2 })
      );
      rock.add(rockWire);

      const bubbles = [];
      for (let b = 0; b < 2; b++) {
        const domeGeo = new THREE.SphereGeometry(0.38, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const domeMat = new THREE.MeshBasicMaterial({ color: 0xffa500 });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        const bOff = (b === 0 ? -0.45 : 0.45);
        dome.position.set(bOff, bh / 2, 0);
        dome.userData = {
          phase: b * Math.PI,
          speed: 3.2
        };
        rock.add(dome);
        bubbles.push(dome);
      }

      bubbleGroup.userData = {
        obstacle: obs,
        bubbles: bubbles
      };
      this.lavaMeshes.push(bubbleGroup);
      this.obstaclesGroup.add(bubbleGroup);
    }
    else if (type === "lava_crust") {
      // 🌋 Floating Volcanic Basalt Stepping Platform (Safe on top!)
      const crustGroup = new THREE.Group();
      const cw = obs.w || 3.0;
      const ch = obs.h || 1.2;

      const cGeo = new THREE.BoxGeometry(cw, ch, 2.4);
      const cMat = new THREE.MeshStandardMaterial({
        color: 0x160806,
        roughness: 0.55,
        metalness: 0.5
      });
      const crustBlock = new THREE.Mesh(cGeo, cMat);
      crustBlock.position.set(x + cw / 2, y + ch / 2, 0);
      crustGroup.add(crustBlock);

      const cWire = new THREE.LineSegments(
        new THREE.EdgesGeometry(cGeo),
        new THREE.LineBasicMaterial({ color: 0xff3700, linewidth: 2 })
      );
      crustBlock.add(cWire);

      const inlayGeo = new THREE.PlaneGeometry(cw * 0.85, ch * 0.6);
      const inlayMat = new THREE.MeshBasicMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      });
      const inlay = new THREE.Mesh(inlayGeo, inlayMat);
      inlay.position.set(0, 0, 1.21);
      crustBlock.add(inlay);

      crustGroup.userData = { obstacle: obs };
      this.lavaMeshes.push(crustGroup);
      this.obstaclesGroup.add(crustGroup);
    }
    else if (type === "lava_crystal") {
      // 🌋 Crimson Volcanic Obsidian Spike with Molten Core
      const crystalGroup = new THREE.Group();
      const height = 1.1;
      const radius = 0.52;

      const baseGeo = new THREE.CylinderGeometry(radius * 1.2, radius * 1.3, 0.12, 6);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a0604, roughness: 0.4, metalness: 0.8 });
      const basePlate = new THREE.Mesh(baseGeo, baseMat);
      basePlate.position.y = 0.06;
      crystalGroup.add(basePlate);

      const coneGeo = new THREE.ConeGeometry(radius, height, 8);
      const coneMat = new THREE.MeshStandardMaterial({
        color: 0x100302,
        roughness: 0.1,
        metalness: 0.95,
        flatShading: true
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = 0.12 + height / 2;
      crystalGroup.add(cone);

      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(coneGeo),
        new THREE.LineBasicMaterial({ color: 0xff3700, linewidth: 2.5 })
      );
      cone.add(wire);

      const coreGeo = new THREE.OctahedronGeometry(0.2, 0);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.y = 0.45;
      crystalGroup.add(core);

      if (obs.dir === "down") {
        crystalGroup.rotation.z = Math.PI;
        crystalGroup.position.set(x, y, 0);
      } else {
        crystalGroup.position.set(x, y, 0);
      }

      crystalGroup.userData = {
        obstacle: obs,
        core: core,
        wireColor: 0xff3700,
        pulseOffset: Math.random() * Math.PI * 2
      };
      this.spikeMeshes.push(crystalGroup);
      this.obstaclesGroup.add(crystalGroup);
    }
  }

  // Trigger Sparkling Gem Pickup Burst
  triggerGemCollect(index, x, y, color = 0x00ffff) {
    const gem = this.gemMeshes.find(g => g.userData.obstacle && g.userData.obstacle === this.currentLevel.obstacles[index]);
    if (gem) {
      gem.userData.isCollected = true;
      gem.visible = false;
    }
    this.triggerShockwave(x, y, color, 3.2);

    // Spawn 14 sparkling diamond burst shards
    for (let i = 0; i < 14; i++) {
      const pGeo = new THREE.OctahedronGeometry(0.14, 0);
      const pMat = new THREE.MeshBasicMaterial({ color: color });
      const shard = new THREE.Mesh(pGeo, pMat);
      shard.position.set(x, y, 0);

      const angle = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 9.0 + 4.5;
      this.scene.add(shard);

      const shardObj = {
        mesh: shard,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 2.0,
        life: 0.55
      };
      this.gemParticles.push(shardObj);
    }
  }

  // Restore Gem Meshes on Respawn / Level Restart
  resetGems(collectedIndices = new Set()) {
    if (!this.gemMeshes || !this.currentLevel) return;
    this.gemMeshes.forEach(gem => {
      const obsIdx = this.currentLevel.obstacles.indexOf(gem.userData.obstacle);
      const isCollected = collectedIndices.has(obsIdx);
      gem.visible = !isCollected;
      gem.userData.isCollected = isCollected;
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // ⚡ MASSIVE 3D SCI-FI INDUCTOR COIL TRANSITION ACCELERATOR
  // ═════════════════════════════════════════════════════════════════
  createInductorCoil(endX) {
    const coilGroup = new THREE.Group();
    const centerY = 2.8;
    const coilLength = 26.0;
    const turns = 14;
    const radius = 2.35;

    this.inductorRotorRings = [];
    this.inductorPulseRings = [];
    this.inductorArcs = [];

    // 1. Primary Helical Superconducting Copper Wire Winding
    const copperCurve = new InductorHelixCurve(endX, coilLength, radius, turns, centerY, 0);
    const copperGeo = new THREE.TubeGeometry(copperCurve, 260, 0.28, 12, false);
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xeb6a33,
      roughness: 0.18,
      metalness: 0.95,
      emissive: 0x5a1805,
      emissiveIntensity: 0.4
    });
    const copperMesh = new THREE.Mesh(copperGeo, copperMat);
    coilGroup.add(copperMesh);

    // 2. Interleaved Glowing Electric Cyan Plasma Secondary Wire
    const plasmaCurve = new InductorHelixCurve(endX, coilLength, radius, turns, centerY, Math.PI);
    const plasmaGeo = new THREE.TubeGeometry(plasmaCurve, 220, 0.09, 8, false);
    const plasmaMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.92
    });
    const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
    coilGroup.add(plasmaMesh);

    // 3. Heavy Industrial Magnetic Stator Choke Collars & Rotors
    const ringCount = 6;
    const darkAlloyMat = new THREE.MeshStandardMaterial({
      color: 0x0a101b,
      metalness: 0.92,
      roughness: 0.22
    });
    const neonTrimMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc
    });
    const hazardYellowMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      metalness: 0.6,
      roughness: 0.3
    });

    for (let i = 0; i < ringCount; i++) {
      const ringX = endX + (i / (ringCount - 1)) * coilLength;
      const collarGroup = new THREE.Group();
      collarGroup.position.set(ringX, centerY, 0);

      // Main Outer Torus Housing
      const torusGeo = new THREE.TorusGeometry(2.75, 0.34, 12, 32);
      const torusMesh = new THREE.Mesh(torusGeo, darkAlloyMat);
      torusMesh.rotation.y = Math.PI / 2;
      collarGroup.add(torusMesh);

      // Glowing Neon Status Trim Ring
      const trimGeo = new THREE.TorusGeometry(2.82, 0.08, 8, 32);
      const trimMesh = new THREE.Mesh(trimGeo, neonTrimMat);
      trimMesh.rotation.y = Math.PI / 2;
      collarGroup.add(trimMesh);

      // Counter-Rotating Stator Core Rotor Ring with 8 Magnetic Teeth
      const rotorGroup = new THREE.Group();
      const rotorBaseGeo = new THREE.TorusGeometry(2.45, 0.12, 8, 24);
      const rotorBase = new THREE.Mesh(rotorBaseGeo, darkAlloyMat);
      rotorBase.rotation.y = Math.PI / 2;
      rotorGroup.add(rotorBase);

      const toothGeo = new THREE.BoxGeometry(0.3, 0.45, 0.18);
      for (let t = 0; t < 8; t++) {
        const toothMat = (t % 2 === 0) ? neonTrimMat : darkAlloyMat;
        const tooth = new THREE.Mesh(toothGeo, toothMat);
        const toothAngle = (t / 8) * Math.PI * 2;
        tooth.position.set(0, Math.sin(toothAngle) * 2.45, Math.cos(toothAngle) * 2.45);
        tooth.rotation.x = -toothAngle;
        rotorGroup.add(tooth);
      }
      collarGroup.add(rotorGroup);
      this.inductorRotorRings.push({
        mesh: rotorGroup,
        speed: (i % 2 === 0 ? 1 : -1) * (1.8 + i * 0.2)
      });

      // Heavy Ground Support Pylons (Connecting collar to track ground at y = 0)
      const pylonGeo = new THREE.BoxGeometry(0.65, centerY, 0.5);
      const leftPylon = new THREE.Mesh(pylonGeo, darkAlloyMat);
      leftPylon.position.set(0, -centerY / 2, -2.5);
      const rightPylon = new THREE.Mesh(pylonGeo, darkAlloyMat);
      rightPylon.position.set(0, -centerY / 2, 2.5);

      // Hazard Stripes on Pylons
      const stripeGeo = new THREE.BoxGeometry(0.67, 0.5, 0.52);
      const leftStripe = new THREE.Mesh(stripeGeo, hazardYellowMat);
      leftStripe.position.set(0, -centerY * 0.4, -2.5);
      const rightStripe = new THREE.Mesh(stripeGeo, hazardYellowMat);
      rightStripe.position.set(0, -centerY * 0.4, 2.5);

      // Heavy Floor Base Footplates
      const footGeo = new THREE.BoxGeometry(1.4, 0.22, 1.0);
      const leftFoot = new THREE.Mesh(footGeo, darkAlloyMat);
      leftFoot.position.set(0, -centerY + 0.11, -2.5);
      const rightFoot = new THREE.Mesh(footGeo, darkAlloyMat);
      rightFoot.position.set(0, -centerY + 0.11, 2.5);

      collarGroup.add(leftPylon);
      collarGroup.add(rightPylon);
      collarGroup.add(leftStripe);
      collarGroup.add(rightStripe);
      collarGroup.add(leftFoot);
      collarGroup.add(rightFoot);

      coilGroup.add(collarGroup);
    }

    // 4. Entrance & Exit Flared Magnetic Aperture Funnels
    // Entrance Funnel at endX
    const inFunnelGeo = new THREE.CylinderGeometry(3.3, 2.5, 1.4, 24, 1, true);
    const inFunnelMesh = new THREE.Mesh(inFunnelGeo, darkAlloyMat);
    inFunnelMesh.rotation.z = Math.PI / 2;
    inFunnelMesh.position.set(endX - 0.7, centerY, 0);
    coilGroup.add(inFunnelMesh);

    const inRimGeo = new THREE.TorusGeometry(3.3, 0.18, 8, 36);
    const inRim = new THREE.Mesh(inRimGeo, neonTrimMat);
    inRim.rotation.y = Math.PI / 2;
    inRim.position.set(endX - 1.4, centerY, 0);
    coilGroup.add(inRim);

    // Exit Funnel at endX + coilLength
    const outFunnelGeo = new THREE.CylinderGeometry(2.5, 3.4, 1.5, 24, 1, true);
    const outFunnelMesh = new THREE.Mesh(outFunnelGeo, darkAlloyMat);
    outFunnelMesh.rotation.z = Math.PI / 2;
    outFunnelMesh.position.set(endX + coilLength + 0.75, centerY, 0);
    coilGroup.add(outFunnelMesh);

    const outRimGeo = new THREE.TorusGeometry(3.4, 0.2, 8, 36);
    const outRimMat = new THREE.MeshBasicMaterial({ color: 0xd500f9 });
    const outRim = new THREE.Mesh(outRimGeo, outRimMat);
    outRim.rotation.y = Math.PI / 2;
    outRim.position.set(endX + coilLength + 1.5, centerY, 0);
    coilGroup.add(outRim);

    // 5. Holographic HUD Billboard Sign Hovering Above Entrance
    this.createInductorHudSign(endX + 1.2, centerY + 4.2, coilGroup);

    // 6. Transparent Internal Induction Core Tunnel & Pulse Rings
    const tunnelGeo = new THREE.CylinderGeometry(1.85, 1.85, coilLength, 24, 1, true);
    const tunnelMat = new THREE.MeshBasicMaterial({
      color: 0x00d9ff,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });
    const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnelMesh.rotation.z = Math.PI / 2;
    tunnelMesh.position.set(endX + coilLength / 2, centerY, 0);
    coilGroup.add(tunnelMesh);

    // 5 Traveling Electromagnetic Induction Pulse Rings
    for (let p = 0; p < 5; p++) {
      const pRingGeo = new THREE.TorusGeometry(1.78, 0.08, 8, 28);
      const pRingMat = new THREE.MeshBasicMaterial({
        color: (p % 2 === 0) ? 0x00ffff : 0xd500f9,
        transparent: true,
        opacity: 0.75
      });
      const pRing = new THREE.Mesh(pRingGeo, pRingMat);
      pRing.rotation.y = Math.PI / 2;
      coilGroup.add(pRing);
      this.inductorPulseRings.push({
        mesh: pRing,
        offset: p / 5,
        startX: endX,
        length: coilLength,
        centerY
      });
    }

    // 7. Dynamic Procedural Electric Arcs (Tesla High-Voltage Lightning Sparks)
    const arcCount = 8;
    for (let a = 0; a < arcCount; a++) {
      const arcGeo = new THREE.BufferGeometry();
      const posArray = new Float32Array(18); // 6 vertices => 5 line segments
      arcGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const arcMat = new THREE.LineBasicMaterial({
        color: (a % 2 === 0) ? 0x88ffff : 0xffffff,
        linewidth: 2,
        transparent: true,
        opacity: 0.95
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      coilGroup.add(arcLine);
      this.inductorArcs.push({
        line: arcLine,
        geo: arcGeo,
        arcIndex: a,
        endX,
        coilLength,
        radius,
        centerY,
        timer: Math.random() * 0.1
      });
    }

    // 8. Dynamic Central Induction PointLight
    this.inductorCoreLight = new THREE.PointLight(0x00f0ff, 4.2, 40);
    this.inductorCoreLight.position.set(endX + coilLength / 2, centerY, 0);
    this.scene.add(this.inductorCoreLight);

    this.inductorCoilGroup = coilGroup;
    this.obstaclesGroup.add(coilGroup);
  }

  createInductorHudSign(x, y, parentGroup) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Glowing cyber frame
    ctx.fillStyle = "rgba(4, 12, 28, 0.88)";
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 492, 108);
    ctx.fillRect(10, 10, 492, 108);

    // Cyan top header
    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⚡ QUANTUM INDUCTOR // LEVEL TRANSITION ⚡", 256, 42);

    // Subtitle
    ctx.fillStyle = "#00f0ff";
    ctx.font = "bold 32px -apple-system, Impact, sans-serif";
    ctx.fillText("ENTER WARP FIELD", 256, 88);

    const texture = new THREE.CanvasTexture(canvas);
    const planeGeo = new THREE.PlaneGeometry(6.4, 1.6);
    const planeMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    const signMesh = new THREE.Mesh(planeGeo, planeMat);
    signMesh.position.set(x, y, 0);
    parentGroup.add(signMesh);
  }

  updateInductorCoil(dt, time) {
    if (!this.inductorCoilGroup) return;

    // 1. Rotate Electromagnetic Rotor Teeth
    this.inductorRotorRings.forEach(rotor => {
      rotor.mesh.rotation.x += dt * rotor.speed;
    });

    // 2. Translate Induction Pulse Rings along Tunnel Axis
    this.inductorPulseRings.forEach(pRing => {
      pRing.offset = (pRing.offset + dt * 0.45) % 1.0;
      const x = pRing.startX + pRing.offset * pRing.length;
      pRing.mesh.position.set(x, pRing.centerY, 0);
      const scale = 0.85 + Math.sin(pRing.offset * Math.PI) * 0.3;
      pRing.mesh.scale.set(scale, scale, scale);
    });

    // 3. Regenerate Dynamic Tesla Lightning Arcs with Fractal Jitter
    this.inductorArcs.forEach(arc => {
      arc.timer -= dt;
      if (arc.timer <= 0) {
        arc.timer = 0.04 + Math.random() * 0.05; // 15-25 Hz electric discharge
        const posAttr = arc.geo.attributes.position;
        const arr = posAttr.array;

        // Random pick along coil
        const t = Math.random();
        const startX = arc.endX + t * arc.coilLength;
        const angle = t * 14 * Math.PI * 2;
        const coilY = arc.centerY + Math.sin(angle) * arc.radius;
        const coilZ = Math.cos(angle) * arc.radius;

        // Arc shoots from coil turn towards center bore or adjacent turn
        const targetX = startX + (Math.random() - 0.5) * 2.5;
        const targetY = arc.centerY + (Math.random() - 0.5) * 1.0;
        const targetZ = (Math.random() - 0.5) * 1.0;

        const segments = 6;
        for (let s = 0; s < segments; s++) {
          const frac = s / (segments - 1);
          // Midpoint fractal displacement
          const jitter = (s === 0 || s === segments - 1) ? 0 : (Math.random() - 0.5) * 0.55;
          arr[s * 3]     = startX + (targetX - startX) * frac + jitter;
          arr[s * 3 + 1] = coilY + (targetY - coilY) * frac + jitter;
          arr[s * 3 + 2] = coilZ + (targetZ - coilZ) * frac + jitter;
        }
        posAttr.needsUpdate = true;
        arc.line.visible = Math.random() > 0.15;
      }
    });

    // 4. Pulse Central Light
    if (this.inductorCoreLight) {
      this.inductorCoreLight.intensity = 3.5 + Math.sin(time * 18) * 1.8;
      if (Math.random() > 0.85) {
        this.inductorCoreLight.intensity += 1.5; // Random lightning arc flash
      }
    }
  }

  createVictoryGate(endX) {
    if (this.currentLevel && this.currentLevel.themeType === 'gothic') {
      this.createGothicSanctuaryGate(endX);
    } else {
      this.createInductorCoil(endX);
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // 🏰 GOTHIC CASTLE LIVING ENVIRONMENT ARCHITECTURE & CLIMAX
  // ═════════════════════════════════════════════════════════════════

  buildGothicFloorDetails(groundLength) {
    // 1. Continuous Weathered Stone Parapet Coping
    const parapetGeo = new THREE.BoxGeometry(groundLength, 0.28, 0.45);
    const parapetMat = new THREE.MeshStandardMaterial({
      color: 0x22252e,
      roughness: 0.9,
      metalness: 0.15
    });
    const parapetMesh = new THREE.Mesh(parapetGeo, parapetMat);
    parapetMesh.position.set(groundLength / 2 - 20, 0.14, 2.45);
    this.trackGroup.add(parapetMesh);
    this.gothicFloorMeshes.push(parapetMesh);

    // 2. Corbel Support Arches under the walkway edge every 14 units
    const corbelGeo = new THREE.BoxGeometry(0.8, 1.6, 0.9);
    const corbelMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.92,
      metalness: 0.1
    });

    const numCorbels = Math.floor(groundLength / 14);
    for (let c = 0; c < numCorbels; c++) {
      const cx = -10 + c * 14;
      const corbel = new THREE.Mesh(corbelGeo, corbelMat);
      corbel.position.set(cx, -1.0, 2.4);
      this.trackGroup.add(corbel);
      this.gothicFloorMeshes.push(corbel);
    }

    // 3. Wall Sconce Torch Braziers every 18 units along the track edge
    const torchCount = Math.floor(groundLength / 18);
    for (let t = 0; t < torchCount; t++) {
      const tx = -5 + t * 18;
      const torchGroup = new THREE.Group();
      torchGroup.position.set(tx, 0.2, 2.5);

      // Iron Bracket Post
      const postGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.4, metalness: 0.85 });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.y = 0.4;
      torchGroup.add(post);

      // Iron Bowl / Cup
      const cupGeo = new THREE.ConeGeometry(0.18, 0.22, 6);
      const cupMat = new THREE.MeshStandardMaterial({ color: 0x18191d, roughness: 0.5, metalness: 0.8 });
      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.rotation.x = Math.PI;
      cup.position.y = 0.8;
      torchGroup.add(cup);

      // Animated Flame Mesh
      const flameGeo = new THREE.ConeGeometry(0.14, 0.42, 6);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xff4d15,
        transparent: true,
        opacity: 0.92
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 1.0;
      flame.userData = {
        isTorchFlame: true,
        speed: 12.0 + Math.random() * 8.0,
        offset: Math.random() * Math.PI * 2
      };
      torchGroup.add(flame);
      this.gothicFloorMeshes.push(flame);

      this.trackGroup.add(torchGroup);
      this.gothicFloorMeshes.push(torchGroup);
    }
  }

  createGothicSanctuaryGate(endX) {
    this.gothicSanctuaryGate = new THREE.Group();
    this.gothicSanctuaryGate.position.set(endX, 0, 0);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x181a22,
      roughness: 0.9,
      metalness: 0.15
    });
    const darkIronMat = new THREE.MeshStandardMaterial({
      color: 0x101114,
      roughness: 0.4,
      metalness: 0.88
    });

    // 1. Massive Twin Gothic Buttress Pylons
    const pylonGeo = new THREE.BoxGeometry(2.0, 9.5, 2.0);
    const pylonL = new THREE.Mesh(pylonGeo, stoneMat);
    pylonL.position.set(0, 4.75, -3.2);
    const pylonR = new THREE.Mesh(pylonGeo, stoneMat);
    pylonR.position.set(0, 4.75, 3.2);
    this.gothicSanctuaryGate.add(pylonL);
    this.gothicSanctuaryGate.add(pylonR);

    // Pylon spires on top
    const spireGeo = new THREE.ConeGeometry(1.2, 3.2, 4);
    const spireL = new THREE.Mesh(spireGeo, stoneMat);
    spireL.position.set(0, 11.1, -3.2);
    spireL.rotation.y = Math.PI / 4;
    const spireR = new THREE.Mesh(spireGeo, stoneMat);
    spireR.position.set(0, 11.1, 3.2);
    spireR.rotation.y = Math.PI / 4;
    this.gothicSanctuaryGate.add(spireL);
    this.gothicSanctuaryGate.add(spireR);

    // 2. Pointed Gothic Arch Transom
    const archBarGeo = new THREE.BoxGeometry(1.6, 1.2, 6.8);
    const archBar = new THREE.Mesh(archBarGeo, stoneMat);
    archBar.position.set(0, 8.8, 0);
    this.gothicSanctuaryGate.add(archBar);

    // Gothic Arch Apex Spire & Crest
    const crestGeo = new THREE.ConeGeometry(0.9, 2.4, 4);
    const crest = new THREE.Mesh(crestGeo, stoneMat);
    crest.position.set(0, 10.6, 0);
    crest.rotation.y = Math.PI / 4;
    this.gothicSanctuaryGate.add(crest);

    // 3. Forged Iron Portcullis Grille (Partially raised)
    const portcullisGroup = new THREE.Group();
    portcullisGroup.position.set(0, 6.4, 0);
    for (let bar = -2; bar <= 2; bar++) {
      const barGeo = new THREE.CylinderGeometry(0.07, 0.07, 4.2, 6);
      const barMesh = new THREE.Mesh(barGeo, darkIronMat);
      barMesh.position.z = bar * 1.0;
      portcullisGroup.add(barMesh);

      // Pointed pike tip at bottom of bar
      const tipGeo = new THREE.ConeGeometry(0.12, 0.45, 4);
      const tip = new THREE.Mesh(tipGeo, darkIronMat);
      tip.rotation.x = Math.PI;
      tip.position.set(0, -2.3, bar * 1.0);
      portcullisGroup.add(tip);
    }
    this.gothicSanctuaryGate.add(portcullisGroup);

    // 4. Abyssal Rift Void Portal inside the archway
    const riftGeo = new THREE.CircleGeometry(2.8, 32);
    const riftMat = new THREE.MeshBasicMaterial({
      color: 0x12030d,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92
    });
    const riftDisc = new THREE.Mesh(riftGeo, riftMat);
    riftDisc.rotation.y = -Math.PI / 2;
    riftDisc.position.set(0.1, 4.2, 0);
    this.gothicSanctuaryGate.add(riftDisc);

    // Arcane crimson outer ring
    const riftRimGeo = new THREE.TorusGeometry(2.85, 0.16, 12, 36);
    const riftRimMat = new THREE.MeshBasicMaterial({ color: 0x8a1538 });
    const riftRim = new THREE.Mesh(riftRimGeo, riftRimMat);
    riftRim.rotation.y = -Math.PI / 2;
    riftRim.position.set(0.1, 4.2, 0);
    this.gothicSanctuaryGate.add(riftRim);

    // 5. Twin Grand Braziers Flanking the Gate
    const braziers = [];
    [-3.2, 3.2].forEach((bz, bIdx) => {
      const bzGroup = new THREE.Group();
      bzGroup.position.set(-1.4, 0, bz);

      const bzBowlGeo = new THREE.CylinderGeometry(0.7, 0.4, 0.9, 8);
      const bzBowl = new THREE.Mesh(bzBowlGeo, darkIronMat);
      bzBowl.position.y = 0.45;
      bzGroup.add(bzBowl);

      const bzFlameGeo = new THREE.ConeGeometry(0.55, 1.8, 8);
      const bzFlameMat = new THREE.MeshBasicMaterial({
        color: 0xc41230,
        transparent: true,
        opacity: 0.92
      });
      const bzFlame = new THREE.Mesh(bzFlameGeo, bzFlameMat);
      bzFlame.position.y = 1.6;
      bzGroup.add(bzFlame);

      braziers.push({ mesh: bzFlame, offset: bIdx * 2.5 });
      this.gothicSanctuaryGate.add(bzGroup);
    });

    this.gothicSanctuaryGate.userData = {
      riftDisc: riftDisc,
      riftRim: riftRim,
      flames: braziers
    };

    this.trackGroup.add(this.gothicSanctuaryGate);
  }

  setCinematicFreeze(frozen) {
    this.isCinematicFrozen = !!frozen;
    if (this.sceneryManager && typeof this.sceneryManager.setCinematicFreeze === 'function') {
      this.sceneryManager.setCinematicFreeze(frozen);
    }
  }

  triggerGothicEndingBoom(x, y) {
    this.cameraTrauma = 1.0;

    // Flash background sky lightning
    if (this.sceneryManager && typeof this.sceneryManager.triggerGothicLightningStrike === 'function') {
      this.sceneryManager.triggerGothicLightningStrike(2.0);
    }

    // Spawn 50 high-velocity fortress masonry shrapnel shards
    const colors = [0x1a1c22, 0x2d3038, 0x111215, 0x3d414d, 0x8a1538, 0xc41230];
    for (let i = 0; i < 50; i++) {
      const geo = (Math.random() > 0.4)
        ? new THREE.BoxGeometry(0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4)
        : new THREE.TetrahedronGeometry(0.25 + Math.random() * 0.35);
      const mat = new THREE.MeshStandardMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        roughness: 0.85,
        metalness: 0.25
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x + (Math.random() - 0.5) * 1.8, y + (Math.random() - 0.5) * 1.8, (Math.random() - 0.5) * 2.5);

      const angle = Math.random() * Math.PI * 2;
      const speed = 14.0 + Math.random() * 26.0;
      const vx = Math.cos(angle) * speed;
      const vy = Math.abs(Math.sin(angle)) * speed * 0.95 + 4.0;
      const vz = (Math.random() - 0.5) * 14.0;
      const maxLife = 1.2 + Math.random() * 0.9;

      this.scene.add(mesh);
      this.gothicBoomParticles.push({
        mesh: mesh,
        vx: vx,
        vy: vy,
        vz: vz,
        rx: (Math.random() - 0.5) * 20.0,
        ry: (Math.random() - 0.5) * 20.0,
        life: maxLife,
        maxLife: maxLife
      });
    }

    // Expanding shockwave rings on track
    this.triggerShockwave(x, y, 0x8a1538, 6.5);
    this.triggerShockwave(x, y, 0xffffff, 4.5);
  }

  // ⚡ Start Relativistic Inductor Coil Warp Transition
  startCoilTransition(player, duration = 2.4, onComplete = null) {
    this.isCoilTransition = true;
    this.coilDuration = duration;
    this.coilProgress = 0;
    this.coilStartX = player ? player.x : (this.currentLevel ? this.currentLevel.endX : 400);
    this.coilEndX = (this.currentLevel ? this.currentLevel.endX : 400) + 26.0;
    this.coilOnComplete = onComplete;

    // Show High-Power Inductor Warp HTML Overlay
    const overlay = document.getElementById('coil-warp-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      requestAnimationFrame(() => {
        overlay.classList.add('warp-active');
      });
    }

    // Trigger Initial Dual Shockwaves at Inductor Entrance
    this.triggerShockwave(this.coilStartX, 2.8, 0x00f0ff, 4.8);
    this.triggerShockwave(this.coilStartX, 2.8, 0xd500f9, 6.2);
    this.cameraTrauma = Math.max(this.cameraTrauma, 0.5);
  }

  // ⚡ Update Inductor Warp Camera Dynamics & Relativistic Tunnel Transit
  updateCoilTransition(dt, time, playerState) {
    if (!this.isCoilTransition) return;

    this.coilProgress += dt / this.coilDuration;
    const p = Math.min(1.0, this.coilProgress);

    // Dynamic S-Curve Warp Acceleration Profile
    const easeP = p * p * (3 - 2 * p);
    const warpX = this.coilStartX + easeP * (this.coilEndX - this.coilStartX + 8.0);

    // Guide player through the superconducting bore
    if (playerState) {
      playerState.x = warpX;
      playerState.y += (2.8 - playerState.y) * Math.min(1, 14 * dt);
      playerState.rotationZ += dt * (14.0 + p * 32.0);
    }

    // Relativistic FOV Expansion: 54 -> 110 at peak mid-tunnel
    const peakFov = 110;
    const fovCurve = Math.sin(p * Math.PI);
    this.camera.fov = this.defaultCameraFov + fovCurve * (peakFov - this.defaultCameraFov);
    this.camera.updateProjectionMatrix();

    // Camera locks directly down the superconducting tunnel axis
    const camJitterX = Math.sin(time * 45) * 0.08 * fovCurve;
    const camJitterY = Math.cos(time * 50) * 0.06 * fovCurve;
    this.camera.position.set(warpX - 4.2 + camJitterX, 2.8 + camJitterY, 0.4);
    this.camera.lookAt(warpX + 16.0, 2.8, 0);

    // Dynamic camera barrel roll from relativistic magnetic frame dragging
    this.camera.rotation.z = Math.sin(p * Math.PI * 2) * 0.25 * fovCurve;

    // Overdrive magnetic stator rotor rings up to 10x speed
    this.inductorRotorRings.forEach(rotor => {
      rotor.mesh.rotation.x += dt * rotor.speed * (3.0 + p * 18.0);
    });

    // Intense central core light bloom
    if (this.inductorCoreLight) {
      this.inductorCoreLight.intensity = 5.0 + fovCurve * 18.0;
      this.inductorCoreLight.color.setHex(p > 0.85 ? 0xffffff : 0x00f0ff);
    }

    // Inductor Breach Point reached!
    if (this.coilProgress >= 1.0) {
      this.isCoilTransition = false;
      this.camera.fov = this.defaultCameraFov;
      this.camera.rotation.z = 0;
      this.camera.updateProjectionMatrix();

      // Trigger blinding white screen flash & sonic shockwave
      this.triggerScreenFlash(1.0);
      this.triggerShockwave(this.coilEndX, 2.8, 0xffffff, 8.5);

      // Dismiss overlay with smooth fade
      const overlay = document.getElementById('coil-warp-overlay');
      if (overlay) {
        overlay.classList.remove('warp-active');
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 300);
      }

      // Execute onComplete callback
      if (typeof this.coilOnComplete === 'function') {
        const cb = this.coilOnComplete;
        this.coilOnComplete = null;
        cb();
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // HIGH-BUDGET PLAYER MODELS (CUBE, SHIP, WAVE)
  // ═════════════════════════════════════════════════════════════════
  setupPlayerModels() {
    this.scene.add(this.playerGroup);

    // ── 1. CUBE RIG WITH SQUASH & EXPRESSIVE VISOR ──
    const cubeGroup = new THREE.Group();
    const cubeGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      roughness: 0.2,
      metalness: 0.85,
      emissive: 0x004422,
      emissiveIntensity: 0.4
    });
    this.cubeBody = new THREE.Mesh(cubeGeo, cubeMat);
    cubeGroup.add(this.cubeBody);

    // Glowing Chassis Border Wireframe
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(cubeGeo),
      new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
    );
    this.cubeBody.add(wire);

    // Dynamic Expressive Digital Visor Face Canvas
    this.faceCanvas = document.createElement('canvas');
    this.faceCanvas.width = 256;
    this.faceCanvas.height = 256;
    this.faceCtx = this.faceCanvas.getContext('2d');
    this.faceTexture = new THREE.CanvasTexture(this.faceCanvas);
    this.faceTexture.minFilter = THREE.LinearFilter;
    this.faceTexture.magFilter = THREE.LinearFilter;

    const visorGeo = new THREE.PlaneGeometry(0.88, 0.88);
    const visorMat = new THREE.MeshBasicMaterial({ map: this.faceTexture, transparent: true });
    this.cubeVisor = new THREE.Mesh(visorGeo, visorMat);
    this.cubeVisor.position.set(0, 0, 0.51);
    this.cubeBody.add(this.cubeVisor);

    // Initial render of cube face
    this.drawCubeFace('normal', 0, true, 0);
    this.faceTexture.needsUpdate = true;

    this.cubeMesh = cubeGroup;

    // Ethereal Smurf Cat Halo Torus (Blessed by Shailushai)
    const haloGeo = new THREE.TorusGeometry(0.52, 0.04, 8, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });
    this.smurfCatHalo = new THREE.Mesh(haloGeo, haloMat);
    this.smurfCatHalo.rotation.x = Math.PI / 2;
    this.smurfCatHalo.position.set(0, 0.82, 0);
    this.smurfCatHalo.visible = false;
    this.cubeMesh.add(this.smurfCatHalo);

    // 🍄 Smurf Cat Mushroom Cap Hat
    const mushGroup = new THREE.Group();
    const mCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshStandardMaterial({ color: 0x0091ff, roughness: 0.25 })
    );
    mCap.rotation.x = Math.PI;
    mushGroup.add(mCap);
    // White polka dots
    for (let p = 0; p < 5; p++) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      dot.position.set(Math.sin(p * 1.3) * 0.35, -0.2, Math.cos(p * 1.3) * 0.35);
      mushGroup.add(dot);
    }
    mushGroup.position.set(0, 0.95, 0);
    mushGroup.visible = false;
    this.mushroomCap = mushGroup;
    this.cubeMesh.add(this.mushroomCap);

    // 👑 Skibidi Golden Crown
    const crownGroup = new THREE.Group();
    const crownBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.38, 0.28, 5, 1),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.2 })
    );
    crownGroup.add(crownBase);
    // Ruby jewels on crown tips
    for (let r = 0; r < 5; r++) {
      const ruby = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xff0055 })
      );
      ruby.position.set(Math.sin(r * Math.PI * 0.4) * 0.42, 0.16, Math.cos(r * Math.PI * 0.4) * 0.42);
      crownGroup.add(ruby);
    }
    crownGroup.position.set(0, 0.72, 0);
    crownGroup.visible = false;
    this.goldenCrown = crownGroup;
    this.cubeMesh.add(this.goldenCrown);

    // 🕶️ Gigachad Aviator Shades
    const shadesGroup = new THREE.Group();
    const lensMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    const lensL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.08), lensMat);
    lensL.position.set(-0.2, 0.08, 0.55);
    const lensR = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.08), lensMat);
    lensR.position.set(0.2, 0.08, 0.55);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.08), new THREE.MeshBasicMaterial({ color: 0xffd700 }));
    bridge.position.set(0, 0.12, 0.55);
    shadesGroup.add(lensL); shadesGroup.add(lensR); shadesGroup.add(bridge);
    shadesGroup.visible = false;
    this.gigachadShades = shadesGroup;
    this.cubeMesh.add(this.gigachadShades);

    this.playerGroup.add(this.cubeMesh);

    // ── 2. HIGH-PERFORMANCE AERODYNAMIC JET FIGHTER SHIP RIG ──
    const shipGroup = new THREE.Group();

    // Fuselage: Main aerodynamic needle-nosed body
    const bodyGeo = new THREE.CylinderGeometry(0.32, 0.46, 1.7, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x061e33,
      emissive: 0x003355,
      emissiveIntensity: 0.5,
      roughness: 0.12,
      metalness: 0.95
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    shipGroup.add(body);

    // Forward nose cone
    const noseGeo = new THREE.ConeGeometry(0.32, 0.7, 8);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.rotation.z = -Math.PI / 2;
    nose.position.set(1.2, 0, 0);
    shipGroup.add(nose);

    // Hull accent glowing wireframe
    const bodyWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(bodyGeo),
      new THREE.LineBasicMaterial({ color: 0x00e5ff, linewidth: 2 })
    );
    body.add(bodyWire);

    // Aerodynamic Cockpit Canopy (Tinted Glass)
    const canopyGeo = new THREE.SphereGeometry(0.26, 16, 12);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      roughness: 0.05,
      metalness: 0.85,
      transparent: true,
      opacity: 0.85
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0.24, 0.22, 0);
    canopy.scale.set(1.7, 0.75, 0.8);
    shipGroup.add(canopy);

    // Swept-Back Delta Wings with Winglet Stabilizers
    const wingGeo = new THREE.BoxGeometry(0.9, 0.06, 2.3);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x0b1626, metalness: 0.92, roughness: 0.2 });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(-0.15, 0, 0);
    shipGroup.add(wings);

    // Glowing Neon Wingtip Navigation Lights
    const tipMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const tipGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const tipL = new THREE.Mesh(tipGeo, tipMat);
    tipL.position.set(-0.25, 0, 1.15);
    const tipR = new THREE.Mesh(tipGeo, tipMat);
    tipR.position.set(-0.25, 0, -1.15);
    shipGroup.add(tipL);
    shipGroup.add(tipR);

    // Dorsal Vertical Stabilizer Fin
    const finGeo = new THREE.BoxGeometry(0.55, 0.46, 0.06);
    const fin = new THREE.Mesh(finGeo, wingMat);
    fin.position.set(-0.48, 0.36, 0);
    fin.rotation.z = -0.3;
    shipGroup.add(fin);
    const finGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.44, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff })
    );
    finGlow.position.set(-0.26, 0.02, 0);
    fin.add(finGlow);

    // Heavy Twin-Exhaust Titanium Nozzle Block
    const nozzGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.38, 8);
    const nozzMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.3, metalness: 0.96 });
    const nozzTop = new THREE.Mesh(nozzGeo, nozzMat);
    nozzTop.rotation.z = Math.PI / 2;
    nozzTop.position.set(-0.98, 0, 0.16);
    const nozzBot = new THREE.Mesh(nozzGeo, nozzMat);
    nozzBot.rotation.z = Math.PI / 2;
    nozzBot.position.set(-0.98, 0, -0.16);
    shipGroup.add(nozzTop);
    shipGroup.add(nozzBot);

    // ── MULTI-STAGE PULSATING PLASMA FLAME PLUMES ──
    // Outer Heat Wake Plume
    const outerFlameGeo = new THREE.ConeGeometry(0.38, 2.2, 8);
    const outerFlameMat = new THREE.MeshBasicMaterial({ color: 0x0055ff, transparent: true, opacity: 0.4 });
    const outerFlame = new THREE.Mesh(outerFlameGeo, outerFlameMat);
    outerFlame.rotation.z = Math.PI / 2;
    outerFlame.position.set(-2.0, 0, 0);
    shipGroup.add(outerFlame);

    // Mid Cyan/Gold Plasma Mantle
    const midFlameGeo = new THREE.ConeGeometry(0.24, 1.6, 8);
    const midFlameMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });
    const midFlame = new THREE.Mesh(midFlameGeo, midFlameMat);
    midFlame.rotation.z = Math.PI / 2;
    midFlame.position.set(-1.7, 0, 0);
    shipGroup.add(midFlame);

    // Inner White-Hot Plasma Core
    const innerFlameGeo = new THREE.ConeGeometry(0.14, 1.0, 8);
    const innerFlameMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const innerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMat);
    innerFlame.rotation.z = Math.PI / 2;
    innerFlame.position.set(-1.4, 0, 0);
    shipGroup.add(innerFlame);

    this.shipFlames = [outerFlame, midFlame, innerFlame];
    this.shipMesh = shipGroup;
    this.shipMesh.visible = false;
    this.playerGroup.add(this.shipMesh);

    // ── 3. WAVE RIG WITH SHARP LASER TIP & 45° SLICER ──
    const waveGroup = new THREE.Group();
    const arrowGeo = new THREE.ConeGeometry(0.5, 1.4, 4);
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0xd500f9,
      emissive: 0x7b1fa2,
      emissiveIntensity: 0.6,
      metalness: 0.9
    });
    this.waveArrow = new THREE.Mesh(arrowGeo, arrowMat);
    this.waveArrow.rotation.z = -Math.PI / 2;
    waveGroup.add(this.waveArrow);

    // Glowing Wireframe
    const arrowWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(arrowGeo),
      new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
    );
    this.waveArrow.add(arrowWire);

    // Glowing Arrow Visor
    const waveTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    waveTip.position.set(0.72, 0, 0);
    waveGroup.add(waveTip);

    this.waveMesh = waveGroup;
    this.waveMesh.visible = false;
    this.playerGroup.add(this.waveMesh);

    // ── 4. HIGH-TECH ALIEN UFO RIG WITH ANTI-GRAV SAUCER & COCKPIT ──
    const ufoGroup = new THREE.Group();

    // Saucer Outer Hull: Heavy brushed titanium disc with sloping rim
    const hullGeo = new THREE.CylinderGeometry(0.88, 1.05, 0.22, 24);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x111c2e,
      roughness: 0.18,
      metalness: 0.92,
      emissive: 0x051020,
      emissiveIntensity: 0.4
    });
    const ufoHull = new THREE.Mesh(hullGeo, hullMat);
    ufoGroup.add(ufoHull);

    // Glowing Golden Amber Rim Trim
    const rimTrimGeo = new THREE.TorusGeometry(0.98, 0.05, 8, 32);
    const rimTrimMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const rimTrim = new THREE.Mesh(rimTrimGeo, rimTrimMat);
    rimTrim.rotation.x = Math.PI / 2;
    ufoHull.add(rimTrim);

    // Glowing Hex Wireframe
    const hullWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(hullGeo),
      new THREE.LineBasicMaterial({ color: 0xffcc00, linewidth: 2 })
    );
    ufoHull.add(hullWire);

    // Cockpit Canopy Dome: Glass Bubble with glowing pilot core
    const domeGeo = new THREE.SphereGeometry(0.46, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.82
    });
    const ufoDome = new THREE.Mesh(domeGeo, domeMat);
    ufoDome.position.y = 0.11;
    ufoGroup.add(ufoDome);

    // Inner Glowing Pilot Sphere
    const pilotGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const pilotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pilotCore = new THREE.Mesh(pilotGeo, pilotMat);
    pilotCore.position.y = 0.22;
    ufoGroup.add(pilotCore);

    // Rotating Underbelly Anti-Gravity Reactor Rotor
    const ufoRotorGroup = new THREE.Group();
    const ufoRotorGeo = new THREE.TorusGeometry(0.68, 0.07, 8, 24);
    const ufoRotorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ufoRotor = new THREE.Mesh(ufoRotorGeo, ufoRotorMat);
    ufoRotor.rotation.x = Math.PI / 2;
    ufoRotorGroup.add(ufoRotor);

    // 4 Glowing Propulsion Nodes on Rotor
    for (let r = 0; r < 4; r++) {
      const nodeGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      const angle = (r / 4) * Math.PI * 2;
      node.position.set(Math.cos(angle) * 0.68, 0, Math.sin(angle) * 0.68);
      ufoRotorGroup.add(node);
    }
    ufoRotorGroup.position.y = -0.12;
    ufoGroup.add(ufoRotorGroup);
    this.ufoRotor = ufoRotorGroup;

    // Pulsing Anti-Gravity Tractor Propulsion Beam
    const beamGeo = new THREE.ConeGeometry(0.55, 0.9, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const ufoBeam = new THREE.Mesh(beamGeo, beamMat);
    ufoBeam.position.y = -0.58;
    ufoGroup.add(ufoBeam);
    this.ufoBeam = ufoBeam;

    this.ufoMesh = ufoGroup;
    this.ufoMesh.visible = false;
    this.playerGroup.add(this.ufoMesh);

    // ── 5. HEXAGONAL MULTI-TIER ENERGY SHIELD BARRIER (COLLECTIBLE BUFF) ──
    const shieldGroup = new THREE.Group();
    const shieldGeo = new THREE.IcosahedronGeometry(1.12, 1);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x0066aa,
      emissiveIntensity: 0.6,
      roughness: 0.15,
      metalness: 0.95,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide
    });
    const shieldSphere = new THREE.Mesh(shieldGeo, shieldMat);
    shieldGroup.add(shieldSphere);

    const shieldWireGeo = new THREE.WireframeGeometry(shieldGeo);
    const shieldWireMat = new THREE.LineBasicMaterial({ color: 0x88ffff, linewidth: 2.5 });
    const shieldWire = new THREE.LineSegments(shieldWireGeo, shieldWireMat);
    shieldGroup.add(shieldWire);

    // Dual Counter-Rotating Gyroscopic Deflector Rings with Quantum Satellite Nodes
    const ring1Geo = new THREE.TorusGeometry(1.24, 0.04, 8, 36);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    shieldGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(1.30, 0.035, 8, 36);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 3;
    shieldGroup.add(ring2);

    // 4 Orbiting Satellite Nodes on Ring 1
    for (let r = 0; r < 4; r++) {
      const nodeGeo = new THREE.OctahedronGeometry(0.12, 0);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      const angle = (r / 4) * Math.PI * 2;
      node.position.set(Math.cos(angle) * 1.24, Math.sin(angle) * 1.24, 0);
      ring1.add(node);
    }

    // Inner Pulsing Hyper-Plasma Core
    const innerPlasmaGeo = new THREE.OctahedronGeometry(0.48, 0);
    const innerPlasmaMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const innerPlasma = new THREE.Mesh(innerPlasmaGeo, innerPlasmaMat);
    shieldGroup.add(innerPlasma);

    // Dedicated Invulnerability Holographic Hex Cage
    const invulnCageGeo = new THREE.DodecahedronGeometry(1.28, 0);
    const invulnCageMat = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 3 });
    const invulnCage = new THREE.LineSegments(new THREE.WireframeGeometry(invulnCageGeo), invulnCageMat);
    invulnCage.visible = false;
    shieldGroup.add(invulnCage);

    this.shieldMesh = shieldGroup;
    this.shieldMesh.userData = {
      sphere: shieldSphere,
      wire: shieldWire,
      ring1: ring1,
      ring2: ring2,
      innerPlasma: innerPlasma,
      invulnCage: invulnCage
    };
    this.shieldMesh.visible = false;
    this.playerGroup.add(this.shieldMesh);

    // ── 6. DYNAMIC TRAIL RIBBON ──
    const trailCount = 30;
    const trailPositions = new Float32Array(trailCount * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.8,
      linewidth: 3
    });
    this.playerTrail = new THREE.Line(trailGeo, trailMat);
    this.scene.add(this.playerTrail);
  }

  drawCubeFace(expr, blink, isGrounded, vy) {
    const ctx = this.faceCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, 256, 256);

    // Visor border frame with glowing cyan/neon rim
    ctx.fillStyle = "rgba(4, 10, 24, 0.92)";
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(16, 16, 224, 224, 32);
    ctx.fill();
    ctx.stroke();

    // Subtle cyber grid scanlines
    ctx.fillStyle = "rgba(0, 240, 255, 0.08)";
    for (let y = 28; y < 230; y += 12) {
      ctx.fillRect(20, y, 216, 2);
    }

    // Determine eye state
    let eyeH = 44;
    let eyeW = 32;
    let isBlinking = (blink < 0.14);

    if (expr === 'bonked' || expr === 'dizzy') {
      // Hilarious dizzy spiral eyes (🌀 🌀)
      const drawSpiral = (cx, cy) => {
        ctx.strokeStyle = "#ffd000";
        ctx.lineWidth = 5;
        ctx.beginPath();
        const rot = (blink || 0) * 15;
        for (let a = 0; a < Math.PI * 5; a += 0.25) {
          const r = 2 + a * 4;
          const x = cx + Math.cos(a + rot) * r;
          const y = cy + Math.sin(a + rot) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      drawSpiral(80, 114);
      drawSpiral(176, 114);

      // Wavy dizzy dazed mouth with comical tongue
      ctx.strokeStyle = "#ff0055";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(96, 175);
      ctx.bezierCurveTo(112, 160, 144, 190, 160, 175);
      ctx.stroke();

      // Comical tongue poking out
      ctx.fillStyle = "#ff007f";
      ctx.beginPath();
      ctx.arc(136, 185, 14, 0, Math.PI);
      ctx.fill();
      return;
    }

    if (expr === 'sigma') {
      // 🗿 Sigma raised eyebrow & intense mewing gaze
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#ffd000";
      // Left high raised eyebrow
      ctx.beginPath(); ctx.moveTo(54, 82); ctx.lineTo(106, 70); ctx.stroke();
      // Right furrowed eyebrow
      ctx.beginPath(); ctx.moveTo(150, 96); ctx.lineTo(202, 106); ctx.stroke();
      // Narrow squinting eyes
      ctx.fillStyle = "#ffd000";
      ctx.fillRect(66, 108, 32, 18);
      ctx.fillRect(158, 114, 32, 16);
      // Chiseled mewing smirk line
      ctx.beginPath();
      ctx.moveTo(96, 172);
      ctx.lineTo(138, 176);
      ctx.lineTo(168, 164);
      ctx.stroke();
      return;
    }

    if (expr === 'gigachad') {
      // 💪 Gigachad chiseled jawline & dark aviator shades
      ctx.fillStyle = "#ff007f";
      ctx.fillRect(52, 102, 60, 36);
      ctx.fillRect(144, 102, 60, 36);
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 4;
      ctx.strokeRect(52, 102, 60, 36);
      ctx.strokeRect(144, 102, 60, 36);
      ctx.beginPath(); ctx.moveTo(112, 114); ctx.lineTo(144, 114); ctx.stroke();
      // Gigachad chiseled jawline smile
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(88, 174); ctx.lineTo(128, 184); ctx.lineTo(168, 174);
      ctx.stroke();
      return;
    }

    if (expr === 'land') {
      // Happy curved arcs (^ ^)
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      // Left eye
      ctx.beginPath();
      ctx.arc(80, 120, 28, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      // Right eye
      ctx.beginPath();
      ctx.arc(176, 120, 28, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Cheerful open mouth
      ctx.beginPath();
      ctx.arc(128, 160, 22, 0, Math.PI);
      ctx.fillStyle = "#00ff88";
      ctx.fill();
      return;
    }

    if (expr === 'warp') {
      // ⚡ Space-Time Warp Visor Expression: High-Speed Hyperspace Spiral Eyes & Electrical Bolts
      const drawWarpEye = (cx, cy, spinDir) => {
        ctx.strokeStyle = (spinDir > 0) ? "#00ffff" : "#d500f9";
        ctx.lineWidth = 5;
        ctx.beginPath();
        const rot = (Date.now() * 0.018 * spinDir);
        for (let a = 0; a < Math.PI * 6; a += 0.28) {
          const r = 3 + a * 4.2;
          const x = cx + Math.cos(a + rot) * r;
          const y = cy + Math.sin(a + rot) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Glowing center core
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      };

      drawWarpEye(76, 110, 1);
      drawWarpEye(180, 110, -1);

      // Electric lightning energy bolts across the visor screen
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(30, 60); ctx.lineTo(65, 80); ctx.lineTo(55, 105); ctx.lineTo(95, 130);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(226, 60); ctx.lineTo(190, 85); ctx.lineTo(205, 110); ctx.lineTo(165, 135);
      ctx.stroke();

      // Amazed/screaming open warp mouth
      ctx.fillStyle = "#ff007f";
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(128, 178, 22, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      return;
    }

    if (isBlinking) {
      // Blinking slit
      ctx.fillStyle = "#00f0ff";
      ctx.fillRect(62, 118, 38, 8);
      ctx.fillRect(156, 118, 38, 8);
      return;
    }

    if (expr === 'shield_active' || expr === 'invincible') {
      // 🛡️ High-Tech Shield/Invincible Mode: Hexagonal HUD Eyes with Crosshairs
      ctx.strokeStyle = "#00f0ff";
      ctx.fillStyle = "rgba(0, 240, 255, 0.25)";
      ctx.lineWidth = 4;

      const drawHexEye = (cx, cy) => {
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2;
          const x = cx + Math.cos(angle) * 22;
          const y = cy + Math.sin(angle) * 22;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Crosshairs
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy);
        ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14);
        ctx.stroke();
      };
      drawHexEye(76, 114);
      drawHexEye(180, 114);

      // Confident cyber smirk
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(96, 172);
      ctx.lineTo(136, 178);
      ctx.lineTo(164, 168);
      ctx.stroke();
      return;
    }

    if (expr === 'hyperspeed') {
      // ⚡ Aerodynamic Supersonic Visor Slits
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.moveTo(56, 110); ctx.lineTo(108, 98); ctx.lineTo(100, 126); ctx.lineTo(48, 126);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(148, 98); ctx.lineTo(200, 110); ctx.lineTo(208, 126); ctx.lineTo(156, 126);
      ctx.fill();

      // Determined grimace / grinning teeth
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 4;
      ctx.strokeRect(92, 164, 72, 16);
      ctx.beginPath();
      ctx.moveTo(116, 164); ctx.lineTo(116, 180);
      ctx.moveTo(140, 164); ctx.lineTo(140, 180);
      ctx.stroke();
      return;
    }

    if (expr === 'near_miss') {
      // ⚠ Startled Near-Miss Eyes: Wide Pupils with Jitter
      ctx.fillStyle = "#ff5500";
      ctx.beginPath();
      ctx.arc(76, 112, 26, 0, Math.PI * 2);
      ctx.arc(180, 112, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(76 + (Math.random() - 0.5) * 4, 112, 10, 0, Math.PI * 2);
      ctx.arc(180 + (Math.random() - 0.5) * 4, 112, 10, 0, Math.PI * 2);
      ctx.fill();

      // Gasping mouth
      ctx.fillStyle = "#ff2200";
      ctx.beginPath();
      ctx.ellipse(128, 174, 18, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (expr === 'jump' || !isGrounded) {
      // Excited wide-open eyes with bright sparkle
      eyeH = 58;
      eyeW = 38;
      const eyeY = 110;

      // Left eye
      ctx.fillStyle = "#00f0ff";
      ctx.beginPath();
      ctx.roundRect(62, eyeY - eyeH/2, eyeW, eyeH, 16);
      ctx.fill();
      // Highlight
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(74, eyeY - 12, 7, 0, Math.PI * 2);
      ctx.fill();

      // Right eye
      ctx.fillStyle = "#00f0ff";
      ctx.beginPath();
      ctx.roundRect(156, eyeY - eyeH/2, eyeW, eyeH, 16);
      ctx.fill();
      // Highlight
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(168, eyeY - 12, 7, 0, Math.PI * 2);
      ctx.fill();

      // Energetic open mouth
      ctx.fillStyle = "#00f0ff";
      ctx.beginPath();
      ctx.ellipse(128, 172, 14, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // Default grounded / focused expression
    const eyeY = 114;
    // Left eye
    ctx.fillStyle = "#00f0ff";
    ctx.beginPath();
    ctx.roundRect(64, eyeY - eyeH/2, eyeW, eyeH, 12);
    ctx.fill();
    ctx.fillStyle = "#020914";
    ctx.beginPath();
    ctx.arc(84, eyeY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(80, eyeY - 6, 5, 0, Math.PI * 2);
    ctx.fill();

    // Right eye
    ctx.fillStyle = "#00f0ff";
    ctx.beginPath();
    ctx.roundRect(158, eyeY - eyeH/2, eyeW, eyeH, 12);
    ctx.fill();
    ctx.fillStyle = "#020914";
    ctx.beginPath();
    ctx.arc(178, eyeY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(174, eyeY - 6, 5, 0, Math.PI * 2);
    ctx.fill();

    // Determined cyber mouth line
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(96, 175);
    ctx.lineTo(160, 175);
    ctx.stroke();
  }

  // ═════════════════════════════════════════════════════════════════
  // PARTICLES & SHOCKWAVES
  // ═════════════════════════════════════════════════════════════════
  setupParticles() {
    // 1. Thruster Exhaust Particles
    const pCount = 50;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.8,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    this.thrusterPoints = new THREE.Points(pGeo, pMat);
    this.scene.add(this.thrusterPoints);

    this.thrusterParticles = [];
    for (let i = 0; i < pCount; i++) {
      this.thrusterParticles.push({ x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0 });
    }

    // 2. Ground Friction Sparks
    const sCount = 40;
    const sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(sCount * 3);
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    const sMat = new THREE.PointsMaterial({
      color: 0xffd000,
      size: 0.6,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.sparkPoints = new THREE.Points(sGeo, sMat);
    this.scene.add(this.sparkPoints);

    this.sparkParticles = [];
    for (let i = 0; i < sCount; i++) {
      this.sparkParticles.push({ x: 0, y: -999, z: 0, vx: 0, vy: 0, life: 0 });
    }

    // 3. ⚡ Induction Coil Warp Plasma Particle Pool
    this.setupInductionPlasma();

    // 4. 🛡️ 3D Hexagonal Energy Shield Shatter Crystal Shards Pool
    this.setupShieldShatterPool();

    // 5. 🚀 Hypersonic Warp Speed Streaks Tunnel System
    this.setupWarpSpeedStreaks();

    // 6. ✨ Colossal Volumetric God Rays & Atmospheric Light Beams
    this.setupVolumetricGodRays();
  }

  setupInductionPlasma() {
    const plCount = 60;
    const plGeo = new THREE.BufferGeometry();
    const plPos = new Float32Array(plCount * 3);
    plGeo.setAttribute('position', new THREE.BufferAttribute(plPos, 3));
    const plMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.95,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    this.plasmaPoints = new THREE.Points(plGeo, plMat);
    this.scene.add(this.plasmaPoints);

    this.plasmaStreamParticles = [];
    for (let i = 0; i < plCount; i++) {
      this.plasmaStreamParticles.push({ x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0.35 });
    }
  }

  // 🛡️ 3D Hexagonal Energy Shield Shatter Crystal Shards Pool
  setupShieldShatterPool() {
    const shardCount = 32;
    this.shieldShatterPool = [];
    this.shieldShatterGroup = new THREE.Group();
    this.scene.add(this.shieldShatterGroup);

    for (let i = 0; i < shardCount; i++) {
      const geo = (i % 2 === 0)
        ? new THREE.ConeGeometry(0.18 + Math.random() * 0.12, 0.38 + Math.random() * 0.2, 3)
        : new THREE.CylinderGeometry(0.16, 0.22, 0.05, 6);
      const mat = new THREE.MeshStandardMaterial({
        color: (i % 3 === 0 ? 0x00ffff : (i % 3 === 1 ? 0xffffff : 0x00f0ff)),
        emissive: 0x00aaff,
        emissiveIntensity: 1.4,
        roughness: 0.12,
        metalness: 0.92,
        transparent: true,
        opacity: 0.95
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.shieldShatterGroup.add(mesh);
      this.shieldShatterPool.push({
        mesh: mesh,
        active: false,
        vx: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        life: 0,
        maxLife: 0.85
      });
    }
  }

  // 🚀 Hypersonic Warp Speed Streaks Tunnel System
  setupWarpSpeedStreaks() {
    const streakCount = 64;
    this.warpStreaksGroup = new THREE.Group();
    this.scene.add(this.warpStreaksGroup);
    this.warpStreaks = [];

    const streakGeo = new THREE.CylinderGeometry(0.024, 0.024, 4.5, 4);
    streakGeo.rotateZ(Math.PI / 2);

    for (let i = 0; i < streakCount; i++) {
      const isCyan = (i % 2 === 0);
      const mat = new THREE.MeshBasicMaterial({
        color: isCyan ? 0x00f0ff : 0xd500f9,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending
      });
      const mesh = new THREE.Mesh(streakGeo, mat);
      mesh.position.set(0, -999, 0);
      this.warpStreaksGroup.add(mesh);
      this.warpStreaks.push({
        mesh: mesh,
        relX: Math.random() * 45 - 10,
        relY: Math.random() * 12 - 2,
        relZ: (Math.random() - 0.5) * 8,
        speedBonus: Math.random() * 14 + 16
      });
    }
  }

  // ✨ Colossal Volumetric God Rays & Atmospheric Light Beams
  setupVolumetricGodRays() {
    this.godRaysGroup = new THREE.Group();
    this.scene.add(this.godRaysGroup);
    this.godRays = [];

    const beamCount = 6;
    for (let i = 0; i < beamCount; i++) {
      const beamGeo = new THREE.PlaneGeometry(6.5 + (i % 3) * 2.0, 36.0);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.07,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(beamGeo, beamMat);
      mesh.rotation.z = -Math.PI / 3.8;
      mesh.position.set(i * 32, 14, -8 - (i % 3) * 3);
      this.godRaysGroup.add(mesh);
      this.godRays.push({
        mesh: mesh,
        baseX: i * 32,
        phase: i * 1.4,
        baseOpacity: 0.065 + (i % 3) * 0.02
      });
    }
  }

  setupShockwaves() {
    // Pre-allocate 6 shockwave meshes in pool
    for (let i = 0; i < 6; i++) {
      const ringGeo = new THREE.RingGeometry(0.2, 0.4, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.position.set(0, -999, 0);
      this.scene.add(mesh);
      this.shockwaves.push({ mesh, active: false, scale: 1, maxScale: 3, life: 0, maxLife: 0.35 });
    }
  }

  triggerShockwave(x, y, colorHex = 0xffffff, maxScale = 3.0) {
    const sw = this.shockwaves.find(s => !s.active);
    if (sw) {
      sw.active = true;
      sw.mesh.position.set(x, y, 0.1);
      sw.mesh.material.color.set(colorHex);
      sw.mesh.material.opacity = 0.9;
      sw.scale = 0.2;
      sw.maxScale = maxScale;
      sw.life = 0.35;
      sw.maxLife = 0.35;
    }
  }

  // 🌋 Screen Shake and Subterranean Tremor Engine
  triggerScreenShake(intensity = 1.0, duration = 0.4) {
    this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity || 0, intensity);
    this.cameraShakeTimer = Math.max(this.cameraShakeTimer || 0, duration);
    this.cameraTrauma = Math.min(1.0, (this.cameraTrauma || 0) + intensity * 0.35);
  }

  // 🧱 Unstable Gothic Platform Vibrations & Crumbling
  shakeUnstableBlock(obs, duration = 0.38) {
    if (!this.unstableBlocks) return;
    const b = this.unstableBlocks.get(obs);
    if (!b) return;
    b.shake = 1.0;
    b.shakeTimer = duration;
    const centerX = obs.x + (obs.w || 2) / 2;
    const topY = obs.y + (obs.h || 2);
    this.triggerStoneCrumble(centerX, topY);
  }

  dropUnstableBlock(obs) {
    if (!this.unstableBlocks) return;
    const b = this.unstableBlocks.get(obs);
    if (!b) return;
    b.shake = 0;
    b.falling = true;
    b.vy = -3.5;
    b.rotVel = (Math.random() - 0.5) * 5.0;
    const centerX = obs.x + (obs.w || 2) / 2;
    const centerY = obs.y + (obs.h || 2) / 2;
    this.triggerStoneShatter(centerX, centerY);
  }

  resetUnstableBlocks() {
    if (!this.unstableBlocks) return;
    this.unstableBlocks.forEach((b) => {
      b.falling = false;
      b.shake = 0;
      b.shakeTimer = 0;
      b.vy = 0;
      b.rotVel = 0;
      if (b.mesh) {
        b.mesh.position.set(b.initialX, b.initialY, b.initialZ);
        b.mesh.rotation.z = 0;
        b.mesh.visible = true;
      }
    });
  }

  triggerStoneCrumble(x, y) {
    if (this.triggerShockwave) {
      this.triggerShockwave(x, y, 0x8b1025, 1.8);
    }
    this.triggerScreenShake(0.55, 0.25);
  }

  triggerStoneShatter(x, y) {
    if (this.triggerShockwave) {
      this.triggerShockwave(x, y, 0xc41230, 3.4);
    }
    this.triggerScreenShake(1.3, 0.42);
  }

  // ⚡ High-Performance Screen Flash Overlay & WebGL Lighting Flare
  triggerScreenFlash(duration = 0.35, colorHex = 0xffffff) {
    const flashEl = document.getElementById('screen-flash');
    if (flashEl) {
      flashEl.classList.add('flash-active');
      setTimeout(() => {
        if (flashEl) flashEl.classList.remove('flash-active');
      }, Math.max(60, duration * 1000));
    }
    // WebGL Direct Lighting Flare Surge
    if (this.dirLight) {
      const origIntensity = this.dirLight.intensity;
      this.dirLight.intensity = origIntensity + 2.8;
      setTimeout(() => {
        if (this.dirLight) this.dirLight.intensity = origIntensity;
      }, Math.max(50, duration * 450));
    }
    this.cameraTrauma = Math.min(1.0, this.cameraTrauma + 0.32);
  }

  // 🛡️ 3D Hexagonal Energy Shield Shatter Burst
  triggerShieldShatter(x, y) {
    if (!this.shieldShatterPool) return;
    const count = 18;
    for (let i = 0; i < count; i++) {
      const s = this.shieldShatterPool.find(item => !item.active);
      if (s) {
        s.active = true;
        s.mesh.visible = true;
        s.mesh.position.set(x, y, (Math.random() - 0.5) * 0.8);
        s.mesh.scale.set(1, 1, 1);
        s.mesh.material.opacity = 0.95;
        s.vx = (Math.random() - 0.5) * 18.0;
        s.vy = Math.random() * 12.0 + 4.0;
        s.vz = (Math.random() - 0.5) * 12.0;
        s.rx = (Math.random() - 0.5) * 25.0;
        s.ry = (Math.random() - 0.5) * 25.0;
        s.rz = (Math.random() - 0.5) * 25.0;
        s.life = 0.85;
        s.maxLife = 0.85;
      }
    }
  }

  // ⚡ Explosive Shockwave Pulse at Inductor Coil Exit
  triggerExitShockwave(x, y) {
    this.triggerShockwave(x, y, 0x00f0ff, 6.5);
    this.triggerShockwave(x + 0.6, y, 0xd500f9, 5.0);
    this.triggerShockwave(x + 1.2, y, 0xffffff, 4.0);
    this.cameraTrauma = 0.8;
  }

  // ═════════════════════════════════════════════════════════════════
  // 24-PIECE SHATTER DEATH EXPLOSION
  // ═════════════════════════════════════════════════════════════════
  setupDeathVoxels() {
    const count = 24;
    for (let i = 0; i < count; i++) {
      const size = 0.22 + Math.random() * 0.14;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00aa55,
        roughness: 0.2,
        metalness: 0.8
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.scene.add(mesh);

      this.voxelPieces.push({
        mesh,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        life: 0
      });
    }
  }

  triggerDeathExplosion(pos, colorStr = "#00FF88") {
    this.isExploding = true;
    this.cameraTrauma = 1.0; // Max trauma shake

    this.triggerShockwave(pos.x, pos.y, 0xff0055, 4.5);

    this.voxelPieces.forEach(p => {
      p.mesh.visible = true;
      p.pos.copy(pos);
      p.mesh.position.copy(pos);
      p.mesh.material.color.set(colorStr);
      p.mesh.material.emissive.set(colorStr);

      // Spherical radial explosion
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = Math.random() * 18 + 8;
      p.vel.set(
        Math.cos(theta) * Math.sin(phi) * speed,
        Math.sin(theta) * Math.sin(phi) * speed + 4,
        Math.cos(phi) * speed * 0.4
      );
      p.rotVel.set(Math.random() * 15, Math.random() * 15, Math.random() * 15);
      p.life = 0.55;
    });
  }

  // 🌋 Fiery Volcanic Magma Incineration Death
  triggerLavaDeath(pos) {
    this.isExploding = true;
    this.cameraTrauma = 1.0;

    this.triggerShockwave(pos.x, pos.y, 0xff3700, 5.0);
    this.triggerScreenFlash(0.35);

    this.voxelPieces.forEach((p, idx) => {
      p.mesh.visible = true;
      p.pos.copy(pos);
      p.mesh.position.copy(pos);

      // Saturated glowing magma colors
      const lavaColor = idx % 3 === 0 ? "#FFDD00" : (idx % 3 === 1 ? "#FF5500" : "#FF1100");
      p.mesh.material.color.set(lavaColor);
      p.mesh.material.emissive.set(lavaColor);

      // Upward thermal plume ejection
      const angle = (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = Math.random() * 16 + 10;
      p.vel.set(
        Math.sin(angle) * speed,
        Math.cos(angle) * speed + 7,
        (Math.random() - 0.5) * 4
      );
      p.rotVel.set(Math.random() * 22, Math.random() * 22, Math.random() * 22);
      p.life = 0.65;
    });
  }

  updateDeathVoxels(dt) {
    if (!this.isExploding) return;
    let anyAlive = false;
    this.voxelPieces.forEach(p => {
      if (p.life > 0) {
        anyAlive = true;
        p.life -= dt;
        p.vel.y -= 38 * dt; // Gravity
        p.pos.addScaledVector(p.vel, dt);
        p.mesh.position.copy(p.pos);
        p.mesh.rotation.x += p.rotVel.x * dt;
        p.mesh.rotation.y += p.rotVel.y * dt;
        p.mesh.scale.setScalar(Math.max(0.01, p.life / 0.55));
      } else {
        p.mesh.visible = false;
      }
    });
    if (!anyAlive) this.isExploding = false;
  }

  // ═════════════════════════════════════════════════════════════════
  // SQUASH & STRETCH ANIMATION HOOKS (THOUSAND DOLLAR JUICE)
  // ═════════════════════════════════════════════════════════════════
  triggerJumpSquash() {
    // Instant vertical stretch & lateral squash on launch (volume preserving: Sy=1.46 => Sx=Sz=1/sqrt(1.46)~0.83)
    this.cubeScale.set(0.82, 1.46, 0.82);
    this.faceExpression = 'jump';
    this.expressionTimer = 0.35;
  }

  triggerLandingSquash() {
    // Instant landing ground impact squash (volume preserving: Sy=0.62 => Sx=Sz=1/sqrt(0.62)~1.27)
    this.cubeScale.set(1.28, 0.62, 1.28);
    this.faceExpression = 'land';
    this.expressionTimer = 0.28;
  }

  triggerLandSquash() {
    this.triggerLandingSquash();
  }

  // ═════════════════════════════════════════════════════════════════
  // MULTIPLAYER GHOST RACERS
  // ═════════════════════════════════════════════════════════════════
  setupGhosts(ghostConfigs) {
    this.ghosts.forEach(g => {
      if (g.mesh) this.scene.remove(g.mesh);
      if (g.nameplate) this.scene.remove(g.nameplate);
    });
    this.ghosts = [];

    ghostConfigs.forEach(cfg => {
      const gGroup = new THREE.Group();
      const geo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.65,
        roughness: 0.3,
        metalness: 0.8
      });
      const body = new THREE.Mesh(geo, mat);
      gGroup.add(body);

      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.9 })
      );
      body.add(wire);
      this.scene.add(gGroup);

      const nameplate = this.createNameplate(cfg.name, cfg.colorHex);
      this.scene.add(nameplate);

      this.ghosts.push({
        id: cfg.id,
        name: cfg.name,
        colorHex: cfg.colorHex,
        mesh: gGroup,
        bodyMesh: body,
        nameplate: nameplate,
        active: true
      });
    });
  }

  createNameplate(text, colorStr) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Minimalist glass capsule
    ctx.fillStyle = 'rgba(4, 6, 12, 0.85)';
    ctx.beginPath();
    ctx.roundRect(6, 8, 244, 48, 14);
    ctx.fill();
    ctx.strokeStyle = colorStr;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.6, 0.65, 1);
    return sprite;
  }

  updateGhost(id, x, y, rotationZ, isAlive) {
    const g = this.ghosts.find(item => item.id === id);
    if (!g) return;

    if (!isAlive) {
      g.mesh.visible = false;
      g.nameplate.visible = false;
      return;
    }

    g.mesh.visible = true;
    g.nameplate.visible = true;
    g.mesh.position.set(x, y, 0);
    g.bodyMesh.rotation.z = rotationZ;
    g.nameplate.position.set(x, y + 1.5, 0);
  }

  removeGhost(id) {
    const idx = this.ghosts.findIndex(g => g.id === id);
    if (idx !== -1) {
      const g = this.ghosts[idx];
      if (g.mesh) this.scene.remove(g.mesh);
      if (g.nameplate) this.scene.remove(g.nameplate);
      this.ghosts.splice(idx, 1);
    }
  }

  renderCheckpoints(checkpoints) {
    this.checkpointMeshes.forEach(m => this.scene.remove(m));
    this.checkpointMeshes = [];

    const geo = new THREE.OctahedronGeometry(0.5, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00cc66,
      emissiveIntensity: 0.7,
      roughness: 0.2
    });

    checkpoints.forEach(cp => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cp.x, cp.y + 0.6, 0);
      mesh.rotation.y = Math.PI / 4;
      this.scene.add(mesh);
      this.checkpointMeshes.push(mesh);
    });
  }

  triggerBeatPulse(beat, isDrop) {
    const pulseStrength = isDrop ? 1.25 : 1.1;

    // Pulse track underglow light
    if (this.underglow) {
      this.underglow.intensity = isDrop ? 5.5 : 3.8;
    }

    // Pulse all floating orbs
    this.orbMeshes.forEach(orb => {
      orb.userData.pulseVal = 1.0;
    });

    // Pulse all spike energy cores on the beat
    this.spikeMeshes.forEach(sp => {
      if (sp.userData && sp.userData.core) {
        sp.userData.core.scale.set(1.4, 1.4, 1.4);
      }
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // MAIN RENDER LOOP UPDATE
  // ═════════════════════════════════════════════════════════════════
  update(playerState, dt) {
    const { x, y, z, vy, rotationZ, vehicleMode, gravityDir, isGrounded, isAlive, isThrusting, isCoilTransition, coilProgress } = playerState;
    const time = this.clock.getElapsedTime();

    // 🏰 Cinematic Freeze for Gothic Castle Climax Ending
    if (this.isCinematicFrozen) {
      let camShakeX = 0, camShakeY = 0;
      if (this.cameraTrauma > 0) {
        this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 2.2);
        const shakeMag = this.cameraTrauma * this.cameraTrauma * 1.2;
        camShakeX = (Math.random() - 0.5) * shakeMag;
        camShakeY = (Math.random() - 0.5) * shakeMag;
      }
      this.camera.position.x = x + 4.5 + camShakeX;
      this.camera.position.y = (y || 2.0) * 0.4 + 4.2 + camShakeY;
      this.camera.lookAt(x + 5.5, this.camera.position.y * 0.85 + 0.5, 0);

      // Update gothic ending explosion shrapnel debris
      if (this.gothicBoomParticles && this.gothicBoomParticles.length > 0) {
        for (let i = this.gothicBoomParticles.length - 1; i >= 0; i--) {
          const p = this.gothicBoomParticles[i];
          p.life -= dt;
          if (p.life <= 0) {
            this.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
            this.gothicBoomParticles.splice(i, 1);
          } else {
            p.mesh.position.x += p.vx * dt;
            p.mesh.position.y += p.vy * dt;
            p.mesh.position.z += p.vz * dt;
            p.vy -= 22.0 * dt;
            p.mesh.rotation.x += p.rx * dt;
            p.mesh.rotation.y += p.ry * dt;
            const s = Math.max(0.01, p.life / p.maxLife);
            p.mesh.scale.set(s, s, s);
          }
        }
      }

      this.renderer.render(this.scene, this.camera);
      return;
    }

    // 1. Vehicle Switching
    if (this.currentVehicle !== vehicleMode) {
      this.currentVehicle = vehicleMode;
      this.cubeMesh.visible = (vehicleMode === "cube" && isAlive);
      this.shipMesh.visible = (vehicleMode === "ship" && isAlive);
      this.waveMesh.visible = (vehicleMode === "wave" && isAlive);
      if (this.ufoMesh) this.ufoMesh.visible = (vehicleMode === "ufo" && isAlive);
    }

    // 2. Player Vehicle Animation & Mesh Transform
    if (isAlive) {
      this.playerGroup.position.set(x, y, (z !== undefined) ? z : 0);

      if (vehicleMode === "cube") {
        this.cubeMesh.visible = true;

        // Detect landing for Squash & Stretch
        if (isGrounded && !this.prevGrounded) {
          this.triggerLandingSquash();
        }
        this.prevGrounded = isGrounded;

        if (isCoilTransition) {
          // ⚡ Space-Time Relativistic Spaghettification & Magnetic Pinching ("bending through coil")
          const progress = coilProgress || 0;
          const stretch = Math.sin(progress * Math.PI);
          // Scale X elongates up to 4.2x along track axis
          const sx = 1.0 + stretch * 3.2;
          // Scale Y & Z pinch down to 0.28
          const sy = 1.0 - stretch * 0.72;
          const sz = 1.0 - stretch * 0.72;
          this.cubeScale.set(sx, sy, sz);
          this.cubeBody.scale.copy(this.cubeScale);

          // 3D corkscrew multi-axis roll & tilt
          this.cubeBody.rotation.x += dt * 32.0;
          this.cubeBody.rotation.y += dt * 24.0;
          this.cubeBody.rotation.z += dt * 42.0;

          this.faceExpression = 'warp';

          // Emit induction plasma particles from rear of bending cube
          this.emitInductionPlasma(x, y, z || 0);
          if (Math.random() > 0.4) {
            this.emitInductionPlasma(x, y, z || 0);
          }
        } else {
          // Smooth Elastic Spring back to (1, 1, 1) conserving volume
          this.cubeScale.y += (1.0 - this.cubeScale.y) * Math.min(1, 16 * dt);
          const targetSide = 1.0 / Math.sqrt(Math.max(0.35, this.cubeScale.y));
          this.cubeScale.x += (targetSide - this.cubeScale.x) * Math.min(1, 18 * dt);
          this.cubeScale.z += (targetSide - this.cubeScale.z) * Math.min(1, 18 * dt);
          this.cubeBody.scale.copy(this.cubeScale);

          // Restore normal orientation
          this.cubeBody.rotation.x += (0 - this.cubeBody.rotation.x) * Math.min(1, 14 * dt);
          this.cubeBody.rotation.y += (0 - this.cubeBody.rotation.y) * Math.min(1, 14 * dt);
          this.cubeBody.rotation.z = rotationZ;
        }

        // Smurf Cat Blessed Halo
        if (this.smurfCatHalo) {
          this.smurfCatHalo.visible = this.smurfCatAuraActive;
          if (this.smurfCatAuraActive) {
            this.smurfCatHalo.rotation.z += 3.5 * dt;
          }
        }

        // Dynamic Face Visor Canvas update
        if (this.expressionTimer > 0) {
          this.expressionTimer -= dt;
          if (this.expressionTimer <= 0) {
            this.faceExpression = 'normal';
          }
        }
        this.eyeBlinkTimer -= dt;
        if (this.eyeBlinkTimer <= 0) {
          this.eyeBlinkTimer = Math.random() * 3.5 + 2.0;
        }
        const blinkProgress = Math.max(0, this.eyeBlinkTimer - 3.3);
        this.drawCubeFace(this.faceExpression, blinkProgress, isGrounded, vy);
        if (this.faceTexture) this.faceTexture.needsUpdate = true;

        // Ground sliding spark particles
        if (isGrounded && Math.random() > 0.4) {
          this.emitSparkParticle(x - 0.5, y);
        }
      }
      else if (vehicleMode === "ship") {
        this.shipMesh.visible = true;

        // Aerodynamic pitch angle responding smoothly to vertical speed
        const targetPitch = Math.max(-0.62, Math.min(0.62, vy * 0.045 * gravityDir));
        this.shipMesh.rotation.z += (targetPitch - this.shipMesh.rotation.z) * Math.min(1, 16 * dt);
        // Subtle banking roll matching pitch and gravity
        const targetRoll = (gravityDir < 0 ? Math.PI : 0) + this.shipMesh.rotation.z * 0.25;
        this.shipMesh.rotation.x += (targetRoll - this.shipMesh.rotation.x) * Math.min(1, 14 * dt);

        // Multi-Stage Thruster Rocket Plumes Dynamic Scale & High-Frequency Noise
        const jitter = Math.sin(time * 65) * 0.15;
        const flameLength = isThrusting ? (1.8 + jitter + Math.random() * 0.25) : (0.5 + jitter * 0.4);
        if (this.shipFlames[0]) this.shipFlames[0].scale.set(1.1, flameLength * 1.2, 1.1);
        if (this.shipFlames[1]) this.shipFlames[1].scale.set(1.0, flameLength, 1.0);
        if (this.shipFlames[2]) this.shipFlames[2].scale.set(0.9, flameLength * 0.85, 0.9);

        if (isThrusting) {
          this.emitThrusterParticle(x - 1.2, y);
        }
      }
      else if (vehicleMode === "wave") {
        this.waveMesh.visible = true;
        // Instant 45° angle snapping
        const waveAngle = (vy >= 0 ? 1 : -1) * (Math.PI / 4) * gravityDir;
        this.waveMesh.rotation.z = waveAngle;
        this.waveMesh.rotation.x = (gravityDir < 0) ? Math.PI : 0;
      }
      else if (vehicleMode === "ufo") {
        if (this.ufoMesh) {
          this.ufoMesh.visible = true;
          // Smooth banking tilt
          const targetTilt = Math.max(-0.45, Math.min(0.45, vy * 0.04 * gravityDir));
          this.ufoMesh.rotation.z += (targetTilt - this.ufoMesh.rotation.z) * Math.min(1, 14 * dt);
          this.ufoMesh.rotation.x = (gravityDir < 0 ? Math.PI : 0);

          if (this.ufoRotor) {
            this.ufoRotor.rotation.y += dt * 9.0;
          }
          if (this.ufoBeam) {
            const beamPulse = 0.8 + Math.sin(time * 25) * 0.25;
            this.ufoBeam.scale.set(beamPulse, 1.0 + Math.max(0, vy * 0.08), beamPulse);
          }
        }
      }

      // 🛡️ Multi-Tier Energy Shield Barrier & Invulnerability Grace Period Animation
      const hasShield = !!playerState.hasShield;
      const invulnTimer = playerState.invulnerableTimer || 0;
      const isInvulnerable = (invulnTimer > 0);

      if (this.shieldMesh) {
        this.shieldMesh.visible = (hasShield || isInvulnerable);
        const u = this.shieldMesh.userData;

        if (hasShield) {
          this.shieldMesh.rotation.y += dt * 3.4;
          this.shieldMesh.rotation.x += dt * 1.8;
          if (u.ring1) u.ring1.rotation.z += dt * 5.2;
          if (u.ring2) u.ring2.rotation.y += dt * 4.4;
          if (u.innerPlasma) {
            u.innerPlasma.rotation.x += dt * 6.5;
            const pScale = 0.88 + Math.sin(time * 10) * 0.16;
            u.innerPlasma.scale.set(pScale, pScale, pScale);
          }
          if (u.invulnCage) u.invulnCage.visible = false;
          if (u.sphere) u.sphere.visible = true;
          const s = 1.0 + Math.sin(time * 8) * 0.08;
          this.shieldMesh.scale.set(s, s, s);
        } else if (isInvulnerable) {
          // Rapid Invulnerability Honeycomb Pulse & Phase Shift
          if (u.invulnCage) {
            u.invulnCage.visible = true;
            u.invulnCage.rotation.y += dt * 14.0;
            u.invulnCage.rotation.z += dt * 9.0;
            const flashWhite = (Math.floor(time * 30) % 2 === 0);
            u.invulnCage.material.color.setHex(flashWhite ? 0xffffff : 0x00ffff);
          }
          if (u.sphere) u.sphere.visible = (Math.floor(time * 20) % 2 === 0);
          this.shieldMesh.scale.set(1.15, 1.15, 1.15);

          // Visually flicker player model at 24Hz to indicate active grace invulnerability
          const flickerVisible = (Math.floor(time * 24) % 2 === 0);
          if (vehicleMode === "cube" && this.cubeMesh) this.cubeMesh.visible = flickerVisible;
          else if (vehicleMode === "ship" && this.shipMesh) this.shipMesh.visible = flickerVisible;
          else if (vehicleMode === "wave" && this.waveMesh) this.waveMesh.visible = flickerVisible;
          else if (vehicleMode === "ufo" && this.ufoMesh) this.ufoMesh.visible = flickerVisible;
        }
      }
    } else {
      this.cubeMesh.visible = false;
      this.shipMesh.visible = false;
      this.waveMesh.visible = false;
      if (this.ufoMesh) this.ufoMesh.visible = false;
      if (this.shieldMesh) this.shieldMesh.visible = false;
    }

    // 3. Update Particle Systems
    this.updateParticles(dt);

    // 4. Update Dynamic Trail Ribbon
    if (isAlive) {
      this.updateTrailRibbon(x, y);
    }

    // 5. Update Shockwave Rings
    this.updateShockwaves(dt);

    // 6. Update Death Voxel Shards
    this.updateDeathVoxels(dt);

    // 7. Update Tung Tung Sahur Whacking Entity
    this.updateTungTung(dt, x, y);

    // ⚡ Update 3D Inductor Coil electromagnetic mechanics
    this.updateInductorCoil(dt, time);

    // ⚡ If Inductor Coil Transition is running, let it control the camera & transit
    if (this.isCoilTransition) {
      this.updateCoilTransition(dt, time, playerState);
    } else {
      // 8. Dynamic Camera Follow with Trauma Screen Shake & Cataclysm Tremors
      let camShakeX = 0, camShakeY = 0;
      if (this.cameraTrauma > 0) {
        this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 2.2);
        const shakeMag = this.cameraTrauma * this.cameraTrauma * 0.8;
        camShakeX += (Math.random() - 0.5) * shakeMag;
        camShakeY += (Math.random() - 0.5) * shakeMag;
      }

      if (this.cameraShakeTimer > 0) {
        this.cameraShakeTimer -= dt;
        const sMag = this.cameraShakeIntensity;
        camShakeX += (Math.random() - 0.5) * sMag;
        camShakeY += (Math.random() - 0.5) * sMag;
      }

      // Subterranean continuous tremor during Gothic Castle Collapse (progressRatio >= 0.85)
      const isGothic = (this.currentLevel && (this.currentLevel.themeType === 'gothic' || this.currentLevel.id === 1));
      const progRatio = this.currentLevel ? Math.max(0, Math.min(1, x / this.currentLevel.endX)) : 0;
      if (isGothic && progRatio >= 0.85) {
        const cataclysmTremor = ((progRatio - 0.85) / 0.15) * 0.14;
        camShakeX += (Math.random() - 0.5) * cataclysmTremor;
        camShakeY += (Math.random() - 0.5) * cataclysmTremor;
      }

      const targetCameraY = y * 0.4 + (gravityDir < 0 ? 6.5 : 4.2);
      this.camera.position.x = x + 4.5 + camShakeX;
      this.camera.position.y += (targetCameraY - this.camera.position.y) * Math.min(1, 8.5 * dt) + camShakeY;
      this.camera.position.z = 15.5;
      this.camera.lookAt(x + 5.5, this.camera.position.y * 0.85 + 0.5, 0);

      // ⚡ Dynamic Hypersonic Speed Warp FOV Stretching
      const speedMult = playerState.speedMult || 1.0;
      const targetFov = this.defaultCameraFov + Math.max(0, (speedMult - 1.0) * 11.0);
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, 5.0 * dt);
      this.camera.updateProjectionMatrix();
    }

    // 🚀 Update Hypersonic Warp Speed Streaks Tunnel System
    const currentSpeedMult = playerState.speedMult || 1.0;
    this.updateWarpSpeedStreaks(dt, currentSpeedMult, x, y);

    // ✨ Update Volumetric God Rays Light Shafts
    this.updateVolumetricGodRays(time, dt);

    // 8. Update Parallax Scenery Engine (Dynamic Obstacle Zones & Themed Backdrop)
    if (this.sceneryManager) {
      const progressRatio = this.currentLevel ? Math.max(0, Math.min(1, x / this.currentLevel.endX)) : 0;
      this.sceneryManager.update(x, progressRatio, time, dt);

      // 🏰 Dynamic Gothic Castle Living Environment Updates
      if (this.currentLevel && this.currentLevel.themeType === 'gothic') {
        // 1. Unstable Collapsing Platforms Tremor in Section 5 (progressRatio >= 0.82)
        // 1. Unstable Collapsing Platforms Tremor & Plunge in Section 5 (progressRatio >= 0.82)
        if (this.unstableBlocks && this.unstableBlocks.size > 0) {
          const isFrozen = (this.sceneryManager && this.sceneryManager.isFrozen);
          const isTrembling = (progressRatio >= 0.82);
          const tremor = isTrembling ? Math.min(1.0, (progressRatio - 0.82) / 0.16) : 0;
          const ambientShakeAmp = 0.08 * tremor;

          this.unstableBlocks.forEach((b) => {
            if (isFrozen) return;

            if (b.falling) {
              b.vy -= 42.0 * dt;
              b.mesh.position.y += b.vy * dt;
              b.mesh.rotation.z += b.rotVel * dt;
              if (b.mesh.position.y < -25) {
                b.mesh.visible = false;
              }
            } else if (b.shake > 0) {
              b.shakeTimer -= dt;
              if (b.shakeTimer <= 0) {
                b.shake = 0;
              }
              const sx = (Math.random() - 0.5) * 0.28;
              const sy = (Math.random() - 0.5) * 0.22;
              b.mesh.position.set(b.initialX + sx, b.initialY + sy, b.initialZ);
            } else if (isTrembling) {
              const u = b.mesh.userData || {};
              const phase = u.jitterPhase || 0;
              const sx = Math.sin(time * 35.0 + phase) * ambientShakeAmp;
              const sy = Math.sin(time * 42.0 + phase * 1.3) * (ambientShakeAmp * 0.7);
              b.mesh.position.set(b.initialX + sx, b.initialY + sy, b.initialZ);
            }
          });
        }

        // 2. Animate Wall Sconce Torch Flames with Act Progression
        if (this.gothicFloorMeshes && this.gothicFloorMeshes.length > 0) {
          this.gothicFloorMeshes.forEach(m => {
            if (m.userData && m.userData.isTorchFlame) {
              const u = m.userData;
              const baseScale = progressRatio < 0.2 ? 0.35 : (progressRatio < 0.45 ? 0.75 : 1.0);
              const flicker = 0.85 + Math.sin(time * u.speed + u.offset) * 0.2;
              const s = baseScale * flicker;
              m.scale.set(s, s * 1.25, s);
            }
          });
        }

        // 3. Animate Gothic Sanctuary Gate Rift Void & Braziers
        if (this.gothicSanctuaryGate && this.gothicSanctuaryGate.userData) {
          const gData = this.gothicSanctuaryGate.userData;
          if (gData.riftDisc) {
            gData.riftDisc.rotation.z -= dt * 2.2;
          }
          if (gData.flames) {
            gData.flames.forEach(fl => {
              const s = 0.85 + Math.sin(time * 16.0 + fl.offset) * 0.2;
              fl.mesh.scale.set(s, s * 1.35, s);
            });
          }
        }
      }
    }

    // 9. Dynamic Track Underglow
    this.underglow.position.set(x + 2, y, 3);
    if (this.underglow.intensity > 3.0) {
      this.underglow.intensity -= dt * 4.0;
    }

    // 10. Interactive Obstacle Animations
    // Orbs dual rings
    this.orbMeshes.forEach(orb => {
      orb.userData.ring1.rotation.z += dt * 3.2;
      orb.userData.ring2.rotation.y += dt * 2.8;
      if (orb.userData.pulseVal > 0) {
        orb.userData.pulseVal -= dt * 4.5;
        const s = 1.0 + Math.max(0, orb.userData.pulseVal) * 0.3;
        orb.scale.set(s, s, s);
      }
    });

    // Pads spring bounce
    this.padMeshes.forEach(pad => {
      if (pad.userData.bounceTimer > 0) {
        pad.userData.bounceTimer -= dt * 6.5;
        const b = Math.max(0, pad.userData.bounceTimer);
        pad.userData.springMesh.scale.y = 1.0 - b * 0.6;
        pad.userData.topMesh.position.y = 0.15 - b * 0.12;
      }
    });

    // Portals dimensional swirl
    this.portalMeshes.forEach(portal => {
      portal.userData.ringMesh.rotation.z += dt * portal.userData.rotSpeed;
      portal.userData.discMesh.rotation.z -= dt * (portal.userData.rotSpeed * 0.8);
    });

    // Checkpoint diamonds
    this.checkpointMeshes.forEach((mesh, idx) => {
      mesh.rotation.y += dt * 2.5;
      mesh.position.y += Math.sin(time * 3 + idx) * 0.006;
    });

    // Spikes floating energy core animation
    this.spikeMeshes.forEach(sp => {
      if (sp.userData && sp.userData.core) {
        sp.userData.core.rotation.y += dt * 3.2;
        sp.userData.core.rotation.x += dt * 1.8;
        const s = 1.0 + Math.sin(time * 5 + sp.userData.pulseOffset) * 0.22;
        sp.userData.core.scale.set(s, s, s);
      }
    });

    // Gem floating crystals & sparkle rings
    this.gemMeshes.forEach(gem => {
      if (gem.userData && !gem.userData.isCollected) {
        gem.userData.gemMesh.rotation.y += dt * 3.0;
        gem.userData.gemMesh.rotation.z = Math.sin(time * 2.5) * 0.15;
        gem.position.y = gem.userData.baseY + Math.sin(time * 3.5 + gem.position.x) * 0.15;
        gem.userData.sparkleGroup.rotation.y -= dt * 3.5;
      }
    });

    // Gem burst particles
    for (let i = this.gemParticles.length - 1; i >= 0; i--) {
      const gp = this.gemParticles[i];
      gp.life -= dt;
      if (gp.life <= 0) {
        this.scene.remove(gp.mesh);
        gp.mesh.geometry.dispose();
        gp.mesh.material.dispose();
        this.gemParticles.splice(i, 1);
      } else {
        gp.mesh.position.x += gp.vx * dt;
        gp.mesh.position.y += gp.vy * dt;
        gp.vy -= 25.0 * dt;
        gp.mesh.rotation.x += dt * 8.0;
        gp.mesh.rotation.y += dt * 6.0;
        const s = gp.life / 0.55;
        gp.mesh.scale.set(s, s, s);
      }
    }

    // 10b. ⚡ Speed Gates, Shield Pickups & Counter-Attack Turret Orbs
    if (this.speedGateMeshes) {
      this.speedGateMeshes.forEach(sg => {
        if (sg.userData && sg.userData.chevrons) {
          sg.userData.chevrons.children.forEach((chev, cIdx) => {
            const cOffset = ((time * 3.5 + cIdx * 0.33) % 1.0);
            chev.position.x = -0.8 + cOffset * 1.6;
            chev.material.opacity = 0.35 + Math.sin(cOffset * Math.PI) * 0.65;
          });
        }
      });
    }

    if (this.shieldPickupMeshes) {
      this.shieldPickupMeshes.forEach(sp => {
        if (!sp.userData.isCollected) {
          sp.userData.core.rotation.y += dt * 3.4;
          sp.userData.cage.rotation.y -= dt * 2.2;
          sp.userData.cage.rotation.x += dt * 1.6;
          if (sp.userData.ring) {
            sp.userData.ring.rotation.z += dt * 4.0;
            sp.userData.ring.rotation.x += dt * 2.5;
          }
          if (sp.userData.beacon) {
            sp.userData.beacon.material.opacity = 0.22 + Math.sin(time * 6.0 + sp.position.x) * 0.12;
          }
          const baseY = (sp.userData.obstacle && sp.userData.obstacle.y !== undefined) ? sp.userData.obstacle.y : 2.5;
          sp.position.y = baseY + Math.sin(time * 3.5 + sp.position.x) * 0.18;
        }
      });
    }

    if (this.counterOrbMeshes) {
      this.counterOrbMeshes.forEach(co => {
        co.userData.ring1.rotation.z += dt * 4.2;
        co.userData.ring2.rotation.y += dt * 3.8;
        co.userData.cross.rotation.x += dt * 2.5;
        if (co.userData.pulseVal > 0) {
          co.userData.pulseVal -= dt * 4.0;
          const s = 1.0 + Math.max(0, co.userData.pulseVal) * 0.4;
          co.scale.set(s, s, s);
        }
      });
    }

    // 10d. 🪜 Animated Stairs Sequential LED Light Runners
    this.stairMeshes.forEach(stair => {
      const u = stair.userData;
      if (u.runners && u.runners.length > 0) {
        const stepCount = u.steps;
        const currentRunnerIdx = Math.floor((time * 6.5 + u.pulseOffset) % stepCount);
        u.runners.forEach((r, idx) => {
          if (idx === currentRunnerIdx) {
            r.material.color.setHex(0xffffff);
            r.scale.set(1.05, 1.4, 1.2);
          } else {
            r.material.color.setHex(u.neonColor);
            r.scale.set(1.0, 1.0, 1.0);
          }
        });
      }
      if (u.risers) {
        const pulse = 0.22 + Math.sin(time * 4.0 + u.pulseOffset) * 0.12;
        u.risers.forEach(riser => {
          riser.material.opacity = pulse;
        });
      }
    });

    // 10e. 🌪️ Aero Fan Rotors, Spiraling Wind Ribbons & Gust Rings
    this.fanMeshes.forEach(fan => {
      const u = fan.userData;
      const playerInFan = isAlive && (x >= u.obstacle.x - 0.2 && x <= u.obstacle.x + u.fanW + 0.2 && y >= u.baseY - 0.2 && y <= u.baseY + u.fanH);
      const rotorSpeed = playerInFan ? 65.0 : u.spinSpeed;
      if (u.rotor) {
        u.rotor.rotation.y += dt * rotorSpeed;
      }
      if (u.windColumn) {
        u.windColumn.material.opacity = playerInFan ? 0.28 : 0.12;
        const colPulse = 1.0 + Math.sin(time * 12) * 0.04;
        u.windColumn.scale.set(colPulse, 1.0, colPulse);
      }
      if (u.ribbons) {
        u.ribbons.forEach(rib => {
          rib.rotation.z += dt * (playerInFan ? 7.0 : 3.5);
          rib.position.x = u.baseX;
          const yDrift = ((time * (playerInFan ? 4.5 : 2.5) + rib.userData.yOffset) % u.fanH);
          rib.position.y = u.baseY + 0.5 + yDrift;
          rib.material.opacity = Math.sin((yDrift / u.fanH) * Math.PI) * 0.75;
        });
      }
      if (u.gustRings) {
        u.gustRings.forEach(gRing => {
          const gProg = ((time * (playerInFan ? 3.5 : 2.0) + gRing.userData.phase) % 1.0);
          gRing.position.set(u.baseX, u.baseY + 0.4 + gProg * u.fanH, 0);
          const s = 1.0 + gProg * 0.45;
          gRing.scale.set(s, s, 1.0);
          gRing.material.opacity = (1.0 - gProg) * 0.65;
        });
      }
    });

    // 10f. 🌋 Molten Lava Churning Magma Canvas & Active Magma Bubbles
    if (this.lavaMeshes.length > 0) {
      if (!this.lastLavaTextureTime || (performance.now() - this.lastLavaTextureTime > 35)) {
        this.lastLavaTextureTime = performance.now();
        this.updateLavaTexture(time);
      }
      this.lavaMeshes.forEach(lava => {
        const u = lava.userData;
        if (u.crusts) {
          u.crusts.forEach(crust => {
            crust.position.y = crust.userData.baseY + Math.sin(time * 3.2 + crust.userData.bobPhase) * 0.04;
            crust.rotation.z = Math.sin(time * 2.5 + crust.userData.bobPhase) * 0.02;
          });
        }
        if (u.bubbles) {
          u.bubbles.forEach(bubble => {
            const bProg = (time * (bubble.userData.speed || 3.0) + bubble.userData.phase) % (Math.PI * 2);
            const scale = Math.max(0.01, Math.sin(bProg) * (bubble.userData.maxScale || 1.0));
            bubble.scale.set(scale, scale * 1.25, scale);
            if (scale > 0.85 && Math.random() < 0.25) {
              this.emitSparkParticle(bubble.position.x, bubble.position.y + 0.2);
            }
          });
        }
        if (u.haze) {
          u.haze.material.opacity = 0.16 + Math.sin(time * 5.0) * 0.08;
        }
      });
    }

    // 10c. ⚡ Update 3D Inductor Coil Animations (Rotors, Lightning Arcs & Pulse Rings)
    this.updateInductorCoil(dt, time);

    // 10d. 🏰 Update Gothic Ending Explosion Shrapnel
    if (this.gothicBoomParticles && this.gothicBoomParticles.length > 0) {
      for (let i = this.gothicBoomParticles.length - 1; i >= 0; i--) {
        const p = this.gothicBoomParticles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          p.mesh.material.dispose();
          this.gothicBoomParticles.splice(i, 1);
        } else {
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.z += p.vz * dt;
          p.vy -= 22.0 * dt;
          p.mesh.rotation.x += p.rx * dt;
          p.mesh.rotation.y += p.ry * dt;
          const s = Math.max(0.01, p.life / p.maxLife);
          p.mesh.scale.set(s, s, s);
        }
      }
    }

    // 11. Render Frame
    this.renderer.render(this.scene, this.camera);
  }

  // ═════════════════════════════════════════════════════════════════
  // PARTICLE EMITTERS & LIFECYCLES
  // ═════════════════════════════════════════════════════════════════
  emitThrusterParticle(x, y) {
    const p = this.thrusterParticles.find(item => item.life <= 0);
    if (p) {
      p.x = x;
      p.y = y;
      p.z = (Math.random() - 0.5) * 0.4;
      p.vx = -14 - Math.random() * 6;
      p.vy = (Math.random() - 0.5) * 4;
      p.vz = (Math.random() - 0.5) * 2;
      p.life = 0.28;
    }
  }

  emitSparkParticle(x, y) {
    const s = this.sparkParticles.find(item => item.life <= 0);
    if (s) {
      s.x = x;
      s.y = y;
      s.z = (Math.random() - 0.5) * 0.3;
      s.vx = -8 - Math.random() * 6;
      s.vy = Math.random() * 3 + 1;
      s.life = 0.2;
    }
  }

  emitInductionPlasma(x, y, z) {
    const p = this.plasmaStreamParticles.find(item => item.life <= 0);
    if (p) {
      p.x = x - 0.6;
      p.y = y + (Math.random() - 0.5) * 0.35;
      p.z = (z !== undefined ? z : 0) + (Math.random() - 0.5) * 0.35;
      p.vx = -18 - Math.random() * 14;
      p.vy = (Math.random() - 0.5) * 4.5;
      p.vz = (Math.random() - 0.5) * 4.5;
      p.life = 0.35;
      p.maxLife = 0.35;
    }
  }

  updateParticles(dt) {
    // Thrusters
    const tArr = this.thrusterPoints.geometry.attributes.position.array;
    this.thrusterParticles.forEach((p, i) => {
      if (p.life > 0) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        tArr[i * 3] = p.x;
        tArr[i * 3 + 1] = p.y;
        tArr[i * 3 + 2] = p.z;
      } else {
        tArr[i * 3] = 0;
        tArr[i * 3 + 1] = -999;
        tArr[i * 3 + 2] = 0;
      }
    });
    this.thrusterPoints.geometry.attributes.position.needsUpdate = true;

    // Sparks
    const sArr = this.sparkPoints.geometry.attributes.position.array;
    this.sparkParticles.forEach((s, i) => {
      if (s.life > 0) {
        s.life -= dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        sArr[i * 3] = s.x;
        sArr[i * 3 + 1] = s.y;
        sArr[i * 3 + 2] = s.z;
      } else {
        sArr[i * 3] = 0;
        sArr[i * 3 + 1] = -999;
        sArr[i * 3 + 2] = 0;
      }
    });
    this.sparkPoints.geometry.attributes.position.needsUpdate = true;

    // ⚡ Induction Warp Plasma Stream
    if (this.plasmaPoints) {
      const plArr = this.plasmaPoints.geometry.attributes.position.array;
      this.plasmaStreamParticles.forEach((p, i) => {
        if (p.life > 0) {
          p.life -= dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          plArr[i * 3] = p.x;
          plArr[i * 3 + 1] = p.y;
          plArr[i * 3 + 2] = p.z;
        } else {
          plArr[i * 3] = 0;
          plArr[i * 3 + 1] = -999;
          plArr[i * 3 + 2] = 0;
        }
      });
      this.plasmaPoints.geometry.attributes.position.needsUpdate = true;
    }

    // 🛡️ 3D Hexagonal Energy Shield Shatter Physics Shards
    this.updateShieldShatter(dt);
  }

  // 🛡️ Update Shatter Crystal Fragments
  updateShieldShatter(dt) {
    if (!this.shieldShatterPool) return;
    this.shieldShatterPool.forEach(s => {
      if (s.active) {
        s.life -= dt;
        if (s.life <= 0) {
          s.active = false;
          s.mesh.visible = false;
        } else {
          s.mesh.position.x += s.vx * dt;
          s.mesh.position.y += s.vy * dt;
          s.mesh.position.z += s.vz * dt;
          s.vy -= 28.0 * dt;
          s.mesh.rotation.x += s.rx * dt;
          s.mesh.rotation.y += s.ry * dt;
          s.mesh.rotation.z += s.rz * dt;
          const fade = Math.max(0, s.life / s.maxLife);
          s.mesh.scale.set(fade, fade, fade);
          if (s.mesh.material) s.mesh.material.opacity = fade * 0.95;
        }
      }
    });
  }

  // 🚀 Update Warp Speed Streaks
  updateWarpSpeedStreaks(dt, speedMult, playerX, playerY) {
    if (!this.warpStreaks || !this.warpStreaksGroup) return;
    const isWarping = (speedMult > 1.05);
    const targetOpacity = isWarping ? Math.min(0.85, (speedMult - 1.0) * 0.7) : 0.0;

    this.warpStreaks.forEach((item) => {
      const m = item.mesh;
      m.material.opacity += (targetOpacity - m.material.opacity) * Math.min(1, 8.0 * dt);
      if (m.material.opacity > 0.01) {
        m.position.x -= (34.0 * speedMult + item.speedBonus) * dt;
        if (m.position.x < playerX - 14) {
          m.position.x = playerX + 32 + Math.random() * 12;
          m.position.y = (playerY || 4.5) + (Math.random() - 0.5) * 10;
          m.position.z = (Math.random() - 0.5) * 7.5;
        }
      }
    });
  }

  // ✨ Update Volumetric God Rays
  updateVolumetricGodRays(time, dt) {
    if (!this.godRays) return;
    const beatPulse = (this.underglow && this.underglow.intensity > 3.0) ? 0.08 : 0.0;
    this.godRays.forEach(ray => {
      const wobble = Math.sin(time * 1.5 + ray.phase) * 0.04;
      ray.mesh.rotation.z = -Math.PI / 3.8 + wobble;
      const targetOp = ray.baseOpacity + Math.sin(time * 2.2 + ray.phase) * 0.02 + beatPulse;
      ray.mesh.material.opacity += (targetOp - ray.mesh.material.opacity) * Math.min(1, 6.0 * dt);
    });
  }

  updateShockwaves(dt) {
    this.shockwaves.forEach(sw => {
      if (sw.active) {
        sw.life -= dt;
        if (sw.life <= 0) {
          sw.active = false;
          sw.mesh.position.set(0, -999, 0);
        } else {
          const progress = 1.0 - (sw.life / sw.maxLife);
          const currentScale = sw.scale + (sw.maxScale - sw.scale) * progress;
          sw.mesh.scale.set(currentScale, currentScale, 1);
          sw.mesh.material.opacity = (1.0 - progress) * 0.9;
        }
      }
    });
  }

  updateTrailRibbon(px, py) {
    this.trailHistory.unshift({ x: px, y: py });
    if (this.trailHistory.length > 30) {
      this.trailHistory.pop();
    }

    const posAttr = this.playerTrail.geometry.attributes.position;
    const arr = posAttr.array;
    for (let i = 0; i < 30; i++) {
      const pt = this.trailHistory[i] || { x: px, y: py };
      arr[i * 3] = pt.x;
      arr[i * 3 + 1] = pt.y;
      arr[i * 3 + 2] = 0;
    }
    posAttr.needsUpdate = true;
  }

  // ═════════════════════════════════════════════════════════════════
  // 🥁 TUNG TUNG SAHUR 3D RIG, ATTACK ENGINE & COMIC POPUPS
  // ═════════════════════════════════════════════════════════════════

  setupTungTungCharacter() {
    this.tungTungGroup = new THREE.Group();
    this.tungTungGroup.visible = false;
    this.scene.add(this.tungTungGroup);

    // 1. Kentongan Wooden Slit Drum Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.42, 0.38, 1.35, 16);
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x9b5a2b,
      roughness: 0.65,
      metalness: 0.1
    });
    const trunk = new THREE.Mesh(trunkGeo, woodMat);
    this.tungTungGroup.add(trunk);

    // Carved slit hollow
    const slitGeo = new THREE.BoxGeometry(0.12, 0.64, 0.18);
    const slitMat = new THREE.MeshBasicMaterial({ color: 0x180902 });
    const slit = new THREE.Mesh(slitGeo, slitMat);
    slit.position.set(0, -0.06, 0.36);
    this.tungTungGroup.add(slit);

    // Red Headband
    const bandGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.22, 16);
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0xee2222,
      roughness: 0.35,
      emissive: 0x550000,
      emissiveIntensity: 0.4
    });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.set(0, 0.48, 0);
    this.tungTungGroup.add(band);

    // Knot on side of headband
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), bandMat);
    knot.position.set(0.44, 0.48, 0);
    this.tungTungGroup.add(knot);

    // Big Expressive Googly Cartoon Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });

    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), eyeMat);
    leftEye.position.set(-0.16, 0.26, 0.38);
    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), pupilMat);
    leftPupil.position.set(-0.16, 0.22, 0.51);
    this.tungTungGroup.add(leftEye);
    this.tungTungGroup.add(leftPupil);

    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 12), eyeMat);
    rightEye.position.set(0.16, 0.29, 0.38);
    const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), pupilMat);
    rightPupil.position.set(0.16, 0.24, 0.52);
    this.tungTungGroup.add(rightEye);
    this.tungTungGroup.add(rightPupil);

    // Wide Goofy Mouth with Two Front Teeth
    const mouthGeo = new THREE.BoxGeometry(0.30, 0.12, 0.08);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x330000 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, 0.02, 0.40);
    this.tungTungGroup.add(mouth);

    const toothGeo = new THREE.BoxGeometry(0.07, 0.06, 0.05);
    const toothL = new THREE.Mesh(toothGeo, eyeMat);
    toothL.position.set(-0.06, 0.05, 0.44);
    const toothR = new THREE.Mesh(toothGeo, eyeMat);
    toothR.position.set(0.06, 0.05, 0.44);
    this.tungTungGroup.add(toothL);
    this.tungTungGroup.add(toothR);

    // Right Arm: Mallet Drumstick Rig (Shoulder Pivot)
    this.tungTungArm = new THREE.Group();
    this.tungTungArm.position.set(0.48, 0.16, 0.15);

    const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8);
    const armMesh = new THREE.Mesh(armGeo, woodMat);
    armMesh.position.set(0, -0.26, 0);
    this.tungTungArm.add(armMesh);

    // Mallet Stick Handle
    const malletHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), woodMat);
    malletHandle.rotation.x = Math.PI / 2;
    malletHandle.position.set(0, -0.52, 0.30);
    this.tungTungArm.add(malletHandle);

    // Heavy Wooden Drum Mallet Head with Gold Bands
    const malletHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.45, 12),
      new THREE.MeshStandardMaterial({ color: 0x5a3014, roughness: 0.5, metalness: 0.5 })
    );
    malletHead.rotation.z = Math.PI / 2;
    malletHead.position.set(0, -0.52, 0.72);
    this.tungTungArm.add(malletHead);

    this.tungTungGroup.add(this.tungTungArm);

    // Left Arm (Cheering / Waving)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.48, 0.16, 0.15);
    const leftArmMesh = new THREE.Mesh(armGeo, woodMat);
    leftArmMesh.position.set(0, -0.24, 0);
    leftArmMesh.rotation.z = 0.6;
    leftArmGroup.add(leftArmMesh);
    this.tungTungLeftArm = leftArmGroup;
    this.tungTungGroup.add(this.tungTungLeftArm);

    // Scissoring Running Peg Legs
    this.tungTungLegs = [];
    [-0.18, 0.18].forEach((lx, i) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(lx, -0.68, 0);
      const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.46, 8), woodMat);
      legMesh.position.set(0, -0.20, 0);
      legGroup.add(legMesh);

      const footMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.26), bandMat);
      footMesh.position.set(0, -0.40, 0.06);
      legGroup.add(footMesh);

      this.tungTungGroup.add(legGroup);
      this.tungTungLegs.push(legGroup);
    });

    // Glowing Golden Ramadan Crescent & Star Halo
    const moonGeo = new THREE.TorusGeometry(0.24, 0.04, 8, 24, Math.PI * 1.55);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(0, 0.96, 0);
    moon.rotation.z = 0.4;
    this.tungTungGroup.add(moon);
  }

  // Trigger Tung Tung Sahur to pop in and beat the cube!
  triggerTungTungAttack(playerX, playerY, onWhackCallback = null) {
    if (!this.tungTungGroup) return;

    this.tungTungState.active = true;
    this.tungTungState.phase = 'enter';
    this.tungTungState.timer = 0;
    this.tungTungState.whackTimer = 0;
    this.tungTungState.strikes = 0;
    this.tungTungState.lastHitCycle = -1;
    this.tungTungState.whackCallback = onWhackCallback;

    // Start diving in from top sky
    this.tungTungGroup.visible = true;
    this.tungTungGroup.position.set(playerX - 2.5, playerY + 6.0, 0.3);
    this.tungTungGroup.rotation.set(0, 0, 0.3);
    this.tungTungGroup.scale.set(1, 1, 1);
  }

  updateTungTung(dt, playerX, playerY) {
    if (!this.tungTungState.active || !this.tungTungGroup) return;

    const state = this.tungTungState;
    const time = this.clock.getElapsedTime();

    if (state.phase === 'enter') {
      state.timer += dt;
      // Dive down towards player
      const targetX = playerX - 0.55;
      const targetY = playerY + 1.15;
      this.tungTungGroup.position.x += (targetX - this.tungTungGroup.position.x) * Math.min(1, 7 * dt);
      this.tungTungGroup.position.y += (targetY - this.tungTungGroup.position.y) * Math.min(1, 7 * dt);
      this.tungTungGroup.position.z = 0.3;

      const dist = Math.hypot(this.tungTungGroup.position.x - targetX, this.tungTungGroup.position.y - targetY);
      if (dist < 0.45 || state.timer > 0.8) {
        state.phase = 'whack';
        state.whackTimer = 0;
        state.strikes = 0;
        state.lastHitCycle = -1;
      }
    } else if (state.phase === 'whack') {
      // Hover tightly above and slightly behind player cube
      this.tungTungGroup.position.set(playerX - 0.52, playerY + 1.10, 0.3);

      // Scissoring running legs animation
      const legCycle = time * 28;
      if (this.tungTungLegs[0]) this.tungTungLegs[0].rotation.x = Math.sin(legCycle) * 0.75;
      if (this.tungTungLegs[1]) this.tungTungLegs[1].rotation.x = -Math.sin(legCycle) * 0.75;
      if (this.tungTungLeftArm) this.tungTungLeftArm.rotation.x = Math.cos(legCycle) * 0.6;

      // Whack swing cycle (~3.2 strikes per second)
      state.whackTimer += dt;
      const swingFreq = 3.2;
      const totalCycles = state.whackTimer * swingFreq;
      const currentCycleIndex = Math.floor(totalCycles);
      const cycleProgress = totalCycles % 1.0;

      // Arm swing angle: wind up high, slam down hard
      this.tungTungArm.rotation.z = Math.sin(cycleProgress * Math.PI * 2) * 1.4 - 0.15;

      // Strike impact occurs at peak downswing
      if (cycleProgress > 0.45 && cycleProgress < 0.75 && state.lastHitCycle !== currentCycleIndex) {
        state.lastHitCycle = currentCycleIndex;
        state.strikes++;

        // 1. Squash the player cube flat!
        this.cubeScale.set(1.65, 0.32, 1.65);
        this.faceExpression = 'bonked';
        this.expressionTimer = 0.32;

        // 2. Camera screen shake trauma
        this.cameraTrauma = Math.min(1.0, this.cameraTrauma + 0.36);

        // 3. Comic Floating Hit Text
        const words = ["💥 TUNG!", "🔨 BONK!", "🥁 SAHUR!", "⚡ TUK!"];
        const word = words[(state.strikes - 1) % words.length];
        this.triggerComicHitText(playerX, playerY + 0.5, word, "#FFD000");

        // 4. Hit spark particles
        for (let k = 0; k < 3; k++) {
          this.emitSparkParticle(playerX + (Math.random() - 0.5) * 0.6, playerY + 0.5);
        }

        // 5. Notify game logic / audio
        if (state.whackCallback) {
          state.whackCallback(state.strikes);
        }

        // After 6 fierce whacks: rocket away!
        if (state.strikes >= 6) {
          state.phase = 'exit';
          state.exitVelX = 14;
          state.exitVelY = 24;
          this.triggerComicHitText(playerX, playerY + 1.2, "SAHURRRRR! 🌙", "#00FF88");
        }
      }
    } else if (state.phase === 'exit') {
      // Blast off into the sky spinning
      this.tungTungGroup.position.x += state.exitVelX * dt;
      this.tungTungGroup.position.y += state.exitVelY * dt;
      this.tungTungGroup.rotation.z += 16 * dt;
      this.tungTungGroup.rotation.y += 12 * dt;
      this.tungTungGroup.scale.multiplyScalar(Math.max(0.92, 1 - 0.5 * dt));

      if (this.tungTungGroup.position.y > playerY + 18) {
        state.active = false;
        this.tungTungGroup.visible = false;
      }
    }
  }

  // Set Smurf Cat Aura on Cube
  setSmurfCatAura(enabled) {
    this.smurfCatAuraActive = enabled;
    if (this.smurfCatHalo) {
      this.smurfCatHalo.visible = enabled || (this.currentAccessory === 'halo');
    }
  }

  // Set Meme Accessory on Player Cube (mushroom, crown, shades, halo, none)
  setMemeAccessory(name) {
    this.currentAccessory = name;
    if (this.smurfCatHalo) this.smurfCatHalo.visible = (name === 'halo' || this.smurfCatAuraActive);
    if (this.mushroomCap) this.mushroomCap.visible = (name === 'mushroom');
    if (this.goldenCrown) this.goldenCrown.visible = (name === 'crown');
    if (this.gigachadShades) this.gigachadShades.visible = (name === 'shades');
  }

  // Dynamically change local player's cube color
  setPlayerColor(colorHex) {
    if (this.cubeBody && this.cubeBody.material) {
      this.cubeBody.material.color.set(colorHex);
      this.cubeBody.material.emissive.set(colorHex);
      this.cubeBody.material.emissiveIntensity = 0.35;
    }
  }

  // Convert 3D world coordinates to 2D screen coordinates
  toScreenPosition(worldX, worldY, worldZ = 0) {
    const vector = new THREE.Vector3(worldX, worldY, worldZ);
    vector.project(this.camera);
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    return {
      x: (vector.x * 0.5 + 0.5) * width,
      y: (-(vector.y * 0.5) + 0.5) * height
    };
  }

  // Spawn Comic Book Floating Text Popup
  triggerComicHitText(worldX, worldY, text, color = "#FFD000") {
    const screenPos = this.toScreenPosition(worldX, worldY, 0.4);
    const popup = document.createElement('div');
    popup.className = 'comic-hit-popup';
    popup.textContent = text;
    popup.style.left = `${screenPos.x}px`;
    popup.style.top = `${screenPos.y}px`;
    popup.style.color = color;

    // Random rotation tilt for cartoon feel
    const tilt = (Math.random() - 0.5) * 28;
    popup.style.transform = `translate(-50%, -50%) rotate(${tilt}deg)`;

    document.body.appendChild(popup);
    setTimeout(() => {
      if (popup.parentNode) popup.parentNode.removeChild(popup);
    }, 700);
  }

  onWindowResize() {
    if (!this.renderer || !this.camera || !this.container) return;
    const width = window.visualViewport ? window.visualViewport.width : (this.container.clientWidth || window.innerWidth);
    const height = window.visualViewport ? window.visualViewport.height : (this.container.clientHeight || window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }
}
