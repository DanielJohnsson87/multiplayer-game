import loop from "./loop";

let canvas = null;
let ctx = null;
let layers = []; // 0 = background, 1 = foreground

function init(canvasId) {
  canvas = document.getElementById(canvasId);
  canvas.style.background = "#999";

  ctx = canvas.getContext("2d");

  loop.subscribe("canvas", () => {
    clearCanvas();
    drawLayers();
    clearLayers();
  });
}

function drawLayers() {
  layers.forEach(drawLayer);
}

function drawLayer(items) {
  items.forEach((drawCallback) => drawCallback(ctx));
}
function clearLayers() {
  layers = [];
}

function draw(callback, layer = 1) {
  if (!layers[layer]) {
    layers[layer] = [];
  }
  layers[layer].push(callback);
}

function getContext() {
  return ctx;
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export default {
  init,
  draw,
  getContext,
};
