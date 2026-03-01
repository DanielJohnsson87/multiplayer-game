import engine from "../index";
import AI from "../adapters/AI";
import Keyboard from "../adapters/Keyboard";
import Touch from "../adapters/Touch";
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
    this.initialMass = this.mass;
    this.attraction = 0;
    this._subscribeToLoop();
    engine.world.addObject(this);
  }

  serialize() {
    return {
      ...super.serialize(),
      attraction: this.attraction,
    };
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
      case "touch":
        return new Touch();
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

      if (this.adapter.type() === "keyboard") {
        drawHelper(this, this.ctx);
      }
    });

    engine.canvas.draw(`player-${this.id}`, (interpolation) => {
      this.drawAttractionField(interpolation);
      this.draw(interpolation);
    });
  }

  draw(interpolation = 0) {
    const interpolated = {
      x: this.previousPos.x + (this.pos.x - this.previousPos.x) * interpolation,
      y: this.previousPos.y + (this.pos.y - this.previousPos.y) * interpolation,
    };

    const adapterType = this.adapter.type();
    if (adapterType === "keyboard" || adapterType === "touch") {
      this._drawSpaceship(interpolated);
    } else {
      this._drawEnemyShip(interpolated);
    }
  }

  _drawSpaceship(pos) {
    const ctx = this.ctx;
    const r = this.radius;
    const angleRad = this.direction * (Math.PI / 180);

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angleRad);

    // Main hull
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.3);          // Nose
    ctx.lineTo(-r * 0.8, r * 0.7);    // Left wing
    ctx.lineTo(-r * 0.3, r * 0.4);    // Left indent
    ctx.lineTo(r * 0.3, r * 0.4);     // Right indent
    ctx.lineTo(r * 0.8, r * 0.7);     // Right wing
    ctx.closePath();
    ctx.fillStyle = "#07A0C3";
    ctx.fill();
    ctx.strokeStyle = "#0ED2FF";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cockpit
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.7);
    ctx.lineTo(-r * 0.2, r * 0.05);
    ctx.lineTo(r * 0.2, r * 0.05);
    ctx.closePath();
    ctx.fillStyle = "#0ED2FF";
    ctx.fill();

    // Engine glow
    const glowSize = 0.3 + Math.random() * 0.15;
    ctx.beginPath();
    ctx.moveTo(-r * 0.25, r * 0.45);
    ctx.lineTo(0, r * (0.45 + glowSize));
    ctx.lineTo(r * 0.25, r * 0.45);
    ctx.closePath();
    ctx.fillStyle = `rgba(255, ${150 + Math.random() * 105}, 50, 0.9)`;
    ctx.fill();

    ctx.restore();
  }

  _drawEnemyShip(pos) {
    const ctx = this.ctx;
    const r = this.radius;
    const angleRad = this.direction * (Math.PI / 180);

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angleRad);

    // Enemy hull — angular, menacing
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.1);          // Nose
    ctx.lineTo(-r * 1.0, r * 0.2);    // Left wing tip
    ctx.lineTo(-r * 0.5, r * 0.6);    // Left inner
    ctx.lineTo(0, r * 0.3);           // Center rear
    ctx.lineTo(r * 0.5, r * 0.6);     // Right inner
    ctx.lineTo(r * 1.0, r * 0.2);     // Right wing tip
    ctx.closePath();
    ctx.fillStyle = "#FF715B";
    ctx.fill();
    ctx.strokeStyle = "#FF3320";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Enemy cockpit
    ctx.beginPath();
    ctx.arc(0, -r * 0.15, r * 0.22, 0, 2 * Math.PI);
    ctx.fillStyle = "#FF3320";
    ctx.fill();

    ctx.restore();
  }

  drawAttractionField(interpolation = 0) {
    if (!this.attraction) {
      return;
    }

    const interpolated = {
      x: this.previousPos.x + (this.pos.x - this.previousPos.x) * interpolation,
      y: this.previousPos.y + (this.pos.y - this.previousPos.y) * interpolation,
    };

    const ctx = this.ctx;
    const fieldRadius = this.radius * GRAVITATATIONAL_RADIUS_FACTOR;
    const color = this.attraction > 0 ? [0, 255, 100] : [255, 50, 50];

    // Outer field glow
    ctx.beginPath();
    ctx.arc(interpolated.x, interpolated.y, fieldRadius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.12)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.3)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Pulsing rings
    const t = Date.now() * 0.003;
    for (let i = 3; i >= 0; i--) {
      const pulse = (t + i * 0.5) % 2;
      const ringR = fieldRadius * (0.3 + pulse * 0.35);
      const alpha = 0.25 * (1 - pulse / 2);
      ctx.beginPath();
      ctx.arc(interpolated.x, interpolated.y, ringR, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.closePath();
    }
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
