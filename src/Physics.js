/**
 * Flapptris - Physics and Collision System
 * Handles separate X and Y integration, surface sliding, and collision detection
 */

class Physics {
  constructor() {
    this.gravity = GRAVITY;
    this.flapImpulse = FLAP_IMPULSE;
    this.maxFallSpeed = MAX_FALL_SPEED;
    this.maxDt = MAX_DELTA_TIME;
  }

  /**
   * Check if a specific piece at (px, py) with a given rotation
   * intersects any blocked cell or board boundaries
   */
  isValidPosition(piece, px, py, rotation = piece.rotation, board) {
    const blocks = piece.getBlocks(px, py, rotation);
    const eps = 0.05; // Margin to allow exact surface sliding

    for (const b of blocks) {
      // Check boundaries
      if (b.x + eps < 0) return false;
      if (b.x + b.width - eps > CANVAS_WIDTH) return false;
      if (b.y + eps < 0) return false;
      if (b.y + b.height - eps > CANVAS_HEIGHT) return false;

      // Determine overlapping grid cells
      const startCol = Math.floor((b.x + eps) / BLOCK_SIZE);
      const endCol = Math.floor((b.x + b.width - eps) / BLOCK_SIZE);
      const startRow = Math.floor((b.y + eps) / BLOCK_SIZE);
      const endRow = Math.floor((b.y + b.height - eps) / BLOCK_SIZE);

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          if (board.isCellBlocked(c, r)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Check if the piece is currently supported from underneath (for sliding)
   */
  isRestingOnSurface(piece, board) {
    const blocks = piece.getBlocks(piece.x, piece.y, piece.rotation);
    const eps = 0.05;
    const checkDist = 1.0; // 1px below

    for (const b of blocks) {
      const bottomY = b.y + b.height;
      if (bottomY >= CANVAS_HEIGHT - checkDist) {
        return true; // Floor
      }

      const startCol = Math.floor((b.x + eps) / BLOCK_SIZE);
      const endCol = Math.floor((b.x + b.width - eps) / BLOCK_SIZE);
      const belowRow = Math.floor((bottomY + checkDist) / BLOCK_SIZE);

      if (belowRow >= 0 && belowRow < GRID_ROWS) {
        for (let c = startCol; c <= endCol; c++) {
          if (board.isCellBlocked(c, belowRow)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Apply upward impulse (Flap)
   */
  flap(piece) {
    piece.vy = this.flapImpulse;
    piece.isSliding = false;
  }

  /**
   * Fast drop / instant drop towards floor or stack
   */
  drop(piece, board) {
    // Drop downwards until obstacle is reached
    const step = 2;
    while (this.isValidPosition(piece, piece.x, piece.y + step, piece.rotation, board)) {
      piece.y += step;
    }
    piece.vy = 0;
    piece.isSliding = true;
  }

  /**
   * Main physics update step with separate X and Y handling
   * Returns: { status: 'OK' | 'LOCKED' | 'GAME_OVER', reason: string }
   */
  update(piece, board, rawDt) {
    const dt = Math.min(rawDt, this.maxDt);

    // 1. VERTICAL INTEGRATION & COLLISION (Y)
    if (!piece.isSliding) {
      piece.vy += this.gravity * dt;
      if (piece.vy > this.maxFallSpeed) {
        piece.vy = this.maxFallSpeed;
      }
    } else {
      // Check if surface is still underneath
      if (!this.isRestingOnSurface(piece, board)) {
        piece.isSliding = false;
        piece.vy = 0;
      }
    }

    const deltaY = piece.vy * dt;
    if (Math.abs(deltaY) > 0.001) {
      const targetY = piece.y + deltaY;

      if (this.isValidPosition(piece, piece.x, targetY, piece.rotation, board)) {
        piece.y = targetY;
      } else {
        // Collision in Y direction
        if (piece.vy > 0) {
          // Falling down: find exact landing position
          let lowY = piece.y;
          let highY = targetY;
          for (let i = 0; i < 6; i++) {
            const midY = (lowY + highY) / 2;
            if (this.isValidPosition(piece, piece.x, midY, piece.rotation, board)) {
              lowY = midY;
            } else {
              highY = midY;
            }
          }
          piece.y = lowY;
          piece.vy = 0;
          piece.isSliding = true;
        } else if (piece.vy < 0) {
          // Moving up: hit ceiling or bottom of block
          let lowY = targetY;
          let highY = piece.y;
          for (let i = 0; i < 6; i++) {
            const midY = (lowY + highY) / 2;
            if (this.isValidPosition(piece, piece.x, midY, piece.rotation, board)) {
              highY = midY;
            } else {
              lowY = midY;
            }
          }
          piece.y = highY;
          piece.vy = 0;
        }
      }
    }

    // 2. HORIZONTAL INTEGRATION & COLLISION (X)
    const deltaX = piece.vx * dt;
    const targetX = piece.x + deltaX;

    if (this.isValidPosition(piece, targetX, piece.y, piece.rotation, board)) {
      piece.x = targetX;

      // Check if the piece reached or settled deep into the lock zone
      const bbox = piece.getBoundingBox();
      if (bbox.right >= CANVAS_WIDTH - 0.5) {
        // Reached the right wall of the Tetris well!
        return { status: 'LOCKED', reason: 'hit_right_wall' };
      }
    } else {
      // Horizontal forward collision!
      // Check if we are inside the Lock Zone or in the Flight Zone
      const bbox = piece.getBoundingBox();
      const inLockZone = bbox.right >= LOCK_ZONE_START_X;

      if (inLockZone) {
        // In the lock zone, forward movement stopped by right wall or placed block stack!
        // The piece locks and snaps to the Tetris grid!
        return { status: 'LOCKED', reason: 'hit_stack' };
      } else {
        // In the flight corridor, piece collided head-on with an obstacle gate!
        // Forward progress blocked -> Game Over!
        return { status: 'GAME_OVER', reason: 'flight_obstacle_crash' };
      }
    }

    // If piece is resting in lock zone and can no longer move down or right smoothly
    const bbox = piece.getBoundingBox();
    if (bbox.left >= LOCK_ZONE_START_X && piece.isSliding) {
      // In lock zone and sliding on a block or floor:
      // If forward motion is blocked right ahead
      if (!this.isValidPosition(piece, piece.x + 2, piece.y, piece.rotation, board)) {
        return { status: 'LOCKED', reason: 'settled_in_lock_zone' };
      }
    }

    return { status: 'OK' };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Physics;
}
