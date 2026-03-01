import { describe, it, expect, vi } from "vitest";

vi.mock("../index", () => ({
  default: {
    world: { addObject: vi.fn(), removeObject: vi.fn() },
    canvas: {
      draw: vi.fn(),
      removeDraw: vi.fn(),
      getContext: vi.fn(() => ({})),
    },
    loop: { update: vi.fn(), unsubscribeFrom: vi.fn() },
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

import Circle from "./Circle";
import Player from "./Player";
import Wall from "./Wall";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("object IDs", () => {
  describe("Circle", () => {
    it("has a UUID-based id with circle prefix", () => {
      const c = new Circle({ x: 0, y: 0 });
      expect(c.id).toMatch(/^circle-/);
      expect(c.id.replace("circle-", "")).toMatch(UUID_REGEX);
    });

    it("generates unique ids across instances", () => {
      const a = new Circle({ x: 0, y: 0 });
      const b = new Circle({ x: 10, y: 10 });
      expect(a.id).not.toBe(b.id);
    });
  });

  describe("Player", () => {
    it("has a UUID-based id with circle prefix", () => {
      const p = new Player({ x: 0, y: 0 }, { adapter: "keyboard" });
      expect(p.id).toMatch(/^circle-/);
      expect(p.id.replace("circle-", "")).toMatch(UUID_REGEX);
    });

    it("generates unique ids across instances", () => {
      const a = new Player({ x: 0, y: 0 }, { adapter: "keyboard" });
      const b = new Player({ x: 10, y: 10 }, { adapter: "keyboard" });
      expect(a.id).not.toBe(b.id);
    });
  });

  describe("Wall", () => {
    it("has a UUID-based id with wall prefix", () => {
      const w = new Wall({ x: 0, y: 0 }, { x: 100, y: 0 });
      expect(w.id).toMatch(/^wall-/);
      expect(w.id.replace("wall-", "")).toMatch(UUID_REGEX);
    });

    it("generates unique ids across instances", () => {
      const a = new Wall({ x: 0, y: 0 }, { x: 100, y: 0 });
      const b = new Wall({ x: 0, y: 100 }, { x: 100, y: 100 });
      expect(a.id).not.toBe(b.id);
    });
  });
});
