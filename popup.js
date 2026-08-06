// popup.js - UI Controller for volUP (v1.3.0 Pro)

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
  const safetyGuardBadge = document.getElementById('safetyGuardBadge');
  const antiDistortionToggle = document.getElementById('antiDistortionToggle');
  const nightModeToggle = document.getElementById('nightModeToggle');
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
  const eqSliders = document.querySelectorAll('.eq-slider');

  // Mixer Controls
  const mixerList = document.getElementById('mixerList');
  const refreshTabsBtn = document.getElementById('refreshTabsBtn');

  // Tools Controls
  const panSlider = document.getElementById('panSlider');
  const panValue = document.getElementById('panValue');

  let activeTabId = null;
  let currentVolume = 100;
  let isMuted = false;
  let isAntiDistortion = true;
  let isNightMode = false;
  let currentPan = 0;
  let currentBass = 0;
  let currentTreble = 0;
  let currentProfile = 'flat';
  let currentEqBands = [0, 0, 0, 0, 0];

  const EQ_PRESETS = {
    flat: [0, 0, 0, 0, 0],
    bass: [6, 4, 0, -2, -3],
    vocal: [-2, 2, 5, 3, 0],
    movie: [4, 2, 1, 3, 5],
    pop: [3, 1, -1, 2, 4]
  };

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

  function fetchState() {
    if (!activeTabId) return;
    chrome.tabs.sendMessage(activeTabId, { type: "GET_STATUS" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        domainDisplay.textContent = "Out of Scope";
        return;
      }

      currentVolume = response.volume || 100;
      isAntiDistortion = response.antiDistortion !== undefined ? response.antiDistortion : true;
      isMuted = !!response.isMuted;
      isNightMode = !!response.nightMode;
      currentPan = response.panBalance !== undefined ? response.panBalance : 0;
      currentBass = response.bassBoost !== undefined ? response.bassBoost : 0;
      currentTreble = response.trebleBoost !== undefined ? response.trebleBoost : 0;
      currentProfile = response.audioProfile || 'flat';
      currentEqBands = response.eqBands || [0, 0, 0, 0, 0];

      if (response.domain) {
        chrome.storage.local.get(['siteVolumes'], (res) => {
          const siteVolumes = res.siteVolumes || {};
          if (siteVolumes[response.domain] !== undefined) {
            rememberDomainToggle.checked = true;
          }
        });
      }

      updateUI();
    });
  }

  function updateUI() {
    // Volume Tab
    volumeSlider.value = currentVolume;
    volumeValue.textContent = currentVolume;
    const fillPercent = (currentVolume / 1000) * 100;
    sliderFill.style.width = `${fillPercent}%`;

    // Speaker Guard Badge Display (> 500%)
    if (currentVolume > 500) {
      safetyGuardBadge.classList.add('active');
    } else {
      safetyGuardBadge.classList.remove('active');
    }

    if (isMuted || currentVolume === 0) {
      visualizer.classList.remove('active');
    } else {
      visualizer.classList.add('active');
    }

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
        statusText.textContent = 'Super Boost Level';
        statusDot.style.backgroundColor = '#ec4899';
        statusDot.style.boxShadow = '0 0 8px #ec4899';
      } else {
        volumeValue.style.color = '#06b6d4';
        statusText.textContent = '10x TURBO Boost Level';
        statusDot.style.backgroundColor = '#06b6d4';
        statusDot.style.boxShadow = '0 0 8px #06b6d4';
      }
    }

    antiDistortionToggle.checked = isAntiDistortion;
    nightModeToggle.checked = isNightMode;

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

    eqSliders.forEach((slider, idx) => {
      const val = currentEqBands[idx] || 0;
      slider.value = val;
      const dbLabel = document.getElementById(`eqDb-${idx}`);
      if (dbLabel) {
        dbLabel.textContent = val > 0 ? `+${val}dB` : `${val}dB`;
      }
    });

    // Tools Tab
    panSlider.value = currentPan;
    if (currentPan === 0) panValue.textContent = 'Center';
    else if (currentPan < 0) panValue.textContent = `${Math.abs(Math.round(currentPan * 100))}% Left`;
    else panValue.textContent = `${Math.round(currentPan * 100)}% Right`;
  }

  function setVolume(newVolume) {
    currentVolume = Math.max(0, Math.min(1000, newVolume));
    if (isMuted) {
      isMuted = false;
      sendMuteState(false);
    }
    updateUI();

    if (activeTabId) {
      chrome.tabs.sendMessage(activeTabId, {
        type: "SET_VOLUME",
        volume: currentVolume,
        saveDomain: rememberDomainToggle.checked
      });
    }
  }

  function sendMuteState(muted) {
    isMuted = muted;
    updateUI();
    if (activeTabId) {
      chrome.tabs.sendMessage(activeTabId, {
        type: "TOGGLE_MUTE",
        isMuted: isMuted
      });
    }
  }

  function sendEQ(bands) {
    currentEqBands = bands;
    updateUI();
    if (activeTabId) {
      chrome.tabs.sendMessage(activeTabId, { type: "SET_EQ", eqBands: currentEqBands });
    }
  }

  function setProfile(profileKey) {
    currentProfile = profileKey;
    if (activeTabId) {
      chrome.tabs.sendMessage(activeTabId, { type: "SET_PROFILE", profile: profileKey }, () => {
        fetchState();
      });
    }
  }

  // Load Multi-Tab Mixer List
  function loadMixerTabs() {
    mixerList.innerHTML = '<div class="empty-mixer">Scanning open browser tabs...</div>';
    chrome.runtime.sendMessage({ type: "GET_ALL_TABS" }, (res) => {
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

        const focusBtn = document.createElement('button');
        focusBtn.className = 'eq-preset-btn';
        focusBtn.textContent = tab.active ? 'Active' : 'Switch';
        focusBtn.style.padding = '3px 8px';
        focusBtn.addEventListener('click', () => {
          chrome.tabs.update(tab.id, { active: true });
        });

        item.appendChild(focusBtn);
        mixerList.appendChild(item);
      });
    });
  }

  // Listeners: Volume Tab
  volumeSlider.addEventListener('input', (e) => setVolume(parseInt(e.target.value, 10)));
  presetBtns.forEach(btn => btn.addEventListener('click', () => setVolume(parseInt(btn.dataset.preset, 10))));
  profileBtns.forEach(btn => btn.addEventListener('click', () => setProfile(btn.dataset.profile)));
  muteBtn.addEventListener('click', () => sendMuteState(!isMuted));
  resetBtn.addEventListener('click', () => setVolume(100));

  antiDistortionToggle.addEventListener('change', (e) => {
    isAntiDistortion = e.target.checked;
    if (activeTabId) chrome.tabs.sendMessage(activeTabId, { type: "SET_ANTI_DISTORTION", enabled: isAntiDistortion });
  });

  nightModeToggle.addEventListener('change', (e) => {
    isNightMode = e.target.checked;
    if (activeTabId) chrome.tabs.sendMessage(activeTabId, { type: "SET_NIGHT_MODE", enabled: isNightMode });
  });

  rememberDomainToggle.addEventListener('change', (e) => {
    if (activeTabId) {
      chrome.tabs.sendMessage(activeTabId, {
        type: "SET_VOLUME",
        volume: currentVolume,
        saveDomain: e.target.checked
      });
    }
  });

  // Listeners: Quick Boost & EQ
  bassSlider.addEventListener('input', (e) => {
    currentBass = parseInt(e.target.value, 10);
    bassVal.textContent = `+${currentBass} dB`;
    if (activeTabId) chrome.tabs.sendMessage(activeTabId, { type: "SET_BASS_BOOST", val: currentBass });
  });

  trebleSlider.addEventListener('input', (e) => {
    currentTreble = parseInt(e.target.value, 10);
    trebleVal.textContent = `+${currentTreble} dB`;
    if (activeTabId) chrome.tabs.sendMessage(activeTabId, { type: "SET_TREBLE_BOOST", val: currentTreble });
  });

  eqSliders.forEach((slider) => {
    slider.addEventListener('input', () => {
      const bands = Array.from(eqSliders).map(s => parseInt(s.value, 10));
      sendEQ(bands);
    });
  });

  eqPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      eqPresetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const presetKey = btn.dataset.eq;
      if (EQ_PRESETS[presetKey]) {
        sendEQ([...EQ_PRESETS[presetKey]]);
      }
    });
  });

  resetEqBtn.addEventListener('click', () => {
    sendEQ([0, 0, 0, 0, 0]);
  });

  refreshTabsBtn.addEventListener('click', loadMixerTabs);

  // Listeners: Tools
  panSlider.addEventListener('input', (e) => {
    currentPan = parseFloat(e.target.value);
    updateUI();
    if (activeTabId) chrome.tabs.sendMessage(activeTabId, { type: "SET_PAN", pan: currentPan });
  });

  fetchState();
});
