import SpatialGrid from "../utils/SpatialGrid";
import engine from "./index";
import loop from "./loop";

let grid = new SpatialGrid(null, { cellSize: 20 });
let isDebugGrid = false;

function init() {
  loop.update("collisions", collisionCheck, 1001);
}

function destroy() {
  loop.unsubscribeFrom("update", "collisions");
}

function debugGrid(enable) {
  isDebugGrid = enable;

  if (isDebugGrid) {
    engine.canvas.draw("grid", (_, ctx) => grid.draw(ctx), 0);
  }
}

function collisionCheck() {
  const playersObject = engine.state.getState();
  const worldObjects = engine.world.getObjects();
  const players = Object.values(playersObject);

  // Using the SpatialGrid seems to on average remove up to ~97% (30-35 times faster) of the iterations needed in findCollisions.
  grid.populate([...players, ...worldObjects]);
  const possibleCollisions = grid.possibleCollisions();

  if (!possibleCollisions || possibleCollisions.length < 0) {
    return;
  }

  findAndHandleCollisions(possibleCollisions);
}

function findAndHandleCollisions(possibleCollisions) {
  let entity1,
    entity2 = null;

  // Keep track of collisions between pair to avoid calculating multiple collisions
  // if two entities are possibly colliding in multiple grid cells.
  let collisionMap = {};

  for (const objects of possibleCollisions) {
    for (let i = 0; i + 1 < objects.length; i++) {
      entity1 = objects[i];

      for (let j = i + 1; j < objects.length; j++) {
        entity2 = objects[j];
        const collisionDetected =
          collisionMap[entity1.id] && collisionMap[entity1.id][entity2.id];

        if (entity1.solid && entity2.solid) {
          continue;
        }

        const collidingEntity = !entity1.solid ? entity1 : entity2;
        const recievingEntity = !entity1.solid ? entity2 : entity1;

        if (
          collidingEntity.isCollidingWith(recievingEntity) &&
          !collisionDetected
        ) {
          const penetrationResolution =
            collidingEntity.penetrationResolution(recievingEntity);
          const velocityResolution =
            collidingEntity.collisionResolution(recievingEntity);

          collidingEntity.move(penetrationResolution.entity1);
          collidingEntity.setVelocity(velocityResolution.entity1);

          // recievingEntity should only move if it's not solid.
          if (!recievingEntity.solid) {
            recievingEntity.move(penetrationResolution.entity2);
            recievingEntity.setVelocity(velocityResolution.entity2);
          }

          // Update collisionMap to make sure we won't calculate another collision for this pair in this frame.
          collisionMap[collidingEntity.id] = {
            ...collisionMap[collidingEntity.id],
            [`${recievingEntity.id}`]: true,
          };
          collisionMap[recievingEntity.id] = {
            ...collisionMap[recievingEntity.id],
            [`${collidingEntity.id}`]: true,
          };
        }
      }
    }
  }
}

export default {
  init,
  destroy,
  debugGrid,
};
