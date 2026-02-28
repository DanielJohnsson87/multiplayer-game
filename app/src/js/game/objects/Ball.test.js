import { describe, it, expect } from "vitest";
import {
  asteroidCollisionOutcome,
  BREAK_FORCE_PER_MASS,
  ABSORB_MASS_RATIO,
} from "./asteroidCollision";

// Helper: minimum relSpeed for selfMass to break when colliding with otherMass
function breakSpeed(selfMass, otherMass) {
  const reducedMass = (selfMass * otherMass) / (selfMass + otherMass);
  return (selfMass * BREAK_FORCE_PER_MASS) / reducedMass;
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
