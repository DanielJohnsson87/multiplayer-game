import engine from "../index";
import AI from "../adapters/AI";
import Keyboard from "../adapters/Keyboard";
import Vector from "../../utils/vector";
import Circle from "./Circle";
import { CANVAS_HEIGHT } from "../../constants";
import {
  ACTION_ATTRACT,
  ACTION_REPELL,
  ACTION_MOVE_UP,
  ACTION_MOVE_DOWN,
  ACTION_ROTATE_RIGHT,
  ACTION_ROTATE_LEFT,
  GRAVITATATIONAL_RADIUS_FACTOR,
  GRAVITATATIONAL_MASS_FACTOR,
} from "../constants";

const defaultArgs = {
  acceleration: 5,
  elasticity: 0.5,
};

class Player extends Circle {
  constructor(pos, options = {}) {
    super(pos, { ...defaultArgs, ...options });
    this.adapter = this._setupAdapter(options.adapter); // Could be control, network or perhaps AI?
    this._subscribeToLoop();
    this.initialMass = this.mass;
    this.attraction = 0;
  }

  _setMass(mass) {
    this.mass = mass;
    this._setAttraction(mass);
    this.setInverseMass(mass);
  }

  _restoreMass() {
    this.mass = this.initialMass;
    this._setAttraction(this.initialMass);
    this.setInverseMass(this.initialMass);
  }

  _setAttraction(mass) {
    if (mass === this.initialMass) {
      this.attraction = 0;
    } else if (mass > 0) {
      this.attraction = 1;
    } else {
      this.attraction = -1;
    }
  }

  _setupAdapter(adapter) {
    switch (adapter) {
      case "keyboard":
        return new Keyboard();
      case "ai":
        return new AI();
      default:
        throw new Error("Player is missing a valid adapter");
    }
  }

  _subscribeToLoop() {
    engine.loop.update(`player-${this.id}`, (delta) => {
      this._restoreMass();
      this.adapter.readAndClearActions().forEach((tickActions) => {
        const { actions } = tickActions;
        const rotation = actionsToRotation(actions);
        const acceleration = actionsToAcceleration(actions);
        const mass = actionToAttraction(this.initialMass, actions);

        if (mass) {
          this._setMass(mass);
        }

        if (rotation) {
          this.rotate(rotation);
        }

        if (acceleration) {
          this.accelerate(acceleration.rotate(this.direction));
        }
      });

      engine.state.setState(this.id, this);

      if (this.adapter.type() === "keyboard") {
        drawHelper(this, this.ctx);
      }
    });

    engine.canvas.draw(`player-${this.id}`, (interpolation) => {
      this.drawAttractionField(interpolation);
      this.draw(interpolation);
    });
  }

  drawAttractionField(interpolation = 0) {
    if (!this.attraction) {
      return;
    }

    const interpolated = {
      x: this.previousPos.x + (this.pos.x - this.previousPos.x) * interpolation,
      y: this.previousPos.y + (this.pos.y - this.previousPos.y) * interpolation,
    };
    this.ctx.beginPath();

    this.ctx.arc(
      interpolated.x,
      interpolated.y,
      this.radius * GRAVITATATIONAL_RADIUS_FACTOR,
      0,
      2 * Math.PI
    );
    this.ctx.fillStyle =
      this.attraction > 0 ? "rgba(0, 255, 0, 0.15)" : "rgba(255, 0, 0, 0.15)";
    this.ctx.fill();
    this.ctx.closePath();
  }
}

function actionToAttraction(mass, actions) {
  let alteredMass = 0;

  if (actions[ACTION_ATTRACT]) {
    alteredMass = mass * GRAVITATATIONAL_MASS_FACTOR;
  }

  if (actions[ACTION_REPELL]) {
    alteredMass = mass * -GRAVITATATIONAL_MASS_FACTOR;
  }

  return alteredMass;
}

// TODO reuse these
function actionsToAcceleration(actions) {
  let acc = null;

  if (actions[ACTION_MOVE_UP] || actions[ACTION_MOVE_DOWN]) {
    acc = new Vector(0, 0);
  }

  if (actions[ACTION_MOVE_UP]) {
    const inputDelta = actions[ACTION_MOVE_UP];
    acc = acc.add({ x: 0, y: -1 * inputDelta });
  }

  if (actions[ACTION_MOVE_DOWN]) {
    const inputDelta = actions[ACTION_MOVE_DOWN];
    acc = acc.add({ x: 0, y: 1 * inputDelta });
  }

  return acc;
}

function actionsToRotation(actions) {
  let directionChange = 0;

  if (actions[ACTION_ROTATE_RIGHT]) {
    const inputDelta = actions[ACTION_ROTATE_RIGHT];
    directionChange = 7.5 * inputDelta;
  }

  if (actions[ACTION_ROTATE_LEFT]) {
    const inputDelta = actions[ACTION_ROTATE_LEFT];
    directionChange = -7.5 * inputDelta;
  }

  return directionChange;
}

function drawHelper(player, ctx) {
  const directionVector = new Vector(0, -1).rotate(player.direction);

  drawHelperVector(
    ctx,
    player.velocity.x * engine.loop._unsafeDeltaTime(),
    player.velocity.y * engine.loop._unsafeDeltaTime(),
    10,
    "green"
  );
  drawHelperVector(ctx, directionVector.x, directionVector.y, 50, "black");

  ctx.beginPath();
  ctx.arc(550, CANVAS_HEIGHT - 50, 50, 0, 2 * Math.PI);
  ctx.strokeStyle = "black";
  ctx.stroke();
  ctx.closePath();
}

function drawHelperVector(ctx, x, y, length, color) {
  const startX = 550;
  const startY = CANVAS_HEIGHT - 50;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(startX + x * length, startY + y * length);
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.closePath();
}

export default Player;
