
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
    let regex = new RegExp(pattern, 'gi');
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

/* Get all links from page */
const getAllLinks = () => {
  let links = []
  $('a').each(function(){
    let hrefl = $(this).attr('href');
    links.push(hrefl)
  })
  return links
}

/* Get social links from page */
const getSocialLinks = () => {
  const isSocial = (link) => {
    const socialPatterns = [
      /^(https?:\/\/)?(www\.)?facebook.com\/[a-zA-Z0-9(\.\?)?]/,
      /^(https?:\/\/)?(www\.)?twitter.com\/[a-zA-Z0-9(\.\?)?]/,
      /^(https?:\/\/)?(www\.)?instagram.com\/[a-zA-Z0-9(\.\?)?]/,
      /^(https?:\/\/)?(www\.)?linkedin.com\/[a-zA-Z0-9(\.\?)?]/,
    ]
    return socialPatterns.some(pattern => pattern.test(link))
  }
  return getAllLinks().filter(isSocial);
}

/* Get text that matches regex */
const getAllText = () => {
  let wholeText = ''
  const getTextRecursive = (node) => {
    if (isTextNode(node)) { wholeText = wholeText + node.data }
    else if (isExpandable(node)) {
      let children = node.childNodes;
      for (let i = 0; i < children.length; ++i) {
        let child = children[i];
        i += getTextRecursive(child);
      }
    }
    return 0;
  }
  getTextRecursive(document.getElementsByTagName('body')[0])
  return wholeText;
};

const search = (regex) => getAllText()
  .replace(new RegExp(String.fromCharCode(160), "g"), " ")
  .split(" ")
  .map(word => word.match(regex))
  .filter(value => value)
  .reduce((a, b) => a.concat(b), [])

const dedupe = (values) => Array.from(new Set(values))

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    switch(request.message) {
      case 'search': {
        const {pattern} = request
        let result = []
        let regex = validateRegex(pattern)
        if(regex) result = dedupe(search(regex))
        else result = ["invalid pattern"]
        let resultObj = {
          message: 'searchResults',
          pattern,
          result
        };
        console.log("regex search", resultObj)
        chrome.runtime.sendMessage(resultObj)
        break
      }

      case 'getSocialLinks': {
        let resultObj = {
          message: 'socialResults',
          socialLinks: dedupe(getSocialLinks()),
        }
        console.log("social links", resultObj)
        chrome.runtime.sendMessage(resultObj)
        break
      }

      default: break
    }
  }
);
