export interface MsGraphConfig {
	tenantId: string;
	clientId: string;
	clientSecret: string;
	senderEmail: string;
}

export interface DirectusEmailOptions {
	to: string | string[];
	cc?: string | string[];
	bcc?: string | string[];
	from?: string;
	subject: string;
	html?: string;
	text?: string;
	attachments?: DirectusAttachment[];
	template?: {
		name: string;
		data: Record<string, unknown>;
	};
}

export interface DefaultTemplateData {
	projectName: string;
	projectColor: string;
	projectLogo: string;
	projectUrl: string;
}

export interface DirectusAttachment {
	filename: string;
	content?: Buffer | string;
	path?: string;
	contentType?: string;
	encoding?: string;
}

export interface GraphMessage {
	subject: string;
	body: {
		contentType: 'HTML' | 'Text';
		content: string;
	};
	toRecipients: GraphRecipient[];
	ccRecipients?: GraphRecipient[];
	bccRecipients?: GraphRecipient[];
	attachments?: GraphAttachment[];
	importance?: 'low' | 'normal' | 'high';
}

export interface GraphRecipient {
	emailAddress: {
		address: string;
		name?: string;
	};
}

export interface GraphAttachment {
	'@odata.type': '#microsoft.graph.fileAttachment';
	name: string;
	contentType: string;
	contentBytes: string;
}

export interface TokenCache {
	accessToken: string;
	expiresAt: number;
}
