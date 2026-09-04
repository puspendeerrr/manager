import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Server Error:', err.message || err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected internal server error occurred';
  let code = err.code || 'INTERNAL_SERVER_ERROR';

  // Handle Prisma Known Request Errors (e.g. P2025: Record to delete does not exist)
  if (err.name === 'PrismaClientKnownRequestError' || (typeof err.code === 'string' && err.code.startsWith('P'))) {
    if (err.code === 'P2025' || message.includes('Record to delete does not exist')) {
      statusCode = 404;
      message = 'Task not found';
      code = 'NOT_FOUND';
    } else {
      statusCode = 400;
      message = 'Database request failed';
      code = 'DATABASE_ERROR';
    }
  }

  // Prevent sending raw Prisma invocation stack traces to the user
  if (message.includes('prisma.') || message.includes('invocation')) {
    if (message.includes('not found') || message.includes('P2025')) {
      statusCode = 404;
      message = 'Task not found';
      code = 'NOT_FOUND';
    } else {
      message = 'An error occurred while processing your request.';
    }
  }

  return sendError(res, message, statusCode, code, err.details || null);
}
