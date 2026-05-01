// Cookie Clicker Game Module
const ClickerGame = (() => {
  let clickerScore = 0;
  let clickerActive = false;
  let gameMode = false;
  let renderShopItems = null;

  // --- Cheat Variables ---
  let isCheatActive = false;
  let cheatInterval = null;
  let preCheatUpgrades = {};
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a', 'Enter'];
  let konamiIndex = 0;

  // Listen for cheat code
  document.addEventListener('keydown', (e) => {
    if (!clickerActive || isCheatActive) {
      konamiIndex = 0;
      return;
    }
    
    const key = e.key;
    const expected = konamiCode[konamiIndex];
    // Ignore case to allow uppercase or lowercase 'A' and 'B'
    if (key.toLowerCase() === expected.toLowerCase()) {
      konamiIndex++;
      if (konamiIndex === konamiCode.length) {
        activateCheat();
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });

  // =======================================================================
  // 🛒 UPGRADES DICTIONARY
  // =======================================================================
  let upgrades = {
    // --- Click Power Upgrades ---
    multiplier: { name: "🖱️ Multiplier", desc: "+1 Point per click", count: 0, baseCost: 15, costScale: 1.5, type: "click", effectValue: 1 },
    heavyMouse: { name: "🔨 Heavy Mouse", desc: "+5 Points per click", count: 0, baseCost: 150, costScale: 1.6, type: "click", effectValue: 5 },
    motorizedMouse: { name: "⚡ Motorized Mouse", desc: "+10 Points per click", count: 0, baseCost: 1500, costScale: 1.7, type: "click", effectValue: 10 },

    // --- Auto-Clicker Upgrades ---
    autoClicker: { name: "⚙️ Auto-Clicker", desc: "+1 Point per second", count: 0, baseCost: 50, costScale: 1.6, type: "auto", effectValue: 1 },
    robotFriend: { name: "🤖 Robot Friend", desc: "+10 Points per second", count: 0, baseCost: 500, costScale: 1.7, type: "auto", effectValue: 10 },
    botnet: { name: "🤖🛜🤖 Botnet", desc: "+50 Points per second", count: 0, baseCost: 5000, costScale: 1.8, type: "auto", effectValue: 50 },
    factory: { name: "🏭 Factory", desc: "+200 Points per second", count: 0, baseCost: 20000, costScale: 1.9, type: "auto", effectValue: 200 },

    // --- Global Buff Upgrades ---
    efficiency: { name: "📉 Efficiency", desc: "Costs reduced by 5%", count: 0, baseCost: 200, costScale: 2.0, type: "discount", effectValue: 0.05 },
    solarPanels: { name: "☀️ Solar Panels", desc: "Costs reduced by 10%", count: 0, baseCost: 1000, costScale: 2.5, type: "discount", effectValue: 0.10 }
  };


  // --- Save / Load Logic ---
  const saveData = () => {
    let upgradesToSave = upgrades;

    // SAFEGUARD: If cheat is active, fake the save data by injecting the real (pre-cheat) levels.
    // This allows score to save correctly without saving the cheated upgrade levels.
    if (isCheatActive) {
      upgradesToSave = JSON.parse(JSON.stringify(upgrades)); // clone
      for (let key in preCheatUpgrades) {
        upgradesToSave[key].count = preCheatUpgrades[key];
      }
    }

    const data = { score: clickerScore, upgrades: upgradesToSave };
    localStorage.setItem('cymouz_game_data', JSON.stringify(data));
  };

  const loadData = () => {
    const dataStr = localStorage.getItem('cymouz_game_data');
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        if (typeof data.score === 'number') clickerScore = data.score;
        if (data.upgrades) {
          for (let key in upgrades) {
            if (data.upgrades[key]) {
              upgrades[key].count = data.upgrades[key].count || 0;
            }
          }
        }
      } catch(e) { console.error("Error parsing save data", e); }
    } else {
      const match = document.cookie.match(/(?:^|; )cymouz_clicker_score=([^;]*)/);
      if (match) {
        const oldScore = Number(decodeURIComponent(match[1]));
        if (Number.isFinite(oldScore)) clickerScore = oldScore;
      }
    }
  };

  // --- Dynamic Math & Formulas ---
  const getDiscountMult = () => {
    let mult = 1;
    for (let key in upgrades) {
      if (upgrades[key].type === "discount") {
        mult *= Math.pow(1 - upgrades[key].effectValue, upgrades[key].count);
      }
    }
    return mult;
  };

  const getUpgradeCost = (key) => {
    const u = upgrades[key];
    return Math.floor(u.baseCost * Math.pow(u.costScale, u.count) * getDiscountMult());
  };

  const getClickValue = () => {
    let clickPower = 1;
    for (let key in upgrades) {
      if (upgrades[key].type === "click") {
        clickPower += (upgrades[key].count * upgrades[key].effectValue);
      }
    }
    return clickPower;
  };

  const getAutoClickValue = () => {
    let autoPower = 0;
    for (let key in upgrades) {
      if (upgrades[key].type === "auto") {
        autoPower += (upgrades[key].count * upgrades[key].effectValue);
      }
    }
    return autoPower;
  };

  // --- Display Updates ---
  const updateCounterDisplay = () => {
    const counterValue = document.getElementById('cookie-counter-value');
    const counterLabel = document.getElementById('cookie-counter-label');
    if (counterValue) {
      counterValue.textContent = Math.floor(clickerScore);
    }
    if (counterLabel) {
      counterLabel.textContent = clickerActive ? 'Points' : 'Clicker locked';
    }
    if (renderShopItems && gameMode) {
      renderShopItems(); 
    }
  };

  const showClickFeedback = (x, y) => {
    const feedback = document.createElement('div');
    feedback.className = 'click-feedback';
    feedback.textContent = `+${getClickValue()}`;
    feedback.style.left = `${x}px`;
    feedback.style.top = `${y}px`;
    document.body.appendChild(feedback);

    setTimeout(() => feedback.remove(), 1000);
  };

  // --- Shop Mechanics ---
  const buyUpgrade = (key) => {
    const cost = getUpgradeCost(key);
    if (clickerScore >= cost) {
      clickerScore -= cost;
      upgrades[key].count++;
      saveData();
      updateCounterDisplay();
    }
  };

  const setupShopUI = () => {
    let shopPanel = document.getElementById('shop-panel');
    if (!shopPanel) {
      shopPanel = document.createElement('div');
      shopPanel.className = 'shop-panel';
      shopPanel.id = 'shop-panel';
      
      const shopHeader = document.createElement('div');
      shopHeader.className = 'shop-header';
      shopHeader.innerHTML = '🛒 Upgrades <span style="float: right;">▼</span>';
      
      const shopList = document.createElement('div');
      shopList.className = 'shop-list';
      
      renderShopItems = () => {
        shopList.innerHTML = '';
        
        for (let key in upgrades) {
          const cost = getUpgradeCost(key);
          const btn = document.createElement('button');
          btn.className = 'upgrade-btn';
          btn.innerHTML = `<strong>${upgrades[key].name}</strong> (Lvl ${upgrades[key].count})<br>
                           <span style="font-size: 0.75rem; opacity: 0.8;">${upgrades[key].desc}</span><br>
                           <span style="color: #ff4d6d;">Cost: ${cost}</span>`;
          btn.disabled = clickerScore < cost;
          btn.onclick = () => buyUpgrade(key);
          shopList.appendChild(btn);
        }
        
        const ioDiv = document.createElement('div');
        ioDiv.className = 'save-load-controls';
        
        const dlBtn = document.createElement('button');
        dlBtn.textContent = '💾 Export';
        dlBtn.onclick = () => {
          const blob = new Blob([JSON.stringify({ score: clickerScore, upgrades })], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'cymouz_save.json';
          a.click();
          URL.revokeObjectURL(url);
        };
        
        const ulBtn = document.createElement('button');
        ulBtn.textContent = '📂 Import';
        ulBtn.onclick = () => document.getElementById('save-upload').click();

        const ulInput = document.createElement('input');
        ulInput.type = 'file';
        ulInput.id = 'save-upload';
        ulInput.accept = '.json';
        ulInput.style.display = 'none';
        ulInput.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result);
              if (typeof data.score === 'number') clickerScore = data.score;
              if (data.upgrades) {
                for (let key in upgrades) {
                  if (data.upgrades[key]) upgrades[key].count = data.upgrades[key].count || 0;
                }
              }
              saveData();
              updateCounterDisplay();
            } catch (err) {
              alert("Invalid save file.");
            }
          };
          reader.readAsText(file);
          e.target.value = ''; // reset
        };

        ioDiv.appendChild(dlBtn);
        ioDiv.appendChild(ulBtn);
        ioDiv.appendChild(ulInput);
        shopList.appendChild(ioDiv);
      };

      shopHeader.onclick = () => {
        shopList.classList.toggle('open');
        shopHeader.querySelector('span').textContent = shopList.classList.contains('open') ? '▲' : '▼';
      };

      shopPanel.appendChild(shopHeader);
      shopPanel.appendChild(shopList);
      document.body.appendChild(shopPanel);
    }
    
    renderShopItems();
  };

  // --- Dynamic Auto-Clicker Loop ---
  setInterval(() => {
    const autoPower = getAutoClickValue();
    if (autoPower > 0) {
      clickerScore += autoPower;
      saveData();
      updateCounterDisplay();
    }
  }, 1000);

  // --- Cheat Engine Logic ---
  const activateCheat = () => {
    isCheatActive = true;
    preCheatUpgrades = {};
    
    // Remember true stats
    for (let key in upgrades) {
      preCheatUpgrades[key] = upgrades[key].count;
    }

    // Visual Text Animation
    const fx = document.createElement('div');
    fx.className = 'cheat-activated-text';
    fx.textContent = 'CHEAT ACTIVATED';
    document.body.appendChild(fx);
    setTimeout(() => fx.remove(), 2000); // Remove after animation

    // Disengage Button
    const btn = document.createElement('button');
    btn.className = 'disengage-cheat-btn';
    btn.id = 'disengage-cheat-btn';
    btn.textContent = 'Disengage Cheat';
    btn.onclick = deactivateCheat;
    document.body.appendChild(btn);

    // Increase all upgrades by 1 every second
    cheatInterval = setInterval(() => {
      for (let key in upgrades) {
        upgrades[key].count += 1;
      }
      updateCounterDisplay();
    }, 1000);
  };

  const deactivateCheat = () => {
    if (!isCheatActive) return;
    clearInterval(cheatInterval);
    isCheatActive = false;

    // Revert upgrades to pre-cheat status
    for (let key in preCheatUpgrades) {
      upgrades[key].count = preCheatUpgrades[key];
    }

    // Remove UI
    const btn = document.getElementById('disengage-cheat-btn');
    if (btn) btn.remove();

    updateCounterDisplay();
    saveData(); // Make sure real numbers are hard-saved
  };

  // --- Game Mode Overlay Handlers ---
  const activateGameMode = () => {
    if (gameMode) return;
    gameMode = true;
    clickerActive = true;

    setupShopUI();

    const body = document.body;
    const title = document.getElementById('title');
    const counter = document.getElementById('cookie-counter');
    const shopPanel = document.getElementById('shop-panel');
    
    let dimOverlay = document.getElementById('game-mode-overlay');
    if (!dimOverlay) {
      dimOverlay = document.createElement('div');
      dimOverlay.className = 'game-mode-overlay';
      dimOverlay.id = 'game-mode-overlay';
      body.appendChild(dimOverlay);
    }

    document.querySelectorAll('.bio, .interests, .links-title, .socials, .links-section').forEach(el => {
      el.classList.add('fade-out');
    });

    counter.classList.add('counter-active');
    if (shopPanel) {
      setTimeout(() => shopPanel.classList.add('active'), 10);
    }
    title.classList.add('title-center');

    setTimeout(() => {
      dimOverlay.classList.add('active');
    }, 50);

    let exitBtn = counter.querySelector('.exit-clicker-btn');
    if (!exitBtn) {
      exitBtn = document.createElement('button');
      exitBtn.className = 'exit-clicker-btn';
      exitBtn.textContent = 'Exit Clicker';
      exitBtn.addEventListener('click', deactivateGameMode);
      counter.appendChild(exitBtn);
    }
    updateCounterDisplay();
  };

  const deactivateGameMode = () => {
    if (!gameMode) return;
    
    deactivateCheat(); // Ensure cheat breaks if player hits exit

    gameMode = false;
    clickerActive = false;

    const title = document.getElementById('title');
    const counter = document.getElementById('cookie-counter');
    const shopPanel = document.getElementById('shop-panel');
    const dimOverlay = document.getElementById('game-mode-overlay');

    counter.classList.remove('counter-active');
    if (shopPanel) {
      shopPanel.classList.remove('active');
      const shopList = shopPanel.querySelector('.shop-list');
      if (shopList) shopList.classList.remove('open');
      const shopSpan = shopPanel.querySelector('.shop-header span');
      if (shopSpan) shopSpan.textContent = '▼';
    }
    title.classList.remove('title-center');
    if (dimOverlay) dimOverlay.classList.remove('active');

    document.querySelectorAll('.bio, .interests, .links-title, .socials, .links-section').forEach(el => {
      el.classList.remove('fade-out');
    });

    const exitBtn = counter.querySelector('.exit-clicker-btn');
    if (exitBtn) exitBtn.remove();

    setTimeout(() => {
      if (dimOverlay && dimOverlay.parentNode) {
        dimOverlay.remove();
      }
    }, 400);
  };

  const increaseScore = (multiplier = 1) => {
    clickerScore += getClickValue() * multiplier;
    saveData();
    updateCounterDisplay();
  };

  const init = () => {
    loadData();
    clickerActive = false;
    gameMode = false;
    document.cookie = `cymouz_clicker_active=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ClickerGame.init());
} else {
  ClickerGame.init();
}