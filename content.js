// content.js - Pure Focused Audio Engine for volUP (v1.2.1)

(function () {
  if (window.volUPInjected) return;
  window.volUPInjected = true;

  let audioState = {
    volume: 100, // 0 to 1000
    antiDistortion: true,
    isMuted: false,
    nightMode: false,
    panBalance: 0, // -1.0 (Left) to +1.0 (Right)
    eqBands: [0, 0, 0, 0, 0]
  };

  const processedElements = new WeakMap();
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx({ latencyHint: 'interactive' });
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
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
      subsonicFilter.Q.setValueAtTime(0.5, ctx.currentTime);

      const eqFrequencies = [60, 250, 1000, 4000, 12000];
      const eqTypes = ['lowshelf', 'peaking', 'peaking', 'peaking', 'highshelf'];
      const eqNodes = eqFrequencies.map((freq, idx) => {
        const filter = ctx.createBiquadFilter();
        filter.type = eqTypes[idx];
        filter.frequency.setValueAtTime(freq, ctx.currentTime);
        filter.Q.setValueAtTime(1.0, ctx.currentTime);
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

      const masterGainNode = ctx.createGain();

      const chain = {
        source,
        subsonicFilter,
        eqNodes,
        pannerNode,
        gainNode,
        compressorNode,
        limiterNode,
        masterGainNode,
        element: mediaElement
      };

      reconnectChain(chain);
      processedElements.set(mediaElement, chain);

      const resumeAudio = () => {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
      };
      mediaElement.addEventListener('play', resumeAudio, { passive: true });

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
      chain.eqNodes.forEach(n => n.disconnect());
      if (chain.pannerNode) chain.pannerNode.disconnect();
      chain.gainNode.disconnect();
      chain.compressorNode.disconnect();
      chain.limiterNode.disconnect();
      chain.masterGainNode.disconnect();

      if (audioState.eqBands && audioState.eqBands.length === 5) {
        chain.eqNodes.forEach((node, idx) => {
          const val = audioState.eqBands[idx] || 0;
          node.gain.setValueAtTime(val, ctx.currentTime);
        });
      }

      if (chain.pannerNode) {
        const panVal = Math.max(-1, Math.min(1, audioState.panBalance || 0));
        chain.pannerNode.pan.setValueAtTime(panVal, ctx.currentTime);
      }

      const isMuted = audioState.isMuted;
      const targetVolume = isMuted ? 0 : audioState.volume;
      const boostFactor = targetVolume / 100;

      const hasEQ = audioState.eqBands && audioState.eqBands.some(v => v !== 0);
      const hasNightMode = audioState.nightMode;
      const hasPan = audioState.panBalance !== 0;

      // RULE 1: Bit-Exact Direct Passthrough if <= 100% volume and no active audio filters
      if (targetVolume <= 100 && !audioState.antiDistortion && !hasEQ && !hasNightMode && !hasPan) {
        chain.gainNode.gain.setValueAtTime(boostFactor, ctx.currentTime);
        chain.source.connect(chain.gainNode);
        chain.gainNode.connect(ctx.destination);
        return;
      }

      let lastNode = chain.source;

      lastNode.connect(chain.subsonicFilter);
      lastNode = chain.subsonicFilter;

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
    const domain = window.location.hostname;
    chrome.storage.local.get([
      'globalVolume', 'antiDistortion', 'isMuted', 'siteVolumes',
      'nightMode', 'panBalance', 'eqBands'
    ], (res) => {
      if (res.globalVolume !== undefined) audioState.volume = res.globalVolume;
      if (res.antiDistortion !== undefined) audioState.antiDistortion = res.antiDistortion;
      if (res.isMuted !== undefined) audioState.isMuted = res.isMuted;
      if (res.nightMode !== undefined) audioState.nightMode = res.nightMode;
      if (res.panBalance !== undefined) audioState.panBalance = res.panBalance;
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
    if (message.type === "GET_STATUS") {
      sendResponse({
        volume: audioState.volume,
        antiDistortion: audioState.antiDistortion,
        isMuted: audioState.isMuted,
        nightMode: audioState.nightMode,
        panBalance: audioState.panBalance,
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
      sendResponse({ status: "OK", volume: audioState.volume });
      return true;
    }

    if (message.type === "SET_EQ") {
      if (message.eqBands && message.eqBands.length === 5) {
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
      sendResponse({ status: "OK", volume: audioState.volume, isMuted: audioState.isMuted });
      return true;
    }
  });

  init();
})();
