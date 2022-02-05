import Vector from "../utils/vector";

function collisionBallToBall(ball1, ball2) {
  return (
    ball1.radius + ball2.radius >= ball2.pos.subtract(ball1.pos).magnitude()
  );
}

function penetrationResolutionBallToBall(ball1, ball2) {
  const dist = ball1.pos.subtract(ball2.pos);
  const depth = ball1.radius + ball2.radius - dist.magnitude();
  const resolution = dist.unit().multiply(depth / 2);

  return {
    entity1: ball1.pos.add(resolution),
    entity2: ball2.pos.add(resolution.multiply(-1)),
  };
}

function collisionResolutionBallToBall(ball1, ball2) {
  // Collision normal vector
  const normal = ball1.pos.subtract(ball2.pos).unit();
  // Relative velocity vector
  const relativeVelocity = ball1.velocity.subtract(ball2.velocity);
  // Separating velocity - relativeVelocity projected onto the collision normal vector
  const separatingVelocity = Vector.dot(relativeVelocity, normal);
  // The projection value after the collision (multiplied by -1)
  const newSeparatingVelocity = -separatingVelocity;
  // Collision normal vector with the magnitude of the newSeparatingVelocity
  let separatingVelocityVector = normal.multiply(newSeparatingVelocity);

  return {
    // Adding the separating velocity vector to the original velocity vector
    entity1: ball1.velocity.add(separatingVelocityVector),
    // Adding its opposite to the other balls original velocity vector
    entity2: ball2.velocity.add(separatingVelocityVector.multiply(-1)),
  };
}

const physics = {
  collisionBallToBall,
  collisionResolutionBallToBall,
  penetrationResolutionBallToBall,
};

export default physics;
export {
  collisionBallToBall,
  collisionResolutionBallToBall,
  penetrationResolutionBallToBall,
};
