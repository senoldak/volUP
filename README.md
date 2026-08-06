# 🔊 volUP - Smart Volume Booster, 10-Band EQ & Studio Audio Engine

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Web Audio API](https://img.shields.io/badge/API-Web%20Audio%20API-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Version](https://img.shields.io/badge/version-1.4.0-purple.svg)](https://github.com/senoldak/volUP)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**volUP v1.4 Studio Edition** is the ultimate Google Chrome extension that amplifies web audio up to **1000% (10x)** with zero distortion, features a **10-Band Pro Equalizer**, **Saved Domain Rules Manager**, **Import/Export Settings Backup**, **Multi-Tab Audio Mixer**, **Smart Audio Profiles**, **Quick Bass/Treble Boost**, **Visualizer FX Themes**, **Speaker Safety Guard**, and **Global Keyboard Shortcuts**.

---

## ✨ Studio Edition Features (v1.4.0)

- **🚀 Up to 1000% (10x) Turbo Boost:** Safely amplifies low-volume web audio feeds beyond limits.
- **🎛️ 10-Band Pro Studio Equalizer:** Precision frequency control (31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz) + toggleable 5-Band mode.
- **🌐 Saved Domain Rules Manager:** View all custom website volume rules saved in browser memory, delete individual site rules, or clear all site rules with 1-click.
- **📥 Import / Export Settings Backup:** Backup your custom EQ presets and site volume rules to JSON file or import settings to another browser.
- **🎨 Visualizer FX Themes:** Switchable popup visualizer themes (**Neon Waves**, **Pulse Ring**, **Stereo LED Meter**).
- **🎛️ Multi-Tab Volume Mixer:** View all open browser tabs and switch focus or control audio levels independently across tabs.
- **🎙️ Smart Audio Profiles:** One-click instant tuning for Flat, Podcast, ASMR, Cinema, and Music.
- **🔊 Dedicated Bass & Treble Knobs:** Quick sliders for instant +0 to +12 dB low-shelf bass and high-shelf treble boost.
- **🛡️ Speaker Safety Guard:** Automatic active dynamic frequency safeguard badge when volume exceeds 500%.
- **🌙 Night Mode (Cinematic Normalizer):** Compresses dynamic range gaps in movies.
- **🎧 Left / Right Channel Balance:** Precise L/R stereo balancing.
- **⌨️ Global Keyboard Shortcuts:** `Alt+Shift+Up`, `Alt+Shift+Down`, `Alt+Shift+M`.
- **🔒 100% Privacy Focused:** Zero tracking, zero telemetry, local storage only ([Privacy Policy](PRIVACY.md)).

---

## 🛠️ Audio DSP Pipeline

```
+------------------+     +--------------------+     +--------------------+     +---------------------+     +-------------------+     +--------------------+     +-------------------+     +------------------+     +-------------------+     +---------------------+
|  Media Element   | --> |  Subsonic Filter   | --> | Bass Boost Filter  | --> | Treble Boost Filter | --> |   10-Band EQ      | --> |   Stereo Panner    | --> |     Gain Node     | --> |    Compressor    | --> |   Soft Limiter    | --> | Audio Destination   |
| (<video>/<audio>)|     | (20Hz Highpass)    |     | (80Hz Lowshelf)    |     | (8kHz Highshelf)    |     | (31Hz to 16kHz)   |     | (L/R Balance)      |     | (0% - 1000% gain) |     | (Anti-Distortion)|     | (2x WaveShaper)   |     | (Speakers/Headphones|
+------------------+     +--------------------+     +--------------------+     +---------------------+     +-------------------+     +--------------------+     +-------------------+     +------------------+     +-------------------+     +---------------------+
```

---

## 📥 Installation Guide

1. Clone or download this repository:
   ```bash
   git clone https://github.com/senoldak/volUP.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** (Paketlenmemiş öğe yükle).
5. Select the `volUP` directory.
6. Pin **volUP** to your Chrome toolbar and enjoy!

---

## 📜 Privacy & License

- Read our full [Privacy Policy](PRIVACY.md).
- Distributed under the **MIT License**.
