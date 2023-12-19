import(chrome.runtime.getURL('common.js')).then(common => {
    chrome.storage.local.get(common.storage, data => {
        const container = document.querySelector('div#container');

        createRow(container, row => {
            row.appendChild(createLabel('Enabled/Disabled'));
            row.appendChild(createToggle('enabled', data.enabled, common.defaultEnabled));
        });

        createRow(container, row => {
            row.appendChild(createLabel(`Pan Rate (${common.minPanRate.toFixed(1)} ~ ${common.maxPanRate.toFixed(1)})`));
            row.appendChild(createInput('panRate', data.panRate, common.defaultPanRate, common.minPanRate, common.maxPanRate, common.stepPanRate));
        });

        createRow(container, row => {
            row.appendChild(createLabel());
            row.appendChild(createLabel(`${common.maxPanRate.toFixed(1)}: Rapidly panning<br>${common.minPanRate.toFixed(1)}: Gradually panning`));
        });

        createRow(container, row => {
            row.appendChild(createLabel('Use vertical'));
            row.appendChild(createToggle('pan2d', data.pan2d, common.defaultpPan2d));
        });

        createRow(container, row => {
            row.appendChild(createLabel('Smooth panning (High CPU load)'));
            row.appendChild(createToggle('smooth', data.smooth, common.defaultSmooth));
        });

        createRow(container, row => {
            row.appendChild(createLabel(`Smoothing Interval (${common.minSmoothRate.toFixed(0)} ms ~ ${common.maxSmoothRate.toFixed(0)} ms)`));
            row.appendChild(createInput('smoothRate', data.smoothRate, common.defaultSmoothRate, common.minSmoothRate, common.maxSmoothRate, common.stepSmoothRate));
        });

        createRow(container, row => {
            row.appendChild(createLabel());
            row.appendChild(createLabel(`${common.maxSmoothRate.toFixed(0)} ms: Lower load<br>${common.minSmoothRate.toFixed(0)} ms: Higher load`));
        });
    });

    function createRow(container, gen) {
        const row = document.createElement('div');
        row.classList.add('row');
        gen(row);
        container.appendChild(row);
    }

    function createLabel(label = '') {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.innerHTML = label;
        return cell;
    }

    function createToggle(key, checked, defaultValue) {
        const cell = document.createElement('div');
        cell.classList.add('cell');

        const input = document.createElement('input');
        input.id = key;
        input.classList.add('toggle');
        input.type = 'checkbox';
        input.checked = checked === undefined ? defaultValue : checked;
        input.setAttribute('default', defaultValue);
        input.addEventListener('change', () => {
            chrome.storage.local.set({ [key]: input.checked });
        });
        cell.appendChild(input);

        const label = document.createElement('label');
        label.classList.add('switch');
        label.setAttribute('for', key);
        cell.appendChild(label);

        return cell;
    }

    function createInput(key, value, defaultValue, minRate, maxRate, stepRate) {
        const cell = document.createElement('div');
        cell.classList.add('cell');

        const input = document.createElement('input');
        input.id = key;
        input.classList.add('rate');
        input.type = 'number';
        input.value = common.limitRate(value, defaultValue, minRate, maxRate, stepRate);
        input.setAttribute('default', defaultValue);
        input.min = minRate;
        input.max = maxRate;
        input.step = stepRate;
        input.addEventListener('change', () => {
            chrome.storage.local.set({ [key]: common.limitRate(input.value, defaultValue, minRate, maxRate, stepRate) });
        });
        cell.appendChild(input);

        return cell;
    }

    document.querySelector('input#reset').addEventListener('click', () => {
        for (const input of document.querySelectorAll('input.toggle')) {
            input.checked = input.getAttribute('default') === 'true';
        }

        for (const input of document.querySelectorAll('input.rate')) {
            input.value = input.getAttribute('default');
        }

        chrome.storage.local.clear();
    });
});
