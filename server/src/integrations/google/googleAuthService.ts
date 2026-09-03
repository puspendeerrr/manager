import { google } from 'googleapis';
import { prisma } from '../../utils/prisma';
import { GoogleOAuthStatus } from '@sonam/shared';

export class GoogleAuthService {
  private getOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'placeholder_client_secret';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/callback';

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  getAuthUrl(): string {
    const oauth2Client = this.getOAuth2Client();
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/gmail.readonly',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
    });
  }

  async handleCallback(userId: string, code: string): Promise<void> {
    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('Failed to retrieve access token from Google');
    }

    await prisma.googleAuthToken.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token,
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        ...(tokens.expiry_date ? { expiryDate: BigInt(tokens.expiry_date) } : {}),
      },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : BigInt(0),
      },
    });

    console.log(`[GoogleAuthService] Server-side OAuth tokens saved securely for user ${userId}.`);
  }

  async getAuthenticatedClient(userId: string) {
    const tokenRecord = await prisma.googleAuthToken.findUnique({
      where: { userId },
    });

    if (!tokenRecord || !tokenRecord.accessToken) {
      return null;
    }

    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: tokenRecord.accessToken,
      refresh_token: tokenRecord.refreshToken || undefined,
      expiry_date: tokenRecord.expiryDate ? Number(tokenRecord.expiryDate) : undefined,
    });

    // Auto refresh token listener
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        await prisma.googleAuthToken.update({
          where: { userId },
          data: {
            accessToken: tokens.access_token,
            ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
            ...(tokens.expiry_date && { expiryDate: BigInt(tokens.expiry_date) }),
          },
        });
      }
    });

    return oauth2Client;
  }

  async getStatus(userId: string): Promise<GoogleOAuthStatus> {
    const tokenRecord = await prisma.googleAuthToken.findUnique({
      where: { userId },
    });

    if (!tokenRecord || !tokenRecord.accessToken) {
      return {
        connected: false,
        calendarEnabled: false,
        gmailEnabled: false,
      };
    }

    return {
      connected: true,
      calendarEnabled: true,
      gmailEnabled: true,
    };
  }

  async disconnect(userId: string): Promise<void> {
    const tokenRecord = await prisma.googleAuthToken.findUnique({
      where: { userId },
    });

    if (tokenRecord) {
      try {
        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({ access_token: tokenRecord.accessToken });
        await oauth2Client.revokeToken(tokenRecord.accessToken);
      } catch (err) {
        console.warn('[GoogleAuthService] Token revocation notice:', err);
      }

      await prisma.googleAuthToken.delete({ where: { userId } });
    }

    console.log(`[GoogleAuthService] Google account disconnected for user ${userId}. User tasks/projects preserved.`);
  }
}

export const googleAuthService = new GoogleAuthService();
