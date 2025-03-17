let selectedAreas = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "areaSelected") {
    selectedAreas.push(message.data);
    chrome.runtime.sendMessage({ type: "updateAreas", data: selectedAreas });
  } else if (message.type === "getAreas") {
    sendResponse({ areas: selectedAreas });
  } else if (message.type === "resetAreas") {
    selectedAreas = [];
    chrome.runtime.sendMessage({ type: "updateAreas", data: selectedAreas });
  }
});
