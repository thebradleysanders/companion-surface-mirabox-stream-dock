import {
	CardGenerator,
	HostCapabilities,
	SurfaceDrawProps,
	SurfaceContext,
	SurfaceInstance,
	createModuleLogger,
	ModuleLogger,
	HIDDevice,
} from '@companion-surface/base'
import { setTimeout } from 'node:timers/promises'
import { getControlId } from './util.js'
import { StreamDock } from './streamdock.js'
import type { HIDAsync } from 'node-hid'
import type { StreamDockModelDefinition } from './models/list.js'

export class MiraboxWrapper implements SurfaceInstance {
	readonly #logger: ModuleLogger

	readonly #streamDock: StreamDock
	readonly #surfaceId: string
	readonly #context: SurfaceContext

	public get surfaceId(): string {
		return this.#surfaceId
	}
	public get productName(): string {
		return this.#streamDock.productName
	}

	public constructor(
		surfaceId: string,
		deviceInfo: HIDDevice,
		device: HIDAsync,
		model: StreamDockModelDefinition,
		context: SurfaceContext,
	) {
		this.#logger = createModuleLogger(`Instance/${surfaceId}`)
		this.#streamDock = new StreamDock(deviceInfo, device, model)
		this.#surfaceId = surfaceId
		this.#context = context

		this.#streamDock.on('error', (e) => context.disconnect(e as any))

		this.#streamDock.on('down', (control) => {
			this.#context.keyDownById(getControlId(control))
		})

		this.#streamDock.on('up', (control) => {
			this.#context.keyUpById(getControlId(control))
		})

		this.#streamDock.on('push', (control) => {
			this.#context.keyDownUpById(getControlId(control))
		})

		this.#streamDock.on('rotate', (control, amount) => {
			if (amount > 0) {
				this.#context.rotateRightById(getControlId(control))
			} else {
				this.#context.rotateLeftById(getControlId(control))
			}
		})
	}

	async init(): Promise<void> {
		await this.#streamDock.wakeScreen()
		await this.#streamDock.clearPanel()
	}

	async close(): Promise<void> {
		await this.#streamDock.clearPanel().catch(() => null)

		await this.#streamDock.close()
	}

	updateCapabilities(_capabilities: HostCapabilities): void {
		// Not used
	}

	async ready(): Promise<void> {}

	async setBrightness(percent: number): Promise<void> {
		await this.#streamDock.setBrightness(percent)
	}
	async blank(): Promise<void> {
		await this.#streamDock.clearPanel()
	}
	async draw(signal: AbortSignal, drawProps: SurfaceDrawProps): Promise<void> {
		const output = this.#streamDock.outputs.find((control) => getControlId(control) === drawProps.controlId)
		if (!output) return

		if (output.type === 'lcd') {
			if (!drawProps.image || output.resolutionx < 1 || output.resolutiony < 1) {
				return
			}

			const maxAttempts = 3
			for (let attempts = 1; attempts <= maxAttempts; attempts++) {
				try {
					if (signal.aborted) return

					await this.#streamDock.setKeyImage(output.column, output.row, Buffer.from(drawProps.image))
					return
				} catch (e) {
					if (signal.aborted) return

					if (attempts == maxAttempts) {
						this.#logger.debug(`fillImage failed after ${attempts} attempts: ${e}`)
						this.#context.disconnect(e as any)
						return
					}
					await setTimeout(20)
				}
			}
		}
	}
	async showStatus(_signal: AbortSignal, _cardGenerator: CardGenerator): Promise<void> {
		// TODO - not implemented
	}
}
