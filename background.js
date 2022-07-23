// Impossible to implement with Manifest V3

let center_x;
let center_y;
let tabId_to_panner = new Map();
let windowId_to_tabId = new Map();
const context = new AudioContext();

function capture(tabId, windowId) {
	if (tabId_to_panner.has(tabId)) {
		pan(tabId, windowId);
	} else {
		chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
			addPanner(tabId, stream);
			pan(tabId, windowId);
		});
	}
}

function pan(tabId, windowId) {
	chrome.windows.get(windowId, window => {
		const panner = tabId_to_panner.get(tabId);
		panner.positionX.value = window.left + window.width / 2 - center_x;
		panner.positionY.value = -(window.top + window.height / 2 - center_y);
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

function addPanner(tabId, stream) {
	const panner = context.createPanner();
	panner.panningModel = 'HRTF';
	panner.rolloffFactor = 1 / center_x / center_y;

	context.createMediaStreamSource(stream).connect(panner);
	panner.connect(context.destination);

	tabId_to_panner.set(tabId, panner);
}

function removePanner(tabId) {
	tabId_to_panner.delete(tabId);
}

chrome.system.display.getInfo({}, displayInfo => {
	const bounds = displayInfo[0].bounds;
	center_x = (bounds.width - bounds.left) / 2;
	center_y = (bounds.height - bounds.top) / 2;
});

chrome.windows.onBoundsChanged.addListener(window => {
	if (windowId_to_tabId.has(window.id)) {
		for (const tabId of windowId_to_tabId.get(window.id)) {
			capture(tabId, window.id);
		}
	}
});

chrome.contextMenus.create({
	id: 'hkghcgebakholhmhijhpipamdmbcnbgj',
	title: 'Enable Auto Pan',
	type: 'normal',
	contexts: ['page', 'frame', 'image', 'video']
}, () => { });

chrome.contextMenus.onClicked.addListener((info, tab) => {
	addMap(tab.id, tab.windowId);
	capture(tab.id, tab.windowId);
});

chrome.browserAction.onClicked.addListener(tab => {
	addMap(tab.id, tab.windowId);
	capture(tab.id, tab.windowId);
});

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
	addMap(tabId, attachInfo.newWindowId);
	capture(tabId, attachInfo.newWindowId);
});

chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
	removeMap(tabId, detachInfo.oldWindowId);
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
	removeMap(tabId, removeInfo.windowId);
	removePanner(tabId);
});

chrome.windows.onRemoved.addListener(windowId => {
	removeMap(undefined, windowId);
});
