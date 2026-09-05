/**
 * Flapptris - ScoreManager Class
 * Handles score tracking, survival time, line bonuses, level progression, and high score
 */

class ScoreManager {
  constructor() {
    this.highScoreKey = 'flapptris_highscore';
    this.highScore = this.loadHighScore();
    this.reset();
  }

  loadHighScore() {
    try {
      const saved = localStorage.getItem(this.highScoreKey);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore(score) {
    if (score > this.highScore) {
      this.highScore = score;
      try {
        localStorage.setItem(this.highScoreKey, this.highScore.toString());
      } catch (e) {
        console.warn('Could not save high score to localStorage:', e);
      }
    }
  }

  reset() {
    this.score = 0;
    this.survivalSeconds = 0;
    this.partialSecond = 0;
    this.level = 1;
    this.linesClearedTotal = 0;
    this.piecesPlaced = 0;
    this.isNewRecord = false;
  }

  update(dt) {
    this.partialSecond += dt;
    if (this.partialSecond >= 1.0) {
      const fullSeconds = Math.floor(this.partialSecond);
      this.survivalSeconds += fullSeconds;
      this.partialSecond -= fullSeconds;
      this.score += fullSeconds * SCORE_PER_SECOND;
      this.checkLevel();
      this.checkHighScore();
    }
  }

  addPiecePlaced() {
    this.piecesPlaced++;
    this.score += SCORE_PIECE_PLACED;
    this.checkLevel();
    this.checkHighScore();
  }

  addLineClears(lineCount) {
    if (lineCount <= 0) return 0;
    this.linesClearedTotal += lineCount;
    const bonus = SCORE_LINE_CLEARS[lineCount] || (lineCount * 200);
    this.score += bonus;
    this.checkLevel();
    this.checkHighScore();
    return bonus;
  }

  checkLevel() {
    // Level increases every 300 points or every 3 lines
    const calculatedLevel = 1 + Math.floor(this.score / 350) + Math.floor(this.linesClearedTotal / 3);
    this.level = Math.min(10, Math.max(1, calculatedLevel));
  }

  getHorizontalSpeed() {
    const speed = INITIAL_SPEED_X + (this.level - 1) * SPEED_X_INCREMENT;
    return Math.min(speed, MAX_SPEED_X);
  }

  checkHighScore() {
    if (this.score > this.highScore) {
      this.isNewRecord = true;
      this.highScore = this.score;
      this.saveHighScore(this.score);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScoreManager;
}
