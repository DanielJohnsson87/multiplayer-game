import Vector from "../utils/vector";

function collisionDetectionBallToBall(ball1, ball2) {
  return (
    ball1.radius + ball2.radius >= ball2.pos.subtract(ball1.pos).magnitude()
  );
}

function penetrationResolutionBallToBall(ball1, ball2) {
  const dist = ball1.pos.subtract(ball2.pos);
  const depth = ball1.radius + ball2.radius - dist.magnitude();
  const resolution = dist
    .unit()
    .multiply(depth / (ball1.inverseMass + ball2.inverseMass));

  return {
    entity1: ball1.pos.add(resolution.multiply(ball1.inverseMass)),
    entity2: ball2.pos.add(resolution.multiply(-ball2.inverseMass)),
  };
}

function collisionResolutionBallToBall(ball1, ball2) {
  const normal = ball1.pos.subtract(ball2.pos).unit();
  const relVel = ball1.velocity.subtract(ball2.velocity);
  const sepVel = Vector.dot(relVel, normal);
  const newSepVel = -sepVel * Math.min(ball1.elasticity, ball2.elasticity);

  // The difference between the new and the original sep.velocity value
  const vsepDiff = newSepVel - sepVel;

  // Dividing the impulse value in the ration of the inverse masses
  // and adding the impulse vector to the original vel. vectors
  // according to their inverse mass
  const impulse = vsepDiff / (ball1.inverseMass + ball2.inverseMass);
  const impulseVec = normal.multiply(impulse);

  return {
    entity1: ball1.velocity.add(impulseVec.multiply(ball1.inverseMass)),
    entity2: ball2.velocity.add(impulseVec.multiply(-ball2.inverseMass)),
  };
}

function closestPointBallToWall(ball, wall) {
  const ballToWallStart = wall.start.subtract(ball.pos);
  if (Vector.dot(wall.unit(), ballToWallStart) > 0) {
    return wall.start;
  }

  const wallEndToBall = ball.pos.subtract(wall.end);
  if (Vector.dot(wall.unit(), wallEndToBall) > 0) {
    return wall.end;
  }

  const closestDist = Vector.dot(wall.unit(), ballToWallStart);
  const closestVect = wall.unit().multiply(closestDist);
  return wall.start.subtract(closestVect);
}

function collisionDetectionBallToWall(ball, wall) {
  const ballToClosest = closestPointBallToWall(ball, wall).subtract(ball.pos);
  if (ballToClosest.magnitude() <= ball.radius + wall.width / 2) {
    return true;
  }
}

function penetrationResolutionBallToWall(ball, wall) {
  let penVect = ball.pos.subtract(closestPointBallToWall(ball, wall));

  return {
    entity1: ball.pos.add(
      penVect
        .unit()
        .multiply(ball.radius + wall.width / 2 - penVect.magnitude())
    ),
    entity2: null,
  };
}

function collisionResolutionBallToWall(ball, wall) {
  const normal = ball.pos.subtract(closestPointBallToWall(ball, wall)).unit();
  const sepVel = Vector.dot(ball.velocity, normal);
  const new_sepVel = -sepVel * Math.min(ball.elasticity, wall.elasticity);
  const vsep_diff = sepVel - new_sepVel;

  return {
    entity1: ball.velocity.add(normal.multiply(-vsep_diff)),
    entity2: null,
  };
}

const physics = {
  closestPointBallToWall,
  collisionDetectionBallToBall,
  collisionDetectionBallToWall,

  collisionResolutionBallToBall,
  collisionResolutionBallToWall,

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
  penetrationResolutionBallToBall,
  penetrationResolutionBallToWall,
};
