import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/oauth2callback`
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code not provided' },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Get user profile information
    const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Get Gmail profile for additional info
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });

    // Store tokens in cookies (you might want to use a more secure method)
    const cookieStore = await cookies();
    
    // Set secure httpOnly cookies for tokens
    cookieStore.set('access_token', tokens.access_token || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    });

    if (tokens.refresh_token) {
      cookieStore.set('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
    }

    // Store user info in a separate cookie
    cookieStore.set('user_info', JSON.stringify({
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture,
      gmailAddress: profile.data.emailAddress
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    // Redirect to home page
    return NextResponse.redirect(new URL('/', request.url));
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}