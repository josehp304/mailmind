import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/oauth2callback`
);

const SCOPES = ['https://mail.google.com/', 'https://www.googleapis.com/auth/userinfo.profile',"https://mail.google.com/"];

export async function GET(request: NextRequest) {
  try {
    const url = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate OAuth URL' },
      { status: 500 }
    );
  }
}