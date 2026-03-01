import { GRAVITATATIONAL_RADIUS_FACTOR } from "./constants";

const ASTEROID_COLORS = ["#8B7355", "#A0926B", "#7A6B52", "#9C8E74", "#6B5E47"];

// --- Seeded RNG (identical to Ball.js) ---

export function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// --- Render cache data generation ---

export function generateAsteroidRenderData(pos) {
  const rng = seededRandom(Math.floor(pos.x * 1000 + pos.y));
  const asteroidColor =
    ASTEROID_COLORS[Math.floor(rng() * ASTEROID_COLORS.length)];
  const numVertices = 7 + Math.floor(rng() * 4);
  const asteroidVertices = [];
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * Math.PI * 2;
    const jitter = 0.65 + rng() * 0.45;
    asteroidVertices.push({ angle, r: jitter });
  }
  const craters = [];
  const numCraters = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < numCraters; i++) {
    craters.push({
      angle: rng() * Math.PI * 2,
      dist: 0.2 + rng() * 0.35,
      size: 0.15 + rng() * 0.15,
    });
  }
  const rotationSpeed = (rng() - 0.5) * 60;
  const currentRotation = rng() * 360;

  return { asteroidColor, asteroidVertices, craters, rotationSpeed, currentRotation };
}

// --- Shared helpers ---

function interpolatePos(entity, interpolation) {
  return {
    x: entity.previousPos.x + (entity.pos.x - entity.previousPos.x) * interpolation,
    y: entity.previousPos.y + (entity.pos.y - entity.previousPos.y) * interpolation,
  };
}

// --- Draw functions ---

export function drawSpaceship(ctx, pos, entity) {
  const r = entity.radius;
  const angleRad = entity.direction * (Math.PI / 180);

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angleRad);

  // Main hull
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.3);
  ctx.lineTo(-r * 0.8, r * 0.7);
  ctx.lineTo(-r * 0.3, r * 0.4);
  ctx.lineTo(r * 0.3, r * 0.4);
  ctx.lineTo(r * 0.8, r * 0.7);
  ctx.closePath();
  ctx.fillStyle = "#07A0C3";
  ctx.fill();
  ctx.strokeStyle = "#0ED2FF";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Cockpit
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.7);
  ctx.lineTo(-r * 0.2, r * 0.05);
  ctx.lineTo(r * 0.2, r * 0.05);
  ctx.closePath();
  ctx.fillStyle = "#0ED2FF";
  ctx.fill();

  // Engine glow
  const glowSize = 0.3 + Math.random() * 0.15;
  ctx.beginPath();
  ctx.moveTo(-r * 0.25, r * 0.45);
  ctx.lineTo(0, r * (0.45 + glowSize));
  ctx.lineTo(r * 0.25, r * 0.45);
  ctx.closePath();
  ctx.fillStyle = `rgba(255, ${150 + Math.random() * 105}, 50, 0.9)`;
  ctx.fill();

  ctx.restore();
}

export function drawEnemyShip(ctx, pos, entity) {
  const r = entity.radius;
  const angleRad = entity.direction * (Math.PI / 180);

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angleRad);

  // Enemy hull
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.1);
  ctx.lineTo(-r * 1.0, r * 0.2);
  ctx.lineTo(-r * 0.5, r * 0.6);
  ctx.lineTo(0, r * 0.3);
  ctx.lineTo(r * 0.5, r * 0.6);
  ctx.lineTo(r * 1.0, r * 0.2);
  ctx.closePath();
  ctx.fillStyle = "#FF715B";
  ctx.fill();
  ctx.strokeStyle = "#FF3320";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Enemy cockpit
  ctx.beginPath();
  ctx.arc(0, -r * 0.15, r * 0.22, 0, 2 * Math.PI);
  ctx.fillStyle = "#FF3320";
  ctx.fill();

  ctx.restore();
}

export function drawAttractionField(ctx, entity, interpolation) {
  if (!entity.attraction) return;

  const pos = interpolatePos(entity, interpolation);
  const fieldRadius = entity.radius * GRAVITATATIONAL_RADIUS_FACTOR;
  const color = entity.attraction > 0 ? [0, 255, 100] : [255, 50, 50];

  // Outer field glow
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, fieldRadius, 0, 2 * Math.PI);
  ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.12)`;
  ctx.fill();
  ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.3)`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();

  // Pulsing rings
  const t = Date.now() * 0.003;
  for (let i = 3; i >= 0; i--) {
    const pulse = (t + i * 0.5) % 2;
    const ringR = fieldRadius * (0.3 + pulse * 0.35);
    const alpha = 0.25 * (1 - pulse / 2);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, ringR, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.closePath();
  }
}

export function drawPlayer(ctx, entity, interpolation) {
  drawAttractionField(ctx, entity, interpolation);
  const pos = interpolatePos(entity, interpolation);
  if (entity.adapterType === "keyboard" || entity.adapterType === "touch") {
    drawSpaceship(ctx, pos, entity);
  } else {
    drawEnemyShip(ctx, pos, entity);
  }
}

export function drawAsteroid(ctx, entity, interpolation, renderData) {
  const r = entity.radius;
  const pos = interpolatePos(entity, interpolation);

  // Advance rotation (render-only state, not in store)
  renderData.currentRotation += renderData.rotationSpeed * (1 / 60);
  const rotRad = renderData.currentRotation * (Math.PI / 180);

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(rotRad);

  // Draw jagged outline
  ctx.beginPath();
  const v0 = renderData.asteroidVertices[0];
  ctx.moveTo(Math.cos(v0.angle) * r * v0.r, Math.sin(v0.angle) * r * v0.r);
  for (let i = 1; i < renderData.asteroidVertices.length; i++) {
    const v = renderData.asteroidVertices[i];
    ctx.lineTo(Math.cos(v.angle) * r * v.r, Math.sin(v.angle) * r * v.r);
  }
  ctx.closePath();
  ctx.fillStyle = renderData.asteroidColor;
  ctx.fill();
  ctx.strokeStyle = "#5A4D3A";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw craters
  for (const crater of renderData.craters) {
    const cx = Math.cos(crater.angle) * r * crater.dist;
    const cy = Math.sin(crater.angle) * r * crater.dist;
    ctx.beginPath();
    ctx.arc(cx, cy, r * crater.size, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fill();
  }

  ctx.restore();
}

export function drawWall(ctx, entity) {
  ctx.beginPath();
  ctx.moveTo(entity.start.x, entity.start.y);
  ctx.lineTo(entity.end.x, entity.end.y);
  ctx.strokeStyle = "#F9CB40";
  ctx.lineWidth = entity.width;
  ctx.stroke();
  ctx.closePath();
  ctx.lineWidth = 1;
}

// --- Renderer factory ---

export function createRenderer(getState) {
  const renderCache = new Map();
  const activeIds = new Set();

  function render(interpolation, ctx) {
    const state = getState();
    activeIds.clear();

    for (const id in state.entities) {
      const entity = state.entities[id];
      activeIds.add(id);

      if (entity.type === "wall") {
        drawWall(ctx, entity);
      } else if (entity.type === "player") {
        drawPlayer(ctx, entity, interpolation);
      } else if (entity.type === "ball") {
        let rd = renderCache.get(id);
        if (!rd) {
          rd = generateAsteroidRenderData(entity.pos);
          renderCache.set(id, rd);
        }
        drawAsteroid(ctx, entity, interpolation, rd);
      }
    }

    // Prune stale cache entries
    if (renderCache.size > activeIds.size) {
      for (const id of renderCache.keys()) {
        if (!activeIds.has(id)) {
          renderCache.delete(id);
        }
      }
    }
  }

  return { render, renderCache };
}
