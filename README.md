# 🔊 volUP - Smart Volume Booster & Anti-Distortion Chrome Extension

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Web Audio API](https://img.shields.io/badge/API-Web%20Audio%20API-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](LICENSE)

**volUP** is a high-performance, modern Google Chrome extension that amplifies web audio up to **600% (6x)** while preventing digital clipping, distortion, and speaker crackling. Built with Manifest V3 and the Web Audio API, **volUP** integrates dynamic range compression and peak soft-limiting to deliver loud, crisp, and studio-clean sound across video and audio streaming platforms (YouTube, Twitch, Netflix, Spotify Web, sound feeds, and more).

---

## ✨ Features

- **🚀 Up to 600% Volume Boost:** Safely push media volume far beyond the native 100% boundary.
- **🛡️ Smart Anti-Distortion Engine:** Built-in `DynamicsCompressorNode` and `WaveShaperNode` soft-limiter prevent clipping distortion, crackling, and harsh audio spikes even at maximum gain.
- **🎛️ Dynamic Audio Processing Chain:**
  $$\text{MediaSource} \longrightarrow \text{Compressor} \longrightarrow \text{Gain (0--600\%)} \longrightarrow \text{Soft Limiter} \longrightarrow \text{Destination}$$
- **🎨 Glassmorphism & Modern UI:** Sleek dark-mode popup interface with dynamic visualizer animation, vibrant color-coded loudness feedback, slider controls, and quick preset buttons (%100, %200, %300, %400, %600 MAX).
- **🌐 Per-Site Volume Persistence:** Automatically remembers custom volume levels for specific domains (e.g., set YouTube to 250% and keep it saved).
- **⚡ SPA & Dynamic Content Support:** Utilizes `MutationObserver` to automatically detect newly injected video/audio elements in Single Page Applications (YouTube SPA, Twitch streams, dynamic video players).
- **🔇 One-Click Mute & Reset:** Instant toggle to mute audio or reset back to default 100% volume.
- **🏷️ Real-Time Badge Feedback:** Extension badge displays current active boost level (e.g., `300%`, `OFF`) directly on the extension icon.

---

## 🛠️ Architecture & Technical Details

### Audio Pipeline Architecture

Standard volume boosters multiply linear gain directly, causing high peaks to breach $0\text{ dBFS}$ digital headroom, resulting in harsh square-wave clipping distortion. **volUP** solves this by inserting a two-stage dynamic conditioning layer before speaker output:

```
+------------------+     +----------------------+     +------------------+     +-------------------+     +---------------------+
|  Media Element   | --> | Dynamics Compressor  | --> |    Gain Node     | --> |   Soft Limiter    | --> | Audio Destination   |
| (<video>/<audio>)|     | (-12dB / 12:1 ratio) |     | (0% - 600% gain) |     | (4x WaveShaper)   |     | (Speakers/Headphones)|
+------------------+     +----------------------+     +------------------+     +-------------------+     +---------------------+
```

1. **`DynamicsCompressorNode` Settings:**
   - **Threshold:** `-12 dB` (catches loud peaks early)
   - **Knee:** `30` (smooth compression transition)
   - **Ratio:** `12:1` (effective dynamic range control)
   - **Attack:** `0.003s` / **Release:** `0.25s` (transient retention)

2. **`WaveShaperNode` (Soft Limiter):**
   - Applies a continuous hyperbolic tangent $\tanh(x \cdot 1.5)$ saturation curve to gracefully round off waveform peaks exceeding digital ceiling.

---

## 📁 Repository Structure

```
volUP/
├── manifest.json         # Extension Manifest V3 configuration
├── background.js         # Service worker for badge management & initial state
├── content.js            # Web Audio API engine & DOM MutationObserver
├── popup.html            # User interface HTML layout
├── popup.css             # Glassmorphism dark mode styling & animations
├── popup.js              # UI controller & extension message passing
├── generate_icons.js     # Script to generate extension icon assets
└── icons/                # Extension icon PNGs (16x16, 48x48, 128x128)
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
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click **Load unpacked** (Paketlenmemiş öğe yükle).
5. Select the project directory (`volUP`).
6. Pin **volUP** to your Chrome toolbar and enjoy loud, distortion-free sound!

---

## 💻 Usage

1. Open any website playing audio or video (e.g., YouTube, Twitch, Netflix).
2. Click the **volUP** extension icon in your browser bar.
3. Drag the volume slider or click any preset button (**%100**, **%200**, **%300**, **%400**, **%600 MAX**).
4. Toggle **Smart Anti-Distortion** on/off to compare compressed vs raw amplified audio.
5. Check **"Remember for this site"** if you want volUP to automatically restore your volume level whenever you revisit the website.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
