package main

type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Inbound messages sent from the clients
	broadcast chan ClientMessage

	// Register request from clients
	register chan *Client

	// Unregister request from clients
	unregister chan *Client
}

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan ClientMessage),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
		case clientMessage := <-h.broadcast:
			UpdatePlayerState(clientMessage)
			for client := range h.clients {
				select {
				case client.send <- clientMessage:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}
