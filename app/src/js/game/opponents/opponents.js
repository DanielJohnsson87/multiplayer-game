import gameLoop from "../loop/gameLoop";
import network from "../network";
import {
  moveOpponent,
  resetOpponentsState,
} from "../state/opponents/opponentsSlice";
import { store } from "../state/store";

/**
 * Setup the opponents and everything related.
 * @returns void
 */
function init() {
  destroy();
  connectStoreToNetwork();
}

/**
 * Tear down the opponents and everything related.
 * @returns void
 */
function destroy() {
  network.unsubscribe("updateStore");
  store.dispatch(resetOpponentsState());
  gameLoop.unsubscribe("updateOpponentPositions");
}

/**
 * @returns {void}
 */
function connectStoreToNetwork() {
  network.subscribe("updateStore", (event) => {
    store.dispatch(moveOpponent(event.data));
  });
}

const opponents = {
  init: init,
  destroy: destroy,
};

export default opponents;
export { init, destroy };
