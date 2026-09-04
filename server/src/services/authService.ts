import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'sonam_jwt_secret_key_2026';
const JWT_EXPIRES_IN = '30d';

export class AuthService {
  async signup(data: { username?: string; password?: string; confirmPassword?: string }) {
    const rawUsername = data.username?.trim();
    const password = data.password;
    const confirmPassword = data.confirmPassword;

    if (!rawUsername) {
      throw new Error('Username is required.');
    }
    if (!password) {
      throw new Error('Password is required.');
    }
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    const usernameLower = rawUsername.toLowerCase();

    // Check case-insensitive uniqueness
    const existing = await prisma.user.findFirst({
      where: { usernameLower },
    });

    if (existing) {
      throw new Error('Username is already taken.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: rawUsername,
        usernameLower,
        passwordHash,
        name: rawUsername,
      },
    });

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
      },
    };
  }

  async login(data: { username?: string; password?: string }) {
    const rawUsername = data.username?.trim();
    const password = data.password;

    if (!rawUsername || !password) {
      throw new Error('Invalid username or password.');
    }

    const usernameLower = rawUsername.toLowerCase();

    const user = await prisma.user.findFirst({
      where: { usernameLower },
    });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid username or password.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid username or password.');
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
      },
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User session invalid.');
    }

    return user;
  }
}

export const authService = new AuthService();
