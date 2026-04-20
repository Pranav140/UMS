import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { ChangePasswordSchema, ProvisionUserSchema, UpdateUserSchema, validate } from '../schemas';
import { hashPassword, verifyPassword } from '../services/password.service';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// GET / — list users (admin only)
router.get('/', authenticate, authorize(['ADMIN', 'DEVELOPER']), async (req: Request, res: Response) => {
  const { role, search } = req.query as any;

  const where: any = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      studentProfile: true,
      facultyProfile: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ users });
});

// GET /me/profile — current user's profile with role-specific includes
router.get('/me/profile', authenticate, async (req: Request, res: Response) => {
  const userRole = req.user!.role;
  let user;

  if (userRole === 'STUDENT') {
    user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        studentProfile: {
          include: {
            degree: true,
          },
        },
        enrollments: {
          include: {
            section: {
              include: {
                course: true,
                semester: true,
              },
            },
          },
        },
      },
    });
  } else if (userRole === 'FACULTY') {
    user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        facultyProfile: {
          include: {
            sectionsTeaching: {
              include: {
                course: true,
                semester: true,
              },
            },
          },
        },
      },
    });
  } else {
    user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  }

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// GET /:id — single user
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;

  if (req.user!.id !== id && !['ADMIN', 'DEVELOPER'].includes(req.user!.role)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      studentProfile: true,
      facultyProfile: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

// POST /provision — create user (admin only)
router.post(
  '/provision',
  authenticate,
  authorize(['ADMIN', 'DEVELOPER']),
  validate(ProvisionUserSchema),
  async (req: Request, res: Response) => {
    const { email, name, role, initialPassword, profileData } = req.body;

    try {
      // Validate degreeId required for students
      if (role === 'STUDENT' && !profileData?.degreeId) {
        res.status(400).json({ error: 'Degree/Branch is required for students' });
        return;
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(400).json({ error: 'Email already exists' });
        return;
      }

      const hashedPassword = await hashPassword(initialPassword || 'changeme123');

      const user = await prisma.user.create({
        data: { email, name, role, password: hashedPassword },
      });

      if (role === 'STUDENT' && profileData) {
        // Validate degreeId exists
        const degree = await prisma.degree.findUnique({
          where: { id: profileData.degreeId },
        });
        if (!degree) {
          await prisma.user.delete({ where: { id: user.id } });
          res.status(400).json({ error: 'Invalid degree ID' });
          return;
        }

        await prisma.studentProfile.create({
          data: {
            userId: user.id,
            enrollmentYear: profileData.enrollmentYear || new Date().getFullYear(),
            major: profileData.major || 'Undeclared',
            degreeId: profileData.degreeId || null,
          },
        });
      } else if (role === 'FACULTY' && profileData) {
        await prisma.facultyProfile.create({
          data: {
            userId: user.id,
            department: profileData.department || 'General',
            title: profileData.title || 'Instructor',
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'PROVISION_USER',
          details: `Provisioned user ${email} with role ${role}`,
          ipAddress: req.ip,
        },
      });

      res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: 'Failed to provision user', details: e.message });
    }
  }
);

// PATCH /:id — update user
router.patch('/:id', authenticate, validate(UpdateUserSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, profileData } = req.body;

  if (req.user!.id !== id && !['ADMIN', 'DEVELOPER'].includes(req.user!.role)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name: name || user.name },
    });

    if (profileData) {
      if (user.role === 'STUDENT') {
        await prisma.studentProfile.upsert({
          where: { userId: id },
          update: profileData,
          create: { userId: id, enrollmentYear: 2024, major: 'Undeclared', ...profileData },
        });
      } else if (user.role === 'FACULTY') {
        await prisma.facultyProfile.upsert({
          where: { userId: id },
          update: profileData,
          create: { userId: id, department: 'General', ...profileData },
        });
      }
    }

    res.json({ success: true, user: { id: updatedUser.id, name: updatedUser.name } });
  } catch {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /:id — delete user (admin only)
router.delete('/:id', authenticate, authorize(['ADMIN', 'DEVELOPER']), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (req.user!.id === id) {
      res.status(400).json({ error: 'Cannot delete yourself' });
      return;
    }

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE_USER',
        details: `Deleted user ${user.email}`,
        ipAddress: req.ip,
      },
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// POST /change-password
router.post('/change-password', authenticate, validate(ChangePasswordSchema), async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !(await verifyPassword(user.password, currentPassword))) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CHANGE_PASSWORD',
        details: 'Password changed successfully',
        ipAddress: req.ip,
      },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
