import Vector from "../utils/vector";

function collisionBallToBall(ball1, ball2) {
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
