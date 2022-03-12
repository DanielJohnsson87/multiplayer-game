const subscribers = {
  update: [],
  draw: [],
};

/**
 * Tracks the current frame about to be executed.
 */
let frameId = 0;

/**
 * Tracks if loop is running or not.
 */
let isRunning = false;

/**
 * Tracks the current delta time. (Time left to be simulated).
 */
let delta = 0;

/**
 * Tracks the last frame time in ms. Used to calculate delta.
 */
let lastFrameTimeMs = 0;

/**
 * Max allowed fps.
 * TODO 61 here is weird? Setting it to 60 gives me 30fps.
 */
let maxFps = 61;

/**
 * Defines a fixed amount of time to be simulated in each step.
 */
let timeStep = 1000 / maxFps;

/**
 * Tracks the current fps we're runnig the game at.
 */
let fps = maxFps;

/**
 * Tracks frames this second, useful when calculating fps
 */
let framesThisSecond = 0;

/**
 * Tracks the last time we updated our fps
 */
let lastFpsUpdate = 0;

/**
 * The game loop.
 * @param {DOMHighResTimeStamp} now
 */
function loop(now) {
  if (!isRunning) {
    return;
  }

  if (now < lastFrameTimeMs + timeStep) {
    requestAnimationFrame(loop);
    return;
  }

  delta += now - lastFrameTimeMs;
  lastFrameTimeMs = now;

  calculateFpsAverage(now);

  let numUpdateSteps = 0;
  while (delta >= timeStep) {
    // Bail of if we have a lot of time to simulate. Something went wrong. Don't crash the browser.
    if (++numUpdateSteps >= 240) {
      panic();
      break;
    }

    subscribers.update.forEach(({ id, callback }) => {
      callback(timeStep / 1000);
    });
    delta -= timeStep;
  }

  subscribers.draw.forEach(({ id, callback }) => {
    callback(delta / timeStep);
  });

  frameId = requestAnimationFrame(loop);
}

/**
 * Calculate a exponential moving fps average.
 * Useful for debugging right now, but could be used to detect low fps and
 * run expensive operations less frequently or something.
 * @param {*} now
 */
function calculateFpsAverage(now) {
  if (now > lastFpsUpdate + 1000) {
    // The 0.25 is a "decay" parameter - it is essentially how heavily more recent seconds are weighted.
    fps = 0.25 * framesThisSecond + 0.75 * fps;

    lastFpsUpdate = now;
    framesThisSecond = 0;
  }
  framesThisSecond++;
}

/**
 * @param {string} phase
 * @returns {boolean}
 */
function isAllowedPhase(phase) {
  const allowedPhases = ["update", "draw"];
  return allowedPhases.indexOf(phase) >= 0;
}

/**
 * Panic handles the case where the enters the "Spiral of death".
 * In other words, a lot of time to simulate which leads to more time to simulate and eventually a crash.
 *
 * Kind of basic solution, but we just discard any unsimulated delta time
 * and get on with our lives.
 */
function panic() {
  delta = 0;
}

/**
 * Starts the game loop.
 * @returns
 */
function start() {
  if (isRunning) {
    return;
  }

  isRunning = true;
  now = Date.now();
  then = Date.now();

  // Need to call requestAnimationFrame here to get the intial timestamp.
  // Otherwise calculations inside the loop will be off.
  frameId = requestAnimationFrame((now) => {
    lastFrameTimeMs = now;
    lastFpsUpdate = now;
    frameId = requestAnimationFrame(loop);
  });
}

/**
 * Stop the game loop.
 */
function stop() {
  isRunning = false;
  cancelAnimationFrame(frameId);
}

/**
 * @param {number} fps
 */
function setMaxFps(fps) {
  maxFps = fps;
  timeStep = 1000 / maxFps;
}

/**
 * Add callback function to the game loop. Will get called on every iteration
 * @param {string} phase "update" or "draw".
 * @param {string} id
 * @param {function} callback
 * @param {number} order (0...1000) Higher value equals later execution.
 */
function subscribeTo(phase = "update", id, callback, order = 0) {
  if (!isAllowedPhase(phase)) {
    return;
  }

  subscribers[phase].push({ id, callback, order });
  subscribers[phase].sort((a, b) => a.order - b.order);
}

/**
 * Unsubscribe from a subscription.
 * @param {string} id
 */
function unsubscribeFrom(phase = "draw", id) {
  if (!isAllowedPhase(phase)) {
    return;
  }

  subscribers[phase] = subscribers[phase].filter(
    (subscriber) => subscriber.id !== id
  );
}

/**
 * Add callback function to the game loops update phase. Will get called on every iteration
 * @param {string} id
 * @param {function} callback
 * @param {number} order (0...1000) Higher value equals later execution.
 */
function update(id, callback, order = 0) {
  subscribeTo("update", id, callback, order);
}

/**
 * Add callback function to the game loops draw phase. Will get called on every iteration
 * @param {string} id
 * @param {function} callback
 * @param {number} order (0...1000) Higher value equals later execution.
 */
function draw(id, callback, order = 0) {
  subscribeTo("draw", id, callback, order);
}

/**
 * Really shouldn't get the delta time this way.
 * It's just a convienience right now while developing.
 *
 * If delta time is needed it should be passed down from the loop in each iteration.
 * @returns
 */
function _unsafeDeltaTime() {
  return delta;
}

export default {
  start,
  stop,
  _unsafeDeltaTime,
  setMaxFps,
  unsubscribeFrom,
  draw,
  update,
};
export {
  start,
  stop,
  _unsafeDeltaTime,
  setMaxFps,
  unsubscribeFrom,
  draw,
  update,
};
