// Tunable constants — adjust via playtesting
export const BREAK_FORCE_PER_MASS = 30;
export const ABSORB_MASS_RATIO = 3;

/**
 * Determine the outcome of a collision for one asteroid.
 * Called independently for each asteroid in a pair — each gets its own result.
 *
 * @param {number} selfMass - This asteroid's mass (radius²)
 * @param {number} otherMass - The other object's mass
 * @param {number} relativeSpeed - Pre-collision closing speed along collision normal
 * @returns {'break' | 'absorb' | 'nothing'}
 */
export function asteroidCollisionOutcome(selfMass, otherMass, relativeSpeed) {
  const reducedMass = (selfMass * otherMass) / (selfMass + otherMass);
  const impactForce = relativeSpeed * reducedMass;
  const breakThreshold = selfMass * BREAK_FORCE_PER_MASS;

  if (impactForce > breakThreshold) return "break";
  if (selfMass > otherMass * ABSORB_MASS_RATIO) return "absorb";
  return "nothing";
}
