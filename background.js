// Impossible to implement with Manifest V3

let center_x;
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
		const pan = tabId_to_panner.get(tabId).pan;
		pan.value = Math.min(1, Math.max(-1, Math.tanh((window.left + window.width / 2.0 - center_x) / center_x) * 1.5));
		//console.log(tabId + ': ' + pan.value);
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
	const panner = context.createStereoPanner();
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

	//log('contextMenus.onClicked: ' + tab.id);
});

chrome.browserAction.onClicked.addListener(tab => {
	addMap(tab.id, tab.windowId);
	capture(tab.id, tab.windowId);

	//log('browserAction.onClicked: ' + tab.id);
});

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
	addMap(tabId, attachInfo.newWindowId);
	capture(tabId, attachInfo.newWindowId);

	//log('tabs.onAttached: ' + tabId);
});

chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
	removeMap(tabId, detachInfo.oldWindowId);

	//log('tabs.onDetached: ' + tabId);
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
	removeMap(tabId, removeInfo.windowId);
	removePanner(tabId);

	//log('tabs.onRemoved: ' + tabId);
});

chrome.windows.onRemoved.addListener(windowId => {
	removeMap(undefined, windowId);

	//log('windows.onRemoved: ' + windowId);
});

function log(title) {
	setTimeout(() => {
		console.log(title);
		console.log('tabId_to_panner: ');
		tabId_to_panner.forEach((value, key, map) => console.log('\t' + key + ': ' + value));
		console.log('windowId_to_tabId: ');
		windowId_to_tabId.forEach((value, key, map) => console.log('\t' + key + ': ' + join(value)));
	}, 1000);
}

function join(value) {
	if (value) {
		return '[' + Array.from(value).join(',') + ']';
	} else {
		return '[]';
	}
}
