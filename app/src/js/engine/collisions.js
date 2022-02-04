import SpatialGrid from "../utils/SpatialGrid";
import Vector from "../utils/vector";
import engine from "./index";
import loop from "./loop";
import Circle from "./objects/Circle";

let grid = new SpatialGrid(null, { cellSize: 25 });
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

  const collisionPairs = findCollisions(possibleCollisions);

  collisionPairs.forEach(([entity1, entity2]) => {
    movePlayer(entity1.id, entity1.pos);
    movePlayer(entity2.id, entity2.pos);
  });
}

function findCollisions(possibleCollisions) {
  let entity1,
    entity2 = null;
  let collisionPairs = [];

  iterations = 0;

  for (const players of possibleCollisions) {
    for (let i = 0; i + 1 < players.length; i++) {
      entity1 = players[i];
      const shape1 = new Circle(entity1.pos, null, { radius: entity1.radius });

      for (let j = i + 1; j < players.length; j++) {
        iterations++;
        entity2 = players[j];
        const shape2 = new Circle(entity2.pos, null, {
          radius: entity2.radius,
        });

        if (shape1.isCollidingWith(shape2)) {
          const penetrationResolution = shape1.penetrationResolution(shape2);
          collisionPairs.push([
            { id: entity1.id, pos: { ...penetrationResolution.entity1 } },
            { id: entity2.id, pos: { ...penetrationResolution.entity2 } },
          ]);
        }
      }
    }
  }

  return collisionPairs;
}

function movePlayer(id, pos) {
  const state = engine.state.getState(id);
  const newPos = new Vector(pos.x, pos.y);

  engine.state.setState(id, { ...state, pos: newPos });
}

export default {
  init,
  destroy,
  debug,
};
