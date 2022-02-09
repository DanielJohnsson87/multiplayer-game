const subscribers = {};

let fps = 60;
let now = 0;
let then = Date.now();
let interval = 1000 / fps;
let delta = 0;
let stopLoop = false;
let tick = 0;

function loop() {
  if (stopLoop) {
    return;
  }
  requestAnimationFrame(loop);

  now = Date.now();
  delta = now - then;

  if (delta > interval) {
    tick++;
    // Just `then = now` is not enough.
    // Lets say we set fps at 10 which mean
    // each frame must take 100ms
    // Now frame executes in 16ms (60fps) so
    // the loop iterates 7 times (16*7 = 112ms) until
    // delta > interval === true
    // Eventually this lowers down the FPS as
    // 112*10 = 1120ms (NOT 1000ms).
    // So we have to get rid of that extra 12ms
    // by subtracting delta (112) % interval (100).
    then = now - (delta % interval);

    Object.entries(subscribers).forEach(([id, callback]) => {
      callback(tick);
    });
  }
}

function start() {
  stopLoop = false;
  loop();
}

function stop() {
  stopLoop = true;
}

/**
 * Add callback function to the game loop. Will get called on every iteration
 * @param {string} id
 * @param {function} callback
 */
function subscribe(id, callback) {
  subscribers[id] = callback;
}

/**
 * @param {string} id
 */
function unsubscribe(id) {
  delete subscribers[id];
}

export default {
  start,
  stop,
  subscribe,
  unsubscribe,
};
export { start, stop, subscribe, unsubscribe };
