import { describe, it, expect, vi } from "vitest";

vi.mock("../index", () => ({
  default: {
    world: { addObject: vi.fn(), removeObject: vi.fn() },
    canvas: {
      draw: vi.fn(),
      removeDraw: vi.fn(),
      getContext: vi.fn(() => ({
        beginPath: vi.fn(), closePath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
        arc: vi.fn(), stroke: vi.fn(), fill: vi.fn(), save: vi.fn(), restore: vi.fn(),
        strokeStyle: "", fillStyle: "", lineWidth: 1,
      })),
    },
    loop: { update: vi.fn(), unsubscribeFrom: vi.fn(), _unsafeDeltaTime: vi.fn(() => 0.016) },
    state: { setState: vi.fn() },
    gravity: { isAttracted: vi.fn(() => false) },
  },
}));

vi.mock("../adapters/Keyboard", () => ({
  default: class MockKeyboard {
    readAndClearActions() { return []; }
    type() { return "keyboard"; }
  },
}));

vi.mock("../adapters/AI", () => ({
  default: class MockAI {
    readAndClearActions() { return []; }
    type() { return "ai"; }
  },
}));

vi.mock("../adapters/Touch", () => ({
  default: class MockTouch {
    readAndClearActions() { return []; }
    type() { return "touch"; }
  },
}));

import Vector from "../../utils/vector";
import Circle from "./Circle";
import Player from "./Player";
import Wall from "./Wall";
import engine from "../index";

describe("object serialization", () => {
  describe("Circle", () => {
    it("serialize() returns physics properties", () => {
      const c = new Circle({ x: 10, y: 20 }, { radius: 15 });
      const s = c.serialize();
      expect(s.id).toBe(c.id);
      expect(s.pos).toEqual({ x: 10, y: 20 });
      expect(s.velocity).toEqual({ x: 0, y: 0 });
      expect(s.radius).toBe(15);
      expect(s.mass).toBe(c.mass);
      expect(s.shape).toBe("circle");
      expect(s.direction).toBe(0);
      expect(s.elasticity).toBe(1);
    });

    it("serialize() converts vectors to plain objects", () => {
      const c = new Circle({ x: 10, y: 20 });
      const s = c.serialize();
      expect(s.pos).not.toBeInstanceOf(Vector);
      expect(s.velocity).not.toBeInstanceOf(Vector);
      expect(s.pos.constructor).toBe(Object);
      expect(s.velocity.constructor).toBe(Object);
    });

    it("serialize() excludes non-serializable properties", () => {
      const c = new Circle({ x: 0, y: 0 });
      const s = c.serialize();
      expect(s).not.toHaveProperty("ctx");
      expect(s).not.toHaveProperty("tick");
      expect(s).not.toHaveProperty("previousPos");
      expect(s).not.toHaveProperty("inverseMass");
    });

    it("serialize() output is JSON-safe", () => {
      const c = new Circle({ x: 5, y: 10 }, { radius: 25 });
      const s = c.serialize();
      const roundtripped = JSON.parse(JSON.stringify(s));
      expect(roundtripped).toEqual(s);
    });
  });

  describe("Player", () => {
    it("serialize() includes attraction", () => {
      const p = new Player({ x: 0, y: 0 }, { adapter: "keyboard" });
      const s = p.serialize();
      expect(s).toHaveProperty("attraction");
      expect(typeof s.attraction).toBe("number");
    });

    it("serialize() excludes adapter", () => {
      const p = new Player({ x: 0, y: 0 }, { adapter: "keyboard" });
      const s = p.serialize();
      expect(s).not.toHaveProperty("adapter");
      expect(s).not.toHaveProperty("initialMass");
    });

    it("serialize() output is JSON-safe", () => {
      const p = new Player({ x: 0, y: 0 }, { adapter: "keyboard" });
      const s = p.serialize();
      const roundtripped = JSON.parse(JSON.stringify(s));
      expect(roundtripped).toEqual(s);
    });
  });

  describe("Wall", () => {
    it("serialize() returns expected properties", () => {
      const w = new Wall({ x: 0, y: 0 }, { x: 100, y: 50 });
      const s = w.serialize();
      expect(s.id).toBe(w.id);
      expect(s.start).toEqual({ x: 0, y: 0 });
      expect(s.end).toEqual({ x: 100, y: 50 });
      expect(s.shape).toBe("wall");
      expect(s.elasticity).toBe(2.5);
      expect(s.width).toBe(14);
    });

    it("serialize() converts vectors to plain objects", () => {
      const w = new Wall({ x: 0, y: 0 }, { x: 100, y: 50 });
      const s = w.serialize();
      expect(s.start).not.toBeInstanceOf(Vector);
      expect(s.end).not.toBeInstanceOf(Vector);
      expect(s.start.constructor).toBe(Object);
      expect(s.end.constructor).toBe(Object);
    });

    it("serialize() excludes ctx", () => {
      const w = new Wall({ x: 0, y: 0 }, { x: 100, y: 0 });
      const s = w.serialize();
      expect(s).not.toHaveProperty("ctx");
    });

    it("serialize() output is JSON-safe", () => {
      const w = new Wall({ x: 0, y: 0 }, { x: 100, y: 0 });
      const s = w.serialize();
      const roundtripped = JSON.parse(JSON.stringify(s));
      expect(roundtripped).toEqual(s);
    });
  });
});

describe("world integration", () => {
  it("Player registers itself with world on construction", () => {
    engine.world.addObject.mockClear();
    const p = new Player({ x: 0, y: 0 }, { adapter: "keyboard" });

    expect(engine.world.addObject).toHaveBeenCalledWith(p);
  });

  it("Player does not call setState", () => {
    engine.state.setState.mockClear();
    const p = new Player({ x: 0, y: 0 }, { adapter: "keyboard" });

    const updateCall = engine.loop.update.mock.calls.find(
      (c) => c[0] === `player-${p.id}`
    );
    updateCall[1](0.016);

    expect(engine.state.setState).not.toHaveBeenCalled();
  });
});
