import Circle from "../../engine/objects/Circle";
import engine from "../../engine";

const ASTEROID_COLORS = ["#8B7355", "#A0926B", "#7A6B52", "#9C8E74", "#6B5E47"];

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

class Ball extends Circle {
  constructor(pos) {
    super(pos, { elasticity: 1, radius: 10, color: "#F2F4FF" });
    engine.world.addObject(this);

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

    this._subscribeToLoop();
  }

  _subscribeToLoop() {
    engine.canvas.draw(`ball-${this.id}`, (interpolation) => {
      this._drawAsteroid(interpolation);
    });
  }

  _drawAsteroid(interpolation = 0) {
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
