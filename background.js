chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.msg) {
        case 'GetCurrentWindow':
            chrome.windows.get(sender.tab.windowId).then(response => {
                sendResponse(response);
            });
            break;
        case 'GetCenter':
            chrome.system.display.getInfo().then(displays => {
                let left = message.screen_left;
                let top = message.screen_right;
                let right = message.screen_left + message.screen_width;
                let bottom = message.screen_right + message.screen_height;
                if (message.multimonitor) {
                    for (const display of displays) {
                        left = Math.min(left, display.bounds.left);
                        top = Math.min(top, display.bounds.top);
                        right = Math.max(right, display.bounds.left + display.bounds.width);
                        bottom = Math.max(bottom, display.bounds.top + display.bounds.height);
                    }
                }
                sendResponse({ center_x: (left + right) / 2.0, center_y: (top + bottom) / 2.0, width: Math.abs(left) + Math.abs(right), height: Math.abs(top) + Math.abs(bottom) });
            });
            break;
    }
    return true;
});