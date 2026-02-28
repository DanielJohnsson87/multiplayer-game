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
- `app/src/js/utils/` — Vector math, geometry helpers, spatial grid
- `app/src/js/game/` — Game-specific logic (Ball, opponents)
- `app/src/js/debug/collisions/` — The working debug entry point
- `app/src/js/constants.js` — Canvas dimensions (1200x600)

## Architecture Notes
- **Rendering**: Canvas 2D context. `canvas.js` manages a layer system — call `engine.canvas.draw(id, callback, layer)` to register draw callbacks
- **Game loop**: Fixed timestep update loop with interpolated rendering. `engine.loop.update()` for game logic, `engine.loop.draw()` for rendering
- **Objects**: Shape > Circle > Player/Ball inheritance chain. All shapes get a canvas context via `engine.canvas.getContext()` stored as `this.ctx`
- **Physics**: Circle-based collision detection. Visual shape can differ from collision shape (we changed visuals without touching physics)
- **Input**: Adapter pattern — `Keyboard` and `AI` adapters. Player's adapter type determines behavior
- **Vector**: Custom `Vector` class with `rotate(degrees)`, `add()`, `subtract()`, `multiply()`, `unit()`, `magnitude()`, `lerp()`
- **Collision grid**: Spatial grid optimization in `utils/SpatialGrid.js`
- **Gravity**: Objects have gravitational force proportional to mass. Player can attract (Q) or repel (W)

## Changes Made This Session
- **Space theme**: Replaced plain circle rendering with spaceship (player), enemy ships (AI), and jagged asteroids (balls)
- **Starfield**: Added twinkling star background to `canvas.js` (150 stars, drawn before game layers)
- **Attraction field**: Changed from static translucent circle to animated pulsing rings
- **UI**: Rewrote `index.html` with space-themed dark UI, monospace font, cyan accents

## Key Files Modified
- `app/src/js/engine/objects/Player.js` — Added `draw()` override, `_drawSpaceship()`, `_drawEnemyShip()`, updated `drawAttractionField()`
- `app/src/js/game/objects/Ball.js` — Added asteroid rendering with seeded random vertices, craters, rotation
- `app/src/js/engine/canvas.js` — Added starfield (generateStars/drawStars)
- `app/src/js/debug/collisions/index.html` — Space-themed UI

## Useful Tools on This Machine
- **Playwright** installed via npx with Chromium browser — can take headless screenshots: `npx playwright screenshot --browser chromium --wait-for-timeout 3000 --viewport-size "1250,750" "http://localhost:9001" /tmp/screenshot.png`
- Python3 available for quick HTTP servers: `python3 -m http.server 8888 --bind 0.0.0.0`
- Mac local IP: check with `ipconfig getifaddr en0`

## Workflow Preferences
- User works via remote control (phone) — can't easily open browser, so screenshots via Playwright are useful
- Can serve files on local network for phone viewing
- Commit messages: short imperative style, matching existing repo conventions
- Branch: `ai/experiment`

## Pending / Uncommitted
- The space theme changes are staged but NOT yet committed (user rejected the commit attempt — may want different message or to review first)
