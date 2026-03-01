import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildInitialState } from "./gameRunner";
import {
  SHAPE_CIRCLE,
  SHAPE_WALL,
  ACTION_MOVE_UP,
  ACTION_ATTRACT,
} from "./constants";

// --- Mock helpers ---

function makeWorldCircle(id, x, y, r, overrides = {}) {
  const mass = r * r;
  return {
    id,
    shape: SHAPE_CIRCLE,
    pos: { x, y },
    previousPos: { x, y },
    velocity: { x: 0, y: 0 },
    direction: 0,
    acceleration: 1,
    radius: r,
    mass,
    inverseMass: 1 / mass,
    elasticity: 1,
    solid: false,
    _invulnerable: 0,
    ...overrides,
  };
}

function makeWorldPlayer(id, x, y, r, adapterType = "ai") {
  const mass = r * r;
  return {
    ...makeWorldCircle(id, x, y, r),
    initialMass: mass,
    attraction: 0,
    acceleration: 5,
    elasticity: 0.5,
    adapter: {
      type: () => adapterType,
      readAndClearActions: vi.fn().mockReturnValue([]),
    },
  };
}

function makeWorldWall(id, x1, y1, x2, y2) {
  return {
    id,
    shape: SHAPE_WALL,
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    elasticity: 2.5,
    width: 14,
    solid: true,
  };
}

// --- buildInitialState tests ---

describe("buildInitialState", () => {
  it("builds state from circles and walls", () => {
    const ball = makeWorldCircle("ball-1", 100, 200, 20);
    const wall = makeWorldWall("wall-1", 0, 0, 100, 0);
    const state = buildInitialState([ball, wall]);

    expect(state.frame).toBe(0);
    expect(state.attractedIds).toEqual([]);
    expect(state.collisionEvents).toEqual([]);
    expect(Object.keys(state.entities)).toHaveLength(2);
  });

  it("creates correct ball entity shape", () => {
    const ball = makeWorldCircle("ball-1", 50, 75, 15);
    const state = buildInitialState([ball]);
    const entity = state.entities["ball-1"];

    expect(entity).toEqual({
      id: "ball-1",
      type: "ball",
      shape: SHAPE_CIRCLE,
      pos: { x: 50, y: 75 },
      previousPos: { x: 50, y: 75 },
      velocity: { x: 0, y: 0 },
      direction: 0,
      acceleration: 1,
      radius: 15,
      mass: 225,
      inverseMass: 1 / 225,
      elasticity: 1,
      solid: false,
      invulnerable: 0,
    });
  });

  it("creates correct player entity shape", () => {
    const player = makeWorldPlayer("player-1", 30, 50, 20, "keyboard");
    const state = buildInitialState([player]);
    const entity = state.entities["player-1"];

    expect(entity.type).toBe("player");
    expect(entity.initialMass).toBe(400);
    expect(entity.attraction).toBe(0);
    expect(entity.adapterType).toBe("keyboard");
    expect(entity.acceleration).toBe(5);
  });

  it("creates correct wall entity shape", () => {
    const wall = makeWorldWall("wall-1", 0, 0, 100, 0);
    const state = buildInitialState([wall]);
    const entity = state.entities["wall-1"];

    expect(entity).toEqual({
      id: "wall-1",
      type: "wall",
      shape: SHAPE_WALL,
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
      elasticity: 2.5,
      width: 14,
      solid: true,
    });
  });

  it("handles invulnerable balls", () => {
    const ball = makeWorldCircle("ball-1", 50, 50, 10, { _invulnerable: 15 });
    const state = buildInitialState([ball]);
    expect(state.entities["ball-1"].invulnerable).toBe(15);
  });

  it("plain-copies positions (no shared references)", () => {
    const ball = makeWorldCircle("ball-1", 100, 200, 20);
    const state = buildInitialState([ball]);

    // Mutate original — state should be unaffected
    ball.pos.x = 999;
    expect(state.entities["ball-1"].pos.x).toBe(100);
  });
});

// --- createGameRunner integration tests ---
// These test the full runner with real reducer (no mocks for physics).
// We mock only the loop module (to capture the game-step callback) and the engine.

vi.mock("./loop", () => {
  const callbacks = {};
  return {
    default: {
      update: vi.fn((id, cb) => {
        callbacks[id] = cb;
      }),
      unsubscribeFrom: vi.fn(),
      _getCallback: (id) => callbacks[id],
    },
  };
});

describe("createGameRunner", () => {
  let engine;
  let ball1, ball2, player1, wall1;
  let loop;

  beforeEach(async () => {
    // Re-import loop mock for each test
    const loopMod = await import("./loop");
    loop = loopMod.default;
    loop.update.mockClear();
    loop.unsubscribeFrom.mockClear();

    ball1 = makeWorldCircle("ball-1", 100, 100, 20, { velocity: { x: 60, y: 0 } });
    ball2 = makeWorldCircle("ball-2", 300, 300, 15);
    player1 = makeWorldPlayer("player-1", 50, 50, 20, "keyboard");
    wall1 = makeWorldWall("wall-1", 0, 0, 0, 600);

    engine = {
      world: {
        getObjects: () => [wall1, ball1, ball2, player1],
        addObject: vi.fn(),
        removeObject: vi.fn(),
      },
      canvas: {
        getContext: () => ({}),
        draw: vi.fn(),
        removeDraw: vi.fn(),
      },
      loop,
    };
  });

  async function createAndInit() {
    const { createGameRunner } = await import("./gameRunner");
    const runner = createGameRunner(engine);
    runner.init();
    return runner;
  }

  function getGameStep() {
    return loop._getCallback("game-step");
  }

  it("subscribes game-step and unsubscribes old callbacks on init", async () => {
    await createAndInit();

    expect(loop.update).toHaveBeenCalledWith("game-step", expect.any(Function));
    expect(loop.unsubscribeFrom).toHaveBeenCalledWith("update", "gravity");
    expect(loop.unsubscribeFrom).toHaveBeenCalledWith("update", "collisions");
  });

  it("returns initial state with all entities", async () => {
    const runner = await createAndInit();
    const state = runner.getState();

    expect(Object.keys(state.entities)).toHaveLength(4);
    expect(state.entities["ball-1"]).toBeDefined();
    expect(state.entities["ball-2"]).toBeDefined();
    expect(state.entities["player-1"]).toBeDefined();
    expect(state.entities["wall-1"]).toBeDefined();
    expect(state.frame).toBe(0);
  });

  it("dispatches STEP and advances frame on game-step callback", async () => {
    const runner = await createAndInit();
    getGameStep()(1 / 60);

    expect(runner.getState().frame).toBe(1);
  });

  it("gathers inputs from adapters and applies them", async () => {
    player1.adapter.readAndClearActions.mockReturnValue([
      { actions: { [ACTION_MOVE_UP]: 0.5 } },
    ]);

    const runner = await createAndInit();
    getGameStep()(1 / 60);

    const state = runner.getState();
    // Player should have negative y velocity from upward thrust
    expect(state.entities["player-1"].velocity.y).toBeLessThan(0);
  });

  it("handles entity destruction", async () => {
    const runner = await createAndInit();

    // Manually destroy an entity via store
    runner.getStore().dispatch({
      type: "ENTITY_DESTROY",
      entityId: "ball-2",
    });

    // Trigger lifecycle handling
    getGameStep()(1 / 60);

    // ball-2 should be removed from state (after the STEP dispatched in game-step)
    // Since ENTITY_DESTROY was already dispatched, the STEP won't re-add it.
    // But the lifecycle detection happens at the end of game-step.
    // After game-step, ball-2 is not in state → instance should be cleaned up.
    // Actually, let's verify by checking state directly after the external dispatch:
    const stateAfterDestroy = runner.getState();
    expect(stateAfterDestroy.entities["ball-2"]).toBeUndefined();
  });

});

// --- Reducer mass reset fix verification ---

describe("applyInputs mass reset (regression)", () => {
  function makeTestPlayer(id) {
    const mass = 400;
    return {
      id,
      type: "player",
      shape: SHAPE_CIRCLE,
      pos: { x: 50, y: 50 },
      previousPos: { x: 50, y: 50 },
      velocity: { x: 0, y: 0 },
      direction: 0,
      acceleration: 5,
      radius: 20,
      mass,
      inverseMass: 1 / mass,
      elasticity: 0.5,
      solid: false,
      initialMass: mass,
      attraction: 0,
    };
  }

  it("preserves attraction when second input has no attract action", async () => {
    const { applyInputs } = await import("./reducer");

    const player = makeTestPlayer("p1");
    const state = {
      entities: { p1: player },
      attractedIds: [],
      frame: 0,
    };

    // Two input entries: first has attract, second doesn't
    const inputs = [
      { playerId: "p1", actions: { [ACTION_ATTRACT]: 1.0 } },
      { playerId: "p1", actions: { [ACTION_MOVE_UP]: 0.5 } },
    ];

    const result = applyInputs(state, inputs);
    expect(result.entities.p1.attraction).toBe(1);
    expect(result.entities.p1.mass).toBeGreaterThan(player.initialMass);
  });

  it("resets mass once per player per frame", async () => {
    const { applyInputs } = await import("./reducer");

    const player = makeTestPlayer("p1");
    player.attraction = 1;
    player.mass = player.initialMass * 10;
    player.inverseMass = 1 / player.mass;

    const state = {
      entities: { p1: player },
      attractedIds: [],
      frame: 0,
    };

    const inputs = [
      { playerId: "p1", actions: { [ACTION_MOVE_UP]: 0.5 } },
    ];

    const result = applyInputs(state, inputs);
    expect(result.entities.p1.mass).toBe(player.initialMass);
    expect(result.entities.p1.attraction).toBe(0);
  });
});
