import { CANVAS_ID } from "../../constants";
import gameLoop from "../loop/gameLoop";
import { keyDown, keyUp } from "../state/player/controlsSlice";
import { resetPlayerState } from "../state/player/playerSlice";
import { store } from "../state/store";
import CONTROLS from "./controls";
import network from "../network";

const PLAYER_NODE_ID = "player";

let lastSentBoundingBox = null;

/**
 * Setup the player and everything related.
 * @returns void
 */
function init() {
  destroy();

  const playerBoundingBox = store.getState()?.player?.boundingBox;
  const playerNode = document.createElement("div");
  const canvas = document.getElementById(CANVAS_ID);
  const { x = 0, y = 0, width = 10, height = 10 } = playerBoundingBox || {};
  playerNode.id = PLAYER_NODE_ID;
  playerNode.style.position = "absolute";
  playerNode.style.transform = `translate3d(${x}px), ${y}px, 0`;

  playerNode.style.width = `${width}px`;
  playerNode.style.height = `${height}px`;
  playerNode.style.backgroundColor = "#333";

  canvas.appendChild(playerNode);
  setupControls();

  gameLoop.subscribe("movePlayer", movePlayer);
}

/**
 * Tear down the player and everything related.
 * @returns void
 */
function destroy() {
  const playerNode = document.getElementById(PLAYER_NODE_ID);

  if (playerNode) {
    playerNode.remove();
  }

  store.dispatch(resetPlayerState());
}

/**
 * Reads current input control state and fires appropriet actions.
 * Should execute every game loop iteration.
 */
function movePlayer() {
  const controls = store.getState()?.controls;
  // TODO maybe possible to create some kind of dictionary for faster lookups.
  Object.entries(controls).forEach(fireControlActions);

  const boundingBox = store.getState()?.player?.boundingBox;
  const nothingToReportOrDraw =
    !boundingBox || lastSentBoundingBox === boundingBox;

  if (nothingToReportOrDraw) {
    return;
  }

  drawPlayer(PLAYER_NODE_ID, boundingBox);
  sendPositionToServer(boundingBox);

  lastSentBoundingBox = boundingBox;
}

// TODO this should probably move to some file that handles the drawing. And also use canvas.
function drawPlayer(id, boundingBox) {
  const playerNode = document.getElementById(id);
  if (!playerNode) {
    return;
  }
  const { x, y, width, height } = boundingBox || {};
  playerNode.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  playerNode.style.width = `${width}px`;
  playerNode.style.height = `${height}px`;
}

function setupControls() {
  document.addEventListener("keydown", handleKeyBoardActions);
  document.addEventListener("keyup", handleKeyBoardActions);
}

function handleKeyBoardActions(event) {
  const unmappedKey = !CONTROLS[event.key];

  if (event.repeat || unmappedKey) {
    return;
  }

  if (event.type === "keydown") {
    store.dispatch(keyDown(event.key));
  } else {
    store.dispatch(keyUp(event.key));
  }
}

function fireControlActions([key, active]) {
  const control = CONTROLS[key];
  if (!control || !active) {
    return;
  }
  // Execute control action responsible for updating player position
  control.action();
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
