import(chrome.runtime.getURL('common.js')).then(common => {
    let context;
    let panner;
    let enabled = true;
    let panRate = common.defaultPanRate;

    function updatePan() {
        if (panner && notMinimized()) {
            if (enabled) {
                const center_x = window.screen.width / 2;
                panner.pan.value = Math.min(1, Math.max(-1, (window.screenX + window.outerWidth / 2 - center_x) / center_x * panRate));
            } else {
                panner.pan.value = 0;
            }
        }
    }

    function connectPan(media) {
        if (!context) {
            context = new AudioContext();
        }

        if (!panner) {
            panner = context.createStereoPanner();
            panner.connect(context.destination);
        }

        const source = new MediaElementAudioSourceNode(context, { mediaElement: media });
        source.connect(panner);
    }

    function notMinimized() {
        return window.screenX > -21333;
    }

    let screenX = window.screenX;
    let outerWidth = window.outerWidth;
    let width = window.screen.width;
    setInterval(() => {
        if (screenX !== window.screenX || outerWidth !== window.outerWidth || width !== window.screen.width) {
            screenX = window.screenX;
            outerWidth = window.outerWidth;
            width = window.screen.width;
            updatePan();
        }
    }, 500);

    chrome.storage.local.get(['enabled', 'panRate'], data => {
        enabled = data.enabled;
        panRate = common.limitPanRate(data.panRate);
        updatePan();
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        chrome.storage.local.get(['enabled', 'panRate'], data => {
            enabled = data.enabled;
            panRate = common.limitPanRate(data.panRate);
            updatePan();
        });
    });

    new MutationObserver((mutations, observer) => {
        for (const m of mutations) {
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

    for (const media of document.querySelectorAll('video, audio')) {
        connectPan(media);
    }
});
