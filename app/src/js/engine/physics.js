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

const physics = {
  collisionBallToBall,
  penetrationResolutionBallToBall,
};

export default physics;
export { collisionBallToBall, penetrationResolutionBallToBall };
