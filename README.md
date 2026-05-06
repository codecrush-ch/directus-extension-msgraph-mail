# Directus Extension: Microsoft Graph Mail

Send all Directus emails via Microsoft Graph API using OAuth2 Client Credentials flow. This extension replaces the default Directus email transport with Microsoft Graph API, enabling seamless integration with Microsoft 365 / Azure AD — including full support for Directus Liquid mail templates (password reset, invitations, custom templates).

## Features

- 🔐 **OAuth2 Client Credentials Flow** - Secure authentication using Azure AD App Registration
- 📧 **Automatic Email Interception** - All Directus emails are automatically sent via Microsoft Graph
- 🧩 **Liquid Template Rendering** - Renders Directus' built-in mail templates (password reset, user invitation, etc.) plus your own custom templates with the same `{{ projectName }}`, `{{ projectLogo }}`, `{{ projectColor }}` and `{{ projectUrl }}` defaults Directus provides out of the box
- 🎯 **Manual Email Operation** - Includes a Directus Flow operation for sending emails programmatically
- 🔄 **Token Caching** - Automatic token refresh with 5-minute buffer
- 📝 **Rich Email Support** - HTML and plain text emails with CC/BCC and attachments
- ⚡ **Zero Configuration** - Works automatically once environment variables are set

## Installation

### Via NPM

```bash
npm install directus-extension-msgraph-mail
```

### Manual Installation

1. Download the latest release
2. Extract to your Directus `extensions` folder
3. Restart Directus

> **Note on sandbox mode:** Starting with `1.0.4` this extension runs **outside** the Directus sandbox. The sandbox does not allow access to `node:fs` / `node:module`, both of which are required to locate and render Directus' built-in Liquid mail templates. Because the extension is no longer sandboxed, it is not eligible for Marketplace distribution and must be installed via NPM or manually. Network and filesystem access is limited to what is needed for token acquisition, the Graph API and the local mail templates folder.

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

# Optional: Custom directory with additional Liquid mail templates (.liquid)
# Defaults to Directus' built-in templates folder if not set.
EMAIL_TEMPLATES_PATH=/directus/templates
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
- Custom emails sent via the `mail` service

No additional configuration required.

### Liquid Mail Templates

Directus core uses Liquid templates for transactional emails (e.g. `password-reset.liquid`, `user-invitation.liquid`). When an email is sent with `template` instead of `html`, this extension renders the template before delivery and injects the same defaults Directus provides:

| Variable          | Source                                              |
| ----------------- | --------------------------------------------------- |
| `projectName`     | `directus_settings.project_name` (fallback `Directus`) |
| `projectColor`    | `directus_settings.project_color` (fallback `#171717`) |
| `projectLogo`     | `directus_settings.project_logo` resolved against `PUBLIC_URL`, otherwise `admin/img/directus-white.png` |
| `projectUrl`      | `directus_settings.project_url`                     |

Template lookup order:

1. `EMAIL_TEMPLATES_PATH` (if set and the file exists)
2. The `dist/services/mail/templates` folder shipped with `@directus/api` / `directus`
   - Resolved via `require.resolve`
   - Falls back to common locations (`/directus/node_modules/...`, `process.cwd()/node_modules/...`)
   - Also scans `node_modules/.pnpm/@directus+api@*` for pnpm-based installs

Drop your custom `.liquid` files into `EMAIL_TEMPLATES_PATH` to override or add templates.

### Manual Email Sending (Flow Operation)

Use the **Microsoft Graph: Send Email** operation in Directus Flows.

**Operation Settings:**
- **To**: Recipient email(s) — string or array
- **CC**: CC recipients (optional)
- **BCC**: BCC recipients (optional)
- **Subject**: Email subject
- **Body**: Email body (HTML or plain text)
- **Type**: `html` or `text` (default: `html`)
- **Importance**: `low`, `normal`, or `high` (default: `normal`)
- **Save to Sent Items**: Boolean (default: `true`)

**Example Flow payload:**

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

### Template-based emails (password reset, invitations) fail

If you see an error like *"Could not locate built-in Directus mail templates"* in the logs:

- Make sure the extension can reach `@directus/api`'s `dist/services/mail/templates` folder. In Docker images this is usually `/directus/node_modules/@directus/api/dist/services/mail/templates`.
- As a workaround you can set `EMAIL_TEMPLATES_PATH` to a folder containing copies of the required `.liquid` files (e.g. `password-reset.liquid`, `user-invitation.liquid`).

### Token acquisition fails

- Verify `MSGRAPH_TENANT_ID`, `MSGRAPH_CLIENT_ID`, and `MSGRAPH_CLIENT_SECRET` are correct
- Ensure the client secret has not expired
- Check Azure AD App Registration is not disabled

## How it Works

### Hook (Automatic Email Interception)

The extension registers an `email.send` filter hook that intercepts all outgoing emails. If a `template` is provided (and no `html`), the template is rendered with LiquidJS using project defaults plus the custom data from the caller. The result is then sent via Microsoft Graph API instead of the default SMTP transport.

### Operation (Manual Email Sending)

The extension provides a Directus Flow operation that can be used to send emails programmatically from your flows.

### Token Management

The extension automatically acquires and caches OAuth2 access tokens. Tokens are refreshed automatically when they expire (with a 5-minute buffer).

## Requirements

- Directus `^10.10.0` or `^11.0.0`
- Microsoft 365 / Azure AD tenant
- Azure AD App Registration with `Mail.Send` permission
- Non-sandboxed extension execution (default for self-hosted Directus instances)

## License

MIT License — see [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome. Please open an issue or submit a pull request on [GitHub](https://github.com/codecrush-ch/directus-extension-msgraph-mail).

## Support

- 🐛 [Report a bug](https://github.com/codecrush-ch/directus-extension-msgraph-mail/issues)
- 💡 [Request a feature](https://github.com/codecrush-ch/directus-extension-msgraph-mail/issues)
- 📖 [Documentation](https://github.com/codecrush-ch/directus-extension-msgraph-mail#readme)

## Changelog

### 1.0.5

- Added official compatibility with **Directus 11** (host range now `^10.10.0 || ^11.0.0`)
- Bumped `@directus/extensions-sdk` to `^17.0.0`
- Verified that the template auto-discovery still resolves `@directus/api`'s `dist/services/mail/templates` folder under Directus 11 (`@directus/api@35.x`)

### 1.0.4

- Switched HTTP transport from sandboxed `directus:api` `request` to native `fetch`
- Added Liquid mail template rendering with the same project defaults Directus uses (`projectName`, `projectLogo`, `projectColor`, `projectUrl`)
- Auto-discovery of Directus' built-in templates folder, with optional `EMAIL_TEMPLATES_PATH` override
- Sandbox mode disabled to allow filesystem access for templates
- Added `liquidjs` runtime dependency

## Author

**CodeCrush**

- Website: [codecrush.ch](https://codecrush.ch)
- GitHub: [@codecrush-ch](https://github.com/codecrush-ch)

---

Made with ❤️ by CodeCrush
