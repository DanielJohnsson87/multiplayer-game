import geometry from "../../utils/geometry";
import Vector from "../../utils/vector";
import gameLoop from "../loop/gameLoop";

const FRICTION = 0.025;
let state = null;

const initialState = {
  direction: 90,
  boundingBox: geometry.boundingBox({ x: 200, y: 200, width: 20, height: 40 }),
  velocity: new Vector(0, 0),
};

/**
 * Setup the player state.
 * @returns void
 */
function init() {
  state = { ...initialState };

  gameLoop.subscribe("playerState", () => {
    tick();
  });
}

/**
 * Tear down the player state.
 * @returns void
 */
function destroy() {
  state = null;
  gameLoop.unsubscribe("playerState");
}

/**
 * Calculates new velocity & position on every game loop update.
 */
function tick() {
  const isLargeEnough =
    Math.abs(state.velocity.x) > 0.005 || Math.abs(state.velocity.y) > 0.005;

  state.velocity = state.velocity.multiply(1 - FRICTION);

  if (isLargeEnough) {
    state.boundingBox = {
      ...state.boundingBox,
      x: state.boundingBox.x + state.velocity.x,
      y: state.boundingBox.y + state.velocity.y,
    };
  } else {
    state.velocity = new Vector(0, 0);
  }
}

/**
 * Change the rotation / direction of the player.
 *
 * @param {number} direction Rotation in degrees. (0...360 degrees).
 * @returns void;
 */
function rotate(direction) {
  state.direction = direction;
}

/**
 * Add acceleration vector to the players current velocity.
 *
 * @param {{x: number, y: number}} accelerationVector
 * @returns {x: number, y: number} Returns new velocity
 */
function accelerate(accelerationVector) {
  state.velocity.add(accelerationVector);

  return state.velocity;
}

/**
 * @returns {object}
 */
function getState() {
  return state;
}

export default {
  init,
  destroy,
  accelerate,
  rotate,
  getState,
};
