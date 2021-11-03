import { configureStore } from "@reduxjs/toolkit";
import playerReduce from "./player/playerSlice";
import controlsReduce from "./player/controlsSlice";

let store = null;

function initStore() {
  store = configureStore({
    reducer: {
      player: playerReduce,
      controls: controlsReduce,
    },
  });
}

export { initStore, store };
export default store;
