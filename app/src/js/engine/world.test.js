import { describe, it, expect, beforeEach, vi } from "vitest";

describe("world", () => {
  let world;

  beforeEach(async () => {
    vi.resetModules();
    world = (await import("./world.js")).default;
  });

  it("starts empty", () => {
    expect(world.getObjects()).toEqual([]);
  });

  it("addObject makes it available via getObjects", () => {
    const obj = { id: "circle-1", shape: "circle" };
    world.addObject(obj);
    expect(world.getObjects()).toContain(obj);
  });

  it("holds multiple objects", () => {
    const a = { id: "circle-1", shape: "circle" };
    const b = { id: "wall-1", shape: "wall" };
    world.addObject(a);
    world.addObject(b);
    expect(world.getObjects()).toHaveLength(2);
    expect(world.getObjects()).toContain(a);
    expect(world.getObjects()).toContain(b);
  });

  it("removeObject removes by id", () => {
    const a = { id: "circle-1", shape: "circle" };
    const b = { id: "circle-2", shape: "circle" };
    world.addObject(a);
    world.addObject(b);
    world.removeObject("circle-1");
    expect(world.getObjects()).toHaveLength(1);
    expect(world.getObjects()).toContain(b);
  });

  it("removeObject with unknown id is a no-op", () => {
    const a = { id: "circle-1", shape: "circle" };
    world.addObject(a);
    world.removeObject("nonexistent");
    expect(world.getObjects()).toHaveLength(1);
  });

  it("getObjects returns the live array", () => {
    const ref1 = world.getObjects();
    const obj = { id: "circle-1", shape: "circle" };
    world.addObject(obj);
    const ref2 = world.getObjects();
    expect(ref2).toContain(obj);
  });
});
