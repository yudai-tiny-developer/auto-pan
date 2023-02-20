export const defaultPanRate = 1.6;
export const minPanRate = 0.0;
export const maxPanRate = 2.0;
export const stepPanRate = 0.1;

export function limitPanRate(value) {
    return step(range(normalize(value)));
}

function isNumber(value) {
    return Number.isFinite(parseFloat(value));
}

function normalize(value) {
    return isNumber(value) ? value : defaultPanRate;
}

function range(value) {
    return Math.min(Math.max(value, minPanRate), maxPanRate);
}

function step(value) {
    const step = 1.0 / stepPanRate;
    return Math.round(value * step) / step;
}
