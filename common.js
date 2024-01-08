export const storage = ['enabled', 'panRate', 'pan2d', 'smooth', 'smoothRate'];

export const defaultEnabled = true;

export const defaultPanRate = 1.6;
export const minPanRate = 0.0;
export const maxPanRate = 2.0;
export const stepPanRate = 0.1;

export const defaultPan2d = false;

export const defaultSmooth = false;
export const defaultSmoothRate = 250;
export const minSmoothRate = 50;
export const maxSmoothRate = 1000;
export const stepSmoothRate = 50;

export function value(value, defaultValue) {
    return value === undefined ? defaultValue : value;
}

export function limitRate(value, defaultValue, minRate, maxRate, stepRate) {
    return step(range(normalize(value, defaultValue), minRate, maxRate), stepRate);
}

function isNumber(value) {
    return Number.isFinite(parseFloat(value));
}

function normalize(value, defaultValue) {
    return isNumber(value) ? value : defaultValue;
}

function range(value, minRate, maxRate) {
    return Math.min(Math.max(value, minRate), maxRate);
}

function step(value, stepRate) {
    const step = 1.0 / stepRate;
    return Math.round(value * step) / step;
}
