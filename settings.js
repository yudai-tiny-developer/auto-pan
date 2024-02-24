export function createRow() {
    const div = document.createElement('div');
    div.classList.add('row');
    return div;
}

export function createLabel(label = '') {
    const div = document.createElement('div');
    div.classList.add('cell');
    div.innerHTML = label;
    return div;
}

export function createToggle(key, checked, defaultValue, checkForDefault) {
    const div = document.createElement('div');
    div.classList.add('cell');

    const input = document.createElement('input');
    input.id = key;
    input.classList.add('toggle');
    input.type = 'checkbox';
    input.checked = checkForDefault(checked, defaultValue);

    input.setAttribute('default', defaultValue);
    input.addEventListener('change', () => {
        chrome.storage.local.set({ [key]: input.checked });
    });
    div.appendChild(input);

    const label = document.createElement('label');
    label.classList.add('switch');
    label.setAttribute('for', key);
    div.appendChild(label);

    return div;
}

export function createNumberStepInput(key, value, defaultValue, minRate, maxRate, stepRate, limitRate) {
    const div = document.createElement('div');
    div.classList.add('cell');

    const input = document.createElement('input');
    input.id = key;
    input.classList.add('rate');
    input.type = 'number';
    input.value = limitRate(value, defaultValue, minRate, maxRate, stepRate);
    input.setAttribute('default', defaultValue);
    input.min = minRate;
    input.max = maxRate;
    input.step = stepRate;
    input.addEventListener('change', () => {
        chrome.storage.local.set({ [key]: limitRate(input.value, defaultValue, minRate, maxRate, stepRate) });
    });
    div.appendChild(input);

    return div;
}

let state = {};

export function registerResetButton(reset_button, progress_div, progress) {
    reset_button.addEventListener('mousedown', () => progress.startProgress(progress_div, state));
    reset_button.addEventListener('touchstart', () => progress.startProgress(progress_div, state));

    reset_button.addEventListener('mouseleave', () => progress.endProgress(progress_div, state));
    reset_button.addEventListener('touchmove', event => {
        const touch = event.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target !== reset_button) {
            progress.endProgress(progress_div, state);
        }
    });
    reset_button.addEventListener('touchcancel', () => progress.endProgress(progress_div, state));

    reset_button.addEventListener('mouseup', () => progress.endProgress(progress_div, state, resetSettings));
    reset_button.addEventListener('touchend', () => progress.endProgress(progress_div, state, resetSettings));
}

function resetSettings() {
    for (const input of document.querySelectorAll('input.toggle')) {
        input.checked = input.getAttribute('default') === 'true';
    }

    for (const input of document.querySelectorAll('input.rate')) {
        input.value = input.getAttribute('default');
    }

    chrome.storage.local.clear();
}