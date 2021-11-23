package main

import (
	"errors"
	"fmt"
	"log"
	"strconv"
	"strings"
)

type BoundingBox struct {
	x int
	y int
	w int
	h int
}

// decodeMessage turns a ws message in to a ClientMessage struct
func decodeMessage(c *Client, message string) (ClientMessage, error) {
	messageParts := explodeMessage(message)
	clientMessage := ClientMessage{}

	x, err := strconv.Atoi(messageParts[0])
	if err != nil {
		log.Print("Error parsing player x: ", err)
		return clientMessage, errors.New("error parsing player x")
	}

	y, err := strconv.Atoi(messageParts[1])
	if err != nil {
		log.Print("Error parsing player y: ", err)
		return clientMessage, errors.New("error parsing player y")
	}

	w, err := strconv.Atoi(messageParts[2])
	if err != nil {
		log.Print("Error parsing player w: ", err)
		return clientMessage, errors.New("error parsing player w")
	}

	h, err := strconv.Atoi(messageParts[3])
	if err != nil {
		log.Print("Error parsing player h: ", err)
		return clientMessage, errors.New("error parsing player h")
	}

	clientMessage.client = c
	clientMessage.data = PlayerState{bounds: BoundingBox{x: x, y: y, w: w, h: h}}

	return clientMessage, nil

}

func encodeMessage(message ClientMessage) string {
	return fmt.Sprintf("%d,%d,%d,%d,%d", message.client.psudoId, message.data.bounds.x, message.data.bounds.y, message.data.bounds.w, message.data.bounds.h)
}

func explodeMessage(message string) []string {
	messageParts := strings.FieldsFunc(message, func(r rune) bool {
		return r == ','
	})

	return messageParts
}
