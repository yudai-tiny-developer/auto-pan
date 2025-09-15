import(chrome.runtime.getURL('common.js')).then(common => {
    main(common);
});

function main(common) {
    function loadSettings() {
        chrome.storage.local.get(common.storage, data => {
            enabled = common.value(data.enabled, common.defaultEnabled);
            panRate = common.limitRate(data.panRate, common.defaultPanRate, common.minPanRate, common.maxPanRate, common.stepPanRate);
            pan2d = common.value(data.pan2d, common.defaultPan2d);
            multimonitor = common.value(data.multimonitor, common.defaultMultimonitor);

            setPannerOrStereoPanner();

            clearInterval(interval);
            if (enabled) {
                interval = setInterval(() => {
                    addEventListenerToAllMedia();
                    updatePan();
                }, 100);
            } else {
                resetPan();
            }
        });
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
                panner.disconnect();
                createPanner();
                for (const source of sources.values()) {
                    source.connect(panner);
                }
            }
        } else {
            createPanner();
        }
    }

    function createPanner() {
        panner = context.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'linear';
        panner.connect(context.destination);
    }

    function setStereoPanner() {
        if (panner) {
            if (panner.positionX) { // if panner is Panner then
                panner.disconnect();
                createStereoPanner();
                for (const source of sources.values()) {
                    source.connect(panner);
                }
            }
        } else {
            createStereoPanner();
        }
    }

    function createStereoPanner() {
        panner = context.createStereoPanner();
        panner.connect(context.destination);
    }

    function addEventListenerToAllMedia() {
        for (const media of document.body.querySelectorAll('video:not([_auto-pan]), audio:not([_auto-pan])')) {
            context.resume().then(() => {
                setMediaElementSource(media);
            });
        }
    }

    function setMediaElementSource(media) {
        if (hasSrc(media) && isSameOriginMedia(media)) {
            media.setAttribute('_auto-pan', '');
            const source = context.createMediaElementSource(media);
            sources.set(media, source);
            source.connect(panner);
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

    function isSameOriginMedia(media) {
        if (media.srcObject) {
            return true;
        }

        if (isSameOriginUrl(media.currentSrc)) {
            return true;
        }

        if (isSameOriginUrl(media.src)) {
            return true;
        }

        return false;
    }

    function isSameOriginUrl(src) {
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

    function updatePan() {
        if (enabled) {
            try {
                chrome.runtime.sendMessage({ msg: 'GetCurrentWindow' }).then(currentWindow => {
                    updateWindowPan(currentWindow);
                });
            } catch {
                // service_worker not ready
            }
        } else {
            resetPan();
        }
    }

    function updateWindowPan(targetWindow) {
        if (panner && targetWindow.state !== 'minimized') {
            chrome.runtime.sendMessage({ msg: 'GetCenter', multimonitor, screen_left: screen.availLeft, screen_top: screen.availTop, screen_width: screen.availWidth, screen_height: screen.availHeight }).then(responce => {
                if (panner.pan) {
                    panner.pan.value = Math.min(1.0, Math.max(-1.0, (targetWindow.left + targetWindow.width / 2.0 - responce.center_x) / (responce.width / 2.0) * panRate));
                } else {
                    const s = Math.min(1.0, Math.max(-1.0, (targetWindow.left + targetWindow.width / 2.0 - responce.center_x) / (responce.width / 2.0) * panRate));
                    const t = Math.min(1.0, Math.max(-1.0, (targetWindow.top + targetWindow.height / 2.0 - responce.center_y) / (responce.height / 2.0) * panRate));
                    [panner.positionX.value, panner.positionY.value, panner.positionZ.value] = rotateX(rotateY([0.0, 0.0, -1.0], s), t);
                }
            }); 1.6
        }
    }

    function resetPan() {
        if (panner) {
            if (panner.pan) {
                panner.pan.value = 0.0;
            } else {
                [panner.positionX.value, panner.positionY.value, panner.positionZ.value] = [0.0, 0.0, 0.0];
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

    let enabled = common.defaultEnabled;
    let panRate = common.defaultPanRate;
    let pan2d = common.defaultPan2d;
    let multimonitor = common.defaultMultimonitor;
    let context = new AudioContext();
    let panner;
    let sources = new Map();
    let interval;

    chrome.storage.onChanged.addListener(loadSettings);

    loadSettings();
}