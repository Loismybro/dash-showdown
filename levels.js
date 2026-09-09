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
    desc: "Haunting gothic fortress! Creepy pipe organ music, dark castle battlements, gargoyle spikes, and blood ruby gems.",
    obstacles: [
      // Intro Courtyard - Single Warmup Spikes
      { type: "spike", x: 26, y: 0, dir: "up" },
      { type: "spike", x: 38, y: 0, dir: "up" },

      // Castle Stone Rampart 1 + Gem 1 at jump peak
      { type: "block", x: 48, y: 0, w: 6, h: 1.5 },
      { type: "gem",   x: 51, y: 3.2, subType: "ruby", color: 0xff0055, value: 100 },
      { type: "spike", x: 57, y: 0, dir: "up" },

      // Iron Torch Launch Pad -> High Battlement
      { type: "pad",   x: 64, y: 0, subType: "yellow" },
      { type: "spike", x: 67, y: 0, dir: "up" },
      { type: "spike", x: 69, y: 0, dir: "up" },
      { type: "block", x: 71, y: 0, w: 10, h: 2.5 },
      { type: "gem",   x: 76, y: 4.2, subType: "ruby", color: 0xff0055, value: 100 },
      { type: "spike", x: 79, y: 2.5, dir: "up" }, // Clearable jump on top of battlement

      // Moat drop & double obsidian spikes
      { type: "spike", x: 91, y: 0, dir: "up" },
      { type: "spike", x: 93.5, y: 0, dir: "up" },

      // Gargoyle Tower Steps
      { type: "block", x: 101, y: 0, w: 4, h: 1.5 },
      { type: "block", x: 105, y: 0, w: 4, h: 3.0 },
      { type: "pad",   x: 107, y: 3.0, subType: "yellow" }, // Launches over double moat!
      { type: "spike", x: 111, y: 0, dir: "up" },
      { type: "spike", x: 113, y: 0, dir: "up" },
      { type: "spike", x: 115, y: 0, dir: "up" },
      { type: "orb",   x: 113, y: 4.5, subType: "yellow" }, // Mid-air save orb
      { type: "gem",   x: 113, y: 5.5, subType: "ruby", color: 0xff0055, value: 100 }, // High risk high reward!
      { type: "block", x: 118, y: 0, w: 8, h: 2.0 },

      // Cathedral Interior - Rhythm Spikes & Energy Shield
      { type: "spike", x: 134, y: 0, dir: "up" },
      { type: "spike", x: 142, y: 0, dir: "up" },
      { type: "shield", x: 146, y: 2.5 },
      { type: "spike", x: 150, y: 0, dir: "up" },

      // Crypt Chandelier Launch
      { type: "pad",   x: 158, y: 0, subType: "yellow" },
      { type: "block", x: 162, y: 0, w: 12, h: 2.5 },
      { type: "spike", x: 171, y: 2.5, dir: "up" },

      // Blood Orb Chains across the chasm
      { type: "spike", x: 180, y: 0, dir: "up" },
      { type: "orb",   x: 180, y: 2.8, subType: "yellow" },
      { type: "spike", x: 187, y: 0, dir: "up" },
      { type: "orb",   x: 187, y: 3.2, subType: "yellow" },
      { type: "gem",   x: 187, y: 4.8, subType: "ruby", color: 0xff0055, value: 100 },
      { type: "block", x: 194, y: 0, w: 9, h: 2.0 },

      // Castle Bell Tower Drop (Drop / Organ Solo!)
      { type: "pad",   x: 210, y: 0, subType: "yellow" },
      { type: "spike", x: 213, y: 0, dir: "up" },
      { type: "spike", x: 215, y: 0, dir: "up" },
      { type: "block", x: 218, y: 0, w: 8, h: 2.0 },
      { type: "spike", x: 224, y: 2.0, dir: "up" },

      // Flying Belfry Steps
      { type: "block", x: 232, y: 0, w: 6, h: 1.5 },
      { type: "orb",   x: 241, y: 3.0, subType: "yellow" },
      { type: "spike", x: 240, y: 0, dir: "up" },
      { type: "spike", x: 242, y: 0, dir: "up" },
      { type: "block", x: 246, y: 0, w: 6, h: 1.5 },

      // High Gothic Triple Spikes
      { type: "spike", x: 260, y: 0, dir: "up" },
      { type: "spike", x: 262, y: 0, dir: "up" },
      { type: "spike", x: 264, y: 0, dir: "up" },

      // ⚡ Speed Gate 2x Boost into Grand Organ Sprint
      { type: "speed_gate", x: 268, y: 0, speedMult: 2.0 },
      { type: "pad",   x: 274, y: 0, subType: "yellow" },
      { type: "block", x: 279, y: 0, w: 6, h: 2.5 },
      { type: "gem",   x: 282, y: 4.5, subType: "ruby", color: 0xff0055, value: 100 },
      { type: "spike", x: 288, y: 0, dir: "up" },
      { type: "block", x: 292, y: 0, w: 6, h: 1.5 },
      { type: "spike", x: 301, y: 0, dir: "up" },
      { type: "spike", x: 303, y: 0, dir: "up" },
      { type: "orb",   x: 309, y: 2.8, subType: "yellow" },
      { type: "spike", x: 309, y: 0, dir: "up" },
      { type: "block", x: 315, y: 0, w: 8, h: 2.0 },
      { type: "spike", x: 321, y: 2.0, dir: "up" },

      // Throne Room Finish
      { type: "pad",   x: 332, y: 0, subType: "yellow" },
      { type: "spike", x: 337, y: 0, dir: "up" },
      { type: "spike", x: 339, y: 0, dir: "up" },
      { type: "block", x: 343, y: 0, w: 10, h: 1.5 },
      { type: "spike", x: 360, y: 0, dir: "up" },
      { type: "spike", x: 375, y: 0, dir: "up" }
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
    desc: "Enchanted dream kingdom! Upbeat cute pop music, magical mushroom bounce pads, rainbow crystal spikes, and emerald gems.",
    obstacles: [
      // Pastel Garden Warmup
      { type: "spike", x: 24, y: 0, dir: "up" },
      { type: "pad",   x: 32, y: 0, subType: "pink" }, // Cute gentle mushroom bounce
      { type: "spike", x: 37, y: 0, dir: "up" },
      { type: "block", x: 41, y: 0, w: 6, h: 1.0 },
      { type: "gem",   x: 44, y: 2.6, subType: "emerald", color: 0x00ff88, value: 100 },

      // Rainbow Bridge Over Gentle Spikes
      { type: "spike", x: 53, y: 0, dir: "up" },
      { type: "spike", x: 55.5, y: 0, dir: "up" },
      { type: "orb",   x: 62, y: 2.4, subType: "pink" },
      { type: "spike", x: 62, y: 0, dir: "up" },
      { type: "block", x: 67, y: 0, w: 7, h: 1.2 },
      { type: "gem",   x: 70, y: 3.0, subType: "emerald", color: 0x00ff88, value: 100 },

      // --- ENCHANTED GRAVITY FLIP (BLUE MUSHROOM PAD) ---
      // Floor Y=0, Ceiling Y=9.0
      { type: "pad",   x: 82, y: 0, subType: "blue" }, // Launches smoothly up to pastel sky canopy!
      // Inverted ceiling hazards (Y=9)
      { type: "spike", x: 94, y: 9, dir: "down" },
      { type: "spike", x: 104, y: 9, dir: "down" },
      { type: "gem",   x: 109, y: 7.2, subType: "emerald", color: 0x00ff88, value: 100 },

      // Inverted Floating Flower Steps on Ceiling
      { type: "block", x: 114, y: 7.5, w: 6, h: 1.5 },
      { type: "spike", x: 123, y: 9, dir: "down" },
      { type: "spike", x: 125.5, y: 9, dir: "down" },

      // Pink Gravity Orb on Ceiling
      { type: "orb",   x: 134, y: 6.8, subType: "pink" },
      { type: "spike", x: 134, y: 9, dir: "down" },
      { type: "block", x: 139, y: 7.0, w: 7, h: 2.0 },

      // --- GRAVITY FLIP BACK TO FLOOR ---
      { type: "pad",   x: 154, y: 9, subType: "blue" }, // Launches back to floor!
      { type: "spike", x: 168, y: 0, dir: "up" },
      { type: "spike", x: 178, y: 0, dir: "up" },

      // Fairy Queen's Meadow (Drop / Bubbly Pop Frenzy!)
      { type: "pad",   x: 188, y: 0, subType: "yellow" },
      { type: "block", x: 193, y: 0, w: 9, h: 2.0 },
      { type: "gem",   x: 197, y: 4.2, subType: "emerald", color: 0x00ff88, value: 100 },
      { type: "spike", x: 200, y: 2.0, dir: "up" },

      // Floating Petal Orbs
      { type: "spike", x: 209, y: 0, dir: "up" },
      { type: "orb",   x: 209, y: 2.6, subType: "yellow" },
      { type: "spike", x: 216, y: 0, dir: "up" },
      { type: "orb",   x: 216, y: 2.8, subType: "yellow" },
      { type: "block", x: 222, y: 0, w: 8, h: 1.5 },

      // 🛸 Fairy Starlight UFO Flight
      { type: "portal", x: 238, y: 3.0, subType: "ufo" },
      { type: "shield", x: 250, y: 4.5 },
      { type: "spike", x: 260, y: 0, dir: "up" },
      { type: "spike", x: 260, y: 9, dir: "down" },
      { type: "portal", x: 275, y: 3.5, subType: "cube" },

      // Starlight Meadow Sprint
      { type: "pad",   x: 286, y: 0, subType: "yellow" },
      { type: "block", x: 291, y: 0, w: 8, h: 2.0 },
      { type: "spike", x: 297, y: 2.0, dir: "up" },
      { type: "gem",   x: 304, y: 3.5, subType: "emerald", color: 0x00ff88, value: 100 },
      { type: "spike", x: 312, y: 0, dir: "up" },
      { type: "spike", x: 322, y: 0, dir: "up" },
      { type: "spike", x: 334, y: 0, dir: "up" }
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
    desc: "Deep ocean trench! Tom Salta taiko kicks, chromatic predator brass, supersonic submarine jet flight, and sapphire ocean gems.",
    obstacles: [
      // Surface Reef Warmup
      { type: "spike", x: 22, y: 0, dir: "up" },
      { type: "block", x: 28, y: 0, w: 5, h: 1.2 },
      { type: "gem",   x: 30, y: 2.8, subType: "sapphire", color: 0x00e5ff, value: 100 },
      { type: "spike", x: 36, y: 0, dir: "up" },

      // --- SUBMARINE JET PORTAL (GREEN) ---
      { type: "portal", x: 44, y: 3.0, subType: "ship" },

      // Coral Cavern Section (Floor Y=0, Ceiling Y=10)
      { type: "spike", x: 58, y: 0, dir: "up" },
      { type: "spike", x: 68, y: 10, dir: "down" },
      { type: "spike", x: 78, y: 0, dir: "up" },

      // Sunken Temple Gate 1: High ceiling gate (fly under - 6.0 units clearance)
      { type: "block", x: 88, y: 6.0, w: 5, h: 4.0 },
      { type: "spike", x: 90.5, y: 6.0, dir: "down" },
      { type: "gem",   x: 90.5, y: 3.0, subType: "sapphire", color: 0x00e5ff, value: 100 },

      // Sunken Temple Gate 2: Low floor gate (fly over - 6.0 units clearance)
      { type: "block", x: 108, y: 0, w: 5, h: 4.0 },
      { type: "spike", x: 110.5, y: 4.0, dir: "up" },
      { type: "gem",   x: 110.5, y: 7.0, subType: "sapphire", color: 0x00e5ff, value: 100 },

      // Deep Abyssal Trench Slalom & Energy Shield
      { type: "shield", x: 120, y: 5.0 },
      { type: "block", x: 130, y: 3.5, w: 5, h: 3.0 },
      { type: "spike", x: 132.5, y: 3.5, dir: "down" },
      { type: "spike", x: 132.5, y: 6.5, dir: "up" },

      // Wide Hydrothermal Vent Corridor (Y=2.0 to Y=8.0 -> 6.0 units clear tunnel!)
      { type: "block", x: 150, y: 0, w: 20, h: 2.0 },
      { type: "block", x: 150, y: 8.0, w: 20, h: 2.0 },
      { type: "spike", x: 157, y: 2.0, dir: "up" },
      { type: "spike", x: 165, y: 8.0, dir: "down" },
      { type: "gem",   x: 161, y: 5.0, subType: "sapphire", color: 0x00e5ff, value: 100 },

      // Predator Teeth & Speed Surge
      { type: "spike", x: 180, y: 0, dir: "up" },
      { type: "spike", x: 188, y: 10, dir: "down" },
      { type: "spike", x: 196, y: 0, dir: "up" },
      { type: "speed_gate", x: 200, y: 0, speedMult: 2.0 },

      // --- GOLD RUSH FRENZY INVERTED PORTAL ---
      { type: "portal", x: 206, y: 5.0, subType: "gravity_up" }, // Inverted flight!
      { type: "spike", x: 218, y: 10, dir: "down" },
      { type: "block", x: 228, y: 0, w: 5, h: 4.0 },
      { type: "spike", x: 230.5, y: 4.0, dir: "up" },
      { type: "gem",   x: 230.5, y: 7.5, subType: "sapphire", color: 0x00e5ff, value: 100 },
      { type: "block", x: 250, y: 6.0, w: 5, h: 4.0 },
      { type: "spike", x: 252.5, y: 6.0, dir: "down" },

      // Return to Normal Gravity
      { type: "portal", x: 270, y: 5.0, subType: "gravity_down" },

      // Megalodon Cavern Exit
      { type: "block", x: 284, y: 0, w: 4, h: 3.0 },
      { type: "block", x: 300, y: 7.0, w: 4, h: 3.0 },
      { type: "block", x: 316, y: 0, w: 4, h: 3.0 },

      // Cube Return Portal
      { type: "portal", x: 334, y: 4.0, subType: "cube" },

      // Final Sprint
      { type: "pad",   x: 348, y: 0, subType: "yellow" },
      { type: "block", x: 353, y: 0, w: 8, h: 2.0 },
      { type: "spike", x: 359, y: 2.0, dir: "up" },
      { type: "spike", x: 370, y: 0, dir: "up" },
      { type: "spike", x: 385, y: 0, dir: "up" }
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
    desc: "Supersonic neo-Tokyo cyberspace! Hyper-speed wave zigzags, digital laser spikes, matrix code rain, and amethyst cyber gems.",
    obstacles: [
      // Neon Cyber Warmup
      { type: "spike", x: 22, y: 0, dir: "up" },
      { type: "spike", x: 30, y: 0, dir: "up" },
      { type: "block", x: 36, y: 0, w: 6, h: 1.5 },
      { type: "gem",   x: 39, y: 3.2, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "spike", x: 45, y: 0, dir: "up" },

      // Launch Pad into First Quantum Wave Portal
      { type: "pad",   x: 52, y: 0, subType: "yellow" },
      { type: "portal", x: 57, y: 4.0, subType: "wave" },

      // Wave Corridor 1: 45-degree rhythmic zigzag slopes (Clear 4.0 vertical tunnel)
      { type: "block", x: 66, y: 0, w: 6, h: 2.5 },
      { type: "block", x: 74, y: 6.5, w: 6, h: 3.5 },
      { type: "gem",   x: 77, y: 4.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "block", x: 82, y: 0, w: 6, h: 2.5 },
      { type: "block", x: 90, y: 6.5, w: 6, h: 3.5 },

      // High Precision Laser Gates
      { type: "spike", x: 102, y: 0, dir: "up" },
      { type: "spike", x: 102, y: 10, dir: "down" },
      { type: "spike", x: 112, y: 0, dir: "up" },
      { type: "spike", x: 112, y: 10, dir: "down" },
      { type: "spike", x: 122, y: 0, dir: "up" },
      { type: "spike", x: 122, y: 10, dir: "down" },

      // Center Diamond Gate with Gem
      { type: "block", x: 132, y: 3.5, w: 6, h: 3.0 },
      { type: "gem",   x: 135, y: 8.0, subType: "amethyst", color: 0xd500f9, value: 100 },

      // Cube Reversion Portal
      { type: "portal", x: 148, y: 4.0, subType: "cube" },

      // Hyper-speed Rhythm Platforming
      { type: "pad",   x: 158, y: 0, subType: "yellow" },
      { type: "block", x: 163, y: 0, w: 10, h: 2.0 },
      { type: "spike", x: 171, y: 2.0, dir: "up" },

      // Blue Gravity Pad into Inverted Ceiling Sprint
      { type: "pad",   x: 184, y: 0, subType: "blue" },
      { type: "spike", x: 196, y: 10, dir: "down" },
      { type: "spike", x: 206, y: 10, dir: "down" },
      { type: "gem",   x: 211, y: 7.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "pad",   x: 220, y: 10, subType: "blue" }, // Flip back!

      // --- DEMON DROP: INTENSIVE DUAL WAVE CLIMAX ---
      { type: "portal", x: 232, y: 3.5, subType: "wave" },
      { type: "block", x: 242, y: 0, w: 6, h: 3.0 },
      { type: "block", x: 250, y: 6.0, w: 6, h: 4.0 },
      { type: "block", x: 258, y: 0, w: 6, h: 3.0 },
      { type: "block", x: 266, y: 6.0, w: 6, h: 4.0 },
      { type: "gem",   x: 269, y: 3.5, subType: "amethyst", color: 0xd500f9, value: 100 },

      // Final Cube Victory Sprint
      { type: "portal", x: 280, y: 4.0, subType: "cube" },
      { type: "pad",   x: 292, y: 0, subType: "yellow" },
      { type: "block", x: 297, y: 0, w: 8, h: 2.0 },
      { type: "spike", x: 303, y: 2.0, dir: "up" },
      { type: "spike", x: 315, y: 0, dir: "up" },
      { type: "spike", x: 325, y: 0, dir: "up" },
      { type: "spike", x: 338, y: 0, dir: "up" },
      { type: "spike", x: 350, y: 0, dir: "up" }
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
      { type: "spike", x: 26, y: 0, dir: "up" },
      { type: "spike", x: 38, y: 0, dir: "up" },
      { type: "block", x: 48, y: 0, w: 6, h: 1.5 },
      { type: "gem",   x: 51, y: 3.2, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "pad",   x: 64, y: 0, subType: "yellow" },
      { type: "spike", x: 67, y: 0, dir: "up" },
      { type: "spike", x: 69, y: 0, dir: "up" },
      { type: "block", x: 72, y: 0, w: 10, h: 2.0 },
      { type: "spike", x: 86, y: 0, dir: "up" },

      // 🛸 UFO PORTAL: First Anti-Gravity Hop Flight Zone
      { type: "portal", x: 100, y: 3.5, subType: "ufo" },
      // Floating laser maze: weave over floor blocks and under ceiling obstacles
      { type: "block", x: 114, y: 0, w: 6, h: 2.0 },
      { type: "block", x: 114, y: 7.0, w: 6, h: 3.0 },
      { type: "gem",   x: 117, y: 4.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "spike", x: 128, y: 0, dir: "up" },
      { type: "spike", x: 128, y: 10, dir: "down" },
      { type: "block", x: 140, y: 0, w: 8, h: 2.5 },
      { type: "block", x: 152, y: 6.5, w: 8, h: 3.5 },
      { type: "gem",   x: 156, y: 3.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "orb",   x: 170, y: 4.5, subType: "pink" },

      // 🛡️ Collectible Shield Pickup in Act I
      { type: "shield", x: 188, y: 4.2 },
      { type: "spike", x: 202, y: 0, dir: "up" },
      { type: "spike", x: 202, y: 10, dir: "down" },

      // Revert to Cube Mode
      { type: "portal", x: 220, y: 4.0, subType: "cube" },
      { type: "pad",   x: 232, y: 0, subType: "yellow" },
      { type: "block", x: 237, y: 0, w: 8, h: 2.0 },
      { type: "spike", x: 243, y: 2.0, dir: "up" },

      // Blue Gravity Pad to Ceiling
      { type: "pad",   x: 258, y: 0, subType: "blue" },
      { type: "spike", x: 272, y: 10, dir: "down" },
      { type: "spike", x: 284, y: 10, dir: "down" },
      { type: "gem",   x: 290, y: 7.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "pad",   x: 304, y: 10, subType: "blue" }, // Flip back down

      { type: "spike", x: 320, y: 0, dir: "up" },
      { type: "spike", x: 332, y: 0, dir: "up" },
      { type: "spike", x: 344, y: 0, dir: "up" },
      { type: "block", x: 352, y: 0, w: 10, h: 1.5 },

      // ⚡ SPEED GATE 2x (Enters The Quantum Descent)
      { type: "speed_gate", x: 375, y: 0, speedMult: 2.0 },

      // ═════════════════════════════════════════════════════════════════
      // ACT II: THE QUANTUM DESCENT (x: 380 – 760) - 2x Speed Wave & Ship
      // ═════════════════════════════════════════════════════════════════
      { type: "portal", x: 395, y: 4.0, subType: "wave" },
      // Supersonic 45-degree wave zigzags
      { type: "block", x: 412, y: 0, w: 8, h: 3.0 },
      { type: "block", x: 424, y: 6.5, w: 8, h: 3.5 },
      { type: "gem",   x: 428, y: 4.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "block", x: 440, y: 0, w: 8, h: 3.0 },
      { type: "block", x: 452, y: 6.5, w: 8, h: 3.5 },
      { type: "spike", x: 468, y: 0, dir: "up" },
      { type: "spike", x: 468, y: 10, dir: "down" },
      { type: "spike", x: 482, y: 0, dir: "up" },
      { type: "spike", x: 482, y: 10, dir: "down" },
      { type: "block", x: 494, y: 3.5, w: 6, h: 3.0 },

      // 🚀 Jet Fighter Ship Portal (Supersonic flight corridor)
      { type: "portal", x: 515, y: 5.0, subType: "ship" },
      { type: "spike", x: 535, y: 0, dir: "up" },
      { type: "spike", x: 548, y: 10, dir: "down" },
      { type: "gem",   x: 560, y: 5.0, subType: "amethyst", color: 0xd500f9, value: 100 },
      // Shield pickup before intense laser gates
      { type: "shield", x: 575, y: 5.0 },
      { type: "block", x: 595, y: 0, w: 6, h: 3.5 },
      { type: "block", x: 610, y: 6.5, w: 6, h: 3.5 },
      { type: "block", x: 625, y: 0, w: 6, h: 3.5 },
      { type: "gem",   x: 640, y: 6.0, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "spike", x: 660, y: 0, dir: "up" },
      { type: "spike", x: 675, y: 10, dir: "down" },
      { type: "spike", x: 690, y: 0, dir: "up" },

      // Cube Portal
      { type: "portal", x: 715, y: 4.0, subType: "cube" },
      { type: "pad",   x: 728, y: 0, subType: "yellow" },
      { type: "block", x: 733, y: 0, w: 8, h: 2.0 },

      // ⚡ SPEED GATE 3x (Overdrive into Boss Arena)
      { type: "speed_gate", x: 752, y: 0, speedMult: 3.0 },

      // ═════════════════════════════════════════════════════════════════
      // ACT III: THE BOSS ARENA (x: 760 – 1220) - V.E.X.O.R. Boss Battle
      // ═════════════════════════════════════════════════════════════════
      // V.E.X.O.R. spawns at x: 760!
      // Rhythm Counter-Attack Turret Orbs to strike VEXOR:
      { type: "counter_orb", x: 805, y: 3.2 },
      { type: "spike", x: 820, y: 0, dir: "up" },
      { type: "block", x: 828, y: 0, w: 6, h: 1.5 },
      { type: "counter_orb", x: 855, y: 3.5 },
      { type: "spike", x: 870, y: 0, dir: "up" },
      { type: "gem",   x: 875, y: 4.0, subType: "amethyst", color: 0xd500f9, value: 100 },

      // UFO Portal: VEXOR Enters Phase 2 (Dual Crossfire Lasers)
      { type: "portal", x: 890, y: 4.0, subType: "ufo" },
      // Flutter through the center gap between top & bottom death lasers!
      { type: "counter_orb", x: 920, y: 4.5 },
      { type: "shield", x: 955, y: 4.5 }, // Emergency shield for chaotic crossfire
      { type: "counter_orb", x: 980, y: 4.5 },
      { type: "block", x: 1005, y: 0, w: 6, h: 2.0 },
      { type: "block", x: 1005, y: 7.0, w: 6, h: 3.0 },
      { type: "counter_orb", x: 1035, y: 4.5 },

      // Return to Cube Mode: Phase 3 Meltdown!
      { type: "portal", x: 1065, y: 4.0, subType: "cube" },
      { type: "pad",   x: 1078, y: 0, subType: "yellow" },
      { type: "block", x: 1083, y: 0, w: 8, h: 2.0 },
      { type: "counter_orb", x: 1110, y: 3.2 },
      { type: "pad",   x: 1130, y: 0, subType: "blue" }, // Flip to ceiling!
      { type: "spike", x: 1148, y: 10, dir: "down" },
      // Final decisive blow to destroy VEXOR:
      { type: "counter_orb", x: 1175, y: 6.8 },
      { type: "pad",   x: 1195, y: 10, subType: "blue" }, // Flip back to floor!
      { type: "spike", x: 1210, y: 0, dir: "up" },

      // ═════════════════════════════════════════════════════════════════
      // ACT IV: THE ESCAPE & QUANTUM INDUCTOR WARP (x: 1220 – 1520)
      // ═════════════════════════════════════════════════════════════════
      // VEXOR destroyed! Core melts down! Maximum escape velocity!
      { type: "speed_gate", x: 1235, y: 0, speedMult: 4.0 }, // 4x Quantum Warp!
      { type: "pad",   x: 1260, y: 0, subType: "yellow" },
      { type: "block", x: 1268, y: 0, w: 10, h: 2.0 },
      { type: "spike", x: 1285, y: 0, dir: "up" },
      { type: "pad",   x: 1298, y: 0, subType: "yellow" },
      { type: "block", x: 1306, y: 0, w: 10, h: 2.0 },
      { type: "gem",   x: 1320, y: 4.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "spike", x: 1338, y: 0, dir: "up" },
      { type: "pad",   x: 1355, y: 0, subType: "yellow" },
      { type: "block", x: 1365, y: 0, w: 12, h: 2.0 },
      { type: "gem",   x: 1390, y: 4.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "spike", x: 1410, y: 0, dir: "up" },
      { type: "pad",   x: 1425, y: 0, subType: "yellow" },
      { type: "block", x: 1435, y: 0, w: 10, h: 1.5 },
      { type: "gem",   x: 1460, y: 3.5, subType: "amethyst", color: 0xd500f9, value: 100 },
      { type: "spike", x: 1475, y: 0, dir: "up" },
      { type: "spike", x: 1488, y: 0, dir: "up" }
      // High-Power Inductor Coil Transition Accelerator awaits at endX: 1520!
    ]
  }
];
