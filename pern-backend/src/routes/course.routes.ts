import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import {
  CreateCourseSchema,
  CreateSectionSchema,
  CreateSemesterSchema,
  UpdateCourseSchema,
  UpdateSectionSchema,
  validate,
} from '../schemas';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// ── Courses ───────────────────────────────────────────────────────

// GET / — list all courses
router.get('/', authenticate, async (_req: Request, res: Response) => {
  const courses = await prisma.course.findMany({
    include: {
      sections: {
        include: {
          semester: true,
          faculty: { include: { user: true } },
          _count: { select: { enrollments: true } },
        },
      },
    },
  });
  res.json({ courses });
});

// GET /:id — single course
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      sections: {
        include: {
          semester: true,
          faculty: { include: { user: true } },
          enrollments: { include: { student: true } },
          _count: { select: { enrollments: true } },
        },
      },
    },
  });
  if (!course) {
    res.status(404).json({ error: 'Course not found' });
    return;
  }
  res.json({ course });
});

// POST / — create course (admin)
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'DEVELOPER']),
  validate(CreateCourseSchema),
  async (req: Request, res: Response) => {
    const { code, title, description, credits } = req.body;

    try {
      const course = await prisma.course.create({
        data: { code, title, description, credits: Number(credits) },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CREATE_COURSE',
          details: `Created course ${code} - ${title}`,
          ipAddress: req.ip,
        },
      });

      res.json({ success: true, course });
    } catch {
      res.status(400).json({ error: 'Failed to create course. Code might already exist.' });
    }
  }
);

// PATCH /:id — update course (admin)
router.patch(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'DEVELOPER']),
  validate(UpdateCourseSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, credits } = req.body;

    try {
      const course = await prisma.course.update({
        where: { id },
        data: { title, description, credits: credits !== undefined ? Number(credits) : undefined },
      });
      res.json({ success: true, course });
    } catch {
      res.status(400).json({ error: 'Failed to update course' });
    }
  }
);

// DELETE /:id — delete course (admin)
router.delete('/:id', authenticate, authorize(['ADMIN', 'DEVELOPER']), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.course.delete({ where: { id } });
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch {
    res.status(400).json({ error: 'Failed to delete course. It may have existing sections.' });
  }
});

// ── Semesters ─────────────────────────────────────────────────────

// GET /semesters/list
router.get('/semesters/list', authenticate, async (_req: Request, res: Response) => {
  const semesters = await prisma.semester.findMany({
    include: {
      sections: {
        include: {
          course: true,
          _count: { select: { enrollments: true } },
        },
      },
    },
    orderBy: { startDate: 'desc' },
  });
  res.json({ semesters });
});

// GET /semesters/active
router.get('/semesters/active', authenticate, async (_req: Request, res: Response) => {
  const semester = await prisma.semester.findFirst({
    where: { isActive: true },
    include: {
      sections: {
        include: {
          course: true,
          faculty: { include: { user: true } },
          _count: { select: { enrollments: true } },
        },
      },
    },
  });
  res.json({ semester });
});

// POST /semesters — create semester (admin)
router.post(
  '/semesters',
  authenticate,
  authorize(['ADMIN', 'DEVELOPER']),
  validate(CreateSemesterSchema),
  async (req: Request, res: Response) => {
    const { name, startDate, endDate, isActive } = req.body;

    try {
      if (isActive) {
        await prisma.semester.updateMany({ data: { isActive: false } });
      }
      const semester = await prisma.semester.create({
        data: {
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isActive: isActive || false,
        },
      });
      res.json({ success: true, semester });
    } catch {
      res.status(400).json({ error: 'Failed to create semester.' });
    }
  }
);

// PATCH /semesters/:id/activate — activate a semester (admin)
router.patch(
  '/semesters/:id/activate',
  authenticate,
  authorize(['ADMIN', 'DEVELOPER']),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      await prisma.semester.updateMany({ data: { isActive: false } });
      const semester = await prisma.semester.update({
        where: { id },
        data: { isActive: true },
      });
      res.json({ success: true, semester });
    } catch {
      res.status(400).json({ error: 'Failed to activate semester' });
    }
  }
);

// ── Sections ──────────────────────────────────────────────────────

// GET /sections/available — sections in active semester
router.get('/sections/available', authenticate, async (_req: Request, res: Response) => {
  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });
  if (!activeSemester) {
    res.json({ sections: [] });
    return;
  }

  const sections = await prisma.section.findMany({
    where: { semesterId: activeSemester.id },
    include: {
      course: true,
      semester: true,
      faculty: { include: { user: true } },
      _count: { select: { enrollments: true } },
    },
  });

  res.json({ sections });
});

// GET /sections/:id — single section
router.get('/sections/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  const section = await prisma.section.findUnique({
    where: { id },
    include: {
      course: true,
      semester: true,
      faculty: { include: { user: true } },
      enrollments: {
        include: {
          student: {
            select: { id: true, name: true, email: true, studentProfile: true },
          },
        },
      },
      grades: { include: { student: true } },
      attendances: { include: { student: true } },
    },
  });

  if (!section) {
    res.status(404).json({ error: 'Section not found' });
    return;
  }
  res.json({ section });
});

// POST /sections — create section (admin)
router.post(
  '/sections',
  authenticate,
  authorize(['ADMIN', 'DEVELOPER']),
  validate(CreateSectionSchema),
  async (req: Request, res: Response) => {
    const { courseId, semesterId, capacity, facultyId } = req.body;

    try {
      const section = await prisma.section.create({
        data: {
          courseId,
          semesterId,
          capacity: Number(capacity),
          facultyId: facultyId || null,
        },
      });
      res.json({ success: true, section });
    } catch {
      res.status(400).json({ error: 'Failed to create section.' });
    }
  }
);

// PATCH /sections/:id — update section (admin)
router.patch(
  '/sections/:id',
  authenticate,
  authorize(['ADMIN', 'DEVELOPER']),
  validate(UpdateSectionSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { capacity, facultyId } = req.body;

    try {
      const section = await prisma.section.update({
        where: { id },
        data: {
          capacity: capacity !== undefined ? Number(capacity) : undefined,
          facultyId: facultyId !== undefined ? facultyId : undefined,
        },
      });
      res.json({ success: true, section });
    } catch {
      res.status(400).json({ error: 'Failed to update section' });
    }
  }
);

// DELETE /sections/:id — delete section (admin)
router.delete('/sections/:id', authenticate, authorize(['ADMIN', 'DEVELOPER']), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.section.delete({ where: { id } });
    res.json({ success: true, message: 'Section deleted successfully' });
  } catch {
    res.status(400).json({ error: 'Failed to delete section. It may have existing enrollments.' });
  }
});

export default router;
