chrome.contextMenus.create({
  id: "get_hazzard_data",
  contexts: ["selection"],
  title: "ハザードマップを取得する",
  type: "normal",
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "get_hazzard_data") {
    const selection = info.selectionText;
    if (selection === undefined) {
      return;
    }
    const tabId = tab?.id;
    if (tabId === undefined) {
      return;
    }
    const element = await new Promise((resolve) => {
      chrome.tabs.sendMessage(
        tabId,
        { message: "get_selection" },
        (element) => {
          resolve(element);
        }
      );
    });
    const requestIdResponse = await fetch(
      `[my function endpoint]/disaportaldataTask?address=${encodeURIComponent(
        selection
      )}`
    );
    if (requestIdResponse.status !== 200) {
      return;
    }
    const requestId = await requestIdResponse.text();
    const hazardDataResponse = await fetch(
      `[my function endpoint]/disaportaldata?id=${requestId}`
    );

    if (hazardDataResponse.status !== 200) {
      return;
    }
    const hazardData = await hazardDataResponse.json();

    console.log(
      `get selection ${selection}, element ${element}, hazardData ${JSON.stringify(
        hazardData,
        null,
        2
      )}`
    );
  }
});
