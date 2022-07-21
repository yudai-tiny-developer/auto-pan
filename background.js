// Impossible to implement with Manifest V3

let center_x;
let tabId_to_panner = new Map();
let windowId_to_tabId = new Map();

const context = new AudioContext();

chrome.system.display.getInfo({}, displayInfo => {
	const bounds = displayInfo[0].bounds;
	center_x = (bounds.width - bounds.left) / 2;
});

function capture(tabId, windowId) {
	if (!tabId_to_panner.has(tabId)) {
		chrome.tabCapture.capture({
			video: false,
			audio: true
		}, (stream) => {
			const source = context.createMediaStreamSource(stream);
			const panner = context.createStereoPanner();
			tabId_to_panner.set(tabId, panner);

			source.connect(panner);
			panner.connect(context.destination);

			pan(tabId, windowId);
		});
	} else {
		pan(tabId, windowId);
	}
}

function pan(tabId, windowId) {
	chrome.windows.get(windowId, window => {
		tabId_to_panner.get(tabId).pan.value = Math.min(1, Math.max(-1, Math.tanh((window.left + window.width / 2.0 - center_x) / center_x) * 1.5));
	});
}

chrome.windows.onBoundsChanged.addListener(window => {
	if (windowId_to_tabId.has(window.id)) {
		for (const tabId of windowId_to_tabId.get(window.id)) {
			capture(tabId, window.id);
		}
	}
});

function update(tabId, windowId) {
	let tabIds = windowId_to_tabId.get(windowId);
	if (tabIds) {
		tabIds.add(tabId);
	} else {
		tabIds = new Set();
		tabIds.add(tabId);
		windowId_to_tabId.set(windowId, tabIds);
	}
}

chrome.contextMenus.create({
	id: 'AutoPan',
	title: 'Enable Auto Pan',
	type: 'normal',
	contexts: ['all']
}, () => { });

chrome.contextMenus.onClicked.addListener((info, tab) => {
	const tabId = tab.id;
	const windowId = tab.windowId;

	update(tabId, windowId);
	capture(tabId, windowId);
});

chrome.browserAction.onClicked.addListener(tab => {
	const tabId = tab.id;
	const windowId = tab.windowId;

	update(tabId, windowId);
	capture(tabId, windowId);
});

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
	const windowId = attachInfo.newWindowId;

	update(tabId, windowId);
	capture(tabId, windowId);
});
