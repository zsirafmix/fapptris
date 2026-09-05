/**
 * Flapptris - Piece Class
 * Represents the active flying Tetrimino
 */

class Piece {
  constructor(type, x = 0, y = 0) {
    this.type = type;
    const def = TETRIMINOS[type] || TETRIMINOS.T;
    this.name = def.name;
    this.color = def.color;
    this.border = def.border;
    this.glow = def.glow;
    this.size = def.size;
    this.rotations = def.rotations;
    
    this.rotation = 0; // 0: 0deg, 1: 90deg, 2: 180deg, 3: 270deg
    this.x = x; // Pixel coordinates of top-left
    this.y = y;
    this.vx = INITIAL_SPEED_X;
    this.vy = 0;
    
    this.isSliding = false;
    this.locked = false;
    this.lockTimer = 0; // Lock delay when resting in lock zone
  }

  getMatrix(rotation = this.rotation) {
    return this.rotations[rotation % 4];
  }

  /**
   * Returns relative cell coordinates [{rx, ry}] for the 4 minos
   */
  getRelativeBlocks(rotation = this.rotation) {
    const matrix = this.getMatrix(rotation);
    const blocks = [];
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          blocks.push({ rx: c, ry: r });
        }
      }
    }
    return blocks;
  }

  /**
   * Returns absolute bounding boxes for all 4 minos in pixel coordinates
   */
  getBlocks(px = this.x, py = this.y, rotation = this.rotation) {
    const rel = this.getRelativeBlocks(rotation);
    return rel.map(b => ({
      x: px + b.rx * BLOCK_SIZE,
      y: py + b.ry * BLOCK_SIZE,
      width: BLOCK_SIZE,
      height: BLOCK_SIZE,
      rx: b.rx,
      ry: b.ry
    }));
  }

  /**
   * Get tight pixel bounding box of all 4 minos
   */
  getBoundingBox(px = this.x, py = this.y, rotation = this.rotation) {
    const blocks = this.getBlocks(px, py, rotation);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const b of blocks) {
      if (b.x < minX) minX = b.x;
      if (b.y < minY) minY = b.y;
      if (b.x + b.width > maxX) maxX = b.x + b.width;
      if (b.y + b.height > maxY) maxY = b.y + b.height;
    }
    return {
      left: minX,
      top: minY,
      right: maxX,
      bottom: maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Attempt to rotate the piece (+1 for CW / right, -1 for CCW / left)
   * With wall/floor kicks to avoid getting stuck if possible
   */
  rotate(direction, board, physics) {
    const newRot = (this.rotation + direction + 4) % 4;
    
    // Kick offsets to test: [dx, dy] in pixels
    const kicks = [
      [0, 0],
      [0, -BLOCK_SIZE],      // Kick up
      [-BLOCK_SIZE, 0],     // Kick left
      [BLOCK_SIZE, 0],      // Kick right
      [0, -BLOCK_SIZE * 2],  // Kick up more
      [-BLOCK_SIZE * 2, 0]  // Kick left more
    ];

    for (const [kdx, kdy] of kicks) {
      const testX = this.x + kdx;
      const testY = this.y + kdy;
      
      if (physics.isValidPosition(this, testX, testY, newRot, board)) {
        this.x = testX;
        this.y = testY;
        this.rotation = newRot;
        return true;
      }
    }
    
    return false; // Rotation blocked
  }

  /**
   * Calculate snapped grid position (col, row) in the board
   */
  getGridCoordinates() {
    const col = Math.round(this.x / BLOCK_SIZE);
    const row = Math.round(this.y / BLOCK_SIZE);
    return { col, row };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Piece;
}
