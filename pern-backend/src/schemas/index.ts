import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// ── Reusable atoms ────────────────────────────────────────────────
export const RoleSchema = z.enum(['STUDENT', 'FACULTY', 'ADMIN', 'DEVELOPER']);
export const GradeStatusSchema = z.enum(['DRAFT', 'FINALIZED']);

// ── Auth ──────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Users ─────────────────────────────────────────────────────────
export const ProvisionUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: RoleSchema,
  initialPassword: z.string().min(8).optional(),
  profileData: z
    .object({
      enrollmentYear: z.number().min(2000).max(2100).optional(),
      major: z.string().min(1).optional(),
      department: z.string().min(1).optional(),
      title: z.string().min(1).optional(),
    })
    .optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  profileData: z
    .object({
      enrollmentYear: z.number().min(2000).max(2100).optional(),
      major: z.string().min(1).optional(),
      department: z.string().min(1).optional(),
      title: z.string().min(1).optional(),
    })
    .optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// ── Courses ───────────────────────────────────────────────────────
export const CreateCourseSchema = z.object({
  code: z.string().min(1).max(20),
  title: z.string().min(1),
  description: z.string().optional(),
  credits: z.number().min(1).max(10),
});

export const UpdateCourseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  credits: z.number().min(1).max(10).optional(),
});

// ── Semesters ─────────────────────────────────────────────────────
export const CreateSemesterSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().optional(),
});

// ── Sections ──────────────────────────────────────────────────────
export const CreateSectionSchema = z.object({
  courseId: z.string().uuid(),
  semesterId: z.string().uuid(),
  capacity: z.number().min(1),
  facultyId: z.string().uuid().optional(),
});

export const UpdateSectionSchema = z.object({
  capacity: z.number().min(1).optional(),
  facultyId: z.string().uuid().nullable().optional(),
});

export const SectionIdPayloadSchema = z.object({
  sectionId: z.string().uuid(),
});

// ── Attendance ────────────────────────────────────────────────────
export const AttendanceSchema = z.object({
  sectionId: z.string().uuid(),
  studentId: z.string().uuid(),
  date: z.string().datetime(),
  isPresent: z.boolean(),
});

export const BulkAttendanceSchema = z.object({
  sectionId: z.string().uuid(),
  date: z.string().datetime(),
  attendances: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        isPresent: z.boolean(),
      })
    )
    .min(1),
});

// ── Grades ────────────────────────────────────────────────────────
export const GradeSchema = z.object({
  sectionId: z.string().uuid(),
  studentId: z.string().uuid(),
  score: z.number().min(0).max(100).optional(),
  letter: z.string().min(1).max(3).optional(),
  status: GradeStatusSchema.optional(),
});

export const BulkGradeSchema = z.object({
  sectionId: z.string().uuid(),
  grades: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        score: z.number().min(0).max(100).optional(),
        letter: z.string().min(1).max(3).optional(),
        status: GradeStatusSchema.optional(),
      })
    )
    .min(1),
});

// ── Files ─────────────────────────────────────────────────────────
export const FileUploadUrlSchema = z.object({
  key: z.string().min(1),
  contentType: z.string().min(1),
});

export const FileDownloadUrlSchema = z.object({
  key: z.string().min(1),
});

// ── Validation middleware helper ──────────────────────────────────
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    next();
  };
}
