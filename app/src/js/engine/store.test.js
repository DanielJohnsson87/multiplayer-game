import { describe, it, expect, vi } from "vitest";
import { createStore } from "./store";

describe("createStore", () => {
  const counter = (state, action) => {
    switch (action.type) {
      case "INC":
        return { ...state, count: state.count + 1 };
      case "ADD":
        return { ...state, count: state.count + action.value };
      default:
        return state;
    }
  };

  it("returns initial state", () => {
    const store = createStore(counter, { count: 0 });
    expect(store.getState()).toEqual({ count: 0 });
  });

  it("dispatch updates state via reducer", () => {
    const store = createStore(counter, { count: 0 });
    store.dispatch({ type: "INC" });
    expect(store.getState()).toEqual({ count: 1 });
  });

  it("dispatch returns new state", () => {
    const store = createStore(counter, { count: 5 });
    const result = store.dispatch({ type: "ADD", value: 3 });
    expect(result).toEqual({ count: 8 });
  });

  it("notifies listeners on dispatch", () => {
    const store = createStore(counter, { count: 0 });
    const listener = vi.fn();
    store.subscribe(listener);
    store.dispatch({ type: "INC" });
    expect(listener).toHaveBeenCalledWith({ count: 1 }, { type: "INC" });
  });

  it("unsubscribe stops notifications", () => {
    const store = createStore(counter, { count: 0 });
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    unsub();
    store.dispatch({ type: "INC" });
    expect(listener).not.toHaveBeenCalled();
  });

  it("multiple dispatches accumulate state", () => {
    const store = createStore(counter, { count: 0 });
    store.dispatch({ type: "INC" });
    store.dispatch({ type: "INC" });
    store.dispatch({ type: "ADD", value: 10 });
    expect(store.getState()).toEqual({ count: 12 });
  });
});
