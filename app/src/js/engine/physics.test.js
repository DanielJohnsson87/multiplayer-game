import { describe, it, expect } from "vitest";
import Vector from "../utils/vector";
import {
  collisionDetectionBallToBall,
  collisionDetectionBallToWall,
  penetrationResolutionBallToBall,
  penetrationResolutionBallToWall,
  collisionResolutionBallToBall,
  collisionResolutionBallToWall,
  closestPointBallToWall,
  gravity,
} from "./physics";

// --- Factories: plain objects (no Vector instances) ---

function makeCircle(x, y, r, vx = 0, vy = 0, opts = {}) {
  const mass = r * r;
  return {
    pos: { x, y },
    velocity: { x: vx, y: vy },
    radius: r,
    mass,
    inverseMass: mass === 0 ? 0 : 1 / mass,
    elasticity: opts.elasticity ?? 1,
  };
}

function makeWall(x1, y1, x2, y2) {
  return {
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    elasticity: 2.5,
    width: 14,
  };
}

// --- Ball-to-ball collision detection ---

describe("collisionDetectionBallToBall", () => {
  it("detects overlapping circles", () => {
    const a = makeCircle(0, 0, 20);
    const b = makeCircle(30, 0, 20); // gap = 30, radii sum = 40
    expect(collisionDetectionBallToBall(a, b)).toBe(true);
  });

  it("detects touching circles (distance = sum of radii)", () => {
    const a = makeCircle(0, 0, 20);
    const b = makeCircle(40, 0, 20);
    expect(collisionDetectionBallToBall(a, b)).toBe(true);
  });

  it("returns false for separated circles", () => {
    const a = makeCircle(0, 0, 20);
    const b = makeCircle(50, 0, 20); // gap = 50, radii sum = 40
    expect(collisionDetectionBallToBall(a, b)).toBe(false);
  });

  it("works with Vector instances too", () => {
    const a = { ...makeCircle(0, 0, 20), pos: new Vector(0, 0) };
    const b = { ...makeCircle(30, 0, 20), pos: new Vector(30, 0) };
    expect(collisionDetectionBallToBall(a, b)).toBe(true);
  });
});

// --- Ball-to-wall collision detection ---

describe("collisionDetectionBallToWall", () => {
  it("detects ball touching wall", () => {
    // Ball at x=10, radius=20, wall at x=0 vertical. Ball overlaps wall.
    const ball = makeCircle(10, 100, 20);
    const wall = makeWall(0, 0, 0, 600);
    expect(collisionDetectionBallToWall(ball, wall)).toBe(true);
  });

  it("returns undefined (falsy) for ball far from wall", () => {
    const ball = makeCircle(100, 100, 20);
    const wall = makeWall(0, 0, 0, 600);
    expect(collisionDetectionBallToWall(ball, wall)).toBeFalsy();
  });

  it("detects ball near wall endpoint", () => {
    // Ball near the start endpoint of a short wall
    const ball = makeCircle(5, 5, 20);
    const wall = makeWall(0, 0, 0, 10);
    expect(collisionDetectionBallToWall(ball, wall)).toBe(true);
  });
});

// --- Penetration resolution ball-to-ball ---

describe("penetrationResolutionBallToBall", () => {
  it("separates overlapping circles", () => {
    const a = makeCircle(100, 100, 20);
    const b = makeCircle(130, 100, 20); // overlap by 10
    const result = penetrationResolutionBallToBall(a, b);
    const dist = Math.abs(result.entity1.x - result.entity2.x);
    expect(dist).toBeCloseTo(40); // r1 + r2
  });

  it("pushes equal-mass circles equally", () => {
    const a = makeCircle(100, 100, 20);
    const b = makeCircle(130, 100, 20);
    const result = penetrationResolutionBallToBall(a, b);
    // Both should move by the same amount (equal mass = equal inverseMass)
    const moveA = Math.abs(result.entity1.x - 100);
    const moveB = Math.abs(result.entity2.x - 130);
    expect(moveA).toBeCloseTo(moveB);
  });

  it("heavier circle moves less", () => {
    const heavy = makeCircle(100, 100, 40); // mass = 1600
    const light = makeCircle(145, 100, 10); // mass = 100, overlap
    const result = penetrationResolutionBallToBall(heavy, light);
    const moveHeavy = Math.abs(result.entity1.x - 100);
    const moveLight = Math.abs(result.entity2.x - 145);
    expect(moveLight).toBeGreaterThan(moveHeavy);
  });
});

// --- Velocity resolution ball-to-ball ---

describe("collisionResolutionBallToBall", () => {
  it("reverses velocities for equal-mass head-on collision", () => {
    const a = makeCircle(100, 100, 20, 50, 0);
    const b = makeCircle(130, 100, 20, -50, 0);
    const result = collisionResolutionBallToBall(a, b);
    // With elasticity=1, equal mass: velocities should swap
    expect(result.entity1.x).toBeCloseTo(-50);
    expect(result.entity2.x).toBeCloseTo(50);
  });

  it("conserves momentum", () => {
    const a = makeCircle(100, 100, 20, 60, 0);
    const b = makeCircle(130, 100, 20, -20, 0);
    const result = collisionResolutionBallToBall(a, b);
    const momentumBefore = a.mass * 60 + b.mass * -20;
    const momentumAfter = a.mass * result.entity1.x + b.mass * result.entity2.x;
    expect(momentumAfter).toBeCloseTo(momentumBefore);
  });

  it("conserves kinetic energy (elasticity=1)", () => {
    const a = makeCircle(100, 100, 20, 60, 10);
    const b = makeCircle(130, 100, 20, -20, -5);
    const result = collisionResolutionBallToBall(a, b);
    const keBefore =
      0.5 * a.mass * (60 * 60 + 10 * 10) +
      0.5 * b.mass * (20 * 20 + 5 * 5);
    const keAfter =
      0.5 * a.mass * (result.entity1.x ** 2 + result.entity1.y ** 2) +
      0.5 * b.mass * (result.entity2.x ** 2 + result.entity2.y ** 2);
    expect(keAfter).toBeCloseTo(keBefore);
  });

  it("reduces energy with elasticity < 1", () => {
    const a = makeCircle(100, 100, 20, 50, 0, { elasticity: 0.5 });
    const b = makeCircle(130, 100, 20, -50, 0, { elasticity: 0.5 });
    const result = collisionResolutionBallToBall(a, b);
    const keBefore = 0.5 * a.mass * 2500 + 0.5 * b.mass * 2500;
    const keAfter =
      0.5 * a.mass * result.entity1.x ** 2 +
      0.5 * b.mass * result.entity2.x ** 2;
    expect(keAfter).toBeLessThan(keBefore);
  });
});

// --- Ball-to-wall resolution ---

describe("penetrationResolutionBallToWall", () => {
  it("pushes ball out of wall", () => {
    const ball = makeCircle(10, 100, 20); // overlapping left wall
    const wall = makeWall(0, 0, 0, 600);
    const result = penetrationResolutionBallToWall(ball, wall);
    // Ball should be pushed to at least radius + wall.width/2 from wall
    expect(result.entity1.x).toBeGreaterThanOrEqual(20 + 7);
    expect(result.entity2).toBeNull();
  });
});

describe("collisionResolutionBallToWall", () => {
  it("reverses velocity component into wall", () => {
    const ball = makeCircle(10, 100, 20, -50, 0);
    const wall = makeWall(0, 0, 0, 600);
    const result = collisionResolutionBallToWall(ball, wall);
    // x velocity should be positive (bounced)
    expect(result.entity1.x).toBeGreaterThan(0);
    expect(result.entity2).toBeNull();
  });

  it("preserves velocity parallel to wall", () => {
    const ball = makeCircle(10, 100, 20, -50, 30);
    const wall = makeWall(0, 0, 0, 600);
    const result = collisionResolutionBallToWall(ball, wall);
    // y velocity should be preserved (parallel to vertical wall)
    expect(result.entity1.y).toBeCloseTo(30);
  });
});

// --- Closest point ---

describe("closestPointBallToWall", () => {
  it("returns perpendicular projection for mid-wall position", () => {
    const ball = makeCircle(50, 50, 10);
    const wall = makeWall(0, 0, 100, 0); // horizontal wall along y=0
    const closest = closestPointBallToWall(ball, wall);
    expect(closest.x).toBeCloseTo(50);
    expect(closest.y).toBeCloseTo(0);
  });

  it("returns wall start when ball is past start", () => {
    const ball = makeCircle(-20, 10, 10);
    const wall = makeWall(0, 0, 100, 0);
    const closest = closestPointBallToWall(ball, wall);
    expect(closest.x).toBeCloseTo(0);
    expect(closest.y).toBeCloseTo(0);
  });

  it("returns wall end when ball is past end", () => {
    const ball = makeCircle(120, 10, 10);
    const wall = makeWall(0, 0, 100, 0);
    const closest = closestPointBallToWall(ball, wall);
    expect(closest.x).toBeCloseTo(100);
    expect(closest.y).toBeCloseTo(0);
  });
});

// --- Gravity ---

describe("gravity", () => {
  it("computes g * m1 / d²", () => {
    // gravity(m1, m2, d) = g * m1 * m2 / d² / m2 = g * m1 / d²
    expect(gravity(100, 50, 10)).toBeCloseTo(10 * 100 / 100); // = 10
  });

  it("increases with mass", () => {
    expect(gravity(200, 50, 10)).toBeGreaterThan(gravity(100, 50, 10));
  });

  it("decreases with distance (inverse square)", () => {
    const near = gravity(100, 50, 10);
    const far = gravity(100, 50, 20);
    expect(far).toBeCloseTo(near / 4); // 2x distance = 1/4 force
  });

  it("is independent of attracted mass", () => {
    // The function divides out mass2: force/mass2 = acceleration
    expect(gravity(100, 50, 10)).toBeCloseTo(gravity(100, 200, 10));
  });
});
