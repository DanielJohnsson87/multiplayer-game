let world = [];

/**
 * @returns {object}
 */
function getObjects() {
  return world;
}

function addObject(object) {
  world.push(object);
}

export default {
  getObjects,
  addObject,
};
