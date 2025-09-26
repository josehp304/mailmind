import { cookies } from 'next/headers';
import { google } from 'googleapis';

export interface ServerUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  gmailAddress: string;
}

export interface ServerSession {
  user: ServerUser | null;
  authenticated: boolean;
}

export async function getServerSession(): Promise<ServerSession> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const userInfoCookie = cookieStore.get('user_info')?.value;
    
    if (!accessToken || !userInfoCookie) {
      return { user: null, authenticated: false };
    }

    const userInfo = JSON.parse(userInfoCookie);
    
    // Verify token is still valid
    try {
      const oAuth2Client = new google.auth.OAuth2();
      oAuth2Client.setCredentials({ access_token: accessToken });
      
      const oauth2 = google.oauth2({ 
        version: 'v2', 
        auth: oAuth2Client
      });
      
      await oauth2.userinfo.get();
      
      return { 
        user: {
          id: userInfo.email, // Use email as ID for now
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          gmailAddress: userInfo.email
        }, 
        authenticated: true 
      };
    } catch (tokenError) {
      return { user: null, authenticated: false };
    }
    
  } catch (error) {
    console.error('Server session check error:', error);
    return { user: null, authenticated: false };
  }
}