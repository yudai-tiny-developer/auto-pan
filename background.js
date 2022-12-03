// Impossible to implement with Manifest V3

let center_x;
let center_y;
let tabId_to_audio = new Map();
let windowId_to_tabId = new Map();
const context = new AudioContext();

function capture(tabId, windowId, create, type = 'StereoPan') {
	if (tabId_to_audio.has(tabId)) {
		pan(tabId, windowId, type);
	} else if (create) {
		chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
			addAudio(tabId, stream, type);
			pan(tabId, windowId, type);
		});
	}
}

function pan(tabId, windowId, type) {
	chrome.windows.get(windowId, window => {
		const audio = tabId_to_audio.get(tabId);
		switch (type) {
			case 'Pan':
				audio.panner.positionX.setTargetAtTime((window.left + window.width / 2 - center_x) / center_x * 1.3, context.currentTime, 0.2);
				audio.panner.positionY.setTargetAtTime(-(window.top + window.height / 2 - center_y) / center_y * 2.6, context.currentTime, 0.2);
				audio.panner.positionZ.setTargetAtTime(-1, context.currentTime, 0.2);
				break;
			case 'StereoPan':
				audio.panner.pan.setTargetAtTime(Math.min(1, Math.max(-1, (window.left + window.width / 2 - center_x) / center_x * 1.3)), context.currentTime, 0.2);
				break;
		}
	});
}

function addMap(tabId, windowId) {
	let tabIds = windowId_to_tabId.get(windowId);
	if (!tabIds) {
		tabIds = new Set();
		windowId_to_tabId.set(windowId, tabIds);
	}
	tabIds.add(tabId);
}

function removeMap(tabId, windowId) {
	if (tabId) {
		const tabIds = windowId_to_tabId.get(windowId);
		if (tabIds) {
			tabIds.delete(tabId);
		}
	} else {
		windowId_to_tabId.delete(windowId);
	}
}

function addAudio(tabId, stream, type) {
	let panner;
	switch (type) {
		case 'Pan':
			panner = context.createPanner();
			panner.panningModel = 'HRTF';
			panner.distanceModel = 'linear';
			break;
		case 'StereoPan':
			panner = context.createStereoPanner();
			break;
	}

	const source = context.createMediaStreamSource(stream);
	source.connect(panner);
	panner.connect(context.destination);

	tabId_to_audio.set(tabId, {
		stream: stream,
		source: source,
		panner: panner,
	});
}

function removeAudio(tabId) {
	const audio = tabId_to_audio.get(tabId);
	if (audio) {
		for (const track of audio.stream.getTracks()) {
			track.stop();
		}
		tabId_to_audio.delete(tabId);
	}
}

chrome.system.display.getInfo({}, displayInfo => {
	const bounds = displayInfo[0].bounds;
	center_x = (bounds.width - bounds.left) / 2;
	center_y = (bounds.height - bounds.top) / 2;
});

chrome.windows.onBoundsChanged.addListener(window => {
	if (window.state !== 'minimized' && windowId_to_tabId.has(window.id)) {
		for (const tabId of windowId_to_tabId.get(window.id)) {
			capture(tabId, window.id, false);
		}
	}
});

chrome.contextMenus.create({
	id: 'hkghcgebakholhmhijhpipamdmbcnbgj',
	title: 'Auto Pan',
	type: 'normal',
	contexts: ['page', 'video']
}, () => { });

chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (tabId_to_audio.has(tab.id)) {
		removeMap(tab.id, tab.windowId);
		removeAudio(tab.id);
	} else {
		addMap(tab.id, tab.windowId);
		capture(tab.id, tab.windowId, true);
	}
});

chrome.browserAction.onClicked.addListener(tab => {
	if (tabId_to_audio.has(tab.id)) {
		removeMap(tab.id, tab.windowId);
		removeAudio(tab.id);
	} else {
		addMap(tab.id, tab.windowId);
		capture(tab.id, tab.windowId, true);
	}
});

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
	addMap(tabId, attachInfo.newWindowId);
	capture(tabId, attachInfo.newWindowId, false);
});

chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
	removeMap(tabId, detachInfo.oldWindowId);
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
	removeMap(tabId, removeInfo.windowId);
	removeAudio(tabId);
});

chrome.windows.onRemoved.addListener(windowId => {
	removeMap(undefined, windowId);
});
