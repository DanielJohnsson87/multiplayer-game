import engine from "../index";
import AI from "../adapters/AI";
import Keyboard from "../adapters/Keyboard";
import Touch from "../adapters/Touch";
import Vector from "../../utils/vector";
import Circle from "./Circle";
import {
  ACTION_ATTRACT,
  ACTION_REPELL,
  ACTION_MOVE_UP,
  ACTION_MOVE_DOWN,
  ACTION_ROTATE_RIGHT,
  ACTION_ROTATE_LEFT,
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
    if (!options.renderOnly) {
      this._subscribeToLoop();
    }
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
    engine.loop.update(`player-${this.id}`, () => {
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
    });
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

export default Player;
