import { defineOperationApp } from '@directus/extensions-sdk';

export default defineOperationApp({
	id: 'msgraph-send-mail',
	name: 'Microsoft Graph: Send Email',
	icon: 'mail',
	description: 'Send an email via Microsoft Graph API (OAuth2)',
	overview: ({ to, subject }) => [
		{ label: 'To', text: Array.isArray(to) ? to.join(', ') : to },
		{ label: 'Subject', text: subject },
	],
	options: [
	{
		field: 'to',
		name: 'To',
		type: 'csv',
		meta: {
			width: 'full',
			interface: 'tags',
			note: 'Recipient email addresses',
			options: {
				placeholder: 'recipient@example.com',
				iconRight: 'alternate_email',
			},
		},
	},
		{
			field: 'cc',
			name: 'CC',
			type: 'csv',
			meta: {
				width: 'half',
				interface: 'tags',
				options: {
					placeholder: 'cc@example.com',
				},
			},
		},
		{
			field: 'bcc',
			name: 'BCC',
			type: 'csv',
			meta: {
				width: 'half',
				interface: 'tags',
				options: {
					placeholder: 'bcc@example.com',
				},
			},
		},
	{
		field: 'subject',
		name: 'Subject',
		type: 'string',
		meta: {
			width: 'full',
			interface: 'input',
			options: {
				placeholder: 'Email subject...',
			},
		},
	},
	{
		field: 'type',
		name: 'Content Type',
		type: 'string',
		schema: {
			default_value: 'html',
		},
		meta: {
			width: 'half',
			interface: 'select-dropdown',
			options: {
				choices: [
					{ text: 'HTML', value: 'html' },
					{ text: 'Plain Text', value: 'text' },
				],
			},
		},
	},
	{
		field: 'importance',
		name: 'Priority',
		type: 'string',
		schema: {
			default_value: 'normal',
		},
		meta: {
			width: 'half',
			interface: 'select-dropdown',
			options: {
				choices: [
					{ text: 'Low', value: 'low' },
					{ text: 'Normal', value: 'normal' },
					{ text: 'High', value: 'high' },
				],
			},
		},
	},
	{
		field: 'body',
		name: 'Body',
		type: 'text',
		meta: {
			width: 'full',
			interface: 'input-multiline',
			options: {
				placeholder: 'Email body... (supports {{variable}} syntax)',
			},
		},
	},
	{
		field: 'saveToSentItems',
		name: 'Save to Sent Items',
		type: 'boolean',
		schema: {
			default_value: true,
		},
		meta: {
			width: 'half',
			interface: 'boolean',
		},
	},
	],
});
