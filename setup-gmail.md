# Gmail API Setup Guide

## Fix the "Access blocked" Error

The error you're seeing is because your Google Cloud Console app is in testing mode. Here's how to fix it:

### Step 1: Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **email-ai-org**
3. Go to **APIs & Services** → **OAuth consent screen**
4. Configure the consent screen:
   - **User Type**: External
   - **App name**: MailMate
   - **User support email**: your-email@gmail.com
   - **Developer contact information**: your-email@gmail.com
   - **Scopes**: Add these scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`

### Step 2: Add Test Users

1. In the OAuth consent screen, scroll to **Test users**
2. Click **Add Users**
3. Add your email: `zakkinnear8@gmail.com`
4. Save changes

### Step 3: Configure OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Add these **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/gmail/callback`
   - `http://localhost:3000/auth/google/callback`
4. Save changes

### Step 4: Enable Gmail API

1. Go to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click on it and press **Enable**

## Alternative: Use Service Account (Recommended for Production)

For a more secure approach, you can use a service account:

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Download the JSON key file
4. Update your `.env` file with the service account credentials

## Quick Test

After making these changes:

1. Run the app: `npm run electron-dev`
2. Click "Connect Gmail"
3. You should now be able to authenticate without the "Access blocked" error

## Troubleshooting

- **Still getting access denied?** Make sure you're using the test user email
- **Redirect URI mismatch?** Double-check the URIs in your OAuth credentials
- **API not enabled?** Make sure Gmail API is enabled in your project

## Desktop App Benefits

With the Electron setup, you now have:
- ✅ Native desktop application
- ✅ No browser security restrictions
- ✅ Better user experience
- ✅ Can run offline (with cached data)
- ✅ System tray integration (can be added)
- ✅ Auto-updates (can be configured) 