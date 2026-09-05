/**
 * End-to-end headless game simulation test
 */

const assert = require('assert');

// DOM Mocks
global.window = global;
global.localStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key) => { delete store[key]; }
  };
})();

global.document = {
  getElementById: (id) => {
    return {
      id,
      getContext: () => ({
        clearRect: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        fillText: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        arc: () => {},
        save: () => {},
        restore: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        setLineDash: () => {}
      }),
      width: 960,
      height: 600,
      classList: {
        add: () => {},
        remove: () => {}
      },
      addEventListener: () => {},
      style: {}
    };
  }
};

global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (cb) => { return 1; };

// Load game files
const constants = require('../src/constants.js');
Object.assign(global, constants);

global.Piece = require('../src/Piece.js');
global.Board = require('../src/Board.js');
global.Physics = require('../src/Physics.js');
global.ScoreManager = require('../src/ScoreManager.js');
global.LeaderboardManager = require('../src/LeaderboardManager.js');
global.SoundManager = require('../src/SoundManager.js');
global.InputManager = require('../src/InputManager.js');
global.Renderer = require('../src/Renderer.js');
const Game = require('../src/Game.js');

console.log('Testing full game flow...');
const mockCanvas = document.getElementById('gameCanvas');
const game = new Game(mockCanvas);

assert.strictEqual(game.state, GAME_STATE.START);

// Start game
game.startGame();
assert.strictEqual(game.state, GAME_STATE.PLAYING);
assert(game.currentPiece !== null, 'A piece should be active');
assert(game.nextPiece !== null, 'A next piece should be queued');

// Simulate flapping
const initialVy = game.currentPiece.vy;
game.handleFlap();
assert(game.currentPiece.vy < initialVy, 'Flap should decrease vy (impulse upward)');

// Simulate rotating
const initialRot = game.currentPiece.rotation;
game.handleRotateRight();
assert.strictEqual(game.currentPiece.rotation, (initialRot + 1) % 4, 'Rotation right should update rotation state');
game.handleRotateLeft();
assert.strictEqual(game.currentPiece.rotation, initialRot, 'Rotation left should restore rotation state');

// Simulate piece moving all the way to right wall in lock zone
game.currentPiece.x = CANVAS_WIDTH - 70;
game.currentPiece.y = 540; // bottom row
const res = game.physics.update(game.currentPiece, game.board, 0.05);

// Update or lock
if (res.status === 'LOCKED') {
  game.lockCurrentPiece();
  assert(game.scoreManager.piecesPlaced === 1, 'Placed pieces count should increment to 1');
  assert(game.scoreManager.score >= SCORE_PIECE_PLACED, 'Score should reflect placed piece');
}

// Pause test
game.togglePause();
assert.strictEqual(game.state, GAME_STATE.PAUSED);
game.togglePause();
assert.strictEqual(game.state, GAME_STATE.PLAYING);

// Game Over test
game.gameOver('test_game_over');
assert.strictEqual(game.state, GAME_STATE.GAME_OVER);

console.log('✓ Full game lifecycle simulation passed successfully!');
