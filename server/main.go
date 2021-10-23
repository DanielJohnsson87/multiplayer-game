package main

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return r.Header.Get("Origin") == "http://localhost:9000"
	},
}

func main() {
	http.HandleFunc("/command", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		var clientIp string = conn.RemoteAddr().String()

		if err != nil {
			log.Print("Error upgrading to WS connection: ", err)
			return
		}

		log.Printf("Connection established: IP %s", clientIp)

		for {
			msgType, msg, err := conn.ReadMessage()
			if err != nil {
				log.Printf("Error reading message from %s: %s", clientIp, err)
				return
			}

			log.Printf("%s sent: %s\n", clientIp, string(msg))

			// Write message back to browser
			if err = conn.WriteMessage(msgType, msg); err != nil {
				return
			}
		}
	})

	http.ListenAndServe(":4000", nil)
}
