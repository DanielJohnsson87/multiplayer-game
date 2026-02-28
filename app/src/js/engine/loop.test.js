import { describe, it, expect, vi, beforeEach } from "vitest";

// --- rAF mock with manual control ---
let rafQueue;
let rafId;

vi.stubGlobal(
  "requestAnimationFrame",
  vi.fn((cb) => {
    const id = ++rafId;
    rafQueue.push({ id, cb });
    return id;
  })
);
vi.stubGlobal("cancelAnimationFrame", vi.fn());

function fireNextFrame(timestamp) {
  const frame = rafQueue.shift();
  if (frame) frame.cb(timestamp);
}

/**
 * Start the loop and fire the initial rAF that sets up timestamps.
 * After this, the next fireNextFrame() will execute actual loop logic.
 */
function startAndPrime(loop, t0 = 1000) {
  loop.start();
  fireNextFrame(t0);
}

// --- Tests ---

describe("game loop", () => {
  let loop;
  // 1000/61 ≈ 16.39ms — the fixed timestep
  const TIMESTEP = 1000 / 61;

  beforeEach(async () => {
    vi.resetModules();
    rafQueue = [];
    rafId = 0;
    requestAnimationFrame.mockClear();
    cancelAnimationFrame.mockClear();
    loop = await import("./loop.js");
  });

  // ----- Subscriptions -----

  describe("subscriptions", () => {
    // Register one update callback, run a frame, check it was called
    // exactly once with the timestep converted to seconds (~0.016s).
    it("calls update subscribers each frame with the timestep in seconds", () => {
      const cb = vi.fn();
      loop.update("a", cb);

      startAndPrime(loop);
      fireNextFrame(1000 + TIMESTEP + 1);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(TIMESTEP / 1000);
    });

    // Same as above but for the draw phase.
    it("calls draw subscribers each frame", () => {
      const cb = vi.fn();
      loop.draw("a", cb);

      startAndPrime(loop);
      fireNextFrame(1000 + TIMESTEP + 1);

      expect(cb).toHaveBeenCalledTimes(1);
    });

    // Register a callback, run a frame (it fires), unsubscribe it,
    // run another frame, verify it didn't fire again.
    it("unsubscribe removes callback from future frames", () => {
      const cb = vi.fn();
      loop.update("a", cb);

      startAndPrime(loop);
      fireNextFrame(1000 + TIMESTEP + 1);
      expect(cb).toHaveBeenCalledTimes(1);

      loop.unsubscribeFrom("update", "a");
      fireNextFrame(1000 + TIMESTEP * 2 + 2);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    // Register three callbacks, run a frame, check all three fired.
    // Makes sure one subscriber doesn't block another.
    it("multiple subscribers all get called", () => {
      const a = vi.fn();
      const b = vi.fn();
      const c = vi.fn();
      loop.update("a", a);
      loop.update("b", b);
      loop.update("c", c);

      startAndPrime(loop);
      fireNextFrame(1000 + TIMESTEP + 1);

      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
      expect(c).toHaveBeenCalledTimes(1);
    });
  });

  // ----- Ordering -----

  describe("ordering", () => {
    // Register callbacks at order 20, 0, 10 (deliberately out of order).
    // Verify they fire as 0, 10, 20. This is how the collision system
    // (order 1001) runs before ball-break (order 1002).
    it("calls update subscribers sorted by order parameter", () => {
      const calls = [];
      loop.update("c", () => calls.push("c"), 20);
      loop.update("a", () => calls.push("a"), 0);
      loop.update("b", () => calls.push("b"), 10);

      startAndPrime(loop);
      fireNextFrame(1000 + TIMESTEP + 1);

      expect(calls).toEqual(["a", "b", "c"]);
    });

    // Same as above but for the draw phase.
    it("calls draw subscribers sorted by order parameter", () => {
      const calls = [];
      loop.draw("c", () => calls.push("c"), 20);
      loop.draw("a", () => calls.push("a"), 0);
      loop.draw("b", () => calls.push("b"), 10);

      startAndPrime(loop);
      fireNextFrame(1000 + TIMESTEP + 1);

      expect(calls).toEqual(["a", "b", "c"]);
    });
  });

  // ----- Fixed timestep -----

  describe("fixed timestep", () => {
    // Advance time by 3 timesteps in one frame. The update callback should
    // fire 3 times — physics runs at a consistent rate regardless of frame rate.
    it("runs multiple update steps when enough time has passed", () => {
      const cb = vi.fn();
      loop.update("a", cb);

      startAndPrime(loop);
      fireNextFrame(1000 + TIMESTEP * 3 + 1);

      expect(cb).toHaveBeenCalledTimes(3);
    });

    // Same 3-timestep jump, but draw only fires once.
    // You don't want to re-render 3 times in a single frame.
    it("draw runs once per frame regardless of update count", () => {
      const drawCb = vi.fn();
      loop.draw("a", drawCb);

      startAndPrime(loop);
      fireNextFrame(1000 + TIMESTEP * 3 + 1);

      expect(drawCb).toHaveBeenCalledTimes(1);
    });

    // First frame advances half a timestep — not enough, no update fires.
    // Second frame adds another half plus a bit — now enough for one update.
    // Tests that partial time isn't lost between frames.
    it("accumulates leftover delta across frames", () => {
      const cb = vi.fn();
      loop.update("a", cb);

      startAndPrime(loop);

      // Advance by less than a full timestep — no update yet
      fireNextFrame(1000 + TIMESTEP * 0.5);
      expect(cb).toHaveBeenCalledTimes(0);

      // Advance by another half + a bit — now enough for 1 update
      fireNextFrame(1000 + TIMESTEP * 1.1);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    // Advance time by 500 timesteps (simulating a tab being backgrounded).
    // The loop caps at 240 updates instead of trying to simulate all 500,
    // preventing the browser from freezing.
    it("panics after 240 update steps to prevent spiral of death", () => {
      const cb = vi.fn();
      loop.update("a", cb);

      startAndPrime(loop);
      fireNextFrame(1000 + TIMESTEP * 500);

      expect(cb.mock.calls.length).toBeLessThanOrEqual(240);
    });
  });

  // ----- Start / Stop -----

  describe("start / stop", () => {
    // Start the loop, immediately stop it, fire a frame. The callback
    // shouldn't run because the loop bailed out early.
    it("stop prevents further frame processing", () => {
      const cb = vi.fn();
      loop.update("a", cb);

      startAndPrime(loop);
      loop.stop();

      fireNextFrame(1000 + TIMESTEP + 1);
      expect(cb).not.toHaveBeenCalled();
    });

    // Calling start twice should only queue one requestAnimationFrame,
    // not two. Prevents double-running the loop.
    it("start is idempotent — second call is a no-op", () => {
      loop.start();
      loop.start();
      expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    });
  });

  // ----- Mid-iteration safety -----

  describe("mid-iteration safety", () => {
    // B subscribes a new callback D (order 5) mid-frame. Currently this
    // pushes + sorts the array during forEach, which shifts elements around —
    // B runs twice and C gets skipped. The correct behavior is that all
    // original callbacks (A, B, C) run exactly once, and D waits until
    // the next frame.
    it("subscribing during iteration should not skip existing callbacks", () => {

      const calls = [];
      let subscribed = false;

      loop.update("a", () => calls.push("a"), 0);
      loop.update(
        "b",
        () => {
          calls.push("b");
          if (!subscribed) {
            subscribed = true;
            loop.update("d", () => calls.push("d"), 5);
          }
        },
        10
      );
      loop.update("c", () => calls.push("c"), 20);

      startAndPrime(loop);
      fireNextFrame(1000 + TIMESTEP + 1);

      expect(calls).toEqual(["a", "b", "c"]);
    });

    // A unsubscribes B during the same frame. Currently B still fires
    // because forEach holds a reference to the old array. The correct
    // behavior is that B should not run after being removed.
    it("unsubscribing during iteration should prevent the callback from firing", () => {

      const calls = [];

      loop.update("a", () => {
        calls.push("a");
        loop.unsubscribeFrom("update", "b");
      }, 0);
      loop.update("b", () => calls.push("b"), 10);

      startAndPrime(loop);
      fireNextFrame(1000 + TIMESTEP + 1);

      expect(calls).toEqual(["a"]);
    });
  });
});
