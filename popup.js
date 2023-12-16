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
        input.checked = checked === undefined ? common.defaultEnabled : checked;
        input.setAttribute('default', common.defaultEnabled);
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

    function createPanLabelDescription() {
        const div = document.createElement('div');
        div.classList.add('label');
        div.innerHTML = `${common.maxPanRate.toFixed(1)}: Rapidly panning<br>${common.minPanRate.toFixed(1)}: Gradually panning`;
        return div;
    }

    function createPanInput(panRate) {
        const input = document.createElement('input');
        input.id = 'panRate';
        input.classList.add('rate');
        input.type = 'number';
        input.min = common.minPanRate;
        input.max = common.maxPanRate;
        input.step = common.stepPanRate;
        input.value = common.limitRate(panRate, common.defaultPanRate, common.minPanRate, common.maxPanRate, common.stepPanRate);
        input.setAttribute('default', common.defaultPanRate);
        input.addEventListener('change', () => {
            chrome.storage.local.set({ 'panRate': common.limitRate(input.value, common.defaultPanRate, common.minPanRate, common.maxPanRate, common.stepPanRate) });
        });
        return input;
    }

    function createSmoothToggle(checked) {
        const div = document.createElement('div');
        div.classList.add('toggle');

        const input = document.createElement('input');
        input.id = 'smooth';
        input.classList.add('checkbox');
        input.type = 'checkbox';
        input.checked = checked === undefined ? common.defaultSmooth : checked;
        input.setAttribute('default', common.defaultSmooth);
        input.addEventListener('change', () => {
            chrome.storage.local.set({ 'smooth': input.checked });
        });
        div.appendChild(input);

        const label = document.createElement('label');
        label.classList.add('switch');
        label.setAttribute('for', 'smooth');
        div.appendChild(label);

        return div;
    }

    function createSmoothLabel() {
        const div = document.createElement('div');
        div.classList.add('label');
        div.innerHTML = `Smoothing Interval (${common.minSmoothRate.toFixed(0)} ms ~ ${common.maxSmoothRate.toFixed(0)} ms)`;
        return div;
    }

    function createSmoothLabelDescription() {
        const div = document.createElement('div');
        div.classList.add('label');
        div.innerHTML = `${common.maxSmoothRate.toFixed(0)} ms: Lower load<br>${common.minSmoothRate.toFixed(0)} ms: Higher load`;
        return div;
    }

    function createSmoothInput(smoothRate) {
        const input = document.createElement('input');
        input.id = 'smoothRate';
        input.classList.add('rate');
        input.type = 'number';
        input.min = common.minSmoothRate;
        input.max = common.maxSmoothRate;
        input.step = common.stepSmoothRate;
        input.value = common.limitRate(smoothRate, common.defaultSmoothRate, common.minSmoothRate, common.maxSmoothRate, common.stepSmoothRate);
        input.setAttribute('default', common.defaultSmoothRate);
        input.addEventListener('change', () => {
            chrome.storage.local.set({ 'smoothRate': common.limitRate(input.value, common.defaultSmoothRate, common.minSmoothRate, common.maxSmoothRate, common.stepSmoothRate) });
        });
        return input;
    }

    function createEmptyCell() {
        const div = document.createElement('div');
        div.classList.add('label');
        return div;
    }

    chrome.storage.local.get(common.storage, (data) => {
        const row1 = document.querySelector('div#row1');
        row1.appendChild(createLabel('Enabled/Disabled'));
        row1.appendChild(createEnabledToggle(data.enabled));

        const row2 = document.querySelector('div#row2');
        row2.appendChild(createPanLabel());
        row2.appendChild(createPanInput(data.panRate));

        const row3 = document.querySelector('div#row3');
        row3.appendChild(createEmptyCell());
        row3.appendChild(createPanLabelDescription());

        const row4 = document.querySelector('div#row4');
        row4.appendChild(createLabel('Smooth panning (High CPU load)'));
        row4.appendChild(createSmoothToggle(data.smooth));

        const row5 = document.querySelector('div#row5');
        row5.appendChild(createSmoothLabel());
        row5.appendChild(createSmoothInput(data.smoothRate));

        const row6 = document.querySelector('div#row6');
        row6.appendChild(createEmptyCell());
        row6.appendChild(createSmoothLabelDescription());
    });

    document.querySelector('input#reset').addEventListener('click', () => {
        for (const input of document.querySelectorAll('input.checkbox')) {
            input.checked = input.getAttribute('default') === 'true';
        }
        for (const input of document.querySelectorAll('input.rate')) {
            input.value = input.getAttribute('default');
        }

        chrome.storage.local.clear();
    });
});
