import { createModuleLogger, } from '@companion-surface/base';
import { setTimeout } from 'node:timers/promises';
import { getControlId, translateRotation } from './util.js';
import { StreamDock } from './streamdock.js';
import * as imageRs from '@julusian/image-rs';
export class MiraboxWrapper {
    #logger;
    #streamDock;
    #surfaceId;
    #context;
    get surfaceId() {
        return this.#surfaceId;
    }
    get productName() {
        return this.#streamDock.productName;
    }
    constructor(surfaceId, deviceInfo, device, model, context) {
        this.#logger = createModuleLogger(`Instance/${surfaceId}`);
        this.#streamDock = new StreamDock(deviceInfo, device, model);
        this.#surfaceId = surfaceId;
        this.#context = context;
        this.#streamDock.on('error', (e) => context.disconnect(e));
        this.#streamDock.on('down', (control) => {
            this.#context.keyDownById(getControlId(control));
        });
        this.#streamDock.on('up', (control) => {
            this.#context.keyUpById(getControlId(control));
        });
        this.#streamDock.on('push', (control) => {
            this.#context.keyDownUpById(getControlId(control));
        });
        this.#streamDock.on('rotate', (control, amount) => {
            if (amount > 0) {
                this.#context.rotateRightById(getControlId(control));
            }
            else {
                this.#context.rotateLeftById(getControlId(control));
            }
        });
    }
    async init() {
        await this.#streamDock.wakeScreen();
        await this.#streamDock.clearPanel();
    }
    async close() {
        await this.#streamDock.clearPanel().catch(() => null);
        await this.#streamDock.close();
    }
    updateCapabilities(_capabilities) {
        // Not used
    }
    async ready() { }
    async setBrightness(percent) {
        await this.#streamDock.setBrightness(percent);
    }
    async blank() {
        await this.#streamDock.clearPanel();
    }
    async draw(signal, drawProps) {
        const output = this.#streamDock.outputs.find((control) => getControlId(control) === drawProps.controlId);
        if (!output)
            return;
        if (output.type === 'lcd') {
            if (!drawProps.image || output.resolutionx < 1 || output.resolutiony < 1) {
                return;
            }
            const imageRsRotation = translateRotation(this.#streamDock.iconRotation);
            let rotatedBitmap = drawProps.image;
            if (imageRsRotation) {
                let image = imageRs.ImageTransformer.fromBuffer(drawProps.image, output.resolutionx, output.resolutiony, 'rgb').rotate(imageRsRotation);
                // pad, in case a button is non-square
                const dimensions = image.getCurrentDimensions();
                const xOffset = (output.resolutionx - dimensions.width) / 2;
                const yOffset = (output.resolutiony - dimensions.height) / 2;
                image = image.pad(Math.floor(xOffset), Math.ceil(xOffset), Math.floor(yOffset), Math.ceil(yOffset), {
                    red: 0,
                    green: 0,
                    blue: 0,
                    alpha: 255,
                });
                const computedImage = await image.toBuffer('rgb');
                rotatedBitmap = computedImage.buffer;
            }
            const maxAttempts = 3;
            for (let attempts = 1; attempts <= maxAttempts; attempts++) {
                try {
                    if (signal.aborted)
                        return;
                    await this.#streamDock.setKeyImage(output.column, output.row, Buffer.from(rotatedBitmap));
                    return;
                }
                catch (e) {
                    if (signal.aborted)
                        return;
                    if (attempts == maxAttempts) {
                        this.#logger.debug(`fillImage failed after ${attempts} attempts: ${e}`);
                        this.#context.disconnect(e);
                        return;
                    }
                    await setTimeout(20);
                }
            }
        }
    }
    async showStatus(_signal, _cardGenerator) {
        // TODO - not implemented
    }
}
//# sourceMappingURL=instance.js.map