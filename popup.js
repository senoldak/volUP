// popup.js - UI Controller for volUP (Supports 0% to 1000%)

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

    // Slider fill percentage (0 to 1000)
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

  volumeSlider.addEventListener('input', (e) => {
    setVolume(parseInt(e.target.value, 10));
  });

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.preset, 10);
      setVolume(val);
    });
  });

  muteBtn.addEventListener('click', () => {
    sendMuteState(!isMuted);
  });

  resetBtn.addEventListener('click', () => {
    setVolume(100);
  });

  antiDistortionToggle.addEventListener('change', (e) => {
    isAntiDistortion = e.target.checked;
    if (activeTabId) {
      chrome.tabs.sendMessage(activeTabId, {
        type: "SET_ANTI_DISTORTION",
        enabled: isAntiDistortion
      });
    }
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

  fetchState();
});
