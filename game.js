// Cookie Clicker Game Module
const ClickerGame = (() => {
  let clickerScore = 0;
  let rebirths = 0; //Tracks the amount of rebirths
  let clickerActive = false;
  let gameMode = false;
  let renderShopItems = null;
  let activeTab = 'click'; // Tracks which tab is currently open

  // --- Rebirth Config ---
  const REBIRTH_BASE_GOAL = 500000000; 
  const getRebirthGoal = () => Math.floor(REBIRTH_BASE_GOAL * Math.pow(3, rebirths));
  const getGlobalMult = () => (rebirths + 1);

  // --- Cheat Variables ---
  let isCheatActive = false;
  let cheatInterval = null;
  let preCheatUpgrades = {};
  const konamiCode = ['Enter', 'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a', 'Enter'];
  let konamiIndex = 0;

  // Listen for cheat code
  document.addEventListener('keydown', (e) => {
    if (!clickerActive || isCheatActive) {
      konamiIndex = 0;
      return;
    }
    
    const key = e.key;
    const expected = konamiCode[konamiIndex];
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

  // Listen for Escape key to exit game mode
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && clickerActive) {
      deactivateGameMode();
    }
  });

  // ==========================================
  // 🛒 UPGRADES DICTIONARY
  // ==========================================
  let upgrades = {
    // --- Click Power ---
    multiplier: { name: "🖱️ Multiplier", desc: "+1 Point per click", count: 0, baseCost: 15, costScale: 1.35, type: "click", effectValue: 1 },
    heavyMouse: { name: "🔨 Heavy Mouse", desc: "+5 Points per click", count: 0, baseCost: 100, costScale: 1.4, type: "click", effectValue: 5 },
    motorizedMouse: { name: "⚡ Motorized Mouse", desc: "+15 Points per click", count: 0, baseCost: 500, costScale: 1.45, type: "click", effectValue: 15 },
    gamingChair: { name: "💺 Gaming Chair", desc: "+50 Points per click", count: 0, baseCost: 3000, costScale: 1.5, type: "click", effectValue: 50 },
    neuralLink: { name: "🧠 Neural Link", desc: "+200 Points per click", count: 0, baseCost: 15000, costScale: 1.55, type: "click", effectValue: 200 },
    quantumCursor: { name: "🌌 Quantum Cursor", desc: "+1,000 Points per click", count: 0, baseCost: 100000, costScale: 1.6, type: "click", effectValue: 1000 },
    godFinger: { name: "👇 God's Finger", desc: "+10,000 Points per click", count: 0, baseCost: 1500000, costScale: 1.65, type: "click", effectValue: 10000 },

    // --- Auto-Clicker ---
    autoClicker: { name: "⚙️ Auto-Clicker", desc: "+1 Point per second", count: 0, baseCost: 25, costScale: 1.3, type: "auto", effectValue: 1 },
    robotFriend: { name: "🤖 Robot Friend", desc: "+5 Points per second", count: 0, baseCost: 150, costScale: 1.35, type: "auto", effectValue: 5 },
    clone: { name: "👥 Clone", desc: "+25 Points per second", count: 0, baseCost: 1000, costScale: 1.4, type: "auto", effectValue: 25 },
    botnet: { name: "🛜 Botnet", desc: "+100 Points per second", count: 0, baseCost: 5000, costScale: 1.45, type: "auto", effectValue: 100 },
    factory: { name: "🏭 Factory", desc: "+500 Points per second", count: 0, baseCost: 35000, costScale: 1.5, type: "auto", effectValue: 500 },
    aiOverlord: { name: "👁️ AI Overlord", desc: "+2,500 Points per second", count: 0, baseCost: 250000, costScale: 1.55, type: "auto", effectValue: 2500 },

    // --- Global Buffs ---
    efficiency: { name: "📉 Efficiency", desc: "Costs reduced by 3%", count: 0, baseCost: 500, costScale: 1.8, type: "discount", effectValue: 0.03 },
    coupons: { name: "✂️ Digital Coupons", desc: "Costs reduced by 5%", count: 0, baseCost: 3000, costScale: 2.0, type: "discount", effectValue: 0.05 },
    solarPanels: { name: "🔋 Solar Panels", desc: "Costs reduced by 8%", count: 0, baseCost: 25000, costScale: 2.5, type: "discount", effectValue: 0.08 },
    stonks: { name: "🤵📈 Stonks", desc: "Costs reduced by 12%", count: 0, baseCost: 500000, costScale: 3.5, type: "discount", effectValue: 0.12 },
    tos: { name: "📄 Terms of Service", desc: "Costs reduced by 15%", count: 0, baseCost: 750000, costScale: 4.0, type: "discount", effectValue: 0.15 }
  };

// ==========================================
  // ✨ DYNAMIC ELEVATED GENERATION
  // ==========================================
  const generateElevatedUpgrades = () => {
    const baseKeys = Object.keys(upgrades);
    baseKeys.forEach(key => {
      if (key.startsWith('elevated_')) return; // Safeguard
      
      const base = upgrades[key];
      base.tier = 0; //Explicitly assign Level 0 to base upgrades
      
      const elevatedKey = 'elevated_' + key;
      const nameParts = base.name.split(' ');
      const emoji = nameParts.shift(); // Remove the emoji
      const elevatedName = `${emoji} Elevated ${nameParts.join(' ')}`;
      
      let newEffectValue = base.effectValue;
      let newDesc = "";
      
      if (base.type === 'discount') {
        newEffectValue = base.effectValue * 2; // Double the discount
        newDesc = `Costs reduced by ${(newEffectValue * 100).toFixed(0)}%`;
      } else {
        newEffectValue = base.effectValue * 100000000;
        newDesc = `+${newEffectValue.toLocaleString()} Point${newEffectValue !== 1 ? 's' : ''} per ${base.type === 'click' ? 'click' : 'second'}`;
      }

      upgrades[elevatedKey] = {
        ...base,
        name: elevatedName,
        desc: newDesc,
        baseCost: base.baseCost * 100000000, // 100,000,000x more expensive
        effectValue: newEffectValue,
        isElevated: true,
        tier: 1, //Assign Level 1 to elevated upgrades
        count: 0
      };
    });
  };

  // ==========================================
  // 🔒 ANTI-CHEAT ENCRYPTION SYSTEM
  // ==========================================
  const SECRET_KEY = "cymouz_super_secret_anti_cheat_key_1337";

  const encryptData = (dataObj) => {
    const str = encodeURIComponent(JSON.stringify(dataObj));
    let encrypted = "";
    for (let i = 0; i < str.length; i++) {
      encrypted += String.fromCharCode(str.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    }
    return btoa(encrypted); 
  };

  const decryptData = (encodedStr) => {
    try {
      const decoded = atob(encodedStr);
      let decrypted = "";
      for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
      }
      return JSON.parse(decodeURIComponent(decrypted));
    } catch (e) {
      try {
        return JSON.parse(encodedStr);
      } catch (err) {
        return null; 
      }
    }
  };

  // --- Save / Load Logic ---
  const saveData = () => {
    let upgradesToSave = upgrades;
    
    if (isCheatActive) {
      upgradesToSave = JSON.parse(JSON.stringify(upgrades)); 
      for (let key in preCheatUpgrades) {
        upgradesToSave[key].count = preCheatUpgrades[key];
      }
    }
    
    const data = { score: clickerScore, rebirths: rebirths, upgrades: upgradesToSave };
    localStorage.setItem('cymouz_game_data', encryptData(data));
  };

  const loadData = () => {
    const dataStr = localStorage.getItem('cymouz_game_data');
    if (dataStr) {
      const data = decryptData(dataStr);
      if (data) {
        if (typeof data.score === 'number') clickerScore = data.score;
        if (typeof data.rebirths === 'number') rebirths = data.rebirths || 0;
        if (data.upgrades) {
          for (let key in upgrades) {
            if (data.upgrades[key]) {
              upgrades[key].count = data.upgrades[key].count || 0;
            }
          }
        }
      }
    } else {
      const match = document.cookie.match(/(?:^|; )cymouz_clicker_score=([^;]*)/);
      if (match) {
        const oldScore = Number(decodeURIComponent(match[1]));
        if (Number.isFinite(oldScore)) clickerScore = oldScore;
      }
    }
  };

// --- Dynamic Math & Formulas ---
  const getDiscountMult = (targetTier) => {
    let mult = 1;
    for (let key in upgrades) {
      const u = upgrades[key];
      const uTier = u.tier || 0; // Default to 0 just in case
      
      //Only apply discount if the upgrade tier matches the item's tier
      if (u.type === "discount" && uTier === targetTier) {
        mult *= Math.pow(1 - u.effectValue, u.count);
      }
    }
    return Math.max(mult, 0.001); // Prevent free items
  };

  const getUpgradeCost = (key) => {
    const u = upgrades[key];
    const uTier = u.tier || 0;
    
    return Math.floor(u.baseCost * Math.pow(u.costScale, u.count) * getDiscountMult(uTier));
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
    return clickPower * getGlobalMult(); // Multiplied by Rebirths
  };

  const getAutoClickValue = () => {
    let autoPower = 0;
    for (let key in upgrades) {
      if (upgrades[key].type === "auto") {
        autoPower += (upgrades[key].count * upgrades[key].effectValue);
      }
    }
    return autoPower * getGlobalMult(); // Multiplied by Rebirths
  };

  const formatNumberWithSuffix = (value) => {
    const absValue = Math.abs(value);
    if (absValue >= 1e12) {
      return `${(value / 1e12).toFixed(2).replace(/\.?0+$/, '')}T`;
    }
    if (absValue >= 1e9) {
      return `${(value / 1e9).toFixed(2).replace(/\.?0+$/, '')}B`;
    }
    if (absValue >= 1e6) {
      return `${(value / 1e6).toFixed(2).replace(/\.?0+$/, '')}M`;
    }
    return Math.floor(value).toLocaleString();
  };

  // --- Rebirth Mechanic ---
  const performRebirth = () => {
    const goal = getRebirthGoal();
    if (clickerScore < goal) return;
    
    rebirths++;
    clickerScore = 0;
    
    // Reset upgrades
    for (let key in upgrades) {
      upgrades[key].count = 0;
    }
    
    saveData();
    updateCounterDisplay();
    alert(`Rebirth Complete! Global Multiplier is now ${rebirths + 1}x`);
  };

  // --- Display Updates ---
  const updateCounterDisplay = () => {
    const counterValue = document.getElementById('cookie-counter-value');
    const counterLabel = document.getElementById('cookie-counter-label');
    const rbCont = document.getElementById('rebirth-container');

    if (counterValue) {
      counterValue.textContent = formatNumberWithSuffix(clickerScore);
    }
    if (counterLabel) {
      counterLabel.textContent = clickerActive ? 'Points' : 'Clicker locked';
    }

    if (rbCont) {
      const goal = getRebirthGoal();
      if (clickerScore >= goal) {
        rbCont.innerHTML = `<button class="rebirth-btn" onclick="ClickerGame.performRebirth()">REBIRTH FOR ${getGlobalMult() + 1}x MULT</button>`;
      } else {
        const prog = Math.min((clickerScore / goal) * 100, 100);
        rbCont.innerHTML = `
          <div class="rebirth-progress-bg" title="Next Rebirth at ${formatNumberWithSuffix(goal)}">
            <div class="rebirth-progress-fill" style="width: ${prog}%"></div>
          </div>`;
      }
    }

    if (renderShopItems && gameMode) {
      renderShopItems(); 
    }
  };

  const showClickFeedback = (x, y) => {
    const feedback = document.createElement('div');
    feedback.className = 'click-feedback';
    feedback.textContent = `+${formatNumberWithSuffix(getClickValue())}`;
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
      
      const tabContainer = document.createElement('div');
      tabContainer.className = 'shop-tabs';
      tabContainer.innerHTML = `
        <button class="tab-btn active" data-tab="click">🖱️ Click</button>
        <button class="tab-btn" data-tab="auto">⚙️ Auto</button>
        <button class="tab-btn" data-tab="discount">📉 Costs</button>
      `;

      tabContainer.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = (e) => {
          activeTab = e.target.dataset.tab;
          tabContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          renderShopItems(); 
        };
      });

      const shopList = document.createElement('div');
      shopList.className = 'shop-list';
      shopList.style.maxHeight = '60vh';
      shopList.style.padding = '12px';
      shopList.style.overflowY = 'auto';
      
      const ioDiv = document.createElement('div');
      ioDiv.className = 'save-load-controls';
      
      const dlBtn = document.createElement('button');
      dlBtn.textContent = '💾 Export';
      dlBtn.onclick = () => {
        const blob = new Blob([encryptData({ score: clickerScore, rebirths, upgrades })], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cymouz_data.save'; 
        a.click();
        URL.revokeObjectURL(url);
      };
      
      const ulBtn = document.createElement('button');
      ulBtn.textContent = '📂 Import';
      ulBtn.onclick = () => document.getElementById('save-upload').click();

      const ulInput = document.createElement('input');
      ulInput.type = 'file';
      ulInput.id = 'save-upload';
      ulInput.accept = '.save,.json'; 
      ulInput.style.display = 'none';
      ulInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const data = decryptData(event.target.result);
          if (!data || typeof data.score !== 'number') {
            alert("Invalid or corrupted save file.");
            return;
          }
          
          clickerScore = data.score;
          rebirths = data.rebirths || 0;
          if (data.upgrades) {
            for (let key in upgrades) {
              if (data.upgrades[key]) upgrades[key].count = data.upgrades[key].count || 0;
            }
          }
          saveData();
          updateCounterDisplay();
        };
        reader.readAsText(file);
        e.target.value = ''; 
      };

      ioDiv.appendChild(dlBtn);
      ioDiv.appendChild(ulBtn);
      ioDiv.appendChild(ulInput);

      // Rendering Logic with Elevated Section
      renderShopItems = () => {
        shopList.innerHTML = ''; 
        
        const normalUpgrades = [];
        const elevatedUpgrades = [];

        for (let key in upgrades) {
          if (upgrades[key].type !== activeTab) continue;
          if (upgrades[key].isElevated) {
            elevatedUpgrades.push(key);
          } else {
            normalUpgrades.push(key);
          }
        }

        normalUpgrades.sort((a,b) => upgrades[a].baseCost - upgrades[b].baseCost);
        elevatedUpgrades.sort((a,b) => upgrades[a].baseCost - upgrades[b].baseCost);

        const renderBtn = (key) => {
          const cost = getUpgradeCost(key);
          const btn = document.createElement('button');
          btn.className = `upgrade-btn ${upgrades[key].isElevated ? 'elevated-variant' : ''}`;
          btn.innerHTML = `<strong>${upgrades[key].name}</strong> (Lvl ${upgrades[key].count})<br>
                           <span style="font-size: 0.75rem; opacity: 0.8;">${upgrades[key].desc}</span><br>
                           <span style="color: #ff4d6d;">Cost: ${formatNumberWithSuffix(cost)}</span>`;
          btn.disabled = clickerScore < cost;
          btn.onclick = () => buyUpgrade(key);
          shopList.appendChild(btn);
        };

        normalUpgrades.forEach(renderBtn);

        if (elevatedUpgrades.length > 0) {
          const divider = document.createElement('div');
          divider.innerHTML = '✨ Elevated Upgrades ✨';
          divider.style.textAlign = 'center';
          divider.style.margin = '20px 0 10px 0';
          divider.style.fontWeight = 'bold';
          divider.style.color = '#ff4d6d';
          divider.style.borderBottom = '1px dashed rgba(255, 77, 109, 0.4)';
          divider.style.paddingBottom = '5px';
          divider.style.fontSize = '0.85rem';
          divider.style.textTransform = 'uppercase';
          divider.style.letterSpacing = '0.05em';
          shopList.appendChild(divider);

          elevatedUpgrades.forEach(renderBtn);
        }
      };

      tabContainer.style.display = 'none';
      shopList.style.display = 'none';
      ioDiv.style.display = 'none';

      shopHeader.onclick = () => {
        const isClosed = shopList.style.display === 'none';
        
        if (isClosed) {
          tabContainer.style.display = 'flex';
          shopList.style.display = 'flex';
          ioDiv.style.display = 'flex';
          shopHeader.querySelector('span').textContent = '▲';
        } else {
          tabContainer.style.display = 'none';
          shopList.style.display = 'none';
          ioDiv.style.display = 'none';
          shopHeader.querySelector('span').textContent = '▼';
        }
      };

      shopPanel.appendChild(shopHeader);
      shopPanel.appendChild(tabContainer);
      shopPanel.appendChild(shopList);
      shopPanel.appendChild(ioDiv);
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
    for (let key in upgrades) {
      preCheatUpgrades[key] = upgrades[key].count;
    }
    const fx = document.createElement('div');
    fx.className = 'cheat-activated-text';
    fx.textContent = 'CHEAT ACTIVATED';
    document.body.appendChild(fx);
    setTimeout(() => fx.remove(), 2000); 

    const btn = document.createElement('button');
    btn.className = 'disengage-cheat-btn';
    btn.id = 'disengage-cheat-btn';
    btn.textContent = 'Disengage Cheat';
    btn.onclick = deactivateCheat;
    document.body.appendChild(btn);

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
    for (let key in preCheatUpgrades) {
      upgrades[key].count = preCheatUpgrades[key];
    }
    const btn = document.getElementById('disengage-cheat-btn');
    if (btn) btn.remove();
    updateCounterDisplay();
    saveData(); 
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
    
    setTimeout(() => {
      title.classList.add('title-center');
    }, 100);

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
    deactivateCheat(); 
    gameMode = false;
    clickerActive = false;

    const title = document.getElementById('title');
    const counter = document.getElementById('cookie-counter');
    const shopPanel = document.getElementById('shop-panel');
    const dimOverlay = document.getElementById('game-mode-overlay');

    counter.classList.remove('counter-active');
    if (shopPanel) {
      shopPanel.classList.remove('active');
      const shopSpan = shopPanel.querySelector('.shop-header span');
      if (shopSpan) shopSpan.textContent = '▼';
      
      const tabContainer = shopPanel.querySelector('.shop-tabs');
      const shopList = shopPanel.querySelector('.shop-list');
      const ioDiv = shopPanel.querySelector('.save-load-controls');
      if(tabContainer) tabContainer.style.display = 'none';
      if(shopList) shopList.style.display = 'none';
      if(ioDiv) ioDiv.style.display = 'none';
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
    generateElevatedUpgrades(); //Generates the upgrades before loading
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
    performRebirth, // Exported to be called from the HTML button
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

// ==========================================
// 🔄 Auto-Update Checker + Browser Notification
// ==========================================
(() => {
  let currentVersion = null;

  const notifyUpdateAvailable = () => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      new Notification('Website Updated', {
        body: 'A new version is ready. Refresh to load the latest content.',
        icon: '/favicon.ico'
      });
    } catch (err) {
      // ignore notification failures
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (err) {
        // ignore permission request errors
      }
    }
  };

  window.requestUpdateNotificationPermission = requestNotificationPermission;

  const fetchVersion = async () => {
    try {
      const response = await fetch('/version.json?t=' + Date.now());
      if (!response.ok) return null;
      const data = await response.json();
      return data.version;
    } catch (err) {
      return null;
    }
  };

  fetchVersion().then(version => {
    if (version) currentVersion = version;
  });

  setInterval(async () => {
    if (!currentVersion) return;
    const liveVersion = await fetchVersion();
    if (liveVersion && liveVersion !== currentVersion) {
      const banner = document.getElementById('update-banner');
      if (banner) banner.classList.add('show');
      notifyUpdateAvailable();
    }
  }, 10000); 
})();