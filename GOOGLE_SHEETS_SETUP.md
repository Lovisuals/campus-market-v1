# Google Sheets Integration Setup Guide

This guide explains how to set up automatic syncing of user data from Campus Market P2P to a Google Spreadsheet.

## Overview

The admin dashboard can sync all registered users (including email and phone numbers) to a Google Spreadsheet automatically. This allows admins to:
- View all user data in a structured spreadsheet
- Export/analyze user data using Google Sheets tools
- Keep a backup of user information
- Share data with authorized team members

## Prerequisites

1. Google Cloud account (free)
2. Google Sheets spreadsheet created
3. Google Cloud Service Account with Sheets API access

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Name it "Campus Market P2P" or any preferred name

## Step 2: Enable Google Sheets API

1. In your Google Cloud project, go to **APIs & Services** > **Library**
2. Search for "Google Sheets API"
3. Click on it and press **Enable**

## Step 3: Create a Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in the details:
   - **Service account name**: `campus-market-sheets-sync`
   - **Service account ID**: (auto-generated)
   - **Description**: "Service account for syncing user data to Google Sheets"
4. Click **Create and Continue**
5. Skip the optional steps (Grant access & Grant users access)
6. Click **Done**

## Step 4: Create Service Account Key

1. In the **Credentials** page, find your service account in the list
2. Click on the service account email
3. Go to the **Keys** tab
4. Click **Add Key** > **Create new key**
5. Choose **JSON** format
6. Click **Create**
7. A JSON file will be downloaded - **keep this file secure!**

## Step 5: Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name it "Campus Market Users" or any preferred name
4. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```
   Example: If URL is `https://docs.google.com/spreadsheets/d/1abc123def456/edit`
   The ID is: `1abc123def456`

## Step 6: Share Spreadsheet with Service Account

1. In your Google Spreadsheet, click the **Share** button
2. Paste the service account email (found in the JSON file as `client_email`)
   - Example: `campus-market-sheets-sync@campus-market-p2p.iam.gserviceaccount.com`
3. Give it **Editor** access
4. Click **Share**

## Step 7: Configure Environment Variables

Add these two environment variables to your project:

### Local Development (.env.local)

```env
# Google Sheets Integration
GOOGLE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"campus-market-p2p","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"campus-market-sheets-sync@campus-market-p2p.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}'

GOOGLE_SPREADSHEET_ID=1abc123def456
```

**Important**: 
- `GOOGLE_SERVICE_ACCOUNT` must be the entire JSON file content as a single-line string
- Wrap it in single quotes to preserve special characters
- Do NOT add line breaks inside the private key

### Production (Vercel)

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add both variables:
   - `GOOGLE_SERVICE_ACCOUNT`: Paste the entire JSON content
   - `GOOGLE_SPREADSHEET_ID`: Your spreadsheet ID
4. Make sure to select all environments (Production, Preview, Development)
5. Click **Save**

## Step 8: Test the Integration

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Login as admin: mail.lovisuals@gmail.com

3. Go to **Admin Dashboard** > **Users** tab

4. Click the **"📊 Sync to Google Sheets"** button

5. Check your Google Spreadsheet - you should see:
   - Header row with: Timestamp, User ID, Email, Phone, Full Name, Campus, Verified, Admin, Joined Date
   - All users listed with their data
   - Green header formatting

## How It Works

The sync process:
1. Fetches all users from the database
2. Formats data into spreadsheet rows
3. Clears existing data in the sheet
4. Writes new data with headers
5. Applies formatting (green header, auto-sized columns)
6. Shows success toast notification

## Spreadsheet Columns

| Column | Description |
|--------|-------------|
| Timestamp | When the sync was performed |
| User ID | Supabase user UUID |
| Email | User's email address |
| Phone | User's phone number (or blank if not set) |
| Full Name | User's full name |
| Campus | University campus |
| Verified | Yes/No - phone verification status |
| Admin | Yes/No - admin status |
| Joined Date | When the user registered |

## Troubleshooting

### Error: "Google Sheets not configured"
- Check that both environment variables are set correctly
- Verify the JSON is properly formatted (no extra line breaks)

### Error: "Failed to sync to Google Sheets"
- Ensure the service account has Editor access to the spreadsheet
- Verify the Spreadsheet ID is correct
- Check that Google Sheets API is enabled in Google Cloud Console

### Error: "The caller does not have permission"
- Make sure you shared the spreadsheet with the service account email
- Verify the service account has **Editor** permission (not just Viewer)

### Private Key Issues
- Ensure the private key includes `\n` characters for line breaks
- Keep the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers
- Don't add extra quotes or escape characters

## Security Best Practices

1. **Never commit** the service account JSON file to git
2. Add `.env.local` to `.gitignore`
3. Store credentials securely in Vercel environment variables
4. Regularly rotate service account keys
5. Only grant Editor access (not Owner)
6. Limit spreadsheet sharing to necessary personnel

## Manual Sync vs Auto Sync

Currently, the sync is **manual** - admins must click the button to sync.

To implement **automatic sync** on user registration:
1. Call the sync API endpoint after each new user signs up
2. Add it to the complete-profile page after phone verification
3. Set up a cron job to sync daily/hourly

## API Endpoint

```
POST /api/admin/sync-sheets
```

**Authentication**: Requires admin session

**Response**:
```json
{
  "success": true,
  "message": "Successfully synced 42 users to Google Sheets",
  "count": 42,
  "spreadsheetId": "1abc123def456"
}
```

## Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Check Vercel logs for server-side errors
3. Verify all environment variables are set correctly
4. Ensure the service account has proper permissions
5. Test with a fresh spreadsheet if problems persist
