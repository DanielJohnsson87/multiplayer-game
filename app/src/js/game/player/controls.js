const keys = {
  ArrowUp: false,
  ArrowRight: false,
  ArrowDown: false,
  ArrowLeft: false,
};

function init() {
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
}

function getKeys() {
  return { ...keys };
  // return Object.entries(keys).reduce((acc, [key, active]) => {
  //   if (!active) {
  //     return acc;
  //   }
  //   return [...acc, key];
  // }, []);
}

function isKeyPressed() {
  return Object.values(keys).reduce((acc, active) => {
    if (active || acc) {
      return true;
    }
    return false;
  }, false);
}

function handleKeyDown(event) {
  const unmappedKey = typeof keys[event.key] === "undefined";

  if (event.repeat || unmappedKey) {
    return;
  }

  keys[event.key] = true;
}

function handleKeyUp(event) {
  const unmappedKey = typeof keys[event.key] === "undefined";

  if (event.repeat || unmappedKey) {
    return;
  }

  keys[event.key] = false;
}

export default { init, isKeyPressed, getKeys };
