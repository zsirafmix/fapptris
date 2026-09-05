const assert = require('assert');

// Mock localStorage if not available in Node
global.localStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key) => { delete store[key]; }
  };
})();

// Mock document / window for node tests
global.window = global;

const constants = require('../src/constants.js');
Object.assign(global, constants);

const Piece = require('../src/Piece.js');
const Board = require('../src/Board.js');
const Physics = require('../src/Physics.js');
const ScoreManager = require('../src/ScoreManager.js');
const LeaderboardManager = require('../src/LeaderboardManager.js');

console.log('--- RUNNING FLAPPTRIS LOGIC & PHYSICS TESTS ---');

// Test 1: Tetrimino structure
console.log('Test 1: Verifying 7 Tetrimino shapes & rotations');
for (const key of TETRIMINO_KEYS) {
  const p = new Piece(key);
  assert.strictEqual(p.type, key, `Piece type should match ${key}`);
  for (let rot = 0; rot < 4; rot++) {
    const rel = p.getRelativeBlocks(rot);
    assert.strictEqual(rel.length, 4, `Piece ${key} at rot ${rot} must have exactly 4 minos, got ${rel.length}`);
  }
}
console.log('✓ All 7 tetriminos have exactly 4 blocks in all 4 rotations');

// Test 2: Board initialization and line clear
console.log('Test 2: Verifying Board line clears');
const board = new Board();
assert.strictEqual(board.rows, 20);
assert.strictEqual(board.lockCols, 10);
assert.strictEqual(board.flightCols, 22);

// Fill bottom row (row 19) completely in lock zone
for (let c = 0; c < 10; c++) {
  board.grid[19][c] = { color: '#00e5ff', border: '#80d8ff', glow: '' };
}
let res = board.checkAndClearLines();
assert.strictEqual(res.linesCleared, 1, 'Should clear exactly 1 line');
assert.deepStrictEqual(res.clearedRows, [19], 'Cleared row should be 19');
assert.strictEqual(board.grid[19][0], null, 'Bottom row should now be empty after shift');

// Fill bottom 4 rows (Tetris clear)
for (let r = 16; r < 20; r++) {
  for (let c = 0; c < 10; c++) {
    board.grid[r][c] = { color: '#ffd600', border: '#ffff8d', glow: '' };
  }
}
res = board.checkAndClearLines();
assert.strictEqual(res.linesCleared, 4, 'Should clear 4 lines (TETRIS)');
console.log('✓ Line clears and row shifting verified');

// Test 3: Physics - Falling, landing, and surface sliding
console.log('Test 3: Verifying Physics & surface sliding');
const physics = new Physics();
const testBoard = new Board();
const piece = new Piece('O', 100, 500); // 2x2 piece, height = 60px. Floor is 600px.
assert.strictEqual(piece.isSliding, false);

// Simulate physics falling down until landing
for (let i = 0; i < 40; i++) {
  physics.update(piece, testBoard, 0.02);
}

// Bounding box bottom should be at or near floor (600px)
const bbox = piece.getBoundingBox();
assert(bbox.bottom >= 598 && bbox.bottom <= 600.1, `Piece should land on floor, got bottom=${bbox.bottom}`);
assert.strictEqual(piece.isSliding, true, 'Piece must be sliding on floor');
assert.strictEqual(piece.vy, 0, 'Vertical velocity should be zero while resting on floor');

// Test horizontal sliding while on floor
const prevX = piece.x;
physics.update(piece, testBoard, 0.05); // Move forward
assert(piece.x > prevX, `Piece must slide forward horizontally on surface (prevX=${prevX}, newX=${piece.x})`);
assert.strictEqual(piece.isSliding, true, 'Piece must maintain sliding state on horizontal surface');
console.log('✓ Physics landing, zero vertical velocity on floor, and horizontal sliding verified');

// Test 4: ScoreManager calculations
console.log('Test 4: Verifying ScoreManager');
const sm = new ScoreManager();
assert.strictEqual(sm.score, 0);

// Survival 5 seconds
sm.update(5.0);
assert.strictEqual(sm.score, 50, '5 seconds of survival should give 50 points (10/sec)');

// Piece placed
sm.addPiecePlaced();
assert.strictEqual(sm.score, 100, 'Piece placed should add 50 points (50+50=100)');

// Line clears: 1, 2, 3, 4 lines
sm.addLineClears(1); // +100
assert.strictEqual(sm.score, 200);
sm.addLineClears(2); // +300
assert.strictEqual(sm.score, 500);
sm.addLineClears(3); // +500
assert.strictEqual(sm.score, 1000);
sm.addLineClears(4); // +800
assert.strictEqual(sm.score, 1800);
assert(sm.level >= 2, `Level should have increased, got ${sm.level}`);
assert(sm.getHorizontalSpeed() > INITIAL_SPEED_X, 'Speed should have increased with level');
console.log('✓ ScoreManager scoring and level scaling verified');

// Test 5: LeaderboardManager
console.log('Test 5: Verifying LeaderboardManager validation & sorting');
const lm = new LeaderboardManager();
const initialScores = lm.loadScores();
assert.strictEqual(initialScores.length, 10, 'Should load 10 default scores');

// Validation tests
assert.strictEqual(lm.validateName('').valid, false, 'Empty name must be invalid');
assert.strictEqual(lm.validateName('    ').valid, false, 'Whitespace-only name must be invalid');
assert.strictEqual(lm.validateName('A'.repeat(25)).valid, false, 'Name > 20 chars must be invalid');
assert.strictEqual(lm.validateName('PlayerOne').valid, true, 'Valid name must pass');

// Add high score
const saveRes = lm.addScore('CHAMPION_99', 9999);
assert.strictEqual(saveRes.success, true);
assert.strictEqual(saveRes.rank, 1, 'Score of 9999 must be rank #1');
const reloaded = lm.loadScores();
assert.strictEqual(reloaded.length, 10, 'Leaderboard must maintain top 10 limit');
assert.strictEqual(reloaded[0].name, 'CHAMPION_99');
assert.strictEqual(reloaded[0].score, 9999);
console.log('✓ LeaderboardManager validation, ranking, and persistence verified');

console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
