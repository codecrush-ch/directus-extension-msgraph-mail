import { defineOperationApi } from '@directus/extensions-sdk';
import { getConfigFromEnv, sendMailViaGraph } from '../shared/graph-client';
import { convertToGraphMessage } from '../shared/utils';
import type { DirectusEmailOptions, GraphMessage } from '../shared/types';

interface OperationOptions {
	to: string | string[];
	cc?: string | string[];
	bcc?: string | string[];
	subject: string;
	body: string;
	type?: 'html' | 'text';
	importance?: 'low' | 'normal' | 'high';
	saveToSentItems?: boolean;
}

export default defineOperationApi<OperationOptions>({
	id: 'msgraph-send-mail',
	handler: async (options, { env, logger }) => {
		const config = getConfigFromEnv(env as Record<string, string>);

		if (!config) {
			throw new Error('Microsoft Graph nicht konfiguriert. MSGRAPH_TENANT_ID, MSGRAPH_CLIENT_ID und MSGRAPH_CLIENT_SECRET muessen gesetzt sein.');
		}

		if (!options.to || (Array.isArray(options.to) && options.to.length === 0)) {
			throw new Error('Kein Empfaenger angegeben.');
		}

		const emailOptions: DirectusEmailOptions = {
			to: options.to,
			cc: options.cc,
			bcc: options.bcc,
			subject: options.subject,
			html: options.type !== 'text' ? options.body : undefined,
			text: options.type === 'text' ? options.body : undefined,
		};

		const message: GraphMessage = convertToGraphMessage(emailOptions);

		if (options.importance && options.importance !== 'normal') {
			message.importance = options.importance;
		}

		try {
			await sendMailViaGraph(config, message, options.saveToSentItems !== false);

			logger.info(`[msgraph-send-mail] Email gesendet an: ${JSON.stringify(options.to)}, Betreff: "${options.subject}"`);

			return {
				success: true,
				to: options.to,
				subject: options.subject,
			};
		} catch (error: any) {
			logger.error(`[msgraph-send-mail] Fehler: ${error.message}`);
			throw error;
		}
	},
});
