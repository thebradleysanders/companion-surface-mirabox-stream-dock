import EventEmitter from 'node:events';
import jpg from '@julusian/jpeg-turbo';
/**
 * Class Definition for the Mirabox Stream Dock
 *
 */
export class StreamDock extends EventEmitter {
    static cmdPrefix = [0x43, 0x52, 0x54, 0, 0];
    info;
    device;
    model;
    get packetSize() {
        return this.model.packetSize ?? 1024;
    }
    constructor(deviceInfo, device, model) {
        super();
        this.info = deviceInfo;
        this.device = device;
        this.model = model;
        this.device.on('error', (error) => {
            console.error(`Stream Dock Error: ${error}`);
            this.emit('error', error);
        });
        this.device.on('data', (data) => {
            // console.log(`received data ${Array.from(data).slice(0,16).map(d => (d as number).toString(16))}`)
            if (data.length >= 11) {
                const functionRaw = data[9];
                const parameterRaw = data[10];
                const action = this.model.inputs.find((input) => {
                    return input.id === functionRaw;
                });
                if (action) {
                    if (action.type === 'button') {
                        if (parameterRaw === 0x00) {
                            this.emit('up', action);
                        }
                        else {
                            this.emit('down', action);
                        }
                    }
                    else if (action.type === 'push') {
                        this.emit('push', action);
                    }
                    else if (action.type === 'rotateLeft') {
                        this.emit('rotate', action, -1);
                    }
                    else if (action.type === 'rotateRight') {
                        this.emit('rotate', action, 1);
                    }
                    else if (action.type === 'swipeLeft') {
                        this.emit('rotate', action, -1);
                    }
                    else if (action.type === 'swipeRight') {
                        this.emit('rotate', action, 1);
                    }
                    else {
                        console.error(`Unknown action received: ${parameterRaw} from ${this.info.path}`);
                    }
                }
            }
        });
    }
    /**
     * Sends a command to the device async
     *
     * The command will be packetized in packages of packetSize bytes. Smaller commands are zero-padded, larger commands are chunked. The packets might be written interrupted by other writes.
     * @param data the data to be sent
     * @param prefix optional prefix. If not set, the default prefix will be used
     */
    async sendCmd(data, prefix = StreamDock.cmdPrefix) {
        if (!Buffer.isBuffer(data)) {
            data = Buffer.from(data);
        }
        const prefixbuffer = Buffer.from(prefix);
        // const writebuffer = Buffer.concat([prefixbuffer, data], StreamDock.packetSize)
        const writebuffer = Buffer.concat([Buffer.from([0]), prefixbuffer, data], this.packetSize + 1);
        // if (writebuffer.byteLength != StreamDock.packetSize) {
        if (writebuffer.byteLength != this.packetSize + 1) {
            console.error(`Data length problem while sending packet to stream dock. Should be ${this.packetSize}B, but is ${writebuffer.byteLength}B. Payload size is ${data.length}B and prefix is [${prefix.join(',')}] `);
        }
        await this.writeRaw(writebuffer).catch((e) => {
            throw new Error('Sending command to Stream Dock failed ' + e);
        });
        if (data.byteLength + prefixbuffer.byteLength > this.packetSize) {
            const remain = data.subarray(this.packetSize - prefixbuffer.byteLength);
            await this.sendCmd(remain, []).catch((e) => {
                console.error('Sending remaining data to Stream Dock failed ' + e);
            });
        }
    }
    /**
     * Sends a command to the device sync
     *
     * The command will be packetized in packages of packetSize bytes. Smaller commands are zero-padded, larger commands are chunked.
     * @param data the data to be sent
     * @param prefix optional prefix. If not set, the default prefix will be used
     */
    async sendCmdSync(data, prefix = StreamDock.cmdPrefix) {
        if (!Buffer.isBuffer(data)) {
            data = Buffer.from(data);
        }
        const prefixbuffer = Buffer.from(prefix);
        // const writebuffer = Buffer.concat([prefixbuffer, data], StreamDock.packetSize)
        const writebuffer = Buffer.concat([Buffer.from([0]), prefixbuffer, data], this.packetSize + 1);
        // if (writebuffer.byteLength != StreamDock.packetSize) {
        if (writebuffer.byteLength != this.packetSize + 1) {
            console.error(`Data length problem while sending packet to stream dock. Should be ${this.packetSize}B, but is ${writebuffer.byteLength}B. Payload size is ${data.length}B and prefix is [${prefix.join(',')}] `);
        }
        let sendpr;
        const writepr = this.writeRaw(writebuffer);
        if (data.byteLength + prefixbuffer.byteLength > this.packetSize) {
            const remain = data.subarray(this.packetSize - prefixbuffer.byteLength);
            sendpr = this.sendCmdSync(remain, []);
        }
        if (sendpr instanceof Promise) {
            return sendpr;
        }
        if (writepr instanceof Promise) {
            return writepr;
        }
        throw new Error('Unknown error during sync send');
    }
    // /**
    //  * Sets the different layout variations of the stream dock N4
    //  * @param layout
    //  */
    // setLayout(layout: '1234' | '1245') {
    // 	if (this.model?.productName === 'Stream Dock N4') {
    // 		const newmodel = StreamDock.models[`N4-${layout}`]
    // 		if (newmodel !== undefined) {
    // 			this.model = newmodel
    // 		}
    // 	}
    // }
    get serialNumber() {
        return this.info.serialNumber;
    }
    get productName() {
        return this.model.productName ?? 'Unknown';
    }
    /**
     * The amount of columns found in the surface
     */
    get columns() {
        return (Math.max(...this.model.inputs.map((input) => input.column), ...this.model.outputs.map((output) => output.column)) + 1);
    }
    /**
     * The amount of rows found in the surface
     */
    get rows() {
        return (Math.max(...this.model.inputs.map((input) => input.row), ...this.model.outputs.map((output) => output.row)) + 1);
    }
    get outputs() {
        return this.model.outputs;
    }
    get iconRotation() {
        return this.model.iconRotation;
    }
    async writeRaw(data) {
        const written = await this.device.write(data).catch(() => {
            throw new Error('Write to Stream Dock failed!');
        });
        if (typeof written === 'number' && written !== data.length) {
            throw new Error('Write to Stream Dock failed');
        }
    }
    async wakeScreen() {
        await this.sendCmd([0x44, 0x49, 0x53]).catch((e) => {
            console.error('Sending wake screen to Stream Dock failed ' + e);
        });
    }
    async clearPanel() {
        await this.sendCmd([0x43, 0x4c, 0x45, 0, 0, 0, 0xff]).catch((e) => {
            console.error('Sending clear panel to Stream Dock failed ' + e);
        });
    }
    async refresh() {
        await this.sendCmd([0x53, 0x54, 0x50]).catch((e) => {
            console.error('Sending refresh to Stream Dock failed ' + e);
        });
    }
    async setBrightness(value) {
        const clamped = Math.max(Math.min(value, 100), 0);
        const y = Math.pow(clamped / 100, 0.75);
        const brightness = Math.round(y * 100);
        await this.sendCmd([0x4c, 0x49, 0x47, 0, 0, brightness]).catch((e) => {
            console.error('Sending brightness to Stream Dock failed ' + e);
        });
    }
    async setKeyImage(column, row, imageBuffer) {
        const output = this.outputs.find((output) => output.row === row && output.column === column);
        if (!output)
            return;
        // console.log('sending image', column, row, output.id)
        let imgData = Buffer.from([]);
        let size = 0xffffff;
        let quality;
        for (quality = 90; quality > 11; quality -= 10) {
            // 90% quality will fit almost all images in the 10k limit
            const options = {
                format: jpg.FORMAT_RGB,
                width: output.resolutionx,
                height: output.resolutiony,
                subsampling: jpg.SAMP_422,
                quality,
            };
            try {
                imgData = jpg.compressSync(imageBuffer, options);
            }
            catch (error) {
                console.error(`compressing jpg at position ${row}/${column} failed`, error);
            }
            // console.log('imgData', Array.from(imgData).map(d => d.toString(16).padStart(2, '0')).join(' '))
            size = imgData.byteLength;
            if (size <= 10240)
                break;
        }
        if (size > 10240) {
            imgData = imgData.subarray(0, 10240);
            console.error(`Streamdock image at position ${row}/${column} could not be compressed to 10KB or less, truncating to 10KB`);
        }
        // console.log(`image ${row}/${column} size ${size}B compression ${quality}%`)
        this.sendCmdSync([
            0x42,
            0x41,
            0x54,
            (size >> 24) & 0xff,
            (size >> 16) & 0xff,
            (size >> 8) & 0xff,
            size & 0xff,
            output.id,
        ]).catch((e) => {
            console.error('Sending set image command to Stream Dock failed ' + e);
        });
        this.sendCmdSync(imgData, []).catch((e) => {
            console.error('Sending image data to Stream Dock failed ' + e);
        });
        await this.refresh();
    }
    async clearKeyImage(keyId) {
        await this.sendCmd([0x43, 0x4c, 0x45, 0, 0, 0, keyId]).catch((e) => {
            console.error('Sending clear key image to Stream Dock failed ' + e);
        });
    }
    async sendHeartbeat() {
        await this.sendCmd([0x43, 0x4f, 0x4e, 0x4e, 0x45, 0x43, 0x54]).catch((e) => {
            console.error('Sending heartbeat to Stream Dock failed ' + e);
        });
    }
    async close() {
        await this.sendCmd([0x43, 0x4c, 0x45, 0, 0, 0x44, 0x43]).catch((e) => {
            console.error('Sending close to Stream Dock failed ' + e);
        });
        await this.device.close();
    }
}
//# sourceMappingURL=streamdock.js.map