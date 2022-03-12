import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../constants";
import { SHAPE_WALL } from "../../engine/constants";
import engine from "../../engine/index";
import Player from "../../engine/objects/Player";
import Wall from "../../engine/objects/Wall";
import { closestPointBallToWall } from "../../engine/physics";
import Vector from "../../utils/vector";
import Ball from "../../game/objects/Ball";

function randomNumber(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}
function randomPos() {
  return new Vector(randomNumber(0, 550), randomNumber(0, 550));
}

function createOpponents(num) {
  let opponents = [];
  for (let i = 0; i < num; i++) {
    opponents.push(randomPos());
  }

  return opponents;
}

const sizes = [10, 10, 15, 15, 20, 25];
let isDebugingGrid = false;
let isDebugingClosestPoint = false;

(function () {
  engine.init();
  engine.canvas.init("canvas");

  // Left wall
  new Wall({ x: 0, y: 0 }, { x: 0, y: CANVAS_HEIGHT });
  // Right wall
  new Wall({ x: CANVAS_WIDTH, y: 0 }, { x: CANVAS_WIDTH, y: CANVAS_HEIGHT });
  // // Top wall
  new Wall({ x: 0, y: 0 }, { x: CANVAS_WIDTH, y: 0 });
  // // Bottom wall
  new Wall({ x: 0, y: CANVAS_HEIGHT }, { x: CANVAS_WIDTH, y: CANVAS_HEIGHT });

  new Wall({ x: 100, y: 240 }, { x: 350, y: 240 });

  new Ball({ x: 30, y: 130 });

  new Player({ x: 35, y: 150 }, { adapter: "keyboard", color: "green" });

  engine.collisions.debugGrid(isDebugingGrid);
  // createOpponents(1).forEach((pos) => {
  //   new Player(pos, {
  //     adapter: "ai",
  //     color: "red",
  //     radius: sizes[randomNumber(0, 6)],
  //   });
  // });

  new Player(
    { x: 20, y: 20 },
    {
      adapter: "ai",
      color: "red",
      radius: 20,
      direction: 90,
      velocity: new Vector(100, 0),
    }
  );

  const showGridButton = document.getElementById("showGrid");
  showGridButton.addEventListener("click", () => {
    isDebugingGrid = !isDebugingGrid;
    engine.collisions.debugGrid(isDebugingGrid);
  });

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
  const playersObject = engine.state.getState();

  Object.values(playersObject).forEach((player) => {
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
