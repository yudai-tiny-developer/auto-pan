import(chrome.runtime.getURL('common.js')).then(common => {
    let context;
    let panner;
    let source;
    let enabled = true;
    let panRate = common.defaultPanRate;

    function updatePan() {
        if (!source) {
            connectPan(document.querySelector('video, audio'));
        }

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
        if (media) {
            if (!context) {
                context = new AudioContext();
            }

            if (!panner) {
                panner = context.createStereoPanner();
                panner.connect(context.destination);
            }

            source = new MediaElementAudioSourceNode(context, { mediaElement: media });
            source.connect(panner);
        }
    }

    function notMinimized() {
        return window.screenX > -32000;
    }

    let screenX = window.screenX;
    setInterval(() => {
        if (!source || screenX !== window.screenX) {
            screenX = window.screenX;
            updatePan();
        }
    }, 500);

    chrome.storage.local.get(['enabled', 'panRate'], data => {
        enabled = data.enabled;
        panRate = common.limitPanRate(data.panRate);
        updatePan();
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        console.log('onChanged');
        chrome.storage.local.get(['enabled', 'panRate'], data => {
            enabled = data.enabled;
            panRate = common.limitPanRate(data.panRate);
            updatePan();
        });
    });
});
