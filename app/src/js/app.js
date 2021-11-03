import { initStore } from "./game/state/store";
import initUI from "./UI";

(function () {
  initStore();
  initUI();
})();
