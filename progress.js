export function startProgress(div, state) {
    clearTimeout(state.holdTimeout);
    div.classList.add('progress');
    div.classList.remove('done');
    state.done = false;

    state.holdTimeout = setTimeout(() => {
        div.classList.remove('progress');
        div.classList.add('done');
        state.done = true;
    }, 1000);
}

export function endProgress(div, state, callback) {
    clearTimeout(state.holdTimeout);
    div.classList.remove('progress', 'done');
    if (callback && state.done) {
        callback();
    }
    state.done = false;
}