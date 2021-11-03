import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  ArrowUp: false,
  ArrowRight: false,
  ArrowDown: false,
  ArrowLeft: false,
};

// Using Redux Toolkit, allows us to write mutating logic.
// Immer is used under the hood....
export const controlSlice = createSlice({
  name: "controls",
  initialState,
  reducers: {
    keyDown: (state, { payload }) => {
      state[payload] = true;
    },
    keyUp: (state, { payload }) => {
      state[payload] = false;
    },
  },
});

export const { keyDown, keyUp } = controlSlice.actions;

export default controlSlice.reducer;
