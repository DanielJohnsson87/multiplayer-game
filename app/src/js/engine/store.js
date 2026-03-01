/**
 * Minimal Redux-like store.
 * @param {function} reducer  (state, action) => newState
 * @param {object} initialState
 * @returns {{ getState, dispatch, subscribe }}
 */
export function createStore(reducer, initialState) {
  let state = initialState;
  const listeners = [];

  function getState() {
    return state;
  }

  function dispatch(action) {
    state = reducer(state, action);
    for (let i = 0; i < listeners.length; i++) {
      listeners[i](state, action);
    }
    return state;
  }

  function subscribe(listener) {
    listeners.push(listener);
    return function unsubscribe() {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  return { getState, dispatch, subscribe };
}
