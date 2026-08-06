// popup.js - UI Controller for volUP

document.addEventListener('DOMContentLoaded', async () => {
  const volumeSlider = document.getElementById('volumeSlider');
  const sliderFill = document.getElementById('sliderFill');
  const volumeValue = document.getElementById('volumeValue');
  const statusText = document.getElementById('statusText');
  const statusDot = document.querySelector('.status-dot');
  const domainDisplay = document.getElementById('domainDisplay');
  const visualizer = document.getElementById('visualizer');
  const antiDistortionToggle = document.getElementById('antiDistortionToggle');
  const rememberDomainToggle = document.getElementById('rememberDomainToggle');
  const muteBtn = document.getElementById('muteBtn');
  const muteBtnText = document.getElementById('muteBtnText');
  const resetBtn = document.getElementById('resetBtn');
  const presetBtns = document.querySelectorAll('.preset-btn');

  let activeTabId = null;
  let currentVolume = 100;
  let isMuted = false;
  let isAntiDistortion = true;

  // Query current active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    activeTabId = tab.id;
    try {
      const url = new URL(tab.url);
      domainDisplay.textContent = url.hostname || 'Yerel Sayfa';
    } catch (e) {
      domainDisplay.textContent = 'Web Sayfası';
    }
  }

  // Load state from content script or local storage
  function fetchState() {
    if (!activeTabId) return;
    chrome.tabs.sendMessage(activeTabId, { type: "GET_STATUS" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        // Content script might not be injected yet or non-http page
        domainDisplay.textContent = "Kapsam Dışı";
        return;
      }

      currentVolume = response.volume || 100;
      isAntiDistortion = response.antiDistortion !== undefined ? response.antiDistortion : true;
      isMuted = !!response.isMuted;

      // Check if domain volume saved
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
    volumeSlider.value = currentVolume;
    volumeValue.textContent = currentVolume;

    // Calculate slider fill percentage (0 to 600)
    const fillPercent = (currentVolume / 600) * 100;
    sliderFill.style.width = `${fillPercent}%`;

    // Visualizer animation state
    if (isMuted || currentVolume === 0) {
      visualizer.classList.remove('active');
    } else {
      visualizer.classList.add('active');
    }

    // Dynamic color coding & Status messages
    if (isMuted) {
      volumeValue.style.color = '#ef4444';
      statusText.textContent = 'Sessiz (Muted)';
      statusDot.style.backgroundColor = '#ef4444';
      statusDot.style.boxShadow = '0 0 8px #ef4444';
      muteBtn.classList.add('muted');
      muteBtnText.textContent = 'Sesi Aç';
    } else {
      muteBtn.classList.remove('muted');
      muteBtnText.textContent = 'Sesi Kapat';

      if (currentVolume <= 100) {
        volumeValue.style.color = '#ffffff';
        statusText.textContent = 'Normal Ses Seviyesi';
        statusDot.style.backgroundColor = '#10b981';
        statusDot.style.boxShadow = '0 0 8px #10b981';
      } else if (currentVolume <= 300) {
        volumeValue.style.color = '#c084fc';
        statusText.textContent = 'Güçlendirilmiş Ses (HD Boost)';
        statusDot.style.backgroundColor = '#8b5cf6';
        statusDot.style.boxShadow = '0 0 8px #8b5cf6';
      } else {
        volumeValue.style.color = '#f472b6';
        statusText.textContent = 'Maksimum Güç (Super Boost)';
        statusDot.style.backgroundColor = '#ec4899';
        statusDot.style.boxShadow = '0 0 8px #ec4899';
      }
    }

    // Anti-distortion toggle UI
    antiDistortionToggle.checked = isAntiDistortion;

    // Preset active highlight
    presetBtns.forEach(btn => {
      const presetVal = parseInt(btn.dataset.preset, 10);
      if (presetVal === currentVolume && !isMuted) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function setVolume(newVolume) {
    currentVolume = Math.max(0, Math.min(600, newVolume));
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

  // Slider change event
  volumeSlider.addEventListener('input', (e) => {
    setVolume(parseInt(e.target.value, 10));
  });

  // Preset buttons click events
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.preset, 10);
      setVolume(val);
    });
  });

  // Mute button
  muteBtn.addEventListener('click', () => {
    sendMuteState(!isMuted);
  });

  // Reset button
  resetBtn.addEventListener('click', () => {
    setVolume(100);
  });

  // Anti-Distortion toggle
  antiDistortionToggle.addEventListener('change', (e) => {
    isAntiDistortion = e.target.checked;
    if (activeTabId) {
      chrome.tabs.sendMessage(activeTabId, {
        type: "SET_ANTI_DISTORTION",
        enabled: isAntiDistortion
      });
    }
  });

  // Remember domain toggle
  rememberDomainToggle.addEventListener('change', (e) => {
    if (activeTabId) {
      chrome.tabs.sendMessage(activeTabId, {
        type: "SET_VOLUME",
        volume: currentVolume,
        saveDomain: e.target.checked
      });
    }
  });

  fetchState();
});
