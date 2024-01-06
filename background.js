chrome.windows.onBoundsChanged.addListener(win => {
    chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, 'onBoundsChanged').catch(error => {
                // Receiving end does not exist
            });
        });
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    chrome.windows.get(sender.tab.windowId).then(response => {
        sendResponse(response);
    });
    return true;
});