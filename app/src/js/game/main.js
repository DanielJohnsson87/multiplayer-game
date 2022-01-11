import network from "./network";
import player from "./player/player";
import opponents from "./opponents/opponents";
import gameLoop from "./loop/gameLoop";
import canvas from "./canvas/canvas";

function initUI() {
  const connectButton = document.getElementById("connect");
  const disconnectButton = document.getElementById("disconnect");
  const sendButton = document.getElementById("send");

  connectButton.addEventListener("click", handleConnect);
  disconnectButton.addEventListener("click", exitGame);
  sendButton.addEventListener("click", handleSendMessage);

  canvas.init();
}

function logMessage(e) {
  const output = document.getElementById("output");

  output.innerHTML = "Server ACK: " + e.data + "\n";
}

function handleSendMessage() {
  const serverMessage = document.getElementById("message");

  network.message(serverMessage.value);
}

async function handleConnect() {
  const status = document.getElementById("status");
  const serverInput = document.getElementById("server");

  const connected = await network.connect(serverInput.value);

  if (connected) {
    status.innerHTML = "Status: Connected";
    network.subscribe("UI", logMessage);
    player.init();
    opponents.init();
    gameLoop.start();
  } else {
    status.innerHTML = "Status: Couldn't connect";
    network.unsubscribe("UI");
    network.unsubscribe("updateStore");
    player.destroy();
    opponents.destroy();
    gameLoop.stop();
  }
}

function exitGame() {
  const status = document.getElementById("status");

  if (network.disconnect()) {
    status.innerHTML = "Status: Disconnected";
    network.unsubscribe("UI");
    network.unsubscribe("updateStore");
    player.destroy();
    opponents.destroy();
    gameLoop.stop();
  }
}

export default {
  initUI,
  exitGame,
};
