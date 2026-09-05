/**
 * Flapptris - Constants and Game Configuration
 */

const BLOCK_SIZE = 30; // 30x30 px per cell
const GRID_ROWS = 20;  // 20 rows (600px height)
const FLIGHT_COLS = 22; // 22 columns flight corridor (660px)
const LOCK_COLS = 10;  // 10 columns Tetris lock well (300px)
const TOTAL_COLS = FLIGHT_COLS + LOCK_COLS; // 32 columns (960px)

const CANVAS_WIDTH = TOTAL_COLS * BLOCK_SIZE; // 960px
const CANVAS_HEIGHT = GRID_ROWS * BLOCK_SIZE; // 600px
const LOCK_ZONE_START_X = FLIGHT_COLS * BLOCK_SIZE; // 660px

// Physics constants
const GRAVITY = 740;            // px/s^2 downward acceleration
const FLAP_IMPULSE = -320;      // px/s upward impulse
const MAX_FALL_SPEED = 480;     // px/s terminal fall velocity
const INITIAL_SPEED_X = 120;    // px/s horizontal flight speed
const SPEED_X_INCREMENT = 10;   // px/s increase per difficulty level
const MAX_SPEED_X = 280;        // px/s maximum horizontal speed
const MAX_DELTA_TIME = 0.05;    // 50ms maximum physics dt step

// Scoring
const SCORE_PER_SECOND = 10;
const SCORE_PIECE_PLACED = 50;
const SCORE_LINE_CLEARS = {
  1: 100,
  2: 300,
  3: 500,
  4: 800
};

// Game States
const GAME_STATE = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER'
};

// Tetrimino types, colors and shape matrices (4 rotations: 0, 90, 180, 270 deg)
const TETRIMINOS = {
  I: {
    name: 'I',
    color: '#00e5ff',
    border: '#80d8ff',
    glow: 'rgba(0, 229, 255, 0.6)',
    size: 4,
    rotations: [
      [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
      [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
      [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
      [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]
    ]
  },
  O: {
    name: 'O',
    color: '#ffd600',
    border: '#ffff8d',
    glow: 'rgba(255, 214, 0, 0.6)',
    size: 2,
    rotations: [
      [[1,1], [1,1]],
      [[1,1], [1,1]],
      [[1,1], [1,1]],
      [[1,1], [1,1]]
    ]
  },
  T: {
    name: 'T',
    color: '#d500f9',
    border: '#ea80fc',
    glow: 'rgba(213, 0, 249, 0.6)',
    size: 3,
    rotations: [
      [[0,1,0], [1,1,1], [0,0,0]],
      [[0,1,0], [0,1,1], [0,1,0]],
      [[0,0,0], [1,1,1], [0,1,0]],
      [[0,1,0], [1,1,0], [0,1,0]]
    ]
  },
  S: {
    name: 'S',
    color: '#00e676',
    border: '#b9f6ca',
    glow: 'rgba(0, 230, 118, 0.6)',
    size: 3,
    rotations: [
      [[0,1,1], [1,1,0], [0,0,0]],
      [[0,1,0], [0,1,1], [0,0,1]],
      [[0,0,0], [0,1,1], [1,1,0]],
      [[1,0,0], [1,1,0], [0,1,0]]
    ]
  },
  Z: {
    name: 'Z',
    color: '#ff1744',
    border: '#ff8a80',
    glow: 'rgba(255, 23, 68, 0.6)',
    size: 3,
    rotations: [
      [[1,1,0], [0,1,1], [0,0,0]],
      [[0,0,1], [0,1,1], [0,1,0]],
      [[0,0,0], [1,1,0], [0,1,1]],
      [[0,1,0], [1,1,0], [1,0,0]]
    ]
  },
  J: {
    name: 'J',
    color: '#2979ff',
    border: '#82b1ff',
    glow: 'rgba(41, 121, 255, 0.6)',
    size: 3,
    rotations: [
      [[1,0,0], [1,1,1], [0,0,0]],
      [[0,1,1], [0,1,0], [0,1,0]],
      [[0,0,0], [1,1,1], [0,0,1]],
      [[0,1,0], [0,1,0], [1,1,0]]
    ]
  },
  L: {
    name: 'L',
    color: '#ff9100',
    border: '#ffe57f',
    glow: 'rgba(255, 145, 0, 0.6)',
    size: 3,
    rotations: [
      [[0,0,1], [1,1,1], [0,0,0]],
      [[0,1,0], [0,1,0], [0,1,1]],
      [[0,0,0], [1,1,1], [1,0,0]],
      [[1,1,0], [0,1,0], [0,1,0]]
    ]
  }
};

const TETRIMINO_KEYS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BLOCK_SIZE,
    GRID_ROWS,
    FLIGHT_COLS,
    LOCK_COLS,
    TOTAL_COLS,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    LOCK_ZONE_START_X,
    GRAVITY,
    FLAP_IMPULSE,
    MAX_FALL_SPEED,
    INITIAL_SPEED_X,
    SPEED_X_INCREMENT,
    MAX_SPEED_X,
    MAX_DELTA_TIME,
    SCORE_PER_SECOND,
    SCORE_PIECE_PLACED,
    SCORE_LINE_CLEARS,
    GAME_STATE,
    TETRIMINOS,
    TETRIMINO_KEYS
  };
}
