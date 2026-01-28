import type { DirectusAttachment, DirectusEmailOptions, GraphAttachment, GraphMessage, GraphRecipient } from './types';

export function parseRecipients(input: string | string[] | undefined): GraphRecipient[] {
	if (!input) return [];
	const addresses = Array.isArray(input) ? input : [input];

	return addresses.map((addr) => {
		const match = addr.match(/^(.+?)\s*<(.+?)>$/);
		if (match) {
			return {
				emailAddress: { name: match[1].trim(), address: match[2].trim() },
			};
		}
		return {
			emailAddress: { address: addr.trim() },
		};
	});
}

async function convertAttachments(attachments?: DirectusAttachment[]): Promise<GraphAttachment[] | undefined> {
	if (!attachments || attachments.length === 0) return undefined;

	const results: GraphAttachment[] = [];

	for (const att of attachments) {
		let contentBytes: string;

		if (att.content) {
			if (Buffer.isBuffer(att.content)) {
				contentBytes = att.content.toString('base64');
			} else {
				contentBytes = Buffer.from(att.content, (att.encoding as BufferEncoding) || 'utf-8').toString('base64');
			}
		} else if (att.path) {
			// File system access is not available in sandboxed mode
			// Attachments must be provided via the content property
			throw new Error(`Attachment "${att.filename}" uses file path, which is not supported in sandboxed mode. Please provide attachment content directly.`);
		} else {
			contentBytes = '';
		}

		results.push({
			'@odata.type': '#microsoft.graph.fileAttachment' as const,
			name: att.filename,
			contentType: att.contentType || 'application/octet-stream',
			contentBytes,
		});
	}

	return results;
}

export async function convertToGraphMessage(options: DirectusEmailOptions): Promise<GraphMessage> {
	const message: GraphMessage = {
		subject: options.subject || '(No subject)',
		body: {
			contentType: options.html ? 'HTML' : 'Text',
			content: options.html || options.text || '',
		},
		toRecipients: parseRecipients(options.to),
	};

	const cc = parseRecipients(options.cc);
	if (cc.length > 0) {
		message.ccRecipients = cc;
	}

	const bcc = parseRecipients(options.bcc);
	if (bcc.length > 0) {
		message.bccRecipients = bcc;
	}

	const attachments = await convertAttachments(options.attachments);
	if (attachments) {
		message.attachments = attachments;
	}

	return message;
}
