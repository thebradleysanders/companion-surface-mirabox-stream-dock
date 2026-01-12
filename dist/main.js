import { createModuleLogger, } from '@companion-surface/base';
import { generatePincodeMap } from './pincode.js';
import { MiraboxWrapper } from './instance.js';
import { createSurfaceSchema } from './surface-schema.js';
import { HIDAsync } from 'node-hid';
import { AllModels } from './models/list.js';
const logger = createModuleLogger('Plugin');
const MiraboxPlugin = {
    init: async () => {
        // Nothing to do
    },
    destroy: async () => {
        // Nothing to do
    },
    checkSupportsHidDevice: (device) => {
        if (device.interface !== 0)
            return null;
        // Match the device against known models
        const model = AllModels.find((model) => model.usbIds.some((usbId) => usbId.vendorId === device.vendorId && usbId.productIds.includes(device.productId)));
        if (!model)
            return null;
        logger.debug(`Checked HID device: ${model.productName}`);
        return {
            surfaceId: `streamdock:${device.serialNumber}`,
            description: `Mirabox ${model.productName}`,
            pluginInfo: {
                device,
                model,
            },
        };
    },
    openSurface: async (surfaceId, pluginInfo, context) => {
        const device = await HIDAsync.open(pluginInfo.device.path).catch(() => {
            throw new Error('Device not found');
        });
        logger.debug(`Opening ${pluginInfo.device.path} device: ${pluginInfo.model.productName} (${surfaceId})`);
        return {
            surface: new MiraboxWrapper(surfaceId, pluginInfo.device, device, pluginInfo.model, context),
            registerProps: {
                brightness: true,
                surfaceLayout: createSurfaceSchema(pluginInfo.model),
                pincodeMap: generatePincodeMap(pluginInfo.model),
                configFields: null,
                location: null,
            },
        };
    },
};
export default MiraboxPlugin;
//# sourceMappingURL=main.js.map