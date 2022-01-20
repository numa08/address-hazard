chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "get_selection") {
    const element = document.getSelection()?.focusNode
      ?.parentElement as Element | null;
    const path = getElementNode(element);
    sendResponse(path);
  }
});

// see https://github.com/trembacz/xpath-finder/blob/42a4e51ae286ac472b17509cedfbb11a08983a9d/inspect.js#L180
function getElementNode(element: Element | null): string {
  let nodeElem = element;
  if (nodeElem === null || nodeElem === undefined) {
    return "";
  }

  if (nodeElem && nodeElem.id) {
    return `//*[@id="${nodeElem.id}"]`;
  }
  const parts = [];
  while (nodeElem && nodeElem.nodeType === Node.ELEMENT_NODE) {
    let nbOfPreviousSiblings = 0;
    let hasNextSiblings = false;
    let sibling = nodeElem.previousSibling;
    while (sibling) {
      if (
        sibling.nodeType !== Node.DOCUMENT_TYPE_NODE &&
        sibling.nodeName === nodeElem.nodeName
      ) {
        nbOfPreviousSiblings++;
      }
      sibling = sibling.previousSibling;
    }
    sibling = nodeElem.nextSibling;
    while (sibling) {
      if (sibling.nodeName === nodeElem.nodeName) {
        hasNextSiblings = true;
        break;
      }
      sibling = sibling.nextSibling;
    }
    const prefix = nodeElem.prefix ? nodeElem.prefix + ":" : "";
    const nth =
      nbOfPreviousSiblings || hasNextSiblings
        ? `[${nbOfPreviousSiblings + 1}]`
        : "";
    parts.push(prefix + nodeElem.localName + nth);
    nodeElem = nodeElem.parentNode as Element;
  }
  return parts.length ? "/" + parts.reverse().join("/") : "";
}
