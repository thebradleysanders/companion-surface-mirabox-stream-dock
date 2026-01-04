import type { StreamDockInputDefinition, StreamDockOutputDefinition } from './models/list.js'
import type * as imageRs from '@julusian/image-rs'

export function getControlId(control: StreamDockInputDefinition | StreamDockOutputDefinition, xOffset = 0): string {
	return `${control.row}/${control.column + xOffset}`
}
export function getControlIdFromXy(column: number, row: number): string {
	return `${row}/${column}`
}

export function translateRotation(rotation: number | null): imageRs.RotationMode | null {
	if (rotation === 90) return 'CW270'
	if (rotation === -90) return 'CW90'
	if (rotation === 180) return 'CW180'
	return null
}
