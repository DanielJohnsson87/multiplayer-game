import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../constants";
import { SHAPE_CIRCLE, SHAPE_WALL } from "../engine/constants";

const MIN_GRID_SIZE = 0; // x & y start at 0
const MAX_GRID_WIDTH = CANVAS_WIDTH;
const MAX_GRID_HEIGHT = CANVAS_HEIGHT;

class SpatialGrid {
  constructor(shapes, options = {}) {
    this.cellSize = options.cellSize ? options.cellSize : 25;
    this.scale = options.scale ? options.scale : 1;
    this.collCount = Math.floor(
      (MAX_GRID_WIDTH - MIN_GRID_SIZE) / this.cellSize
    );
    this.rowCount = Math.floor(
      (MAX_GRID_HEIGHT - MIN_GRID_SIZE) / this.cellSize
    );
    this.grid = Array(this.collCount);

    if (shapes) {
      this.populate(shapes, this.scale);
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

  // TODO add scale here to be able to model the gravity field of each shape?
  // (Should be larger than the actual shape.)
  populate(shapes, scale = 1) {
    this.grid = Array(this.collCount);

    shapes.forEach((shape) => {
      const { minX, minY, maxX, maxY } = boundingBoxFromShape(shape, scale);

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

  populatedCells() {
    let populatedCells = [];

    for (const row of this.grid) {
      if (!row || row.length < 1) {
        continue;
      }
      for (const coll of row) {
        if (coll && coll.length > 1) {
          populatedCells.push(coll);
        }
      }
    }

    return populatedCells;
  }

  populatedCellsUnique() {
    let map = {};

    for (const cell of this.populatedCells()) {
      const shapes = cell.filter((shape) => !shape.solid);
      if (shapes.length <= 1) {
        continue;
      }

      for (const shape of shapes) {
        const id = shape.id;
        if (!map[id]) {
          map[id] = new Set();
        }

        for (const add of shapes) {
          if (add.id === id) {
            continue;
          }
          map[id].add(add);
        }
      }
    }

    return map;
  }

  positionToGrid(vector) {
    const col = Math.floor((vector.x - MIN_GRID_SIZE) / this.cellSize);
    const row = Math.floor((vector.y - MIN_GRID_SIZE) / this.cellSize);

    return { col, row };
  }
}

function boundingBoxFromShape(shape, scale = 1) {
  if (shape.shape === SHAPE_CIRCLE) {
    return {
      minX: shape.pos.x - shape.radius * scale,
      minY: shape.pos.y - shape.radius * scale,
      maxX: shape.pos.x + shape.radius * scale,
      maxY: shape.pos.y + shape.radius * scale,
    };
  }

  if (shape.shape === SHAPE_WALL) {
    const halfWallWidth = (shape.width * scale) / 2;
    return {
      minX: shape.start.x - halfWallWidth,
      minY: shape.start.y - halfWallWidth,
      maxX: shape.end.x + halfWallWidth,
      maxY: shape.end.y + halfWallWidth,
    };
  }
}

export default SpatialGrid;
