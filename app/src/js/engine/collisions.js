import SpatialGrid from "../utils/SpatialGrid";
import engine from "./index";
import loop from "./loop";

let grid = new SpatialGrid(null, { cellSize: 20 });
let isDebug = false;
let iterations = 0;

function init() {
  loop.subscribe("collisions", collisionCheck);
}

function destroy() {
  loop.unsubscribe("collisions");
}

function debug(enable) {
  isDebug = enable;
}

function collisionCheck() {
  const playersObject = engine.state.getState();
  const players = Object.values(playersObject);

  // Using the SpatialGrid seems to on average remove up to ~97% (30-35 times faster) of the iterations needed in findCollisions.
  grid.populate(players);
  const possibleCollisions = grid.possibleCollisions();

  if (isDebug) {
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
  let collisionPairs = [];

  iterations = 0;

  for (const players of possibleCollisions) {
    for (let i = 0; i + 1 < players.length; i++) {
      entity1 = players[i];

      for (let j = i + 1; j < players.length; j++) {
        iterations++;
        entity2 = players[j];

        if (entity1.isCollidingWith(entity2)) {
          const penetrationResolution = entity1.penetrationResolution(entity2);
          const velocityResolution = entity1.collisionResolution(entity2);

          entity1.move(penetrationResolution.entity1);
          entity2.move(penetrationResolution.entity2);
          entity1.setVelocity(velocityResolution.entity1);
          entity2.setVelocity(velocityResolution.entity2);

          collisionPairs.push([entity1, entity2]);
        }
      }
    }
  }

  return collisionPairs;
}

export default {
  init,
  destroy,
  debug,
};
