import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../prisma';
import { LoginSchema, validate } from '../schemas';
import { hashPassword, isHashedPassword, verifyPassword } from '../services/password.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_change_in_production';

// POST /login
router.post('/login', validate(LoginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email.endsWith('@iiitu.ac.in')) {
    res.status(401).json({ error: 'Only @iiitu.ac.in emails are allowed.' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const isValidPassword = await verifyPassword(user.password, password);
  if (!isValidPassword) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // Auto-upgrade plaintext passwords to argon2
  if (!isHashedPassword(user.password)) {
    const upgradedHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: upgradedHash },
    });
  }

  const payload = { id: user.id, role: user.role, email: user.email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = crypto.randomUUID();

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.cookie('refreshToken', refreshToken, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
});

// POST /refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    res.status(401).json({ error: 'No refresh token provided' });
    return;
  }

  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }

  const payload = { id: session.user.id, role: session.user.role, email: session.user.email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

  res.json({ token });
});

// POST /logout
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await prisma.session.deleteMany({ where: { refreshToken } });
  }

  res.clearCookie('refreshToken', { path: '/' });
  res.json({ success: true });
});

export default router;
