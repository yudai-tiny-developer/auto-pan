// Impossible to implement with Manifest V3

const context = new AudioContext();

function capture(tabId, windowId, create, type = 'StereoPan') {
    chrome.runtime.sendMessage({
        type: 'get',
        tabId: tabId
    }, panner => {
        if (panner) {
            pan(panner, windowId, type);
        } else if (create) {
            chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
                const panner = addPanner(tabId, stream, type);
                pan(panner, windowId, type);
            });
        }
    });
}

function pan(panner, windowId, type) {
    chrome.windows.get(windowId, window => {
        chrome.runtime.sendMessage({
            type: 'center'
        }, center => {
            switch (type) {
                case 'Pan':
                    panner.positionX.setTargetAtTime((window.left + window.width / 2 - center.x) / center.x * 4, context.currentTime, 0.2);
                    panner.positionY.setTargetAtTime(-(window.top + window.height / 2 - center.y) / center.y * 8, context.currentTime, 0.2);
                    panner.positionZ.value = -1;
                    break;
                case 'StereoPan':
                    panner.pan.setTargetAtTime(Math.min(1, Math.max(-1, (window.left + window.width / 2 - center.x) / center.x) * 1.25), context.currentTime, 0.2);
                    break;
            }
        });
    });
}

function addMap(tabId, windowId) {
    chrome.runtime.sendMessage({
        type: 'addMap',
        tabId: tabId,
        windowId: windowId
    });
}

function removeMap(tabId, windowId) {
    chrome.runtime.sendMessage({
        type: 'removeMap',
        tabId: tabId,
        windowId: windowId
    });
}

function addPanner(tabId, stream, type = 'StereoPan') {
    let panner;
    switch (type) {
        case 'Pan':
            panner = context.createPanner();
            panner.panningModel = 'HRTF';
            panner.rolloffFactor = 0.001;
            break;
        case 'StereoPan':
            panner = context.createStereoPanner();
            break;
    }

    context.createMediaStreamSource(stream).connect(panner);
    panner.connect(context.destination);

    chrome.runtime.sendMessage({
        type: 'addPanner',
        tabId: tabId,
        panner: panner
    });

    return panner;
}

function removePanner(tabId) {
    chrome.runtime.sendMessage({
        type: 'removePanner',
        tabId: tabId
    });
}

chrome.tabs.query({ active: true }, (result) => {
    const tab = result[0];
    addMap(tab.id, tab.windowId);
    capture(tab.id, tab.windowId, true);
});
