import { configureStore } from "@reduxjs/toolkit";
import playerReduce from "./player/playerSlice";
import controlsReduce from "./player/controlsSlice";
import opponentsReduce from "./opponents/opponentsSlice";

let store = null;

function initStore() {
  store = configureStore({
    reducer: {
      player: playerReduce,
      controls: controlsReduce,
      opponents: opponentsReduce,
    },
  });
}

export { initStore, store };
export default store;
