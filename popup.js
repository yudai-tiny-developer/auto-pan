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

function initContainer(settings, common) {
    chrome.storage.local.get(common.storage, data => {
        const container = document.querySelector('div#container');
        {
            const row = settings.createRow();
            row.appendChild(settings.createLabel('Enabled/Disabled'));
            row.appendChild(settings.createToggle('enabled', data.enabled, common.defaultEnabled, common.value));
            container.appendChild(row);
        } {
            const row = settings.createRow();
            row.appendChild(settings.createLabel(`Pan Rate (${common.minPanRate.toFixed(1)} ~ ${common.maxPanRate.toFixed(1)})`));
            row.appendChild(settings.createNumberStepInput('panRate', data.panRate, common.defaultPanRate, common.minPanRate, common.maxPanRate, common.stepPanRate, common.limitRate));
            container.appendChild(row);
        } {
            const row = settings.createRow();
            row.appendChild(settings.createLabel());
            row.appendChild(settings.createLabel(`${common.maxPanRate.toFixed(1)}: Rapidly panning<br>${common.minPanRate.toFixed(1)}: Gradually panning`));
            container.appendChild(row);
        } {
            const row = settings.createRow();
            row.appendChild(settings.createLabel('Use vertical'));
            row.appendChild(settings.createToggle('pan2d', data.pan2d, common.defaultpPan2d, common.value));
            container.appendChild(row);
        } {
            const row = settings.createRow();
            row.appendChild(settings.createLabel('Smooth panning (High CPU load)'));
            row.appendChild(settings.createToggle('smooth', data.smooth, common.defaultSmooth, common.value));
            container.appendChild(row);
        } {
            const row = settings.createRow();
            row.appendChild(settings.createLabel(`Smoothing Interval (${common.minSmoothRate.toFixed(0)} ms ~ ${common.maxSmoothRate.toFixed(0)} ms)`));
            row.appendChild(settings.createNumberStepInput('smoothRate', data.smoothRate, common.defaultSmoothRate, common.minSmoothRate, common.maxSmoothRate, common.stepSmoothRate, common.limitRate));
            container.appendChild(row);
        } {
            const row = settings.createRow();
            row.appendChild(settings.createLabel());
            row.appendChild(settings.createLabel(`${common.maxSmoothRate.toFixed(0)} ms: Lower load<br>${common.minSmoothRate.toFixed(0)} ms: Higher load`));
            container.appendChild(row);
        }
    });
}

function initResetButton(settings, progress) {
    const reset_button = document.querySelector('input#reset');
    const progress_div = document.querySelector('div#reset_progress');
    settings.registerResetButton(reset_button, progress_div, progress);
}