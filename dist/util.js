export function getControlId(control, xOffset = 0) {
    return `${control.row}/${control.column + xOffset}`;
}
export function getControlIdFromXy(column, row) {
    return `${row}/${column}`;
}
export function translateRotation(rotation) {
    if (rotation === 90)
        return 'CW270';
    if (rotation === -90)
        return 'CW90';
    if (rotation === 180)
        return 'CW180';
    return null;
}
//# sourceMappingURL=util.js.map