import type { StreamDockModelDefinition } from './list.js'
import { HSV_293S_2Definition } from './HSV-293S-2.js'

export const Ajaz_AKP153Definition: StreamDockModelDefinition = {
	...HSV_293S_2Definition,
	productName: 'AJAZZ AKP-153',
	usbIds: [
		{
			vendorId: 0x5548,
			productIds: [0x6674],
		},
		{
			vendorId: 0x0300,
			productIds: [0x1010],
		},
	],
}
