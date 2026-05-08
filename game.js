// Cookie Clicker Game Module
const ClickerGame = (() => {
  let clickerScore = 0;
  let rebirths = 0; 
  let clickerActive = false;
  let gameMode = false;
  let renderShopItems = null;
  let activeTab = 'click'; 

  // --- Rebirth Config ---
  const REBIRTH_BASE_GOAL = 250000000; 
  const getRebirthGoal = () => Math.floor(REBIRTH_BASE_GOAL * Math.pow(100, rebirths));
  const getGlobalMult = () => Math.max(1, Math.pow(25, rebirths));

  // --- Cheat Variables ---
  let isCheatActive = false;
  let cheatInterval = null;
  let preCheatUpgrades = {};
  const konamiCode = [' ', 'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a', 'Enter'];
  let konamiIndex = 0;

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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && clickerActive) {
      deactivateGameMode();
    }
  });

  // ==========================================
  // 🛒 UPGRADES DICTIONARY
  // ==========================================
  let upgrades = {
    multiplier: { name: "🖱️ Multiplier", desc: "+1 Point per click", count: 0, baseCost: 15, costScale: 1.15, type: "click", effectValue: 1 },
    heavyMouse: { name: "🔨 Heavy Mouse", desc: "+5 Points per click", count: 0, baseCost: 100, costScale: 1.16, type: "click", effectValue: 5 },
    motorizedMouse: { name: "⚡ Motorized Mouse", desc: "+15 Points per click", count: 0, baseCost: 500, costScale: 1.17, type: "click", effectValue: 15 },
    gamingChair: { name: "💺 Gaming Chair", desc: "+50 Points per click", count: 0, baseCost: 3000, costScale: 1.18, type: "click", effectValue: 50 },
    neuralLink: { name: "🧠 Neural Link", desc: "+200 Points per click", count: 0, baseCost: 15000, costScale: 1.19, type: "click", effectValue: 200 },
    quantumCursor: { name: "🌌 Quantum Cursor", desc: "+1,000 Points per click", count: 0, baseCost: 100000, costScale: 1.20, type: "click", effectValue: 1000 },
    godFinger: { name: "👇 God's Finger", desc: "+10,000 Points per click", count: 0, baseCost: 1500000, costScale: 1.22, type: "click", effectValue: 10000 },

    autoClicker: { name: "⚙️ Auto-Clicker", desc: "+1 Point per second", count: 0, baseCost: 25, costScale: 1.15, type: "auto", effectValue: 1 },
    robotFriend: { name: "🤖 Robot Friend", desc: "+5 Points per second", count: 0, baseCost: 150, costScale: 1.16, type: "auto", effectValue: 5 },
    clone: { name: "👥 Clone", desc: "+25 Points per second", count: 0, baseCost: 1000, costScale: 1.17, type: "auto", effectValue: 25 },
    botnet: { name: "🛜 Botnet", desc: "+100 Points per second", count: 0, baseCost: 5000, costScale: 1.18, type: "auto", effectValue: 100 },
    factory: { name: "🏭 Factory", desc: "+500 Points per second", count: 0, baseCost: 35000, costScale: 1.19, type: "auto", effectValue: 500 },
    aiOverlord: { name: "👁️ AI Overlord", desc: "+2,500 Points per second", count: 0, baseCost: 250000, costScale: 1.20, type: "auto", effectValue: 2500 },

    efficiency: { name: "📉 Efficiency", desc: "Costs reduced by 3%", count: 0, baseCost: 500, costScale: 1.8, type: "discount", effectValue: 0.03 },
    coupons: { name: "✂️ Digital Coupons", desc: "Costs reduced by 5%", count: 0, baseCost: 3000, costScale: 2.0, type: "discount", effectValue: 0.05 },
    solarPanels: { name: "🔋 Solar Panels", desc: "Costs reduced by 8%", count: 0, baseCost: 25000, costScale: 2.5, type: "discount", effectValue: 0.08 },
    stonks: { name: "🤵📈 Stonks", desc: "Costs reduced by 12%", count: 0, baseCost: 500000, costScale: 3.5, type: "discount", effectValue: 0.12 },
    tos: { name: "📄 Terms of Service", desc: "Costs reduced by 15%", count: 0, baseCost: 750000, costScale: 4.0, type: "discount", effectValue: 0.15 }
  };

  const generateElevatedUpgrades = () => {
    const baseKeys = Object.keys(upgrades);
    baseKeys.forEach(key => {
      if (key.startsWith('elevated_')) return; 
      
      const base = upgrades[key];
      base.tier = 0; 
      
      const elevatedKey = 'elevated_' + key;
      const nameParts = base.name.split(' ');
      const emoji = nameParts.shift(); 
      const elevatedName = `${emoji} Elevated ${nameParts.join(' ')}`;
      
      let newEffectValue = base.effectValue;
      let newDesc = "";
      
      if (base.type === 'discount') {
        newEffectValue = base.effectValue * 1.5; 
        newDesc = `Costs reduced by ${(newEffectValue * 100).toFixed(1)}%`;
      } else {
        newEffectValue = base.effectValue * 1000000;
        newDesc = `+${formatNumberWithSuffix(newEffectValue)} per ${base.type === 'click' ? 'click' : 'second'}`;
      }

      upgrades[elevatedKey] = {
        ...base,
        name: elevatedName, 
        desc: newDesc,
        baseCost: base.baseCost * 100000000, 
        effectValue: newEffectValue,
        isElevated: true, 
        tier: 1, 
        count: 0
      };
    });
  };

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

  const hardReset = () => {
    if (confirm("⚠️ Are you absolutely sure you want to wipe ALL your progress? This includes your score, upgrades, and rebirths. This CANNOT be undone!")) {
      window.skipExitWarning = true; 
      localStorage.removeItem('cymouz_game_data');
      location.reload();
    }
  };

  const getDiscountMult = (targetTier) => {
    let mult = 1;
    for (let key in upgrades) {
      const u = upgrades[key];
      const uTier = u.tier || 0;
      if (u.type === "discount" && uTier === targetTier) {
        mult *= Math.pow(1 - u.effectValue, u.count);
      }
    }
    return Math.max(mult, 0.001); 
  };

  const getUpgradeCost = (key) => {
    const u = upgrades[key];
    const uTier = u.tier || 0;
    return Math.floor(u.baseCost * Math.pow(u.costScale, u.count) * getDiscountMult(uTier));
  };

  const getClickValue = () => {
    let clickPower = 1;
    for (let key in upgrades) {
      if (upgrades[key].type === "click") {
        clickPower += (upgrades[key].count * upgrades[key].effectValue);
      }
    }
    return clickPower * getGlobalMult(); 
  };

  const getAutoClickValue = () => {
    let autoPower = 0;
    for (let key in upgrades) {
      if (upgrades[key].type === "auto") {
        autoPower += (upgrades[key].count * upgrades[key].effectValue);
      }
    }
    return autoPower * getGlobalMult(); 
  };

  const formatNumberWithSuffix = (value) => {
    const absValue = Math.abs(value);
    
    if (absValue < 1000000) {
      return Math.floor(value).toLocaleString();
    }

    if (!isFinite(value)) return "Infinity";

    const suffixes = [
      "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", 
      "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod", "Vg", 
      "Uvg", "Dvg", "Tvg", "Qavg", "Qivg", "Sxvg", "Spvg", "Ocvg", "Novg", "Tg", 
      "Utg", "Dtg", "Ttg", "Qatg", "Qitg", "Sxtg", "Sptg", "Octg", "Notg", "Qg", 
      "Uqg", "Dqg", "Tqg", "Qaqg", "Qiqg", "Sxqg", "Spqg", "Ocqg", "Noqg", "Qq", 
      "Uqq", "Dqq", "Tqq", "Qaqq", "Qiqq", "Sxqq", "Spqq", "Ocqq", "Noqq", "Sg", 
      "Usg", "Dsg", "Tsg", "Qasg", "Qisg", "Sxsg", "Spsg", "Ocsg", "Nosg", "St", 
      "Ust", "Dst", "Tst", "Qast", "Qist", "Sxst", "Spst", "Ocst", "Nost", "Og", 
      "Uog", "Dog", "Tog", "Qaog", "Qiog", "Sxog", "Spog", "Ocog", "Noog", "Ng", 
      "Ung", "Dng", "Tng", "Qang", "Qing", "Sxng", "Spng", "Ocng", "Nong", "Ce"  
    ];

    const suffixNum = Math.floor(Math.log10(absValue) / 3);

    if (suffixNum >= suffixes.length) {
      return (value < 0 ? "-" : "") + absValue.toExponential(2).replace('e+', 'e');
    }

    const shortValue = absValue / Math.pow(10, suffixNum * 3);
    return (value < 0 ? "-" : "") + shortValue.toFixed(2).replace(/\.?0+$/, '') + suffixes[suffixNum];
  };

  const getFullSuffixName = (suffixNum) => {
    if (suffixNum === 0) return "";
    if (suffixNum === 1) return "Thousand";
    if (suffixNum === 2) return "Million";
    if (suffixNum === 3) return "Billion";
    if (suffixNum === 4) return "Trillion";
    if (suffixNum === 5) return "Quadrillion";
    if (suffixNum === 6) return "Quintillion";
    if (suffixNum === 7) return "Sextillion";
    if (suffixNum === 8) return "Septillion";
    if (suffixNum === 9) return "Octillion";
    if (suffixNum === 10) return "Nonillion";
    if (suffixNum === 101) return "Centillion";

    const units = ["", "Un", "Duo", "Tre", "Quattuor", "Quin", "Sex", "Septen", "Octo", "Novem"];
    const tens = ["", "Dec", "Vigint", "Trigint", "Quadragint", "Quinquagint", "Sexagint", "Septuagint", "Octogint", "Nonagint"];
    
    const num = suffixNum - 1;
    const unitIdx = num % 10;
    const tenIdx = Math.floor(num / 10);
    
    if (unitIdx === 0) {
      return tens[tenIdx] + "illion";
    }
    return units[unitIdx] + tens[tenIdx].toLowerCase() + "illion";
  };

  const getNumberTooltip = (value) => {
    const absValue = Math.abs(value);
    if (absValue < 1000) return Math.floor(value).toString();
    
    const suffixNum = Math.floor(Math.log10(absValue) / 3);
    
    let exactStr = "";
    if (absValue < 1e21) {
      exactStr = Math.floor(value).toLocaleString();
    } else {
      exactStr = (value < 0 ? "-" : "") + absValue.toExponential(2).replace('e+', 'e');
    }
    
    if (suffixNum >= 102) return exactStr; 
    
    const shortValue = absValue / Math.pow(10, suffixNum * 3);
    const shortStr = shortValue.toFixed(2).replace(/\.?0+$/, '');
    const fullName = getFullSuffixName(suffixNum);
    
    if (absValue < 1e21) {
      return `${exactStr} (${shortStr} ${fullName})`;
    } else {
      return `${shortStr} ${fullName} (${exactStr})`; 
    }
  };

  const performRebirth = () => {
    const goal = getRebirthGoal();
    if (clickerScore < goal) return;
    
    rebirths++; 
    clickerScore = 0;
    
    for (let key in upgrades) {
      upgrades[key].count = 0;
    }
    
    saveData(); 
    updateCounterDisplay();
    
    if (localStorage.getItem('cymouz_setting_rebirth_alerts') !== 'false') {
      alert(`Rebirth Complete! Global Multiplier is now ${getGlobalMult()}x`);
    }
  };

  // --- Display Updates ---
  const updateCounterDisplay = () => {
    const counterValue = document.getElementById('cookie-counter-value');
    const counterLabel = document.getElementById('cookie-counter-label');
    const rbCont = document.getElementById('rebirth-container');
    
    const showExactAlways = localStorage.getItem('cymouz_setting_always_show_exact') === 'true';

    if (counterValue) {
      counterValue.textContent = formatNumberWithSuffix(clickerScore);
      counterValue.title = getNumberTooltip(clickerScore);
      counterValue.style.cursor = 'help';
      
      let exactSub = document.getElementById('cookie-counter-exact');
      if (showExactAlways) {
        if (!exactSub) {
          exactSub = document.createElement('div');
          exactSub.id = 'cookie-counter-exact';
          exactSub.style.fontSize = '0.9rem';
          exactSub.style.opacity = '0.7';
          exactSub.style.marginTop = '4px';
          exactSub.style.fontWeight = 'normal';
          counterValue.parentNode.insertBefore(exactSub, counterValue.nextSibling);
        }
        exactSub.textContent = getNumberTooltip(clickerScore);
      } else if (exactSub) {
        exactSub.remove();
      }
    }
    
    if (counterLabel) {
      counterLabel.textContent = clickerActive ? 'Points' : 'Clicker locked';
    }

    if (rbCont) {
      const goal = getRebirthGoal();
      if (clickerScore >= goal) {
        const nextMult = Math.max(1, Math.pow(25, rebirths + 1));
        rbCont.innerHTML = `<button class="rebirth-btn" onclick="ClickerGame.performRebirth()">REBIRTH FOR ${nextMult}x MULT</button>`;
      } else {
        const prog = Math.min((clickerScore / goal) * 100, 100);
        const tooltipStr = `Progress: ${formatNumberWithSuffix(clickerScore)} / ${formatNumberWithSuffix(goal)}`;
        
        let html = `<div class="rebirth-progress-bg" title="${tooltipStr}"><div class="rebirth-progress-fill" style="width: ${prog}%"></div></div>`;
        
        if (showExactAlways) {
          let exactScoreStr = clickerScore < 1e21 ? Math.floor(clickerScore).toLocaleString() : clickerScore.toExponential(2).replace('e+', 'e');
          let exactGoalStr = goal < 1e21 ? Math.floor(goal).toLocaleString() : goal.toExponential(2).replace('e+', 'e');
          html += `<div style="font-size: 0.8rem; opacity: 0.7; margin-top: 6px; text-align: center;">${exactScoreStr} / ${exactGoalStr}</div>`;
        }
        
        rbCont.innerHTML = html;
      }
    }
    if (renderShopItems && gameMode) {
      renderShopItems(); 
    }
  };

  const showClickFeedback = (x, y, customValue = null) => {
    if (localStorage.getItem('cymouz_setting_click_numbers') === 'false') return;

    const feedback = document.createElement('div');
    feedback.className = 'click-feedback';
    const valToShow = customValue !== null ? customValue : getClickValue();
    feedback.textContent = `+${formatNumberWithSuffix(valToShow)}`;
    feedback.style.left = `${x}px`;
    feedback.style.top = `${y}px`;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 1000);
  };

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
              if (data.upgrades[key]) {
                upgrades[key].count = data.upgrades[key].count || 0; 
              }
            }
          }
          saveData(); 
          updateCounterDisplay();
        };
        reader.readAsText(file); 
        e.target.value = ''; 
      };

      ioDiv.append(dlBtn, ulBtn, ulInput);

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

      shopPanel.append(shopHeader, tabContainer, shopList, ioDiv);
      document.body.appendChild(shopPanel);
    }
    renderShopItems();
  };

  setInterval(() => {
    const autoPower = getAutoClickValue();
    if (autoPower > 0) { 
      clickerScore += autoPower; 
      saveData(); 
      updateCounterDisplay(); 
    }
  }, 1000);

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
        if (upgrades[key].isElevated && upgrades[key].type !== 'discount') {
          continue; 
        }
        upgrades[key].count += 1;
      }
      if (typeof spawnTungTung === 'function') {
        spawnTungTung();
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

  const activateGameMode = () => {
    if (gameMode) return;
    
    gameMode = true; 
    clickerActive = true;

    if ('Notification' in window && Notification.permission === 'default' && !localStorage.getItem('cymouz_has_asked_notifs')) {
      localStorage.setItem('cymouz_has_asked_notifs', 'true');
      Notification.requestPermission();
    }

    let meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover";
    }

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
    
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.classList.add('visible');
    }

    if (shopPanel) {
      setTimeout(() => shopPanel.classList.add('active'), 10);
    }
    
    setTimeout(() => title.classList.add('title-center'), 100);
    setTimeout(() => dimOverlay.classList.add('active'), 50);

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

    let meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.content = "width=device-width, initial-scale=1.0, viewport-fit=cover";
    }

    const title = document.getElementById('title');
    const counter = document.getElementById('cookie-counter');
    const shopPanel = document.getElementById('shop-panel');
    const dimOverlay = document.getElementById('game-mode-overlay');

    counter.classList.remove('counter-active');
    
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsBtn) settingsBtn.classList.remove('visible');
    if (settingsPanel) settingsPanel.classList.remove('active');

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
      if (dimOverlay && dimOverlay.parentNode) dimOverlay.remove(); 
    }, 400);
  };

  const increaseScore = (multiplier = 1) => {
    clickerScore += getClickValue() * multiplier;
    saveData(); 
    updateCounterDisplay();
  };

  const spawnTungTung = () => {
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted' && localStorage.getItem('cymouz_setting_event_notifs') !== 'false') {
      try {
        new Notification('Tung Tung Sahur!', {
          body: 'A wild Tung Tung has appeared! Hurry back!',
          icon: 'tungtungtungsahur.png' 
        });
      } catch (err) { }
    }

    const img = document.createElement('img');
    img.src = 'tungtungtungsahur.png';
    img.className = 'falling-tung';
    img.style.left = `${Math.floor(Math.random() * 80) + 10}%`;
    
    img.onclick = (e) => {
      e.stopPropagation(); 
      const autoBonus = getAutoClickValue() * 300; 
      const clickBonus = getClickValue() * 5 * 300; 
      const bonus = Math.floor(autoBonus + clickBonus + (1000 * getGlobalMult())); 
      
      clickerScore += bonus;
      saveData(); 
      updateCounterDisplay();
      
      if (typeof showClickFeedback === 'function') {
        showClickFeedback(e.clientX, e.clientY, bonus);
      }
      
      img.remove(); 
    };

    document.body.appendChild(img);
    
    setTimeout(() => { 
      if (img.parentNode) img.remove(); 
    }, 5000); 
  };

  setInterval(() => {
    if (clickerActive && clickerScore > 10 && Math.random() < 0.05) {
      spawnTungTung();
    }
  }, 15000);

  const init = () => {

    // Allow Spacebar to click
    window.addEventListener('keydown', (e) => {
      if (ClickerGame.isActive() && e.code === 'Space') {
        e.preventDefault(); // Prevents the page from jumping down
        ClickerGame.increaseScore();
        
        // Optional: Trigger visual feedback at the center of the screen 
        // since we don't have a mouse cursor position for a keypress
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        ClickerGame.showClickFeedback(x, y);
      }
    });

    generateElevatedUpgrades(); 
    loadData();
    clickerActive = false; 
    gameMode = false;
    document.cookie = `cymouz_clicker_active=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    
    // Wire up the exact numbers settings toggle dynamically if it exists in the HTML
    const exactNumbersCheckbox = document.getElementById('setting-exact-numbers');
    if (exactNumbersCheckbox) {
      exactNumbersCheckbox.checked = localStorage.getItem('cymouz_setting_always_show_exact') === 'true';
      exactNumbersCheckbox.addEventListener('change', (e) => {
        localStorage.setItem('cymouz_setting_always_show_exact', e.target.checked);
        updateCounterDisplay(); 
      });
    }

    updateCounterDisplay();
  };

  return {
    init, 
    activateGameMode, 
    deactivateGameMode, 
    increaseScore, 
    performRebirth, 
    hardReset,
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

window.addEventListener('wheel', (e) => {
  if (ClickerGame.isGameMode() && e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

window.addEventListener('keydown', (e) => {
  if (ClickerGame.isGameMode() && e.ctrlKey && (e.key === '=' || e.key === '-' || e.key === '+')) {
    e.preventDefault();
  }
});

// ==========================================
// 🔄 Auto-Update Checker
// ==========================================
(() => {
  let currentVersion = null;

  const notifyUpdateAvailable = () => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    
    if (localStorage.getItem('cymouz_setting_update_notifs') === 'false') return;

    try {
      new Notification('Website Updated', {
        body: 'A new version is ready. Refresh to load the latest content.',
        icon: '/favicon.ico'
      });
    } catch (err) { }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      try { 
        await Notification.requestPermission(); 
      } catch (err) { }
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