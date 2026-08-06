// content.js - Audio Engine for volUP Extension

(function () {
  if (window.volUPInjected) return;
  window.volUPInjected = true;

  let audioState = {
    volume: 100, // 0 to 600
    antiDistortion: true,
    isMuted: false
  };

  const processedElements = new WeakMap();
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Create a soft limiter curve for WaveShaperNode to prevent hard clipping above 0dB
  function createSoftLimiterCurve(ctx) {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      let x = (i * 2) / n_samples - 1;
      // Soft saturation curve: tanh-like soft clipping
      curve[i] = Math.tanh(x * 1.5) / Math.tanh(1.5);
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

      // Handle cross-origin issues smoothly
      if (mediaElement.src && !mediaElement.src.startsWith('blob:') && !mediaElement.src.startsWith('data:')) {
        try {
          const url = new URL(mediaElement.src, window.location.href);
          if (url.origin !== window.location.origin && !mediaElement.crossOrigin) {
            mediaElement.crossOrigin = 'anonymous';
          }
        } catch (e) {}
      }

      const source = ctx.createMediaElementSource(mediaElement);
      const gainNode = ctx.createGain();
      const compressorNode = ctx.createDynamicsCompressor();
      const limiterNode = ctx.createWaveShaper();

      // Configure DynamicsCompressor for punchy, distortion-free loudness
      compressorNode.threshold.setValueAtTime(-12, ctx.currentTime);
      compressorNode.knee.setValueAtTime(30, ctx.currentTime);
      compressorNode.ratio.setValueAtTime(12, ctx.currentTime);
      compressorNode.attack.setValueAtTime(0.003, ctx.currentTime);
      compressorNode.release.setValueAtTime(0.25, ctx.currentTime);

      // Configure Soft Limiter curve
      limiterNode.curve = createSoftLimiterCurve(ctx);
      limiterNode.oversample = '4x';

      const chain = {
        source,
        compressorNode,
        gainNode,
        limiterNode,
        element: mediaElement
      };

      reconnectChain(chain);
      processedElements.set(mediaElement, chain);

      // Ensure audio context resumes on user interaction
      const resumeAudio = () => {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
      };
      mediaElement.addEventListener('play', resumeAudio, { passive: true });

    } catch (err) {
      console.warn("volUP: Failed to attach AudioContext to element", err);
    }
  }

  function reconnectChain(chain) {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      chain.source.disconnect();
      chain.compressorNode.disconnect();
      chain.gainNode.disconnect();
      chain.limiterNode.disconnect();

      let currentGainValue = audioState.isMuted ? 0 : (audioState.volume / 100);
      chain.gainNode.gain.setValueAtTime(currentGainValue, ctx.currentTime);

      if (audioState.antiDistortion && audioState.volume > 100) {
        // Anti-distortion route: Source -> Compressor -> Gain -> Limiter -> Destination
        chain.source.connect(chain.compressorNode);
        chain.compressorNode.connect(chain.gainNode);
        chain.gainNode.connect(chain.limiterNode);
        chain.limiterNode.connect(ctx.destination);
      } else {
        // Direct route: Source -> Gain -> Destination
        chain.source.connect(chain.gainNode);
        chain.gainNode.connect(ctx.destination);
      }
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

  // Load saved site volume settings or apply current state
  function init() {
    const domain = window.location.hostname;
    chrome.storage.local.get(['globalVolume', 'antiDistortion', 'isMuted', 'siteVolumes'], (res) => {
      if (res.globalVolume !== undefined) audioState.volume = res.globalVolume;
      if (res.antiDistortion !== undefined) audioState.antiDistortion = res.antiDistortion;
      if (res.isMuted !== undefined) audioState.isMuted = res.isMuted;

      // Check for site-specific volume override
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

  // Observe dynamically added video/audio elements (YouTube SPA, Twitch, etc.)
  const observer = new MutationObserver((mutations) => {
    let hasMedia = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) { // Element node
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

  // Listen for control commands from Popup UI
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_STATUS") {
      sendResponse({
        volume: audioState.volume,
        antiDistortion: audioState.antiDistortion,
        isMuted: audioState.isMuted,
        domain: window.location.hostname
      });
      return true;
    }

    if (message.type === "SET_VOLUME") {
      audioState.volume = Math.max(0, Math.min(600, message.volume));
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
  });

  init();
})();
