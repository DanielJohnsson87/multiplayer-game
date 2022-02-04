import engine from "../engine";
import opponents from "./opponents";
import Player from "../engine/objects/Player";

const CANVAS_ID = "canvas";

function initUI() {
  const connectButton = document.getElementById("connect");
  const disconnectButton = document.getElementById("disconnect");
  const sendButton = document.getElementById("send");

  connectButton.addEventListener("click", handleConnect);
  disconnectButton.addEventListener("click", exitGame);
  sendButton.addEventListener("click", handleSendMessage);

  engine.canvas.init(CANVAS_ID);
}

function logMessage(e) {
  const output = document.getElementById("output");

  output.innerHTML = "Server ACK: " + e.data + "\n";
}

function handleSendMessage() {
  const serverMessage = document.getElementById("message");

  engine.network.message(serverMessage.value);
}

async function handleConnect() {
  const status = document.getElementById("status");
  const serverInput = document.getElementById("server");

  const connected = await engine.network.connect(serverInput.value);

  if (connected) {
    status.innerHTML = "Status: Connected";
    engine.network.subscribe("UI", logMessage);
    engine.init();
    opponents.init();
    const player = new Player({ x: 100, y: 100 }, "keyboard");
  } else {
    status.innerHTML = "Status: Couldn't connect";
    engine.network.unsubscribe("UI");
    engine.network.unsubscribe("updateStore");
    engine.destroy();
    opponents.destroy();
    // TODO destroy player
  }
}

function exitGame() {
  const status = document.getElementById("status");

  if (network.disconnect()) {
    status.innerHTML = "Status: Disconnected";
    engine.network.unsubscribe("UI");
    engine.network.unsubscribe("updateStore");
    engine.destroy();
    opponents.destroy();
  }
}

export default {
  initUI,
  exitGame,
};
