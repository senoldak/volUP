# 🔊 volUP - Smart Volume Booster, 5-Band EQ & Multi-Tab Audio Engine

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Web Audio API](https://img.shields.io/badge/API-Web%20Audio%20API-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Version](https://img.shields.io/badge/version-1.3.0-purple.svg)](https://github.com/senoldak/volUP)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**volUP v1.3 Pro** is a high-performance Google Chrome extension that amplifies web audio up to **1000% (10x)** with zero distortion, features a **Multi-Tab Volume Mixer**, **Smart Audio Profiles**, **Quick Bass & Treble Knobs**, **5-Band Graphic Equalizer**, **Speaker Safety Guard**, **Night Mode**, **L/R Channel Balance**, and **Global Keyboard Shortcuts**.

---

## ✨ Pro Features (v1.3.0)

- **🚀 Up to 1000% (10x) Turbo Boost:** Amplifies low-volume audio feeds safely beyond standard limits.
- **🎛️ Multi-Tab Volume Mixer:** Easily view all open browser tabs and switch focus or control audio levels independently across tabs.
- **🎙️ Smart Audio Profiles:** One-click instant tuning for different media types:
  - **Flat:** Default balanced sound.
  - **Podcast:** Mid-range voice clarity boost (300Hz-3.4kHz).
  - **ASMR:** High sensitivity whisper and ambient sound boost.
  - **Cinema:** Sub-bass punch + dialogue compressor.
  - **Music:** Punchy V-shaped EQ (Bass + Treble boost).
- **🔊 Dedicated Bass & Treble Knobs:** Quick sliders for instant +0 to +12 dB low-shelf bass and high-shelf treble amplification.
- **🛡️ Speaker Safety Guard:** Automatic active dynamic frequency safeguard badge when volume exceeds 500%.
- **🎛️ 5-Band Graphic Equalizer:** Custom frequency adjustments (60Hz, 250Hz, 1kHz, 4kHz, 12kHz).
- **🛡️ Smart Anti-Distortion & Soft Limiter:** Dynamic compression and continuous soft-clipping prevent cackle and speaker damage.
- **🌙 Night Mode (Cinematic Normalizer):** Normalizes quiet dialogue and loud explosions.
- **🎧 Left / Right Channel Balance:** Precise L/R stereo balancing for headphones and accessibility.
- **⌨️ Global Keyboard Shortcuts:**
  - `Alt + Shift + Up`: Increase Volume (+10%)
  - `Alt + Shift + Down`: Decrease Volume (-10%)
  - `Alt + Shift + M`: Toggle Mute
- **🌐 Per-Site Memory:** Automatically remembers your custom volume settings for individual domains.
- **🔒 100% Privacy Focused:** Zero tracking, zero telemetry, local storage only ([Privacy Policy](PRIVACY.md)).

---

## 🛠️ Audio DSP Pipeline

```
+------------------+     +--------------------+     +--------------------+     +---------------------+     +-------------------+     +----------------------+     +-------------------+     +------------------+     +-------------------+     +---------------------+
|  Media Element   | --> |  Subsonic Filter   | --> | Bass Boost Filter  | --> | Treble Boost Filter | --> |   5-Band EQ       | --> |    Stereo Panner     | --> |     Gain Node     | --> |    Compressor    | --> |   Soft Limiter    | --> | Audio Destination   |
| (<video>/<audio>)|     | (20Hz Highpass)    |     | (80Hz Lowshelf)    |     | (8kHz Highshelf)    |     | (60Hz to 12kHz)   |     | (L/R Balance)        |     | (0% - 1000% gain) |     | (Anti-Distortion)|     | (2x WaveShaper)   |     | (Speakers/Headphones|
+------------------+     +--------------------+     +--------------------+     +---------------------+     +-------------------+     +----------------------+     +-------------------+     +------------------+     +-------------------+     +---------------------+
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
6. Pin **volUP** to your Chrome toolbar and enjoy!

---

## 📜 Privacy & License

- Read our full [Privacy Policy](PRIVACY.md).
- Distributed under the **MIT License**.
