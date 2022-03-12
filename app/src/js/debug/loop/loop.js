import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../constants";
import engine from "../../engine/index";
import Player from "../../engine/objects/Player";
import Wall from "../../engine/objects/Wall";
import Vector from "../../utils/vector";

(function () {
  engine.collisions.init();
  engine.canvas.init("canvas");

  // Left wall
  new Wall({ x: 0, y: 0 }, { x: 0, y: CANVAS_HEIGHT });
  // Right wall
  new Wall({ x: CANVAS_WIDTH, y: 0 }, { x: CANVAS_WIDTH, y: CANVAS_HEIGHT });
  // // Top wall
  new Wall({ x: 0, y: 0 }, { x: CANVAS_WIDTH, y: 0 });
  // // Bottom wall
  new Wall({ x: 0, y: CANVAS_HEIGHT }, { x: CANVAS_WIDTH, y: CANVAS_HEIGHT });

  new Wall({ x: 300, y: 0 }, { x: 300, y: 240 });

  new Player({ x: 35, y: 150 }, { adapter: "keyboard", color: "green" });

  new Player(
    { x: 20, y: 30 },
    {
      adapter: "ai",
      color: "red",
      radius: 20,
      direction: 90,
      velocity: new Vector(110, 0),
    }
  );

  const setFpsButton = document.getElementById("setFps");
  setFpsButton.addEventListener("click", () => {
    const fps = document.getElementById("fps").value;
    engine.loop.setMaxFps(parseInt(fps));
  });

  const startButton = document.getElementById("start");
  startButton.addEventListener("click", () => {
    engine.loop.start();
  });

  const stopButton = document.getElementById("stop");
  stopButton.addEventListener("click", () => {
    engine.loop.stop();
  });
})();
