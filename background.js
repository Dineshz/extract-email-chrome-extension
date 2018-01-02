// background.js

chrome.browserAction.onClicked.addListener((tab) => {
  // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    let activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {"message": "search"});
  });
});

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    switch(request.message) {
      case "searchResults": {
        chrome.storage.sync.set({
          result: request.result
        });
        break;
      }
    }
  }
);
