import { createStore } from "./store";
import { reducer } from "./reducer";
import loop from "./loop";
import { SHAPE_CIRCLE, SHAPE_WALL } from "./constants";

/**
 * Creates a game runner that orchestrates the store-based game loop.
 *
 * Replaces the old subscriber-based physics with a single STEP dispatch per frame.
 * Existing class instances are kept alive as "render shells" — their draw callbacks
 * stay registered, and state is synced from the store each frame.
 *
 * @param {object} engine — the engine module (loop, world, canvas, etc.)
 * @param {object} options
 * @param {function} options.createBall — factory for render-only Ball instances:
 *   (pos, { radius, velocity, renderOnly }) => Ball instance
 * @returns {{ init, getState, getStore }}
 */
export function createGameRunner(engine, { createBall } = {}) {
  let store = null;
  const adapters = new Map();   // playerId → adapter instance
  const instances = new Map();  // store entityId → class instance (for render sync)
  let previousEntityIds = null; // Set of IDs from last frame, for lifecycle detection

  function init() {
    const worldObjects = engine.world.getObjects();
    const initialState = buildInitialState(worldObjects);

    // Build adapter + instance maps
    for (const obj of worldObjects) {
      instances.set(obj.id, obj);
      if (obj.adapter) {
        adapters.set(obj.id, obj.adapter);
      }
    }

    store = createStore(reducer, initialState);
    previousEntityIds = new Set(Object.keys(initialState.entities));

    // Unsubscribe the global physics callbacks (gravity + collisions systems)
    loop.unsubscribeFrom("update", "gravity");
    loop.unsubscribeFrom("update", "collisions");

    // Subscribe the single game-step callback
    loop.update("game-step", (delta) => {
      const inputs = gatherInputs();
      store.dispatch({ type: "STEP", delta, inputs });
      syncToInstances();
      handleEntityLifecycle();
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

  function syncToInstances() {
    const state = store.getState();
    for (const id in state.entities) {
      const entity = state.entities[id];
      const instance = instances.get(id);
      if (!instance) continue;

      if (entity.shape === SHAPE_CIRCLE) {
        // Mutate Vector .x/.y in-place to avoid allocations
        instance.pos.x = entity.pos.x;
        instance.pos.y = entity.pos.y;
        instance.previousPos.x = entity.previousPos.x;
        instance.previousPos.y = entity.previousPos.y;
        instance.velocity.x = entity.velocity.x;
        instance.velocity.y = entity.velocity.y;
        instance.direction = entity.direction;
        instance.mass = entity.mass;
        instance.inverseMass = entity.inverseMass;
        instance.radius = entity.radius;

        if (entity.type === "player") {
          instance.attraction = entity.attraction;
        }
        if (entity.type === "ball") {
          instance._invulnerable = entity.invulnerable;
        }
      }
      // Walls don't move — no sync needed
    }
  }

  function handleEntityLifecycle() {
    const state = store.getState();

    // Detect new entities (spawned by reducer, e.g. child asteroids)
    if (createBall) {
      for (const id in state.entities) {
        if (!previousEntityIds.has(id)) {
          const entity = state.entities[id];
          if (entity.type === "ball") {
            // Create a render-only Ball instance. Its internal ID differs from
            // the store entity ID — the instances map bridges them.
            const ball = createBall(entity.pos, {
              radius: entity.radius,
              velocity: entity.velocity,
              renderOnly: true,
            });
            instances.set(id, ball);
            // Sync initial state immediately so first draw is correct
            syncBall(ball, entity);
          }
        }
      }
    }

    // Detect removed entities
    for (const id of previousEntityIds) {
      if (!(id in state.entities)) {
        const instance = instances.get(id);
        if (instance && instance.destroy) {
          instance.destroy();
        }
        instances.delete(id);
        adapters.delete(id);
      }
    }

    // Rebuild previousEntityIds — reuse the Set to reduce allocations
    previousEntityIds.clear();
    for (const id in state.entities) {
      previousEntityIds.add(id);
    }
  }

  function syncBall(instance, entity) {
    instance.pos.x = entity.pos.x;
    instance.pos.y = entity.pos.y;
    instance.previousPos.x = entity.previousPos.x;
    instance.previousPos.y = entity.previousPos.y;
    instance.velocity.x = entity.velocity.x;
    instance.velocity.y = entity.velocity.y;
    instance.radius = entity.radius;
    instance.mass = entity.mass;
    instance.inverseMass = entity.inverseMass;
    instance._invulnerable = entity.invulnerable;
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
