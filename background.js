// Impossible to implement with Manifest V3

let center_x;
let center_y;
let tabId_to_panner = new Map();
let windowId_to_tabId = new Map();

function capture(tabId, windowId, create, type = 'StereoPan') {

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

function addPanner(tabId, panner, type = 'StereoPan') {
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
			capture(tabId, window.id, false);
		}
	}
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	switch (message.type) {
		case 'center':
			sendResponse({ x: center_x, y: center_y });
			break;
		case 'get':
			sendResponse(tabId_to_panner.get(message.tabId));
			break;
		case 'addMap':
			addMap(message.tabId, message.windowId);
			break;
		case 'removeMap':
			removeMap(message.tabId, message.windowId);
			break;
		case 'addPanner':
			addPanner(message.tabId, message.panner);
			break;
		case 'removePanner':
			removePanner(message.tabId);
			break;
	}
	return true;
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
	removePanner(tabId);
});

chrome.windows.onRemoved.addListener(windowId => {
	removeMap(undefined, windowId);
});
