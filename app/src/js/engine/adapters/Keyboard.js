import Adapter from "./Adapter.js";
import engine from "../index.js";
import {
  ACTION_ATTRACT,
  ACTION_REPELL,
  ACTION_MOVE_UP,
  ACTION_MOVE_DOWN,
  ACTION_ROTATE_RIGHT,
  ACTION_ROTATE_LEFT,
} from "../constants";

class Keyboard extends Adapter {
  constructor() {
    super();
    this.keyBinding = {
      ArrowUp: ACTION_MOVE_UP,
      ArrowRight: ACTION_ROTATE_RIGHT,
      ArrowDown: ACTION_MOVE_DOWN,
      ArrowLeft: ACTION_ROTATE_LEFT,
      q: ACTION_ATTRACT,
      w: ACTION_REPELL,
    };
    this._inputSampleRate = 1000 / 30 / 1000; // 30hz
    this.actions = [];
    this._actionBuffer = {}; // TODO maybe we need the buffer when implementing the network part. Keeping it until then
    this._init();
  }

  _init() {
    document.addEventListener("keydown", this._handleKeyDown);
    this._sampleActions();
    document.addEventListener("keyup", this._handleKeyUp);
  }

  _destroy() {
    document.removeEventListener("keydown", this._handleKeyDown);
    engine.loop.unsubscribeFrom("update", "keyboard");
    document.removeEventListener("keyup", this._handleKeyUp);
  }

  _getActionFromKey(key) {
    if (typeof this.keyBinding[key] === "undefined" || !this.keyBinding[key]) {
      return false;
    }
    return this.keyBinding[key];
  }

  _handleKeyDown = (event) => {
    const action = this._getActionFromKey(event.key);

    if (!action) {
      return;
    }

    if (!this._actionBuffer) {
      this._actionBuffer = {};
    }

    // Already set start time for button
    if (this._actionBuffer[action]) {
      return;
    }

    this._actionBuffer[action] = performance.now();
  };

  _handleKeyUp = (event) => {
    const action = this._getActionFromKey(event.key);

    if (!action) {
      return;
    }

    if (!this._actionBuffer) {
      this._actionBuffer = {};
    }

    if (this._actionBuffer[action]) {
      this._actionBuffer[action] =
        performance.now() - this._actionBuffer[action];
    }

    delete this._actionBuffer[action];
  };

  _sampleActions() {
    if (Object.values(this._actionBuffer).length > 0) {
      const actionObject = {
        actions: Object.entries(this._actionBuffer).reduce(
          (acc, [action, time]) => {
            const now = performance.now();
            const duration = now - time;
            return {
              ...acc,
              [`${action}`]: this.inputDelta(duration),
            };
          },
          {}
        ),
      };
      this.actions.push(actionObject);

      Object.keys(this._actionBuffer).forEach((action) => {
        this._actionBuffer[action] = performance.now();
      });
    }
  }

  inputDelta(duration) {
    return duration / 1000 / this._inputSampleRate;
  }

  readAndClearActions() {
    this._sampleActions();
    const actions = [...this.actions];
    this.actions = [];
    return actions;
  }

  type() {
    return "keyboard";
  }
}

export default Keyboard;
