import type { StreamDockInputDefinition, StreamDockOutputDefinition } from './models/list.js'

export function getControlId(control: StreamDockInputDefinition | StreamDockOutputDefinition, xOffset = 0): string {
	return `${control.row}/${control.column + xOffset}`
}
export function getControlIdFromXy(column: number, row: number): string {
	return `${row}/${column}`
}
