import(chrome.runtime.getURL('common.js')).then(common =>
    import(chrome.runtime.getURL('settings.js')).then(settings =>
        import(chrome.runtime.getURL('progress.js')).then(progress =>
            chrome.storage.local.get(common.storage, data =>
                main(common, settings, progress, data)
            )
        )
    )
);

function main(common, settings, progress, data) {
    const row_class = 'row';
    const cell_class = 'cell';
    const toggle_class = 'toggle';
    const label_class = 'switch';
    const input_class = 'rate';
    const progress_class = 'progress';
    const done_class = 'done';

    const container = document.body.querySelector('div#container');
    const reset_button = document.body.querySelector('input#reset');
    const progress_div = document.body.querySelector('div#reset_progress');

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
        row.appendChild(settings.createLabel(cell_class, 'Adjustment for multi-monitor'));
        row.appendChild(settings.createToggle(cell_class, toggle_class, label_class, 'multimonitor', data.multimonitor, common.defaultMultimonitor, common.value));
        container.appendChild(row);
    }

    settings.registerResetButton(reset_button, progress_div, progress_class, done_class, toggle_class, input_class, progress);
}