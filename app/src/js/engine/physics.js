import Vector from "../utils/vector";

/** Coerce {x,y} to Vector if needed. No-op if already a Vector. */
function vec(p) {
  return p instanceof Vector ? p : new Vector(p.x, p.y);
}

function collisionDetectionBallToBall(ball1, ball2) {
  return (
    ball1.radius + ball2.radius >= vec(ball2.pos).subtract(vec(ball1.pos)).magnitude()
  );
}

function penetrationResolutionBallToBall(ball1, ball2) {
  const pos1 = vec(ball1.pos);
  const pos2 = vec(ball2.pos);
  const dist = pos1.subtract(pos2);
  const depth = ball1.radius + ball2.radius - dist.magnitude();
  const resolution = dist
    .unit()
    .multiply(depth / (ball1.inverseMass + ball2.inverseMass));

  return {
    entity1: pos1.add(resolution.multiply(ball1.inverseMass)),
    entity2: pos2.add(resolution.multiply(-ball2.inverseMass)),
  };
}

function collisionResolutionBallToBall(ball1, ball2) {
  const normal = vec(ball1.pos).subtract(vec(ball2.pos)).unit();
  const relVel = vec(ball1.velocity).subtract(vec(ball2.velocity));
  const sepVel = Vector.dot(relVel, normal);
  const newSepVel = -sepVel * Math.min(ball1.elasticity, ball2.elasticity);

  const vsepDiff = newSepVel - sepVel;

  const impulse = vsepDiff / (ball1.inverseMass + ball2.inverseMass);
  const impulseVec = normal.multiply(impulse);

  return {
    entity1: vec(ball1.velocity).add(impulseVec.multiply(ball1.inverseMass)),
    entity2: vec(ball2.velocity).add(impulseVec.multiply(-ball2.inverseMass)),
  };
}

function wallUnit(wall) {
  if (typeof wall.unit === "function") {
    const u = wall.unit();
    return vec(u);
  }
  const dir = vec(wall.end).subtract(vec(wall.start));
  const mag = dir.magnitude();
  return mag === 0 ? new Vector(0, 0) : new Vector(dir.x / mag, dir.y / mag);
}

function closestPointBallToWall(ball, wall) {
  const ballPos = vec(ball.pos);
  const wStart = vec(wall.start);
  const wEnd = vec(wall.end);
  const u = wallUnit(wall);

  const ballToWallStart = wStart.subtract(ballPos);
  if (Vector.dot(u, ballToWallStart) > 0) {
    return wStart;
  }

  const wallEndToBall = ballPos.subtract(wEnd);
  if (Vector.dot(u, wallEndToBall) > 0) {
    return wEnd;
  }

  const closestDist = Vector.dot(u, ballToWallStart);
  const closestVect = u.multiply(closestDist);
  return wStart.subtract(closestVect);
}

function collisionDetectionBallToWall(ball, wall) {
  const ballToClosest = closestPointBallToWall(ball, wall).subtract(vec(ball.pos));
  if (ballToClosest.magnitude() <= ball.radius + wall.width / 2) {
    return true;
  }
}

function penetrationResolutionBallToWall(ball, wall) {
  const ballPos = vec(ball.pos);
  let penVect = ballPos.subtract(closestPointBallToWall(ball, wall));

  return {
    entity1: ballPos.add(
      penVect
        .unit()
        .multiply(ball.radius + wall.width / 2 - penVect.magnitude())
    ),
    entity2: null,
  };
}

function collisionResolutionBallToWall(ball, wall) {
  const ballPos = vec(ball.pos);
  const ballVel = vec(ball.velocity);
  const normal = ballPos.subtract(closestPointBallToWall(ball, wall)).unit();
  const sepVel = Vector.dot(ballVel, normal);
  const new_sepVel = -sepVel * Math.min(ball.elasticity, wall.elasticity);
  const vsep_diff = sepVel - new_sepVel;

  return {
    entity1: ballVel.add(normal.multiply(-vsep_diff)),
    entity2: null,
  };
}

function gravity(mass1, mass2, distance) {
  const g = 10;
  const force = g * ((mass1 * mass2) / Math.pow(distance, 2));
  const attraction = force / mass2;
  return attraction;
}

const physics = {
  closestPointBallToWall,
  collisionDetectionBallToBall,
  collisionDetectionBallToWall,

  collisionResolutionBallToBall,
  collisionResolutionBallToWall,

  gravity,

  penetrationResolutionBallToBall,
  penetrationResolutionBallToWall,
};

export default physics;
export {
  closestPointBallToWall,
  collisionDetectionBallToBall,
  collisionDetectionBallToWall,
  collisionResolutionBallToWall,
  collisionResolutionBallToBall,
  gravity,
  penetrationResolutionBallToBall,
  penetrationResolutionBallToWall,
};
