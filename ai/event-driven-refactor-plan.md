# Event-Driven Architecture Refactor

## Context

The game currently uses mutable class instances that self-register with the game loop and get mutated directly by systems (gravity, collisions). This makes testing hard, networking impossible, and the code non-deterministic. The goal is a Redux-like event-driven architecture where the same action/event types work on both FE and a future Go BE.

## Phase 1: Capture Current Behavior in Tests

Write tests that verify input→output contracts (not implementation details) so they survive the refactor. Ordered by dependency — pure functions first, integration last.

### 1. Physics pure functions (`physics.test.js` — new)
No mocks needed. Test with plain objects (`{ pos, radius, velocity, mass, inverseMass, elasticity }`).
- Ball-to-ball collision detection (overlapping, touching, separated)
- Ball-to-wall collision detection
- Penetration resolution (ball-ball, ball-wall) — verify separation
- Velocity resolution (ball-ball, ball-wall) — elastic bounce, energy conservation
- Gravity formula: `gravity(m1, m2, d)` = `g * m1 / d²`
- Helper factories: `makeCircle(x, y, r, vx, vy)`, `makeWall(x1, y1, x2, y2)` — reusable after refactor

### 2. Shape tick (`Shape.test.js` — new)
Mock engine (same pattern as `serialize.test.js`). Create a Circle, call `tick(delta)` directly.
- Friction reduces velocity: `vel * (1 - 0.2 * delta)`
- Position updates: `pos + vel * delta`
- `previousPos` stores old position
- Stationary object stays in place
- Multiple ticks converge velocity toward zero

### 3. Player input processing (`Player.test.js` — new)
Export `actionsToRotation`, `actionsToAcceleration`, `actionToAttraction` from Player.js for direct testing.
- `ACTION_ROTATE_RIGHT: 1.0` → `+7.5` degrees
- `ACTION_ROTATE_LEFT: 1.0` → `-7.5` degrees
- `ACTION_MOVE_UP: 0.5` → Vector `{0, -0.5}`
- `ACTION_MOVE_DOWN: 0.3` → Vector `{0, 0.3}`
- `ACTION_ATTRACT` → `mass * 10`
- `ACTION_REPELL` → `mass * -10`
- Full player loop: mock adapter, dispatch actions, verify resulting pos/vel/direction

### 4. Gravity integration (`gravity.test.js` — new)
Test `physics.gravity()` directly (it's pure). For the system-level test, mock `engine.world.getObjects()`, capture the gravity update callback via `loop.update.mock.calls`, run it, assert velocity changes on test objects.
- Two objects within gravitational radius → attracted object's velocity changes
- Objects outside radius → no change
- Attraction vs repulsion (positive vs negative mass)

### 5. Collision integration (`collisions.test.js` — new)
Mock `engine.world.getObjects()`, capture the collision update callback, run it.
- Two circles heading toward each other → both get new positions and velocities
- Circle hitting wall → bounces off
- Solid-solid pairs skipped
- Duplicate collision pairs in same frame handled

### 6. Ball break/absorb integration (extend `Ball.test.js`)
- After `onCollision` sets `_pendingBreak`, capture and run the order-1002 callback → verify destroy + child spawning
- Child properties: radius = parent * 0.6, invulnerability = 30 frames
- Below MIN_BREAK_RADIUS (6) → just destroy, no children
- Absorb: mass conservation (newMass = this.mass + other.mass)

### 7. Full frame simulation (`simulation.test.js` — new)
Golden integration test. Mock `engine.world`, init gravity + collisions, run all callbacks in order for N frames.
- Two balls heading toward each other → they collide and bounce
- Ball near wall → bounces off
- Use approximate assertions (`toBeCloseTo`)

**Preparatory code change**: Export `actionsToRotation`, `actionsToAcceleration`, `actionToAttraction` from `Player.js` (non-behavioral change, just makes them testable).

---

## Phase 2: Event-Driven Refactor

### Target Architecture

```
Input adapters → Actions → Store.dispatch(action) → Reducer(state, action) → New State
                                                                                  ↓
                                                                          Renderer (draw)
                                                                          Network (send)
```

### State Shape
Single plain object, no class instances:
```js
{
  entities: {
    "circle-abc": {
      id, type: "player"|"ball", shape: "circle",
      pos: {x, y}, previousPos: {x, y}, velocity: {x, y},
      direction, acceleration, radius, mass, inverseMass, elasticity,
      // player-only: attraction, initialMass, adapterType
      // ball-only: invulnerable (frame count)
    },
    "wall-def": {
      id, type: "wall", shape: "wall",
      start: {x, y}, end: {x, y}, elasticity, width, solid: true
    }
  },
  attractedIds: [],
  frame: 0
}
```

### Action Model: STEP-based
One action per physics frame, containing all player inputs:
```js
{ type: "STEP", delta: 0.01639, inputs: [
    { playerId: "circle-abc", actions: { ACTION_MOVE_UP: 0.5 } }
]}
{ type: "ENTITY_SPAWN", entity: { ... } }
{ type: "ENTITY_DESTROY", entityId: "..." }
```

This is ideal for networking: send STEP + inputs, both FE and BE compute the same result. Replay = reapply the same STEP sequence.

### Reducer
Pure function `(state, action) => newState`. The STEP reducer runs the full pipeline:
1. `applyInputs(state, inputs)` — rotation, acceleration, mass changes
2. `applyGravity(state)` — gravitational velocity changes
3. `applyCollisions(state)` — detection, penetration resolution, velocity resolution, onCollision outcomes
4. `processAsteroidOutcomes(state)` — break/absorb/destroy
5. `applyPhysicsTick(state, delta)` — friction + movement
6. Increment frame counter

Performance: copy-on-write — only clone entities that actually changed. With ~25 entities at 60fps, this is ~1500 shallow copies/sec — negligible.

### Store (~20 lines)
```js
createStore(reducer, initialState) → { getState, dispatch, subscribe }
```
Listeners notified after each dispatch (renderer, network, sound).

### Game Loop Change
Loop still uses rAF + fixed timestep. Instead of calling subscriber callbacks:
```js
while (delta >= timeStep) {
  const inputs = gatherInputs();
  store.dispatch({ type: "STEP", delta: timeStep/1000, inputs });
  delta -= timeStep;
}
renderer.draw(store.getState(), interpolation);
```

### Vector Strategy
Physics functions currently call `ball.pos.subtract()` etc. (need Vector methods).
Start with: wrap `{x, y}` → Vector at physics function entry, unwrap on exit.
Migrate later to plain `vecSub(a, b)` helpers if profiling shows allocation pressure.

### Rendering
Extract draw methods from classes into standalone functions: `drawPlayer(ctx, entity, interpolation)`, `drawAsteroid(ctx, entity, interpolation, renderData)`.
Asteroid visual data (vertices, craters, color) lives in a render cache keyed by entity ID, derived from seed — not in state.

### Incremental Migration Order
1. **Store infrastructure** — `store.js`, `reducer.js`, `initialState.js` + tests
2. **Extract tick** — `applyPhysicsTick` pure function, verify with Shape tests
3. **Extract input processing** — `applyInputs` pure function, verify with Player tests
4. **Extract gravity** — `applyGravity` pure function, verify with gravity tests
5. **Extract collisions** — `applyCollisions` pure function (biggest piece), verify with collision tests
6. **Extract asteroid logic** — `processAsteroidOutcomes`, verify with Ball tests
7. **Wire game loop** — dispatch STEP actions instead of subscriber callbacks
8. **Extract rendering** — standalone draw functions, renderer.js
9. **Clean up** — remove old world.js, state.js, class mutations

Each step keeps the game playable. Run `yarn debugCollisions` after each step to verify.

### Go Backend Integration
- Client sends `{ playerId, actions }` over WebSocket each frame
- Server runs the same reducer (ported to Go), broadcasts STEP actions
- Both compute identical state from the same action sequence
- State snapshots only for reconciliation/correction

### Key Files
- `app/src/js/engine/physics.js` — already pure, becomes core of collision/gravity reducers
- `app/src/js/engine/objects/Shape.js` — tick logic to extract
- `app/src/js/engine/collisions.js` — mutation-heavy, biggest refactor target
- `app/src/js/engine/gravity.js` — mutation-heavy, needs extraction
- `app/src/js/engine/objects/Player.js` — input helpers to export/extract, rendering to extract
- `app/src/js/game/objects/Ball.js` — break/absorb logic to extract
- `app/src/js/game/objects/asteroidCollision.js` — already pure, reuse as-is
- `app/src/js/utils/SpatialGrid.js` — works with plain objects, reuse as-is

### Verification
After each incremental step:
1. `yarn test` — all Phase 1 tests pass
2. `yarn debugCollisions` — game plays correctly (manual/Playwright screenshot)
3. Compare frame-by-frame state output for determinism
