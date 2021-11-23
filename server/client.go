package main

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan ClientMessage
}

type ClientMessage struct {
	client *Client
	data   PlayerState
}

type PlayerState struct {
	bounds BoundingBox
}

// handleWebsocket handles websocket requests from the peer.
func handleWebsocket(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("Error upgrading to WS connection: ", err)
		return
	}

	client := &Client{hub: hub, conn: conn, send: make(chan ClientMessage)}
	client.hub.register <- client

	log.Printf("Connection established: IP %s", conn.RemoteAddr().String())

	go client.writePump()
	go client.readPump()
}

// readPump pumps messages from the websocket connection to the hub.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, msg, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		message, err := decodeMessage(c, string(msg))
		if err != nil {
			log.Printf("error transforming message: %s\n", string(msg))
		}
		c.hub.broadcast <- message
	}
}

func (c *Client) writePump() {
	defer func() {
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				// The hub closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if c == message.client {
				// Don't echo message back to the sender
				continue
			}

			stringMessage := encodeMessage(message)
			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write([]byte(stringMessage))
		}
	}
}
