import { defineHook } from '@directus/extensions-sdk'
import { getConfigFromEnv, sendMailViaGraph } from '../shared/graph-client'
import { renderTemplate } from '../shared/template'
import type { DefaultTemplateData, DirectusEmailOptions } from '../shared/types'
import { convertToGraphMessage } from '../shared/utils'

function joinUrl(base: string, ...segments: string[]): string {
	const trimmedBase = base.replace(/\/+$/, '')
	const trimmedSegments = segments
		.map((segment) => segment.replace(/^\/+|\/+$/g, ''))
		.filter(Boolean)
	return [trimmedBase, ...trimmedSegments].join('/')
}

async function getDefaultTemplateData(
	database: any,
	env: Record<string, string>
): Promise<DefaultTemplateData> {
	let settings: Record<string, string | null> | undefined

	try {
		settings = await database
			.select(['project_name', 'project_logo', 'project_color', 'project_url'])
			.from('directus_settings')
			.first()
	} catch {
		settings = undefined
	}

	const publicUrl = env['PUBLIC_URL'] || ''
	const projectLogo = settings?.['project_logo']
		? joinUrl(publicUrl, 'assets', settings['project_logo'])
		: joinUrl(publicUrl, 'admin/img/directus-white.png')

	return {
		projectName: settings?.['project_name'] || 'Directus',
		projectColor: settings?.['project_color'] || '#171717',
		projectLogo,
		projectUrl: settings?.['project_url'] || '',
	}
}

export default defineHook(({ filter }, { database, env, logger }) => {
	const config = getConfigFromEnv(env as Record<string, string>)

	if (!config) {
		logger.warn('[msgraph-mail] Microsoft Graph not configured. MSGRAPH_TENANT_ID, MSGRAPH_CLIENT_ID, MSGRAPH_CLIENT_SECRET, or sender email missing. Emails will be sent via default transport.')
		return
	}

	logger.info(`[msgraph-mail] Hook registered. Emails will be sent via Graph API as ${config.senderEmail}.`)

	filter('email.send', async (emailOptions: Record<string, any>) => {
		const options = emailOptions as unknown as DirectusEmailOptions

		if (!options.to || (Array.isArray(options.to) && options.to.length === 0)) {
			logger.warn('[msgraph-mail] Email without recipient skipped.')
			return emailOptions
		}

		try {
			if (options.template && !options.html) {
				const defaults = await getDefaultTemplateData(database, env as Record<string, string>)
				const data = { ...defaults, ...(options.template.data || {}) }
				options.html = await renderTemplate(env as Record<string, string>, options.template.name, data, logger)
				delete options.template
			}

			const message = await convertToGraphMessage(options)

			logger.debug(`[msgraph-mail] Sending email to: ${JSON.stringify(options.to)}, Subject: "${options.subject}"`)

			await sendMailViaGraph(config, message)

			logger.info(`[msgraph-mail] Email successfully sent to: ${JSON.stringify(options.to)}, Subject: "${options.subject}"`)
		} catch (error: any) {
			logger.error(`[msgraph-mail] Email sending failed: ${error.message}`)
			throw new Error(`[msgraph-mail] Graph API error: ${error.message}`)
		}

		return false
	})
})
