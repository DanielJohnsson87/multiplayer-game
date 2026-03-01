import SpatialGrid from "../utils/SpatialGrid";
import engine from "./index";
import loop from "./loop";
import { gravity } from "./physics";
import { GRAVITATATIONAL_RADIUS_FACTOR } from "./constants";

let grid = new SpatialGrid(null, { cellSize: 30 });
let isDebugGrid = false;
let attractedIds = new Set();

function init() {
  loop.update("gravity", applyGravity, 1000);
}

function destroy() {
  loop.unsubscribeFrom("update", "gravity");
}

function applyGravity() {
  attractedIds.clear();
  const worldObjects = engine.world.getObjects();

  grid.populate(worldObjects, GRAVITATATIONAL_RADIUS_FACTOR);

  const possibleCollisions = grid.populatedCellsUnique();

  for (const shape of worldObjects) {
    const attractedShapes = possibleCollisions[shape.id];

    if (!attractedShapes) {
      continue;
    }

    const gravitationalRadius = shape.radius * GRAVITATATIONAL_RADIUS_FACTOR;
    attractedShapes.forEach((attracted) => {
      const dist = shape.pos.subtract(attracted.pos);
      const outsideOfGravitationalField =
        gravitationalRadius + attracted.radius < dist.magnitude();

      if (outsideOfGravitationalField) {
        return;
      }

      if (shape.attraction === 1) {
        attractedIds.add(attracted.id);
      }

      const normal = dist.unit();
      const force = gravity(shape.mass, attracted.mass, dist.magnitude());
      attracted.setVelocity(attracted.velocity.add(normal.multiply(force)));
    });
  }
}

function debugGrid(enable) {
  isDebugGrid = enable;

  if (isDebugGrid) {
    engine.canvas.draw("grid", (_, ctx) => grid.draw(ctx), 0);
  }
}

function isAttracted(id) {
  return attractedIds.has(id);
}

export default {
  init,
  destroy,
  debugGrid,
  isAttracted,
};
