package main

import "log"

var gameState = make(map[*Client]PlayerState)

func UpdatePlayerState(message ClientMessage) {
	gameState[message.client] = message.data

	log.Print(message)
}
