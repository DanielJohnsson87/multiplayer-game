import engine from "../engine/index";
import Vector from "../utils/vector";
import Circle from "../engine/objects/Circle";

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

const initialState = createOpponents(10);

/**
 * Setup the opponents and everything related.
 * @returns void
 */
function init() {
  destroy();
  // connectStoreToNetwork();
  // const state = engine.state.getState();

  Object.values(initialState).forEach((opponent) => {
    engine.state.setState(opponent.id, opponent);
  });

  engine.loop.subscribe("opponents", () => {
    engine.canvas.draw((ctx) => drawOpponents(ctx));
  });
}

function drawOpponents(ctx) {
  const players = engine.state.getState();

  Object.values(players).forEach((player) => {
    if (player.id === 1) {
      return;
    }
    const { pos, radius, direction } = player;
    const circle = new Circle(pos, ctx, {
      radius,
      direction,
      color: player.id === 1 ? "red" : "green",
    });
    circle.draw();
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
  // network.unsubscribe("updateStore");
  // store.dispatch(resetOpponentsState());
  // loop.unsubscribe("updateOpponentPositions");
}

/**
 * @returns {void}
 */
// function connectStoreToNetwork() {
//   network.subscribe("updateStore", (event) => {
//     store.dispatch(moveOpponent(event.data));
//   });
// }

const opponents = {
  init: init,
  destroy: destroy,
};

export default opponents;
export { init, destroy };
