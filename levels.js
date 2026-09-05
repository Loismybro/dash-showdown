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

      // Cathedral Interior - Rhythm Spikes
      { type: "spike", x: 134, y: 0, dir: "up" },
      { type: "spike", x: 142, y: 0, dir: "up" },
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

      // Final Grand Organ Sprint
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

      // Gravity Portal: Wave to Sky
      { type: "portal", x: 238, y: 3.0, subType: "gravity_up" },
      { type: "spike", x: 250, y: 9, dir: "down" },
      { type: "spike", x: 260, y: 9, dir: "down" },
      { type: "portal", x: 272, y: 6.0, subType: "gravity_down" },

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

      // Deep Abyssal Trench Slalom
      { type: "block", x: 130, y: 3.5, w: 5, h: 3.0 },
      { type: "spike", x: 132.5, y: 3.5, dir: "down" },
      { type: "spike", x: 132.5, y: 6.5, dir: "up" },

      // Wide Hydrothermal Vent Corridor (Y=2.0 to Y=8.0 -> 6.0 units clear tunnel!)
      { type: "block", x: 150, y: 0, w: 20, h: 2.0 },
      { type: "block", x: 150, y: 8.0, w: 20, h: 2.0 },
      { type: "spike", x: 157, y: 2.0, dir: "up" },
      { type: "spike", x: 165, y: 8.0, dir: "down" },
      { type: "gem",   x: 161, y: 5.0, subType: "sapphire", color: 0x00e5ff, value: 100 },

      // Predator Teeth
      { type: "spike", x: 180, y: 0, dir: "up" },
      { type: "spike", x: 188, y: 10, dir: "down" },
      { type: "spike", x: 196, y: 0, dir: "up" },

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
  }
];
