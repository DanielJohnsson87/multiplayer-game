const initialState = {};

let state = { ...initialState };

/**
 * @returns {object}
 */
function getState(id) {
  if (id) {
    return !!state[id] ? { ...state[id] } : null;
  }
  return state;
}

function setState(id, payload) {
  state[id] = { ...payload };
  return state[id];
}

export default {
  getState,
  setState,
};
