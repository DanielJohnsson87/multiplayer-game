import main from "./game/main";
import { initStore } from "./game/state/store";

(function () {
  initStore();
  main.initUI();
})();
