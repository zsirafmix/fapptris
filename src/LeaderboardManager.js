/**
 * Flapptris - LeaderboardManager Class
 * Handles Top 10 leaderboard with persistence, validation, and sanitization
 */

class LeaderboardManager {
  constructor() {
    this.storageKey = 'flapptris_leaderboard_v1';
    this.maxEntries = 10;
    this.defaultScores = [
      { name: 'NEOMASTER', score: 2450, date: '2026-08-15' },
      { name: 'FLAPPY_KING', score: 1890, date: '2026-08-20' },
      { name: 'TETROMANCER', score: 1520, date: '2026-08-28' },
      { name: 'CYBER_BIRD', score: 1200, date: '2026-09-01' },
      { name: 'RETRO_ALEX', score: 980, date: '2026-09-02' },
      { name: 'PIXEL_PILOT', score: 750, date: '2026-09-03' },
      { name: 'ARCADE_HERO', score: 620, date: '2026-09-03' },
      { name: 'MATRIX_RUN', score: 480, date: '2026-09-04' },
      { name: 'FLAPPER_Z', score: 350, date: '2026-09-04' },
      { name: 'ROOKIE_T', score: 210, date: '2026-09-05' }
    ];
  }

  loadScores() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return this.sanitizeAndSort(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read leaderboard from storage:', e);
    }
    return [...this.defaultScores];
  }

  sanitizeAndSort(list) {
    return list
      .filter(item => item && typeof item.score === 'number' && item.score >= 0)
      .map(item => ({
        name: this.sanitizeName(item.name || 'ANONYMOUS'),
        score: Math.floor(item.score),
        date: item.date || new Date().toISOString().split('T')[0]
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxEntries);
  }

  sanitizeName(rawName) {
    if (typeof rawName !== 'string') return '';
    return rawName
      .replace(/<[^>]*>?/gm, '')
      .replace(/[^\w\s\-\.\u00C0-\u017F]/gi, '')
      .trim()
      .substring(0, 20);
  }

  validateName(rawName) {
    if (typeof rawName !== 'string') {
      return { valid: false, error: 'A név megadása kötelező!' };
    }
    const clean = rawName
      .replace(/<[^>]*>?/gm, '')
      .replace(/[^\w\s\-\.\u00C0-\u017F]/gi, '')
      .trim();

    if (!clean || clean.length < 1) {
      return { valid: false, error: 'A játékos neve nem lehet üres vagy csak szóköz!' };
    }
    if (clean.length > 20) {
      return { valid: false, error: 'A játékos neve legfeljebb 20 karakter lehet!' };
    }
    return { valid: true, name: clean };
  }

  isTop10Score(score) {
    if (typeof score !== 'number' || score <= 0) return false;
    const scores = this.loadScores();
    if (scores.length < this.maxEntries) return true;
    return score > scores[scores.length - 1].score;
  }

  addScore(rawName, score) {
    const val = this.validateName(rawName);
    if (!val.valid) {
      return { success: false, error: val.error };
    }

    if (typeof score !== 'number' || score < 0) {
      return { success: false, error: 'Érvénytelen pontszám!' };
    }

    const scores = this.loadScores();
    const entry = {
      name: val.name,
      score: Math.floor(score),
      date: new Date().toISOString().split('T')[0]
    };

    scores.push(entry);
    const sorted = this.sanitizeAndSort(scores);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(sorted));
    } catch (e) {
      console.warn('Failed to persist leaderboard:', e);
    }

    const rank = sorted.findIndex(s => s === entry || (s.name === entry.name && s.score === entry.score)) + 1;

    return {
      success: true,
      rank: rank > 0 ? rank : null,
      scores: sorted
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LeaderboardManager;
}
