import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { google } from 'googleapis';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const userInfoCookie = cookieStore.get('user_info')?.value;
    
    if (!accessToken || !userInfoCookie) {
      return NextResponse.json({ user: null, authenticated: false });
    }

    const userInfo = JSON.parse(userInfoCookie);
    
    // Verify token is still valid by making a simple API call
    try {
      const oAuth2Client = new google.auth.OAuth2();
      oAuth2Client.setCredentials({ access_token: accessToken });
      
      const oauth2 = google.oauth2({ 
        version: 'v2', 
        auth: oAuth2Client
      });
      
      await oauth2.userinfo.get();
      
      return NextResponse.json({ 
        user: userInfo, 
        authenticated: true 
      });
    } catch (tokenError) {
      // Token is invalid, clear cookies
      cookieStore.delete('access_token');
      cookieStore.delete('refresh_token');
      cookieStore.delete('user_info');
      
      return NextResponse.json({ user: null, authenticated: false });
    }
    
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null, authenticated: false });
  }
}