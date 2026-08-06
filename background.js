// background.js - Service Worker for volUP (v1.4.5 Tab Mute Feature)

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    globalVolume: 100,
    antiDistortion: true,
    isMuted: false,
    siteVolumes: {},
    nightMode: false,
    panBalance: 0,
    bassBoost: 0,
    trebleBoost: 0,
    audioProfile: 'flat',
    eqMode: '5band',
    vizTheme: 'waves',
    eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  });
});

function updateBadge(volume, isMuted) {
  if (isMuted || volume === 0) {
    chrome.action.setBadgeText({ text: "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
  } else if (volume === 100) {
    chrome.action.setBadgeText({ text: "" });
  } else {
    chrome.action.setBadgeText({ text: `%${volume}` });
    if (volume <= 400) {
      chrome.action.setBadgeBackgroundColor({ color: "#8b5cf6" });
    } else if (volume <= 800) {
      chrome.action.setBadgeBackgroundColor({ color: "#ec4899" });
    } else {
      chrome.action.setBadgeBackgroundColor({ color: "#06b6d4" });
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_BADGE") {
    updateBadge(message.volume, message.isMuted);
    sendResponse({ status: "OK" });
    return true;
  }

  if (message.type === "GET_ALL_TABS") {
    chrome.tabs.query({}, (tabs) => {
      const validTabs = tabs.filter(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')));
      sendResponse({ tabs: validTabs });
    });
    return true;
  }

  if (message.type === "TOGGLE_TAB_MUTE") {
    chrome.tabs.update(message.tabId, { muted: message.muted }, (updatedTab) => {
      sendResponse({
        status: "OK",
        muted: updatedTab && updatedTab.mutedInfo ? updatedTab.mutedInfo.muted : false
      });
    });
    return true;
  }
});

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "SHORTCUT_COMMAND",
        command: command
      });
    }
  });
});
