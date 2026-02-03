# Directus Extension: Microsoft Graph Mail

Send all Directus emails via Microsoft Graph API using OAuth2 Client Credentials flow. This extension replaces the default Directus email transport with Microsoft Graph API, enabling seamless integration with Microsoft 365 / Azure AD.

## Features

- 🔐 **OAuth2 Client Credentials Flow** - Secure authentication using Azure AD App Registration
- 📧 **Automatic Email Interception** - All Directus emails are automatically sent via Microsoft Graph
- 🎯 **Manual Email Operation** - Includes a Directus Flow operation for sending emails programmatically
- 🔄 **Token Caching** - Automatic token refresh with 5-minute buffer
- 📝 **Rich Email Support** - HTML and plain text emails with CC/BCC support
- ⚡ **Zero Configuration** - Works automatically once environment variables are set

## Installation

### Via Directus Marketplace (Recommended)

**Important:** This extension uses the Directus sandbox for security. To see it in the Marketplace, you need to configure your Directus instance:

1. Add the following environment variable to your Directus `.env` file:
   ```bash
   MARKETPLACE_TRUST=all
   ```
2. Restart your Directus instance
3. Open your Directus instance
4. Navigate to **Settings** → **Marketplace**
5. Search for "Microsoft Graph Mail"
6. Click **Install**

**Note:** The `MARKETPLACE_TRUST=all` setting allows installation of sandboxed extensions from the Marketplace. This extension runs in a secure sandbox and only has access to the Microsoft Graph API endpoints it needs.

### Via NPM

```bash
npm install directus-extension-msgraph-mail
```

### Manual Installation

1. Download the latest release
2. Extract to your Directus `extensions` folder
3. Restart Directus

## Configuration

### 1. Azure AD App Registration

Create an App Registration in Azure AD with the following settings:

1. Go to [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations**
2. Click **New registration**
3. Set a name (e.g., "Directus Mail Sender")
4. Click **Register**
5. Note down the **Application (client) ID** and **Directory (tenant) ID**
6. Go to **Certificates & secrets** → **New client secret**
7. Create a secret and note down the **Value** (not the Secret ID!)
8. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Application permissions**
9. Add the following permission:
   - `Mail.Send` - Send mail as any user
10. Click **Grant admin consent** (requires admin privileges)

### 2. Environment Variables

Add the following environment variables to your Directus `.env` file:

```bash
# Microsoft Graph Configuration
MSGRAPH_TENANT_ID=your-tenant-id
MSGRAPH_CLIENT_ID=your-client-id
MSGRAPH_CLIENT_SECRET=your-client-secret
MSGRAPH_SENDER_EMAIL=noreply@yourdomain.com

# Optional: Fallback sender email (used if MSGRAPH_SENDER_EMAIL is not set)
EMAIL_FROM=noreply@yourdomain.com
```

### 3. Restart Directus

```bash
# Docker
docker compose restart backend

# PM2
pm2 restart directus

# Node
# Stop and start your Directus instance
```

## Usage

### Automatic Email Interception (Hook)

Once configured, all Directus emails are automatically sent via Microsoft Graph API:

- Password reset emails
- User invitations
- Notification emails
- Custom emails sent via `mail` service

No additional configuration required!

### Manual Email Sending (Flow Operation)

Use the **Microsoft Graph: Send Mail** operation in Directus Flows:

**Operation Settings:**
- **To**: Recipient email(s) - string or array
- **CC**: CC recipients (optional)
- **BCC**: BCC recipients (optional)
- **Subject**: Email subject
- **Body**: Email body (HTML or plain text)
- **Type**: `html` or `text` (default: `html`)
- **Importance**: `low`, `normal`, or `high` (default: `normal`)
- **Save to Sent Items**: Boolean (default: `true`)

**Example Flow:**

```json
{
  "to": "user@example.com",
  "subject": "Welcome to our platform",
  "body": "<h1>Welcome!</h1><p>Thank you for signing up.</p>",
  "type": "html",
  "importance": "normal"
}
```

## Troubleshooting

### Extension not loading

Check Directus logs for errors:

```bash
docker logs directus_backend
```

### Emails not being sent

1. **Check environment variables:**
   ```bash
   docker exec directus_backend env | grep MSGRAPH
   ```

2. **Verify Azure AD permissions:**
   - Ensure `Mail.Send` permission is granted
   - Ensure admin consent is given

3. **Check sender email:**
   - The sender email must be a valid mailbox in your Microsoft 365 tenant
   - The App Registration needs permission to send as this user

4. **Check logs:**
   Look for `[msgraph-mail]` entries in Directus logs

### Token acquisition fails

- Verify `MSGRAPH_TENANT_ID`, `MSGRAPH_CLIENT_ID`, and `MSGRAPH_CLIENT_SECRET` are correct
- Ensure the client secret has not expired
- Check Azure AD App Registration is not disabled

## How it Works

### Hook (Automatic Email Interception)

The extension registers a `email.send` filter hook that intercepts all outgoing emails and sends them via Microsoft Graph API instead of the default SMTP transport.

### Operation (Manual Email Sending)

The extension provides a Directus Flow operation that can be used to send emails programmatically from your flows.

### Token Management

The extension automatically acquires and caches OAuth2 access tokens. Tokens are refreshed automatically when they expire (with a 5-minute buffer).

## Requirements

- Directus `^10.10.0`
- Microsoft 365 / Azure AD tenant
- Azure AD App Registration with `Mail.Send` permission

## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on [GitHub](https://github.com/codecrush-ch/directus-extension-msgraph-mail).

## Support

- 🐛 [Report a bug](https://github.com/codecrush-ch/directus-extension-msgraph-mail/issues)
- 💡 [Request a feature](https://github.com/codecrush-ch/directus-extension-msgraph-mail/issues)
- 📖 [Documentation](https://github.com/codecrush-ch/directus-extension-msgraph-mail#readme)

## Author

**CodeCrush**

- Website: [codecrush.ch](https://codecrush.ch)
- GitHub: [@codecrush-ch](https://github.com/codecrush-ch)

---

Made with ❤️ by CodeCrush
