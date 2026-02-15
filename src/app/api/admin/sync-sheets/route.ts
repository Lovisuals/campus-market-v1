import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';
import { checkIsAdmin } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin, email, phone')
      .eq('id', session.user.id)
      .single();

    const hardcodedAdmin = checkIsAdmin(userData?.email, userData?.phone, userData?.is_admin);

    if (!hardcodedAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all users from database
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, phone, full_name, campus, phone_verified, is_admin, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      throw usersError;
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users to sync',
        count: 0
      });
    }

    // Initialize Google Sheets API
    const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT;
    const GOOGLE_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

    if (!GOOGLE_SERVICE_ACCOUNT || !GOOGLE_SPREADSHEET_ID) {
      console.error('Google Sheets credentials not configured');
      return NextResponse.json(
        { error: 'Google Sheets not configured. Add GOOGLE_SERVICE_ACCOUNT and GOOGLE_SPREADSHEET_ID to environment variables.' },
        { status: 500 }
      );
    }

    // Parse service account credentials
    const credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT);

    // Authenticate with Google
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Prepare data for sheets
    const headers = ['Timestamp', 'User ID', 'Email', 'Phone', 'Full Name', 'Campus', 'Verified', 'Admin', 'Joined Date'];
    const rows = users.map(user => [
      new Date().toISOString(),
      user.id,
      user.email || '',
      user.phone || '',
      user.full_name || '',
      user.campus || '',
      user.phone_verified ? 'Yes' : 'No',
      user.is_admin ? 'Yes' : 'No',
      new Date(user.created_at).toLocaleDateString()
    ]);

    // Clear existing data and write new data
    await sheets.spreadsheets.values.clear({
      spreadsheetId: GOOGLE_SPREADSHEET_ID,
      range: 'Sheet1!A1:Z',
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SPREADSHEET_ID,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers, ...rows],
      },
    });

    // Format the header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: GOOGLE_SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0, green: 0.5, blue: 0.4 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    fontSize: 11,
                    bold: true,
                  },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 9,
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${users.length} users to Google Sheets`,
      count: users.length,
      spreadsheetId: GOOGLE_SPREADSHEET_ID
    });

  } catch (error: any) {
    console.error('Error syncing to Google Sheets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync to Google Sheets' },
      { status: 500 }
    );
  }
}
