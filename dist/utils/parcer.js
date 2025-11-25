"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCurrency = parseCurrency;
function parseCurrency(value) {
    if (!value)
        return 0;
    // Оставляем только цифры, точку и минус
    const cleaned = value.replace(/[^0-9.-]+/g, '');
    return parseFloat(cleaned) || 0;
}
