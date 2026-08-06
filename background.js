// background.js - Service Worker for volUP Extension (v1.2.0)

chrome.runtime.onInstalled.addListener(() => {
  console.log("volUP Volume Booster & EQ extension installed.");
  chrome.storage.local.set({
    globalVolume: 100,
    antiDistortion: true,
    isMuted: false,
    nightMode: false,
    isMono: false,
    panBalance: 0,
    playbackSpeed: 1.0,
    eqBands: [0, 0, 0, 0, 0] // 60Hz, 250Hz, 1kHz, 4kHz, 12kHz in dB (-12 to +12)
  });
});

// Update extension action badge when volume changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_BADGE") {
    const tabId = sender.tab ? sender.tab.id : message.tabId;
    if (tabId) {
      if (message.isMuted) {
        chrome.action.setBadgeText({ tabId, text: "OFF" });
        chrome.action.setBadgeBackgroundColor({ tabId, color: "#ef4444" });
      } else if (message.volume === 100) {
        chrome.action.setBadgeText({ tabId, text: "" });
      } else {
        const text = `${message.volume}%`;
        chrome.action.setBadgeText({ tabId, text });
        chrome.action.setBadgeBackgroundColor({ tabId, color: "#8b5cf6" });
      }
    }
  }
  return true;
});

// Listen for global keyboard shortcuts (Commands API)
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: "SHORTCUT_COMMAND", command });
  }
});
