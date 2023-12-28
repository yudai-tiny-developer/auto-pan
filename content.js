import(chrome.runtime.getURL('common.js')).then(common => {
    let enabled = common.defaultEnabled;
    let panRate = common.defaultPanRate;
    let pan2d = common.defaultPan2d;
    let smooth = common.defaultSmooth;
    let smoothRate = common.defaultSmoothRate;

    function initSettings() {
        chrome.storage.local.get(common.storage, data => {
            enabled = common.value(data.enabled, common.defaultEnabled);
            panRate = common.limitRate(data.panRate, common.defaultPanRate, common.minPanRate, common.maxPanRate, common.stepPanRate);
            pan2d = common.value(data.pan2d, common.defaultPan2d);
            smooth = common.value(data.smooth, common.defaultSmooth);
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
    let source;
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
                            if (pan2d) {
                                panner = createPanner();
                            } else {
                                panner = createStereoPanner();
                            }
                        } else {
                            if (pan2d && panner.pan) {
                                recreateToPanner();
                            } else if (!pan2d && panner.positionX) {
                                recreateToStereoPanner();
                            } else {
                                // already connected
                            }
                        }

                        if (sourceMedia !== media && checkForCORS(media)) {
                            try {
                                sourceMedia = media;
                                source = context.createMediaElementSource(media);
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
                resetPan();
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
                        const center_x = window.screen.width / 2.0;
                        if (pan2d) {
                            const center_y = window.screen.height / 2.0;
                            const s = Math.min(1.0, Math.max(-1.0, (response.left + response.width / 2.0 - center_x) / center_x * panRate));
                            const t = Math.min(1.0, Math.max(-1.0, (response.top + response.height / 2.0 - center_y) / center_y * panRate));
                            [panner.positionX.value, panner.positionY.value, panner.positionZ.value] = rotateX(rotateY([0.0, 0.0, -1.0], s), t);
                        } else {
                            panner.pan.value = Math.min(1.0, Math.max(-1.0, (response.left + response.width / 2.0 - center_x) / center_x * panRate));
                        }
                    }
                }).catch(error => { });
            } else {
                if (panner) {
                    resetPan();
                }
            }
        }
    }

    function checkForCORS(media) {
        if (media.srcObject) {
            return true;
        }

        if (media.currentSrc) {
            const url = new URL(media.currentSrc);
            if (url.protocol === 'blob:') {
                return true;
            } else if (url.hostname === window.location.hostname) {
                return true;
            }
        }

        if (media.src) {
            const url = new URL(media.src);
            if (url.protocol === 'blob:') {
                return true;
            } else if (url.hostname === window.location.hostname) {
                return true;
            }
        }

        return false;
    }

    function resetPan() {
        if (pan2d) {
            recreateToStereoPanner();
        }

        panner.pan.value = 0;
    }

    function rotateX(p, s) {
        return [
            p[0],
            p[1] * Math.cos(s) + p[2] * Math.sin(s),
            p[1] * -Math.sin(s) + p[2] * Math.cos(s)
        ];
    }

    function rotateY(p, s) {
        return [
            p[0] * Math.cos(s) + p[2] * -Math.sin(s),
            p[1],
            p[0] * Math.sin(s) + p[2] * Math.cos(s)
        ];
    }

    function createStereoPanner() {
        const panner = context.createStereoPanner();
        panner.connect(context.destination);
        return panner;
    }

    function createPanner() {
        const panner = context.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'linear';
        panner.connect(context.destination);
        return panner;
    }

    function recreateToStereoPanner() {
        panner.disconnect();
        panner = createStereoPanner();
        if (source) {
            source.connect(panner);
        }
    }

    function recreateToPanner() {
        panner.disconnect();
        panner = createPanner();
        if (source) {
            source.connect(panner);
        }
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

