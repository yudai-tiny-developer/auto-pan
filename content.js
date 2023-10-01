import(chrome.runtime.getURL('common.js')).then(common => {
    let connectPanTimer;
    let context;
    let panner;
    let enabled = true;
    let panRate = common.defaultPanRate;
    let sourceMedia;

    function updatePan() {
        if (panner) {
            if (enabled !== false) {
                chrome.runtime.sendMessage('GetCurrentWindow').then(response => {
                    if (response.state !== 'minimized') {
                        const center_x = window.screen.width / 2;
                        panner.pan.value = Math.min(1, Math.max(-1, (response.left + response.width / 2 - center_x) / center_x * panRate));
                    }
                }).catch(error => { });
            } else {
                panner.pan.value = 0;
            }
        }
    }

    function connectPan(media) {
        if (enabled !== false) {
            clearTimeout(connectPanTimer);
            connectPanTimer = setTimeout(() => {
                if (!context) {
                    context = new AudioContext();
                }

                const timer = setInterval(() => {
                    if (context.state === 'suspended') {
                        context.resume();
                    } else {
                        clearInterval(timer);

                        if (!panner) {
                            panner = context.createStereoPanner();
                            panner.connect(context.destination);
                        }

                        if (sourceMedia !== media) {
                            try {
                                sourceMedia = media;
                                const source = context.createMediaElementSource(media);
                                source.connect(panner);
                            } catch {
                                // already connected
                            }
                        }
                        updatePan();
                    }
                }, 100);
            }, 100);
        }
    }

    chrome.runtime.onMessage.addListener(() => {
        updatePan();
    });

    chrome.storage.local.get(['enabled', 'panRate'], data => {
        enabled = data.enabled;
        panRate = common.limitPanRate(data.panRate);

        for (const media of document.querySelectorAll('video, audio')) {
            connectPan(media);
        }
    });

    chrome.storage.onChanged.addListener(() => {
        chrome.storage.local.get(['enabled', 'panRate'], data => {
            enabled = data.enabled;
            panRate = common.limitPanRate(data.panRate);

            for (const media of document.querySelectorAll('video, audio')) {
                connectPan(media);
            }
        });
    });

    new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const media of m.target.querySelectorAll('video, audio')) {
                connectPan(media);
            }

            for (const n of m.addedNodes) {
                if (n.nodeName === 'VIDEO' || n.nodeName === 'AUDIO') {
                    connectPan(n);
                }
            }
        }
    }).observe(document, {
        childList: true,
        subtree: true,
    });
});
