import Adapter from "./Adapter.js";

// TODO remove or make make it useful. Currently only used as a dummy adapter.
class AI extends Adapter {
  constructor() {
    super();
  }

  readAndClearActions() {
    return [];
  }

  type() {
    return "ai";
  }
}

export default AI;
