import { cookies } from 'next/headers';
import { GmailService } from './client';

export async function getAuthenticatedGmailClient(): Promise<GmailService | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!accessToken) {
      return null;
    }

    return new GmailService(accessToken, refreshToken);
  } catch (error) {
    console.error('Error creating authenticated Gmail client:', error);
    return null;
  }
}

export async function requireAuth() {
  const client = await getAuthenticatedGmailClient();
  if (!client) {
    throw new Error('Authentication required');
  }
  return client;
}