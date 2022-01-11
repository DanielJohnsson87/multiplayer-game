import gameLoop from "../loop/gameLoop";
import network from "../network";
import controls from "./controls";
import Vector from "../../utils/vector";
import geometry from "../../utils/geometry";
import playerState from "../state/player";

let lastSentBoundingBox = null;

/**
 * Setup the player and everything related.
 * @returns void
 */
function init() {
  destroy();
  playerState.init();
  controls.init();
  gameLoop.subscribe("movePlayer", movePlayer);
}

/**
 * Tear down the player and everything related.
 * @returns void
 */
function destroy() {
  playerState.destroy();
  gameLoop.unsubscribe("movePlayer");
}

/**
 * Reads current input control state and fires appropriet actions.
 * Should execute every game loop iteration.
 */
function movePlayer() {
  const direction = playerState.getState().direction;
  const newDirection = keysToDirection(controls.getKeys(), direction);
  const accelerationVector = keysToAcceleration(
    controls.getKeys(),
    newDirection
  );
  playerState.rotate(newDirection);

  if (accelerationVector) {
    playerState.accelerate(accelerationVector);
  }

  const boundingBox = playerState.getState().boundingBox;
  if (boundingBox !== lastSentBoundingBox) {
    sendPositionToServer(boundingBox);
    lastSentBoundingBox = boundingBox;
  }
}

/**
 * Calculates new direction based on keyboard inputs.
 *
 * @param {object} keys
 * @param {number} rotation
 * @returns {number}
 */
function keysToDirection(keys, rotation) {
  let direction = rotation;

  if (keys["ArrowRight"]) {
    direction = geometry.warp360(direction + 5);
  }

  if (keys["ArrowLeft"]) {
    direction = geometry.warp360(direction - 5);
  }

  return direction;
}

/**
 * Calculates new acceleration based on keyboard inputs.
 *
 * @param {object} keys
 * @param {number} rotation
 * @returns {{x: number, y: number} | false}
 */
function keysToAcceleration(keys, rotation) {
  let acc = null;
  let finalRotation = rotation;

  if (keys["ArrowUp"] || keys["ArrowDown"]) {
    acc = new Vector(0, 0);
  }

  if (keys["ArrowUp"]) {
    acc.add({ x: 0, y: 0.25 });
  }

  if (keys["ArrowDown"]) {
    acc.add({ x: 0, y: -0.25 });
  }

  return acc ? acc.rotate(finalRotation) : false;
}

async function sendPositionToServer(boundingBox) {
  if (!boundingBox) {
    return null;
  }

  network.message(
    `${boundingBox.x},${boundingBox.y},${boundingBox.width},${boundingBox.height}`
  );
}

const player = {
  init: init,
  destroy: destroy,
};

export default player;
export { init, destroy };
