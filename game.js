// Cookie Clicker Game Module
const ClickerGame = (() => {
  const COOKIE_SCORE_NAME = 'cymouz_clicker_score';
  const COOKIE_ACTIVE_NAME = 'cymouz_clicker_active';

  let clickerScore = 0;
  let clickerActive = false;
  let gameMode = false;

  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  };

  const setCookie = (name, value, days) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  };

  const loadCookieScore = () => {
    const value = Number(getCookie(COOKIE_SCORE_NAME));
    return Number.isFinite(value) ? value : 0;
  };

  const saveCookieScore = (score) => setCookie(COOKIE_SCORE_NAME, score, 365);
  const saveActiveState = (active) => setCookie(COOKIE_ACTIVE_NAME, active ? '1' : '0', 365);
  const loadActiveState = () => getCookie(COOKIE_ACTIVE_NAME) === '1';

  const updateCounterDisplay = () => {
    const counterValue = document.getElementById('cookie-counter-value');
    const counterLabel = document.getElementById('cookie-counter-label');
    if (counterValue) {
      counterValue.textContent = clickerScore;
    }
    if (counterLabel) {
      counterLabel.textContent = clickerActive ? 'Clicks' : 'Clicker locked';
    }
  };

  const showClickFeedback = (x, y) => {
    const feedback = document.createElement('div');
    feedback.className = 'click-feedback';
    feedback.textContent = '+1';
    feedback.style.left = `${x}px`;
    feedback.style.top = `${y}px`;
    document.body.appendChild(feedback);

    setTimeout(() => feedback.remove(), 1000);
  };

  const activateGameMode = () => {
    if (gameMode) return;
    gameMode = true;
    clickerActive = true;
    saveActiveState(true);

    const body = document.body;
    const title = document.getElementById('title');
    const counter = document.getElementById('cookie-counter');
    const dimOverlay = document.createElement('div');
    dimOverlay.className = 'game-mode-overlay';
    dimOverlay.id = 'game-mode-overlay';
    body.appendChild(dimOverlay);

    // Hide all text except title
    document.querySelectorAll('.bio, .interests, .links-title, .socials, .links-section').forEach(el => {
      el.classList.add('fade-out');
    });

    // Animate counter into view
    counter.classList.add('counter-active');

    // Center the title
    title.classList.add('title-center');

    // Dim the background
    setTimeout(() => {
      dimOverlay.classList.add('active');
    }, 50);

    // Add exit button
    const exitBtn = document.createElement('button');
    exitBtn.className = 'exit-clicker-btn';
    exitBtn.textContent = 'Exit Clicker';
    exitBtn.addEventListener('click', deactivateGameMode);
    counter.appendChild(exitBtn);
  };

  const deactivateGameMode = () => {
    if (!gameMode) return;
    gameMode = false;
    clickerActive = false;
    saveActiveState(false);

    const body = document.body;
    const title = document.getElementById('title');
    const counter = document.getElementById('cookie-counter');
    const dimOverlay = document.getElementById('game-mode-overlay');

    // Revert animations
    counter.classList.remove('counter-active');
    title.classList.remove('title-center');
    dimOverlay.classList.remove('active');
    updateCounterDisplay();

    document.querySelectorAll('.bio, .interests, .links-title, .socials, .links-section').forEach(el => {
      el.classList.remove('fade-out');
    });

    // Remove exit button
    const exitBtn = counter.querySelector('.exit-clicker-btn');
    if (exitBtn) exitBtn.remove();

    // Remove overlay after animation
    setTimeout(() => {
      if (dimOverlay && dimOverlay.parentNode) {
        dimOverlay.remove();
      }
    }, 400);
  };

  const increaseScore = (amount = 1) => {
    clickerScore += amount;
    saveCookieScore(clickerScore);
    updateCounterDisplay();
  };

  const init = () => {
    clickerScore = loadCookieScore();
    clickerActive = loadActiveState() || clickerScore > 0;

    if (clickerActive) {
      // If game was already active, restore game mode
      gameMode = false; // Set to false so activateGameMode can trigger
      activateGameMode();
    }

    updateCounterDisplay();
  };

  return {
    init,
    activateGameMode,
    deactivateGameMode,
    increaseScore,
    isActive: () => clickerActive,
    isGameMode: () => gameMode,
    getScore: () => clickerScore,
    showClickFeedback
  };
})();

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ClickerGame.init());
} else {
  ClickerGame.init();
}
