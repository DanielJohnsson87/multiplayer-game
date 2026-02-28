import Circle from "../../engine/objects/Circle";
import { SHAPE_WALL } from "../../engine/constants";
import engine from "../../engine";
import Vector from "../../utils/vector";

const ASTEROID_COLORS = ["#8B7355", "#A0926B", "#7A6B52", "#9C8E74", "#6B5E47"];
const MIN_BREAK_RADIUS = 6;
const CHILD_SCALE = 0.6;

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

class Ball extends Circle {
  constructor(pos, { radius = 20, velocity } = {}) {
    super(pos, { elasticity: 1, radius, color: "#F2F4FF" });
    engine.world.addObject(this);

    this._destroyed = false;
    this._pendingBreak = false;
    this._invulnerable = 0; // frames of invulnerability after spawning

    // Generate asteroid vertices once so shape is stable
    const rng = seededRandom(Math.floor(pos.x * 1000 + pos.y));
    this.asteroidColor =
      ASTEROID_COLORS[Math.floor(rng() * ASTEROID_COLORS.length)];
    const numVertices = 7 + Math.floor(rng() * 4); // 7-10 vertices
    this.asteroidVertices = [];
    for (let i = 0; i < numVertices; i++) {
      const angle = (i / numVertices) * Math.PI * 2;
      const jitter = 0.65 + rng() * 0.45; // 0.65 - 1.1
      this.asteroidVertices.push({ angle, r: jitter });
    }
    // A few crater-like dents (stored as angle/size pairs)
    this.craters = [];
    const numCraters = 1 + Math.floor(rng() * 2);
    for (let i = 0; i < numCraters; i++) {
      this.craters.push({
        angle: rng() * Math.PI * 2,
        dist: 0.2 + rng() * 0.35,
        size: 0.15 + rng() * 0.15,
      });
    }
    this.rotationSpeed = (rng() - 0.5) * 60; // degrees per second
    this.currentRotation = rng() * 360;

    if (velocity) {
      this.velocity = new Vector(velocity.x, velocity.y);
    }

    this._subscribeToLoop();
  }

  _subscribeToLoop() {
    engine.canvas.draw(`ball-${this.id}`, (interpolation) => {
      this._drawAsteroid(interpolation);
    });
    // Run after collisions (1001) to process breaks and tick invulnerability
    engine.loop.update(`ball-break-${this.id}`, () => {
      if (this._invulnerable > 0) this._invulnerable--;
      if (this._pendingBreak) {
        this._break();
      }
    }, 1002);
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    engine.world.removeObject(this.id);
    engine.loop.unsubscribeFrom("update", `shape-tick-${this.id}`);
    engine.loop.unsubscribeFrom("update", `ball-break-${this.id}`);
    engine.canvas.removeDraw(`ball-${this.id}`);
  }

  onCollision(other) {
    if (this._destroyed || this._pendingBreak) return;
    if (this._invulnerable > 0) return;
    if (other.shape === SHAPE_WALL) return;
    this._pendingBreak = true;
  }

  _break() {
    const childRadius = this.radius * CHILD_SCALE;

    if (childRadius < MIN_BREAK_RADIUS) {
      this.destroy();
      return;
    }

    // Spawn 2 children offset perpendicular to velocity
    const vel = this.velocity;
    const perpendicular =
      vel.magnitude() > 0.01
        ? new Vector(-vel.y, vel.x).unit()
        : new Vector(1, 0);

    // Offset children far enough apart that they don't overlap
    const offset = perpendicular.multiply(childRadius * 1.5);
    const spread = perpendicular.multiply(40);

    const child1 = new Ball(
      { x: this.pos.x + offset.x, y: this.pos.y + offset.y },
      {
        radius: childRadius,
        velocity: vel.add(spread),
      }
    );
    child1._invulnerable = 30; // ~0.5s grace period

    const child2 = new Ball(
      { x: this.pos.x - offset.x, y: this.pos.y - offset.y },
      {
        radius: childRadius,
        velocity: vel.subtract(spread),
      }
    );
    child2._invulnerable = 30;

    this.destroy();
  }

  _drawAsteroid(interpolation = 0) {
    if (this._destroyed) return;

    const ctx = this.ctx;
    const r = this.radius;

    const interpolated = {
      x:
        this.previousPos.x +
        (this.pos.x - this.previousPos.x) * interpolation,
      y:
        this.previousPos.y +
        (this.pos.y - this.previousPos.y) * interpolation,
    };

    // Slowly spin the asteroid
    this.currentRotation += this.rotationSpeed * (1 / 60);
    const rotRad = this.currentRotation * (Math.PI / 180);

    ctx.save();
    ctx.translate(interpolated.x, interpolated.y);
    ctx.rotate(rotRad);

    // Draw jagged outline
    ctx.beginPath();
    const v0 = this.asteroidVertices[0];
    ctx.moveTo(Math.cos(v0.angle) * r * v0.r, Math.sin(v0.angle) * r * v0.r);
    for (let i = 1; i < this.asteroidVertices.length; i++) {
      const v = this.asteroidVertices[i];
      ctx.lineTo(Math.cos(v.angle) * r * v.r, Math.sin(v.angle) * r * v.r);
    }
    ctx.closePath();
    ctx.fillStyle = this.asteroidColor;
    ctx.fill();
    ctx.strokeStyle = "#5A4D3A";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw craters
    this.craters.forEach((crater) => {
      const cx = Math.cos(crater.angle) * r * crater.dist;
      const cy = Math.sin(crater.angle) * r * crater.dist;
      ctx.beginPath();
      ctx.arc(cx, cy, r * crater.size, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fill();
    });

    ctx.restore();
  }
}

export default Ball;
