import Adapter from "./Adapter.js";
import engine from "../index.js";
import {
  ACTION_ATTRACT,
  ACTION_REPELL,
  ACTION_MOVE_UP,
  ACTION_ROTATE_RIGHT,
  ACTION_ROTATE_LEFT,
} from "../constants";

const JOYSTICK_RADIUS = 55;
const KNOB_RADIUS = 24;
const JOYSTICK_DEAD_ZONE = 0.12;

const BTN_RADIUS = 30;

class Touch extends Adapter {
  constructor() {
    super();
    this._inputSampleRate = 1000 / 30 / 1000; // 30hz, same as Keyboard
    this.actions = [];
    this._actionBuffer = {};

    // Single joystick + two action buttons
    this._joystick = { touchId: null, dx: 0, dy: 0 };
    this._attractActive = false;
    this._repelActive = false;
    this._attractTouchId = null;
    this._repelTouchId = null;

    // Positions in canvas coordinates
    this._joystickCenter = { x: 130, y: 490 };
    this._attractBtn = { x: 1100, y: 520 };
    this._repelBtn = { x: 1030, y: 520 };

    this._canvas = null;
    this._init();
  }

  _init() {
    this._canvas = document.getElementById("canvas");
    this._canvas.addEventListener("touchstart", this._handleTouchStart, {
      passive: false,
    });
    this._canvas.addEventListener("touchmove", this._handleTouchMove, {
      passive: false,
    });
    this._canvas.addEventListener("touchend", this._handleTouchEnd, {
      passive: false,
    });
    this._canvas.addEventListener("touchcancel", this._handleTouchEnd, {
      passive: false,
    });

    engine.canvas.draw(
      "touch-controls",
      () => {
        this._drawControls();
      },
      999
    );
  }

  _toCanvasCoords(touch) {
    const rect = this._canvas.getBoundingClientRect();
    return {
      x: (touch.clientX - rect.left) * (this._canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (this._canvas.height / rect.height),
    };
  }

  _isInCircle(pos, center, radius) {
    const dx = pos.x - center.x;
    const dy = pos.y - center.y;
    return dx * dx + dy * dy <= radius * radius;
  }

  _handleTouchStart = (event) => {
    event.preventDefault();
    for (const touch of event.changedTouches) {
      const pos = this._toCanvasCoords(touch);

      // Attract button
      if (this._isInCircle(pos, this._attractBtn, BTN_RADIUS * 1.3)) {
        this._attractActive = true;
        this._attractTouchId = touch.identifier;
        if (!this._actionBuffer[ACTION_ATTRACT]) {
          this._actionBuffer[ACTION_ATTRACT] = performance.now();
        }
        continue;
      }

      // Repel button
      if (this._isInCircle(pos, this._repelBtn, BTN_RADIUS * 1.3)) {
        this._repelActive = true;
        this._repelTouchId = touch.identifier;
        if (!this._actionBuffer[ACTION_REPELL]) {
          this._actionBuffer[ACTION_REPELL] = performance.now();
        }
        continue;
      }

      // Joystick — grab if left half of screen
      if (this._joystick.touchId === null && pos.x < 600) {
        this._joystick.touchId = touch.identifier;
        this._joystick.dx = 0;
        this._joystick.dy = 0;
        continue;
      }
    }
  };

  _handleTouchMove = (event) => {
    event.preventDefault();
    for (const touch of event.changedTouches) {
      if (touch.identifier === this._joystick.touchId) {
        const pos = this._toCanvasCoords(touch);
        let dx = pos.x - this._joystickCenter.x;
        let dy = pos.y - this._joystickCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > JOYSTICK_RADIUS) {
          dx = (dx / dist) * JOYSTICK_RADIUS;
          dy = (dy / dist) * JOYSTICK_RADIUS;
        }
        this._joystick.dx = dx / JOYSTICK_RADIUS;
        this._joystick.dy = dy / JOYSTICK_RADIUS;
      }
    }
  };

  _handleTouchEnd = (event) => {
    event.preventDefault();
    for (const touch of event.changedTouches) {
      if (touch.identifier === this._joystick.touchId) {
        this._joystick.touchId = null;
        this._joystick.dx = 0;
        this._joystick.dy = 0;
      }
      if (touch.identifier === this._attractTouchId) {
        this._attractActive = false;
        this._attractTouchId = null;
        delete this._actionBuffer[ACTION_ATTRACT];
      }
      if (touch.identifier === this._repelTouchId) {
        this._repelActive = false;
        this._repelTouchId = null;
        delete this._actionBuffer[ACTION_REPELL];
      }
    }
  };

  _sampleActions() {
    const actions = {};
    const now = performance.now();

    const jx = this._joystick.dx;
    const jy = this._joystick.dy;
    const magnitude = Math.sqrt(jx * jx + jy * jy);

    if (magnitude > JOYSTICK_DEAD_ZONE) {
      // Joystick angle in degrees (0 = up, clockwise)
      const joystickAngle =
        ((Math.atan2(jx, -jy) * 180) / Math.PI + 360) % 360;

      // Always rotate toward the joystick direction
      // The player's current direction is read from the Player object via the
      // engine state, but we don't have direct access here. Instead we emit
      // a rotation action proportional to the angular difference.
      // We store the target angle and let _sampleActions produce rotation.
      this._targetAngle = joystickAngle;
      this._hasThrustInput = true;

      // Thrust — push forward proportional to how far the stick is pushed
      const thrustMag =
        (magnitude - JOYSTICK_DEAD_ZONE) / (1 - JOYSTICK_DEAD_ZONE);
      actions[ACTION_MOVE_UP] = thrustMag;
    } else {
      this._hasThrustInput = false;
      this._targetAngle = null;
    }

    // Rotation toward target angle
    if (this._targetAngle !== null) {
      // Get current player direction from engine state
      const state = engine.state.getState();
      const players = Object.values(state);
      // Find the touch-controlled player (there should be only one)
      let currentDir = 0;
      for (const p of players) {
        if (p.adapter && p.adapter.type && p.adapter.type() === "touch") {
          currentDir = p.direction;
          break;
        }
      }

      // Shortest angular difference
      let diff = this._targetAngle - currentDir;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      const absDiff = Math.abs(diff);
      if (absDiff > 2) {
        // Rotation speed scales with how far off we are, capped at 1.0
        const rotMag = Math.min(absDiff / 45, 1.0);
        if (diff > 0) {
          actions[ACTION_ROTATE_RIGHT] = rotMag;
        } else {
          actions[ACTION_ROTATE_LEFT] = rotMag;
        }
      }
    }

    // Attract / Repel buttons
    if (this._actionBuffer[ACTION_ATTRACT]) {
      const duration = now - this._actionBuffer[ACTION_ATTRACT];
      actions[ACTION_ATTRACT] = this.inputDelta(duration);
      this._actionBuffer[ACTION_ATTRACT] = now;
    }
    if (this._actionBuffer[ACTION_REPELL]) {
      const duration = now - this._actionBuffer[ACTION_REPELL];
      actions[ACTION_REPELL] = this.inputDelta(duration);
      this._actionBuffer[ACTION_REPELL] = now;
    }

    if (Object.keys(actions).length > 0) {
      this.actions.push({ actions });
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
    return "touch";
  }

  _drawControls() {
    const ctx = engine.canvas.getContext();

    // Joystick
    this._drawJoystick(
      ctx,
      this._joystickCenter,
      this._joystick.dx,
      this._joystick.dy,
      this._joystick.touchId !== null
    );

    // Attract button
    this._drawActionButton(
      ctx,
      this._attractBtn,
      "ATR",
      this._attractActive,
      [0, 255, 100]
    );
    // Repel button
    this._drawActionButton(
      ctx,
      this._repelBtn,
      "REP",
      this._repelActive,
      [255, 50, 50]
    );
  }

  _drawJoystick(ctx, center, dx, dy, active) {
    // Outer ring
    ctx.beginPath();
    ctx.arc(center.x, center.y, JOYSTICK_RADIUS, 0, 2 * Math.PI);
    ctx.strokeStyle = active
      ? "rgba(14, 210, 255, 0.4)"
      : "rgba(14, 210, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(14, 210, 255, 0.03)";
    ctx.fill();

    // Direction indicators (small ticks around the ring)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const inner = JOYSTICK_RADIUS - 6;
      const outer = JOYSTICK_RADIUS;
      ctx.beginPath();
      ctx.moveTo(
        center.x + Math.cos(angle) * inner,
        center.y + Math.sin(angle) * inner
      );
      ctx.lineTo(
        center.x + Math.cos(angle) * outer,
        center.y + Math.sin(angle) * outer
      );
      ctx.strokeStyle = "rgba(14, 210, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Knob
    const knobX = center.x + dx * JOYSTICK_RADIUS;
    const knobY = center.y + dy * JOYSTICK_RADIUS;
    ctx.beginPath();
    ctx.arc(knobX, knobY, KNOB_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = active
      ? "rgba(14, 210, 255, 0.5)"
      : "rgba(14, 210, 255, 0.2)";
    ctx.fill();
    ctx.strokeStyle = "rgba(14, 210, 255, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  _drawActionButton(ctx, center, label, active, color) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, BTN_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = active
      ? `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.35)`
      : `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.08)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${active ? 0.7 : 0.25})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "bold 11px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${active ? 0.9 : 0.5})`;
    ctx.fillText(label, center.x, center.y);
  }
}

export default Touch;
