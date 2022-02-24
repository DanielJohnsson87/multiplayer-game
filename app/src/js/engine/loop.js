const subscribers = [];

let now = 0;
let then = 0;
let delta = 0;
let stopLoop = false;
let tick = 0;

let fpsCap = 60;

// let intervalCap = 1000 / fpsCap;

function loop() {
  if (stopLoop) {
    return;
  }

  let intervalCap = 1000 / fpsCap;
  if (intervalCap > Date.now() - then) {
    requestAnimationFrame(loop);
    console.log("#capp not met", intervalCap, Date.now() - then);
    return;
  }

  tick++;
  now = Date.now();
  delta = (now - then) / 1000;

  subscribers.forEach(({ id, callback }) => {
    callback(delta);
  });
  then = Date.now();
  requestAnimationFrame(loop);
}

function start() {
  stopLoop = false;
  now = Date.now();
  then = Date.now();
  loop();
}

function stop() {
  now = 0;
  then = 0;
  stopLoop = true;
}

function step() {
  const fps = fpsCap || 60;
  tick++;
  delta = 1000 / fps / 1000;

  subscribers.forEach(({ id, callback }) => {
    callback(delta);
  });
}

function deltaTime() {
  return delta;
}

function setFPSCap(fps) {
  fpsCap = fps;
}

/**
 * Add callback function to the game loop. Will get called on every iteration
 * @param {string} id
 * @param {function} callback
 * @param {number} order (0...1000) Higher value equals later execution.
 */
function subscribe(id, callback, order = 0) {
  subscribers.push({ id, callback, order });
  subscribers.sort((a, b) => a.order - b.order);
}

/**
 * @param {string} id
 */
function unsubscribe(id) {
  subscribers = subscribers.filter((subscriber) => subscriber.id !== id);
}

export default {
  start,
  stop,
  step,
  deltaTime,
  setFPSCap,
  subscribe,
  unsubscribe,
};
export { start, stop, step, deltaTime, subscribe, unsubscribe };
