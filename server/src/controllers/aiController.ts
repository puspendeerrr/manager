import { Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { sendSuccess, sendError } from '../utils/response';

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'user_dev_01';

export async function handleChat(req: Request, res: Response) {
  try {
    const { message } = req.body;
    if (!message) throw new Error('Message text is required');

    const result = await aiService.chat(DEFAULT_USER_ID, message);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, err.message || 'AI Chat processing failed');
  }
}

export const handleAiChat = handleChat;

export async function handleParseTask(req: Request, res: Response) {
  try {
    const { input } = req.body;
    if (!input) throw new Error('Input text is required');

    const result = await aiService.parseTask(DEFAULT_USER_ID, input);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, err.message || 'Task parsing failed');
  }
}

export async function handleSplitTask(req: Request, res: Response) {
  try {
    const { goal } = req.body;
    if (!goal) throw new Error('Goal text is required');

    const result = await aiService.splitTask(DEFAULT_USER_ID, goal);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, err.message || 'Task splitting failed');
  }
}
