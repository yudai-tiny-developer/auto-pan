import(chrome.runtime.getURL('common.js')).then(common => {
    function createLabel(label) {
        const div = document.createElement('div');
        div.classList.add('label');
        div.innerHTML = label;
        return div;
    }

    function createEnabledToggle(checked) {
        const div = document.createElement('div');
        div.classList.add('toggle');

        const input = document.createElement('input');
        input.id = 'enabled';
        input.classList.add('checkbox');
        input.type = 'checkbox';
        input.checked = checked === false ? false : true;
        input.default = 'true';
        input.addEventListener('change', () => {
            chrome.storage.local.set({ 'enabled': input.checked });
        });
        div.appendChild(input);

        const label = document.createElement('label');
        label.classList.add('switch');
        label.setAttribute('for', 'enabled');
        div.appendChild(label);

        return div;
    }

    function createPanLabel() {
        const div = document.createElement('div');
        div.classList.add('label');
        div.innerHTML = `Pan Rate (${common.minPanRate.toFixed(1)} ~ ${common.maxPanRate.toFixed(1)})`;
        return div;
    }

    function createPanInput(panRate) {
        const input = document.createElement('input');
        input.id = 'panRate';
        input.type = 'number';
        input.min = common.minPanRate;
        input.max = common.maxPanRate;
        input.step = common.stepPanRate;
        input.value = common.limitPanRate(panRate);
        input.addEventListener('change', () => {
            chrome.storage.local.set({ 'panRate': common.limitPanRate(input.value) });
        });
        return input;
    }

    chrome.storage.local.get(['enabled', 'panRate'], (data) => {
        const row1 = document.querySelector('div#row1');
        row1.appendChild(createLabel('Enabled/Disabled'));
        row1.appendChild(createEnabledToggle(data.enabled));

        const row2 = document.querySelector('div#row2');
        row2.appendChild(createPanLabel());
        row2.appendChild(createPanInput(data.panRate));
    });
});
