import { defineHook } from '@directus/extensions-sdk';
import { getConfigFromEnv, sendMailViaGraph } from '../shared/graph-client';
import { convertToGraphMessage } from '../shared/utils';
import type { DirectusEmailOptions } from '../shared/types';

export default defineHook(({ filter }, { env, logger }) => {
	const config = getConfigFromEnv(env as Record<string, string>);

	if (!config) {
		logger.warn('[msgraph-mail] Microsoft Graph nicht konfiguriert. MSGRAPH_TENANT_ID, MSGRAPH_CLIENT_ID oder MSGRAPH_CLIENT_SECRET fehlt. Emails werden ueber den Standard-Transport gesendet.');
		return;
	}

	logger.info(`[msgraph-mail] Hook registriert. Emails werden via Graph API als ${config.senderEmail} gesendet.`);

	filter('email.send', async (emailOptions: Record<string, any>) => {
		const options = emailOptions as unknown as DirectusEmailOptions;

		if (!options.to || (Array.isArray(options.to) && options.to.length === 0)) {
			logger.warn('[msgraph-mail] Email ohne Empfaenger uebersprungen.');
			return emailOptions;
		}

		try {
			const message = convertToGraphMessage(options);

			logger.debug(`[msgraph-mail] Sende Email an: ${JSON.stringify(options.to)}, Betreff: "${options.subject}"`);

			await sendMailViaGraph(config, message);

			logger.info(`[msgraph-mail] Email erfolgreich gesendet an: ${JSON.stringify(options.to)}, Betreff: "${options.subject}"`);
		} catch (error: any) {
			logger.error(`[msgraph-mail] Email-Versand fehlgeschlagen: ${error.message}`);
			throw new Error(`[msgraph-mail] Graph API Fehler: ${error.message}`);
		}

		return emailOptions;
	});
});
