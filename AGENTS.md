# AGENTS.md

High-signal instructions for automated agents working on this repository.

## Architecture & Stack

- **Zero-dependency, vanilla web app**: No `package.json`, bundler (Vite/Webpack), compiler, or npm dependencies.
- **Entrypoints**:
  - `index.html`: Shell page, sets up fixed 800x600 `<canvas id="canvas">` and loads `game.js`.
  - `game.js`: Contains all game state, math/physics, entities, input handling, and canvas rendering in a single `'use strict'` script.
- **Script format**: Loaded as a classic script (`<script src="game.js"></script>`), NOT an ES module. Do not use `import` / `export` syntax without modifying the HTML script tag and browser loader setup.

## Running & Verification

- **Running**: Open `index.html` directly in a browser (or run a local static server like `npx serve .` on port 3000).
- **Verification**: No automated test runner, linter, or build pipeline exists. Verify changes manually by opening or serving `index.html` in a browser.

## Core Conventions & Engine Quirks

- **Coordinate system**: Fixed canvas resolution `W = 800`, `H = 600`. All movable entities must wrap around screen boundaries using `wrap(val, max)`.
- **Game loop**: Delta-time driven via `requestAnimationFrame(loop)` with a maximum dt clamp of 50ms (`Math.min((ts - lastTime) / 1000, 0.05)`).
- **Game states**: Handled by global string `state`: `'playing'`, `'dead'` (2-second respawn delay via `deadTimer`), or `'gameover'`.
- **Input handling**: `keys` tracks held state; `justPressed` tracks single-frame edge triggers consumed by `pressed(code)`. Default browser scrolling is prevented for arrow keys and spacebar.
- **Asteroid sizing**: Three tiers indexed 1 (small), 2 (medium), 3 (large) mapped through parallel arrays `RADII = [0, 16, 30, 50]`, `SPEEDS = [0, 85, 55, 32]`, `POINTS = [0, 100, 50, 20]`.
- **README discrepancy**: `README.md` describes power-ups and shooting stars ("estrella fugaz"), but `game.js` only implements classic Asteroids (ship, bullets, splitting asteroids, particles). Do not assume power-up or shooting star code exists.

## Common Pitfalls to Avoid

- Do not attempt `npm install`, `npm test`, or `npm run build`—there is no Node project configuration.
- Do not introduce build tools, transpilers, or third-party libraries unless explicitly requested.
- Do not resize the canvas in CSS without keeping canvas drawing dimensions and coordinate math (`W`, `H`) in sync.
