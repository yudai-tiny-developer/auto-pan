import(chrome.runtime.getURL('common.js')).then(common => {
    let context;
    let panner;
    let enabled = true;
    let panRate = common.defaultPanRate;

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
        if (!context) {
            context = new AudioContext();

            const timer = setInterval(() => {
                if (context.state === 'suspended') {
                    console.log('Resuming attempt.');
                    context.resume();
                } else {
                    clearInterval(timer);

                    if (!panner) {
                        panner = context.createStereoPanner();
                        panner.connect(context.destination);
                    }

                    const source = new MediaElementAudioSourceNode(context, { mediaElement: media });
                    source.connect(panner);

                    updatePan();
                }
            }, 1000);
        }
    }

    chrome.runtime.onMessage.addListener(w => {
        updatePan();
    });

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
