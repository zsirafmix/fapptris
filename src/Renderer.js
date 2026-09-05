/**
 * Flapptris - Renderer Class
 * Handles HTML5 Canvas rendering, arcade neon aesthetics, particle effects, and visual feedback
 */

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.floatingTexts = [];
    
    // Background starfield / grid offset for flight parallax
    this.bgOffset = 0;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  addParticle(x, y, vx, vy, color, size, life) {
    this.particles.push({
      x, y, vx, vy,
      color,
      size,
      life,
      maxLife: life
    });
  }

  addSparks(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.addParticle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        2 + Math.random() * 3,
        0.3 + Math.random() * 0.4
      );
    }
  }

  addFloatingText(text, x, y, color = '#ffffff') {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      alpha: 1.0,
      life: 1.2
    });
  }

  updateEffects(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y -= 25 * dt; // Float up
      ft.alpha = Math.max(0, ft.life / 1.2);
    }
  }

  render(game, dt = 0.016) {
    this.clear();
    this.updateEffects(dt);

    const { board, currentPiece, scoreManager } = game;
    const speedX = currentPiece ? currentPiece.vx : INITIAL_SPEED_X;
    this.bgOffset = (this.bgOffset + speedX * dt * 0.4) % 60;

    // 1. Draw Backgrounds (Flight Zone vs Lock Zone)
    this.renderBackground();

    // 2. Draw Flight Zone Obstacles
    this.renderFlightObstacles(board);

    // 3. Draw Lock Zone Grid & Placed Blocks
    this.renderLockZone(board);

    // 4. Draw Ghost Piece (preview of grid placement)
    if (currentPiece && game.state === GAME_STATE.PLAYING) {
      this.renderGhostPiece(currentPiece, board);
    }

    // 5. Draw Active Moving Piece
    if (currentPiece && (game.state === GAME_STATE.PLAYING || game.state === GAME_STATE.PAUSED)) {
      this.renderPiece(currentPiece, dt);
    }

    // 6. Draw Particles & Visual Effects
    this.renderParticles();

    // 7. Draw Floating Texts
    this.renderFloatingTexts();
  }

  renderBackground() {
    const ctx = this.ctx;

    // Flight Zone Background
    const flightGrad = ctx.createLinearGradient(0, 0, LOCK_ZONE_START_X, CANVAS_HEIGHT);
    flightGrad.addColorStop(0, '#0a0b16');
    flightGrad.addColorStop(1, '#111428');
    ctx.fillStyle = flightGrad;
    ctx.fillRect(0, 0, LOCK_ZONE_START_X, CANVAS_HEIGHT);

    // Moving subtle background grid in flight zone
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = -this.bgOffset; x < LOCK_ZONE_START_X; x += 30) {
      if (x >= 0) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(LOCK_ZONE_START_X, y);
      ctx.stroke();
    }

    // Lock Zone Background (distinct dark slate / cyber well)
    const lockGrad = ctx.createLinearGradient(LOCK_ZONE_START_X, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    lockGrad.addColorStop(0, '#0d1024');
    lockGrad.addColorStop(1, '#15193a');
    ctx.fillStyle = lockGrad;
    ctx.fillRect(LOCK_ZONE_START_X, 0, LOCK_COLS * BLOCK_SIZE, CANVAS_HEIGHT);

    // Lock Zone Divider Neon Border
    ctx.save();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(LOCK_ZONE_START_X, 0);
    ctx.lineTo(LOCK_ZONE_START_X, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.restore();

    // Subtle Lock Zone Grid Guidelines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let c = 1; c < LOCK_COLS; c++) {
      const gx = LOCK_ZONE_START_X + c * BLOCK_SIZE;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let r = 1; r < GRID_ROWS; r++) {
      const gy = r * BLOCK_SIZE;
      ctx.beginPath();
      ctx.moveTo(LOCK_ZONE_START_X, gy);
      ctx.lineTo(CANVAS_WIDTH, gy);
      ctx.stroke();
    }

    // Header label in Lock Zone
    ctx.save();
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = 'rgba(0, 229, 255, 0.45)';
    ctx.textAlign = 'center';
    ctx.fillText('▼ TETRIS LOCK ZONE ▼', LOCK_ZONE_START_X + (LOCK_COLS * BLOCK_SIZE) / 2, 16);
    ctx.restore();
  }

  renderFlightObstacles(board) {
    const ctx = this.ctx;

    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.flightCols; c++) {
        const obs = board.obstacles[r][c];
        if (obs) {
          const x = c * BLOCK_SIZE;
          const y = r * BLOCK_SIZE;
          this.drawBlock(x, y, obs.color, obs.border, obs.glow, false);
        }
      }
    }
  }

  renderLockZone(board) {
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.lockCols; c++) {
        const cell = board.grid[r][c];
        if (cell) {
          const x = LOCK_ZONE_START_X + c * BLOCK_SIZE;
          const y = r * BLOCK_SIZE;
          this.drawBlock(x, y, cell.color, cell.border, cell.glow);
        }
      }
    }
  }

  drawBlock(x, y, color, border, glow, withBevel = true) {
    const ctx = this.ctx;
    const size = BLOCK_SIZE;

    ctx.save();
    
    // Base block color
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

    if (withBevel) {
      // 3D Bevel highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(x + 2, y + 2, size - 4, 3); // Top highlight
      ctx.fillRect(x + 2, y + 2, 3, size - 4); // Left highlight

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(x + 2, y + size - 5, size - 4, 3); // Bottom shadow
      ctx.fillRect(x + size - 5, y + 2, 3, size - 4); // Right shadow
    }

    // Glowing border
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);

    ctx.restore();
  }

  renderGhostPiece(piece, board) {
    const ctx = this.ctx;
    // Calculate nearest integer grid position in lock zone
    const targetCol = Math.round(piece.x / BLOCK_SIZE);
    const targetRow = Math.round(piece.y / BLOCK_SIZE);
    const relBlocks = piece.getRelativeBlocks();

    // Check if near or inside lock zone
    const bbox = piece.getBoundingBox();
    if (bbox.right < LOCK_ZONE_START_X - BLOCK_SIZE * 2) {
      return; // Too far from lock zone to show ghost
    }

    ctx.save();
    ctx.strokeStyle = piece.color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);

    for (const b of relBlocks) {
      const c = targetCol + b.rx;
      const r = targetRow + b.ry;
      if (c >= board.flightCols && c < board.totalCols && r >= 0 && r < board.rows) {
        const gx = c * BLOCK_SIZE;
        const gy = r * BLOCK_SIZE;
        ctx.strokeRect(gx + 2, gy + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
      }
    }

    ctx.restore();
  }

  renderPiece(piece, dt) {
    const ctx = this.ctx;
    const blocks = piece.getBlocks();

    // Thruster engine particles when flapping or flying
    if (Math.random() < 0.8) {
      const bbox = piece.getBoundingBox();
      this.addParticle(
        bbox.left + Math.random() * 4,
        bbox.top + Math.random() * bbox.height,
        -100 - Math.random() * 80,
        (Math.random() - 0.5) * 40,
        piece.color,
        2 + Math.random() * 2.5,
        0.25
      );
    }

    // Spark particles when sliding on a surface
    if (piece.isSliding) {
      const bbox = piece.getBoundingBox();
      this.addParticle(
        bbox.left + Math.random() * bbox.width,
        bbox.bottom,
        -40 - Math.random() * 50,
        -15 - Math.random() * 20,
        '#ffff8d',
        1.5 + Math.random() * 2,
        0.18
      );
    }

    // Draw active minos with vibrant arcade glow
    ctx.save();
    ctx.shadowColor = piece.glow;
    ctx.shadowBlur = 10;

    for (const b of blocks) {
      this.drawBlock(b.x, b.y, piece.color, piece.border, piece.glow, true);
    }
    ctx.restore();
  }

  renderParticles() {
    const ctx = this.ctx;
    ctx.save();
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderFloatingTexts() {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'center';

    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Renderer;
}
