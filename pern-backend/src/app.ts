import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import courseRoutes from './routes/course.routes';
import degreeRoutes from './routes/degree.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import academicRoutes from './routes/academic.routes';
import filesRoutes from './routes/files.routes';
import prisma from './prisma';

const app = express();

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || 'cookie_supersecret'));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/degrees', degreeRoutes);
app.use('/api/v1/enrollment', enrollmentRoutes);
app.use('/api/v1/academic', academicRoutes);
app.use('/api/v1/files', filesRoutes);

// ── Health ────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  let dbStatus = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = true;
  } catch {
    // db unreachable
  }

  const status = dbStatus ? 'OK' : 'DEGRADED';
  res.status(dbStatus ? 200 : 503).json({
    status,
    services: {
      api: true,
      database: dbStatus,
    },
    timestamp: new Date().toISOString(),
  });
});

export default app;
