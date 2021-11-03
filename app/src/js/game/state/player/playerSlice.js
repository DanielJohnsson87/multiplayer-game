import { createSlice } from "@reduxjs/toolkit";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../../constants";
import {
  boundingBox,
  curriedWithinBounds,
  sumCoordinates,
} from "../../../utils/geometry";

const containCoordinatesWithinCanvas = curriedWithinBounds({
  x: CANVAS_WIDTH,
  y: CANVAS_HEIGHT,
});

const initialState = {
  boundingBox: boundingBox({ x: 0, y: 0, width: 40, height: 20 }),
};

// Using Redux Toolkit, allows us to write mutating logic.
// Immer is used under the hood....
export const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    resetPlayerState: (state) => {
      state.boundingBox = initialState.boundingBox;
    },
    move: (state, { payload }) => {
      const coordinates = sumCoordinates(state.boundingBox, payload);
      const { x, y } = containCoordinatesWithinCanvas(
        boundingBox({ ...state.boundingBox, ...coordinates })
      );

      state.boundingBox = {
        ...state.boundingBox,
        x,
        y,
      };
    },
  },
});

export const { move, resetPlayerState } = playerSlice.actions;

export default playerSlice.reducer;
