import { createStore } from "./store";
import { reducer } from "./reducer";
import { createRenderer } from "./renderer";
import loop from "./loop";
import { SHAPE_CIRCLE, SHAPE_WALL } from "./constants";

/**
 * Creates a game runner that orchestrates the store-based game loop.
 *
 * Dispatches a single STEP action per physics frame. Rendering is handled by
 * a centralized renderer that reads directly from the store — no class
 * instance sync bridge needed.
 *
 * @param {object} engine — the engine module (loop, world, canvas, etc.)
 * @returns {{ init, getState, getStore }}
 */
export function createGameRunner(engine) {
  let store = null;
  const adapters = new Map(); // playerId → adapter instance

  function init() {
    const worldObjects = engine.world.getObjects();
    const initialState = buildInitialState(worldObjects);

    // Build adapter map
    for (const obj of worldObjects) {
      if (obj.adapter) {
        adapters.set(obj.id, obj.adapter);
      }
    }

    store = createStore(reducer, initialState);

    // Register centralized renderer
    const { render } = createRenderer(() => store.getState());
    engine.canvas.draw("renderer", render, 1);

    // Unsubscribe the global physics callbacks (gravity + collisions systems)
    loop.unsubscribeFrom("update", "gravity");
    loop.unsubscribeFrom("update", "collisions");

    // Subscribe the single game-step callback
    loop.update("game-step", (delta) => {
      syncAdapterDirections();
      const inputs = gatherInputs();
      store.dispatch({ type: "STEP", delta, inputs });
    });
  }

  function getState() {
    return store.getState();
  }

  function getStore() {
    return store;
  }

  return { init, getState, getStore };

  // --- Internal helpers ---

  function syncAdapterDirections() {
    const state = store.getState();
    for (const [playerId, adapter] of adapters) {
      if (adapter.setDirection) {
        adapter.setDirection(state.entities[playerId]?.direction ?? 0);
      }
    }
  }

  function gatherInputs() {
    const inputs = [];
    for (const [playerId, adapter] of adapters) {
      const actionList = adapter.readAndClearActions();
      for (const { actions } of actionList) {
        inputs.push({ playerId, actions });
      }
    }
    return inputs;
  }
}

/**
 * Build initial state from existing class instances.
 * Called once during init() after the scene has created all objects.
 */
export function buildInitialState(worldObjects) {
  const entities = {};

  for (const obj of worldObjects) {
    if (obj.shape === SHAPE_CIRCLE) {
      const entity = {
        id: obj.id,
        type: obj.adapter ? "player" : "ball",
        shape: SHAPE_CIRCLE,
        pos: { x: obj.pos.x, y: obj.pos.y },
        previousPos: { x: obj.previousPos.x, y: obj.previousPos.y },
        velocity: { x: obj.velocity.x, y: obj.velocity.y },
        direction: obj.direction,
        acceleration: obj.acceleration,
        radius: obj.radius,
        mass: obj.mass,
        inverseMass: obj.inverseMass,
        elasticity: obj.elasticity,
        solid: false,
      };

      if (obj.adapter) {
        // Player-specific fields
        entity.initialMass = obj.initialMass;
        entity.attraction = obj.attraction;
        entity.adapterType = obj.adapter.type();
      } else {
        // Ball-specific fields
        entity.invulnerable = obj._invulnerable || 0;
      }

      entities[obj.id] = entity;
    } else if (obj.shape === SHAPE_WALL) {
      entities[obj.id] = {
        id: obj.id,
        type: "wall",
        shape: SHAPE_WALL,
        start: { x: obj.start.x, y: obj.start.y },
        end: { x: obj.end.x, y: obj.end.y },
        elasticity: obj.elasticity,
        width: obj.width,
        solid: true,
      };
    }
  }

  return {
    entities,
    attractedIds: [],
    collisionEvents: [],
    frame: 0,
  };
}
