import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
// eslint-disable-next-line n/no-unpublished-import
import prettier from 'prettier'
import { AllModels } from '../src/models/list.js'
import type { SurfaceModuleManifest, SurfaceModuleManifestUsbIds } from '@companion-surface/base'

const require = createRequire(import.meta.url)

const manifestPath = path.join(import.meta.dirname, '../companion/manifest.json')

const usbIdsMap = new Map<number, SurfaceModuleManifestUsbIds>()

for (const element of AllModels) {
	for (const elementIds of element.usbIds) {
		const entry = usbIdsMap.get(elementIds.vendorId)
		if (!entry) {
			usbIdsMap.set(elementIds.vendorId, {
				vendorId: elementIds.vendorId,
				productIds: [...elementIds.productIds],
			})
		} else {
			entry.productIds.push(...elementIds.productIds)
		}
	}
}

const manifest: SurfaceModuleManifest = JSON.parse(await readFileSync(manifestPath, 'utf8'))

const manifestStr = JSON.stringify({
	...manifest,
	usbIds: Array.from(usbIdsMap.values()).map((entry) => ({
		vendorId: entry.vendorId,
		productIds: Array.from(new Set(entry.productIds)), // Make unique
	})),
})

const prettierConfig = await prettier.resolveConfig(manifestPath)

const formatted = await prettier.format(manifestStr, {
	...prettierConfig,
	parser: 'json',
})

writeFileSync(manifestPath, formatted)
