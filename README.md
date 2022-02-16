# Multiplayer Game

I'm playing around building a multiplayer game. Probably something similar to [Videoball](https://store.steampowered.com/app/277390/VIDEOBALL/). But things might change during the project. I'm building this mostly to explore game development.


### Project definition

The project definition is very loose at the moment. I want to create a multiplayer game of some sort. When writing this the [Quake III Network model/architecture](https://fabiensanglard.net/quake3/network.php) is my current source of inspiration. 

What kind of game I will build or if it's any fun is secondary. Currently I'm mostly interested in learning 2D vector graphics & the networking part of game development. Hopefully in the future it could evolve to a game that's actually a little bit fun to play. 



### Architecture

My first backend proof of concept was build in Go, mostly because I wanted to try Go some more. But this might change in the future when I start working on the backend. There are some nice benefits if I decide to run the backend in node.js instead. A lot of game logic can be shared.

- **Backend**: Go (Might change)
- **Frontend**: Vanilla JS
- **Communication**: WebSockets 


### Worth looking in to
- Switching to a node backend? Using something like this ? https://geckosio.github.io/
- Node.js snapshot interpolation https://github.com/geckosio/snapshot-interpolation#readme

