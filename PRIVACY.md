# Privacy Policy for volUP - Smart Volume Booster & Audio Engine

**Effective Date:** August 7, 2026

**volUP** ("the Extension") is committed to protecting user privacy. This Privacy Policy outlines our data handling practices regarding your use of the extension.

---

## 1. Information Collection and Storage

**volUP does NOT collect, store, transmit, or share any personal or sensitive user data.**

- **Local Storage Only:** All extension settings (volume level preferences, custom 5-band equalizer values, night mode state, left/right channel balance, and domain-specific volume settings) are saved **locally on your device** using Chrome's native `chrome.storage.local` API.
- **No Remote Servers:** We do not operate external web servers, tracking services, telemetry scripts, or third-party analytics.
- **No Web History Tracking:** Domain volume settings are matched strictly within your local browser instance to restore volume levels for websites you choose to save. No URL data is ever transmitted out of your device.

---

## 2. Permissions Justification

- **`activeTab` & `scripting`:** Used solely to apply Web Audio API processing (`AudioContext`, `GainNode`, `DynamicsCompressorNode`, `BiquadFilterNode`) to HTML5 `<video>` and `<audio>` elements playing in the current tab.
- **`storage`:** Used to save your volume and equalizer preferences locally on your browser.

---

## 3. Contact Us

If you have any questions or feedback regarding this Privacy Policy, please open an issue on our GitHub Repository:
https://github.com/senoldak/volUP
