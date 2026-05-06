import type { GraphMessage, MsGraphConfig, TokenCache } from './types'

let tokenCache: TokenCache | null = null

async function acquireToken(config: MsGraphConfig): Promise<string> {
	if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
		return tokenCache.accessToken
	}

	const tokenEndpoint = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`

	const body = new URLSearchParams({
		client_id: config.clientId,
		client_secret: config.clientSecret,
		scope: 'https://graph.microsoft.com/.default',
		grant_type: 'client_credentials',
	})

	const res = await fetch(tokenEndpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	})

	const text = await res.text()
	if (res.status !== 200) {
		throw new Error(`Token acquisition failed (${res.status}): ${text}`)
	}

	const data = JSON.parse(text) as { access_token: string; expires_in: number }

	tokenCache = {
		accessToken: data.access_token,
		expiresAt: Date.now() + data.expires_in * 1000,
	}

	return tokenCache.accessToken
}

export async function sendMailViaGraph(
	config: MsGraphConfig,
	message: GraphMessage,
	saveToSentItems = true
): Promise<void> {
	const accessToken = await acquireToken(config)

	const endpoint = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
		config.senderEmail
	)}/sendMail`

	const res = await fetch(endpoint, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ message, saveToSentItems }),
	})

	if (res.status !== 202 && res.status !== 200) {
		const errorBody = await res.text()
		throw new Error(`Graph API sendMail failed (${res.status}): ${errorBody}`)
	}
}

export function getConfigFromEnv(env: Record<string, string>): MsGraphConfig | null {
	const tenantId = env['MSGRAPH_TENANT_ID']
	const clientId = env['MSGRAPH_CLIENT_ID']
	const clientSecret = env['MSGRAPH_CLIENT_SECRET']
	const senderEmail = env['MSGRAPH_SENDER_EMAIL'] || env['EMAIL_FROM']

	if (!tenantId || !clientId || !clientSecret || !senderEmail) {
		return null
	}

	return { tenantId, clientId, clientSecret, senderEmail }
}
