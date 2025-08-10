export const storage = ['enabled', 'panRate', 'pan2d', 'multimonitor'];

export const defaultEnabled = true;

export const defaultPanRate = 1.6;
export const minPanRate = 0.1;
export const maxPanRate = 2.0;
export const stepPanRate = 0.1;

export const defaultPan2d = false;
export const defaultMultimonitor = false;

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
