/**
 * Flapptris - InputManager Class
 * Handles keyboard, mouse, and touch events with mobile virtual controls
 */

class InputManager {
  constructor(game) {
    this.game = game;
    this.keysPressed = {};
    this.setupListeners();
  }

  setupListeners() {
    // Keyboard listeners
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('keydown', (e) => {
        // Avoid intercepting input if typing into a text field (e.g. name entry on Game Over)
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
          return;
        }

        const key = e.key.toLowerCase();
        const code = e.code;

        if (code === 'Space' || key === ' ') {
          e.preventDefault();
          this.game.handleFlap();
        } else if (key === 'q' || code === 'ArrowLeft') {
          e.preventDefault();
          this.game.handleRotateLeft();
        } else if (key === 'e' || code === 'ArrowRight') {
          e.preventDefault();
          this.game.handleRotateRight();
        } else if (key === 's' || code === 'ArrowDown') {
          e.preventDefault();
          this.game.handleDrop();
        } else if (key === 'p' || code === 'Escape') {
          e.preventDefault();
          this.game.togglePause();
        }
      });
    }

    if (typeof document === 'undefined') return;

    // Canvas click / touch for flap
    const canvas = document.getElementById('gameCanvas');
    if (canvas && canvas.addEventListener) {
      canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
          e.preventDefault();
          this.game.handleFlap();
        }
      });

      canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.handleFlap();
      }, { passive: false });
    }

    // Touch & button listeners for on-screen controls
    this.bindButton('btnFlap', () => this.game.handleFlap());
    this.bindButton('btnRotateLeft', () => this.game.handleRotateLeft());
    this.bindButton('btnRotateRight', () => this.game.handleRotateRight());
    this.bindButton('btnDrop', () => this.game.handleDrop());
    this.bindButton('btnPause', () => this.game.togglePause());
  }

  bindButton(id, callback) {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(id);
    if (!el || !el.addEventListener) return;

    const trigger = (e) => {
      e.preventDefault();
      e.stopPropagation();
      callback();
    };

    el.addEventListener('click', trigger);
    el.addEventListener('touchstart', trigger, { passive: false });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputManager;
}
