import type { MsGraphConfig, GraphMessage, TokenCache } from './types';

let tokenCache: TokenCache | null = null;

async function acquireToken(config: MsGraphConfig): Promise<string> {
	// Return cached token if still valid (with 5 min buffer)
	if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
		return tokenCache.accessToken;
	}

	const tokenEndpoint = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;

	const body = new URLSearchParams({
		client_id: config.clientId,
		client_secret: config.clientSecret,
		scope: 'https://graph.microsoft.com/.default',
		grant_type: 'client_credentials',
	});

	const response = await fetch(tokenEndpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Token-Akquise fehlgeschlagen (${response.status}): ${errorText}`);
	}

	const data = (await response.json()) as { access_token: string; expires_in: number };

	tokenCache = {
		accessToken: data.access_token,
		expiresAt: Date.now() + data.expires_in * 1000,
	};

	return tokenCache.accessToken;
}

export async function sendMailViaGraph(config: MsGraphConfig, message: GraphMessage, saveToSentItems = true): Promise<void> {
	const accessToken = await acquireToken(config);

	const endpoint = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.senderEmail)}/sendMail`;

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			message,
			saveToSentItems,
		}),
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`Graph API sendMail fehlgeschlagen (${response.status}): ${errorBody}`);
	}
}

export function getConfigFromEnv(env: Record<string, string>): MsGraphConfig | null {
	const tenantId = env['MSGRAPH_TENANT_ID'];
	const clientId = env['MSGRAPH_CLIENT_ID'];
	const clientSecret = env['MSGRAPH_CLIENT_SECRET'];
	const senderEmail = env['MSGRAPH_SENDER_EMAIL'] || env['EMAIL_FROM'];

	if (!tenantId || !clientId || !clientSecret || !senderEmail) {
		return null;
	}

	return { tenantId, clientId, clientSecret, senderEmail };
}
