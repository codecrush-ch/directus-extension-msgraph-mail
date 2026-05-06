import { existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { Liquid } from 'liquidjs'

const TEMPLATES_SUBPATH = 'dist/services/mail/templates'

let engine: Liquid | null = null

function findInPnpmStore(baseDir: string): string | null {
	const pnpmDir = path.join(baseDir, 'node_modules/.pnpm')
	if (!existsSync(pnpmDir)) return null

	try {
		const entries = readdirSync(pnpmDir)
		const apiEntries = entries.filter((entry) => entry.startsWith('@directus+api@'))
		for (const entry of apiEntries) {
			const candidate = path.join(pnpmDir, entry, 'node_modules/@directus/api', TEMPLATES_SUBPATH)
			if (existsSync(candidate)) return candidate
		}
	} catch {
		// ignore
	}

	return null
}

function resolveDirectusTemplatesPath(): string | null {
	const packageNames = ['@directus/api', 'directus']

	try {
		const require = createRequire(import.meta.url)
		for (const name of packageNames) {
			try {
				const pkgPath = require.resolve(`${name}/package.json`)
				const candidate = path.join(path.dirname(pkgPath), TEMPLATES_SUBPATH)
				if (existsSync(candidate)) return candidate
			} catch {
				// try next
			}
		}
	} catch {
		// ignore
	}

	const baseDirs = ['/directus', process.cwd()]
	for (const baseDir of baseDirs) {
		for (const name of ['@directus/api', 'directus']) {
			const candidate = path.join(baseDir, 'node_modules', name, TEMPLATES_SUBPATH)
			if (existsSync(candidate)) return candidate
		}

		const pnpmHit = findInPnpmStore(baseDir)
		if (pnpmHit) return pnpmHit
	}

	return null
}

function getEngine(env: Record<string, string>, logger?: { info: (msg: string) => void; warn: (msg: string) => void }): Liquid {
	if (engine) return engine

	const roots: string[] = []

	const customPath = env['EMAIL_TEMPLATES_PATH']
	if (customPath) {
		const resolved = path.resolve(customPath)
		if (existsSync(resolved)) roots.push(resolved)
	}

	const directusTemplates = resolveDirectusTemplatesPath()
	if (directusTemplates) {
		roots.push(directusTemplates)
	} else {
		logger?.warn('[msgraph-mail] Could not locate built-in Directus mail templates. Template-based emails (password reset, invitations) will fail unless EMAIL_TEMPLATES_PATH provides them.')
	}

	logger?.info(`[msgraph-mail] Liquid template roots: ${JSON.stringify(roots)}`)

	engine = new Liquid({
		root: roots,
		extname: '.liquid',
	})

	return engine
}

export async function renderTemplate(
	env: Record<string, string>,
	templateName: string,
	data: Record<string, unknown>,
	logger?: { info: (msg: string) => void; warn: (msg: string) => void }
): Promise<string> {
	const liquid = getEngine(env, logger)
	return await liquid.renderFile(templateName, data)
}
