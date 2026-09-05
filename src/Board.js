/**
 * Flapptris - Board Class
 * Manages the flight zone obstacles and the 10x20 Tetris lock grid
 */

class Board {
  constructor() {
    this.rows = GRID_ROWS; // 20
    this.lockCols = LOCK_COLS; // 10
    this.flightCols = FLIGHT_COLS; // 22
    this.totalCols = TOTAL_COLS; // 32
    
    // Lock zone 10x20 grid (null or { color, border, glow })
    this.grid = [];
    
    // Flight corridor obstacle grid: 20 rows x 22 cols
    this.obstacles = [];
    
    this.reset();
  }

  reset() {
    // Initialize empty 10x20 lock grid
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.lockCols; c++) {
        row.push(null);
      }
      this.grid.push(row);
    }

    // Initialize empty flight corridor obstacles
    this.obstacles = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.flightCols; c++) {
        row.push(null);
      }
      this.obstacles.push(row);
    }
  }

  /**
   * Set up obstacles for a given level
   * Level 1: Open flight zone to get familiar with controls
   * Level 2+: Gates with large pass-through gaps
   */
  generateObstacles(level = 1) {
    // Clear existing obstacles
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.flightCols; c++) {
        this.obstacles[r][c] = null;
      }
    }

    if (level <= 1) {
      // Level 1: Pure flight runway, no gate obstacles (just ceiling, floor & Tetris well)
      return;
    }

    // Obstacle color styling
    const obstacleStyle = {
      color: '#3949ab',
      border: '#7986cb',
      glow: 'rgba(57, 73, 171, 0.5)'
    };

    // Number of gate pillars based on level (1 gate at level 2, 2 gates at level 3+)
    const gateColumns = level === 2 ? [11] : [7, 15];

    gateColumns.forEach((col, idx) => {
      // Choose vertical gap of 6 blocks (generous opening for 3-4 block tetriminos)
      const gapHeight = Math.max(5, 7 - Math.floor(level / 3));
      const minGapRow = 3;
      const maxGapRow = this.rows - gapHeight - 3;
      const gapStart = minGapRow + ((idx * 5 + level * 2) % (maxGapRow - minGapRow + 1));

      for (let r = 0; r < this.rows; r++) {
        if (r < gapStart || r >= gapStart + gapHeight) {
          this.obstacles[r][col] = obstacleStyle;
        }
      }
    });
  }

  /**
   * Check if a specific global cell (col, row) is occupied by a block or boundary
   */
  isCellBlocked(col, row) {
    // Ceiling and floor checks
    if (row < 0 || row >= this.rows) {
      return true;
    }

    // Left wall check (outside 0)
    if (col < 0) {
      return true;
    }

    // Right wall check (beyond totalCols)
    if (col >= this.totalCols) {
      return true;
    }

    // Lock zone check
    if (col >= this.flightCols) {
      const lockCol = col - this.flightCols;
      if (lockCol >= 0 && lockCol < this.lockCols) {
        return this.grid[row][lockCol] !== null;
      }
      return true;
    }

    // Flight zone check
    if (col >= 0 && col < this.flightCols) {
      return this.obstacles[row][col] !== null;
    }

    return false;
  }

  /**
   * Lock a piece into the Tetris grid in the lock zone with smart non-overlapping alignment
   */
  lockPiece(piece) {
    const relBlocks = piece.getRelativeBlocks();
    const idealCol = piece.x / BLOCK_SIZE;
    const idealRow = piece.y / BLOCK_SIZE;
    const baseCol = Math.round(idealCol);
    const baseRow = Math.round(idealRow);

    // Nearby candidate offsets to test: closest first
    const candidates = [
      [0, 0],
      [0, -1],  // Shift up 1
      [-1, 0], // Shift left 1
      [1, 0],  // Shift right 1
      [0, 1],  // Shift down 1
      [0, -2], // Shift up 2
      [-1, -1],
      [1, -1],
      [-2, 0],
      [2, 0]
    ];

    let bestFit = null;
    let minDistance = Infinity;

    for (const [dc, dr] of candidates) {
      const testCol = baseCol + dc;
      const testRow = baseRow + dr;

      let valid = true;
      for (const b of relBlocks) {
        const c = testCol + b.rx;
        const r = testRow + b.ry;
        const lockCol = c - this.flightCols;

        // Must be within lock zone boundaries
        if (r < 0 || r >= this.rows || lockCol < 0 || lockCol >= this.lockCols) {
          valid = false;
          break;
        }

        // Must not overlap any already placed block
        if (this.grid[r][lockCol] !== null) {
          valid = false;
          break;
        }
      }

      if (valid) {
        const dist = Math.hypot((testCol - idealCol), (testRow - idealRow));
        if (dist < minDistance) {
          minDistance = dist;
          bestFit = { col: testCol, row: testRow };
        }
      }
    }

    if (!bestFit) {
      // Well is full or piece cannot fit cleanly
      return false;
    }

    // Place minos into the lock grid
    for (const b of relBlocks) {
      const c = bestFit.col + b.rx;
      const r = bestFit.row + b.ry;
      const lockCol = c - this.flightCols;

      this.grid[r][lockCol] = {
        color: piece.color,
        border: piece.border,
        glow: piece.glow
      };
    }

    return true;
  }

  /**
   * Check for full rows in the lock zone and clear them
   * Returns { linesCleared, clearedRows }
   */
  checkAndClearLines() {
    const clearedRows = [];

    for (let r = 0; r < this.rows; r++) {
      let full = true;
      for (let c = 0; c < this.lockCols; c++) {
        if (this.grid[r][c] === null) {
          full = false;
          break;
        }
      }
      if (full) {
        clearedRows.push(r);
      }
    }

    if (clearedRows.length > 0) {
      // Remove cleared rows and push empty rows to top
      for (const rowIndex of clearedRows) {
        this.grid.splice(rowIndex, 1);
        const newRow = [];
        for (let c = 0; c < this.lockCols; c++) {
          newRow.push(null);
        }
        this.grid.unshift(newRow);
      }
    }

    return {
      linesCleared: clearedRows.length,
      clearedRows
    };
  }

  /**
   * Check if lock zone is overloaded / topped out at the entrance
   */
  isTopBlocked() {
    // If the top 2 rows of the entrance column (lockCol 0) are blocked
    return this.grid[0][0] !== null || this.grid[1][0] !== null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Board;
}
