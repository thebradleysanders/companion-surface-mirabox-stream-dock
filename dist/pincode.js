import { getControlIdFromXy } from './util.js';
export function generatePincodeMap(_model) {
    // TODO - layouts based on the model. perhaps it should be part of StreamDockModelDefinition?
    return {
        type: 'single-page',
        pincode: getControlIdFromXy(0, 1),
        0: getControlIdFromXy(4, 1),
        1: getControlIdFromXy(1, 2),
        2: getControlIdFromXy(2, 2),
        3: getControlIdFromXy(3, 2),
        4: getControlIdFromXy(1, 1),
        5: getControlIdFromXy(2, 1),
        6: getControlIdFromXy(3, 1),
        7: getControlIdFromXy(1, 0),
        8: getControlIdFromXy(2, 0),
        9: getControlIdFromXy(3, 0),
    };
}
//# sourceMappingURL=pincode.js.map