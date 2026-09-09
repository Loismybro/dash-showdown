// levels.js - Expanded Iconic Themed Tracks with Rhythm Alignment, Themed Assets & Collectible Gems
// 100% human-clearing geometry, zero ghost collisions, generous clearances, and rewarding gem paths.

export const LEVEL_DATA = [
  {
    id: 1,
    name: "Gothic Castle",
    themeType: "gothic",
    difficulty: "Hard",
    diffStars: "4★",
    diffColor: "#FF0055",
    bpm: 142,
    theme: 1,
    speed: 11.0,
    endX: 420,
    defaultVehicle: "cube",
    desc: "Haunting gothic fortress! Creepy pipe organ music, battlement rampart stairs, boiling brimstone lava moats, and high-lift aero fans.",
    obstacles: [
      // ═════════════════════════════════════════════════════════════════
      // ACT I: COURTYARD ENTRANCE & BATTLEMENT RAMPARTS (x: 0 – 90)
      // ═════════════════════════════════════════════════════════════════
      // Intro Courtyard Warmup Spike
      { type: "spike", x: 26, y: 0, dir: "up" },

      // 🪜 Gothic Rampart Ascending Stairs (Smooth step-up to Y=1.5)
      { type: "stairs", x: 34, y: 0, steps: 3, stepW: 1.2, stepH: 0.5, dir: "up", subType: "gothic" },
      { type: "block",  x: 37.6, y: 0, w: 5.0, h: 1.5 },
      { type: "gem",    x: 40.0, y: 3.2, subType: "ruby", color: 0xff0055, value: 100 },
      // Descending Stairs back to courtyard
      { type: "stairs", x: 42.6, y: 0, steps: 3, stepW: 1.2, stepH: 0.5, dir: "down", subType: "gothic" },

      // 🌪️ Castle Brimstone Moat Aero Fan Launch over Boiling Lava Lake
      { type: "fan",    x: 47.5, y: 0, w: 3.2, height: 8.0, liftForce: 130.0, maxLiftVy: 17.5, subType: "magma" },
      // 🌋 Molten Lava Lake across the chasm
      { type: "lava",   x: 50.0, y: 0, w: 9.0, h: 0.8 },
      { type: "gem",    x: 54.0, y: 5.5, subType: "ruby", color: 0xff0055, value: 100 },
      // High Battlement Landing
      { type: "block",  x: 58.0, y: 0, w: 10.0, h: 2.5 },
      { type: "spike",  x: 65.0, y: 2.5, dir: "up" },

      // Moat drop & double obsidian spikes
      { type: "spike",  x: 74.0, y: 0, dir: "up" },
      { type: "spike",  x: 76.5, y: 0, dir: "up" },

      // ═════════════════════════════════════════════════════════════════
      // ACT II: GARGOYLE TOWER & CATHEDRAL CRYPT (x: 90 – 210)
      // ═════════════════════════════════════════════════════════════════
      // 🪜 Gargoyle Tower Stepped Ascent
      { type: "stairs", x: 84.0, y: 0, steps: 4, stepW: 1.2, stepH: 0.6, dir: "up", subType: "gothic" },
      { type: "pad",    x: 89.5, y: 2.4, subType: "yellow" }, // Launches over double moat!
      // 🌋 Boiling Magma Chasm with mid-air save orb
      { type: "lava",   x: 93.0, y: 0, w: 12.0, h: 0.8 },
      { type: "orb",    x: 98.5, y: 5.0, subType: "yellow" },
      { type: "gem",    x: 98.5, y: 6.2, subType: "ruby", color: 0xff0055, value: 100 },
      // 🌋 Floating Volcanic Basalt Stepping Platform
      { type: "lava_crust", x: 104.0, y: 0, w: 7.0, h: 2.0 },
      // 🌋 Active Magma Bubble Hazard Block
      { type: "lava_bubble", x: 117.0, y: 0, w: 2.2, h: 1.4 },

      // Cathedral Interior - Rhythm Spikes & Energy Shield
      { type: "spike",  x: 128.0, y: 0, dir: "up" },
      { type: "shield", x: 136.0, y: 2.5 },
      { type: "lava_crystal", x: 143.0, y: 0, dir: "up" },

      // Crypt Chandelier Launch & High Crypt Rafters
      { type: "pad",    x: 152.0, y: 0, subType: "yellow" },
      { type: "block",  x: 156.0, y: 0, w: 12.0, h: 2.5 },
      { type: "spike",  x: 165.0, y: 2.5, dir: "up" },

      // Blood Orb Chains across Magma Rift
      { type: "lava",   x: 172.0, y: 0, w: 16.0, h: 0.8 },
      { type: "orb",    x: 176.0, y: 3.0, subType: "yellow" },
      { type: "orb",    x: 183.0, y: 3.5, subType: "yellow" },
      { type: "gem",    x: 183.0, y: 5.2, subType: "ruby", color: 0xff0055, value: 100 },
      { type: "lava_crust", x: 190.0, y: 0, w: 8.0, h: 2.0 },

      // ═════════════════════════════════════════════════════════════════
      // ACT III: GRAND BELFRY DROP & ORGAN SOLO (x: 210 – 320)
      // ═════════════════════════════════════════════════════════════════
      // 🌪️ Castle Belfry Aero Fan Launch (Drop / Organ Solo!)
      { type: "fan",    x: 204.0, y: 2.0, w: 3.2, height: 8.5, liftForce: 125.0, maxLiftVy: 17.5, subType: "magma" },
      // Stepped Belfry Descent
      { type: "stairs", x: 216.0, y: 0, steps: 3, stepW: 1.2, stepH: 0.5, dir: "down", subType: "gothic" },

      // Flying Belfry Stepped Pyramids
      { type: "stairs", x: 228.0, y: 0, steps: 3, stepW: 1.2, stepH: 0.5, dir: "up", subType: "gothic" },
      { type: "block",  x: 231.6, y: 0, w: 6.0, h: 1.5 },
      { type: "orb",    x: 242.0, y: 3.2, subType: "yellow" },
      { type: "lava_crystal", x: 241.0, y: 0, dir: "up" },
      { type: "block",  x: 246.0, y: 0, w: 6.0, h: 1.5 },

      // High Gothic Spires into Speed Gate 2x
      { type: "lava_crystal", x: 258.0, y: 0, dir: "up" },
      { type: "speed_gate",   x: 266.0, y: 0, speedMult: 2.0 },
      { type: "pad",    x: 272.0, y: 0, subType: "yellow" },
      { type: "block",  x: 277.0, y: 0, w: 7.0, h: 2.5 },
      { type: "gem",    x: 280.0, y: 4.8, subType: "ruby", color: 0xff0055, value: 100 },
      { type: "spike",  x: 286.0, y: 0, dir: "up" },
      { type: "block",  x: 290.0, y: 0, w: 6.0, h: 1.5 },

      // ═════════════════════════════════════════════════════════════════
      // ACT IV: ROYAL THRONE ROOM FINISH (x: 320 – 420)
      // ═════════════════════════════════════════════════════════════════
      // 🪜 Throne Room Grand Stairs
      { type: "stairs", x: 308.0, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "up", subType: "gothic" },
      { type: "block",  x: 312.8, y: 0, w: 7.0, h: 2.0 },
      { type: "spike",  x: 318.0, y: 2.0, dir: "up" },

      // 🌪️ Final Royal Brimstone Aero Fan over Boiling Lava River
      { type: "fan",    x: 326.0, y: 0, w: 3.2, height: 8.5, liftForce: 125.0, maxLiftVy: 17.5, subType: "magma" },
      { type: "lava",   x: 329.0, y: 0, w: 14.0, h: 0.8 },
      { type: "lava_crust", x: 343.0, y: 0, w: 10.0, h: 1.5 }
      // High-Power 3D Inductor Coil Transition Gate awaits at endX: 420!
    ]
  },

  {
    id: 2,
    name: "Fairyland",
    themeType: "fairyland",
    difficulty: "Easy",
    diffStars: "1★",
    diffColor: "#00FF88",
    bpm: 128,
    theme: 2,
    speed: 10.2,
    endX: 390,
    defaultVehicle: "cube",
    desc: "Enchanted dream kingdom! Rainbow crystal stairs, celestial blossom aero fans, bubbling pastel magma pools, and emerald gems.",
    obstacles: [
      // ═════════════════════════════════════════════════════════════════
      // ACT I: PASTEL ENCHANTED GARDEN (x: 0 – 80)
      // ═════════════════════════════════════════════════════════════════
      // 🪜 Rainbow Flower Crystal Stairs
      { type: "stairs", x: 22.0, y: 0, steps: 3, stepW: 1.2, stepH: 0.4, dir: "up", subType: "fairyland" },
      { type: "block",  x: 25.6, y: 0, w: 5.0, h: 1.2 },
      { type: "gem",    x: 28.0, y: 2.8, subType: "emerald", color: 0x00ff88, value: 100 },

      // 🌪️ Fairy Starlight Aero Fan Updraft
      { type: "fan",    x: 34.0, y: 0, w: 3.0, height: 7.5, liftForce: 105.0, maxLiftVy: 16.0, subType: "emerald" },
      { type: "spike",  x: 40.0, y: 0, dir: "up" },
      { type: "pad",    x: 45.0, y: 0, subType: "pink" }, // Gentle mushroom bounce

      // 🌋 Prismatic Bubble Magma Basin with floating floral crust
      { type: "lava",   x: 50.0, y: 0, w: 10.0, h: 0.8 },
      { type: "lava_crust", x: 54.0, y: 0, w: 3.5, h: 1.2 },
      { type: "gem",    x: 55.7, y: 3.2, subType: "emerald", color: 0x00ff88, value: 100 },

      // 🌪️ Celestial Blossom Aero Fan into Gravity Flip Pad!
      { type: "fan",    x: 68.0, y: 0, w: 3.2, height: 8.5, liftForce: 120.0, maxLiftVy: 17.5, subType: "emerald" },
      // Floor Y=0, Ceiling Y=9.0
      { type: "pad",    x: 74.0, y: 0, subType: "blue" }, // Launches smoothly up to pastel sky canopy!

      // ═════════════════════════════════════════════════════════════════
      // ACT II: INVERTED STARRY CANOPY (x: 80 – 170)
      // ═════════════════════════════════════════════════════════════════
      // Inverted ceiling hazards (Y=9)
      { type: "spike",  x: 88.0, y: 9, dir: "down" },
      { type: "spike",  x: 98.0, y: 9, dir: "down" },
      { type: "gem",    x: 103.0, y: 7.2, subType: "emerald", color: 0x00ff88, value: 100 },

      // 🪜 Inverted Ceiling Blossom Stairs
      { type: "stairs", x: 108.0, y: 9.0, steps: 3, stepW: 1.2, stepH: 0.5, dir: "down", subType: "fairyland" },
      { type: "block",  x: 111.6, y: 7.5, w: 6.0, h: 1.5 },
      { type: "spike",  x: 122.0, y: 9, dir: "down" },

      // Pink Gravity Orb on Ceiling
      { type: "orb",    x: 132.0, y: 6.8, subType: "pink" },
      { type: "spike",  x: 132.0, y: 9, dir: "down" },
      { type: "block",  x: 137.0, y: 7.0, w: 7.0, h: 2.0 },

      // Flip back to floor!
      { type: "pad",    x: 152.0, y: 9, subType: "blue" },
      // 🌋 Active fairy magma bubble block on floor drop
      { type: "lava_bubble", x: 166.0, y: 0, w: 2.2, h: 1.4 },

      // ═════════════════════════════════════════════════════════════════
      // ACT III: FAIRY QUEEN'S MEADOW & UFO FLIGHT (x: 170 – 300)
      // ═════════════════════════════════════════════════════════════════
      // 🪜 Stepped Meadow Pyramid Stairs
      { type: "stairs", x: 178.0, y: 0, steps: 3, stepW: 1.2, stepH: 0.5, dir: "up", subType: "fairyland" },
      { type: "block",  x: 181.6, y: 0, w: 7.0, h: 1.5 },
      { type: "gem",    x: 185.0, y: 3.5, subType: "emerald", color: 0x00ff88, value: 100 },
      { type: "stairs", x: 188.6, y: 0, steps: 3, stepW: 1.2, stepH: 0.5, dir: "down", subType: "fairyland" },

      // Floating Petal Orbs
      { type: "spike",  x: 202.0, y: 0, dir: "up" },
      { type: "orb",    x: 202.0, y: 2.6, subType: "yellow" },
      { type: "spike",  x: 209.0, y: 0, dir: "up" },
      { type: "orb",    x: 209.0, y: 2.8, subType: "yellow" },
      { type: "block",  x: 215.0, y: 0, w: 8.0, h: 1.5 },

      // 🛸 Fairy Starlight UFO Flight
      { type: "portal", x: 232.0, y: 3.0, subType: "ufo" },
      { type: "shield", x: 244.0, y: 4.5 },
      // 🌪️ Starlight Blossom Aero Fan lifting UFO through celestial arches
      { type: "fan",    x: 252.0, y: 0, w: 3.2, height: 8.0, liftForce: 105.0, subType: "emerald" },
      { type: "spike",  x: 262.0, y: 0, dir: "up" },
      { type: "spike",  x: 262.0, y: 9, dir: "down" },
      { type: "portal", x: 275.0, y: 3.5, subType: "cube" },

      // ═════════════════════════════════════════════════════════════════
      // ACT IV: STARLIGHT MEADOW SPRINT (x: 300 – 390)
      // ═════════════════════════════════════════════════════════════════
      { type: "stairs", x: 286.0, y: 0, steps: 3, stepW: 1.2, stepH: 0.5, dir: "up", subType: "fairyland" },
      { type: "block",  x: 289.6, y: 0, w: 8.0, h: 1.5 },
      { type: "gem",    x: 293.0, y: 3.5, subType: "emerald", color: 0x00ff88, value: 100 },
      { type: "stairs", x: 297.6, y: 0, steps: 3, stepW: 1.2, stepH: 0.5, dir: "down", subType: "fairyland" },

      // Final Blossom Fan over sparkling fairy lava pool
      { type: "fan",    x: 308.0, y: 0, w: 3.2, height: 8.0, liftForce: 115.0, subType: "emerald" },
      { type: "lava",   x: 312.0, y: 0, w: 10.0, h: 0.8 },
      { type: "lava_crust", x: 322.0, y: 0, w: 8.0, h: 1.5 },
      { type: "spike",  x: 338.0, y: 0, dir: "up" }
    ]
  },

  {
    id: 3,
    name: "Hungry Shark",
    themeType: "shark",
    difficulty: "Normal",
    diffStars: "2★",
    diffColor: "#00E5FF",
    bpm: 135,
    theme: 3,
    speed: 10.8,
    endX: 450,
    defaultVehicle: "cube",
    desc: "Deep ocean trench! Sunken Atlantean temple stairs, boiling hydrothermal vent aero fans, abyssal volcanic trenches, and submarine flight.",
    obstacles: [
      // ═════════════════════════════════════════════════════════════════
      // ACT I: SUNKEN ATLANTEAN TEMPLE ENTRANCE (x: 0 – 60)
      // ═════════════════════════════════════════════════════════════════
      // 🪜 Sunken Temple Stepped Coral Stairs (Ascent to Y=2.0)
      { type: "stairs", x: 18.0, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "up", subType: "shark" },
      { type: "block",  x: 22.8, y: 0, w: 6.0, h: 2.0 },
      { type: "gem",    x: 25.5, y: 3.8, subType: "sapphire", color: 0x00e5ff, value: 100 },

      // 🌪️ Boiling Seabed Hydrothermal Vent Aero Fan
      { type: "fan",    x: 31.0, y: 0, w: 3.2, height: 8.5, liftForce: 120.0, maxLiftVy: 17.5, subType: "turbo" },
      // --- SUBMARINE JET PORTAL (GREEN) ---
      { type: "portal", x: 38.0, y: 3.0, subType: "ship" },

      // ═════════════════════════════════════════════════════════════════
      // ACT II: CORAL CAVERN & ABYSSAL VOLCANIC TRENCH (x: 60 – 200)
      // ═════════════════════════════════════════════════════════════════
      // Coral Cavern Section (Floor Y=0, Ceiling Y=10)
      { type: "spike",  x: 52.0, y: 0, dir: "up" },
      { type: "spike",  x: 62.0, y: 10, dir: "down" },

      // 🌋 Boiling Seabed Volcanic Rift with Hydrothermal Aero Fan
      { type: "lava",   x: 68.0, y: 0, w: 14.0, h: 0.8 },
      { type: "fan",    x: 72.0, y: 0, w: 3.5, height: 9.0, liftForce: 125.0, subType: "turbo" },

      // Sunken Temple Gate 1: High ceiling gate (fly under - 6.0 units clearance)
      { type: "block",  x: 88.0, y: 6.0, w: 5.0, h: 4.0 },
      { type: "spike",  x: 90.5, y: 6.0, dir: "down" },
      { type: "gem",    x: 90.5, y: 3.0, subType: "sapphire", color: 0x00e5ff, value: 100 },

      // Sunken Temple Gate 2: Low floor gate (fly over - 6.0 units clearance)
      { type: "block",  x: 108.0, y: 0, w: 5.0, h: 4.0 },
      { type: "spike",  x: 110.5, y: 4.0, dir: "up" },
      { type: "gem",    x: 110.5, y: 7.0, subType: "sapphire", color: 0x00e5ff, value: 100 },

      // Deep Abyssal Trench Slalom & Energy Shield
      { type: "shield", x: 120.0, y: 5.0 },
      { type: "block",  x: 130.0, y: 3.5, w: 5.0, h: 3.0 },
      { type: "spike",  x: 132.5, y: 3.5, dir: "down" },
      { type: "spike",  x: 132.5, y: 6.5, dir: "up" },

      // 🌋 Active Hydrothermal Magma Vent Block
      { type: "lava_bubble", x: 142.0, y: 0, w: 2.2, h: 1.4 },

      // Wide Hydrothermal Vent Corridor (Y=2.0 to Y=8.0 -> 6.0 units clear tunnel!)
      { type: "block",  x: 152.0, y: 0, w: 20.0, h: 2.0 },
      { type: "block",  x: 152.0, y: 8.0, w: 20.0, h: 2.0 },
      { type: "spike",  x: 159.0, y: 2.0, dir: "up" },
      { type: "spike",  x: 167.0, y: 8.0, dir: "down" },
      { type: "gem",    x: 163.0, y: 5.0, subType: "sapphire", color: 0x00e5ff, value: 100 },

      // Predator Teeth & Speed Surge
      { type: "spike",  x: 182.0, y: 0, dir: "up" },
      { type: "spike",  x: 190.0, y: 10, dir: "down" },
      { type: "speed_gate", x: 196.0, y: 0, speedMult: 2.0 },

      // ═════════════════════════════════════════════════════════════════
      // ACT III: GOLD RUSH INVERTED FLIGHT & MEGALODON (x: 200 – 340)
      // ═════════════════════════════════════════════════════════════════
      { type: "portal", x: 202.0, y: 5.0, subType: "gravity_up" }, // Inverted flight!
      { type: "spike",  x: 214.0, y: 10, dir: "down" },
      { type: "block",  x: 224.0, y: 0, w: 5.0, h: 4.0 },
      { type: "spike",  x: 226.5, y: 4.0, dir: "up" },
      { type: "gem",    x: 226.5, y: 7.5, subType: "sapphire", color: 0x00e5ff, value: 100 },
      { type: "block",  x: 246.0, y: 6.0, w: 5.0, h: 4.0 },
      { type: "spike",  x: 248.5, y: 6.0, dir: "down" },

      // Return to Normal Gravity
      { type: "portal", x: 266.0, y: 5.0, subType: "gravity_down" },
      { type: "block",  x: 280.0, y: 0, w: 4.0, h: 3.0 },
      { type: "block",  x: 296.0, y: 7.0, w: 4.0, h: 3.0 },
      { type: "block",  x: 312.0, y: 0, w: 4.0, h: 3.0 },

      // Cube Return Portal
      { type: "portal", x: 330.0, y: 4.0, subType: "cube" },

      // ═════════════════════════════════════════════════════════════════
      // ACT IV: SUNKEN TEMPLE VICTORY PYRAMID (x: 340 – 450)
      // ═════════════════════════════════════════════════════════════════
      // 🪜 Final Sunken Temple Stepped Pyramid Stairs
      { type: "stairs", x: 342.0, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "up", subType: "shark" },
      { type: "block",  x: 346.8, y: 0, w: 6.0, h: 2.0 },
      { type: "stairs", x: 352.8, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "down", subType: "shark" },
      // 🌪️ Oceanic Geyser Fan launching over final volcanic trench
      { type: "fan",    x: 362.0, y: 0, w: 3.2, height: 8.0, liftForce: 120.0, subType: "turbo" },
      { type: "lava",   x: 366.0, y: 0, w: 12.0, h: 0.8 },
      { type: "lava_crust", x: 378.0, y: 0, w: 8.0, h: 1.5 },
      { type: "spike",  x: 395.0, y: 0, dir: "up" }
    ]
  },

  {
    id: 4,
    name: "Cyber Matrix",
    themeType: "cyber",
    difficulty: "Demon",
    diffStars: "6★",
    diffColor: "#D500F9",
    bpm: 152,
    theme: 4,
    speed: 12.0,
    endX: 470,
    defaultVehicle: "cube",
    desc: "Supersonic neo-Tokyo cyberspace! Rhythmic cyber stairs, turbo aero fans, molten cyber plasma basins, and quantum wave zigzags.",
    obstacles: [
      // ═════════════════════════════════════════════════════════════════
      // ACT I: NEO-TOKYO CYBER GATEWAY & TURBINE LAUNCH (x: 0 – 58)
      // ═════════════════════════════════════════════════════════════════
      // 🪜 Neo-Tokyo Skyscraper Ascent: Smooth 3-step stairs to server deck
      { type: "stairs", x: 18.0, y: 0, steps: 3, stepW: 1.2, stepH: 0.5, dir: "up", subType: "cyber" },
      { type: "block",  x: 21.6, y: 0, w: 6.0, h: 1.5 },
      { type: "gem",    x: 24.6, y: 3.2, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "stairs", x: 27.6, y: 0, steps: 3, stepW: 1.2, stepH: 0.5, dir: "down", subType: "cyber" },

      // 🌋 Molten Cyber Core Plasma Trench with Safe Floating Data Crust
      { type: "lava",   x: 32.0, y: 0, w: 10.0, h: 0.8 },
      { type: "lava_crust", x: 35.5, y: 0, w: 3.5, h: 1.2 },

      // 🌪️ Turbo Turbine Aero Fan soaring onto high data highway into Wave Portal
      { type: "fan",    x: 43.0, y: 0, w: 3.2, height: 8.5, liftForce: 125.0, subType: "turbo" },
      { type: "block",  x: 48.0, y: 0, w: 8.0, h: 3.5 },
      { type: "gem",    x: 52.0, y: 5.5, subType: "amethyst", color: 0xd500f9, value: 100 },

      // Launch into First Quantum Wave Portal
      { type: "portal", x: 57.0, y: 4.0, subType: "wave" },

      // ═════════════════════════════════════════════════════════════════
      // ACT II: QUANTUM WAVE CORRIDOR & PLASMA CHANNEL (x: 58 – 148)
      // ═════════════════════════════════════════════════════════════════
      // Wave Corridor 1: 45-degree rhythmic zigzag slopes (Clear 4.0 vertical tunnel)
      { type: "block",  x: 66.0, y: 0, w: 6.0, h: 2.5 },
      { type: "block",  x: 74.0, y: 6.5, w: 6.0, h: 3.5 },
      { type: "gem",    x: 77.0, y: 4.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "block",  x: 84.0, y: 0, w: 6.0, h: 2.5 },
      { type: "block",  x: 92.0, y: 6.5, w: 6.0, h: 3.5 },

      // 🌋 Molten Cyber Core Trench with Wave Aero Boost Updraft
      { type: "lava",   x: 100.0, y: 0, w: 16.0, h: 0.8 },
      { type: "fan",    x: 105.0, y: 0, w: 3.2, height: 7.5, liftForce: 110.0, subType: "turbo" },
      { type: "spike",  x: 112.0, y: 10.0, dir: "down" },

      // Precision Cyber Shards & Hazard Bubble
      { type: "lava_crystal", x: 120.0, y: 0 },
      { type: "spike",  x: 120.0, y: 10.0, dir: "down" },
      { type: "lava_bubble",  x: 128.0, y: 0, w: 2.2, h: 1.4 },

      // Center Diamond Gate with Gem
      { type: "block",  x: 135.0, y: 3.5, w: 6.0, h: 3.0 },
      { type: "gem",    x: 138.0, y: 8.0, subType: "amethyst", color: 0xd500f9, value: 100 },

      // Cube Reversion Portal
      { type: "portal", x: 148.0, y: 4.0, subType: "cube" },

      // ═════════════════════════════════════════════════════════════════
      // ACT III: CYBER STAIRWAYS & INVERTED GRAVITY DECK (x: 149 – 232)
      // ═════════════════════════════════════════════════════════════════
      // 🪜 Multi-tier Cyber Step Pyramid
      { type: "stairs", x: 154.0, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "up", subType: "cyber" },
      { type: "block",  x: 158.8, y: 0, w: 8.0, h: 2.0 },
      { type: "stairs", x: 166.8, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "down", subType: "cyber" },

      // 🌋 Molten Trench crossed by jumping onto a floating data server crust
      { type: "lava",   x: 172.0, y: 0, w: 12.0, h: 0.8 },
      { type: "lava_crust", x: 176.0, y: 0, w: 4.0, h: 1.4 },

      // Blue Gravity Pad into Inverted Ceiling Sprint
      { type: "pad",    x: 186.0, y: 0, subType: "blue" },
      { type: "spike",  x: 198.0, y: 10.0, dir: "down" },
      { type: "spike",  x: 208.0, y: 10.0, dir: "down" },
      { type: "gem",    x: 212.0, y: 7.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "pad",    x: 222.0, y: 10.0, subType: "blue" }, // Flip back to floor!

      // ═════════════════════════════════════════════════════════════════
      // ACT IV: DEMON DROP DUAL WAVE CLIMAX (x: 232 – 285)
      // ═════════════════════════════════════════════════════════════════
      { type: "portal", x: 232.0, y: 3.5, subType: "wave" },
      { type: "block",  x: 242.0, y: 0, w: 6.0, h: 3.0 },
      { type: "block",  x: 250.0, y: 6.0, w: 6.0, h: 4.0 },
      // Sub-floor molten channel with boiling bubble
      { type: "lava",   x: 258.0, y: 0, w: 14.0, h: 0.8 },
      { type: "lava_bubble", x: 262.0, y: 0, w: 2.2, h: 1.4 },
      { type: "block",  x: 268.0, y: 6.0, w: 6.0, h: 4.0 },
      { type: "gem",    x: 272.0, y: 3.5, subType: "amethyst", color: 0xd500f9, value: 100 },

      // Final Cube Victory Sprint
      { type: "portal", x: 280.0, y: 4.0, subType: "cube" },

      // ═════════════════════════════════════════════════════════════════
      // ACT V: GRAND CYBER VICTORY STAIRS & TURBINE OVERPASS (x: 286 – 470)
      // ═════════════════════════════════════════════════════════════════
      // 🪜 Grand Matrix Catwalk Stairs (5 steps up to Y=2.5)
      { type: "stairs", x: 288.0, y: 0, steps: 5, stepW: 1.2, stepH: 0.5, dir: "up", subType: "cyber" },
      { type: "block",  x: 294.0, y: 0, w: 10.0, h: 2.5 },
      { type: "stairs", x: 304.0, y: 0, steps: 5, stepW: 1.2, stepH: 0.5, dir: "down", subType: "cyber" },

      // 🌪️ High-Power Aero Turbine Fan launching over vast Molten Cyber Breach!
      { type: "fan",    x: 314.0, y: 0, w: 3.5, height: 9.5, liftForce: 130.0, subType: "turbo" },
      { type: "lava",   x: 318.0, y: 0, w: 24.0, h: 0.8 },
      // Tactical mid-breach floating server crust + shield pickup
      { type: "lava_crust", x: 328.0, y: 0, w: 4.5, h: 1.5 },
      { type: "shield", x: 330.2, y: 3.5 },
      { type: "lava_crystal", x: 338.0, y: 0 },

      // 🪜 Landing Stairs onto Final Cyber Causeway
      { type: "stairs", x: 346.0, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "up", subType: "cyber" },
      { type: "block",  x: 350.8, y: 0, w: 10.0, h: 2.0 },
      { type: "stairs", x: 360.8, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "down", subType: "cyber" },

      // 🌪️ High-Speed Wind Booster
      { type: "fan",    x: 370.0, y: 0, w: 3.2, height: 8.5, liftForce: 125.0, subType: "turbo" },
      { type: "block",  x: 382.0, y: 3.5, w: 8.0, h: 1.5 },
      { type: "gem",    x: 386.0, y: 6.2, subType: "amethyst", color: 0xd500f9, value: 100 },

      // Twin lava bubbles warning before final sprint
      { type: "lava",   x: 396.0, y: 0, w: 12.0, h: 0.8 },
      { type: "lava_bubble", x: 400.0, y: 0, w: 2.2, h: 1.4 },

      // 🪜 Final Matrix Victory Staircase
      { type: "stairs", x: 412.0, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "up", subType: "cyber" },
      { type: "block",  x: 416.8, y: 0, w: 16.0, h: 2.0 },
      { type: "gem",    x: 424.0, y: 4.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "stairs", x: 432.8, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "down", subType: "cyber" },

      // Final supersonic dash to endX: 470
      { type: "speed_gate", x: 442.0, y: 0, speedMult: 2.0 },
      { type: "fan",    x: 448.0, y: 0, w: 3.5, height: 8.5, liftForce: 130.0, subType: "turbo" },
      { type: "lava",   x: 452.0, y: 0, w: 10.0, h: 0.8 }
    ]
  },

  {
    id: 5,
    name: "Cyber Matrix: Overdrive",
    themeType: "cyber",
    difficulty: "Extreme Demon",
    diffStars: "8★",
    diffColor: "#FF0055",
    bpm: 160,
    theme: 4,
    speed: 12.0,
    baseSpeed: 12.0,
    endX: 1520,
    hasBoss: true,
    bossTriggerX: 760,
    defaultVehicle: "cube",
    desc: "1500+ UNIT MULTI-ACT MEGA MAP! UFO mode flight, 3x Speed Gates, and the terrifying Boss Raid against V.E.X.O.R. Quantum Core!",
    obstacles: [
      // ═════════════════════════════════════════════════════════════════
      // ACT I: THE INFILTRATION (x: 0 – 380) - Neon Approach & UFO Hop
      // ═════════════════════════════════════════════════════════════════
      // 🪜 Neo-Tokyo Skyscraper Ascent: Smooth 4-step stairs to rampart deck
      { type: "stairs", x: 22.0, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "up", subType: "cyber" },
      { type: "block",  x: 26.8, y: 0, w: 8.0, h: 2.0 },
      { type: "gem",    x: 30.8, y: 3.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "stairs", x: 34.8, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "down", subType: "cyber" },

      // 🌋 Molten Cooling Conduit with Safe Floating Server Crust
      { type: "lava",   x: 42.0, y: 0, w: 12.0, h: 0.8 },
      { type: "lava_crust", x: 46.0, y: 0, w: 4.0, h: 1.2 },

      // 🌪️ High-Velocity Turbine Aero Fan launching onto elevated power rail
      { type: "fan",    x: 58.0, y: 0, w: 3.2, height: 8.5, liftForce: 125.0, subType: "turbo" },
      { type: "block",  x: 64.0, y: 0, w: 8.0, h: 3.0 },
      { type: "stairs", x: 72.0, y: 0, steps: 3, stepW: 1.2, stepH: 0.5, dir: "down", subType: "cyber" },

      // 🌪️ Launch Aero Fan into First UFO Portal
      { type: "fan",    x: 84.0, y: 0, w: 3.2, height: 8.5, liftForce: 125.0, subType: "turbo" },
      { type: "lava_crystal", x: 92.0, y: 0 },

      // 🛸 UFO PORTAL: First Anti-Gravity Hop Flight Zone
      { type: "portal", x: 100.0, y: 3.5, subType: "ufo" },
      // Floating laser maze: weave over floor blocks and under ceiling obstacles
      { type: "block",  x: 114.0, y: 0, w: 6.0, h: 2.0 },
      { type: "block",  x: 114.0, y: 7.0, w: 6.0, h: 3.0 },
      { type: "gem",    x: 117.0, y: 4.5, subType: "amethyst", color: 0xd500f9, value: 100 },

      // 🌋 Molten Core Plasma Channel in UFO Chamber
      { type: "lava",   x: 124.0, y: 0, w: 24.0, h: 0.8 },
      { type: "lava_bubble", x: 128.0, y: 0, w: 2.2, h: 1.4 },
      { type: "fan",    x: 136.0, y: 0, w: 3.5, height: 7.5, liftForce: 100.0, subType: "turbo" },

      { type: "block",  x: 148.0, y: 0, w: 8.0, h: 2.5 },
      { type: "block",  x: 156.0, y: 6.5, w: 8.0, h: 3.5 },
      { type: "gem",    x: 160.0, y: 3.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "orb",    x: 172.0, y: 4.5, subType: "pink" },

      // 🛡️ Collectible Shield Pickup in Act I
      { type: "shield", x: 188.0, y: 4.2 },
      { type: "lava_crystal", x: 202.0, y: 0 },
      { type: "spike",  x: 202.0, y: 10.0, dir: "down" },

      // Revert to Cube Mode
      { type: "portal", x: 220.0, y: 4.0, subType: "cube" },
      // 🪜 Stepped rampart landing
      { type: "stairs", x: 226.0, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "up", subType: "cyber" },
      { type: "block",  x: 230.8, y: 0, w: 8.0, h: 2.0 },
      { type: "stairs", x: 238.8, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "down", subType: "cyber" },

      // 🌪️ Turbine Fan boosting to Blue Gravity Pad
      { type: "fan",    x: 248.0, y: 0, w: 3.2, height: 8.0, liftForce: 120.0, subType: "turbo" },
      // Blue Gravity Pad to Ceiling
      { type: "pad",    x: 258.0, y: 0, subType: "blue" },
      { type: "spike",  x: 272.0, y: 10.0, dir: "down" },
      { type: "spike",  x: 284.0, y: 10.0, dir: "down" },
      { type: "gem",    x: 290.0, y: 7.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "pad",    x: 304.0, y: 10.0, subType: "blue" }, // Flip back down

      // 🪜 Grand Overdrive Stairs Ascent
      { type: "stairs", x: 312.0, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "up", subType: "cyber" },
      { type: "block",  x: 316.8, y: 0, w: 10.0, h: 2.0 },
      { type: "stairs", x: 326.8, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "down", subType: "cyber" },

      // 🌋 Molten Trench before Speed Gate
      { type: "lava",   x: 336.0, y: 0, w: 16.0, h: 0.8 },
      { type: "lava_crust", x: 342.0, y: 0, w: 4.0, h: 1.4 },

      // 🌪️ Speed Booster Fan into 2x Gate
      { type: "fan",    x: 356.0, y: 0, w: 3.5, height: 8.5, liftForce: 125.0, subType: "turbo" },
      { type: "block",  x: 364.0, y: 0, w: 8.0, h: 1.5 },

      // ⚡ SPEED GATE 2x (Enters The Quantum Descent)
      { type: "speed_gate", x: 375.0, y: 0, speedMult: 2.0 },

      // ═════════════════════════════════════════════════════════════════
      // ACT II: THE QUANTUM DESCENT (x: 380 – 760) - 2x Speed Wave & Ship
      // ═════════════════════════════════════════════════════════════════
      { type: "portal", x: 395.0, y: 4.0, subType: "wave" },
      // Supersonic 45-degree wave zigzags
      { type: "block",  x: 412.0, y: 0, w: 8.0, h: 3.0 },
      { type: "block",  x: 424.0, y: 6.5, w: 8.0, h: 3.5 },
      { type: "gem",    x: 428.0, y: 4.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "block",  x: 440.0, y: 0, w: 8.0, h: 3.0 },
      { type: "block",  x: 452.0, y: 6.5, w: 8.0, h: 3.5 },

      // 🌋 Molten Plasma Basin in Wave Chamber
      { type: "lava",   x: 462.0, y: 0, w: 24.0, h: 0.8 },
      { type: "fan",    x: 470.0, y: 0, w: 3.2, height: 7.5, liftForce: 110.0, subType: "turbo" },
      { type: "lava_bubble", x: 480.0, y: 0, w: 2.2, h: 1.4 },
      { type: "block",  x: 494.0, y: 3.5, w: 6.0, h: 3.0 },

      // 🚀 Jet Fighter Ship Portal (Supersonic flight corridor)
      { type: "portal", x: 515.0, y: 5.0, subType: "ship" },
      // 🌋 Volcanic reactor floor with hydrothermal jet vents
      { type: "lava",   x: 530.0, y: 0, w: 30.0, h: 0.8 },
      { type: "lava_crystal", x: 545.0, y: 0 },
      { type: "spike",  x: 548.0, y: 10.0, dir: "down" },
      { type: "gem",    x: 560.0, y: 5.0, subType: "amethyst", color: 0xd500f9, value: 100 },

      // Shield pickup before intense laser gates
      { type: "shield", x: 575.0, y: 5.0 },
      { type: "block",  x: 595.0, y: 0, w: 6.0, h: 3.5 },
      { type: "block",  x: 610.0, y: 6.5, w: 6.0, h: 3.5 },
      { type: "fan",    x: 618.0, y: 0, w: 4.0, height: 8.5, liftForce: 100.0, subType: "turbo" },
      { type: "block",  x: 625.0, y: 0, w: 6.0, h: 3.5 },
      { type: "gem",    x: 640.0, y: 6.0, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "lava_bubble", x: 665.0, y: 0, w: 2.2, h: 1.4 },
      { type: "spike",  x: 675.0, y: 10.0, dir: "down" },

      // Cube Portal
      { type: "portal", x: 715.0, y: 4.0, subType: "cube" },
      // 🪜 Multi-tier Cyber Stairs into Boss Rampart
      { type: "stairs", x: 722.0, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "up", subType: "cyber" },
      { type: "block",  x: 726.8, y: 0, w: 8.0, h: 2.0 },
      { type: "stairs", x: 734.8, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "down", subType: "cyber" },

      // 🌪️ High-Speed Booster Fan over Molten Conduit into 3x Gate
      { type: "fan",    x: 742.0, y: 0, w: 3.5, height: 8.5, liftForce: 130.0, subType: "turbo" },
      { type: "lava",   x: 746.0, y: 0, w: 10.0, h: 0.8 },

      // ⚡ SPEED GATE 3x (Overdrive into Boss Arena)
      { type: "speed_gate", x: 752.0, y: 0, speedMult: 3.0 },

      // ═════════════════════════════════════════════════════════════════
      // ACT III: THE BOSS ARENA (x: 760 – 1220) - V.E.X.O.R. Boss Battle
      // ═════════════════════════════════════════════════════════════════
      // V.E.X.O.R. spawns at x: 760!
      // 🪜 Counter-turret rampart stairs
      { type: "stairs", x: 770.0, y: 0, steps: 3, stepW: 1.2, stepH: 0.5, dir: "up", subType: "cyber" },
      { type: "block",  x: 773.6, y: 0, w: 8.0, h: 1.5 },
      { type: "stairs", x: 785.0, y: 0, steps: 3, stepW: 1.2, stepH: 0.5, dir: "down", subType: "cyber" },

      // Strike VEXOR with Counter-Orb 1!
      { type: "counter_orb", x: 805.0, y: 3.2 },
      // 🌋 Reactor Cooling Channel with Safe Floating Server Crust
      { type: "lava",   x: 814.0, y: 0, w: 14.0, h: 0.8 },
      { type: "lava_crust", x: 818.0, y: 0, w: 4.0, h: 1.2 },

      // 🌪️ High Updraft Fan to reach Counter-Orb 2 in mid-air
      { type: "fan",    x: 834.0, y: 0, w: 3.5, height: 8.5, liftForce: 125.0, subType: "turbo" },
      { type: "counter_orb", x: 855.0, y: 4.5 },

      // 🪜 Mid-arena step platform
      { type: "stairs", x: 864.0, y: 0, steps: 3, stepW: 1.2, stepH: 0.5, dir: "up", subType: "cyber" },
      { type: "block",  x: 867.6, y: 0, w: 8.0, h: 1.5 },
      { type: "gem",    x: 872.0, y: 3.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "stairs", x: 878.0, y: 0, steps: 3, stepW: 1.2, stepH: 0.5, dir: "down", subType: "cyber" },
      { type: "lava",   x: 885.0, y: 0, w: 8.0, h: 0.8 },
      { type: "lava_bubble", x: 887.0, y: 0, w: 2.0, h: 1.2 },

      // UFO Portal: VEXOR Enters Phase 2 (Dual Crossfire Lasers)
      { type: "portal", x: 890.0, y: 4.0, subType: "ufo" },
      // 🌋 Molten floor breach with hydrothermal thermal fans
      { type: "lava",   x: 910.0, y: 0, w: 35.0, h: 0.8 },
      { type: "counter_orb", x: 920.0, y: 4.5 },
      { type: "fan",    x: 935.0, y: 0, w: 4.0, height: 8.0, liftForce: 105.0, subType: "turbo" },

      { type: "shield", x: 955.0, y: 4.5 }, // Emergency shield for chaotic crossfire
      { type: "lava_crust", x: 970.0, y: 0, w: 6.0, h: 1.5 },
      { type: "counter_orb", x: 980.0, y: 4.5 },

      { type: "block",  x: 1005.0, y: 0, w: 6.0, h: 2.0 },
      { type: "block",  x: 1005.0, y: 7.0, w: 6.0, h: 3.0 },
      { type: "fan",    x: 1020.0, y: 0, w: 3.5, height: 7.5, liftForce: 100.0, subType: "turbo" },
      { type: "counter_orb", x: 1035.0, y: 4.5 },

      // Return to Cube Mode: Phase 3 Meltdown!
      { type: "portal", x: 1065.0, y: 4.0, subType: "cube" },
      // 🪜 Meltdown Stairs
      { type: "stairs", x: 1072.0, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "up", subType: "cyber" },
      { type: "block",  x: 1076.8, y: 0, w: 8.0, h: 2.0 },
      { type: "stairs", x: 1086.0, y: 0, steps: 4, stepW: 1.2, stepH: 0.5, dir: "down", subType: "cyber" },

      { type: "lava",   x: 1098.0, y: 0, w: 14.0, h: 0.8 },
      { type: "lava_crust", x: 1102.0, y: 0, w: 4.0, h: 1.2 },
      { type: "counter_orb", x: 1110.0, y: 3.5 },

      { type: "pad",    x: 1125.0, y: 0, subType: "blue" }, // Flip to ceiling!
      { type: "spike",  x: 1145.0, y: 10.0, dir: "down" },
      // Final decisive blow to destroy VEXOR:
      { type: "counter_orb", x: 1165.0, y: 6.8 },
      { type: "pad",    x: 1185.0, y: 10.0, subType: "blue" }, // Flip back to floor!

      // 🌪️ High Updraft Fan launching over final crystal into Act IV
      { type: "fan",    x: 1198.0, y: 0, w: 3.5, height: 8.5, liftForce: 130.0, subType: "turbo" },
      { type: "lava",   x: 1206.0, y: 0, w: 14.0, h: 0.8 },
      { type: "lava_crystal", x: 1212.0, y: 0 },

      // ═════════════════════════════════════════════════════════════════
      // ACT IV: THE MELTDOWN ESCAPE & QUANTUM INDUCTOR WARP (x: 1220 – 1520)
      // ═════════════════════════════════════════════════════════════════
      // VEXOR destroyed! Core melts down! Maximum escape velocity!
      { type: "speed_gate", x: 1235.0, y: 0, speedMult: 4.0 }, // 4x Quantum Warp!

      // 🪜 Multi-tier Catwalk Escape Stairs
      { type: "stairs", x: 1250.0, y: 0, steps: 4, stepW: 1.4, stepH: 0.5, dir: "up", subType: "cyber" },
      { type: "block",  x: 1255.6, y: 0, w: 12.0, h: 2.0 },

      // 🌪️ Super Booster Aero Fan over massive reactor breach
      { type: "fan",    x: 1269.0, y: 0, w: 4.0, height: 9.0, liftForce: 140.0, subType: "turbo" },
      { type: "lava",   x: 1276.0, y: 0, w: 28.0, h: 0.8 },
      { type: "lava_bubble", x: 1284.0, y: 0, w: 2.5, h: 1.5 },
      { type: "lava_crust",  x: 1292.0, y: 0, w: 5.0, h: 1.5 },

      // 🪜 Landing Stairs onto second catwalk
      { type: "stairs", x: 1308.0, y: 0, steps: 4, stepW: 1.4, stepH: 0.5, dir: "up", subType: "cyber" },
      { type: "block",  x: 1313.6, y: 0, w: 14.0, h: 2.0 },
      { type: "gem",    x: 1320.0, y: 4.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "stairs", x: 1329.0, y: 0, steps: 4, stepW: 1.4, stepH: 0.5, dir: "down", subType: "cyber" },

      // 🌪️ Aero Booster Fan over molten plasma channel
      { type: "fan",    x: 1342.0, y: 0, w: 4.0, height: 9.0, liftForce: 135.0, subType: "turbo" },
      { type: "lava",   x: 1350.0, y: 0, w: 24.0, h: 0.8 },
      { type: "lava_crystal", x: 1362.0, y: 0 },

      // 🪜 Stepped Pyramid Stairs
      { type: "stairs", x: 1378.0, y: 0, steps: 4, stepW: 1.4, stepH: 0.5, dir: "up", subType: "cyber" },
      { type: "block",  x: 1383.6, y: 0, w: 16.0, h: 2.0 },
      { type: "gem",    x: 1392.0, y: 4.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "stairs", x: 1401.0, y: 0, steps: 4, stepW: 1.4, stepH: 0.5, dir: "down", subType: "cyber" },

      // 🌪️ Twin Aero Booster Fans soaring over core breach abyss
      { type: "fan",    x: 1414.0, y: 0, w: 4.0, height: 9.5, liftForce: 140.0, subType: "turbo" },
      { type: "lava",   x: 1420.0, y: 0, w: 32.0, h: 0.8 },
      { type: "lava_crust", x: 1432.0, y: 0, w: 5.0, h: 1.5 },
      { type: "lava_crust", x: 1444.0, y: 0, w: 5.0, h: 1.5 },

      // 🪜 Grand Final Victory Stairway to Heaven
      { type: "stairs", x: 1458.0, y: 0, steps: 5, stepW: 1.4, stepH: 0.5, dir: "up", subType: "cyber" },
      { type: "block",  x: 1465.0, y: 0, w: 22.0, h: 2.5 },
      { type: "gem",    x: 1475.0, y: 5.0, subType: "amethyst", color: 0xd500f9, value: 100 },

      // 🌪️ Final Grand Warp Turbine Fan soaring into endX: 1520!
      { type: "fan",    x: 1488.0, y: 0, w: 4.5, height: 10.0, liftForce: 145.0, subType: "turbo" }
    ]
  }
];
