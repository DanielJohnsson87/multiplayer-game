import gameLoop from "../loop/gameLoop";
import { store } from "../state/store";
import { CANVAS_HEIGHT } from "../../constants";
import playerState from "../state/player";

const CANVAS_ID = "canvas";

let canvas = null;
let ctx = null;

function init() {
  canvas = document.getElementById(CANVAS_ID);
  canvas.style.background = "#999";

  ctx = canvas.getContext("2d");

  gameLoop.subscribe("canvas", () => {
    clearCanvas();
    drawPlayers();
  });
}

function drawPlayers() {
  const player = playerState.getState();
  const opponents = store.getState()?.opponents;
  ctx.beginPath();

  if (player && player.boundingBox) {
    const canvasCoordinate = coordinateToScreen(player.boundingBox);
    const translateXCenter = canvasCoordinate.x + player.boundingBox.width / 2;
    const translateYCenter = canvasCoordinate.y + player.boundingBox.height / 2;

    const x0 = -player.boundingBox.width / 2;
    const y0 = -player.boundingBox.height / 2;

    ctx.translate(translateXCenter, translateYCenter);
    ctx.rotate((player.direction * Math.PI) / 180);

    ctx.fillStyle = "red";
    ctx.fillRect(x0, y0, player.boundingBox.width, player.boundingBox.height);

    const arrowWidth = 2;
    const arrowHeight = 16;
    const arrowX = x0 + player.boundingBox.width / 2 - arrowWidth / 2;
    const arrowY = y0 - arrowHeight;
    ctx.fillStyle = "green";
    ctx.fillRect(arrowX, arrowY, arrowWidth, arrowHeight);
  }

  // Reset transformation matrix to the identity matrix
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  Object.values(opponents).forEach((opponent) => {
    ctx.rect(opponent.x, opponent.y, opponent.width, opponent.height);
  });

  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function coordinateToScreen({ x, y }) {
  return { x, y: -y + CANVAS_HEIGHT };
}

export default {
  init: init,
};
