import { keyDown, keyUp } from "../state/player/controlsSlice";
import { move } from "../state/player/playerSlice";
import { store } from "../state/store";

const UP = { x: 0, y: -10 };
const RIGHT = { x: 10, y: 0 };
const DOWN = { x: 0, y: 10 };
const LEFT = { x: -10, y: 0 };

const CONTROLS = {
  ArrowUp: {
    action: function handleArrowUp() {
      store.dispatch(move(UP));
    },
  },
  ArrowRight: {
    action: function handleArrowRight() {
      store.dispatch(move(RIGHT));
    },
  },
  ArrowDown: {
    action: function handleArrowDown() {
      store.dispatch(move(DOWN));
    },
  },
  ArrowLeft: {
    action: function handleArrowLeft() {
      store.dispatch(move(LEFT));
    },
  },
};

export default CONTROLS;
