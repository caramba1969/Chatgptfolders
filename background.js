// background.js

// Listen for messages from content scripts (if needed)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_FOLDERS') {
      chrome.storage.sync.get(['folders'], (result) => {
        sendResponse({ folders: result.folders || [] });
      });
      return true; // Indicates asynchronous response
    }
  });
  