import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  asteroidCollisionOutcome,
  BREAK_FORCE_PER_MASS,
  ABSORB_MASS_RATIO,
  ATTRACT_DURABILITY_MULTIPLIER,
} from "./asteroidCollision";

vi.mock("../../engine", () => ({
  default: {
    world: { addObject: vi.fn(), removeObject: vi.fn() },
    canvas: { draw: vi.fn() },
    loop: { update: vi.fn(), unsubscribeFrom: vi.fn() },
    gravity: { isAttracted: vi.fn(() => false) },
  },
}));

import Ball from "./Ball";
import engine from "../../engine";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Helper: minimum relSpeed for selfMass to break when colliding with otherMass
function breakSpeed(selfMass, otherMass, durabilityMultiplier = 1) {
  const reducedMass = (selfMass * otherMass) / (selfMass + otherMass);
  return (selfMass * BREAK_FORCE_PER_MASS * durabilityMultiplier) / reducedMass;
}

describe("asteroidCollisionOutcome", () => {
  describe("breaking", () => {
    it("breaks when impact force exceeds threshold", () => {
      const mass = 400;
      const speed = breakSpeed(mass, mass) * 1.1;
      expect(asteroidCollisionOutcome(mass, mass, speed)).toBe("break");
    });

    it("does not break below threshold", () => {
      const mass = 400;
      const speed = breakSpeed(mass, mass) * 0.9;
      expect(asteroidCollisionOutcome(mass, mass, speed)).toBe("nothing");
    });

    it("small asteroid breaks at lower relative speed than large one", () => {
      const small = 100;
      const big = 900;
      expect(breakSpeed(small, big)).toBeLessThan(breakSpeed(big, small));
    });

    it("asymmetric collision breaks small but not big", () => {
      const small = 100;
      const big = 900;
      // Speed between small's and big's break thresholds
      const speed = (breakSpeed(small, big) + breakSpeed(big, small)) / 2;
      expect(asteroidCollisionOutcome(small, big, speed)).toBe("break");
      expect(asteroidCollisionOutcome(big, small, speed)).not.toBe("break");
    });

    it("extreme speed breaks both regardless of size", () => {
      const small = 49;
      const big = 900;
      const speed = breakSpeed(big, small) * 1.1;
      expect(asteroidCollisionOutcome(small, big, speed)).toBe("break");
      expect(asteroidCollisionOutcome(big, small, speed)).toBe("break");
    });
  });

  describe("absorption", () => {
    it("big asteroid absorbs small on gentle collision", () => {
      const big = 400;
      const small = 100; // ratio 4x
      // Gentle: below both break thresholds
      const speed =
        Math.min(breakSpeed(big, small), breakSpeed(small, big)) * 0.5;
      expect(big / small).toBeGreaterThan(ABSORB_MASS_RATIO);
      expect(asteroidCollisionOutcome(big, small, speed)).toBe("absorb");
    });

    it("small asteroid does not absorb big", () => {
      const big = 400;
      const small = 100;
      const speed =
        Math.min(breakSpeed(big, small), breakSpeed(small, big)) * 0.5;
      expect(asteroidCollisionOutcome(small, big, speed)).toBe("nothing");
    });

    it("similar-size asteroids do not absorb each other", () => {
      const a = 400;
      const b = 350;
      expect(a / b).toBeLessThan(ABSORB_MASS_RATIO);
      const speed = breakSpeed(a, b) * 0.5;
      expect(asteroidCollisionOutcome(a, b, speed)).toBe("nothing");
      expect(asteroidCollisionOutcome(b, a, speed)).toBe("nothing");
    });

    it("does not absorb when force is high enough to break", () => {
      const big = 900;
      const small = 100;
      const speed = breakSpeed(big, small) * 1.1;
      // Even though mass ratio qualifies for absorption, breaking takes priority
      expect(asteroidCollisionOutcome(big, small, speed)).toBe("break");
    });

    it("mass ratio exactly at threshold does not absorb (strict >)", () => {
      const small = 100;
      const big = small * ABSORB_MASS_RATIO; // exactly at boundary
      const speed =
        Math.min(breakSpeed(big, small), breakSpeed(small, big)) * 0.5;
      expect(asteroidCollisionOutcome(big, small, speed)).toBe("nothing");
    });
  });

  describe("durability multiplier", () => {
    it("collision that would break without multiplier returns nothing with multiplier", () => {
      const mass = 400;
      const speed = breakSpeed(mass, mass) * 1.1;
      expect(asteroidCollisionOutcome(mass, mass, speed)).toBe("break");
      expect(asteroidCollisionOutcome(mass, mass, speed, ATTRACT_DURABILITY_MULTIPLIER)).toBe("nothing");
    });

    it("multiplier does not affect absorption logic", () => {
      const big = 400;
      const small = 100;
      const speed = breakSpeed(big, small) * 0.5;
      expect(asteroidCollisionOutcome(big, small, speed, ATTRACT_DURABILITY_MULTIPLIER)).toBe("absorb");
    });

    it("extreme force still breaks even with multiplier", () => {
      const mass = 400;
      const speed = breakSpeed(mass, mass, ATTRACT_DURABILITY_MULTIPLIER) * 1.1;
      expect(asteroidCollisionOutcome(mass, mass, speed, ATTRACT_DURABILITY_MULTIPLIER)).toBe("break");
    });
  });

  describe("edge cases", () => {
    it("zero relative speed returns nothing", () => {
      expect(asteroidCollisionOutcome(400, 400, 0)).toBe("nothing");
    });

    it("very small masses still follow the same rules", () => {
      const tiny = 36; // radius ~6 (minimum break radius)
      const also_tiny = 36;
      const speed = breakSpeed(tiny, also_tiny) * 1.1;
      expect(asteroidCollisionOutcome(tiny, also_tiny, speed)).toBe("break");
    });
  });
});

describe("Ball IDs", () => {
  it("has a UUID-based id with circle prefix", () => {
    const b = new Ball({ x: 0, y: 0 }, { radius: 20 });
    expect(b.id).toMatch(/^circle-/);
    expect(b.id.replace("circle-", "")).toMatch(UUID_REGEX);
  });

  it("generates unique ids across instances", () => {
    const a = new Ball({ x: 0, y: 0 }, { radius: 20 });
    const b = new Ball({ x: 10, y: 10 }, { radius: 20 });
    expect(a.id).not.toBe(b.id);
  });
});

describe("Ball serialization", () => {
  it("serialize() returns physics properties", () => {
    const b = new Ball({ x: 10, y: 20 }, { radius: 15 });
    const s = b.serialize();
    expect(s.id).toBe(b.id);
    expect(s.pos).toEqual({ x: 10, y: 20 });
    expect(s.radius).toBe(15);
    expect(s.mass).toBe(b.mass);
    expect(s.shape).toBe("circle");
  });

  it("serialize() excludes internal and rendering state", () => {
    const b = new Ball({ x: 0, y: 0 }, { radius: 20 });
    const s = b.serialize();
    expect(s).not.toHaveProperty("ctx");
    expect(s).not.toHaveProperty("_pendingBreak");
    expect(s).not.toHaveProperty("_pendingAbsorb");
    expect(s).not.toHaveProperty("_destroyed");
    expect(s).not.toHaveProperty("_invulnerable");
    expect(s).not.toHaveProperty("asteroidVertices");
    expect(s).not.toHaveProperty("craters");
    expect(s).not.toHaveProperty("asteroidColor");
  });

  it("serialize() output is JSON-safe", () => {
    const b = new Ball({ x: 5, y: 10 }, { radius: 25 });
    const s = b.serialize();
    const roundtripped = JSON.parse(JSON.stringify(s));
    expect(roundtripped).toEqual(s);
  });
});

describe("Ball.onCollision — attract immunity", () => {
  let asteroid;

  beforeEach(() => {
    vi.clearAllMocks();
    engine.gravity.isAttracted.mockReturnValue(false);
    asteroid = new Ball({ x: 0, y: 0 }, { radius: 20 });
  });

  function fakePlayer(attraction = 0) {
    return { shape: "player", attraction };
  }

  it("breaks when hitting a player normally", () => {
    asteroid.onCollision(fakePlayer(0), { relSpeed: 100 });
    expect(asteroid._pendingBreak).toBe(true);
  });

  it("does not break when attracted and hitting attracting player", () => {
    engine.gravity.isAttracted.mockReturnValue(true);
    asteroid.onCollision(fakePlayer(1), { relSpeed: 100 });
    expect(asteroid._pendingBreak).toBe(false);
  });

  it("breaks when attracted and hitting repelling player", () => {
    engine.gravity.isAttracted.mockReturnValue(true);
    asteroid.onCollision(fakePlayer(-1), { relSpeed: 100 });
    expect(asteroid._pendingBreak).toBe(true);
  });

  it("two attracted asteroids do not break each other", () => {
    engine.gravity.isAttracted.mockReturnValue(true);
    const other = new Ball({ x: 30, y: 0 }, { radius: 20 });
    const speed = breakSpeed(asteroid.mass, other.mass) * 1.1;
    asteroid.onCollision(other, { relSpeed: speed });
    expect(asteroid._pendingBreak).toBe(false);
  });

  it("attracted asteroid gets durability boost against non-attracted asteroid", () => {
    engine.gravity.isAttracted.mockImplementation((id) => id === asteroid.id);
    const other = new Ball({ x: 30, y: 0 }, { radius: 20 });
    // Speed that breaks normally but not with 4x durability
    const speed = breakSpeed(asteroid.mass, other.mass) * 1.1;
    asteroid.onCollision(other, { relSpeed: speed });
    expect(asteroid._pendingBreak).toBe(false);
  });

  it("non-attracted asteroid breaks normally against attracted asteroid", () => {
    const other = new Ball({ x: 30, y: 0 }, { radius: 20 });
    engine.gravity.isAttracted.mockImplementation((id) => id === other.id);
    const speed = breakSpeed(asteroid.mass, other.mass) * 1.1;
    asteroid.onCollision(other, { relSpeed: speed });
    expect(asteroid._pendingBreak).toBe(true);
  });
});
