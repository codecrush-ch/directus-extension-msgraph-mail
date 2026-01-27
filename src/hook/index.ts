import { defineHook } from '@directus/extensions-sdk';
import { getConfigFromEnv, sendMailViaGraph } from '../shared/graph-client';
import { convertToGraphMessage } from '../shared/utils';
import type { DirectusEmailOptions } from '../shared/types';

export default defineHook(({ filter }, { env, logger }) => {
	const config = getConfigFromEnv(env as Record<string, string>);

	if (!config) {
		logger.warn('[msgraph-mail] Microsoft Graph not configured. MSGRAPH_TENANT_ID, MSGRAPH_CLIENT_ID, MSGRAPH_CLIENT_SECRET, or sender email missing. Emails will be sent via default transport.');
		return;
	}

	logger.info(`[msgraph-mail] Hook registered. Emails will be sent via Graph API as ${config.senderEmail}.`);

	filter('email.send', async (emailOptions: Record<string, any>) => {
		const options = emailOptions as unknown as DirectusEmailOptions;

		if (!options.to || (Array.isArray(options.to) && options.to.length === 0)) {
			logger.warn('[msgraph-mail] Email without recipient skipped.');
			return emailOptions;
		}

		try {
			const message = await convertToGraphMessage(options);

			logger.debug(`[msgraph-mail] Sending email to: ${JSON.stringify(options.to)}, Subject: "${options.subject}"`);

			await sendMailViaGraph(config, message);

			logger.info(`[msgraph-mail] Email successfully sent to: ${JSON.stringify(options.to)}, Subject: "${options.subject}"`);
		} catch (error: any) {
			logger.error(`[msgraph-mail] Email sending failed: ${error.message}`);
			throw new Error(`[msgraph-mail] Graph API error: ${error.message}`);
		}

		// Return false to prevent default email transport from also sending
		return false;
	});
});
