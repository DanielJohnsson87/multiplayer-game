import Circle from "../../engine/objects/Circle";
import { SHAPE_WALL } from "../../engine/constants";
import engine from "../../engine";
import Vector from "../../utils/vector";
import { asteroidCollisionOutcome, ATTRACT_DURABILITY_MULTIPLIER } from "./asteroidCollision";

const MIN_BREAK_RADIUS = 6;
const CHILD_SCALE = 0.6;

class Ball extends Circle {
  constructor(pos, { radius = 20, velocity, renderOnly = false } = {}) {
    super(pos, { elasticity: 1, radius, color: "#F2F4FF", renderOnly });
    engine.world.addObject(this);

    this._destroyed = false;
    this._renderOnly = renderOnly;
    this._pendingBreak = false;
    this._pendingAbsorb = null; // reference to asteroid to absorb
    this._invulnerable = 0; // frames of invulnerability after spawning

    if (velocity) {
      this.velocity = new Vector(velocity.x, velocity.y);
    }

    if (!renderOnly) {
      this._subscribeToLoop();
    }
  }

  _subscribeToLoop() {
    // Run after collisions (1001) to process breaks/absorption and tick invulnerability
    engine.loop.update(`ball-break-${this.id}`, () => {
      if (this._invulnerable > 0) this._invulnerable--;
      if (this._pendingBreak) {
        this._break();
      } else if (this._pendingAbsorb) {
        this._absorb(this._pendingAbsorb);
        this._pendingAbsorb = null;
      }
    }, 1002);
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    engine.world.removeObject(this.id);
    if (!this._renderOnly) {
      engine.loop.unsubscribeFrom("update", `shape-tick-${this.id}`);
      engine.loop.unsubscribeFrom("update", `ball-break-${this.id}`);
    }
  }

  onCollision(other, { relSpeed = 0 } = {}) {
    if (this._destroyed || this._pendingBreak) return;
    if (this._invulnerable > 0) return;
    if (other.shape === SHAPE_WALL) return;

    // Non-asteroid collisions (player, etc.) break — unless the player is attracting this asteroid
    if (!(other instanceof Ball)) {
      if (engine.gravity.isAttracted(this.id) && other.attraction === 1) {
        return;
      }
      this._pendingBreak = true;
      return;
    }

    // Two attracted asteroids can't break each other — they clump instead
    const bothAttracted = engine.gravity.isAttracted(this.id)
      && engine.gravity.isAttracted(other.id);

    const durability = engine.gravity.isAttracted(this.id) ? ATTRACT_DURABILITY_MULTIPLIER : 1;
    const outcome = asteroidCollisionOutcome(this.mass, other.mass, relSpeed, durability);
    if (outcome === "break" && !bothAttracted) {
      this._pendingBreak = true;
    } else if (outcome === "absorb") {
      this._pendingAbsorb = other;
    }
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

  _absorb(other) {
    if (other._destroyed) return;
    // Grow: conserve total mass (area)
    const newMass = this.mass + other.mass;
    this.radius = Math.sqrt(newMass);
    this.mass = newMass;
    this.setInverseMass(newMass);
    other.destroy();
  }
}

export default Ball;
