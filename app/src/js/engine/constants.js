export const SHAPE_WALL = "wall";
export const SHAPE_CIRCLE = "circle";

export const ACTION_MOVE_UP = "ACTION_MOVE_UP";
export const ACTION_MOVE_DOWN = "ACTION_MOVE_DOWN";
export const ACTION_ROTATE_RIGHT = "ACTION_ROTATE_RIGHT";
export const ACTION_ROTATE_LEFT = "ACTION_ROTATE_LEFT";

export const ACTION_ATTRACT = "ACTION_ATTRACT";
export const ACTION_REPELL = "ACTION_REPELL";

/**
 * Multiply a shapes radius by this factor to get the shapes
 * gravitational area.
 */
export const GRAVITATATIONAL_RADIUS_FACTOR = 4;

/**
 * Defines by which factor actions like `ACTION_ATTRACT` & `ACTION_REPELL`
 * will increase/decrease a shapes mass.
 */
export const GRAVITATATIONAL_MASS_FACTOR = 10;
