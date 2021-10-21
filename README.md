# Multiplayer Game

I'm playing around building a multiplayer game. Probably some kind of Asteroids version like [Raket game](https://github.com/DanielJohnsson87/raket-game) I created 6 years ago. 


### Project definition

The project definition is very loose at the moment. I want to create a multiplayer game of some sort. When writing this the [Quake III Network model/architecture](https://fabiensanglard.net/quake3/network.php) is my current source of inspiration. 

What kind of game I will build or if it's any fun is secondary. Currently I'm mostly interested in the networking part of game development. Hopefully in the future it could evolve to a game that's actually a little bit fun to play. 



### Architecture

I'm currently contemplating writing the backend in Go, mostly I would like to learn more about Go, and so far I've liked using it. The frontend will be a very simple JS application capable of moving some pixels with the keyboard. 

- **Backend**: Go
- **Frontend**: Vanilla JS
- **Communication**: WebSockets
