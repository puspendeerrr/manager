import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// Cookie options for production & localhost
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});

router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, user } = await authService.signup(req.body);
    res.cookie('sonam_token', token, getCookieOptions());
    return sendSuccess(res, { user, token });
  } catch (err: any) {
    if (err.message?.includes('already taken')) {
      return sendError(res, err.message, 409, 'CONFLICT');
    }
    return sendError(res, err.message || 'Signup failed', 400, 'BAD_REQUEST');
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, user } = await authService.login(req.body);
    res.cookie('sonam_token', token, getCookieOptions());
    return sendSuccess(res, { user, token });
  } catch (err: any) {
    return sendError(res, err.message || 'Invalid credentials', 401, 'UNAUTHORIZED');
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('sonam_token', getCookieOptions());
  return sendSuccess(res, { message: 'Logged out successfully' });
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getMe(req.user!.id);
    return sendSuccess(res, { user });
  } catch (err: any) {
    return sendError(res, err.message || 'Session invalid', 401, 'UNAUTHORIZED');
  }
});

export default router;
