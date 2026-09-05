// difficulty_badges.js - High-Octane Procedural Animated Geometry Dash Difficulty Badges
// Features animated SVG assets for Easy, Normal, Hard, Harder, Insane, and Demon (with flaming horns).

export const DifficultyBadges = {
  // 1. Easy: Blue Happy Bouncing Face with Blinking Eyes
  easy: `
    <svg class="diff-face diff-easy" viewBox="0 0 64 64" width="34" height="34" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="easyGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#00f0ff"/>
          <stop offset="65%" stop-color="#0077ff"/>
          <stop offset="100%" stop-color="#0044aa"/>
        </radialGradient>
        <filter id="easyGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#00f0ff" flood-opacity="0.8"/>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#easyGrad)" stroke="#00ffff" stroke-width="3" filter="url(#easyGlow)"/>
      <!-- Eyes with blink animation -->
      <g class="easy-eyes">
        <ellipse cx="22" cy="28" rx="5" ry="7" fill="#ffffff"/>
        <circle cx="23" cy="27" r="3.5" fill="#020814"/>
        <circle cx="24.5" cy="25.5" r="1.5" fill="#ffffff"/>
        <ellipse cx="42" cy="28" rx="5" ry="7" fill="#ffffff"/>
        <circle cx="43" cy="27" r="3.5" fill="#020814"/>
        <circle cx="44.5" cy="25.5" r="1.5" fill="#ffffff"/>
      </g>
      <!-- Cheerful smiling mouth -->
      <path d="M 21 39 Q 32 50 43 39" fill="none" stroke="#020814" stroke-width="4" stroke-linecap="round"/>
      <path d="M 24 40 Q 32 47 40 40" fill="#ffffff" opacity="0.9"/>
      <!-- Rosy cheeks -->
      <circle cx="16" cy="36" r="3.5" fill="#ff4081" opacity="0.75"/>
      <circle cx="48" cy="36" r="3.5" fill="#ff4081" opacity="0.75"/>
    </svg>
  `,

  // 2. Normal: Green Cheerful Smiley Face
  normal: `
    <svg class="diff-face diff-normal" viewBox="0 0 64 64" width="34" height="34" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="normalGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#00ff88"/>
          <stop offset="65%" stop-color="#00b34d"/>
          <stop offset="100%" stop-color="#006626"/>
        </radialGradient>
        <filter id="normalGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#00ff88" flood-opacity="0.8"/>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#normalGrad)" stroke="#00ff88" stroke-width="3" filter="url(#normalGlow)"/>
      <!-- Happy arched eyes -->
      <path d="M 18 29 Q 23 21 28 29" fill="none" stroke="#020814" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M 36 29 Q 41 21 46 29" fill="none" stroke="#020814" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Big open grin -->
      <path d="M 20 38 Q 32 54 44 38 Z" fill="#020814"/>
      <!-- Teeth -->
      <path d="M 24 38 Q 32 44 40 38 Z" fill="#ffffff"/>
      <!-- Tongue -->
      <path d="M 27 47 Q 32 43 37 47 Z" fill="#ff5252"/>
    </svg>
  `,

  // 3. Hard: Yellow Focused / Determined Face
  hard: `
    <svg class="diff-face diff-hard" viewBox="0 0 64 64" width="34" height="34" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="hardGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ffe600"/>
          <stop offset="65%" stop-color="#ff9900"/>
          <stop offset="100%" stop-color="#cc6600"/>
        </radialGradient>
        <filter id="hardGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#ffcc00" flood-opacity="0.85"/>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#hardGrad)" stroke="#ffe600" stroke-width="3" filter="url(#hardGlow)"/>
      <!-- Determined angled eyebrows -->
      <path d="M 16 22 L 28 27" fill="none" stroke="#020814" stroke-width="4" stroke-linecap="round"/>
      <path d="M 48 22 L 36 27" fill="none" stroke="#020814" stroke-width="4" stroke-linecap="round"/>
      <!-- Alert focused eyes -->
      <ellipse cx="23" cy="30" rx="4.5" ry="5.5" fill="#ffffff"/>
      <circle cx="24" cy="30" r="3" fill="#020814"/>
      <circle cx="25" cy="29" r="1.2" fill="#ffffff"/>
      <ellipse cx="41" cy="30" rx="4.5" ry="5.5" fill="#ffffff"/>
      <circle cx="42" cy="30" r="3" fill="#020814"/>
      <circle cx="43" cy="29" r="1.2" fill="#ffffff"/>
      <!-- Confident straight-lipped mouth -->
      <path d="M 23 42 L 41 40" fill="none" stroke="#020814" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `,

  // 4. Harder: Red Furrowed Rage Face
  harder: `
    <svg class="diff-face diff-harder" viewBox="0 0 64 64" width="34" height="34" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="harderGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ff3366"/>
          <stop offset="65%" stop-color="#d50000"/>
          <stop offset="100%" stop-color="#800000"/>
        </radialGradient>
        <filter id="harderGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" flood-color="#ff1744" flood-opacity="0.9"/>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#harderGrad)" stroke="#ff1744" stroke-width="3" filter="url(#harderGlow)"/>
      <!-- Heavy furrowed angry brow -->
      <path d="M 14 20 L 30 29" fill="none" stroke="#020814" stroke-width="5" stroke-linecap="round"/>
      <path d="M 50 20 L 34 29" fill="none" stroke="#020814" stroke-width="5" stroke-linecap="round"/>
      <!-- Fierce glaring eyes -->
      <ellipse cx="23" cy="31" rx="4" ry="4.5" fill="#ffffff"/>
      <circle cx="24" cy="32" r="2.8" fill="#020814"/>
      <ellipse cx="41" cy="31" rx="4" ry="4.5" fill="#ffffff"/>
      <circle cx="40" cy="32" r="2.8" fill="#020814"/>
      <!-- Gritted clutched teeth mouth -->
      <rect x="22" y="41" width="20" height="9" rx="3" fill="#ffffff" stroke="#020814" stroke-width="3"/>
      <line x1="28" y1="41" x2="28" y2="50" stroke="#020814" stroke-width="2"/>
      <line x1="34" y1="41" x2="34" y2="50" stroke="#020814" stroke-width="2"/>
    </svg>
  `,

  // 5. Insane: Hot Pink / Magenta Screaming Crazy Face
  insane: `
    <svg class="diff-face diff-insane" viewBox="0 0 64 64" width="34" height="34" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="insaneGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ff00ff"/>
          <stop offset="65%" stop-color="#c51162"/>
          <stop offset="100%" stop-color="#7b1fa2"/>
        </radialGradient>
        <filter id="insaneGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#ff007f" flood-opacity="0.95"/>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#insaneGrad)" stroke="#ff007f" stroke-width="3" filter="url(#insaneGlow)"/>
      <!-- Crazy mismatched unhinged eyes -->
      <circle cx="21" cy="26" r="8" fill="#ffffff" stroke="#020814" stroke-width="2.5"/>
      <circle cx="22" cy="27" r="3" fill="#020814"/>
      <circle cx="43" cy="26" r="6.5" fill="#ffffff" stroke="#020814" stroke-width="2.5"/>
      <circle cx="43" cy="25" r="2.2" fill="#020814"/>
      <!-- Screaming gaping mouth with zigzag teeth -->
      <path d="M 18 39 Q 32 35 46 39 Q 44 55 32 55 Q 20 55 18 39 Z" fill="#020814"/>
      <!-- Jagged teeth -->
      <polygon points="21,39 24,44 27,39 30,44 33,39 36,44 39,39 42,44 45,39" fill="#ffffff"/>
      <polygon points="23,54 26,49 29,54 32,49 35,54 38,49 41,54" fill="#ffffff"/>
    </svg>
  `,

  // 6. Demon: Menacing Horned Devil Skull with FLAMING HORNS & Glowing Slit Eyes
  demon: `
    <svg class="diff-face diff-demon" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="demonHornL" x1="0%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stop-color="#4a0072"/>
          <stop offset="40%" stop-color="#ff0055"/>
          <stop offset="85%" stop-color="#ffcc00"/>
          <stop offset="100%" stop-color="#ffffff"/>
        </linearGradient>
        <linearGradient id="demonHornR" x1="100%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stop-color="#4a0072"/>
          <stop offset="40%" stop-color="#ff0055"/>
          <stop offset="85%" stop-color="#ffcc00"/>
          <stop offset="100%" stop-color="#ffffff"/>
        </linearGradient>
        <radialGradient id="demonGrad" cx="40%" cy="40%" r="65%">
          <stop offset="0%" stop-color="#311b92"/>
          <stop offset="55%" stop-color="#1a0033"/>
          <stop offset="100%" stop-color="#07000e"/>
        </radialGradient>
        <filter id="demonFireGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="4.5" flood-color="#ff0055" flood-opacity="1"/>
          <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#ff9900" flood-opacity="0.8"/>
        </filter>
      </defs>
      <!-- Flaming Horn Left -->
      <path class="demon-horn flame-l" d="M 17 26 C 9 18, 4 4, 15 2 C 18 10, 22 17, 24 23 Z" fill="url(#demonHornL)" filter="url(#demonFireGlow)"/>
      <!-- Flaming Horn Right -->
      <path class="demon-horn flame-r" d="M 47 26 C 55 18, 60 4, 49 2 C 46 10, 42 17, 40 23 Z" fill="url(#demonHornR)" filter="url(#demonFireGlow)"/>
      <!-- Skull Base -->
      <path d="M 14 26 C 14 15, 50 15, 50 26 C 50 36, 48 48, 40 55 C 36 58, 28 58, 24 55 C 16 48, 14 36, 14 26 Z" 
            fill="url(#demonGrad)" stroke="#ff0055" stroke-width="2.8" filter="url(#demonFireGlow)"/>
      <!-- Piercing Glowing Slit Eyes -->
      <path d="M 20 28 Q 26 31 30 26 Q 26 36 20 28 Z" fill="#ff0055" filter="url(#demonFireGlow)"/>
      <ellipse cx="25" cy="30" rx="1.5" ry="3" fill="#ffff00"/>
      <path d="M 44 28 Q 38 31 34 26 Q 38 36 44 28 Z" fill="#ff0055" filter="url(#demonFireGlow)"/>
      <ellipse cx="39" cy="30" rx="1.5" ry="3" fill="#ffff00"/>
      <!-- Menacing Fanged Grin -->
      <path d="M 22 43 Q 32 40 42 43 Q 39 52 32 52 Q 25 52 22 43 Z" fill="#000000" stroke="#ff0055" stroke-width="1.8"/>
      <!-- Sharp Razor Fangs -->
      <polygon points="24,43 27,48 30,43" fill="#ffffff"/>
      <polygon points="34,43 37,48 40,43" fill="#ffffff"/>
      <polygon points="28,52 31,47 34,52" fill="#ffffff"/>
    </svg>
  `,

  getBadge(difficultyStr) {
    if (!difficultyStr) return this.easy;
    const key = difficultyStr.toLowerCase().trim();
    if (key.includes('demon')) return this.demon;
    if (key.includes('insane')) return this.insane;
    if (key.includes('harder')) return this.harder;
    if (key.includes('hard')) return this.hard;
    if (key.includes('normal')) return this.normal;
    return this.easy;
  }
};
