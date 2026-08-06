// content.js - Advanced HD Audio Engine for volUP Extension (Zero-Crackling Engine)

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
        audioCtx = new AudioCtx({ latencyHint: 'interactive' });
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Precision Soft Limiter Curve preventing amplitude spikes > 0.95 (-0.45 dBFS safety margin)
  function createZeroCracklingLimiterCurve() {
    const n_samples = 65536;
    const curve = new Float32Array(n_samples);
    const ceiling = 0.95; // Hard ceiling guarantee below digital 1.0 clipping point

    for (let i = 0; i < n_samples; ++i) {
      let x = (i * 2) / n_samples - 1; // -1.0 to +1.0
      // Smooth arctan soft-knee compression curve
      let y = Math.atan(x * 1.8) / Math.atan(1.8);
      curve[i] = y * ceiling;
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

      // Handle cross-origin media safely
      if (mediaElement.src && !mediaElement.src.startsWith('blob:') && !mediaElement.src.startsWith('data:')) {
        try {
          const url = new URL(mediaElement.src, window.location.href);
          if (url.origin !== window.location.origin && !mediaElement.crossOrigin) {
            mediaElement.crossOrigin = 'anonymous';
          }
        } catch (e) {}
      }

      const source = ctx.createMediaElementSource(mediaElement);
      
      // Node 1: Highpass Filter (Sub-bass rumble removal below 35Hz to free up headroom & stop speaker rattle)
      const highpassFilter = ctx.createBiquadFilter();
      highpassFilter.type = 'highpass';
      highpassFilter.frequency.setValueAtTime(35, ctx.currentTime);
      highpassFilter.Q.setValueAtTime(0.7, ctx.currentTime);

      // Node 2: Boost Gain Node
      const boostGainNode = ctx.createGain();

      // Node 3: Brickwall Dynamics Compressor Node
      const brickwallCompressor = ctx.createDynamicsCompressor();
      
      // Node 4: Soft Limiter WaveShaper
      const softLimiterNode = ctx.createWaveShaper();
      softLimiterNode.curve = createZeroCracklingLimiterCurve();
      softLimiterNode.oversample = '4x';

      // Node 5: Output Master Safety Gain Node
      const masterOutputGain = ctx.createGain();

      const chain = {
        source,
        highpassFilter,
        boostGainNode,
        brickwallCompressor,
        softLimiterNode,
        masterOutputGain,
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
      console.warn("volUP: Failed to attach AudioContext to element", err);
    }
  }

  function reconnectChain(chain) {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      chain.source.disconnect();
      chain.highpassFilter.disconnect();
      chain.boostGainNode.disconnect();
      chain.brickwallCompressor.disconnect();
      chain.softLimiterNode.disconnect();
      chain.masterOutputGain.disconnect();

      const isMuted = audioState.isMuted;
      const boostFactor = isMuted ? 0 : (audioState.volume / 100);

      if (audioState.antiDistortion && audioState.volume > 100) {
        // --- ZERO-CRACKLING ANTI-DISTORTION DSP PIPELINE ---
        
        // 1. Boost volume first
        chain.boostGainNode.gain.setValueAtTime(boostFactor, ctx.currentTime);

        // 2. Dynamically adjust compressor parameters based on gain level to prevent saturation
        // As boost increases (e.g. 6.0 at 600%), lower threshold and increase compression ratio
        const boostRatio = audioState.volume / 100;
        const dynamicThreshold = -12 - (boostRatio * 2.5); // Drops to ~ -27 dB at 600%
        const dynamicRatio = Math.min(20, 8 + boostRatio * 2); // Scales ratio up to 20:1 brickwall

        chain.brickwallCompressor.threshold.setValueAtTime(dynamicThreshold, ctx.currentTime);
        chain.brickwallCompressor.knee.setValueAtTime(6, ctx.currentTime);
        chain.brickwallCompressor.ratio.setValueAtTime(dynamicRatio, ctx.currentTime);
        chain.brickwallCompressor.attack.setValueAtTime(0.001, ctx.currentTime); // Instant attack
        chain.brickwallCompressor.release.setValueAtTime(0.12, ctx.currentTime);

        // 3. Master output safety gain scaling to keep peak output clean
        const masterSafety = Math.max(0.7, 1.0 - (boostRatio - 1) * 0.05); // Smooth attenuation at 600%
        chain.masterOutputGain.gain.setValueAtTime(masterSafety, ctx.currentTime);

        // Connect Chain:
        // Source -> Highpass (35Hz) -> Boost Gain -> Brickwall Compressor -> Soft Limiter -> Master Safety -> Destination
        chain.source.connect(chain.highpassFilter);
        chain.highpassFilter.connect(chain.boostGainNode);
        chain.boostGainNode.connect(chain.brickwallCompressor);
        chain.brickwallCompressor.connect(chain.softLimiterNode);
        chain.softLimiterNode.connect(chain.masterOutputGain);
        chain.masterOutputGain.connect(ctx.destination);

      } else {
        // --- DIRECT GAIN ROUTE (No Compression) ---
        chain.boostGainNode.gain.setValueAtTime(boostFactor, ctx.currentTime);
        chain.source.connect(chain.boostGainNode);
        chain.boostGainNode.connect(ctx.destination);
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

  function init() {
    const domain = window.location.hostname;
    chrome.storage.local.get(['globalVolume', 'antiDistortion', 'isMuted', 'siteVolumes'], (res) => {
      if (res.globalVolume !== undefined) audioState.volume = res.globalVolume;
      if (res.antiDistortion !== undefined) audioState.antiDistortion = res.antiDistortion;
      if (res.isMuted !== undefined) audioState.isMuted = res.isMuted;

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
