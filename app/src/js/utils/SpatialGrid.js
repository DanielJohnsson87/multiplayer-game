import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../constants";
import { SHAPE_CIRCLE, SHAPE_WALL } from "../engine/constants";

const MIN_GRID_SIZE = 0; // x & y start at 0
const MAX_GRID_WIDTH = CANVAS_WIDTH;
const MAX_GRID_HEIGHT = CANVAS_HEIGHT;

class SpatialGrid {
  constructor(shapes, options = {}) {
    this.cellSize = options.cellSize ? options.cellSize : 25;
    this.collCount = Math.floor(
      (MAX_GRID_WIDTH - MIN_GRID_SIZE) / this.cellSize
    );
    this.rowCount = Math.floor(
      (MAX_GRID_HEIGHT - MIN_GRID_SIZE) / this.cellSize
    );
    this.grid = Array(this.collCount);

    if (shapes) {
      this.populate(shapes);
    }
  }

  /**
   * Debug function
   */
  draw(ctx) {
    for (let row = 0; row < this.rowCount; row++) {
      const y = (row + 1) * this.cellSize;
      const colls = this.grid[row];
      if (colls) {
        for (let i = 0; i < colls.length; i++) {
          const coll = colls[i];
          const x = i * this.cellSize;

          if (coll) {
            ctx.beginPath();
            ctx.fillStyle = coll.length > 1 ? "red" : "blue";
            ctx.fillRect(x, y - this.cellSize, this.cellSize, this.cellSize);
            ctx.closePath();
          }
        }
      }

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.strokeStyle = "blue";
      ctx.stroke();
      ctx.closePath();

      // console.log(colls.length);
    }
    for (let coll = 0; coll < this.collCount; coll++) {
      const x = (coll + 1) * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.strokeStyle = "blue";
      ctx.stroke();
      ctx.closePath();
    }
  }

  get() {
    return this.grid;
  }

  populate(shapes) {
    this.grid = Array(this.collCount);

    shapes.forEach((shape) => {
      const { minX, minY, maxX, maxY } = boundingBoxFromShape(shape);

      const { col: minCol, row: minRow } = this.positionToGrid({
        x: minX,
        y: minY,
      });
      const { col: maxCol, row: maxRow } = this.positionToGrid({
        x: maxX,
        y: maxY,
      });

      for (let row = minRow; row <= maxRow; row++) {
        if (!this.grid[row]) {
          this.grid[row] = Array(this.collCount);
        }

        for (let col = minCol; col <= maxCol; col++) {
          if (!this.grid[row][col]) {
            this.grid[row][col] = [];
          }
          this.grid[row][col].push(shape);
        }
      }
    });
  }

  possibleCollisions() {
    let possibleCollisions = [];

    for (const row of this.grid) {
      if (!row || row.length < 1) {
        continue;
      }
      for (const coll of row) {
        if (coll && coll.length > 1) {
          possibleCollisions.push(coll);
        }
      }
    }

    return possibleCollisions;
  }

  positionToGrid(vector) {
    const col = Math.floor((vector.x - MIN_GRID_SIZE) / this.cellSize);
    const row = Math.floor((vector.y - MIN_GRID_SIZE) / this.cellSize);

    return { col, row };
  }
}

function boundingBoxFromShape(shape) {
  if (shape.shape === SHAPE_CIRCLE) {
    return {
      minX: shape.pos.x - shape.radius,
      minY: shape.pos.y - shape.radius,
      maxX: shape.pos.x + shape.radius,
      maxY: shape.pos.y + shape.radius,
    };
  }

  if (shape.shape === SHAPE_WALL) {
    const halfWallWidth = shape.width / 2;
    return {
      minX: shape.start.x - halfWallWidth,
      minY: shape.start.y - halfWallWidth,
      maxX: shape.end.x + halfWallWidth,
      maxY: shape.end.y + halfWallWidth,
    };
  }
}

export default SpatialGrid;
