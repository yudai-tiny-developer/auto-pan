import(chrome.runtime.getURL('common.js')).then(common => {
    let enabled = common.defaultEnabled;
    let panRate = common.defaultPanRate;
    let pan2d = common.defaultPan2d;
    let smooth = common.defaultSmooth;
    let smoothInterval = common.defaultSmoothRate;

    function initSettings() {
        chrome.storage.local.get(common.storage, data => {
            enabled = common.value(data.enabled, common.defaultEnabled);
            panRate = common.limitRate(data.panRate, common.defaultPanRate, common.minPanRate, common.maxPanRate, common.stepPanRate);
            pan2d = common.value(data.pan2d, common.defaultPan2d);
            smooth = typeof browser === 'undefined' ? common.value(data.smooth, common.defaultSmooth) : true;
            smoothInterval = common.limitRate(data.smoothRate, common.defaultSmoothRate, common.minSmoothRate, common.maxSmoothRate, common.stepSmoothRate);

            for (const media of document.body.querySelectorAll('video, audio')) {
                setAutoPan(media);
            }
        });
    }

    initSettings();

    chrome.storage.onChanged.addListener(() => {
        initSettings();
    });

    let context;
    let panner;
    let source = new Map();
    let smoothTimer;

    function setAutoPan(media) {
        if (enabled) {
            setAudioContext();
            context.resume().then(() => {
                setPannerOrStereoPanner();
                setMediaElementSource(media);
                updatePanValue();
                setSmoothInterval();
            });
        } else {
            removePanner();
        }
    }

    function setAudioContext() {
        if (!context) {
            context = new AudioContext();
        }
    }

    function setPannerOrStereoPanner() {
        if (pan2d) {
            setPanner();
        } else {
            setStereoPanner();
        }
    }

    function setPanner() {
        if (panner) {
            if (panner.pan) { // if panner is StereoPanner then
                changeToPanner();
            }
        } else {
            createPanner();
        }
    }

    function changeToPanner() {
        panner.disconnect();
        createPanner();
    }

    function createPanner() {
        panner = context.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'linear';
        panner.connect(context.destination);
        for (const s of source.values()) {
            s.disconnect();
            s.connect(panner);
        }
    }

    function setStereoPanner() {
        if (panner) {
            if (panner.positionX) { // if panner is Panner then
                changeToStereoPanner();
            }
        } else {
            createStereoPanner();
        }
    }

    function changeToStereoPanner() {
        panner.disconnect();
        createStereoPanner();
    }

    function createStereoPanner() {
        panner = context.createStereoPanner();
        panner.connect(context.destination);
        for (const s of source.values()) {
            s.disconnect();
            s.connect(panner);
        }
    }

    function setMediaElementSource(media) {
        if (!source.has(media) && hasSrc(media) && checkMediaElementCors(media)) {
            const s = context.createMediaElementSource(media);
            s.connect(panner);
            source.set(media, s);
        }
    }

    function hasSrc(media) {
        if (media.srcObject) {
            return true;
        }

        if (media.currentSrc && media.currentSrc !== '') {
            return true;
        }

        if (media.src && media.src !== '') {
            return true;
        }

        return false;
    }

    function checkMediaElementCors(media) {
        if (media.srcObject) {
            return true;
        }

        if (checkUrlCors(media.currentSrc)) {
            return true;
        }

        if (checkUrlCors(media.src)) {
            return true;
        }

        return false;
    }

    function checkUrlCors(src) {
        if (src && src !== '') {
            const url = new URL(src);
            if (url.protocol === 'blob:') {
                return true;
            } else if (url.hostname === window.location.hostname) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    }

    function updatePanValue() {
        if (panner) {
            if (typeof browser === 'undefined') { // if chrome
                try {
                    chrome.runtime.sendMessage('GetCurrentWindow').then(currentWindow => {
                        updatePanValueChrome(currentWindow);
                    });
                } catch {
                    // service_worker not ready
                }
            } else { // if firefox
                updatePanValueFirefox();
            }
        }
    }

    function updatePanValueChrome(currentWindow) {
        if (currentWindow.state !== 'minimized') {
            const center_x = window.screen.width / 2.0;
            if (panner.pan) {
                panner.pan.value = Math.min(1.0, Math.max(-1.0, (currentWindow.left + currentWindow.width / 2.0 - center_x) / center_x * panRate));
            } else {
                const center_y = window.screen.height / 2.0;
                const s = Math.min(1.0, Math.max(-1.0, (currentWindow.left + currentWindow.width / 2.0 - center_x) / center_x * panRate));
                const t = Math.min(1.0, Math.max(-1.0, (currentWindow.top + currentWindow.height / 2.0 - center_y) / center_y * panRate));
                [panner.positionX.value, panner.positionY.value, panner.positionZ.value] = rotateX(rotateY([0.0, 0.0, -1.0], s), t);
            }
        }
    }

    function updatePanValueFirefox() {
        if (window.windowState !== 2) { // minimized(2)
            const center_x = window.screen.width / 2.0;
            if (panner.pan) {
                panner.pan.value = Math.min(1.0, Math.max(-1.0, (window.screenX + window.outerWidth / 2.0 - center_x) / center_x * panRate));
            } else {
                const center_y = window.screen.height / 2.0;
                const s = Math.min(1.0, Math.max(-1.0, (window.screenX + window.outerWidth / 2.0 - center_x) / center_x * panRate));
                const t = Math.min(1.0, Math.max(-1.0, (window.screenY + window.outerHeight / 2.0 - center_y) / center_y * panRate));
                [panner.positionX.value, panner.positionY.value, panner.positionZ.value] = rotateX(rotateY([0.0, 0.0, -1.0], s), t);
            }
        }
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

    function setSmoothInterval() {
        if (smooth) {
            clearInterval(smoothTimer);
            smoothTimer = setInterval(() => {
                updatePanValue();
            }, smoothInterval);
        } else {
            clearInterval(smoothTimer);
        }
    }

    function removePanner() {
        for (const s of source.values()) {
            s.disconnect();
            s.connect(context.destination);
        }


        if (panner) {
            panner.disconnect();
            panner = undefined;
        }

        clearInterval(smoothTimer);
    }

    new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const media of m.target.querySelectorAll('video, audio')) {
                setAutoPan(media);
            }

            for (const n of m.addedNodes) {
                if (n.nodeName === 'VIDEO' || n.nodeName === 'AUDIO') {
                    setAutoPan(n);
                }
            }
        }
    }).observe(document, {
        childList: true,
        subtree: true,
    });

    chrome.runtime.onMessage.addListener(() => {
        updatePanValue();
    });
});

