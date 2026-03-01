# Networking Audit

Issues in the current codebase that need addressing before multiplayer can work.

## Critical

### ~~Object IDs will collide across clients~~ ✅ Done
**Files**: `engine/objects/Shape.js`, `Wall.js`

~~Auto-incrementing counters (`circle-1`, `circle-2`...) — every client generates the same IDs independently.~~ Replaced with `crypto.randomUUID()`. IDs now use format `{type}-{uuid}` (e.g. `circle-a1b2c3d4-...`).

### State isn't serializable
**File**: `engine/state.js`

State stores raw object references including Canvas contexts, adapters, callbacks. Can't JSON-serialize for network sync. Need to separate simulation state from rendering state.

### Objects create/destroy themselves
**Files**: `game/objects/Ball.js`, `engine/world.js`

Asteroids spawn children via `new Ball()` in collision callbacks — no server authorization. Need server-authoritative spawning.

### No network protocol
**File**: `engine/network.js`

Just a bare WebSocket wrapper. No tick sync, state schema, or conflict resolution.

## High

### Gravity mutates state directly
**File**: `engine/gravity.js`

Modifies velocities on every object in range. Server and client calculations will diverge with different object counts or timing.

### Collision callbacks have implicit side effects
**Files**: `engine/collisions.js`, `game/objects/Ball.js`

Collisions queue `_pendingBreak`/`_pendingAbsorb` as deferred state mutations. No rollback capability.

### Input is timing-dependent
**Files**: `engine/adapters/Keyboard.js`, `Touch.js`

Keyboard samples at 30Hz with time-based delta. Touch reads current player state to compute rotation. No input history for reconciliation.

## Medium

### Rendering tightly coupled to simulation
**Files**: `engine/objects/Player.js`, `Shape.js`

All objects require a Canvas context at construction. Can't run a headless server simulation without stubbing rendering.

### No clean network adapter path
**Files**: `engine/adapters/Adapter.js`, `Player.js`

Adapter chosen at construction. No mechanism for server to override local input or inject authoritative state.

## Low

### Unseeded randomness
Asteroid visuals and starfield use Math.random() — makes cross-client debugging harder but cosmetically OK.

### Vector allocations
Every Vector operation allocates a new object. GC pressure under heavy physics — not a networking issue per se but compounds under load.

## Suggested Attack Order

1. UUIDs / server-assigned IDs — prerequisite for everything
2. Separate serializable sim state from render state — enables sync
3. Server-authoritative physics with client prediction
4. Event-based input with network adapter
5. Tick-based protocol (state sync, command validation)
