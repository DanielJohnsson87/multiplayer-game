import { describe, it, expect, vi } from "vitest";
import {
  createRenderer,
  generateAsteroidRenderData,
  drawPlayer,
  drawWall,
  drawAsteroid,
  drawAttractionField,
  seededRandom,
} from "./renderer";
import { SHAPE_CIRCLE, SHAPE_WALL } from "./constants";

// --- Mock canvas context ---

function mockCtx() {
  return {
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "",
    textBaseline: "",
    fillText: vi.fn(),
  };
}

// --- Test entity factories ---

function makePlayer(id, overrides = {}) {
  return {
    id,
    type: "player",
    shape: SHAPE_CIRCLE,
    pos: { x: 100, y: 200 },
    previousPos: { x: 98, y: 200 },
    velocity: { x: 2, y: 0 },
    direction: 45,
    radius: 20,
    mass: 400,
    inverseMass: 1 / 400,
    elasticity: 0.5,
    attraction: 0,
    adapterType: "keyboard",
    ...overrides,
  };
}

function makeBall(id, overrides = {}) {
  return {
    id,
    type: "ball",
    shape: SHAPE_CIRCLE,
    pos: { x: 150, y: 250 },
    previousPos: { x: 149, y: 250 },
    velocity: { x: 1, y: 0 },
    direction: 0,
    radius: 20,
    mass: 400,
    inverseMass: 1 / 400,
    elasticity: 1,
    invulnerable: 0,
    ...overrides,
  };
}

function makeWall(id, overrides = {}) {
  return {
    id,
    type: "wall",
    shape: SHAPE_WALL,
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    elasticity: 2.5,
    width: 14,
    solid: true,
    ...overrides,
  };
}

// --- Tests ---

describe("seededRandom", () => {
  it("produces deterministic sequence from same seed", () => {
    const rng1 = seededRandom(42);
    const rng2 = seededRandom(42);
    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("produces different sequences from different seeds", () => {
    const rng1 = seededRandom(42);
    const rng2 = seededRandom(99);
    const vals1 = Array.from({ length: 5 }, () => rng1());
    const vals2 = Array.from({ length: 5 }, () => rng2());
    expect(vals1).not.toEqual(vals2);
  });
});

describe("generateAsteroidRenderData", () => {
  it("generates deterministic data from position seed", () => {
    const rd1 = generateAsteroidRenderData({ x: 100, y: 200 });
    const rd2 = generateAsteroidRenderData({ x: 100, y: 200 });
    expect(rd1.asteroidColor).toBe(rd2.asteroidColor);
    expect(rd1.asteroidVertices).toEqual(rd2.asteroidVertices);
    expect(rd1.craters).toEqual(rd2.craters);
    expect(rd1.rotationSpeed).toBe(rd2.rotationSpeed);
    expect(rd1.currentRotation).toBe(rd2.currentRotation);
  });

  it("produces different data for different positions", () => {
    const rd1 = generateAsteroidRenderData({ x: 100, y: 200 });
    const rd2 = generateAsteroidRenderData({ x: 300, y: 400 });
    // Extremely unlikely to match
    expect(rd1.asteroidVertices).not.toEqual(rd2.asteroidVertices);
  });

  it("generates 7-10 vertices and 1-2 craters", () => {
    const rd = generateAsteroidRenderData({ x: 50, y: 75 });
    expect(rd.asteroidVertices.length).toBeGreaterThanOrEqual(7);
    expect(rd.asteroidVertices.length).toBeLessThanOrEqual(10);
    expect(rd.craters.length).toBeGreaterThanOrEqual(1);
    expect(rd.craters.length).toBeLessThanOrEqual(2);
  });

  it("picks a valid asteroid color", () => {
    const validColors = ["#8B7355", "#A0926B", "#7A6B52", "#9C8E74", "#6B5E47"];
    const rd = generateAsteroidRenderData({ x: 10, y: 20 });
    expect(validColors).toContain(rd.asteroidColor);
  });
});

describe("drawPlayer", () => {
  it("draws spaceship for keyboard adapter type", () => {
    const ctx = mockCtx();
    const entity = makePlayer("p1", { adapterType: "keyboard" });
    drawPlayer(ctx, entity, 0.5);
    // Should have save/restore from spaceship draw
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
    expect(ctx.translate).toHaveBeenCalled();
    expect(ctx.rotate).toHaveBeenCalled();
  });

  it("draws spaceship for touch adapter type", () => {
    const ctx = mockCtx();
    const entity = makePlayer("p1", { adapterType: "touch" });
    drawPlayer(ctx, entity, 0.5);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it("draws enemy ship for ai adapter type", () => {
    const ctx = mockCtx();
    const entity = makePlayer("p1", { adapterType: "ai" });
    drawPlayer(ctx, entity, 0.5);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });
});

describe("drawAttractionField", () => {
  it("draws when attraction is non-zero", () => {
    const ctx = mockCtx();
    const entity = makePlayer("p1", { attraction: 1 });
    drawAttractionField(ctx, entity, 0.5);
    // Attraction field draws outer glow + 4 pulsing rings = multiple arcs
    expect(ctx.arc.mock.calls.length).toBeGreaterThanOrEqual(5);
  });

  it("skips when attraction is zero", () => {
    const ctx = mockCtx();
    const entity = makePlayer("p1", { attraction: 0 });
    drawAttractionField(ctx, entity, 0.5);
    expect(ctx.arc).not.toHaveBeenCalled();
  });
});

describe("drawWall", () => {
  it("draws line from start to end", () => {
    const ctx = mockCtx();
    const entity = makeWall("w1");
    drawWall(ctx, entity);
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(100, 0);
    expect(ctx.stroke).toHaveBeenCalled();
  });
});

describe("drawAsteroid", () => {
  it("advances rotation each frame", () => {
    const ctx = mockCtx();
    const entity = makeBall("b1");
    const rd = generateAsteroidRenderData(entity.pos);
    const initialRotation = rd.currentRotation;
    drawAsteroid(ctx, entity, 0.5, rd);
    expect(rd.currentRotation).not.toBe(initialRotation);
  });

  it("draws asteroid shape with vertices", () => {
    const ctx = mockCtx();
    const entity = makeBall("b1");
    const rd = generateAsteroidRenderData(entity.pos);
    drawAsteroid(ctx, entity, 0.5, rd);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.translate).toHaveBeenCalled();
    expect(ctx.rotate).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });
});

describe("createRenderer", () => {
  it("draws all entity types in a single pass", () => {
    const ctx = mockCtx();
    const state = {
      entities: {
        "w1": makeWall("w1"),
        "b1": makeBall("b1"),
        "p1": makePlayer("p1"),
      },
    };
    const { render } = createRenderer(() => state);
    render(0.5, ctx);

    // All types should trigger canvas operations
    expect(ctx.beginPath.mock.calls.length).toBeGreaterThan(0);
    expect(ctx.save.mock.calls.length).toBeGreaterThanOrEqual(2); // player + asteroid
  });

  it("creates render cache entry for new asteroids", () => {
    const ctx = mockCtx();
    const state = {
      entities: { "b1": makeBall("b1") },
    };
    const { render, renderCache } = createRenderer(() => state);
    expect(renderCache.size).toBe(0);
    render(0.5, ctx);
    expect(renderCache.size).toBe(1);
    expect(renderCache.has("b1")).toBe(true);
  });

  it("reuses existing render cache entries", () => {
    const ctx = mockCtx();
    const state = {
      entities: { "b1": makeBall("b1") },
    };
    const { render, renderCache } = createRenderer(() => state);
    render(0.5, ctx);
    const cached = renderCache.get("b1");
    render(0.5, ctx);
    expect(renderCache.get("b1")).toBe(cached); // same reference
  });

  it("cleans up cache for removed entities", () => {
    const ctx = mockCtx();
    const entities = { "b1": makeBall("b1"), "b2": makeBall("b2", { pos: { x: 300, y: 300 }, previousPos: { x: 300, y: 300 } }) };
    const state = { entities };
    const { render, renderCache } = createRenderer(() => state);

    render(0.5, ctx);
    expect(renderCache.size).toBe(2);

    // Remove b2
    delete state.entities["b2"];
    render(0.5, ctx);
    expect(renderCache.size).toBe(1);
    expect(renderCache.has("b1")).toBe(true);
    expect(renderCache.has("b2")).toBe(false);
  });
});
