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
        case 'GetCenterPrimary':
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
        case 'GetCenterAll':
            chrome.system.display.getInfo().then(displays => {
                let left = message.screen_left;
                let top = message.screen_top;
                let right = message.screen_left + message.screen_width;
                let bottom = message.screen_top + message.screen_height;
                for (const display of displays) {
                    left = Math.min(left, display.bounds.left);
                    top = Math.min(top, display.bounds.top);
                    right = Math.max(right, display.bounds.left + display.bounds.width);
                    bottom = Math.max(bottom, display.bounds.top + display.bounds.height);
                }
                sendResponse({ center_x: (left + right) / 2.0, center_y: (top + bottom) / 2.0, width: Math.abs(left) + Math.abs(right), height: Math.abs(top) + Math.abs(bottom) });
            });
            break;
    }
    return true;
});