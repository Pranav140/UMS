import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { generateTranscriptPDF } from '../services/pdf.service';
import { AttendanceSchema, BulkAttendanceSchema, BulkGradeSchema, GradeSchema, validate } from '../schemas';
import { authenticate, authorize } from '../middleware/auth';
import { calculateFinalScore, calculateLetterGrade } from '../services/grade.service';

const router = Router();

// ── Attendance ────────────────────────────────────────────────────

// POST /attendance — mark single attendance
router.post(
  '/attendance',
  authenticate,
  authorize(['FACULTY', 'ADMIN']),
  validate(AttendanceSchema),
  async (req: Request, res: Response) => {
    const { sectionId, studentId, date, isPresent } = req.body;

    if (req.user!.role === 'FACULTY') {
      const section = await prisma.section.findUnique({ where: { id: sectionId } });
      const profile = await prisma.facultyProfile.findUnique({ where: { userId: req.user!.id } });
      if (section?.facultyId !== profile?.id) {
        res.status(403).json({ error: 'You are not assigned to this section.' });
        return;
      }
    }

    try {
      const attendance = await prisma.attendance.upsert({
        where: {
          studentId_sectionId_date: { studentId, sectionId, date: new Date(date) },
        },
        update: { isPresent },
        create: { studentId, sectionId, date: new Date(date), isPresent },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'MARK_ATTENDANCE',
          details: `Marked attendance for student ${studentId} in section ${sectionId}`,
          ipAddress: req.ip,
        },
      });

      res.json({ success: true, attendance });
    } catch {
      res.status(500).json({ error: 'Failed to record attendance.' });
    }
  }
);

// POST /attendance/bulk — mark bulk attendance
router.post(
  '/attendance/bulk',
  authenticate,
  authorize(['FACULTY', 'ADMIN']),
  validate(BulkAttendanceSchema),
  async (req: Request, res: Response) => {
    const { sectionId, date, attendances } = req.body;

    if (req.user!.role === 'FACULTY') {
      const section = await prisma.section.findUnique({ where: { id: sectionId } });
      const profile = await prisma.facultyProfile.findUnique({ where: { userId: req.user!.id } });
      if (section?.facultyId !== profile?.id) {
        res.status(403).json({ error: 'You are not assigned to this section.' });
        return;
      }
    }

    try {
      const results = await Promise.all(
        attendances.map(async (att: any) => {
          return prisma.attendance.upsert({
            where: {
              studentId_sectionId_date: {
                studentId: att.studentId,
                sectionId,
                date: new Date(date),
              },
            },
            update: { isPresent: att.isPresent },
            create: {
              studentId: att.studentId,
              sectionId,
              date: new Date(date),
              isPresent: att.isPresent,
            },
          });
        })
      );

      res.json({ success: true, count: results.length });
    } catch {
      res.status(500).json({ error: 'Failed to record bulk attendance' });
    }
  }
);

// GET /attendance/section/:sectionId
router.get('/attendance/section/:sectionId', authenticate, async (req: Request, res: Response) => {
  const { sectionId } = req.params;
  const { startDate, endDate } = req.query as any;

  const where: any = { sectionId };
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string),
    };
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ date: 'asc' }, { student: { name: 'asc' } }],
  });

  res.json({ attendances });
});

// GET /attendance/student/:studentId
router.get('/attendance/student/:studentId', authenticate, async (req: Request, res: Response) => {
  const { studentId } = req.params;

  if (req.user!.role === 'STUDENT' && req.user!.id !== studentId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const attendances = await prisma.attendance.findMany({
    where: { studentId },
    include: {
      section: {
        include: {
          course: true,
          semester: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  const stats = attendances.reduce((acc: any, att) => {
    const sectionKey = att.sectionId;
    if (!acc[sectionKey]) {
      acc[sectionKey] = {
        section: att.section,
        total: 0,
        present: 0,
        absent: 0,
      };
    }
    acc[sectionKey].total++;
    if (att.isPresent) {
      acc[sectionKey].present++;
    } else {
      acc[sectionKey].absent++;
    }
    return acc;
  }, {});

  res.json({ attendances, statistics: Object.values(stats) });
});

// ── Grades ────────────────────────────────────────────────────────

// POST /grade — single grade
router.post(
  '/grade',
  authenticate,
  authorize(['FACULTY', 'ADMIN']),
  validate(GradeSchema),
  async (req: Request, res: Response) => {
    const { sectionId, studentId, status, score: givenScore, letter: givenLetter, ...marks } = req.body;

    let section;
    if (req.user!.role === 'FACULTY') {
      section = await prisma.section.findUnique({ where: { id: sectionId }, include: { course: true } });
      const profile = await prisma.facultyProfile.findUnique({ where: { userId: req.user!.id } });
      if (section?.facultyId !== profile?.id) {
        res.status(403).json({ error: 'You are not assigned to this section.' });
        return;
      }
    } else {
      section = await prisma.section.findUnique({ where: { id: sectionId }, include: { course: true } });
    }

    try {
      const existingGrade = await prisma.grade.findUnique({
        where: { studentId_sectionId: { studentId, sectionId } },
      });

      if (existingGrade?.status === 'FINALIZED' && req.user!.role !== 'ADMIN') {
        res.status(403).json({ error: 'Grade is finalized and cannot be modified.' });
        return;
      }

      let finalScore = givenScore;
      let finalLetter = givenLetter;

      // Automatically calculate total score and letter if not provided explicitly based on rubrics
      if (section?.course) {
        const computedScore = calculateFinalScore(section.course, marks);
        if (givenScore === undefined) finalScore = computedScore;
        if (givenLetter === undefined) finalLetter = calculateLetterGrade(finalScore || computedScore);
      }

      const grade = await prisma.grade.upsert({
        where: { studentId_sectionId: { studentId, sectionId } },
        update: { 
          score: finalScore, 
          letter: finalLetter, 
          status: status || 'DRAFT',
          theoryCa: marks.theoryCa,
          theoryMt: marks.theoryMt,
          theoryEs: marks.theoryEs,
          labCa: marks.labCa,
          labFr: marks.labFr,
          labEs: marks.labEs,
          projectCa: marks.projectCa,
          projectMr: marks.projectMr,
          projectEs: marks.projectEs,
        },
        create: { 
          studentId, 
          sectionId, 
          score: finalScore, 
          letter: finalLetter, 
          status: status || 'DRAFT',
          theoryCa: marks.theoryCa,
          theoryMt: marks.theoryMt,
          theoryEs: marks.theoryEs,
          labCa: marks.labCa,
          labFr: marks.labFr,
          labEs: marks.labEs,
          projectCa: marks.projectCa,
          projectMr: marks.projectMr,
          projectEs: marks.projectEs,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: status === 'FINALIZED' ? 'FINALIZE_GRADE' : 'UPDATE_GRADE',
          details: `Updated grade for student ${studentId} in section ${sectionId}`,
          ipAddress: req.ip,
        },
      });

      res.json({ success: true, grade });
    } catch {
      res.status(500).json({ error: 'Failed to record grade.' });
    }
  }
);

// POST /grade/bulk — bulk grades
router.post(
  '/grade/bulk',
  authenticate,
  authorize(['FACULTY', 'ADMIN']),
  validate(BulkGradeSchema),
  async (req: Request, res: Response) => {
    const { sectionId, grades } = req.body;
    let section;

    if (req.user!.role === 'FACULTY') {
      section = await prisma.section.findUnique({ where: { id: sectionId }, include: { course: true } });
      const profile = await prisma.facultyProfile.findUnique({ where: { userId: req.user!.id } });
      if (section?.facultyId !== profile?.id) {
        res.status(403).json({ error: 'You are not assigned to this section.' });
        return;
      }
    } else {
      section = await prisma.section.findUnique({ where: { id: sectionId }, include: { course: true } });
    }

    try {
      const results = await Promise.all(
        grades.map(async (g: any) => {
          let finalScore = g.score;
          let finalLetter = g.letter;
          
          if (section?.course) {
            const computedScore = calculateFinalScore(section.course, g);
            if (g.score === undefined) finalScore = computedScore;
            if (g.letter === undefined) finalLetter = calculateLetterGrade(finalScore || computedScore);
          }

          return prisma.grade.upsert({
            where: {
              studentId_sectionId: { studentId: g.studentId, sectionId },
            },
            update: { 
              score: finalScore, 
              letter: finalLetter, 
              status: g.status || 'DRAFT',
              theoryCa: g.theoryCa,
              theoryMt: g.theoryMt,
              theoryEs: g.theoryEs,
              labCa: g.labCa,
              labFr: g.labFr,
              labEs: g.labEs,
              projectCa: g.projectCa,
              projectMr: g.projectMr,
              projectEs: g.projectEs,
            },
            create: {
              studentId: g.studentId,
              sectionId,
              score: finalScore,
              letter: finalLetter,
              status: g.status || 'DRAFT',
              theoryCa: g.theoryCa,
              theoryMt: g.theoryMt,
              theoryEs: g.theoryEs,
              labCa: g.labCa,
              labFr: g.labFr,
              labEs: g.labEs,
              projectCa: g.projectCa,
              projectMr: g.projectMr,
              projectEs: g.projectEs,
            },
          });
        })
      );

      res.json({ success: true, count: results.length });
    } catch {
      res.status(500).json({ error: 'Failed to submit bulk grades' });
    }
  }
);

// GET /grade/section/:sectionId
router.get('/grade/section/:sectionId', authenticate, async (req: Request, res: Response) => {
  const { sectionId } = req.params;

  const grades = await prisma.grade.findMany({
    where: { sectionId },
    include: {
      student: {
        select: { id: true, name: true, email: true, studentProfile: true },
      },
      section: {
        include: {
          course: true,
          semester: true,
        },
      },
    },
    orderBy: { student: { name: 'asc' } },
  });

  res.json({ grades });
});

// GET /grade/student/:studentId
router.get('/grade/student/:studentId', authenticate, async (req: Request, res: Response) => {
  const { studentId } = req.params;

  if (req.user!.role === 'STUDENT' && req.user!.id !== studentId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const grades = await prisma.grade.findMany({
    where: { studentId },
    include: {
      section: {
        include: {
          course: true,
          semester: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ grades });
});

// ── Transcript ────────────────────────────────────────────────────

// GET /transcript/:studentId
router.get('/transcript/:studentId', authenticate, async (req: Request, res: Response) => {
  const { studentId } = req.params;

  if (req.user!.role === 'STUDENT' && req.user!.id !== studentId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: true,
        enrollments: {
          where: { status: 'ENROLLED' },
          include: {
            section: {
              include: {
                course: true,
                semester: true,
              },
            },
          },
        },
        grades: {
          where: { status: 'FINALIZED' },
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

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const pdfBuffer = await generateTranscriptPDF(student);

    res
      .setHeader('Content-Type', 'application/pdf')
      .setHeader('Content-Disposition', `attachment; filename="transcript-${student.email}.pdf"`)
      .send(pdfBuffer);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate transcript' });
  }
});

// ── GPA ───────────────────────────────────────────────────────────

// GET /gpa/:studentId
router.get('/gpa/:studentId', authenticate, async (req: Request, res: Response) => {
  const { studentId } = req.params;

  if (req.user!.role === 'STUDENT' && req.user!.id !== studentId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const grades = await prisma.grade.findMany({
    where: { studentId, status: 'FINALIZED' },
    include: {
      section: {
        include: { course: true, semester: true },
      },
    },
  });

  const letterToGPA: any = {
    S: 10, A: 9, B: 8, C: 7, D: 6, E: 5,
    I: 0, L: 0, R: 0, M: 0, ABS: 0,
  };

  let totalPoints = 0;
  let totalCredits = 0;

  const semesterGPAs: any = {};

  grades.forEach((grade) => {
    const credits = grade.section.course.credits;
    const points = letterToGPA[grade.letter || 'F'] || 0;

    totalPoints += points * credits;
    totalCredits += credits;

    const semesterId = grade.section.semester.id;
    if (!semesterGPAs[semesterId]) {
      semesterGPAs[semesterId] = {
        semester: grade.section.semester,
        points: 0,
        credits: 0,
      };
    }
    semesterGPAs[semesterId].points += points * credits;
    semesterGPAs[semesterId].credits += credits;
  });

  const cumulativeGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

  const semesterBreakdown = Object.values(semesterGPAs).map((sem: any) => ({
    semester: sem.semester,
    gpa: sem.credits > 0 ? (sem.points / sem.credits).toFixed(2) : '0.00',
    credits: sem.credits,
  }));

  res.json({
    studentId,
    cumulativeGPA,
    totalCredits,
    semesterBreakdown,
  });
});

export default router;
