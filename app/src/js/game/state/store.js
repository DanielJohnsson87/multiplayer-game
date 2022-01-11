import { configureStore } from "@reduxjs/toolkit";
import opponentsReduce from "./opponents/opponentsSlice";

let store = null;

function initStore() {
  store = configureStore({
    reducer: {
      opponents: opponentsReduce,
    },
  });
}

export { initStore, store };
export default store;
