import engine from "../engine/index";
import Vector from "../utils/vector";
import Player from "../engine/objects/Player";
// This file will change a lot once we connect to the network. So probably not worth spedning too much time here

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}
function randomPos() {
  return new Vector(randomNumber(0, 550), randomNumber(0, 550));
}

const sizes = [15, 25, 50, 75];

function createOpponents(num) {
  let opponents = [];
  for (let i = 0; i < num; i++) {
    opponents.push(randomPos());
  }

  return opponents;
}

const initialState = createOpponents(4);

/**
 * Setup the opponents and everything related.
 * @returns void
 */
function init() {
  createOpponents(4).forEach((pos) => {
    new Player(pos, {
      adapter: "ai",
      color: "red",
      radius: sizes[randomNumber(0, 3)],
    });
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
