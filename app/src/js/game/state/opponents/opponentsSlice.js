import { createSlice } from "@reduxjs/toolkit";

const initialState = {};

// TODO remove redux and replace with a non redux solution.

// Using Redux Toolkit, allows us to write mutating logic.
// Immer is used under the hood....
export const opponentsSlice = createSlice({
  name: "opponents",
  initialState,
  reducers: {
    resetOpponentsState: (state) => {
      state = initialState;
    },
    moveOpponent: (state, { payload }) => {
      const { id, ...bounds } = decodeMessage(payload);
      state[id] = {
        id,
        ...bounds,
      };
    },
  },
});

function decodeMessage(message) {
  const [id = null, x, y, width, height] = message.split(",");
  return {
    id,
    x: parseIntWithFallback(x, 0),
    y: parseIntWithFallback(y, 0),
    width: parseIntWithFallback(width, 40),
    height: parseIntWithFallback(height, 20),
  };
}

function parseIntWithFallback(subject, fallback = 0) {
  const res = parseInt(subject);
  if (isNaN(res)) {
    return fallback;
  }
  return res;
}

export const { resetOpponentsState, moveOpponent } = opponentsSlice.actions;

export default opponentsSlice.reducer;
