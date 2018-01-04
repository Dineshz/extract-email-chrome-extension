// background.js

const emptyObj = {pattern: "", secondaryPattern: "", result: []}
const emptyArray = []

const resetStorage = () => {
  localStorage.setItem("regex_search", JSON.stringify(emptyObj))
  localStorage.setItem("social_links", JSON.stringify(emptyArray))
}

chrome.browserAction.onClicked.addListener((tab) => {
  // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    let activeTab = tabs[0]
    chrome.tabs.sendMessage(activeTab.id, {
      message: 'search',
      pattern: '([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)',
    })
    chrome.tabs.sendMessage(activeTab.id, {
      message: 'getSocialLinks',
    })
  })
})

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    switch(request.message) {
      case 'searchResults': {
        const {pattern, secondaryPattern, result} = request
        let storedItem = localStorage.getItem("regex_search") || "{}"
        try {
          storedItem = JSON.parse(storedItem)
        } catch(e) {
          //
        }
        if(typeof storedItem === "object") {
          storedItem.pattern = pattern;
          storedItem.secondaryPattern = secondaryPattern
          if(storedItem.result && storedItem.result.constructor === Array)
            storedItem.result = Array.from(new Set(storedItem.result.concat(result)))
          else storedItem.result = result
        }
        localStorage.setItem("regex_search", JSON.stringify(storedItem))
        break
      }
      case 'socialResults': {
        let storedItem = localStorage.getItem("social_links") || "[]"
        storedItem = JSON.parse(storedItem);
        localStorage.setItem("social_links", JSON.stringify(storedItem.concat(request.socialLinks)))
        break
      }
      default: break
    }
  }
)

chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    switch(request.message) {

      case 'getSearchResults': {
        sendResponse({data: localStorage.getItem("regex_search")})
        break
      }

      case 'resetSocialLinks':
      case 'resetSearchResults': {
        resetStorage()
        break
      }

      case 'getSocialLinks': {
        sendResponse({data: localStorage.getItem("social_links")})
        break
      }

      default: break;
    }
  }
)
//
// window.onunload = resetStorage
// chrome.windows.onRemoved.addListener(resetStorage)
