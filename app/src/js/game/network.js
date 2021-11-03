let socket = null;
const subscribers = {};

/**
 * @param {string} url
 * @returns {Promise<boolean>}
 */
async function connect(url) {
  if (socket) {
    console.warn("Socket existed, disconnecting first..");
    disconnect();
  }

  return new Promise((resolve, reject) => {
    try {
      socket = new WebSocket(url);
      socket.onopen = function () {
        resolve(true);
      };

      socket.onmessage = function (event) {
        Object.entries(subscribers).forEach(([id, callback]) => {
          callback(event);
        });
      };
    } catch (err) {
      reject(false);
    }
  });
}

/**
 * @returns {boolean}
 */
function disconnect() {
  if (socket) {
    try {
      socket.close(1000, "User closed connection.");
      socket = null;
    } catch (err) {
      console.warn("Couldn't disconnect", err);
      return false;
    }
  }
  return true;
}

/**
 * @param {*} message
 * @returns {boolean}
 */
async function message(message) {
  if (!socket) {
    console.warn("No active socket, can't send data");
    return false;
  }
  try {
    socket.send(message);
    return true;
  } catch (err) {
    console.warn("Couldn't send message: ", err);
    return false;
  }
}

/**
 * Subscribe to network messages.
 * @param {string} id
 * @param {function} callback Function to be called on message received
 */
function subscribe(id, callback) {
  subscribers[id] = callback;
}

/**
 * Unsubscribes from network messages.
 * @param {string} id
 */
function unsubscribe(id) {
  delete subscribers[id];
}

const network = {
  connect,
  disconnect,
  message,
  subscribe,
  unsubscribe,
};

export default network;
export { connect, disconnect, message, subscribe, unsubscribe };
