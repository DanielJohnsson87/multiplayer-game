import loop from "./loop";

let canvas = null;
let ctx = null;
let layers = {};
let stars = [];

function generateStars(count) {
  stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      brightness: Math.random(),
      twinkleSpeed: 0.5 + Math.random() * 2,
    });
  }
}

function drawStars() {
  const t = Date.now() * 0.001;
  for (const star of stars) {
    const alpha =
      0.3 + 0.7 * ((Math.sin(t * star.twinkleSpeed + star.brightness * 10) + 1) / 2);
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(200, 210, 255, ${alpha})`;
    ctx.fill();
  }
}

function init(canvasId) {
  canvas = document.getElementById(canvasId);
  canvas.style.background = "#050a18";

  ctx = canvas.getContext("2d");
  generateStars(150);

  loop.draw(
    "canvas",
    (interpolation) => {
      clearCanvas();
      drawStars();
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
