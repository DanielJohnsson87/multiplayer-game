import { describe, it, expect, vi } from "vitest";
import {
  applyPhysicsTick,
  applyInputs,
  applyGravity,
  applyCollisions,
  processAsteroidOutcomes,
  actionsToRotation,
  actionsToAcceleration,
  actionToAttraction,
  reducer,
} from "./reducer";
import {
  SHAPE_CIRCLE,
  SHAPE_WALL,
  ACTION_MOVE_UP,
  ACTION_MOVE_DOWN,
  ACTION_ROTATE_RIGHT,
  ACTION_ROTATE_LEFT,
  ACTION_ATTRACT,
  ACTION_REPELL,
  GRAVITATATIONAL_MASS_FACTOR,
} from "./constants";

// --- Helpers ---

function makeCircle(x, y, r, vx = 0, vy = 0, overrides = {}) {
  const mass = r * r;
  return {
    id: overrides.id || `circle-test-${Math.random().toString(36).slice(2)}`,
    type: overrides.type || "ball",
    shape: SHAPE_CIRCLE,
    pos: { x, y },
    previousPos: { x, y },
    velocity: { x: vx, y: vy },
    direction: 0,
    acceleration: 1,
    radius: r,
    mass,
    inverseMass: 1 / mass,
    elasticity: overrides.elasticity ?? 1,
    invulnerable: overrides.invulnerable ?? 0,
    solid: false,
    ...overrides,
  };
}

function makePlayer(x, y, r = 20, overrides = {}) {
  const mass = r * r;
  return {
    ...makeCircle(x, y, r, 0, 0, { type: "player", ...overrides }),
    initialMass: mass,
    attraction: 0,
    acceleration: overrides.acceleration ?? 5,
  };
}

function makeWall(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const mag = Math.sqrt(dx * dx + dy * dy);
  return {
    id: `wall-test-${Math.random().toString(36).slice(2)}`,
    type: "wall",
    shape: SHAPE_WALL,
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    elasticity: 2.5,
    width: 14,
    solid: true,
    unit() {
      return { x: dx / mag, y: dy / mag };
    },
  };
}

function makeState(entityList = []) {
  const entities = {};
  for (const e of entityList) entities[e.id] = e;
  return { entities, attractedIds: [], frame: 0, collisionEvents: [] };
}

// --- Input helper tests ---

describe("actionsToRotation", () => {
  it("rotates right", () => {
    expect(actionsToRotation({ [ACTION_ROTATE_RIGHT]: 1.0 })).toBe(7.5);
  });

  it("rotates left", () => {
    expect(actionsToRotation({ [ACTION_ROTATE_LEFT]: 1.0 })).toBe(-7.5);
  });

  it("scales with input delta", () => {
    expect(actionsToRotation({ [ACTION_ROTATE_RIGHT]: 0.5 })).toBe(3.75);
  });

  it("returns 0 for no rotation input", () => {
    expect(actionsToRotation({})).toBe(0);
  });
});

describe("actionsToAcceleration", () => {
  it("returns up vector", () => {
    const acc = actionsToAcceleration({ [ACTION_MOVE_UP]: 0.5 });
    expect(acc.x).toBe(0);
    expect(acc.y).toBe(-0.5);
  });

  it("returns down vector", () => {
    const acc = actionsToAcceleration({ [ACTION_MOVE_DOWN]: 0.3 });
    expect(acc.x).toBe(0);
    expect(acc.y).toBeCloseTo(0.3);
  });

  it("returns null for no movement input", () => {
    expect(actionsToAcceleration({})).toBeNull();
  });
});

describe("actionToAttraction", () => {
  it("attract sets mass to initialMass * factor", () => {
    expect(actionToAttraction(400, { [ACTION_ATTRACT]: 1 })).toBe(400 * GRAVITATATIONAL_MASS_FACTOR);
  });

  it("repel sets mass to negative", () => {
    expect(actionToAttraction(400, { [ACTION_REPELL]: 1 })).toBe(400 * -GRAVITATATIONAL_MASS_FACTOR);
  });

  it("returns 0 for no attraction input", () => {
    expect(actionToAttraction(400, {})).toBe(0);
  });
});

// --- applyPhysicsTick ---

describe("applyPhysicsTick", () => {
  it("applies friction to velocity", () => {
    const c = makeCircle(100, 100, 10, 100, 0);
    const state = makeState([c]);
    const next = applyPhysicsTick(state, 1);
    const e = next.entities[c.id];
    // friction: vel * (1 - 0.2 * delta), delta = 1 → vel * 0.8
    expect(e.velocity.x).toBeCloseTo(80);
    expect(e.velocity.y).toBe(0);
  });

  it("moves position by velocity * delta", () => {
    const c = makeCircle(100, 100, 10, 100, 0);
    const state = makeState([c]);
    const next = applyPhysicsTick(state, 1);
    const e = next.entities[c.id];
    // After friction: vel=80, movement=80*1=80
    expect(e.pos.x).toBeCloseTo(180);
    expect(e.pos.y).toBe(100);
  });

  it("stores previousPos", () => {
    const c = makeCircle(50, 60, 10, 10, 20);
    const state = makeState([c]);
    const next = applyPhysicsTick(state, 0.5);
    expect(next.entities[c.id].previousPos).toEqual({ x: 50, y: 60 });
  });

  it("stationary object stays put", () => {
    const c = makeCircle(100, 100, 10, 0, 0);
    const state = makeState([c]);
    const next = applyPhysicsTick(state, 1);
    expect(next.entities[c.id].pos).toEqual({ x: 100, y: 100 });
  });

  it("does not modify walls", () => {
    const w = makeWall(0, 0, 100, 0);
    const state = makeState([w]);
    const next = applyPhysicsTick(state, 1);
    expect(next.entities[w.id]).toEqual(w);
  });

  it("multiple ticks converge velocity toward zero", () => {
    const c = makeCircle(0, 0, 10, 100, 100);
    let state = makeState([c]);
    for (let i = 0; i < 50; i++) {
      state = applyPhysicsTick(state, 0.5);
    }
    const e = state.entities[c.id];
    expect(Math.abs(e.velocity.x)).toBeLessThan(1);
    expect(Math.abs(e.velocity.y)).toBeLessThan(1);
  });
});

// --- applyInputs ---

describe("applyInputs", () => {
  it("applies rotation to player", () => {
    const p = makePlayer(100, 100);
    const state = makeState([p]);
    const next = applyInputs(state, [
      { playerId: p.id, actions: { [ACTION_ROTATE_RIGHT]: 1.0 } },
    ]);
    expect(next.entities[p.id].direction).toBe(7.5);
  });

  it("applies acceleration relative to direction", () => {
    const p = makePlayer(100, 100);
    const state = makeState([p]);
    const next = applyInputs(state, [
      { playerId: p.id, actions: { [ACTION_MOVE_UP]: 1.0 } },
    ]);
    // Direction 0 → up is {0, -1}, acceleration=5 → velocity {0, -5}
    expect(next.entities[p.id].velocity.x).toBeCloseTo(0);
    expect(next.entities[p.id].velocity.y).toBeCloseTo(-5);
  });

  it("sets attraction when attracting", () => {
    const p = makePlayer(100, 100);
    const state = makeState([p]);
    const next = applyInputs(state, [
      { playerId: p.id, actions: { [ACTION_ATTRACT]: 1 } },
    ]);
    expect(next.entities[p.id].attraction).toBe(1);
    expect(next.entities[p.id].mass).toBe(p.initialMass * GRAVITATATIONAL_MASS_FACTOR);
  });

  it("sets repulsion when repelling", () => {
    const p = makePlayer(100, 100);
    const state = makeState([p]);
    const next = applyInputs(state, [
      { playerId: p.id, actions: { [ACTION_REPELL]: 1 } },
    ]);
    expect(next.entities[p.id].attraction).toBe(-1);
  });

  it("restores mass when no attraction input", () => {
    const p = makePlayer(100, 100);
    // Start with altered mass
    p.mass = 99999;
    const state = makeState([p]);
    const next = applyInputs(state, [
      { playerId: p.id, actions: {} },
    ]);
    expect(next.entities[p.id].mass).toBe(p.initialMass);
  });

  it("returns same state if no inputs", () => {
    const state = makeState([makePlayer(100, 100)]);
    expect(applyInputs(state, [])).toBe(state);
  });

  it("ignores inputs for non-player entities", () => {
    const b = makeCircle(100, 100, 20);
    const state = makeState([b]);
    const next = applyInputs(state, [
      { playerId: b.id, actions: { [ACTION_MOVE_UP]: 1.0 } },
    ]);
    expect(next).toBe(state);
  });
});

// --- applyGravity ---

describe("applyGravity", () => {
  it("gravity from multiple sources accumulates on same entity", () => {
    // Two attracting players on either side of a ball — both should add velocity
    const p1 = makePlayer(50, 100, 20, { id: "p1" });
    p1.attraction = 1;
    p1.mass = 400 * 10; // attracting mass
    const p2 = makePlayer(250, 100, 20, { id: "p2" });
    p2.attraction = 1;
    p2.mass = 400 * 10;
    const ball = makeCircle(150, 100, 10, 0, 0, { id: "b1" });
    const state = makeState([p1, p2, ball]);
    const next = applyGravity(state);
    const b = next.entities["b1"];
    // Ball is equidistant from both — forces should roughly cancel on x,
    // but both should have contributed (not one overwriting the other).
    // If the bug existed, only the last attractor's force would be applied.
    // With accumulation, the ball gets pulled left by p1 AND right by p2.
    // Since they're symmetric, x velocity should be near 0 (both forces cancel).
    expect(b.velocity.x).toBeCloseTo(0, 0);
  });

  it("tracks attractedIds for attracted entities", () => {
    const p = makePlayer(100, 100, 20, { id: "p1" });
    p.attraction = 1;
    p.mass = 400 * 10;
    const ball = makeCircle(120, 100, 10, 0, 0, { id: "b1" });
    const state = makeState([p, ball]);
    const next = applyGravity(state);
    expect(next.attractedIds).toContain("b1");
  });
});

// --- applyCollisions ---

describe("applyCollisions", () => {
  it("two overlapping circles get separated and bounce", () => {
    const c1 = makeCircle(100, 100, 20, 50, 0, { id: "c1" });
    const c2 = makeCircle(130, 100, 20, -50, 0, { id: "c2" });
    const state = makeState([c1, c2]);
    const next = applyCollisions(state);
    const e1 = next.entities["c1"];
    const e2 = next.entities["c2"];
    // After collision, they should be moving apart
    expect(e1.velocity.x).toBeLessThan(0);
    expect(e2.velocity.x).toBeGreaterThan(0);
    // They should be separated
    const dx = e2.pos.x - e1.pos.x;
    expect(dx).toBeGreaterThanOrEqual(39); // roughly r1+r2
  });

  it("circle bounces off wall", () => {
    // Circle at x=5, radius=20, moving left into wall at x=0
    const c = makeCircle(12, 100, 20, -50, 0, { id: "c1" });
    const w = makeWall(0, 0, 0, 600);
    const state = makeState([c, w]);
    const next = applyCollisions(state);
    const e = next.entities["c1"];
    // Should bounce: velocity.x should be positive
    expect(e.velocity.x).toBeGreaterThan(0);
  });

  it("solid-solid pairs are skipped", () => {
    const w1 = makeWall(0, 0, 100, 0);
    const w2 = makeWall(50, 0, 50, 100);
    const state = makeState([w1, w2]);
    const next = applyCollisions(state);
    expect(next.entities[w1.id]).toEqual(w1);
    expect(next.entities[w2.id]).toEqual(w2);
  });

  it("records collision events", () => {
    const c1 = makeCircle(100, 100, 20, 50, 0, { id: "c1" });
    const c2 = makeCircle(130, 100, 20, -50, 0, { id: "c2" });
    const state = makeState([c1, c2]);
    const next = applyCollisions(state);
    expect(next.collisionEvents.length).toBeGreaterThan(0);
    expect(next.collisionEvents[0]).toHaveProperty("relSpeed");
  });
});

// --- processAsteroidOutcomes ---

describe("processAsteroidOutcomes", () => {
  it("ticks invulnerability", () => {
    const b = makeCircle(100, 100, 20, 0, 0, {
      id: "b1",
      type: "ball",
      invulnerable: 5,
    });
    const state = makeState([b]);
    const next = processAsteroidOutcomes(state);
    expect(next.entities["b1"].invulnerable).toBe(4);
  });

  it("breaks asteroid hit by player", () => {
    const b = makeCircle(100, 100, 20, 0, 0, { id: "b1", type: "ball" });
    const p = makePlayer(120, 100, 20, { id: "p1" });
    const state = {
      ...makeState([b, p]),
      collisionEvents: [
        { collidingId: "b1", receivingId: "p1", relSpeed: 100 },
      ],
    };
    const next = processAsteroidOutcomes(state);
    // Original asteroid destroyed, children spawned
    expect(next.entities["b1"]).toBeUndefined();
    const children = Object.values(next.entities).filter(
      (e) => e.type === "ball"
    );
    expect(children.length).toBe(2);
    expect(children[0].radius).toBeCloseTo(20 * 0.6);
    expect(children[0].invulnerable).toBe(30);
  });

  it("does not break invulnerable asteroid", () => {
    const b = makeCircle(100, 100, 20, 0, 0, {
      id: "b1",
      type: "ball",
      invulnerable: 10,
    });
    const p = makePlayer(120, 100, 20, { id: "p1" });
    const state = {
      ...makeState([b, p]),
      collisionEvents: [
        { collidingId: "b1", receivingId: "p1", relSpeed: 100 },
      ],
    };
    const next = processAsteroidOutcomes(state);
    expect(next.entities["b1"]).toBeDefined();
  });

  it("destroys tiny asteroid without spawning children", () => {
    const b = makeCircle(100, 100, 8, 0, 0, { id: "b1", type: "ball" });
    const p = makePlayer(115, 100, 20, { id: "p1" });
    const state = {
      ...makeState([b, p]),
      collisionEvents: [
        { collidingId: "b1", receivingId: "p1", relSpeed: 100 },
      ],
    };
    const next = processAsteroidOutcomes(state);
    expect(next.entities["b1"]).toBeUndefined();
    const balls = Object.values(next.entities).filter(
      (e) => e.type === "ball"
    );
    expect(balls.length).toBe(0);
  });

  it("attracted asteroid is immune to attracting player", () => {
    const b = makeCircle(100, 100, 20, 0, 0, { id: "b1", type: "ball" });
    const p = makePlayer(120, 100, 20, { id: "p1" });
    p.attraction = 1;
    const state = {
      ...makeState([b, p]),
      attractedIds: ["b1"],
      collisionEvents: [
        { collidingId: "b1", receivingId: "p1", relSpeed: 100 },
      ],
    };
    const next = processAsteroidOutcomes(state);
    expect(next.entities["b1"]).toBeDefined();
  });
});

// --- Full reducer ---

describe("reducer", () => {
  it("STEP increments frame counter", () => {
    const state = makeState([]);
    const next = reducer(state, { type: "STEP", delta: 0.016, inputs: [] });
    expect(next.frame).toBe(1);
  });

  it("ENTITY_SPAWN adds entity", () => {
    const entity = makeCircle(50, 50, 10, 0, 0, { id: "new1" });
    const state = makeState([]);
    const next = reducer(state, { type: "ENTITY_SPAWN", entity });
    expect(next.entities["new1"]).toBeDefined();
  });

  it("ENTITY_DESTROY removes entity", () => {
    const c = makeCircle(50, 50, 10, 0, 0, { id: "c1" });
    const state = makeState([c]);
    const next = reducer(state, { type: "ENTITY_DESTROY", entityId: "c1" });
    expect(next.entities["c1"]).toBeUndefined();
  });

  it("STEP runs full physics pipeline", () => {
    const p = makePlayer(100, 100, 20, { id: "p1" });
    const state = makeState([p]);
    const next = reducer(state, {
      type: "STEP",
      delta: 1 / 61,
      inputs: [{ playerId: "p1", actions: { [ACTION_MOVE_UP]: 1.0 } }],
    });
    // Player should have moved upward
    expect(next.entities["p1"].velocity.y).toBeLessThan(0);
    expect(next.frame).toBe(1);
  });

  it("unknown action returns state unchanged", () => {
    const state = makeState([]);
    expect(reducer(state, { type: "UNKNOWN" })).toBe(state);
  });
});
