import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../constants";
import { SHAPE_WALL } from "../../engine/constants";
import engine from "../../engine/index";
import { createGameRunner } from "../../engine/gameRunner";
import Player from "../../engine/objects/Player";
import Wall from "../../engine/objects/Wall";
import { closestPointBallToWall } from "../../engine/physics";
import Vector from "../../utils/vector";
import Ball from "../../game/objects/Ball";

function randomNumber(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}
function randomPos() {
  return new Vector(
    randomNumber(20, CANVAS_WIDTH - 20),
    randomNumber(20, CANVAS_HEIGHT - 20)
  );
}

// Detect touch: pointer:coarse means primary input is a finger (not a mouse/trackpad).
// The old checks ("ontouchstart" in window, maxTouchPoints) give false positives on
// desktop Chrome/Firefox which add touch APIs even without a touchscreen.
let isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
let isDebugingClosestPoint = false;

(function () {
  engine.init();
  engine.canvas.init("canvas");

  // Left wall
  new Wall({ x: 0, y: 0 }, { x: 0, y: CANVAS_HEIGHT });
  // Right wall
  new Wall({ x: CANVAS_WIDTH, y: 0 }, { x: CANVAS_WIDTH, y: CANVAS_HEIGHT });
  // Top wall
  new Wall({ x: 0, y: 0 }, { x: CANVAS_WIDTH, y: 0 });
  // Bottom wall
  new Wall({ x: 0, y: CANVAS_HEIGHT }, { x: CANVAS_WIDTH, y: CANVAS_HEIGHT });

  Array.from(Array(25).keys()).forEach(() => {
    new Ball(randomPos(), { renderOnly: true });
  });

  // Use URL param to force touch mode (set by runtime detection below)
  const forceTouch = new URLSearchParams(window.location.search).has("touch");
  const playerAdapter = isTouchDevice || forceTouch ? "touch" : "keyboard";
  new Player({ x: 29, y: 50 }, { adapter: playerAdapter, color: "#07A0C3", renderOnly: true });

  // Runtime fallback: if keyboard mode but user touches the screen, reload as touch
  if (!isTouchDevice && !forceTouch) {
    const canvas = document.getElementById("canvas");
    canvas.addEventListener("touchstart", function switchToTouch() {
      canvas.removeEventListener("touchstart", switchToTouch);
      window.location.search = "?touch";
    }, { once: true });
  }

  new Player(
    { x: 100, y: 220 },
    {
      adapter: "ai",
      color: "#FF715B",
      radius: 20,
      direction: 180,
      velocity: new Vector(0, 40),
      renderOnly: true,
    }
  );

  new Player(
    { x: 170, y: 360 },
    {
      adapter: "ai",
      color: "#FF715B",
      radius: 20,
      direction: 0,
      velocity: new Vector(0, -40),
      renderOnly: true,
    }
  );

  // Wire the store-based game loop — replaces all physics subscribers
  const runner = createGameRunner(engine, {
    createBall: (pos, opts) => new Ball(pos, opts),
  });
  runner.init();

  const showClosestPointToWalls = document.getElementById(
    "showClosestPointToWall"
  );
  showClosestPointToWalls.addEventListener("click", () => {
    isDebugingClosestPoint = !isDebugingClosestPoint;
    if (isDebugingClosestPoint) {
      engine.canvas.draw("drawClosestPointToWalls", drawClosestPointToWalls, 1);
    }
  });
})();

function drawClosestPointToWalls(_, ctx) {
  const worldObjects = engine.world.getObjects();
  const players = worldObjects.filter(obj => obj.shape !== SHAPE_WALL && obj.adapter);

  players.forEach((player) => {
    worldObjects.forEach((object) => {
      if (object.shape === SHAPE_WALL) {
        const v = closestPointBallToWall(player, object).subtract(player.pos);
        ctx.beginPath();
        ctx.moveTo(player.pos.x + v.x, player.pos.y + v.y);
        ctx.lineTo(player.pos.x, player.pos.y);
        ctx.strokeStyle = "red";
        ctx.stroke();
        ctx.closePath();
      }
    });
  });
}
