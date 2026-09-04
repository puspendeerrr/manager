import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sonam_jwt_secret_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.cookies && req.cookies.sonam_token) {
    token = req.cookies.sonam_token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Please log in.' },
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    req.user = {
      id: decoded.userId,
      username: decoded.username,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Session expired or invalid. Please log in again.' },
    });
  }
};
