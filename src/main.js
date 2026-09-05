/**
 * Flapptris - Main Entrypoint & UI Bindings
 */

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('gameCanvas element not found!');
    return;
  }

  // Set crisp canvas dimensions matching virtual coordinates
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const game = new Game(canvas);

  // Sound toggle button setup
  const soundBtn = document.getElementById('btnToggleSound');
  const updateSoundBtnIcon = () => {
    if (soundBtn) {
      soundBtn.textContent = game.soundManager.muted ? '🔇' : '🔊';
      soundBtn.title = game.soundManager.muted ? 'Hang bekapcsolása' : 'Némítás';
    }
  };
  updateSoundBtnIcon();

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      game.soundManager.toggleMute();
      updateSoundBtnIcon();
    });
  }

  // Start game button
  const btnStart = document.getElementById('btnStartGame');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      game.startGame();
    });
  }

  // Pause overlay buttons
  const btnResume = document.getElementById('btnResumeGame');
  if (btnResume) {
    btnResume.addEventListener('click', () => {
      game.togglePause();
    });
  }

  const btnRestartPause = document.getElementById('btnRestartFromPause');
  if (btnRestartPause) {
    btnRestartPause.addEventListener('click', () => {
      game.restart();
    });
  }

  // Game over restart button
  const btnRestart = document.getElementById('btnRestartGame');
  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      game.restart();
    });
  }

  // Leaderboard modal buttons
  const btnShowLeaderboard = document.getElementById('btnShowLeaderboard');
  if (btnShowLeaderboard) {
    btnShowLeaderboard.addEventListener('click', () => {
      game.showLeaderboardModal();
    });
  }

  const btnGoLeaderboard = document.getElementById('btnGoLeaderboard');
  if (btnGoLeaderboard) {
    btnGoLeaderboard.addEventListener('click', () => {
      game.showLeaderboardModal();
    });
  }

  const btnCloseLeaderboard = document.getElementById('btnCloseLeaderboard');
  if (btnCloseLeaderboard) {
    btnCloseLeaderboard.addEventListener('click', () => {
      const modal = document.getElementById('leaderboardModal');
      if (modal) modal.classList.add('hidden');
    });
  }

  // Close modal on backdrop click
  const leaderboardModal = document.getElementById('leaderboardModal');
  if (leaderboardModal) {
    leaderboardModal.addEventListener('click', (e) => {
      if (e.target === leaderboardModal) {
        leaderboardModal.classList.add('hidden');
      }
    });
  }

  // Save score button
  const btnSaveScore = document.getElementById('btnSaveScore');
  const playerNameInput = document.getElementById('goPlayerName');
  const saveMessage = document.getElementById('goSaveMessage');

  const executeSaveScore = () => {
    if (!playerNameInput) return;
    const rawName = playerNameInput.value;
    const validation = game.leaderboardManager.validateName(rawName);

    if (!validation.valid) {
      if (saveMessage) {
        saveMessage.textContent = validation.error;
        saveMessage.className = 'save-message error';
      }
      playerNameInput.focus();
      return;
    }

    const result = game.leaderboardManager.addScore(validation.name, game.scoreManager.score);
    if (result.success) {
      if (saveMessage) {
        saveMessage.textContent = result.rank 
          ? `Pontszám elmentve! Helyezés: #${result.rank}` 
          : 'Pontszám sikeresen elmentve!';
        saveMessage.className = 'save-message success';
      }
      playerNameInput.disabled = true;
      if (btnSaveScore) btnSaveScore.disabled = true;
      game.updateHUD();
    } else {
      if (saveMessage) {
        saveMessage.textContent = result.error || 'Hiba történt a mentés során!';
        saveMessage.className = 'save-message error';
      }
    }
  };

  if (btnSaveScore) {
    btnSaveScore.addEventListener('click', executeSaveScore);
  }

  if (playerNameInput) {
    playerNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSaveScore();
      }
    });
  }

  // Initial draw to display start background
  game.renderer.render(game, 0.016);
});
