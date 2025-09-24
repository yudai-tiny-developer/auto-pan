import(chrome.runtime.getURL('common.js')).then(common =>
    import(chrome.runtime.getURL('settings.js')).then(settings =>
        import(chrome.runtime.getURL('progress.js')).then(progress =>
            chrome.storage.local.get(common.storage, data =>
                main(common, settings, progress, data)
            )
        )
    )
);

function renderDisplays(displays, mode) {
    document.getElementById('preview-title').style.display = 'block';

    const preview = document.getElementById('preview');
    preview.innerHTML = '';
    preview.style.display = 'block';

    if (mode === 3) {
        preview.style.borderColor = '#ff0000';
    } else {
        preview.style.borderColor = '';
    }

    const previewW = preview.clientWidth;
    const previewH = preview.clientHeight;

    const leftMin = Math.min(...displays.map(d => d.bounds.left));
    const topMin = Math.min(...displays.map(d => d.bounds.top));
    const rightMax = Math.max(...displays.map(d => d.bounds.left + d.bounds.width));
    const bottomMax = Math.max(...displays.map(d => d.bounds.top + d.bounds.height));
    const overallBounds = { left: leftMin, top: topMin, width: rightMax - leftMin, height: bottomMax - topMin };

    const scaleX = previewW / overallBounds.width;
    const scaleY = previewH / overallBounds.height;
    const scale = Math.min(scaleX, scaleY);

    const primary = displays.find(d => d.isPrimary);

    for (const display of displays) {
        const b = display.bounds;

        const scaledLeft = (b.left - overallBounds.left) * scale;
        const scaledTop = (b.top - overallBounds.top) * scale;
        const scaledWidth = b.width * scale;
        const scaledHeight = b.height * scale;

        let centerX;
        if (mode === 1) {
            centerX = (b.left + b.width / 2.0);
        } else if (mode === 2 && primary) {
            centerX = (primary.bounds.left + primary.bounds.width / 2.0);
        } else if (mode === 3) {
            centerX = overallBounds.left + overallBounds.width / 2.0;
        }

        const scaledCenterX = (centerX - overallBounds.left) * scale;

        const displayDiv = document.createElement('div');
        displayDiv.classList.add('preview-display');
        displayDiv.style.left = scaledLeft + 'px';
        displayDiv.style.top = scaledTop + 'px';
        displayDiv.style.width = scaledWidth + 'px';
        displayDiv.style.height = scaledHeight + 'px';
        if (mode === 1 || mode === 2 && display.isPrimary) {
            displayDiv.classList.add('preview-display-base');
        } else {
            displayDiv.classList.remove('preview-display-base');
        }
        displayDiv.innerText = display.name;

        const leftDiv = document.createElement('div');
        leftDiv.classList.add('preview-display-left');
        leftDiv.style.left = '0px';
        leftDiv.style.top = '0px';
        leftDiv.style.width = Math.max(0, scaledCenterX - scaledLeft) + 'px';
        leftDiv.style.height = scaledHeight + 'px';
        displayDiv.appendChild(leftDiv);

        const rightDiv = document.createElement('div');
        rightDiv.classList.add('preview-display-right');
        rightDiv.style.left = (scaledCenterX - scaledLeft) + 'px';
        rightDiv.style.top = '0px';
        rightDiv.style.width = Math.max(0, scaledLeft + scaledWidth - scaledCenterX) + 'px';
        rightDiv.style.height = scaledHeight + 'px';
        displayDiv.appendChild(rightDiv);

        preview.appendChild(displayDiv);
    }

    const overallDiv = document.createElement('div');
    overallDiv.classList.add('preview-display-overall');
    overallDiv.style.left = '0px';
    overallDiv.style.top = '0px';
    overallDiv.style.width = overallBounds.width * scale + 'px';
    overallDiv.style.height = overallBounds.height * scale + 'px';
    if (mode === 3) {
        overallDiv.classList.add('preview-display-base');
    } else {
        overallDiv.classList.remove('preview-display-base');
    }
    preview.appendChild(overallDiv);
}

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

    let input1;
    let input2;

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
        row.appendChild(settings.createLabel(cell_class, 'Adjust primary monitor'));
        const { div, input } = settings.createToggle2(cell_class, toggle_class, label_class, 'multimonitor', data.multimonitor, common.defaultMultimonitor, common.value)
        row.appendChild(div);
        container.appendChild(row);
        input1 = input;
    } {
        const row = settings.createRow(row_class);
        row.appendChild(settings.createLabel(cell_class, 'Adjust all monitors'));
        const { div, input } = settings.createToggle2(cell_class, toggle_class, label_class, 'multimonitor_all', data.multimonitor_all, common.defaultMultimonitor_all, common.value)
        row.appendChild(div);
        container.appendChild(row);
        input2 = input;
    }

    input1.addEventListener('change', () => {
        if (input1.checked && input2.checked) {
            input2.checked = false;
            input2.dispatchEvent(new CustomEvent('change'));
        }
    });

    input2.addEventListener('change', () => {
        if (input1.checked && input2.checked) {
            input1.checked = false;
            input1.dispatchEvent(new CustomEvent('change'));
        }
    });

    settings.registerResetButton(reset_button, progress_div, progress_class, done_class, toggle_class, input_class, progress);

    function update_preview() {
        chrome.storage.local.get(common.storage, data => {
            chrome.system.display.getInfo().then(displays => {
                if (displays.length > 1) {
                    const mode = data.multimonitor ? 2 : data.multimonitor_all ? 3 : 1
                    renderDisplays(displays, mode);
                } else {
                    document.getElementById('preview').style.display = '';
                    document.getElementById('preview-title').style.display = '';
                }
            });
        });
    }

    update_preview();
    chrome.storage.onChanged.addListener(update_preview);
}