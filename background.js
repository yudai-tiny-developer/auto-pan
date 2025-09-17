function isPointInBounds(x, y, bounds) {
    return (
        x >= bounds.left &&
        x <= bounds.left + bounds.width &&
        y >= bounds.top &&
        y <= bounds.top + bounds.height
    );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.msg) {
        case 'GetCurrentWindow':
            chrome.windows.get(sender.tab.windowId).then(response => {
                sendResponse(response);
            });
            break;
        case 'GetCenter':
            chrome.system.display.getInfo().then(displays => {
                for (const display of displays) {
                    if (display.isPrimary) {
                        sendResponse({ center_x: display.bounds.left + display.bounds.width / 2.0, center_y: display.bounds.top + display.bounds.height / 2.0, width: display.bounds.width, height: display.bounds.height });
                        return;
                    }
                }

                sendResponse(undefined); // primary display not found
            });
            break;
    }
    return true;
});