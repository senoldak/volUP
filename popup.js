// popup.js - UI Controller for volUP (v1.2.0)

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
    });
  });

  // Controls & Elements
  const volumeSlider = document.getElementById('volumeSlider');
  const sliderFill = document.getElementById('sliderFill');
  const volumeValue = document.getElementById('volumeValue');
  const statusText = document.getElementById('statusText');
  const statusDot = document.querySelector('.status-dot');
  const domainDisplay = document.getElementById('domainDisplay');
  const visualizer = document.getElementById('visualizer');
  const antiDistortionToggle = document.getElementById('antiDistortionToggle');
  const nightModeToggle = document.getElementById('nightModeToggle');
  const rememberDomainToggle = document.getElementById('rememberDomainToggle');
  const muteBtn = document.getElementById('muteBtn');
  const muteBtnText = document.getElementById('muteBtnText');
  const resetBtn = document.getElementById('resetBtn');
  const presetBtns = document.querySelectorAll('.preset-btn');

  // EQ Elements
  const resetEqBtn = document.getElementById('resetEqBtn');
  const eqPresetBtns = document.querySelectorAll('.eq-preset-btn');
  const eqSliders = document.querySelectorAll('.eq-slider');

  // Tools Elements
  const panSlider = document.getElementById('panSlider');
  const panValue = document.getElementById('panValue');
  const speedSlider = document.getElementById('speedSlider');
  const speedValue = document.getElementById('speedValue');
  const speedBtns = document.querySelectorAll('.speed-btn');

  let activeTabId = null;
  let currentVolume = 100;
  let isMuted = false;
  let isAntiDistortion = true;
  let isNightMode = false;
  let currentPan = 0;
  let currentSpeed = 1.0;
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
      currentSpeed = response.playbackSpeed !== undefined ? response.playbackSpeed : 1.0;
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

    // EQ Tab
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

    speedSlider.value = currentSpeed;
    speedValue.textContent = `${parseFloat(currentSpeed).toFixed(1)}x`;

    speedBtns.forEach(btn => {
      const sVal = parseFloat(btn.dataset.speed);
      if (sVal === parseFloat(currentSpeed)) btn.classList.add('active');
      else btn.classList.remove('active');
    });
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

  // Listeners: Volume Tab
  volumeSlider.addEventListener('input', (e) => setVolume(parseInt(e.target.value, 10)));
  presetBtns.forEach(btn => btn.addEventListener('click', () => setVolume(parseInt(btn.dataset.preset, 10))));
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

  // Listeners: EQ Tab
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

  // Listeners: Tools Tab
  panSlider.addEventListener('input', (e) => {
    currentPan = parseFloat(e.target.value);
    updateUI();
    if (activeTabId) chrome.tabs.sendMessage(activeTabId, { type: "SET_PAN", pan: currentPan });
  });

  speedSlider.addEventListener('input', (e) => {
    currentSpeed = parseFloat(e.target.value);
    updateUI();
    if (activeTabId) chrome.tabs.sendMessage(activeTabId, { type: "SET_SPEED", speed: currentSpeed });
  });

  speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentSpeed = parseFloat(btn.dataset.speed);
      updateUI();
      if (activeTabId) chrome.tabs.sendMessage(activeTabId, { type: "SET_SPEED", speed: currentSpeed });
    });
  });

  fetchState();
});
