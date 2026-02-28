# AI Session Notes

## Project Overview
- 2D multiplayer game project, inspired by Videoball / Quake III networking
- Frontend: Vanilla JS, bundled with **Parcel**, in `app/` directory
- Backend: Go (currently broken / out of sync with frontend)
- The working entry point is `yarn debugCollisions` (port 9001)
- The main `yarn start` entry is broken — frontend has changed since backend was written

## Project Structure (Frontend)
- `app/src/js/engine/` — Core game engine (physics, collisions, gravity, game loop, canvas, input adapters)
- `app/src/js/engine/objects/` — Shape (base), Circle, Wall, Player
- `app/src/js/engine/adapters/` — Input adapters: Keyboard, AI, Touch
- `app/src/js/utils/` — Vector math, geometry helpers, spatial grid
- `app/src/js/game/` — Game-specific logic (Ball, opponents)
- `app/src/js/debug/collisions/` — The working debug entry point
- `app/src/js/constants.js` — Canvas dimensions (1200x600)

## Architecture Notes
- **Rendering**: Canvas 2D context. `canvas.js` manages a layer system — call `engine.canvas.draw(id, callback, layer)` to register draw callbacks. Higher layer number = drawn later (on top). Use layer 999 for UI overlays.
- **Game loop**: Fixed timestep update loop with interpolated rendering. `engine.loop.update()` for game logic, `engine.loop.draw()` for rendering
- **Objects**: Shape > Circle > Player/Ball inheritance chain. All shapes get a canvas context via `engine.canvas.getContext()` stored as `this.ctx`
- **Physics**: Circle-based collision detection. Visual shape can differ from collision shape (we changed visuals without touching physics)
- **Input**: Adapter pattern — `Keyboard`, `AI`, and `Touch` adapters. Player's adapter type determines behavior and rendering
- **State**: `engine.state.setState(id, playerObj)` stores Player references directly. `getState()` returns all players — useful for reading player direction from other systems (e.g., Touch adapter reads player.direction for rotation targeting)
- **Vector**: Custom `Vector` class with `rotate(degrees)`, `add()`, `subtract()`, `multiply()`, `unit()`, `magnitude()`, `lerp()`
- **Collision grid**: Spatial grid optimization in `utils/SpatialGrid.js`
- **Gravity**: Objects have gravitational force proportional to mass. Player can attract (Q key / ATR button) or repel (W key / REP button)

## Input Adapter Contract
All adapters must implement:
- `readAndClearActions()` → returns `[{ actions: { ACTION_NAME: delta } }]`
- `type()` → returns string identifier ("keyboard", "ai", "touch")
- The `delta` value is a normalized input intensity (keyboard uses time-based `inputDelta()` at 30Hz sample rate, touch uses joystick magnitude 0-1)

## Performance
- **Performance is critical** — 60fps game loop, every ms counts. Always consider frame budget impact when touching engine code.
- **Mid-iteration mutation bug (fixed)**: subscribeTo/unsubscribeFrom used to mutate the subscribers array during forEach, causing skipped/double-fired callbacks and collision lag. Now buffered — see `loop.js`.
- **Hot paths**: `loop()` subscriber iteration, collision detection, SpatialGrid lookups. Avoid allocations (objects, arrays, closures) in per-frame code.
- Profile before/after when changing engine code. Test with many asteroids breaking simultaneously (worst case).

## Important Gotchas
- **Player.draw() checks adapter type**: `_drawSpaceship()` for keyboard/touch, `_drawEnemyShip()` for AI. When adding new player-controlled adapters, update the condition in `Player.draw()` or the player will render as an enemy.
- **Canvas dimensions are hardcoded** at 1200x600 in `constants.js` and used by SpatialGrid, wall setup, and debug helpers. For mobile, we CSS-scale the canvas rather than changing the game world — much less invasive.
- **Touch coordinate mapping**: Mobile canvas is CSS-scaled, so touch events need `getBoundingClientRect()` + scale ratio conversion to map screen coords to canvas coords.
- **Mobile viewport**: Browser toolbar eats into viewport height. Use `100dvh` (dynamic viewport height) not `100vh`. In landscape, constrain by height (`height: 100dvh; width: auto`). In portrait, constrain by width.
- **Touch UI sizing**: Buttons need to be large for mobile (radius ~46px in canvas coords). Higher opacity (0.15 fill, 0.4 stroke for inactive state) needed for visibility on small screens.

## Changes Made
1. **Space theme** (commit `0e27586`): Spaceship player, enemy ships, jagged asteroids, twinkling starfield, space-themed UI
2. **Touch controls** (commit `4d1f09e`): Single directional joystick (point to move), attract/repel buttons, auto-detect touch vs keyboard, responsive mobile CSS
3. **Touch fixes** (commit `76e89a9`): Fixed spaceship rendering for touch adapter, enlarged action buttons

## Key Files
- `app/src/js/engine/objects/Player.js` — Ship rendering (`_drawSpaceship`, `_drawEnemyShip`), attraction field, adapter setup
- `app/src/js/engine/adapters/Touch.js` — Touch controls with joystick + buttons, draws UI overlay
- `app/src/js/game/objects/Ball.js` — Asteroid rendering with seeded vertices, craters, rotation
- `app/src/js/engine/canvas.js` — Starfield background, layer system
- `app/src/js/debug/collisions/collisions.js` — Scene setup, touch auto-detection
- `app/src/js/debug/collisions/index.html` — Responsive mobile CSS, space-themed UI

## Useful Tools on This Machine
- **Playwright** installed via npx with Chromium — screenshots: `npx playwright screenshot --browser chromium --wait-for-timeout 3000 --viewport-size "1250,750" "http://localhost:9001" /tmp/screenshot.png`
- Python3 for quick HTTP servers: `python3 -m http.server 8888 --bind 0.0.0.0`
- Mac local IP: `ipconfig getifaddr en0` (currently `192.168.0.14`)

## Workflow Preferences
- User often works via remote control (phone) — can't easily open browser, so Playwright screenshots are useful
- Can serve files on local network for phone viewing
- Commit messages: short imperative style, matching existing repo conventions
- Branch: `ai/experiment`
- User prefers concise communication, no unnecessary questions — just propose options directly
