import Vector from "../utils/vector";
import {
  collisionDetectionBallToBall,
  collisionDetectionBallToWall,
  penetrationResolutionBallToBall,
  penetrationResolutionBallToWall,
  collisionResolutionBallToBall,
  collisionResolutionBallToWall,
  gravity as gravityForce,
} from "./physics";
import { asteroidCollisionOutcome, ATTRACT_DURABILITY_MULTIPLIER } from "../game/objects/asteroidCollision";
import SpatialGrid from "../utils/SpatialGrid";
import {
  SHAPE_CIRCLE,
  SHAPE_WALL,
  ACTION_MOVE_UP,
  ACTION_MOVE_DOWN,
  ACTION_ROTATE_RIGHT,
  ACTION_ROTATE_LEFT,
  ACTION_ATTRACT,
  ACTION_REPELL,
  GRAVITATATIONAL_RADIUS_FACTOR,
  GRAVITATATIONAL_MASS_FACTOR,
} from "./constants";
import geometry from "../utils/geometry";

const FRICTION = 0.2;
const MIN_BREAK_RADIUS = 6;
const CHILD_SCALE = 0.6;

// --- Pure helper: wrap {x,y} → Vector at boundary, unwrap on exit ---

function vec(p) {
  return p instanceof Vector ? p : new Vector(p.x, p.y);
}

function plain(v) {
  return { x: v.x, y: v.y };
}

// --- applyPhysicsTick ---

export function applyPhysicsTick(state, delta) {
  const entities = { ...state.entities };
  let changed = false;

  for (const id in entities) {
    const e = entities[id];
    if (e.shape !== SHAPE_CIRCLE) continue;

    const vel = vec(e.velocity).multiply(1 - FRICTION * delta);
    const movement = vel.multiply(delta);
    const newPos = { x: e.pos.x + movement.x, y: e.pos.y + movement.y };

    entities[id] = {
      ...e,
      previousPos: { ...e.pos },
      pos: newPos,
      velocity: plain(vel),
    };
    changed = true;
  }

  return changed ? { ...state, entities } : state;
}

// --- applyInputs ---

export function actionsToRotation(actions) {
  let directionChange = 0;
  if (actions[ACTION_ROTATE_RIGHT]) {
    directionChange = 7.5 * actions[ACTION_ROTATE_RIGHT];
  }
  if (actions[ACTION_ROTATE_LEFT]) {
    directionChange = -7.5 * actions[ACTION_ROTATE_LEFT];
  }
  return directionChange;
}

export function actionsToAcceleration(actions) {
  let acc = null;
  if (actions[ACTION_MOVE_UP] || actions[ACTION_MOVE_DOWN]) {
    acc = new Vector(0, 0);
  }
  if (actions[ACTION_MOVE_UP]) {
    acc = acc.add({ x: 0, y: -1 * actions[ACTION_MOVE_UP] });
  }
  if (actions[ACTION_MOVE_DOWN]) {
    acc = acc.add({ x: 0, y: 1 * actions[ACTION_MOVE_DOWN] });
  }
  return acc;
}

export function actionToAttraction(initialMass, actions) {
  let alteredMass = 0;
  if (actions[ACTION_ATTRACT]) {
    alteredMass = initialMass * GRAVITATATIONAL_MASS_FACTOR;
  }
  if (actions[ACTION_REPELL]) {
    alteredMass = initialMass * -GRAVITATATIONAL_MASS_FACTOR;
  }
  return alteredMass;
}

export function applyInputs(state, inputs) {
  if (!inputs || inputs.length === 0) return state;

  const entities = { ...state.entities };
  let changed = false;
  const resetPlayers = new Set();

  for (const { playerId, actions } of inputs) {
    const player = entities[playerId];
    if (!player || player.type !== "player") continue;

    let updated = { ...player };

    // Restore mass to initial once per frame per player (not per input entry)
    if (!resetPlayers.has(playerId)) {
      updated.mass = updated.initialMass;
      updated.inverseMass = updated.initialMass === 0 ? 0 : 1 / updated.initialMass;
      updated.attraction = 0;
      resetPlayers.add(playerId);
    }

    const mass = actionToAttraction(updated.initialMass, actions);
    if (mass) {
      updated.mass = mass;
      updated.inverseMass = mass === 0 ? 0 : 1 / mass;
      if (mass === updated.initialMass) {
        updated.attraction = 0;
      } else if (mass > 0) {
        updated.attraction = 1;
      } else {
        updated.attraction = -1;
      }
    }

    const rotation = actionsToRotation(actions);
    if (rotation) {
      updated.direction = geometry.warp360(rotation + updated.direction);
    }

    const acceleration = actionsToAcceleration(actions);
    if (acceleration) {
      const rotated = acceleration.rotate(updated.direction);
      const acc = rotated.multiply(updated.acceleration);
      const newVel = vec(updated.velocity).add(acc);
      updated.velocity = plain(newVel);
    }

    entities[playerId] = updated;
    changed = true;
  }

  return changed ? { ...state, entities } : state;
}

// --- applyGravity ---

const gravityGrid = new SpatialGrid(null, { cellSize: 30 });

export function applyGravity(state) {
  const entities = { ...state.entities };
  const circles = [];
  const entityList = Object.values(entities);

  for (const e of entityList) {
    if (e.shape === SHAPE_CIRCLE) circles.push(e);
  }

  gravityGrid.populate(circles, GRAVITATATIONAL_RADIUS_FACTOR);
  const possibleCollisions = gravityGrid.populatedCellsUnique();

  const attractedIds = [];
  let changed = false;

  for (const shape of circles) {
    const attracted = possibleCollisions[shape.id];
    if (!attracted) continue;

    const gravitationalRadius = shape.radius * GRAVITATATIONAL_RADIUS_FACTOR;

    attracted.forEach((other) => {
      const dist = vec(shape.pos).subtract(vec(other.pos));
      if (gravitationalRadius + other.radius < dist.magnitude()) return;

      if (shape.attraction === 1) {
        attractedIds.push(other.id);
      }

      const normal = dist.unit();
      const force = gravityForce(shape.mass, other.mass, dist.magnitude());
      // Read latest velocity — may have been updated by a prior attractor this frame
      const current = entities[other.id] || other;
      const newVel = vec(current.velocity).add(normal.multiply(force));
      entities[other.id] = { ...current, velocity: plain(newVel) };
      changed = true;
    });
  }

  const newState = changed ? { ...state, entities } : { ...state };
  newState.attractedIds = attractedIds;
  return newState;
}

// --- applyCollisions ---

const collisionGrid = new SpatialGrid(null, { cellSize: 20 });

export function applyCollisions(state) {
  const entities = { ...state.entities };
  const entityList = Object.values(entities);
  const circles = [];
  const walls = [];

  for (const e of entityList) {
    if (e.shape === SHAPE_CIRCLE) circles.push(e);
    else if (e.shape === SHAPE_WALL) walls.push(e);
  }

  const allObjects = [...circles, ...walls];
  collisionGrid.populate(allObjects);
  const possibleCollisions = collisionGrid.populatedCells();

  if (!possibleCollisions || possibleCollisions.length === 0) {
    return state;
  }

  const collisionMap = {};
  const collisionEvents = [];
  let changed = false;

  for (const objects of possibleCollisions) {
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        let e1 = entities[objects[i].id] || objects[i];
        let e2 = entities[objects[j].id] || objects[j];

        if (e1.solid && e2.solid) continue;

        const alreadyHandled =
          collisionMap[e1.id] && collisionMap[e1.id][e2.id];
        if (alreadyHandled) continue;

        // Determine colliding (non-solid) vs receiving entity
        const collidingId = !e1.solid ? e1.id : e2.id;
        const receivingId = !e1.solid ? e2.id : e1.id;
        const colliding = entities[collidingId] || e1;
        const receiving = entities[receivingId] || e2;

        // Collision detection (physics.js handles Vector wrapping internally)
        let detected = false;
        if (receiving.shape === SHAPE_CIRCLE) {
          detected = collisionDetectionBallToBall(colliding, receiving);
        } else if (receiving.shape === SHAPE_WALL) {
          detected = collisionDetectionBallToWall(colliding, receiving);
        }

        if (!detected) continue;

        // Compute relative speed before resolution
        let relSpeed = 0;
        if (colliding.velocity && receiving.velocity) {
          const relVel = vec(colliding.velocity).subtract(vec(receiving.velocity));
          const normal = vec(colliding.pos).subtract(vec(receiving.pos)).unit();
          relSpeed = Math.abs(Vector.dot(relVel, normal));
        }

        // Penetration resolution
        let penRes;
        if (receiving.shape === SHAPE_CIRCLE) {
          penRes = penetrationResolutionBallToBall(colliding, receiving);
        } else {
          penRes = penetrationResolutionBallToWall(colliding, receiving);
        }

        // Velocity resolution
        let velRes;
        if (receiving.shape === SHAPE_CIRCLE) {
          velRes = collisionResolutionBallToBall(colliding, receiving);
        } else {
          velRes = collisionResolutionBallToWall(colliding, receiving);
        }

        // Apply to colliding entity
        entities[collidingId] = {
          ...entities[collidingId],
          previousPos: { ...entities[collidingId].pos },
          pos: plain(penRes.entity1),
          velocity: plain(velRes.entity1),
        };
        changed = true;

        // Apply to receiving entity (only if not solid)
        if (!receiving.solid && penRes.entity2 && velRes.entity2) {
          entities[receivingId] = {
            ...entities[receivingId],
            previousPos: { ...entities[receivingId].pos },
            pos: plain(penRes.entity2),
            velocity: plain(velRes.entity2),
          };
        }

        // Mark pair as handled
        collisionMap[collidingId] = {
          ...collisionMap[collidingId],
          [receivingId]: true,
        };
        collisionMap[receivingId] = {
          ...collisionMap[receivingId],
          [collidingId]: true,
        };

        // Record collision event for asteroid processing
        collisionEvents.push({
          collidingId,
          receivingId,
          relSpeed,
        });
      }
    }
  }

  return changed
    ? { ...state, entities, collisionEvents }
    : { ...state, collisionEvents: [] };
}

// --- processAsteroidOutcomes ---

export function processAsteroidOutcomes(state) {
  const { collisionEvents = [], attractedIds = [], entities } = state;
  if (collisionEvents.length === 0) {
    return tickInvulnerability(state);
  }

  const attractedSet = new Set(attractedIds);
  const newEntities = { ...entities };
  const toDestroy = new Set();
  const toSpawn = [];
  let changed = false;

  for (const { collidingId, receivingId, relSpeed } of collisionEvents) {
    const colliding = newEntities[collidingId];
    const receiving = newEntities[receivingId];
    if (!colliding || !receiving) continue;

    // Process each entity in the collision pair
    processEntityCollision(colliding, receiving, relSpeed, attractedSet, toDestroy, toSpawn, newEntities);
    processEntityCollision(receiving, colliding, relSpeed, attractedSet, toDestroy, toSpawn, newEntities);
  }

  // Apply destroys
  for (const id of toDestroy) {
    delete newEntities[id];
    changed = true;
  }

  // Tick invulnerability on existing entities (before adding new spawns)
  for (const id in newEntities) {
    const e = newEntities[id];
    if (e.type === "ball" && e.invulnerable > 0) {
      newEntities[id] = { ...e, invulnerable: e.invulnerable - 1 };
      changed = true;
    }
  }

  // Apply spawns (after ticking, so new children keep their full invulnerability)
  for (const entity of toSpawn) {
    newEntities[entity.id] = entity;
    changed = true;
  }

  return changed
    ? { ...state, entities: newEntities, collisionEvents: [] }
    : { ...state, collisionEvents: [] };
}

function processEntityCollision(self, other, relSpeed, attractedSet, toDestroy, toSpawn, entities) {
  // Only balls (type "ball") have collision outcomes
  if (self.type !== "ball") return;
  if (toDestroy.has(self.id)) return;
  if (self.invulnerable > 0) return;
  if (other.shape === SHAPE_WALL) return;

  // Non-ball collision (player hit)
  if (other.type !== "ball") {
    // Attracted + attracting player = immune
    if (attractedSet.has(self.id) && other.attraction === 1) return;
    // Break
    spawnBreak(self, toDestroy, toSpawn);
    return;
  }

  // Ball-to-ball collision
  const bothAttracted = attractedSet.has(self.id) && attractedSet.has(other.id);
  const durability = attractedSet.has(self.id) ? ATTRACT_DURABILITY_MULTIPLIER : 1;
  const outcome = asteroidCollisionOutcome(self.mass, other.mass, relSpeed, durability);

  if (outcome === "break" && !bothAttracted) {
    spawnBreak(self, toDestroy, toSpawn);
  } else if (outcome === "absorb" && !toDestroy.has(other.id)) {
    // Absorb: grow self, destroy other
    const newMass = self.mass + other.mass;
    entities[self.id] = {
      ...entities[self.id],
      mass: newMass,
      radius: Math.sqrt(newMass),
      inverseMass: newMass === 0 ? 0 : 1 / newMass,
    };
    toDestroy.add(other.id);
  }
}

function spawnBreak(entity, toDestroy, toSpawn) {
  toDestroy.add(entity.id);

  const childRadius = entity.radius * CHILD_SCALE;
  if (childRadius < MIN_BREAK_RADIUS) return; // Too small, just destroy

  const vel = vec(entity.velocity);
  const perpendicular =
    vel.magnitude() > 0.01
      ? new Vector(-vel.y, vel.x).unit()
      : new Vector(1, 0);

  const offset = perpendicular.multiply(childRadius * 1.5);
  const spread = perpendicular.multiply(40);

  const child1 = makeChildAsteroid(
    { x: entity.pos.x + offset.x, y: entity.pos.y + offset.y },
    childRadius,
    plain(vel.add(spread)),
  );

  const child2 = makeChildAsteroid(
    { x: entity.pos.x - offset.x, y: entity.pos.y - offset.y },
    childRadius,
    plain(vel.subtract(spread)),
  );

  toSpawn.push(child1, child2);
}

let nextChildId = 0;

function makeChildAsteroid(pos, radius, velocity) {
  const mass = radius * radius;
  return {
    id: `circle-child-${nextChildId++}-${Date.now()}`,
    type: "ball",
    shape: SHAPE_CIRCLE,
    pos: { ...pos },
    previousPos: { ...pos },
    velocity: { ...velocity },
    direction: 0,
    acceleration: 1,
    radius,
    mass,
    inverseMass: 1 / mass,
    elasticity: 1,
    invulnerable: 30,
    solid: false,
  };
}

function tickInvulnerability(state) {
  const entities = { ...state.entities };
  let changed = false;

  for (const id in entities) {
    const e = entities[id];
    if (e.type === "ball" && e.invulnerable > 0) {
      entities[id] = { ...e, invulnerable: e.invulnerable - 1 };
      changed = true;
    }
  }

  return changed ? { ...state, entities } : state;
}

// --- Reducer ---

export function reducer(state, action) {
  switch (action.type) {
    case "STEP": {
      let s = state;
      s = applyInputs(s, action.inputs);
      s = applyGravity(s);
      s = applyCollisions(s);
      s = processAsteroidOutcomes(s);
      s = applyPhysicsTick(s, action.delta);
      s = { ...s, frame: s.frame + 1 };
      return s;
    }
    case "ENTITY_SPAWN": {
      return {
        ...state,
        entities: {
          ...state.entities,
          [action.entity.id]: action.entity,
        },
      };
    }
    case "ENTITY_DESTROY": {
      const entities = { ...state.entities };
      delete entities[action.entityId];
      return { ...state, entities };
    }
    default:
      return state;
  }
}
