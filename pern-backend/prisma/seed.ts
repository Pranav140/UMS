import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
import { hash } from '@node-rs/argon2';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string) {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

async function main() {
  console.log('🌱 Starting comprehensive database seeding...\n');

  // Clean existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.grade.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.semester.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.facultyProfile.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✓ Database cleaned\n');

  // ============= USERS =============
  console.log('👥 Creating users...');

  const devPasswordHash = await hashPassword('Dev@2026');
  const adminPasswordHash = await hashPassword('Admin@2026');
  const facultyPasswordHash = await hashPassword('Faculty@2026');
  const studentPasswordHash = await hashPassword('Student@2026');

  // Developers
  const developer = await prisma.user.create({
    data: {
      email: 'developer@iiitu.ac.in',
      password: devPasswordHash,
      name: 'System Developer',
      role: 'DEVELOPER',
    },
  });

  // Admins
  const admin1 = await prisma.user.create({
    data: {
      email: 'sukhsagar@iiitu.ac.in',
      password: adminPasswordHash,
      name: 'Sukhsagar (Admin)',
      role: 'ADMIN',
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      email: 'admin.registrar@iiitu.ac.in',
      password: adminPasswordHash,
      name: 'Dr. Rajesh Kumar (Registrar)',
      role: 'ADMIN',
    },
  });

  // Faculty Members
  const faculty1 = await prisma.user.create({
    data: {
      email: 'manish.g@iiitu.ac.in',
      password: facultyPasswordHash,
      name: 'Dr. Manish Gaur',
      role: 'FACULTY',
      facultyProfile: {
        create: {
          department: 'Computer Science & Engineering',
          title: 'Assistant Professor',
        },
      },
    },
  });

  const faculty2 = await prisma.user.create({
    data: {
      email: 'priya.sharma@iiitu.ac.in',
      password: facultyPasswordHash,
      name: 'Dr. Priya Sharma',
      role: 'FACULTY',
      facultyProfile: {
        create: {
          department: 'Computer Science & Engineering',
          title: 'Associate Professor',
        },
      },
    },
  });

  const faculty3 = await prisma.user.create({
    data: {
      email: 'amit.singh@iiitu.ac.in',
      password: facultyPasswordHash,
      name: 'Prof. Amit Singh',
      role: 'FACULTY',
      facultyProfile: {
        create: {
          department: 'Computer Science & Engineering',
          title: 'Professor',
        },
      },
    },
  });

  const faculty4 = await prisma.user.create({
    data: {
      email: 'neha.verma@iiitu.ac.in',
      password: facultyPasswordHash,
      name: 'Dr. Neha Verma',
      role: 'FACULTY',
      facultyProfile: {
        create: {
          department: 'Mathematics',
          title: 'Assistant Professor',
        },
      },
    },
  });

  const faculty5 = await prisma.user.create({
    data: {
      email: 'rahul.mehta@iiitu.ac.in',
      password: facultyPasswordHash,
      name: 'Dr. Rahul Mehta',
      role: 'FACULTY',
      facultyProfile: {
        create: {
          department: 'Electronics & Communication',
          title: 'Associate Professor',
        },
      },
    },
  });

  // Students (batch 2024)
  const students2024 = [];
  const studentNames2024 = [
    { name: 'Student 24429', email: '24429@iiitu.ac.in', major: 'Computer Science & Engineering' },
    { name: 'Arjun Patel', email: '24101@iiitu.ac.in', major: 'Computer Science & Engineering' },
    { name: 'Sneha Reddy', email: '24102@iiitu.ac.in', major: 'Computer Science & Engineering' },
    { name: 'Vikram Singh', email: '24103@iiitu.ac.in', major: 'Computer Science & Engineering' },
    { name: 'Ananya Iyer', email: '24104@iiitu.ac.in', major: 'Computer Science & Engineering' },
    { name: 'Rohan Gupta', email: '24105@iiitu.ac.in', major: 'Computer Science & Engineering' },
    { name: 'Priya Nair', email: '24106@iiitu.ac.in', major: 'Electronics & Communication' },
    { name: 'Karthik Kumar', email: '24107@iiitu.ac.in', major: 'Electronics & Communication' },
    { name: 'Divya Sharma', email: '24108@iiitu.ac.in', major: 'Electronics & Communication' },
    { name: 'Aditya Malhotra', email: '24109@iiitu.ac.in', major: 'Information Technology' },
  ];

  for (const std of studentNames2024) {
    const student = await prisma.user.create({
      data: {
        email: std.email,
        password: studentPasswordHash,
        name: std.name,
        role: 'STUDENT',
        studentProfile: {
          create: {
            enrollmentYear: 2024,
            major: std.major,
          },
        },
      },
    });
    students2024.push(student);
  }

  // Students (batch 2023)
  const students2023 = [];
  const studentNames2023 = [
    { name: 'Rahul Verma', email: '23201@iiitu.ac.in', major: 'Computer Science & Engineering' },
    { name: 'Sakshi Agarwal', email: '23202@iiitu.ac.in', major: 'Computer Science & Engineering' },
    { name: 'Ayush Tiwari', email: '23203@iiitu.ac.in', major: 'Computer Science & Engineering' },
    { name: 'Pooja Desai', email: '23204@iiitu.ac.in', major: 'Electronics & Communication' },
    { name: 'Nikhil Joshi', email: '23205@iiitu.ac.in', major: 'Information Technology' },
  ];

  for (const std of studentNames2023) {
    const student = await prisma.user.create({
      data: {
        email: std.email,
        password: studentPasswordHash,
        name: std.name,
        role: 'STUDENT',
        studentProfile: {
          create: {
            enrollmentYear: 2023,
            major: std.major,
          },
        },
      },
    });
    students2023.push(student);
  }

  console.log(`✓ Created ${2 + 2 + 5 + students2024.length + students2023.length} users\n`);

  // ============= COURSES =============
  console.log('📚 Creating courses...');

  const courses = await Promise.all([
    // Core CS Courses
    prisma.course.create({ data: { code: 'CS101', title: 'Introduction to Programming', description: 'Fundamentals of programming using Python', credits: 4 } }),
    prisma.course.create({ data: { code: 'CS201', title: 'Data Structures and Algorithms', description: 'Study of fundamental data structures and algorithms', credits: 4 } }),
    prisma.course.create({ data: { code: 'CS301', title: 'Database Management Systems', description: 'Relational databases, SQL, and transaction management', credits: 3 } }),
    prisma.course.create({ data: { code: 'CS302', title: 'Operating Systems', description: 'Process management, memory management, and file systems', credits: 4 } }),
    prisma.course.create({ data: { code: 'CS401', title: 'Computer Networks', description: 'Network protocols, TCP/IP, and network security', credits: 3 } }),
    prisma.course.create({ data: { code: 'CS402', title: 'Machine Learning', description: 'Introduction to machine learning algorithms and applications', credits: 4 } }),
    prisma.course.create({ data: { code: 'CS403', title: 'Web Development', description: 'Full-stack web development with modern frameworks', credits: 3 } }),
    prisma.course.create({ data: { code: 'CS404', title: 'Software Engineering', description: 'Software development lifecycle and best practices', credits: 3 } }),
    
    // Mathematics Courses
    prisma.course.create({ data: { code: 'MATH101', title: 'Calculus I', description: 'Differential and integral calculus', credits: 3 } }),
    prisma.course.create({ data: { code: 'MATH201', title: 'Linear Algebra', description: 'Vector spaces, matrices, and linear transformations', credits: 3 } }),
    prisma.course.create({ data: { code: 'MATH301', title: 'Probability and Statistics', description: 'Probability theory and statistical methods', credits: 3 } }),
    
    // ECE Courses
    prisma.course.create({ data: { code: 'ECE101', title: 'Digital Electronics', description: 'Digital logic design and circuits', credits: 4 } }),
    prisma.course.create({ data: { code: 'ECE201', title: 'Signals and Systems', description: 'Signal processing and system analysis', credits: 3 } }),
    prisma.course.create({ data: { code: 'ECE301', title: 'Embedded Systems', description: 'Microcontroller programming and embedded system design', credits: 4 } }),
    
    // General Courses
    prisma.course.create({ data: { code: 'ENG101', title: 'Technical Communication', description: 'Written and oral communication skills for engineers', credits: 2 } }),
    prisma.course.create({ data: { code: 'MGT201', title: 'Engineering Economics', description: 'Economic principles for engineering decision making', credits: 2 } }),
  ]);

  console.log(`✓ Created ${courses.length} courses\n`);

  // ============= SEMESTERS =============
  console.log('📅 Creating semesters...');

  const semester1 = await prisma.semester.create({
    data: {
      name: 'Fall 2025',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-12-15'),
      isActive: false,
    },
  });

  const semester2 = await prisma.semester.create({
    data: {
      name: 'Spring 2026',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-05-30'),
      isActive: true,
    },
  });

  const semester3 = await prisma.semester.create({
    data: {
      name: 'Fall 2026',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-15'),
      isActive: false,
    },
  });

  console.log('✓ Created 3 semesters (Spring 2026 is active)\n');

  // ============= SECTIONS =============
  console.log('📂 Creating sections...');

  const facultyProfiles = await prisma.facultyProfile.findMany();

  // Spring 2026 sections (active)
  const sections = [];

  // CS courses for Spring 2026
  sections.push(await prisma.section.create({ 
    data: { courseId: courses[0].id, semesterId: semester2.id, capacity: 40, facultyId: facultyProfiles[0].id } 
  }));
  sections.push(await prisma.section.create({ 
    data: { courseId: courses[1].id, semesterId: semester2.id, capacity: 35, facultyId: facultyProfiles[0].id } 
  }));
  sections.push(await prisma.section.create({ 
    data: { courseId: courses[2].id, semesterId: semester2.id, capacity: 30, facultyId: facultyProfiles[1].id } 
  }));
  sections.push(await prisma.section.create({ 
    data: { courseId: courses[3].id, semesterId: semester2.id, capacity: 35, facultyId: facultyProfiles[2].id } 
  }));
  sections.push(await prisma.section.create({ 
    data: { courseId: courses[4].id, semesterId: semester2.id, capacity: 30, facultyId: facultyProfiles[1].id } 
  }));
  sections.push(await prisma.section.create({ 
    data: { courseId: courses[5].id, semesterId: semester2.id, capacity: 25, facultyId: facultyProfiles[2].id } 
  }));
  sections.push(await prisma.section.create({ 
    data: { courseId: courses[8].id, semesterId: semester2.id, capacity: 40, facultyId: facultyProfiles[3].id } 
  }));
  sections.push(await prisma.section.create({ 
    data: { courseId: courses[10].id, semesterId: semester2.id, capacity: 35, facultyId: facultyProfiles[3].id } 
  }));
  sections.push(await prisma.section.create({ 
    data: { courseId: courses[11].id, semesterId: semester2.id, capacity: 30, facultyId: facultyProfiles[4].id } 
  }));
  sections.push(await prisma.section.create({ 
    data: { courseId: courses[12].id, semesterId: semester2.id, capacity: 25, facultyId: facultyProfiles[4].id } 
  }));

  // Fall 2025 sections (past)
  sections.push(await prisma.section.create({ 
    data: { courseId: courses[0].id, semesterId: semester1.id, capacity: 40, facultyId: facultyProfiles[0].id } 
  }));
  sections.push(await prisma.section.create({ 
    data: { courseId: courses[8].id, semesterId: semester1.id, capacity: 40, facultyId: facultyProfiles[3].id } 
  }));

  console.log(`✓ Created ${sections.length} sections\n`);

  // ============= ENROLLMENTS =============
  console.log('📝 Creating enrollments...');

  const allStudents = [...students2024, ...students2023];
  let enrollmentCount = 0;

  // Enroll students in current semester sections
  for (let i = 0; i < 10; i++) { // First 10 sections are Spring 2026
    const section = sections[i];
    const numEnrollments = Math.min(Math.floor(Math.random() * 10) + 15, section.capacity);
    
    for (let j = 0; j < numEnrollments && j < allStudents.length; j++) {
      await prisma.enrollment.create({
        data: {
          studentId: allStudents[j].id,
          sectionId: section.id,
          status: 'ENROLLED',
        },
      });
      enrollmentCount++;
    }
  }

  // Enroll students in past semester with grades
  for (let i = 10; i < sections.length; i++) {
    const section = sections[i];
    const numEnrollments = Math.min(15, allStudents.length);
    
    for (let j = 0; j < numEnrollments; j++) {
      await prisma.enrollment.create({
        data: {
          studentId: allStudents[j].id,
          sectionId: section.id,
          status: 'ENROLLED',
        },
      });
      enrollmentCount++;
    }
  }

  console.log(`✓ Created ${enrollmentCount} enrollments\n`);

  // ============= ATTENDANCE =============
  console.log('✅ Creating attendance records...');

  let attendanceCount = 0;
  const dates = [];
  const startDate = new Date('2026-01-20');
  
  // Generate 15 class dates
  for (let i = 0; i < 15; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (i * 2)); // Classes every 2 days
    dates.push(date);
  }

  // Mark attendance for first 5 active sections
  for (let i = 0; i < 5; i++) {
    const section = sections[i];
    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId: section.id },
    });

    for (const enrollment of enrollments) {
      for (const date of dates) {
        const isPresent = Math.random() > 0.15; // 85% attendance rate
        await prisma.attendance.create({
          data: {
            studentId: enrollment.studentId,
            sectionId: section.id,
            date: date,
            isPresent: isPresent,
          },
        });
        attendanceCount++;
      }
    }
  }

  console.log(`✓ Created ${attendanceCount} attendance records\n`);

  // ============= GRADES =============
  console.log('📊 Creating grades...');

  let gradeCount = 0;
  const gradeLetters = ['S', 'A', 'B', 'C', 'D', 'E', 'I'];
  const gradeDistribution = [0.10, 0.15, 0.25, 0.25, 0.15, 0.08, 0.02]; // Distribution probabilities

  function getRandomGrade() {
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < gradeDistribution.length; i++) {
      cumulative += gradeDistribution[i];
      if (rand <= cumulative) {
        let score: number;
        // S: ≥85, A: 75-84, B: 65-74, C: 55-64, D: 45-54, E: 35-44, I: <35
        switch (gradeLetters[i]) {
          case 'S': score = 85 + Math.random() * 15; break;
          case 'A': score = 75 + Math.random() * 10; break;
          case 'B': score = 65 + Math.random() * 10; break;
          case 'C': score = 55 + Math.random() * 10; break;
          case 'D': score = 45 + Math.random() * 10; break;
          case 'E': score = 35 + Math.random() * 10; break;
          case 'I': score = Math.random() * 35; break;
          default: score = 50;
        }
        return { letter: gradeLetters[i], score: parseFloat(score.toFixed(1)) };
      }
    }
    return { letter: 'C', score: 60.0 };
  }

  // Finalized grades for past semester
  for (let i = 10; i < sections.length; i++) {
    const section = sections[i];
    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId: section.id },
    });

    for (const enrollment of enrollments) {
      const grade = getRandomGrade();
      await prisma.grade.create({
        data: {
          studentId: enrollment.studentId,
          sectionId: section.id,
          score: grade.score,
          letter: grade.letter,
          status: 'FINALIZED',
        },
      });
      gradeCount++;
    }
  }

  // Draft grades for some current semester sections
  for (let i = 0; i < 3; i++) {
    const section = sections[i];
    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId: section.id },
    });

    for (const enrollment of enrollments) {
      const grade = getRandomGrade();
      await prisma.grade.create({
        data: {
          studentId: enrollment.studentId,
          sectionId: section.id,
          score: grade.score,
          letter: grade.letter,
          status: 'DRAFT',
        },
      });
      gradeCount++;
    }
  }

  console.log(`✓ Created ${gradeCount} grades\n`);

  // ============= AUDIT LOGS =============
  console.log('📋 Creating audit logs...');

  await prisma.auditLog.createMany({
    data: [
      { userId: developer.id, action: 'SYSTEM_INIT', details: 'System initialized with seed data', ipAddress: '127.0.0.1' },
      { userId: admin1.id, action: 'CREATE_SEMESTER', details: 'Created Spring 2026 semester', ipAddress: '192.168.1.100' },
      { userId: admin1.id, action: 'PROVISION_USER', details: 'Bulk provisioned students', ipAddress: '192.168.1.100' },
      { userId: faculty1.id, action: 'CLAIM_SECTION', details: `Claimed section for ${courses[0].code}`, ipAddress: '192.168.1.105' },
      { userId: faculty2.id, action: 'CLAIM_SECTION', details: `Claimed section for ${courses[2].code}`, ipAddress: '192.168.1.106' },
    ],
  });

  console.log('✓ Created audit logs\n');

  // ============= SUMMARY =============
  console.log('🎉 Database seeding completed successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SEEDING SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👥 Users: ${2 + 2 + 5 + students2024.length + students2023.length}`);
  console.log(`   - Developers: 1`);
  console.log(`   - Admins: 2`);
  console.log(`   - Faculty: 5`);
  console.log(`   - Students: ${students2024.length + students2023.length}`);
  console.log(`📚 Courses: ${courses.length}`);
  console.log(`📅 Semesters: 3 (Spring 2026 is active)`);
  console.log(`📂 Sections: ${sections.length}`);
  console.log(`📝 Enrollments: ${enrollmentCount}`);
  console.log(`✅ Attendance Records: ${attendanceCount}`);
  console.log(`📊 Grades: ${gradeCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 DEFAULT CREDENTIALS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Developer: developer@iiitu.ac.in / Dev@2026');
  console.log('Admin: sukhsagar@iiitu.ac.in / Admin@2026');
  console.log('Faculty: manish.g@iiitu.ac.in / Faculty@2026');
  console.log('Student: 24429@iiitu.ac.in / Student@2026');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
