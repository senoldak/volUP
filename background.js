// background.js - Service Worker for volUP Extension (v1.3.0)

chrome.runtime.onInstalled.addListener(() => {
  console.log("volUP Volume Booster & Audio Engine v1.3.0 installed.");
  chrome.storage.local.set({
    globalVolume: 100,
    antiDistortion: true,
    isMuted: false,
    nightMode: false,
    panBalance: 0,
    bassBoost: 0,
    trebleBoost: 0,
    audioProfile: 'flat',
    eqBands: [0, 0, 0, 0, 0]
  });
});

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

  // Get all active tabs playing audio or open for Multi-Tab Mixer
  if (message.type === "GET_ALL_TABS") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const validTabs = tabs.filter(t => t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('edge://')).map(t => ({
        id: t.id,
        title: t.title || 'Tab',
        url: t.url,
        favIconUrl: t.favIconUrl || '',
        audible: !!t.audible,
        active: !!t.active
      }));
      sendResponse({ tabs: validTabs });
    });
    return true;
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: "SHORTCUT_COMMAND", command });
  }
});
