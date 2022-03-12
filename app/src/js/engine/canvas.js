import loop from "./loop";

let canvas = null;
let ctx = null;
let layers = {};

function init(canvasId) {
  canvas = document.getElementById(canvasId);
  canvas.style.background = "#999";

  ctx = canvas.getContext("2d");

  loop.draw(
    "canvas",
    (interpolation) => {
      clearCanvas();
      drawLayers(interpolation);
      // clearLayers();
    },
    Infinity
  );
}

function drawLayers(interpolation) {
  Object.values(layers).forEach((items) => drawLayer(items, interpolation));
}

function drawLayer(items, interpolation) {
  items.forEach((callbackObj) => callbackObj.callback(interpolation, ctx));
}

// function clearLayers() {
//   layers = {};
// }

function draw(id, callback, layer = 1) {
  if (!layers[layer]) {
    layers[layer] = [];
  }
  layers[layer].push({ id, callback });
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
