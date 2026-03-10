import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { SectionIdPayloadSchema, validate } from '../schemas';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// POST /register — student enrolls in a section
router.post(
  '/register',
  authenticate,
  authorize(['STUDENT']),
  validate(SectionIdPayloadSchema),
  async (req: Request, res: Response) => {
    const { sectionId } = req.body;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const section = await tx.section.findUnique({
          where: { id: sectionId },
          include: {
            _count: { select: { enrollments: true } },
            semester: true,
          },
        });

        if (!section) throw new Error('Section not found');
        if (!section.semester.isActive) throw new Error('Cannot enroll in inactive semester');
        if (section._count.enrollments >= section.capacity) throw new Error('Section is at full capacity');

        const existing = await tx.enrollment.findUnique({
          where: {
            studentId_sectionId: {
              studentId: req.user!.id,
              sectionId,
            },
          },
        });

        if (existing) {
          throw new Error('Already enrolled in this section');
        }

        const enrollment = await tx.enrollment.create({
          data: {
            studentId: req.user!.id,
            sectionId,
            status: 'ENROLLED',
          },
        });

        return enrollment;
      });

      res.json({ success: true, enrollment: result });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
);

// POST /drop — student drops a section
router.post(
  '/drop',
  authenticate,
  authorize(['STUDENT']),
  validate(SectionIdPayloadSchema),
  async (req: Request, res: Response) => {
    const { sectionId } = req.body;

    try {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_sectionId: {
            studentId: req.user!.id,
            sectionId,
          },
        },
        include: { section: { include: { semester: true } } },
      });

      if (!enrollment) {
        res.status(404).json({ error: 'Enrollment not found' });
        return;
      }

      if (!enrollment.section.semester.isActive) {
        res.status(400).json({ error: 'Cannot drop from inactive semester' });
        return;
      }

      await prisma.enrollment.update({
        where: {
          studentId_sectionId: {
            studentId: req.user!.id,
            sectionId,
          },
        },
        data: { status: 'DROPPED' },
      });

      res.json({ success: true, message: 'Section dropped successfully' });
    } catch {
      res.status(500).json({ error: 'Failed to drop section' });
    }
  }
);

// GET /my-enrollments — student's enrollments
router.get('/my-enrollments', authenticate, authorize(['STUDENT']), async (req: Request, res: Response) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: req.user!.id },
    include: {
      section: {
        include: {
          course: true,
          semester: true,
          faculty: { include: { user: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ enrollments });
});

// POST /claim — faculty claims a section
router.post(
  '/claim',
  authenticate,
  authorize(['FACULTY']),
  validate(SectionIdPayloadSchema),
  async (req: Request, res: Response) => {
    const { sectionId } = req.body;

    try {
      const profile = await prisma.facultyProfile.findUnique({ where: { userId: req.user!.id } });
      if (!profile) {
        res.status(404).json({ error: 'Faculty profile not found' });
        return;
      }

      const section = await prisma.section.findUnique({ where: { id: sectionId } });
      if (!section) {
        res.status(404).json({ error: 'Section not found' });
        return;
      }
      if (section.facultyId) {
        res.status(400).json({ error: 'Section is already claimed' });
        return;
      }

      const updatedSection = await prisma.section.update({
        where: { id: sectionId },
        data: { facultyId: profile.id },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CLAIM_SECTION',
          details: `Claimed section ${sectionId}`,
          ipAddress: req.ip,
        },
      });

      res.json({ success: true, section: updatedSection });
    } catch {
      res.status(500).json({ error: 'Failed to claim section' });
    }
  }
);

// POST /release — faculty releases a section
router.post(
  '/release',
  authenticate,
  authorize(['FACULTY']),
  validate(SectionIdPayloadSchema),
  async (req: Request, res: Response) => {
    const { sectionId } = req.body;

    try {
      const profile = await prisma.facultyProfile.findUnique({ where: { userId: req.user!.id } });
      if (!profile) {
        res.status(404).json({ error: 'Faculty profile not found' });
        return;
      }

      const section = await prisma.section.findUnique({ where: { id: sectionId } });
      if (!section) {
        res.status(404).json({ error: 'Section not found' });
        return;
      }
      if (section.facultyId !== profile.id) {
        res.status(403).json({ error: 'You are not assigned to this section' });
        return;
      }

      await prisma.section.update({
        where: { id: sectionId },
        data: { facultyId: null },
      });

      res.json({ success: true, message: 'Section released successfully' });
    } catch {
      res.status(500).json({ error: 'Failed to release section' });
    }
  }
);

// GET /my-sections — faculty's teaching sections
router.get('/my-sections', authenticate, authorize(['FACULTY']), async (req: Request, res: Response) => {
  const profile = await prisma.facultyProfile.findUnique({
    where: { userId: req.user!.id },
    include: {
      sectionsTeaching: {
        include: {
          course: true,
          semester: true,
          _count: { select: { enrollments: true } },
          enrollments: {
            where: { status: 'ENROLLED' },
            include: { student: true },
          },
        },
      },
    },
  });

  if (!profile) {
    res.status(404).json({ error: 'Faculty profile not found' });
    return;
  }

  res.json({ sections: profile.sectionsTeaching });
});

// GET /section/:sectionId — enrolled students for a section (faculty/admin)
router.get('/section/:sectionId', authenticate, authorize(['FACULTY', 'ADMIN', 'DEVELOPER']), async (req: Request, res: Response) => {
  const sectionId = req.params.sectionId as string;

  // Faculty may only access their own sections
  if (req.user!.role === 'FACULTY') {
    const profile = await prisma.facultyProfile.findUnique({ where: { userId: req.user!.id } });
    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    if (!section) {
      res.status(404).json({ error: 'Section not found' });
      return;
    }
    if (section.facultyId !== profile?.id) {
      res.status(403).json({ error: 'You are not assigned to this section' });
      return;
    }
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { sectionId, status: 'ENROLLED' },
    include: {
      student: { select: { id: true, name: true, email: true, studentProfile: true } },
      section: { include: { course: true, semester: true } },
    },
    orderBy: { student: { name: 'asc' } },
  });

  res.json({ enrollments });
});

// GET /all — all enrollments (admin)
router.get('/all', authenticate, authorize(['ADMIN', 'DEVELOPER']), async (req: Request, res: Response) => {
  const { semesterId, courseId, status } = req.query as any;

  const where: any = {};
  if (status) where.status = status;
  if (semesterId || courseId) {
    where.section = {};
    if (semesterId) where.section.semesterId = semesterId;
    if (courseId) where.section.courseId = courseId;
  }

  const enrollments = await prisma.enrollment.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, email: true, studentProfile: true } },
      section: {
        include: {
          course: true,
          semester: true,
          faculty: { include: { user: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ enrollments });
});

export default router;
