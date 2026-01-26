import { readFileSync } from 'fs';
import type { DirectusEmailOptions, GraphMessage, GraphRecipient, GraphAttachment, DirectusAttachment } from './types';

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

function convertAttachments(attachments?: DirectusAttachment[]): GraphAttachment[] | undefined {
	if (!attachments || attachments.length === 0) return undefined;

	return attachments.map((att) => {
		let contentBytes: string;

		if (att.content) {
			if (Buffer.isBuffer(att.content)) {
				contentBytes = att.content.toString('base64');
			} else {
				contentBytes = Buffer.from(att.content, (att.encoding as BufferEncoding) || 'utf-8').toString('base64');
			}
		} else if (att.path) {
			const fileBuffer = readFileSync(att.path);
			contentBytes = fileBuffer.toString('base64');
		} else {
			contentBytes = '';
		}

		return {
			'@odata.type': '#microsoft.graph.fileAttachment' as const,
			name: att.filename,
			contentType: att.contentType || 'application/octet-stream',
			contentBytes,
		};
	});
}

export function convertToGraphMessage(options: DirectusEmailOptions): GraphMessage {
	const message: GraphMessage = {
		subject: options.subject || '(Kein Betreff)',
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

	const attachments = convertAttachments(options.attachments);
	if (attachments) {
		message.attachments = attachments;
	}

	return message;
}
