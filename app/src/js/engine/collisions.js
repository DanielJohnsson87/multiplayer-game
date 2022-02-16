import SpatialGrid from "../utils/SpatialGrid";
import engine from "./index";
import loop from "./loop";

let grid = new SpatialGrid(null, { cellSize: 20 });
let isDebugGrid = false;

function init() {
  loop.subscribe("collisions", collisionCheck);
}

function destroy() {
  loop.unsubscribe("collisions");
}

function debugGrid(enable) {
  isDebugGrid = enable;
}

function collisionCheck() {
  const playersObject = engine.state.getState();
  const worldObjects = engine.world.getObjects();
  const players = Object.values(playersObject);

  // Using the SpatialGrid seems to on average remove up to ~97% (30-35 times faster) of the iterations needed in findCollisions.
  grid.populate([...players, ...worldObjects]);
  const possibleCollisions = grid.possibleCollisions();

  if (isDebugGrid) {
    engine.canvas.draw((ctx) => grid.draw(ctx), 0);
  }

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

  for (const players of possibleCollisions) {
    for (let i = 0; i + 1 < players.length; i++) {
      entity1 = players[i];

      collisionMap[entity1.id] = {};

      // If entity1 is solid ignore it, since it won't move.
      if (entity1.solid) {
        continue;
      }

      for (let j = i + 1; j < players.length; j++) {
        entity2 = players[j];
        collisionMap[entity2.id] = {};
        const collisionDetected =
          collisionMap[entity1.id] && collisionMap[entity1.id][entity2.id];

        if (entity1.isCollidingWith(entity2) && !collisionDetected) {
          const penetrationResolution = entity1.penetrationResolution(entity2);
          const velocityResolution = entity1.collisionResolution(entity2);

          entity1.move(penetrationResolution.entity1);
          entity1.setVelocity(velocityResolution.entity1);

          // entity2 should only move if it's not solid.
          if (!entity2.solid) {
            entity2.move(penetrationResolution.entity2);
            entity2.setVelocity(velocityResolution.entity2);
          }

          // Update collisionMap to make sure we won't calculate another collision for this pair in this frame.
          collisionMap[entity1.id] = {
            ...collisionMap[entity1.id],
            [`${entity2.id}`]: true,
          };
          collisionMap[entity2.id] = {
            ...collisionMap[entity2.id],
            [`${entity1.id}`]: true,
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
