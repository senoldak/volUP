# 🔊 volUP - Smart Volume Booster, 5-Band EQ & Pro Audio Engine

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Web Audio API](https://img.shields.io/badge/API-Web%20Audio%20API-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Version](https://img.shields.io/badge/version-1.2.0-purple.svg)](https://github.com/senoldak/volUP)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**volUP v1.2** is a feature-packed, high-performance Google Chrome extension that amplifies web audio up to **1000% (10x)** with zero distortion, features a **5-Band Graphic Equalizer**, **Night Mode** (Cinematic Dialogue Normalizer), **Left/Right Channel Balance**, **Playback Speed Control**, and **Global Keyboard Shortcuts**.

---

## ✨ Features (v1.2.0)

- **🚀 Up to 1000% (10x) Turbo Boost:** Amplifies low-volume audio feeds safely beyond standard limits.
- **🎛️ 5-Band Graphic Equalizer:** Custom frequency adjustments (60Hz, 250Hz, 1kHz, 4kHz, 12kHz) with one-click presets (**Flat**, **Bass Boost**, **Vocal Clarity**, **Movie Mode**, **Pop/Rock**).
- **🛡️ Smart Anti-Distortion & Soft Limiter:** Dynamic compression and continuous soft-clipping prevent cackle and speaker damage at high volume.
- **🌙 Night Mode (Cinematic Normalizer):** Compresses dynamic range gaps in movies—lifting quiet dialogue while taming loud explosions.
- **🎧 Left / Right Channel Balance & Mono Support:** Precise L/R stereo balancing for headphones and accessibility.
- **⚡ Playback Speed Control:** Variable speed slider (0.5x to 3.0x) for lectures, podcasts, and videos.
- **⌨️ Global Keyboard Shortcuts:**
  - `Alt + Shift + Up`: Increase Volume (+10%)
  - `Alt + Shift + Down`: Decrease Volume (-10%)
  - `Alt + Shift + M`: Toggle Mute
- **🌐 Per-Site Memory:** Automatically remembers your custom volume and audio settings for individual websites.
- **🔒 100% Privacy Focused:** Zero tracking, zero telemetry, local storage only ([Privacy Policy](PRIVACY.md)).

---

## 🛠️ Audio DSP Pipeline

```
+------------------+     +--------------------+     +-------------------+     +----------------------+     +-------------------+     +------------------+     +-------------------+     +---------------------+
|  Media Element   | --> |  Subsonic Filter   | --> |   5-Band EQ       | --> |    Stereo Panner     | --> |     Gain Node     | --> |    Compressor    | --> |   Soft Limiter    | --> | Audio Destination   |
| (<video>/<audio>)|     | (20Hz Highpass)    |     | (60Hz to 12kHz)   |     | (L/R Balance)        |     | (0% - 1000% gain) |     | (Anti-Distortion)|     | (2x WaveShaper)   |     | (Speakers/Headphones|
+------------------+     +--------------------+     +-------------------+     +----------------------+     +-------------------+     +------------------+     +-------------------+     +---------------------+
```

---

## 📥 Installation Guide

1. Clone or download this repository:
   ```bash
   git clone https://github.com/senoldak/volUP.git
   ```
2. Open Google Chrome and navigate to:
   ```
   chrome://extensions
   ```
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** (Paketlenmemiş öğe yükle).
5. Select the `volUP` directory.
6. Pin **volUP** to your Chrome toolbar and enjoy loud, distortion-free sound!

---

## 📜 Privacy & License

- Read our full [Privacy Policy](PRIVACY.md).
- Distributed under the **MIT License**.
