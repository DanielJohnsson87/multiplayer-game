import geometry from "../utils/geometry";
import Vector from "../utils/vector";
import loop from "../engine/loop";
import { PLAYER_ACCELERATION } from "../constants";
import engine from "../engine/index";
import Circle from "../engine/objects/Circle";
import { CANVAS_HEIGHT } from "../constants";

const FRICTION = 0.025;
const PLAYER_ID = 1;

const initialState = {
  id: 1,
  direction: 0,
  pos: new Vector(50, 20),
  velocity: new Vector(0, 0),
  radius: 20,
};

/**
 * Setup the player state.
 * @returns void
 */
function init() {
  engine.state.setState(PLAYER_ID, initialState);

  loop.subscribe("playerState", () => {
    tick();
    engine.canvas.draw((ctx) => drawPlayer(ctx), 1);
  });
}

/**
 * Tear down the player state.
 * @returns void
 */
function destroy() {
  engine.state.setState(PLAYER_ID, null);
  loop.unsubscribe("playerState");
}

/**
 * Calculates new velocity & position on every game loop update.
 */
function tick() {
  const state = engine.state.getState(PLAYER_ID);
  const isLargeEnough =
    Math.abs(state.velocity.x) > 0.005 || Math.abs(state.velocity.y) > 0.005;

  let velocity = state.velocity.multiply(1 - FRICTION);
  let pos = state.pos;

  if (isLargeEnough) {
    pos = new Vector(
      state.pos.x + state.velocity.x,
      state.pos.y + state.velocity.y
    );
  } else {
    velocity = new Vector(0, 0);
  }

  engine.state.setState(PLAYER_ID, { ...state, pos, velocity });
}

/**
 * Change the rotation / direction of the player.
 *
 * @param {number} rotation Rotation to apply in degrees. (0...360 degrees).
 * @returns void;
 */
function rotate(rotation) {
  const state = engine.state.getState(PLAYER_ID);
  const direction = geometry.warp360(rotation + state.direction);
  engine.state.setState(PLAYER_ID, { ...state, direction });
}

/**
 * Add acceleration vector to the players current velocity.
 *
 * Calculate acceleration for player. .unit().multiply(x) is used
 * to make sure that diagonal acceleration doesn't get a larger magnitude.
 * Currently it's not a problem since acceleration is only added to the y axis.
 * But still good practice I guess.
 *
 * @param {{x: number, y: number}} accelerationVector
 * @returns {x: number, y: number} Returns new velocity
 */
function accelerate(accelerationVector) {
  const state = engine.state.getState(PLAYER_ID);
  const v = new Vector(accelerationVector.x, accelerationVector.y)
    .unit()
    .multiply(PLAYER_ACCELERATION)
    .rotate(state.direction);

  const velocity = state.velocity.add(v);

  engine.state.setState(PLAYER_ID, { ...state, velocity });

  return velocity;
}

function move(pos) {
  const state = engine.state.getState(PLAYER_ID);
  const newPos = new Vector(pos.x, pos.y);

  engine.state.setState(PLAYER_ID, { ...state, pos: newPos });
}

/**
 * @returns {object}
 */
function getState() {
  return engine.state.getState(PLAYER_ID);
}

function drawPlayer(ctx) {
  const player = engine.state.getState(1);
  const { pos, radius, direction } = player;
  const circle = new Circle(pos, ctx, {
    radius,
    direction,
    color: player.id === 1 ? "red" : "green",
  });
  circle.draw();

  drawHelper(player, ctx);
}

function drawHelper(player, ctx) {
  const directionVector = new Vector(0, -1).rotate(player.direction);

  drawHelperVector(player.velocity.x, player.velocity.y, 10, "green", ctx);
  drawHelperVector(directionVector.x, directionVector.y, 50, "black", ctx);

  ctx.beginPath();
  ctx.arc(550, CANVAS_HEIGHT - 50, 50, 0, 2 * Math.PI);
  ctx.strokeStyle = "black";
  ctx.stroke();
  ctx.closePath();
}

function drawHelperVector(x, y, length, color, ctx) {
  const startX = 550;
  const startY = CANVAS_HEIGHT - 50;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(startX + x * length, startY + y * length);
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.closePath();
}

export default {
  init,
  destroy,
  accelerate,
  move,
  rotate,
  getState,
};
