// content.js - Pure Transparent & Zero-Distortion Audio Engine for volUP

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

  // Smooth transparent soft-clipping curve (Active only on extreme peaks above 0.98)
  function createTransparentLimiterCurve() {
    const n_samples = 65536;
    const curve = new Float32Array(n_samples);

    for (let i = 0; i < n_samples; ++i) {
      let x = (i * 2) / n_samples - 1; // -1.0 to +1.0
      // Linear transparent mapping up to 0.9, soft saturation above 0.9
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
      
      // Subsonic Filter (20Hz highpass - ultra gentle cut, leaves normal bass 100% untouched)
      const subsonicFilter = ctx.createBiquadFilter();
      subsonicFilter.type = 'highpass';
      subsonicFilter.frequency.setValueAtTime(20, ctx.currentTime);
      subsonicFilter.Q.setValueAtTime(0.5, ctx.currentTime);

      const gainNode = ctx.createGain();
      const compressorNode = ctx.createDynamicsCompressor();
      const limiterNode = ctx.createWaveShaper();
      
      limiterNode.curve = createTransparentLimiterCurve();
      limiterNode.oversample = '2x';

      const masterGainNode = ctx.createGain();

      const chain = {
        source,
        subsonicFilter,
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
      chain.gainNode.disconnect();
      chain.compressorNode.disconnect();
      chain.limiterNode.disconnect();
      chain.masterGainNode.disconnect();

      const isMuted = audioState.isMuted;
      const targetVolume = isMuted ? 0 : audioState.volume;
      const boostFactor = targetVolume / 100;

      // RULE 1: At 100% volume or lower, DIRECT PASSTHROUGH (100% Bit-exact original sound)
      if (targetVolume <= 100 || !audioState.antiDistortion) {
        chain.gainNode.gain.setValueAtTime(boostFactor, ctx.currentTime);
        chain.source.connect(chain.gainNode);
        chain.gainNode.connect(ctx.destination);
        return;
      }

      // RULE 2: Above 100% volume with Anti-Distortion enabled
      // Smooth dynamic scaling based on how much boost is applied
      const t = (targetVolume - 100) / 500; // 0.0 at 100%, 1.0 at 600%

      // Highpass frequency smoothly transitions from 20Hz up to 30Hz
      const hpFreq = 20 + (t * 10);
      chain.subsonicFilter.frequency.setValueAtTime(hpFreq, ctx.currentTime);

      // Compressor threshold transitions smoothly from -6dB (gentle) to -16dB (strong)
      const threshold = -6 - (t * 10);
      // Compression ratio transitions smoothly from 3:1 (very subtle) to 8:1 (controlled boost)
      const ratio = 3 + (t * 5);

      chain.compressorNode.threshold.setValueAtTime(threshold, ctx.currentTime);
      chain.compressorNode.knee.setValueAtTime(24, ctx.currentTime); // Soft knee for natural warmth
      chain.compressorNode.ratio.setValueAtTime(ratio, ctx.currentTime);
      chain.compressorNode.attack.setValueAtTime(0.005, ctx.currentTime);
      chain.compressorNode.release.setValueAtTime(0.15, ctx.currentTime);

      // Main Gain Boost
      chain.gainNode.gain.setValueAtTime(boostFactor, ctx.currentTime);

      // Output master scaling to keep audio crystal clear
      const masterScale = 1.0 / (1.0 + t * 0.25);
      chain.masterGainNode.gain.setValueAtTime(masterScale, ctx.currentTime);

      // Chain: Source -> SubsonicFilter -> BoostGain -> Compressor -> Limiter -> MasterGain -> Destination
      chain.source.connect(chain.subsonicFilter);
      chain.subsonicFilter.connect(chain.gainNode);
      chain.gainNode.connect(chain.compressorNode);
      chain.compressorNode.connect(chain.limiterNode);
      chain.limiterNode.connect(chain.masterGainNode);
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
