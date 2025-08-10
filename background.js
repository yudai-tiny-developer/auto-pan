chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.msg) {
        case 'GetCurrentWindow':
            chrome.windows.get(sender.tab.windowId).then(response => {
                sendResponse(response);
            });
            break;
        case 'GetCenter':
            chrome.windows.getAll().then(windows => {
                let left = 0;
                let top = 0;
                let right = message.screen_width;
                let bottom = message.screen_height;
                if (message.multimonitor) {
                    for (const window of windows) {
                        left = Math.min(left, window.left);
                        top = Math.min(top, window.top);
                        right = Math.max(right, window.left + window.width);
                        bottom = Math.max(bottom, window.top + window.height);
                    }
                }
                sendResponse({ center_x: (right - left) / 2.0, center_y: (bottom - top) / 2.0 });

            });
            break;
    }
    return true;
});