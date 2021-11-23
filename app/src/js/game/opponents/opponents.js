import { CANVAS_ID } from "../../constants";
import gameLoop from "../loop/gameLoop";
import network from "../network";
import {
  moveOpponent,
  resetOpponentsState,
} from "../state/opponents/opponentsSlice";
import { store } from "../state/store";

/**
 * @typedef {Object} Opponent
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

const OPPONENT_NODE_PREFIX = "opponent";
const OPPONENT_CONTAINER = "opponentContainer";

/**
 * Setup the opponents and everything related.
 * @returns void
 */
function init() {
  destroy();
  createOpponentContainer();
  connectStoreToNetwork();

  gameLoop.subscribe("updateOpponentPositions", updateOpponentPositions);
}

/**
 * Tear down the opponents and everything related.
 * @returns void
 */
function destroy() {
  const container = document.getElementById(OPPONENT_CONTAINER);

  if (container) {
    container.innerHTML = "";
  }

  network.unsubscribe("updateStore");
  store.dispatch(resetOpponentsState());
  gameLoop.unsubscribe("updateOpponentPositions");
}

/**
 * Create a DIV to hold all the opponents. Mostly to make it easier to delete them all
 * when calling `destroy`.
 * @returns {Element} DOM element
 */
function createOpponentContainer() {
  let container = document.getElementById(OPPONENT_CONTAINER);
  if (container) {
    return;
  }

  container = document.createElement("div");
  container.id = OPPONENT_CONTAINER;

  return container;
}

/**
 * Creates a new opponent node
 * @param {Opponent} opponent
 * @returns {void}
 */
function createOpponent(opponent) {
  const opponentNode = document.createElement("div");
  const canvas = document.getElementById(CANVAS_ID);

  opponentNode.id = `${OPPONENT_NODE_PREFIX}_${opponent.id}`;
  opponentNode.style.position = "absolute";
  opponentNode.style.transform = `translate3d(${opponent.x}px), ${opponent.y}px, 0`;
  opponentNode.style.width = `${opponent.width}px`;
  opponentNode.style.height = `${opponent.height}px`;
  opponentNode.style.backgroundColor = "red";

  canvas.appendChild(opponentNode);
}

/**
 * Reads current state from store and moves all opponents accodrdingly.
 * @returns {void}
 */
function updateOpponentPositions() {
  const opponents = store.getState()?.opponents;

  Object.values(opponents).forEach((opponent) => {
    const noExistingDOMNode = !document.getElementById(
      `${OPPONENT_NODE_PREFIX}_${opponent.id}`
    );
    if (noExistingDOMNode) {
      createOpponent(opponent);
    }
    moveNode(`${OPPONENT_NODE_PREFIX}_${opponent.id}`, opponent);
  });
}

/**
 *
 * @param {string} id Element ID
 * @param {BoundingBox} boundingBox boundingBox describing where to move the element
 * @returns {void}
 */
function moveNode(id, boundingBox) {
  const node = document.getElementById(id);
  if (!node) {
    return;
  }
  const { x, y, width, height } = boundingBox || {};
  node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  node.style.width = `${width}px`;
  node.style.height = `${height}px`;
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
