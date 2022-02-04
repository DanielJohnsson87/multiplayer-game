class Adapter {
  constructor() {
    if (this.constructor === Adapter) {
      throw new Error(
        "Don't instantiate Adapter class. It's meant to be extended."
      );
    }
    this.actions = {};
  }

  sampleActions() {
    return { ...this.actions };
  }
}

export default Adapter;
