let context;
let panner;
let source;

function updatePan() {
    if (panner) {
        const center_x = window.screen.width / 2;
        const target = Math.min(1, Math.max(-1, (window.screenX + window.outerWidth / 2 - center_x) / center_x * 2.0));
        panner.pan.setTargetAtTime(target, context.currentTime, 0.2);
    }
}

function connectPan(media) {
    media.addEventListener('playing', () => {
        if (!context) {
            context = new AudioContext();
        }

        if (!panner) {
            panner = context.createStereoPanner();
            panner.connect(context.destination);
        }

        source = context.createMediaStreamSource(media.captureStream());
        source.connect(panner);

        updatePan();
    });
}

window.addEventListener('resize', () => {
    updatePan();
});

let screenX = window.screenX;
setInterval(() => {
    if (screenX !== window.screenX) {
        screenX = window.screenX;
        updatePan();
    }
}, 256);

new MutationObserver((mutations, observer) => {
    for (const m of mutations) {
        if (m.target.nodeName === 'VIDEO' || m.target.nodeName === 'AUDIO') {
            connectPan(m.target);
            return;
        }

        for (const n of m.addedNodes) {
            if (n.nodeName === 'VIDEO' || n.nodeName === 'AUDIO') {
                connectPan(n);
                return;
            }
        }
    }
}).observe(document.body, {
    childList: true,
    subtree: true,
});

const media = document.querySelector('video, audio');
if (media) {
    connectPan(media);
}