export function calculateFinalScore(
  course: { type: string; credits: number; theoryCredits?: number | null; labCredits?: number | null },
  marks: {
    theoryCa?: number | null; theoryMt?: number | null; theoryEs?: number | null;
    labCa?: number | null; labFr?: number | null; labEs?: number | null;
    projectCa?: number | null; projectMr?: number | null; projectEs?: number | null;
  }
): number {
  let score = 0;

  const tScore = (marks.theoryCa || 0) + (marks.theoryMt || 0) + (marks.theoryEs || 0);
  const lScore = (marks.labCa || 0) + (marks.labFr || 0) + (marks.labEs || 0);
  const pScore = (marks.projectCa || 0) + (marks.projectMr || 0) + (marks.projectEs || 0);

  if (course.type === 'THEORY') {
    score = tScore;
  } else if (course.type === 'LAB') {
    score = lScore;
  } else if (course.type === 'PROJECT') {
    score = pScore;
  } else if (course.type === 'THEORY_LAB') {
    const defaultTheoryWeight = 0.75;
    const defaultLabWeight = 0.25;

    let tWeight = defaultTheoryWeight;
    let lWeight = defaultLabWeight;

    if (course.theoryCredits && course.labCredits) {
      const total = course.theoryCredits + course.labCredits;
      if (total > 0) {
        tWeight = course.theoryCredits / total;
        lWeight = course.labCredits / total;
      }
    }

    score = (tScore * tWeight) + (lScore * lWeight);
  }

  return Number(score.toFixed(1));
}

export function calculateLetterGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  if (score >= 40) return 'E';
  return 'F';
}