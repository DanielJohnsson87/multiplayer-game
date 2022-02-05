import engine from "../engine/index";
import Vector from "../utils/vector";
import Player from "../engine/objects/Player";
// This file will change a lot once we connect to the network. So probably not worth spedning too much time here

function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}
function randomPos() {
  return new Vector(randomNumber(0, 550), randomNumber(0, 550));
}

function createOpponents(num) {
  let opponents = {};
  for (let i = 0; i < num; i++) {
    opponents = {
      ...opponents,
      [`${i + 2}`]: {
        id: i + 2,
        direction: 0,
        pos: randomPos(),
        velocity: new Vector(0, 0),
        radius: randomNumber(5, 20),
      },
    };
  }

  return opponents;
}

const initialState = createOpponents(4);

/**
 * Setup the opponents and everything related.
 * @returns void
 */
function init() {
  Object.values(initialState).forEach((opponent) => {
    new Player(opponent.pos, { adapter: "ai" });
  });
}

/**
 * Tear down the opponents and everything related.
 * @returns void
 */
function destroy() {
  Object.values(initialState).forEach((opponent) => {
    engine.state.setState(opponent.id, null);
  });
}

const opponents = {
  init: init,
  destroy: destroy,
};

export default opponents;
export { init, destroy };
