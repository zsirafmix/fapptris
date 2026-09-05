/**
 * Flapptris - Game Class
 * Main game orchestrator and state machine
 */

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.board = new Board();
    this.physics = new Physics();
    this.renderer = new Renderer(canvas);
    this.scoreManager = new ScoreManager();
    this.leaderboardManager = new LeaderboardManager();
    this.soundManager = new SoundManager();
    this.inputManager = new InputManager(this);

    this.state = GAME_STATE.START;
    this.currentPiece = null;
    this.nextPiece = null;
    this.bag = [];
    
    this.lastTime = 0;
    this.animationFrameId = null;

    this.setupNextPieceCanvas();
    this.loop = this.loop.bind(this);
  }

  setupNextPieceCanvas() {
    if (typeof document === 'undefined') return;
    this.nextCanvas = document.getElementById('nextPieceCanvas');
    if (this.nextCanvas && this.nextCanvas.getContext) {
      this.nextCtx = this.nextCanvas.getContext('2d');
    }
  }

  getBagPiece() {
    if (this.bag.length === 0) {
      // Re-populate 7-bag
      this.bag = [...TETRIMINO_KEYS];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop();
  }

  spawnPiece() {
    if (!this.nextPiece) {
      this.nextPiece = new Piece(this.getBagPiece());
    }

    this.currentPiece = this.nextPiece;
    this.nextPiece = new Piece(this.getBagPiece());

    // Starting coordinates at flight entrance
    this.currentPiece.x = 20;
    this.currentPiece.y = Math.floor(GRID_ROWS / 2) * BLOCK_SIZE - BLOCK_SIZE;
    this.currentPiece.vx = this.scoreManager.getHorizontalSpeed();
    this.currentPiece.vy = 0;
    this.currentPiece.isSliding = false;
    this.currentPiece.locked = false;

    // Check if initial spawn position is blocked
    if (!this.physics.isValidPosition(this.currentPiece, this.currentPiece.x, this.currentPiece.y, this.currentPiece.rotation, this.board)) {
      this.gameOver('spawn_blocked');
      return;
    }

    this.renderNextPiecePreview();
  }

  renderNextPiecePreview() {
    if (!this.nextCanvas || !this.nextCtx || !this.nextPiece) return;
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

    const matrix = this.nextPiece.getMatrix();
    const cellSize = 18;
    const pieceWidth = matrix[0].length * cellSize;
    const pieceHeight = matrix.length * cellSize;
    const offsetX = Math.floor((this.nextCanvas.width - pieceWidth) / 2);
    const offsetY = Math.floor((this.nextCanvas.height - pieceHeight) / 2);

    ctx.save();
    ctx.fillStyle = this.nextPiece.color;
    ctx.strokeStyle = this.nextPiece.border;
    ctx.lineWidth = 1;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const bx = offsetX + c * cellSize;
          const by = offsetY + r * cellSize;
          ctx.fillRect(bx + 1, by + 1, cellSize - 2, cellSize - 2);
          ctx.strokeRect(bx + 1, by + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
    ctx.restore();
  }

  startGame() {
    this.soundManager.init();
    this.board.reset();
    this.scoreManager.reset();
    this.board.generateObstacles(this.scoreManager.level);
    this.bag = [];
    this.nextPiece = null;
    this.currentPiece = null;
    
    this.spawnPiece();
    this.state = GAME_STATE.PLAYING;
    this.lastTime = performance.now();

    this.updateHUD();
    this.hideAllOverlays();

    if (!this.animationFrameId && typeof requestAnimationFrame !== 'undefined') {
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  }

  restart() {
    this.startGame();
  }

  togglePause() {
    if (this.state === GAME_STATE.PLAYING) {
      this.state = GAME_STATE.PAUSED;
      this.showPauseOverlay();
    } else if (this.state === GAME_STATE.PAUSED) {
      this.state = GAME_STATE.PLAYING;
      this.lastTime = performance.now();
      this.hideAllOverlays();
    }
  }

  handleFlap() {
    if (this.state === GAME_STATE.START) {
      this.startGame();
      return;
    }
    if (this.state !== GAME_STATE.PLAYING || !this.currentPiece) return;

    this.physics.flap(this.currentPiece);
    this.soundManager.playFlap();

    // Spawn flap particles
    const bbox = this.currentPiece.getBoundingBox();
    this.renderer.addSparks(bbox.left + bbox.width / 2, bbox.bottom, this.currentPiece.color, 6);
  }

  handleRotateLeft() {
    if (this.state !== GAME_STATE.PLAYING || !this.currentPiece) return;
    if (this.currentPiece.rotate(-1, this.board, this.physics)) {
      this.soundManager.playRotate();
    }
  }

  handleRotateRight() {
    if (this.state !== GAME_STATE.PLAYING || !this.currentPiece) return;
    if (this.currentPiece.rotate(1, this.board, this.physics)) {
      this.soundManager.playRotate();
    }
  }

  handleDrop() {
    if (this.state !== GAME_STATE.PLAYING || !this.currentPiece) return;
    this.physics.drop(this.currentPiece, this.board);
    this.soundManager.playSlide();
  }

  lockCurrentPiece() {
    if (!this.currentPiece) return;

    const locked = this.board.lockPiece(this.currentPiece);
    if (!locked) {
      this.gameOver('well_overflow');
      return;
    }

    this.soundManager.playLock();
    this.scoreManager.addPiecePlaced();

    // Floating text for placement
    const bbox = this.currentPiece.getBoundingBox();
    this.renderer.addFloatingText('+50', bbox.left + bbox.width / 2, bbox.top - 10, '#00e676');

    // Check for full line clears
    const { linesCleared, clearedRows } = this.board.checkAndClearLines();
    if (linesCleared > 0) {
      const bonus = this.scoreManager.addLineClears(linesCleared);
      
      if (linesCleared === 4) {
        this.soundManager.playTetris();
        this.renderer.addFloatingText('TETRIS! +800', LOCK_ZONE_START_X + 150, 250, '#ffeb3b');
      } else {
        this.soundManager.playLineClear(linesCleared);
        const labels = { 1: 'SINGLE! +100', 2: 'DOUBLE! +300', 3: 'TRIPLE! +500' };
        this.renderer.addFloatingText(labels[linesCleared] || `+${bonus}`, LOCK_ZONE_START_X + 150, 280, '#00e5ff');
      }

      // Spawn spark particles across the cleared rows
      for (const row of clearedRows) {
        const ry = row * BLOCK_SIZE + BLOCK_SIZE / 2;
        for (let c = 0; c < LOCK_COLS; c++) {
          const rx = LOCK_ZONE_START_X + c * BLOCK_SIZE + BLOCK_SIZE / 2;
          this.renderer.addSparks(rx, ry, '#ffffff', 4);
        }
      }

      // Update obstacles if level changed
      this.board.generateObstacles(this.scoreManager.level);
    }

    // Check if lock entrance or top is clogged
    if (this.board.isTopBlocked()) {
      this.gameOver('well_overflow');
      return;
    }

    // Spawn next tetrimino
    this.spawnPiece();
  }

  gameOver(reason) {
    this.state = GAME_STATE.GAME_OVER;
    this.soundManager.playGameOver();

    // Burst particles at current piece
    if (this.currentPiece) {
      const bbox = this.currentPiece.getBoundingBox();
      this.renderer.addSparks(bbox.left + bbox.width / 2, bbox.top + bbox.height / 2, '#ff1744', 35);
    }

    this.showGameOverOverlay();
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const rawDt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    const dt = Math.min(rawDt, MAX_DELTA_TIME);

    if (this.state === GAME_STATE.PLAYING) {
      // 1. Update score for survival time
      this.scoreManager.update(dt);

      // 2. Physics step
      if (this.currentPiece) {
        // Adjust speed if level increased
        this.currentPiece.vx = this.scoreManager.getHorizontalSpeed();

        const physResult = this.physics.update(this.currentPiece, this.board, dt);

        if (physResult.status === 'LOCKED') {
          this.lockCurrentPiece();
        } else if (physResult.status === 'GAME_OVER') {
          this.gameOver(physResult.reason);
        }
      }

      this.updateHUD();
    }

    // Render frame
    this.renderer.render(this, dt);

    if (typeof requestAnimationFrame !== 'undefined') {
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  }

  updateHUD() {
    if (typeof document === 'undefined') return;
    const scoreEl = document.getElementById('hudScore');
    const highScoreEl = document.getElementById('hudHighScore');
    const levelEl = document.getElementById('hudLevel');
    const linesEl = document.getElementById('hudLines');

    if (scoreEl) scoreEl.textContent = this.scoreManager.score;
    if (highScoreEl) highScoreEl.textContent = this.scoreManager.highScore;
    if (levelEl) levelEl.textContent = this.scoreManager.level;
    if (linesEl) linesEl.textContent = this.scoreManager.linesClearedTotal;
  }

  hideAllOverlays() {
    if (typeof document === 'undefined') return;
    const overlays = ['startScreen', 'pauseScreen', 'gameOverScreen', 'leaderboardModal'];
    overlays.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.classList) el.classList.add('hidden');
    });
  }

  showStartScreen() {
    this.hideAllOverlays();
    if (typeof document === 'undefined') return;
    const el = document.getElementById('startScreen');
    if (el && el.classList) el.classList.remove('hidden');
  }

  showPauseOverlay() {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('pauseScreen');
    if (el && el.classList) el.classList.remove('hidden');
  }

  showGameOverOverlay() {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('gameOverScreen');
    if (!el) return;

    if (el.classList) el.classList.remove('hidden');

    const finalScoreEl = document.getElementById('goFinalScore');
    const newRecordBadge = document.getElementById('goNewRecord');
    const nameInput = document.getElementById('goPlayerName');
    const saveBtn = document.getElementById('btnSaveScore');
    const saveMsg = document.getElementById('goSaveMessage');

    if (finalScoreEl) finalScoreEl.textContent = this.scoreManager.score;
    if (newRecordBadge) {
      newRecordBadge.style.display = this.scoreManager.isNewRecord ? 'inline-block' : 'none';
    }
    if (saveMsg) saveMsg.textContent = '';
    if (nameInput) {
      nameInput.value = '';
      nameInput.disabled = false;
      if (typeof nameInput.focus === 'function') {
        nameInput.focus();
      }
    }
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.style.display = 'inline-block';
    }
  }

  showLeaderboardModal() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('leaderboardModal');
    if (!modal) return;

    if (modal.classList) modal.classList.remove('hidden');
    this.renderLeaderboardTable();
  }

  renderLeaderboardTable() {
    if (typeof document === 'undefined') return;
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;

    const scores = this.leaderboardManager.loadScores();
    tbody.innerHTML = '';

    scores.forEach((item, index) => {
      const tr = document.createElement('tr');
      const rank = index + 1;
      let rankClass = '';
      if (rank === 1) rankClass = 'rank-gold';
      else if (rank === 2) rankClass = 'rank-silver';
      else if (rank === 3) rankClass = 'rank-bronze';

      tr.innerHTML = `
        <td class="${rankClass}">#${rank}</td>
        <td><strong>${item.name}</strong></td>
        <td class="score-cell">${item.score}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Game;
}
