import { Request, Response } from 'express';
import { googleAuthService } from '../integrations/google/googleAuthService';
import { sendSuccess, sendError } from '../utils/response';

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'user_dev_01';

export async function handleGetGoogleStatus(req: Request, res: Response) {
  try {
    const status = await googleAuthService.getStatus(DEFAULT_USER_ID);
    return sendSuccess(res, status);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch Google status');
  }
}

export async function handleGetGoogleAuthUrl(req: Request, res: Response) {
  try {
    const authUrl = googleAuthService.getAuthUrl();
    return sendSuccess(res, { authUrl });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to generate auth URL');
  }
}

export async function handleGoogleCallback(req: Request, res: Response) {
  try {
    const code = req.query.code as string;
    if (!code) {
      return sendError(res, 'Authorization code missing in callback');
    }

    await googleAuthService.handleCallback(DEFAULT_USER_ID, code);
    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    return res.redirect(`${clientOrigin}/settings?connected=true`);
  } catch (err: any) {
    console.error('[GoogleController] Callback error:', err);
    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    return res.redirect(`${clientOrigin}/settings?error=oauth_failed`);
  }
}

export async function handleGoogleDisconnect(req: Request, res: Response) {
  try {
    await googleAuthService.disconnect(DEFAULT_USER_ID);
    return sendSuccess(res, { message: 'Google account disconnected successfully.' });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to disconnect Google account');
  }
}
