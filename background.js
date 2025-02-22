chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    chrome.windows.get(sender.tab.windowId).then(response => {
        sendResponse(response);
    });
    return true;
});