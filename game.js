// Cookie Clicker Game Module
const ClickerGame = (() => {
  let clickerScore = 0;
  let clickerActive = false;
  let gameMode = false;
  let renderShopItems = null;

  // =======================================================================
  // 🛒 UPGRADES DICTIONARY
  // =======================================================================
  // HOW TO ADD NEW UPGRADES:
  // Copy the template below, paste it, change the ID, and tweak the values!
  //
  // myNewUpgradeID: { 
  //   name: "🌟 Name",           // Display name (emojis work great!)
  //   desc: "What it does",      // Description under the name
  //   count: 0,                  // ALWAYS leave as 0
  //   baseCost: 100,             // Starting price
  //   costScale: 1.5,            // Price multiplier per level (1.5 = +50% cost)
  //   type: "click",             // CHOOSE ONE: "click", "auto", or "discount"
  //   effectValue: 5             // How much it adds/reduces per level
  // },
  // =======================================================================

  let upgrades = {
    // --- Click Power Upgrades ---
    multiplier: { name: "🖱️ Multiplier", desc: "+1 Point per click", count: 0, baseCost: 15, costScale: 1.5, type: "click", effectValue: 1 },
    heavyMouse: { name: "🔨 Heavy Mouse", desc: "+5 Points per click", count: 0, baseCost: 150, costScale: 1.6, type: "click", effectValue: 5 },
    
    // --- Auto-Clicker Upgrades ---
    autoClicker: { name: "⚙️ Auto-Clicker", desc: "+1 Point per second", count: 0, baseCost: 50, costScale: 1.6, type: "auto", effectValue: 1 },
    robotFriend: { name: "🤖 Robot Friend", desc: "+10 Points per second", count: 0, baseCost: 500, costScale: 1.7, type: "auto", effectValue: 10 },
    
    // --- Global Buff Upgrades ---
    efficiency: { name: "📉 Efficiency", desc: "Costs reduced by 5%", count: 0, baseCost: 200, costScale: 2.0, type: "discount", effectValue: 0.05 }
  };


  // --- Save / Load Logic ---
  const saveData = () => {
    const data = { score: clickerScore, upgrades };
    localStorage.setItem('cymouz_game_data', JSON.stringify(data));
  };

  const loadData = () => {
    const dataStr = localStorage.getItem('cymouz_game_data');
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        if (typeof data.score === 'number') clickerScore = data.score;
        if (data.upgrades) {
          // Dynamically load counts for whatever upgrades exist in our code
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
  
  // Calculates the global shop discount
  const getDiscountMult = () => {
    let mult = 1;
    for (let key in upgrades) {
      if (upgrades[key].type === "discount") {
        // e.g. 5% discount = 0.95 ^ level
        mult *= Math.pow(1 - upgrades[key].effectValue, upgrades[key].count);
      }
    }
    return mult;
  };

  // Calculates a specific upgrade's current cost
  const getUpgradeCost = (key) => {
    const u = upgrades[key];
    return Math.floor(u.baseCost * Math.pow(u.costScale, u.count) * getDiscountMult());
  };

  // Calculates total click power based on all "click" type upgrades
  const getClickValue = () => {
    let clickPower = 1; // Base click is always 1
    for (let key in upgrades) {
      if (upgrades[key].type === "click") {
        clickPower += (upgrades[key].count * upgrades[key].effectValue);
      }
    }
    return clickPower;
  };

  // Calculates total points per second based on all "auto" type upgrades
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
      renderShopItems(); // Refresh button disabled/enabled states
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
        
        // Inject upgrades dynamically
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
        
        // Inject Save/Load buttons
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