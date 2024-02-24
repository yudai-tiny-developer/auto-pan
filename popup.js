import(chrome.runtime.getURL('common.js')).then(common =>
    import(chrome.runtime.getURL('settings.js')).then(settings =>
        import(chrome.runtime.getURL('progress.js')).then(progress =>
            main(common, settings, progress)
        )
    )
);

function main(common, settings, progress) {
    initContainer(settings, common);
    initResetButton(settings, progress);
}

const row_class = 'row';
const cell_class = 'cell';
const toggle_class = 'toggle';
const label_class = 'switch';
const input_class = 'rate';

function initContainer(settings, common) {
    chrome.storage.local.get(common.storage, data => {
        const container = document.querySelector('div#container');
        {
            const row = settings.createRow(row_class);
            row.appendChild(settings.createLabel(cell_class, 'Enabled/Disabled'));
            row.appendChild(settings.createToggle(cell_class, toggle_class, label_class, 'enabled', data.enabled, common.defaultEnabled, common.value));
            container.appendChild(row);
        } {
            const row = settings.createRow(row_class);
            row.appendChild(settings.createLabel(cell_class, `Pan Rate (${common.minPanRate.toFixed(1)} ~ ${common.maxPanRate.toFixed(1)})`));
            row.appendChild(settings.createNumberStepInput(cell_class, input_class, 'panRate', data.panRate, common.defaultPanRate, common.minPanRate, common.maxPanRate, common.stepPanRate, common.limitRate));
            container.appendChild(row);
        } {
            const row = settings.createRow(row_class);
            row.appendChild(settings.createLabel(cell_class));
            row.appendChild(settings.createLabel(cell_class, `${common.maxPanRate.toFixed(1)}: Rapidly panning<br>${common.minPanRate.toFixed(1)}: Gradually panning`));
            container.appendChild(row);
        } {
            const row = settings.createRow(row_class);
            row.appendChild(settings.createLabel(cell_class, 'Use vertical'));
            row.appendChild(settings.createToggle(cell_class, toggle_class, label_class, 'pan2d', data.pan2d, common.defaultpPan2d, common.value));
            container.appendChild(row);
        } {
            const row = settings.createRow(row_class);
            row.appendChild(settings.createLabel(cell_class, 'Smooth panning (High CPU load)'));
            row.appendChild(settings.createToggle(cell_class, toggle_class, label_class, 'smooth', data.smooth, common.defaultSmooth, common.value));
            container.appendChild(row);
        } {
            const row = settings.createRow(row_class);
            row.appendChild(settings.createLabel(cell_class, `Smoothing Interval (${common.minSmoothRate.toFixed(0)} ms ~ ${common.maxSmoothRate.toFixed(0)} ms)`));
            row.appendChild(settings.createNumberStepInput(cell_class, input_class, 'smoothRate', data.smoothRate, common.defaultSmoothRate, common.minSmoothRate, common.maxSmoothRate, common.stepSmoothRate, common.limitRate));
            container.appendChild(row);
        } {
            const row = settings.createRow(row_class);
            row.appendChild(settings.createLabel(cell_class));
            row.appendChild(settings.createLabel(cell_class, `${common.maxSmoothRate.toFixed(0)} ms: Lower load<br>${common.minSmoothRate.toFixed(0)} ms: Higher load`));
            container.appendChild(row);
        }
    });
}

const progress_class = 'progress';
const done_class = 'done';

function initResetButton(settings, progress) {
    const reset_button = document.querySelector('input#reset');
    const progress_div = document.querySelector('div#reset_progress');
    settings.registerResetButton(reset_button, progress_div, progress_class, done_class, toggle_class, input_class, progress);
}