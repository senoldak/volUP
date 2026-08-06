# 🔊 volUP - Smart Volume Booster, 10-Band EQ & Studio Audio Engine

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Web Audio API](https://img.shields.io/badge/API-Web%20Audio%20API-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Version](https://img.shields.io/badge/version-1.5.0-purple.svg)](https://github.com/senoldak/volUP)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**volUP Master Edition (v1.5.0)** is a high-performance Google Chrome extension designed for audiophiles, power users, and everyday listeners. It amplifies web audio up to **1000% (10x)** without sound crackling or distortion, featuring an advanced **10-Node Web Audio API DSP Engine**, **10-Band Studio Equalizer**, **Vocal Clarity Filter**, **Sleep Auto-Off Timer**, **On-Screen Display (OSD) Toast**, **Stereo-to-Mono Downmixer**, **Multi-Tab Volume Mixer with Tab Mute**, **Domain Rules Manager**, and **JSON Import/Export Backup**.

---

## 🌟 Master Edition Features Summary

| Feature Category | Description |
| :--- | :--- |
| **🚀 1000% Turbo Boost** | Amplifies quiet YouTube videos, podcasts, movies, and streams up to 10x with bit-exact 100% passthrough for volume $\le 100\%$. |
| **🎛️ 10-Band Studio EQ** | Precision multi-band equalizer (31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz) with quick 5-Band mode toggle. |
| **⚡ On-Screen Display (OSD)** | Floating dark-mode toast badge (`🔊 350%`) overlaying web pages during volume adjustment or hotkey commands. |
| **⏱️ Sleep Auto-Off Timer** | Background timer (15m, 30m, 45m, 60m) that automatically mutes audio when listening to podcasts or music at bedtime. |
| **🎧 Stereo-to-Mono Converter** | Downmixes left & right audio channels into a single earbud feed for single-earphone listening or single-side tracks. |
| **🎙️ Vocal Clarity Filter** | Dialogue booster filter focusing on speech frequencies (`1.5kHz - 3.5kHz`) to make low movie dialogue crystal clear. |
| **🌙 Night Mode Normalizer** | Dynamic compressor that normalizes whispering dialogue and sudden loud movie explosions. |
| **🎛️ Multi-Tab Audio Mixer** | Displays all open browser tabs playing audio, allowing per-tab Mute/Unmute toggle and instant tab switching. |
| **🌐 Saved Domain Manager** | Memory list showing custom saved site rules with 1-click single site removal or complete rule wiping. |
| **📥 JSON Import / Export** | Backup custom EQ presets and saved site volume rules into a JSON file or import settings across devices. |
| **🛡️ Ear Protection Safety Cap** | Optional safety lock capping maximum volume at 400% to protect hearing and hardware speakers. |
| **🎨 Visualizer FX Themes** | 3 distinct visualizer animations: **Neon Waves**, **Pulse Ring**, and **LED VU Meter**. |
| **⌨️ Global Keyboard Shortcuts** | `Alt+Shift+Up` (Volume +10%), `Alt+Shift+Down` (Volume -10%), `Alt+Shift+M` (Toggle Mute). |

---

## 🛠️ Complete Web Audio DSP Pipeline Architecture

`volUP` intercepts `<video>` and `<audio>` HTML5 elements via a 10-node Web Audio API pipeline:

```
                                  +-------------------------------------------------------------+
                                  |                      HTML5 Media Source                     |
                                  |                     (<video> / <audio>)                     |
                                  +-------------------------------------------------------------+
                                                                 |
                                                                 v
                                  +-------------------------------------------------------------+
                                  |             Subsonic Highpass Filter (20 Hz)                |
                                  |            (Removes unheard speaker-blowing rumbles)        |
                                  +-------------------------------------------------------------+
                                                                 |
                                                                 v
                                  +-------------------------------------------------------------+
                                  |             Vocal Clarity Peaking Filter (2.5 kHz)          |
                                  |             (Boosts dialogue speech clarity +5dB)           |
                                  +-------------------------------------------------------------+
                                                                 |
                                                                 v
                                  +-------------------------------------------------------------+
                                  |           Quick Bass (80Hz) & Treble (8kHz) Filters         |
                                  +-------------------------------------------------------------+
                                                                 |
                                                                 v
                                  +-------------------------------------------------------------+
                                  |         10-Band Studio Graphic Equalizer (31Hz - 16kHz)       |
                                  +-------------------------------------------------------------+
                                                                 |
                                                                 v
                                  +-------------------------------------------------------------+
                                  |               Stereo Panner & Mono Downmixer                |
                                  |            (L/R Balance & Channel Count Control)            |
                                  +-------------------------------------------------------------+
                                                                 |
                                                                 v
                                  +-------------------------------------------------------------+
                                  |             Primary Gain Node (0% to 1000% Boost)           |
                                  +-------------------------------------------------------------+
                                                                 |
                                                                 v
                                  +-------------------------------------------------------------+
                                  |           DynamicsCompressorNode (Anti-Distortion)          |
                                  |          (Dynamic threshold/knee/ratio scaling)             |
                                  +-------------------------------------------------------------+
                                                                 |
                                                                 v
                                  +-------------------------------------------------------------+
                                  |            WaveShaperNode (Soft Limiter Curve)              |
                                  |              (2x oversampled hyperbolic curve)              |
                                  +-------------------------------------------------------------+
                                                                 |
                                                                 v
                                  +-------------------------------------------------------------+
                                  |          AnalyserNode & Master Output Gain Scaling          |
                                  +-------------------------------------------------------------+
                                                                 |
                                                                 v
                                  +-------------------------------------------------------------+
                                  |                     Audio Destination                       |
                                  |                    (Speakers / Headphones)                  |
                                  +-------------------------------------------------------------+
```

---

## 📂 Codebase & File Architecture

```
volUP/
├── manifest.json         # Manifest V3 extension definition, permissions & commands
├── background.js        # Service worker for badge text, global hotkeys & tab querying
├── content.js           # Core DSP Web Audio engine, OSD overlay & DOM media scanner
├── popup.html           # Glassmorphism popup user interface layout
├── popup.css            # W3C-compliant CSS variables, theme animations & range sliders
├── popup.js             # UI state controller, tab mixer & JSON import/export logic
├── README.md            # Comprehensive project documentation
└── PRIVACY.md           # Chrome Web Store compliant zero-tracking privacy policy
```

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut Key | Action Description | OSD Feedback |
| :--- | :--- | :--- |
| `Alt + Shift + Up` | Increase volume by +10% | Floating OSD Toast (`🔊 110%`) |
| `Alt + Shift + Down` | Decrease volume by -10% | Floating OSD Toast (`🔊 90%`) |
| `Alt + Shift + M` | Toggle Mute / Unmute | Floating OSD Toast (`🔇 Muted`) |

---

## 📥 Installation Guide

1. Clone or download this repository:
   ```bash
   git clone https://github.com/senoldak/volUP.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** in the top-right toggle switch.
4. Click **Load unpacked** (Paketlenmemiş öğe yükle).
5. Select the `volUP` directory.
6. Pin **volUP** to your Chrome toolbar.

---

## 🔒 Privacy & Security

`volUP` is 100% private and offline-capable:
- Zero telemetry, tracking, or remote server requests.
- All domain rules and EQ configurations remain stored locally in `chrome.storage.local`.
- Read our full [PRIVACY.md](PRIVACY.md).

---

## 📜 License

Distributed under the **MIT License**. Created by [senoldak](https://github.com/senoldak).
