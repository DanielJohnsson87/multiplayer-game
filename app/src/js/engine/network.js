import main from "../game/main";

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
        // TODO need some kind of keep alive here https://www.jstips.co/en/javascript/working-with-websocket-timeout/
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
  if (!socket || socket.readyState === 0) {
    console.warn("No active socket, can't send data");
    return false;
  }

  if (socket.readyState > 1) {
    console.warn(
      `Socket is closed. Ready state: ${socket.readyState}, can't send data`
    );
    main.exitGame(); // TOOD remove dependency to main. Should be possible to register a on close callback
    return false;
  }

  try {
    socket.send(message);
    return true;
  } catch (err) {
    console.warn("Couldn't send message: ", err);
    main.exitGame(); // TOOD remove dependency to main. Should be possible to register a on close callback
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
