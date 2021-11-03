import network from "../game/network";
import player from "../game/player/player";
import gameLoop from "../game/loop/gameLoop";

function initUI() {
  const connectButton = document.getElementById("connect");
  const disconnectButton = document.getElementById("disconnect");
  const sendButton = document.getElementById("send");

  connectButton.addEventListener("click", handleConnect);
  disconnectButton.addEventListener("click", handleDisconnect);
  sendButton.addEventListener("click", handleSendMessage);
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
    gameLoop.start();
  } else {
    status.innerHTML = "Status: Couldn't connect";
    network.unsubscribe("UI");
    player.destroy();
    gameLoop.stop();
  }
}

function handleDisconnect() {
  const status = document.getElementById("status");

  if (network.disconnect()) {
    status.innerHTML = "Status: Disconnected";
    network.unsubscribe("UI");
    player.destroy();
    gameLoop.stop();
  }
}

export default initUI;
