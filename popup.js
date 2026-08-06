// popup.js - UI Controller for volUP (v1.5.0 Master Edition)

document.addEventListener('DOMContentLoaded', async () => {
  // Navigation Tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const targetContent = document.getElementById(tab.dataset.tab);
      if (targetContent) targetContent.classList.add('active');

      if (tab.dataset.tab === 'tab-mixer') {
        loadMixerTabs();
      } else if (tab.dataset.tab === 'tab-sites') {
        loadSavedSites();
      }
    });
  });

  // Main Controls
  const volumeSlider = document.getElementById('volumeSlider');
  const sliderFill = document.getElementById('sliderFill');
  const volumeValue = document.getElementById('volumeValue');
  const statusText = document.getElementById('statusText');
  const statusDot = document.querySelector('.status-dot');
  const domainDisplay = document.getElementById('domainDisplay');
  const visualizer = document.getElementById('visualizer');
  const vizThemeBtn = document.getElementById('vizThemeBtn');
  const antiDistortionToggle = document.getElementById('antiDistortionToggle');
  const vocalClarityToggle = document.getElementById('vocalClarityToggle');
  const nightModeToggle = document.getElementById('nightModeToggle');
  const maxLockToggle = document.getElementById('maxLockToggle');
  const rememberDomainToggle = document.getElementById('rememberDomainToggle');
  const muteBtn = document.getElementById('muteBtn');
  const muteBtnText = document.getElementById('muteBtnText');
  const resetBtn = document.getElementById('resetBtn');
  const presetBtns = document.querySelectorAll('.preset-btn');
  const profileBtns = document.querySelectorAll('.profile-btn');

  // EQ & Quick Boost Controls
  const bassSlider = document.getElementById('bassSlider');
  const bassVal = document.getElementById('bassVal');
  const trebleSlider = document.getElementById('trebleSlider');
  const trebleVal = document.getElementById('trebleVal');
  const resetEqBtn = document.getElementById('resetEqBtn');
  const eqPresetBtns = document.querySelectorAll('.eq-preset-btn');
  const eq5Btn = document.getElementById('eq5Btn');
  const eq10Btn = document.getElementById('eq10Btn');
  const eq5Grid = document.getElementById('eq5Grid');
  const eq10Grid = document.getElementById('eq10Grid');
  const eqSliders5 = document.querySelectorAll('.eq-slider');
  const eqSliders10 = document.querySelectorAll('.eq-slider10');

  // Mixer & Sites Controls
  const mixerList = document.getElementById('mixerList');
  const refreshTabsBtn = document.getElementById('refreshTabsBtn');
  const sitesList = document.getElementById('sitesList');
  const clearSitesBtn = document.getElementById('clearSitesBtn');

  // Tools, Timer & Backup Controls
  const timerValue = document.getElementById('timerValue');
  const timerBtns = document.querySelectorAll('.timer-btn');
  const monoToggle = document.getElementById('monoToggle');
  const panSlider = document.getElementById('panSlider');
  const panValue = document.getElementById('panValue');
  const resetPanBtn = document.getElementById('resetPanBtn');
  const exportSettingsBtn = document.getElementById('exportSettingsBtn');
  const importSettingsBtn = document.getElementById('importSettingsBtn');
  const importFileInput = document.getElementById('importFileInput');

  let activeTabId = null;
  let currentVolume = 100;
  let isMuted = false;
  let isAntiDistortion = true;
  let isVocalClarity = false;
  let isNightMode = false;
  let isMono = false;
  let maxLock = 0;
  let currentPan = 0;
  let currentBass = 0;
  let currentTreble = 0;
  let currentProfile = 'flat';
  let currentEqMode = '5band';
  let currentVizTheme = 'waves';
  let currentEqBands = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let sleepTimerEndTime = null;
  let timerInterval = null;

  const EQ_PRESETS_10 = {
    flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bass: [6, 5, 4, 2, 0, -1, -2, -2, -3, -3],
    vocal: [-3, -2, 0, 2, 4, 6, 5, 3, 1, -1],
    movie: [5, 4, 3, 1, 0, 1, 2, 3, 4, 4],
    pop: [4, 3, 2, 0, -1, -1, 1, 3, 4, 4]
  };

  const VIZ_THEMES = ['waves', 'pulse', 'led'];

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    activeTabId = tab.id;
    try {
      const url = new URL(tab.url);
      domainDisplay.textContent = url.hostname || 'Local Page';
    } catch (e) {
      domainDisplay.textContent = 'Web Page';
    }
  }

  // Safe tab message sender with connection error catching
  function safeSendMessage(message, callback) {
    if (!activeTabId) return;
    chrome.tabs.sendMessage(activeTabId, message, (response) => {
      if (chrome.runtime.lastError) {
        // Suppress "Could not establish connection. Receiving end does not exist."
        void chrome.runtime.lastError;
      }
      if (callback) callback(response);
    });
  }

  function fetchState() {
    chrome.storage.local.get([
      'globalVolume', 'antiDistortion', 'isMuted', 'siteVolumes',
      'nightMode', 'isMono', 'vocalClarity', 'maxLock',
      'panBalance', 'bassBoost', 'trebleBoost', 'audioProfile', 'eqBands', 'eqMode', 'vizTheme', 'sleepTimerEndTime'
    ], (res) => {
      if (res.globalVolume !== undefined) currentVolume = res.globalVolume;
      if (res.antiDistortion !== undefined) isAntiDistortion = res.antiDistortion;
      if (res.isMuted !== undefined) isMuted = res.isMuted;
      if (res.nightMode !== undefined) isNightMode = res.nightMode;
      if (res.isMono !== undefined) isMono = res.isMono;
      if (res.vocalClarity !== undefined) isVocalClarity = res.vocalClarity;
      if (res.maxLock !== undefined) maxLock = res.maxLock;
      if (res.panBalance !== undefined) currentPan = res.panBalance;
      if (res.bassBoost !== undefined) currentBass = res.bassBoost;
      if (res.trebleBoost !== undefined) currentTreble = res.trebleBoost;
      if (res.audioProfile !== undefined) currentProfile = res.audioProfile;
      if (res.eqMode !== undefined) currentEqMode = res.eqMode;
      if (res.vizTheme !== undefined) currentVizTheme = res.vizTheme;
      if (res.eqBands !== undefined) currentEqBands = res.eqBands;
      if (res.sleepTimerEndTime !== undefined) sleepTimerEndTime = res.sleepTimerEndTime;

      safeSendMessage({ type: "GET_STATUS" }, (response) => {
        if (response && response.domain) {
          const siteVolumes = res.siteVolumes || {};
          if (siteVolumes[response.domain] !== undefined) {
            currentVolume = siteVolumes[response.domain];
            rememberDomainToggle.checked = true;
          }
        }
        updateUI();
        updateTimerDisplay();
      });
    });
  }

  function updateUI() {
    // Volume Tab
    volumeSlider.value = currentVolume;
    volumeValue.textContent = currentVolume;
    const fillPercent = (currentVolume / 1000) * 100;
    sliderFill.style.width = `${fillPercent}%`;

    const themeClass = `${currentVizTheme}-theme`;
    const activeClass = (isMuted || currentVolume === 0) ? '' : ' active';
    visualizer.className = `visualizer ${themeClass}${activeClass}`;
    vizThemeBtn.textContent = `🎨 ${currentVizTheme.toUpperCase()}`;

    if (isMuted) {
      volumeValue.style.color = '#ef4444';
      statusText.textContent = 'Muted';
      statusDot.style.backgroundColor = '#ef4444';
      statusDot.style.boxShadow = '0 0 8px #ef4444';
      muteBtn.classList.add('muted');
      muteBtnText.textContent = 'Unmute';
    } else {
      muteBtn.classList.remove('muted');
      muteBtnText.textContent = 'Mute';

      if (currentVolume <= 100) {
        volumeValue.style.color = '#ffffff';
        statusText.textContent = 'Normal Audio Level';
        statusDot.style.backgroundColor = '#10b981';
        statusDot.style.boxShadow = '0 0 8px #10b981';
      } else if (currentVolume <= 400) {
        volumeValue.style.color = '#c084fc';
        statusText.textContent = 'HD Boosted Audio';
        statusDot.style.backgroundColor = '#8b5cf6';
        statusDot.style.boxShadow = '0 0 8px #8b5cf6';
      } else if (currentVolume <= 800) {
        volumeValue.style.color = '#f472b6';
        statusText.textContent = 'Super Boost Level 🛡️';
        statusDot.style.backgroundColor = '#ec4899';
        statusDot.style.boxShadow = '0 0 8px #ec4899';
      } else {
        volumeValue.style.color = '#06b6d4';
        statusText.textContent = '10x TURBO Boost Level 🛡️';
        statusDot.style.backgroundColor = '#06b6d4';
        statusDot.style.boxShadow = '0 0 8px #06b6d4';
      }
    }

    antiDistortionToggle.checked = isAntiDistortion;
    vocalClarityToggle.checked = isVocalClarity;
    nightModeToggle.checked = isNightMode;
    maxLockToggle.checked = maxLock > 0;
    monoToggle.checked = isMono;

    presetBtns.forEach(btn => {
      const presetVal = parseInt(btn.dataset.preset, 10);
      if (presetVal === currentVolume && !isMuted) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    profileBtns.forEach(btn => {
      if (btn.dataset.profile === currentProfile) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // EQ & Quick Boost Tab
    bassSlider.value = currentBass;
    bassVal.textContent = `+${currentBass} dB`;
    trebleSlider.value = currentTreble;
    trebleVal.textContent = `+${currentTreble} dB`;

    if (currentEqMode === '10band') {
      eq5Btn.classList.remove('active');
      eq10Btn.classList.add('active');
      eq5Grid.style.display = 'none';
      eq10Grid.style.display = 'grid';
    } else {
      eq10Btn.classList.remove('active');
      eq5Btn.classList.add('active');
      eq10Grid.style.display = 'none';
      eq5Grid.style.display = 'grid';
    }

    eqSliders5.forEach((slider, idx) => {
      const bandIndex = idx * 2 + 1;
      const val = currentEqBands[bandIndex] || 0;
      slider.value = val;
      const dbLabel = document.getElementById(`eqDb-${idx}`);
      if (dbLabel) dbLabel.textContent = val > 0 ? `+${val}dB` : `${val}dB`;
    });

    eqSliders10.forEach((slider, idx) => {
      const val = currentEqBands[idx] || 0;
      slider.value = val;
      const dbLabel = document.getElementById(`eq10Db-${idx}`);
      if (dbLabel) dbLabel.textContent = val > 0 ? `+${val}dB` : `${val}dB`;
    });

    // Tools Tab
    panSlider.value = currentPan;
    if (currentPan === 0) panValue.textContent = 'Center';
    else if (currentPan < 0) panValue.textContent = `${Math.abs(Math.round(currentPan * 100))}% Left`;
    else panValue.textContent = `${Math.round(currentPan * 100)}% Right`;
  }

  function setVolume(newVolume) {
    if (maxLock > 0 && newVolume > maxLock) {
      newVolume = maxLock;
    }
    currentVolume = Math.max(0, Math.min(1000, newVolume));
    if (isMuted) {
      isMuted = false;
      sendMuteState(false);
    }
    updateUI();
    chrome.storage.local.set({ globalVolume: currentVolume });

    safeSendMessage({
      type: "SET_VOLUME",
      volume: currentVolume,
      saveDomain: rememberDomainToggle.checked
    });
  }

  function sendMuteState(muted) {
    isMuted = muted;
    updateUI();
    chrome.storage.local.set({ isMuted: isMuted });
    safeSendMessage({
      type: "TOGGLE_MUTE",
      isMuted: isMuted
    });
  }

  function sendEQ(bands) {
    currentEqBands = bands;
    updateUI();
    chrome.storage.local.set({ eqBands: currentEqBands });
    safeSendMessage({ type: "SET_EQ", eqBands: currentEqBands });
  }

  function setProfile(profileKey) {
    currentProfile = profileKey;
    chrome.storage.local.set({ audioProfile: profileKey });
    safeSendMessage({ type: "SET_PROFILE", profile: profileKey }, () => {
      fetchState();
    });
  }

  // Sleep Timer Countdown Manager
  function updateTimerDisplay() {
    if (timerInterval) clearInterval(timerInterval);

    if (!sleepTimerEndTime || sleepTimerEndTime <= Date.now()) {
      timerValue.textContent = "Off";
      timerBtns.forEach(btn => {
        if (btn.dataset.time === "0") btn.classList.add('active');
        else btn.classList.remove('active');
      });
      return;
    }

    const tick = () => {
      const remainingMs = sleepTimerEndTime - Date.now();
      if (remainingMs <= 0) {
        clearInterval(timerInterval);
        sleepTimerEndTime = null;
        chrome.storage.local.set({ sleepTimerEndTime: null });
        sendMuteState(true);
        updateTimerDisplay();
        return;
      }
      const totalSecs = Math.floor(remainingMs / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      timerValue.textContent = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    };

    tick();
    timerInterval = setInterval(tick, 1000);
  }

  timerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const minutes = parseInt(btn.dataset.time, 10);
      timerBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (minutes === 0) {
        sleepTimerEndTime = null;
      } else {
        sleepTimerEndTime = Date.now() + (minutes * 60 * 1000);
      }
      chrome.storage.local.set({ sleepTimerEndTime });
      updateTimerDisplay();
    });
  });

  function loadSavedSites() {
    sitesList.innerHTML = '<div class="empty-sites">Loading saved domain rules...</div>';
    chrome.storage.local.get(['siteVolumes'], (res) => {
      const siteVolumes = res.siteVolumes || {};
      const domains = Object.keys(siteVolumes);

      if (domains.length === 0) {
        sitesList.innerHTML = '<div class="empty-sites">No site volume rules saved yet</div>';
        return;
      }

      sitesList.innerHTML = '';
      domains.forEach(domain => {
        const item = document.createElement('div');
        item.className = 'site-rule-item';

        const info = document.createElement('div');
        info.className = 'site-rule-info';

        const name = document.createElement('span');
        name.className = 'site-domain-name';
        name.textContent = domain;
        info.appendChild(name);

        const badge = document.createElement('span');
        badge.className = 'site-vol-badge';
        badge.textContent = `${siteVolumes[domain]}%`;
        info.appendChild(badge);

        item.appendChild(info);

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-rule-btn';
        delBtn.textContent = '✖';
        delBtn.title = `Delete rule for ${domain}`;
        delBtn.addEventListener('click', () => {
          delete siteVolumes[domain];
          chrome.storage.local.set({ siteVolumes }, () => {
            loadSavedSites();
          });
        });

        item.appendChild(delBtn);
        sitesList.appendChild(item);
      });
    });
  }

  clearSitesBtn.addEventListener('click', () => {
    chrome.storage.local.set({ siteVolumes: {} }, () => {
      loadSavedSites();
    });
  });

  exportSettingsBtn.addEventListener('click', () => {
    chrome.storage.local.get(null, (allData) => {
      const jsonStr = JSON.stringify(allData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'volUP-backup-settings.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  importSettingsBtn.addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const importedData = JSON.parse(evt.target.result);
        chrome.storage.local.set(importedData, () => {
          fetchState();
          alert("volUP settings imported successfully!");
        });
      } catch (err) {
        alert("Failed to import settings: Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  });

  function loadMixerTabs() {
    mixerList.innerHTML = '<div class="empty-mixer">Scanning open browser tabs...</div>';
    chrome.runtime.sendMessage({ type: "GET_ALL_TABS" }, (res) => {
      if (chrome.runtime.lastError) void chrome.runtime.lastError;
      if (!res || !res.tabs || res.tabs.length === 0) {
        mixerList.innerHTML = '<div class="empty-mixer">No open tabs found</div>';
        return;
      }

      mixerList.innerHTML = '';
      res.tabs.forEach(tab => {
        const item = document.createElement('div');
        item.className = 'mixer-item';

        const info = document.createElement('div');
        info.className = 'mixer-item-info';

        if (tab.favIconUrl) {
          const img = document.createElement('img');
          img.className = 'mixer-favicon';
          img.src = tab.favIconUrl;
          img.onerror = () => { img.style.display = 'none'; };
          info.appendChild(img);
        }

        const title = document.createElement('span');
        title.className = 'mixer-title-text';
        title.textContent = tab.title;
        info.appendChild(title);

        if (tab.audible) {
          const badge = document.createElement('span');
          badge.className = 'tab-audio-badge';
          badge.textContent = 'PLAYING';
          info.appendChild(badge);
        }

        item.appendChild(info);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'mixer-actions';

        const isTabMuted = tab.mutedInfo && tab.mutedInfo.muted;
        const muteTabBtn = document.createElement('button');
        muteTabBtn.className = 'tab-mute-btn';
        muteTabBtn.textContent = isTabMuted ? '🔇 Muted' : '🔊 Mute';
        if (isTabMuted) muteTabBtn.classList.add('muted');

        muteTabBtn.addEventListener('click', () => {
          chrome.runtime.sendMessage({
            type: "TOGGLE_TAB_MUTE",
            tabId: tab.id,
            muted: !isTabMuted
          }, () => {
            if (chrome.runtime.lastError) void chrome.runtime.lastError;
            loadMixerTabs();
          });
        });
        actionsDiv.appendChild(muteTabBtn);

        const focusBtn = document.createElement('button');
        focusBtn.className = 'eq-preset-btn';
        focusBtn.textContent = tab.active ? 'Active' : 'Switch';
        focusBtn.style.padding = '3px 8px';
        focusBtn.addEventListener('click', () => {
          chrome.tabs.update(tab.id, { active: true });
        });
        actionsDiv.appendChild(focusBtn);

        item.appendChild(actionsDiv);
        mixerList.appendChild(item);
      });
    });
  }

  // Visualizer Theme Cycle Switcher
  vizThemeBtn.addEventListener('click', () => {
    const currentIdx = VIZ_THEMES.indexOf(currentVizTheme);
    currentVizTheme = VIZ_THEMES[(currentIdx + 1) % VIZ_THEMES.length];
    chrome.storage.local.set({ vizTheme: currentVizTheme });
    updateUI();
    safeSendMessage({ type: "SET_VIZ_THEME", theme: currentVizTheme });
  });

  // Listeners: Volume Tab
  volumeSlider.addEventListener('input', (e) => setVolume(parseInt(e.target.value, 10)));
  presetBtns.forEach(btn => btn.addEventListener('click', () => setVolume(parseInt(btn.dataset.preset, 10))));
  profileBtns.forEach(btn => btn.addEventListener('click', () => setProfile(btn.dataset.profile)));
  muteBtn.addEventListener('click', () => sendMuteState(!isMuted));
  resetBtn.addEventListener('click', () => setVolume(100));

  antiDistortionToggle.addEventListener('change', (e) => {
    isAntiDistortion = e.target.checked;
    chrome.storage.local.set({ antiDistortion: isAntiDistortion });
    safeSendMessage({ type: "SET_ANTI_DISTORTION", enabled: isAntiDistortion });
  });

  vocalClarityToggle.addEventListener('change', (e) => {
    isVocalClarity = e.target.checked;
    chrome.storage.local.set({ vocalClarity: isVocalClarity });
    safeSendMessage({ type: "SET_VOCAL_CLARITY", enabled: isVocalClarity });
  });

  nightModeToggle.addEventListener('change', (e) => {
    isNightMode = e.target.checked;
    chrome.storage.local.set({ nightMode: isNightMode });
    safeSendMessage({ type: "SET_NIGHT_MODE", enabled: isNightMode });
  });

  maxLockToggle.addEventListener('change', (e) => {
    maxLock = e.target.checked ? 400 : 0;
    chrome.storage.local.set({ maxLock });
    if (maxLock > 0 && currentVolume > maxLock) {
      setVolume(maxLock);
    }
    safeSendMessage({ type: "SET_MAX_LOCK", val: maxLock });
  });

  monoToggle.addEventListener('change', (e) => {
    isMono = e.target.checked;
    chrome.storage.local.set({ isMono });
    safeSendMessage({ type: "SET_MONO", enabled: isMono });
  });

  rememberDomainToggle.addEventListener('change', (e) => {
    safeSendMessage({
      type: "SET_VOLUME",
      volume: currentVolume,
      saveDomain: e.target.checked
    });
  });

  // Listeners: EQ Mode Switcher
  eq5Btn.addEventListener('click', () => {
    currentEqMode = '5band';
    chrome.storage.local.set({ eqMode: '5band' });
    updateUI();
    safeSendMessage({ type: "SET_EQ_MODE", mode: '5band' });
  });

  eq10Btn.addEventListener('click', () => {
    currentEqMode = '10band';
    chrome.storage.local.set({ eqMode: '10band' });
    updateUI();
    safeSendMessage({ type: "SET_EQ_MODE", mode: '10band' });
  });

  // Listeners: Quick Boost & EQ Sliders
  bassSlider.addEventListener('input', (e) => {
    currentBass = parseInt(e.target.value, 10);
    bassVal.textContent = `+${currentBass} dB`;
    chrome.storage.local.set({ bassBoost: currentBass });
    safeSendMessage({ type: "SET_BASS_BOOST", val: currentBass });
  });

  trebleSlider.addEventListener('input', (e) => {
    currentTreble = parseInt(e.target.value, 10);
    trebleVal.textContent = `+${currentTreble} dB`;
    chrome.storage.local.set({ trebleBoost: currentTreble });
    safeSendMessage({ type: "SET_TREBLE_BOOST", val: currentTreble });
  });

  eqSliders5.forEach((slider, idx) => {
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value, 10);
      const bandIndex = idx * 2 + 1;
      currentEqBands[bandIndex] = val;
      sendEQ([...currentEqBands]);
    });
  });

  eqSliders10.forEach((slider, idx) => {
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value, 10);
      currentEqBands[idx] = val;
      sendEQ([...currentEqBands]);
    });
  });

  eqPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      eqPresetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const presetKey = btn.dataset.eq;
      if (EQ_PRESETS_10[presetKey]) {
        sendEQ([...EQ_PRESETS_10[presetKey]]);
      }
    });
  });

  resetEqBtn.addEventListener('click', () => {
    sendEQ([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  refreshTabsBtn.addEventListener('click', loadMixerTabs);

  // Listeners: Tools & Balance Reset
  panSlider.addEventListener('input', (e) => {
    currentPan = parseFloat(e.target.value);
    updateUI();
    chrome.storage.local.set({ panBalance: currentPan });
    safeSendMessage({ type: "SET_PAN", pan: currentPan });
  });

  resetPanBtn.addEventListener('click', () => {
    currentPan = 0;
    updateUI();
    chrome.storage.local.set({ panBalance: 0 });
    safeSendMessage({ type: "SET_PAN", pan: 0 });
  });

  fetchState();
});
