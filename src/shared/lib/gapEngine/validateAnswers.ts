export interface ValidationResult {
  correctCount: number;
  totalCount: number;
  correctGaps: number[];
  incorrectGaps: number[];
  hint: string;
}

export function validateAnswers(
  answerKey: Record<number, string>,
  userAnswers: Record<number, string>
): ValidationResult {
  const gapIds = Object.keys(answerKey).map(Number);
  const totalCount = gapIds.length;

  const correctGaps: number[] = [];
  const incorrectGaps: number[] = [];

  gapIds.forEach((gapId) => {
    const correctAnswer = answerKey[gapId]?.trim();
    const userAnswer = userAnswers[gapId]?.trim();

    if (correctAnswer && userAnswer === correctAnswer) {
      correctGaps.push(gapId);
    } else if (userAnswer) {
      incorrectGaps.push(gapId);
    }
  });

  const correctCount = correctGaps.length;

  let hint = '';
  if (correctCount === totalCount) {
    hint = 'Perfect! All answers are correct.';
  } else if (correctCount === 0 && totalCount > 0) {
    hint = 'Try again! Review the code structure.';
  } else if (incorrectGaps.length > 0) {
    hint = 'Almost there! Review your last answer.';
  } else {
    hint = 'Fill in all the gaps to continue.';
  }

  return {
    correctCount,
    totalCount,
    correctGaps,
    incorrectGaps,
    hint,
  };
}
