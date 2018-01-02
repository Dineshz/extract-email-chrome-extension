
let matchedText = [];
const MAX_RESULTS = 500;
const ELEMENT_NODE_TYPE = 1;
const TEXT_NODE_TYPE = 3;
const UNEXPANDABLE = /(script|style|svg|audio|canvas|figure|video|select|input|textarea)/i;

const isVisible = (node) => node && (
  !window.getComputedStyle(node) ||
  window.getComputedStyle(node).getPropertyValue('display') == '' ||
  window.getComputedStyle(node).getPropertyValue('display') != 'none'
)

/* Validate that a given pattern string is a valid regex */
const validateRegex = (pattern='') => {
  try {
    let regex = new RegExp(pattern, 'i');
    return regex;
  } catch(e) {
    return false;
  }
}

/* Check if the given node is a text node */
const isTextNode = (node) => node && node.nodeType === TEXT_NODE_TYPE

/* Check if the given node is an expandable node that will yield text nodes */
const isExpandable = (node) => node && node.nodeType === ELEMENT_NODE_TYPE
  && node.childNodes && !UNEXPANDABLE.test(node.tagName) && isVisible(node)

/* Get text that matches regex */
const getMatches = (regex, maxResults=MAX_RESULTS) => {
  const getMatchRecursive = (node) => {
    if(matchedText.length >= maxResults){
      return;
    }
    if (isTextNode(node)) {
      let index = node.data.search(regex);
      if (index >= 0 && node.data.length > 0) {
        let match = node.data.match(regex)[0];
        if(match) {
          let extractedEmails = match.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)
          matchedText = matchedText.concat(extractedEmails);
        }
        return 1;
      }
    } else if (isExpandable(node)) {
        let children = node.childNodes;
        for (let i = 0; i < children.length; ++i) {
          let child = children[i];
          i += getMatchRecursive(child);
        }
    }
    return 0;
  }
  matchedText = [];
  getMatchRecursive(document.getElementsByTagName('body')[0]);
};

const search = (regexString, maxResults) => {
  let regex = validateRegex(regexString);
  if(regex && regex!=='') getMatches(regex, maxResults);
  return matchedText;
}

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    switch(request.message) {
      case "search": {
        let result = search("(.+)@(.+){2,}\.(.+){2,}", MAX_RESULTS)
        console.log("result", result);
        chrome.runtime.sendMessage({
          message: "searchResults",
          result
        });
      }
    }
  }
);
