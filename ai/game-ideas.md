# Game Ideas

Brainstormed ideas for turning the physics sandbox into an actual game. The attract/repel gravity mechanic is the most unique thing we have — ideas that lean into it are marked with *.

## Quick Wins (small effort)
- **Health + damage** — Collisions with asteroids/enemies drain HP. Health bar UI. Game over on death.
- **Smarter AI enemies** — Make AI chase the player instead of drifting aimlessly. The AI adapter already exists, just needs better logic.
- **Waves** — Clear all asteroids → next wave spawns more/faster/bigger. Simple progression loop.

## Medium Effort
- **Shooting** — Fire button (or tap right side) shoots projectiles in facing direction. Destroy asteroids and enemies.
- **Asteroid splitting** — Big asteroids break into 2-3 smaller ones when destroyed. Satisfying chain reactions, especially with gravity pull.
- **Score system** — Points for destroying asteroids/enemies. Multiplier for combos. High score display.

## Gravity-Focused Ideas *
- **Gravity combat*** — Attract asteroids toward you, then repel them at enemies like projectiles. No traditional shooting — gravity IS your weapon.
- **Asteroid herding*** — Attract asteroids and deliver them to a scoring zone. Risk/reward: carrying more = more points, but you're a bigger slower target.
- **Defense mode*** — Protect a point on the map. Repel incoming asteroids away from it. Gets harder as more/faster asteroids spawn.
- **Gravity golf*** — Use attract/repel to guide a ball to a target location. Puzzle-like levels.

## Recommended First Step
Start with **health/damage + gravity combat**. It makes the attract/repel mechanic the core gameplay loop instead of just a demo feature, and doesn't require building a projectile system. Then layer on waves and scoring.
