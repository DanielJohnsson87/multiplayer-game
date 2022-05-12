import canvas from "./canvas";
import collisions from "./collisions";
import gravity from "./gravity";
import loop from "./loop";
import network from "./network";
import state from "./state";
import world from "./world";

function init() {
  loop.start();
  collisions.init();
}

function destroy() {
  loop.stop();
  collisions.destroy();
}

export default {
  canvas,
  collisions,
  gravity,

  destroy,
  init,
  loop,
  network,
  state, // Does state actually belong in the engine?
  world,
};
