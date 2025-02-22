import(chrome.runtime.getURL('common.js')).then(common => {
    main(common);
});

function main(common) {
    function loadSettings() {
        chrome.storage.local.get(common.storage, data => {
            enabled = common.value(data.enabled, common.defaultEnabled);
            panRate = common.limitRate(data.panRate, common.defaultPanRate, common.minPanRate, common.maxPanRate, common.stepPanRate);
            pan2d = common.value(data.pan2d, common.defaultPan2d);

            if (enabled) {
                setPannerOrStereoPanner();
            } else {
                removeAllPanner();
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
        for (const media of document.body.querySelectorAll('video, audio')) {
            media.addEventListener('play', onPlay);
            if (media.played) {
                onPlay({ target: media });
            }
        }
    }

    function onPlay(event) {
        if (context.state === 'suspended') {
            context.resume().then(() => {
                setMediaElementSource(event.target);
            });
        }
    }

    function setMediaElementSource(media) {
        if (!media.hasAttribute('_auto-pan') && !sources.has(media) && hasSrc(media) && isSameOriginMedia(media)) {
            media.setAttribute('_auto-pan', '');
            const source = context.createMediaElementSource(media);
            source.connect(panner);
            sources.set(media, source);
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
        if (enabled && panner) {
            try {
                chrome.runtime.sendMessage('GetCurrentWindow').then(currentWindow => {
                    updateWindowPan(currentWindow);
                });
            } catch {
                // service_worker not ready
            }
        }
    }

    function updateWindowPan(targetWindow) {
        if (enabled && panner && targetWindow.state !== 'minimized') {
            const center_x = window.screen.width / 2.0;
            if (panner.pan) { // Panner
                panner.pan.value = Math.min(1.0, Math.max(-1.0, (targetWindow.left + targetWindow.width / 2.0 - center_x) / center_x * panRate));
            } else { // StereoPanner
                const center_y = window.screen.height / 2.0;
                const s = Math.min(1.0, Math.max(-1.0, (targetWindow.left + targetWindow.width / 2.0 - center_x) / center_x * panRate));
                const t = Math.min(1.0, Math.max(-1.0, (targetWindow.top + targetWindow.height / 2.0 - center_y) / center_y * panRate));
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

    function removeAllPanner() {
        sources.forEach((source, media, map) => {
            source.disconnect();
            source.connect(context.destination);
            media.setAttribute('_auto-pan', '');
            media.removeEventListener(onPlay);
        });
        sources.clear();

        if (panner) {
            panner.disconnect();
            panner = undefined;
        }
    }

    let enabled = common.defaultEnabled;
    let panRate = common.defaultPanRate;
    let pan2d = common.defaultPan2d;
    let context = new AudioContext();
    let panner;
    let sources = new Map();

    chrome.storage.onChanged.addListener(loadSettings);

    loadSettings();

    setInterval(() => {
        addEventListenerToAllMedia();
        updatePan();
    }, 100);
}