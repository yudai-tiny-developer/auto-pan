import(chrome.runtime.getURL('common.js')).then(common => {
    let enabled = common.defaultEnabled;
    let panRate = common.defaultPanRate;
    let smooth = common.defaultSmooth;
    let smoothRate = common.defaultSmoothRate;

    function initSettings() {
        chrome.storage.local.get(common.storage, data => {
            enabled = data.enabled === undefined ? common.defaultEnabled : data.enabled;
            panRate = common.limitRate(data.panRate, common.defaultPanRate, common.minPanRate, common.maxPanRate, common.stepPanRate);
            smooth = data.smooth === undefined ? common.defaultSmooth : data.smooth;
            smoothRate = common.limitRate(data.smoothRate, common.defaultSmoothRate, common.minSmoothRate, common.maxSmoothRate, common.stepSmoothRate);

            for (const media of document.querySelectorAll('video, audio')) {
                connectPan(media);
            }
        });
    }

    initSettings();

    chrome.storage.onChanged.addListener(() => {
        initSettings();
    });

    let context;
    let panner;
    let sourceMedia;
    let connectPanTimer;
    let smoothTimer;

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

                        if (sourceMedia !== media && checkForCORS(media)) {
                            try {
                                sourceMedia = media;
                                const source = context.createMediaElementSource(media);
                                source.connect(panner);
                            } catch {
                                // already connected
                            }
                        }

                        updatePan();

                        if (smooth) {
                            clearInterval(smoothTimer);
                            smoothTimer = setInterval(() => {
                                updatePan();
                            }, smoothRate);
                        } else {
                            clearInterval(smoothTimer);
                        }
                    }
                }, 100);
            }, 100);
        } else {
            if (panner) {
                panner.pan.value = 0;
            }
        }
    }

    function updatePan() {
        if (panner) {
            if (smooth === false) {
                clearInterval(smoothTimer);
            }

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

    function checkForCORS(media) {
        if (media.srcObject) {
            return true;
        } else {
            const regexp = new RegExp('\/\/' + window.location.hostname);
            if (media.src && media.src.match(regexp)) {
                return true;
            } else if (media.currentSrc && media.currentSrc.match(regexp)) {
                return true;
            }
        }
        return false;
    }

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

    chrome.runtime.onMessage.addListener(() => {
        updatePan();
    });
});
