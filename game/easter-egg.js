(() => {
  const title = document.getElementById('title');
  const clicksRequired = 5;
  let clicks = 0;
  let resetTimer = null;
  let loading = null;

  const animationStyle = document.createElement('style');
  animationStyle.textContent = `
    .title-spin { animation: titleSpin 0.8s ease forwards; }
    @keyframes titleSpin {
      0% { transform: rotateY(0deg) scale(1); }
      50% { transform: rotateY(180deg) scale(1.05); }
      100% { transform: rotateY(360deg) scale(1); }
    }
  `;
  document.head.appendChild(animationStyle);

  const load = async () => {
    if (loading) {
      await loading;
      if (!window.ClickerGame.isGameMode()) {
        window.ClickerGame.activateGameMode();
        window.ClickerGame.increaseScore(5);
      }
      return;
    }

    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'game/game.js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    }).then(() => {
      window.ClickerGame.mountUI();
      return new Promise((resolve, reject) => {
        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = 'game/game.css';
        stylesheet.onload = resolve;
        stylesheet.onerror = reject;
        document.head.appendChild(stylesheet);
      });
    }).then(() => {
      window.ClickerGame.init();
      window.ClickerGame.activateGameMode();
      window.ClickerGame.increaseScore(5);
      window.ClickerGame.spawnParticles(20, window.innerWidth / 2, window.innerHeight / 2);
    }).catch((error) => {
      loading = null;
      console.error('Unable to load hidden feature:', error);
    });

    await loading;
  };

  title.addEventListener('click', (event) => {
    clicks += 1;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { clicks = 0; }, 1200);

    if (window.ClickerGame?.isActive()) {
      window.ClickerGame.increaseScore(1);
      window.ClickerGame.showClickFeedback(event.clientX, event.clientY);
      window.ClickerGame.spawnParticles(6, event.clientX, event.clientY);
      return;
    }

    if (clicks >= clicksRequired) {
      clicks = 0;
      title.classList.add('title-spin');
      setTimeout(() => {
        title.classList.remove('title-spin');
        load();
      }, 800);
    }
  });
})();
