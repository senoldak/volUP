// content.js - Pure Focused Pro Audio Engine for volUP (v1.5.0 Master Edition)

(function () {
  if (window.volUPInjected) return;
  window.volUPInjected = true;

  let audioState = {
    volume: 100, // 0 to 1000
    antiDistortion: true,
    isMuted: false,
    nightMode: false,
    isMono: false,
    vocalClarity: false,
    maxLock: 0, // 0 (Unlocked), 400 (400% Cap)
    panBalance: 0, // -1.0 (Left) to +1.0 (Right)
    bassBoost: 0, // 0 to +12 dB
    trebleBoost: 0, // 0 to +12 dB
    audioProfile: 'flat', // 'flat', 'podcast', 'asmr', 'cinema', 'music'
    eqMode: '5band',
    vizTheme: 'waves',
    eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  };

  const PROFILES = {
    flat: { eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], bass: 0, treble: 0 },
    podcast: { eq: [-4, -2, 0, 3, 5, 6, 4, 2, 0, -2], bass: 0, treble: 2 },
    asmr: { eq: [2, 3, 4, 5, 6, 7, 8, 8, 7, 5], bass: 3, treble: 6 },
    cinema: { eq: [6, 5, 4, 2, 0, 1, 3, 4, 5, 3], bass: 6, treble: 3 },
    music: { eq: [5, 4, 2, 0, -1, -1, 2, 4, 5, 4], bass: 5, treble: 4 }
  };

  const processedElements = new WeakMap();
  let audioCtx = null;
  let osdTimeout = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx({ latencyHint: 'interactive' });
      }
    }
    return audioCtx;
  }

  function ensureAudioContextResumed() {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }

  function attachGestureListeners() {
    const handleGesture = () => {
      ensureAudioContextResumed();
    };

    ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(evt => {
      window.addEventListener(evt, handleGesture, { passive: true, once: false });
    });
  }

  // Floating On-Screen Display (OSD) Toast Badge
  function showOSD(text, icon = "🔊") {
    let container = document.getElementById('volup-osd-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'volup-osd-container';
      container.style.cssText = `
        position: fixed;
        top: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px);
        background: rgba(11, 15, 25, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(139, 92, 246, 0.4);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(139, 92, 246, 0.3);
        color: #ffffff;
        padding: 8px 20px;
        border-radius: 30px;
        font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: -0.2px;
        z-index: 999999;
        pointer-events: none;
        opacity: 0;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      document.body.appendChild(container);
    }

    container.innerHTML = `<span style="font-size: 16px;">${icon}</span><span>${text}</span>`;
    container.style.opacity = '1';
    container.style.transform = 'translateX(-50%) translateY(0)';

    if (osdTimeout) clearTimeout(osdTimeout);
    osdTimeout = setTimeout(() => {
      if (container) {
        container.style.opacity = '0';
        container.style.transform = 'translateX(-50%) translateY(-20px)';
      }
    }, 1500);
  }

  function createTransparentLimiterCurve() {
    const n_samples = 65536;
    const curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; ++i) {
      let x = (i * 2) / n_samples - 1;
      if (Math.abs(x) < 0.85) {
        curve[i] = x;
      } else {
        const sign = x < 0 ? -1 : 1;
        const absX = Math.abs(x);
        curve[i] = sign * (0.85 + (1 - 0.85) * Math.tanh((absX - 0.85) / (1 - 0.85)));
      }
    }
    return curve;
  }

  function applyAudioChain(mediaElement) {
    if (processedElements.has(mediaElement)) {
      const chain = processedElements.get(mediaElement);
      updateChain(chain);
      return;
    }

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (mediaElement.src && !mediaElement.src.startsWith('blob:') && !mediaElement.src.startsWith('data:')) {
        try {
          const url = new URL(mediaElement.src, window.location.href);
          if (url.origin !== window.location.origin && !mediaElement.crossOrigin) {
            mediaElement.crossOrigin = 'anonymous';
          }
        } catch (e) {}
      }

      const source = ctx.createMediaElementSource(mediaElement);
      
      const subsonicFilter = ctx.createBiquadFilter();
      subsonicFilter.type = 'highpass';
      subsonicFilter.frequency.setValueAtTime(20, ctx.currentTime);

      const vocalClarityNode = ctx.createBiquadFilter();
      vocalClarityNode.type = 'peaking';
      vocalClarityNode.frequency.setValueAtTime(2500, ctx.currentTime);
      vocalClarityNode.Q.setValueAtTime(1.2, ctx.currentTime);
      vocalClarityNode.gain.setValueAtTime(0, ctx.currentTime);

      const bassBoostNode = ctx.createBiquadFilter();
      bassBoostNode.type = 'lowshelf';
      bassBoostNode.frequency.setValueAtTime(80, ctx.currentTime);
      bassBoostNode.gain.setValueAtTime(0, ctx.currentTime);

      const trebleBoostNode = ctx.createBiquadFilter();
      trebleBoostNode.type = 'highshelf';
      trebleBoostNode.frequency.setValueAtTime(8000, ctx.currentTime);
      trebleBoostNode.gain.setValueAtTime(0, ctx.currentTime);

      const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      const eqTypes = ['lowshelf', 'peaking', 'peaking', 'peaking', 'peaking', 'peaking', 'peaking', 'peaking', 'peaking', 'highshelf'];
      const eqNodes = eqFrequencies.map((freq, idx) => {
        const filter = ctx.createBiquadFilter();
        filter.type = eqTypes[idx];
        filter.frequency.setValueAtTime(freq, ctx.currentTime);
        filter.Q.setValueAtTime(1.4, ctx.currentTime);
        filter.gain.setValueAtTime(0, ctx.currentTime);
        return filter;
      });

      let pannerNode = null;
      if (ctx.createStereoPanner) {
        pannerNode = ctx.createStereoPanner();
        pannerNode.pan.setValueAtTime(0, ctx.currentTime);
      }

      const gainNode = ctx.createGain();
      const compressorNode = ctx.createDynamicsCompressor();
      const limiterNode = ctx.createWaveShaper();
      limiterNode.curve = createTransparentLimiterCurve();
      limiterNode.oversample = '2x';

      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 256;

      const masterGainNode = ctx.createGain();

      const chain = {
        source,
        subsonicFilter,
        vocalClarityNode,
        bassBoostNode,
        trebleBoostNode,
        eqNodes,
        pannerNode,
        gainNode,
        compressorNode,
        limiterNode,
        analyserNode,
        masterGainNode,
        element: mediaElement
      };

      reconnectChain(chain);
      processedElements.set(mediaElement, chain);

      const resumeAudio = () => {
        ensureAudioContextResumed();
      };
      mediaElement.addEventListener('play', resumeAudio, { passive: true });
      mediaElement.addEventListener('playing', resumeAudio, { passive: true });

    } catch (err) {
      console.warn("volUP: Failed to attach AudioContext", err);
    }
  }

  function reconnectChain(chain) {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      chain.source.disconnect();
      chain.subsonicFilter.disconnect();
      chain.vocalClarityNode.disconnect();
      chain.bassBoostNode.disconnect();
      chain.trebleBoostNode.disconnect();
      chain.eqNodes.forEach(n => n.disconnect());
      if (chain.pannerNode) chain.pannerNode.disconnect();
      chain.gainNode.disconnect();
      chain.compressorNode.disconnect();
      chain.limiterNode.disconnect();
      chain.analyserNode.disconnect();
      chain.masterGainNode.disconnect();

      // Apply Vocal Clarity Gain
      chain.vocalClarityNode.gain.setValueAtTime(audioState.vocalClarity ? 5 : 0, ctx.currentTime);
      chain.bassBoostNode.gain.setValueAtTime(audioState.bassBoost || 0, ctx.currentTime);
      chain.trebleBoostNode.gain.setValueAtTime(audioState.trebleBoost || 0, ctx.currentTime);

      if (audioState.eqBands && audioState.eqBands.length === 10) {
        chain.eqNodes.forEach((node, idx) => {
          const val = audioState.eqBands[idx] || 0;
          node.gain.setValueAtTime(val, ctx.currentTime);
        });
      }

      if (chain.pannerNode) {
        const panVal = Math.max(-1, Math.min(1, audioState.panBalance || 0));
        chain.pannerNode.pan.setValueAtTime(panVal, ctx.currentTime);
      }

      // Apply Stereo to Mono Conversion
      if (audioState.isMono) {
        chain.gainNode.channelCount = 1;
        chain.gainNode.channelCountMode = 'clamped-max';
      } else {
        chain.gainNode.channelCount = 2;
        chain.gainNode.channelCountMode = 'max';
      }

      // Enforce Ear Protection Safety Lock Cap if active
      let effectiveVolume = audioState.volume;
      if (audioState.maxLock > 0 && effectiveVolume > audioState.maxLock) {
        effectiveVolume = audioState.maxLock;
      }

      const isMuted = audioState.isMuted;
      const targetVolume = isMuted ? 0 : effectiveVolume;
      const boostFactor = targetVolume / 100;

      const hasEQ = audioState.eqBands && audioState.eqBands.some(v => v !== 0);
      const hasBassTreble = audioState.bassBoost !== 0 || audioState.trebleBoost !== 0;
      const hasNightMode = audioState.nightMode;
      const hasPan = audioState.panBalance !== 0;
      const hasVocal = audioState.vocalClarity;
      const hasMono = audioState.isMono;

      if (targetVolume <= 100 && !audioState.antiDistortion && !hasEQ && !hasBassTreble && !hasNightMode && !hasPan && !hasVocal && !hasMono) {
        chain.gainNode.gain.setValueAtTime(boostFactor, ctx.currentTime);
        chain.source.connect(chain.gainNode);
        chain.gainNode.connect(ctx.destination);
        return;
      }

      let lastNode = chain.source;

      lastNode.connect(chain.subsonicFilter);
      lastNode = chain.subsonicFilter;

      lastNode.connect(chain.vocalClarityNode);
      lastNode = chain.vocalClarityNode;

      lastNode.connect(chain.bassBoostNode);
      lastNode = chain.bassBoostNode;

      lastNode.connect(chain.trebleBoostNode);
      lastNode = chain.trebleBoostNode;

      chain.eqNodes.forEach(eqNode => {
        lastNode.connect(eqNode);
        lastNode = eqNode;
      });

      if (chain.pannerNode) {
        lastNode.connect(chain.pannerNode);
        lastNode = chain.pannerNode;
      }

      chain.gainNode.gain.setValueAtTime(boostFactor, ctx.currentTime);
      lastNode.connect(chain.gainNode);
      lastNode = chain.gainNode;

      if (hasNightMode) {
        chain.compressorNode.threshold.setValueAtTime(-20, ctx.currentTime);
        chain.compressorNode.knee.setValueAtTime(15, ctx.currentTime);
        chain.compressorNode.ratio.setValueAtTime(12, ctx.currentTime);
        chain.compressorNode.attack.setValueAtTime(0.003, ctx.currentTime);
        chain.compressorNode.release.setValueAtTime(0.2, ctx.currentTime);
      } else {
        const t = Math.min(1.0, Math.max(0, targetVolume - 100) / 900);
        const threshold = -6 - (t * 12);
        const ratio = 3 + (t * 7);

        chain.compressorNode.threshold.setValueAtTime(threshold, ctx.currentTime);
        chain.compressorNode.knee.setValueAtTime(24, ctx.currentTime);
        chain.compressorNode.ratio.setValueAtTime(ratio, ctx.currentTime);
        chain.compressorNode.attack.setValueAtTime(0.005, ctx.currentTime);
        chain.compressorNode.release.setValueAtTime(0.15, ctx.currentTime);
      }

      lastNode.connect(chain.compressorNode);
      lastNode = chain.compressorNode;

      lastNode.connect(chain.limiterNode);
      lastNode = chain.limiterNode;

      lastNode.connect(chain.analyserNode);

      const t = Math.min(1.0, Math.max(0, targetVolume - 100) / 900);
      const masterScale = 1.0 / (1.0 + t * 0.35);
      chain.masterGainNode.gain.setValueAtTime(masterScale, ctx.currentTime);

      lastNode.connect(chain.masterGainNode);
      chain.masterGainNode.connect(ctx.destination);

    } catch (e) {
      console.warn("volUP: Error reconnecting audio chain", e);
    }
  }

  function updateChain(chain) {
    reconnectChain(chain);
  }

  function scanAndApply() {
    const mediaElements = document.querySelectorAll('video, audio');
    mediaElements.forEach(el => {
      applyAudioChain(el);
    });
  }

  function init() {
    attachGestureListeners();
    const domain = window.location.hostname;
    chrome.storage.local.get([
      'globalVolume', 'antiDistortion', 'isMuted', 'siteVolumes',
      'nightMode', 'isMono', 'vocalClarity', 'maxLock',
      'panBalance', 'bassBoost', 'trebleBoost', 'audioProfile', 'eqBands', 'eqMode', 'vizTheme'
    ], (res) => {
      if (res.globalVolume !== undefined) audioState.volume = res.globalVolume;
      if (res.antiDistortion !== undefined) audioState.antiDistortion = res.antiDistortion;
      if (res.isMuted !== undefined) audioState.isMuted = res.isMuted;
      if (res.nightMode !== undefined) audioState.nightMode = res.nightMode;
      if (res.isMono !== undefined) audioState.isMono = res.isMono;
      if (res.vocalClarity !== undefined) audioState.vocalClarity = res.vocalClarity;
      if (res.maxLock !== undefined) audioState.maxLock = res.maxLock;
      if (res.panBalance !== undefined) audioState.panBalance = res.panBalance;
      if (res.bassBoost !== undefined) audioState.bassBoost = res.bassBoost;
      if (res.trebleBoost !== undefined) audioState.trebleBoost = res.trebleBoost;
      if (res.audioProfile !== undefined) audioState.audioProfile = res.audioProfile;
      if (res.eqMode !== undefined) audioState.eqMode = res.eqMode;
      if (res.vizTheme !== undefined) audioState.vizTheme = res.vizTheme;
      if (res.eqBands !== undefined) audioState.eqBands = res.eqBands;

      if (res.siteVolumes && res.siteVolumes[domain] !== undefined) {
        audioState.volume = res.siteVolumes[domain];
      }

      scanAndApply();
      notifyBadge();
    });
  }

  function notifyBadge() {
    try {
      chrome.runtime.sendMessage({
        type: "UPDATE_BADGE",
        volume: audioState.volume,
        isMuted: audioState.isMuted
      }, () => {
        if (chrome.runtime.lastError) {
          // Suppress connection errors when extension reloaded
          void chrome.runtime.lastError;
        }
      });
    } catch (e) {}
  }

  const observer = new MutationObserver((mutations) => {
    let hasMedia = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO' || node.querySelector('video, audio')) {
            hasMedia = true;
            break;
          }
        }
      }
      if (hasMedia) break;
    }
    if (hasMedia) {
      scanAndApply();
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    ensureAudioContextResumed();

    if (message.type === "GET_STATUS") {
      sendResponse({
        volume: audioState.volume,
        antiDistortion: audioState.antiDistortion,
        isMuted: audioState.isMuted,
        nightMode: audioState.nightMode,
        isMono: audioState.isMono,
        vocalClarity: audioState.vocalClarity,
        maxLock: audioState.maxLock,
        panBalance: audioState.panBalance,
        bassBoost: audioState.bassBoost,
        trebleBoost: audioState.trebleBoost,
        audioProfile: audioState.audioProfile,
        eqMode: audioState.eqMode,
        vizTheme: audioState.vizTheme,
        eqBands: audioState.eqBands,
        domain: window.location.hostname
      });
      return true;
    }

    if (message.type === "SET_VOLUME") {
      audioState.volume = Math.max(0, Math.min(1000, message.volume));
      if (message.saveDomain) {
        const domain = window.location.hostname;
        chrome.storage.local.get(['siteVolumes'], (res) => {
          const siteVolumes = res.siteVolumes || {};
          siteVolumes[domain] = audioState.volume;
          chrome.storage.local.set({ siteVolumes });
        });
      }
      scanAndApply();
      notifyBadge();
      if (message.fromShortcut) {
        showOSD(`${audioState.volume}%`, audioState.isMuted ? "🔇" : "🔊");
      }
      sendResponse({ status: "OK", volume: audioState.volume });
      return true;
    }

    if (message.type === "SET_MONO") {
      audioState.isMono = !!message.enabled;
      chrome.storage.local.set({ isMono: audioState.isMono });
      scanAndApply();
      showOSD(audioState.isMono ? "Mono Audio Enabled" : "Stereo Audio Enabled", "🎧");
      sendResponse({ status: "OK", isMono: audioState.isMono });
      return true;
    }

    if (message.type === "SET_VOCAL_CLARITY") {
      audioState.vocalClarity = !!message.enabled;
      chrome.storage.local.set({ vocalClarity: audioState.vocalClarity });
      scanAndApply();
      showOSD(audioState.vocalClarity ? "Vocal Booster Active" : "Vocal Booster Off", "🎙️");
      sendResponse({ status: "OK", vocalClarity: audioState.vocalClarity });
      return true;
    }

    if (message.type === "SET_MAX_LOCK") {
      audioState.maxLock = message.val || 0;
      chrome.storage.local.set({ maxLock: audioState.maxLock });
      scanAndApply();
      showOSD(audioState.maxLock > 0 ? `Ear Safety Cap (${audioState.maxLock}%)` : "Ear Safety Cap Off", "🛡️");
      sendResponse({ status: "OK", maxLock: audioState.maxLock });
      return true;
    }

    if (message.type === "SET_BASS_BOOST") {
      audioState.bassBoost = Math.max(0, Math.min(12, message.val));
      chrome.storage.local.set({ bassBoost: audioState.bassBoost });
      scanAndApply();
      sendResponse({ status: "OK", bassBoost: audioState.bassBoost });
      return true;
    }

    if (message.type === "SET_TREBLE_BOOST") {
      audioState.trebleBoost = Math.max(0, Math.min(12, message.val));
      chrome.storage.local.set({ trebleBoost: audioState.trebleBoost });
      scanAndApply();
      sendResponse({ status: "OK", trebleBoost: audioState.trebleBoost });
      return true;
    }

    if (message.type === "SET_PROFILE") {
      const p = PROFILES[message.profile];
      if (p) {
        audioState.audioProfile = message.profile;
        audioState.eqBands = [...p.eq];
        audioState.bassBoost = p.bass;
        audioState.trebleBoost = p.treble;
        chrome.storage.local.set({
          audioProfile: audioState.audioProfile,
          eqBands: audioState.eqBands,
          bassBoost: audioState.bassBoost,
          trebleBoost: audioState.trebleBoost
        });
        scanAndApply();
      }
      sendResponse({ status: "OK", profile: audioState.audioProfile });
      return true;
    }

    if (message.type === "SET_EQ_MODE") {
      audioState.eqMode = message.mode;
      chrome.storage.local.set({ eqMode: audioState.eqMode });
      scanAndApply();
      sendResponse({ status: "OK", eqMode: audioState.eqMode });
      return true;
    }

    if (message.type === "SET_VIZ_THEME") {
      audioState.vizTheme = message.theme;
      chrome.storage.local.set({ vizTheme: audioState.vizTheme });
      sendResponse({ status: "OK", vizTheme: audioState.vizTheme });
      return true;
    }

    if (message.type === "SET_EQ") {
      if (message.eqBands && message.eqBands.length === 10) {
        audioState.eqBands = message.eqBands;
        chrome.storage.local.set({ eqBands: audioState.eqBands });
        scanAndApply();
      }
      sendResponse({ status: "OK", eqBands: audioState.eqBands });
      return true;
    }

    if (message.type === "SET_NIGHT_MODE") {
      audioState.nightMode = !!message.enabled;
      chrome.storage.local.set({ nightMode: audioState.nightMode });
      scanAndApply();
      sendResponse({ status: "OK", nightMode: audioState.nightMode });
      return true;
    }

    if (message.type === "SET_PAN") {
      audioState.panBalance = Math.max(-1, Math.min(1, message.pan));
      chrome.storage.local.set({ panBalance: audioState.panBalance });
      scanAndApply();
      sendResponse({ status: "OK", panBalance: audioState.panBalance });
      return true;
    }

    if (message.type === "SET_ANTI_DISTORTION") {
      audioState.antiDistortion = !!message.enabled;
      chrome.storage.local.set({ antiDistortion: audioState.antiDistortion });
      scanAndApply();
      sendResponse({ status: "OK", antiDistortion: audioState.antiDistortion });
      return true;
    }

    if (message.type === "TOGGLE_MUTE") {
      audioState.isMuted = message.isMuted !== undefined ? message.isMuted : !audioState.isMuted;
      scanAndApply();
      notifyBadge();
      showOSD(audioState.isMuted ? "Muted" : `${audioState.volume}%`, audioState.isMuted ? "🔇" : "🔊");
      sendResponse({ status: "OK", isMuted: audioState.isMuted });
      return true;
    }

    if (message.type === "SHORTCUT_COMMAND") {
      if (message.command === "increase_volume") {
        audioState.volume = Math.min(1000, audioState.volume + 10);
      } else if (message.command === "decrease_volume") {
        audioState.volume = Math.max(0, audioState.volume - 10);
      } else if (message.command === "toggle_mute") {
        audioState.isMuted = !audioState.isMuted;
      }
      scanAndApply();
      notifyBadge();
      showOSD(audioState.isMuted ? "Muted" : `${audioState.volume}%`, audioState.isMuted ? "🔇" : "🔊");
      sendResponse({ status: "OK", volume: audioState.volume, isMuted: audioState.isMuted });
      return true;
    }
  });

  init();
})();
