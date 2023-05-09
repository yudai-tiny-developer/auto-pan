chrome.windows.onBoundsChanged.addListener(win => {
    chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, 'onBoundsChanged').then(response => { }).catch(error => { });
        });
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    chrome.windows.get(sender.tab.windowId).then(response => {
        sendResponse(response);
    }).catch(error => { });
    return true;
});