import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/copilot', authenticate, async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  const { id: userId, role, name } = req.user!;

  try {
    let contextData: any = {};

    // Gather context depending on role
    if (role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: userId, status: 'ENROLLED' },
        include: {
          section: {
            include: { course: true, faculty: { include: { user: true } } },
          },
        },
      });

      const grades = await prisma.grade.findMany({
        where: { studentId: userId },
        include: { section: { include: { course: true } } },
      });

      // GPA calculation
      const letterToGPA: Record<string, number> = {
        S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0,
        I: 0, L: 0, R: 0, M: 0, ABS: 0,
      };
      let totalPoints = 0;
      let totalCredits = 0;
      grades.forEach((g) => {
        if (g.status === 'FINALIZED') {
          const credits = g.section.course.credits;
          const points = letterToGPA[g.letter || 'F'] || 0;
          totalPoints += points * credits;
          totalCredits += credits;
        }
      });
      const cumulativeGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

      contextData = {
        name,
        role,
        enrolledCourses: enrollments.map(e => ({
          code: e.section.course.code,
          title: e.section.course.title,
          credits: e.section.course.credits,
          instructor: e.section.faculty?.user?.name || 'Assigned',
        })),
        grades: grades.map(g => ({
          course: g.section.course.code,
          score: g.score,
          letter: g.letter,
          status: g.status,
        })),
        cumulativeGPA,
        totalCredits,
      };
    } else if (role === 'FACULTY') {
      const profile = await prisma.facultyProfile.findUnique({
        where: { userId },
      });

      const sections = profile
        ? await prisma.section.findMany({
            where: { facultyId: profile.id },
            include: {
              course: true,
              _count: { select: { enrollments: true } },
            },
          })
        : [];

      contextData = {
        name,
        role,
        assignedSections: sections.map(s => ({
          code: s.course.code,
          title: s.course.title,
          sectionCode: s.sectionCode,
          capacity: s.capacity,
          enrolledCount: s._count.enrollments,
        })),
        totalStudentsTaught: sections.reduce((acc, s) => acc + s._count.enrollments, 0),
      };
    } else {
      // ADMIN or DEVELOPER
      const userCount = await prisma.user.count();
      const courseCount = await prisma.course.count();
      const sectionCount = await prisma.section.count();
      const enrollmentCount = await prisma.enrollment.count({ where: { status: 'ENROLLED' } });

      contextData = {
        name,
        role,
        systemStats: {
          totalUsers: userCount,
          totalCourses: courseCount,
          totalSections: sectionCount,
          totalEnrollments: enrollmentCount,
        },
      };
    }

    const systemPrompt = `You are the AI Academic Copilot for UMS (University Management System).
The current user is ${name} with the role: ${role}.
Here is the live academic and system context from the database:
${JSON.stringify(contextData, null, 2)}

Provide helpful, accurate academic advisor/administrative assistance. Keep answers concise, action-oriented, and directly related to the user's role and data.`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt + `\n\nUser Question: ${message}` }]
            }
          ]
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error: ${errText}`);
      }

      const resJson = await response.json();
      const answer = resJson.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.';
      res.json({ answer });
    } else {
      const q = message.toLowerCase();
      let answer = '';

      if (role === 'STUDENT') {
        if (q.includes('gpa') || q.includes('grade') || q.includes('cgpa')) {
          answer = `Hi ${name}, based on your academic records, your current Cumulative GPA (CGPA) is **${contextData.cumulativeGPA}** across **${contextData.totalCredits}** earned credits.`;
          if (contextData.grades.length > 0) {
            answer += `\n\nRecent grade details:\n` + contextData.grades.map((g: any) => `- **${g.course}**: ${g.letter ?? 'N/A'} (Score: ${g.score ?? 'N/A'})`).join('\n');
          }
        } else if (q.includes('course') || q.includes('class') || q.includes('enrolled')) {
          answer = `Hi ${name}, you are currently enrolled in **${contextData.enrolledCourses.length}** active courses:\n` +
            contextData.enrolledCourses.map((c: any) => `- **${c.code}**: ${c.title} (taught by ${c.instructor})`).join('\n');
        } else {
          answer = `Hi ${name}, I am your Student Academic Assistant. You can ask me about your enrolled courses, GPA status, or grading breakdowns.\n\n*(Note: To unlock general conversational capabilities, please configure a \`GEMINI_API_KEY\` in the backend environment)*`;
        }
      } else if (role === 'FACULTY') {
        if (q.includes('class') || q.includes('section') || q.includes('teach') || q.includes('student')) {
          answer = `Hello Professor ${name}, you are currently teaching **${contextData.assignedSections.length}** sections with a total of **${contextData.totalStudentsTaught}** rostered students.\n\nYour teaching roster breakdown:\n` +
            contextData.assignedSections.map((s: any) => `- **${s.code}** (Sec ${s.sectionCode}): ${s.enrolledCount}/${s.capacity} students enrolled`).join('\n');
        } else {
          answer = `Hello Professor ${name}, I am your Teaching Assistant Copilot. You can ask me about your assigned teaching sections, class roster counts, or class capacities.\n\n*(Note: To unlock general conversational capabilities, please configure a \`GEMINI_API_KEY\` in the backend environment)*`;
        }
      } else {
        if (q.includes('stat') || q.includes('count') || q.includes('system') || q.includes('load') || q.includes('health')) {
          answer = `System Administrator Console status:\n- **Total registered accounts**: ${contextData.systemStats.totalUsers}\n- **Total courses in catalog**: ${contextData.systemStats.totalCourses}\n- **Total scheduled sections**: ${contextData.systemStats.totalSections}\n- **Total active enrollments**: ${contextData.systemStats.totalEnrollments}\n- **Services health check**: Database connection is active and responding.`;
        } else {
          answer = `Hello Administrator ${name}, I am the UMS System Copilot. You can ask me for live stats regarding accounts, course catalogs, active enrollments, or system health.\n\n*(Note: To unlock general conversational capabilities, please configure a \`GEMINI_API_KEY\` in the backend environment)*`;
        }
      }

      res.json({ answer });
    }
  } catch (err: any) {
    console.error('AI Copilot Router Error:', err);
    res.status(500).json({ error: 'Failed to generate copilot response.' });
  }
});

export default router;
