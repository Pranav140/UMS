import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { CreateDegreeSchema, UpdateDegreeSchema, validate, validateQuery } from '../schemas';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// ── Degrees ───────────────────────────────────────────────────────

// GET / — list all degrees with optional filtering
const ListDegreesQuerySchema = z.object({
  isMajor: z.enum(['true', 'false']).optional(),
});

router.get(
  '/',
  authenticate,
  validateQuery(ListDegreesQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { isMajor } = req.query as any;

      const where: any = {};
      if (isMajor !== undefined) {
        where.isMajor = isMajor === 'true';
      }

      const degrees = await prisma.degree.findMany({
        where,
        include: {
          studentProfiles: {
            include: { user: true },
          },
        },
        orderBy: [{ isMajor: 'desc' }, { code: 'asc' }],
      });

      res.json({ degrees });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch degrees' });
    }
  }
);

// GET /:id — single degree
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const degree = await prisma.degree.findUnique({
      where: { id },
      include: {
        studentProfiles: {
          include: { user: true },
        },
      },
    });

    if (!degree) {
      res.status(404).json({ error: 'Degree not found' });
      return;
    }

    res.json({ degree });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch degree' });
  }
});

// POST / — create degree (admin only)
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'DEVELOPER']),
  validate(CreateDegreeSchema),
  async (req: Request, res: Response) => {
    const { code, name, isMajor, description } = req.body;

    try {
      // Check if code already exists
      const existing = await prisma.degree.findFirst({
        where: { code: code.toUpperCase() },
      });

      if (existing) {
        res.status(400).json({ error: 'Degree code already exists' });
        return;
      }

      const degree = await prisma.degree.create({
        data: {
          code: code.toUpperCase(),
          name,
          isMajor,
          description: description || null,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CREATE_DEGREE',
          details: `Created degree ${code} - ${name} (${isMajor ? 'Major' : 'Minor'})`,
          ipAddress: req.ip,
        },
      });

      res.json({ success: true, degree });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create degree' });
    }
  }
);

// PATCH /:id — update degree (admin only)
router.patch(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'DEVELOPER']),
  validate(UpdateDegreeSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { code, name, isMajor, description } = req.body;

    try {
      // If code is being updated, check for uniqueness
      if (code) {
        const existing = await prisma.degree.findFirst({
          where: {
            code: code.toUpperCase(),
            NOT: { id },
          },
        });

        if (existing) {
          res.status(400).json({ error: 'Degree code already exists' });
          return;
        }
      }

      const degree = await prisma.degree.update({
        where: { id },
        data: {
          code: code?.toUpperCase(),
          name,
          isMajor,
          description,
        },
      });

      res.json({ success: true, degree });
    } catch (error) {
      if ((error as any).code === 'P2025') {
        res.status(404).json({ error: 'Degree not found' });
        return;
      }
      res.status(500).json({ error: 'Failed to update degree' });
    }
  }
);

// DELETE /:id — delete degree (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'DEVELOPER']),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // Check if any students have this degree
      const studentCount = await prisma.studentProfile.count({
        where: { degreeId: id },
      });

      if (studentCount > 0) {
        res.status(400).json({
          error: `Cannot delete degree: ${studentCount} student(s) are assigned to this degree`,
        });
        return;
      }

      await prisma.degree.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'DELETE_DEGREE',
          details: `Deleted degree with ID ${id}`,
          ipAddress: req.ip,
        },
      });

      res.json({ success: true, message: 'Degree deleted successfully' });
    } catch (error) {
      if ((error as any).code === 'P2025') {
        res.status(404).json({ error: 'Degree not found' });
        return;
      }
      res.status(500).json({ error: 'Failed to delete degree' });
    }
  }
);

export default router;
