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

function removeObject(id) {
  world = world.filter((obj) => obj.id !== id);
}

export default {
  getObjects,
  addObject,
  removeObject,
};
