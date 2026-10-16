/**
 * Parental Gate verification logic with child-friendly math questions and unit tests.
 * Ensures young children stay inside learning screens, while parents can access settings.
 */

export interface MathChallenge {
  num1: number;
  num2: number;
  operation: '+' | 'x';
  answer: number;
  questionKu: string;
}

export function generateParentGateChallenge(): MathChallenge {
  // Simple multi-digit or multiplication question that a 3-8 child won't casually bypass
  const ops: ('+' | 'x')[] = ['+', 'x'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  if (op === '+') {
    const num1 = Math.floor(Math.random() * 15) + 12; // 12 to 26
    const num2 = Math.floor(Math.random() * 12) + 8; // 8 to 19
    const answer = num1 + num2;
    return {
      num1,
      num2,
      operation: '+',
      answer,
      questionKu: `${num1} + ${num2} دەکاتە چەند؟`,
    };
  } else {
    const num1 = Math.floor(Math.random() * 6) + 4; // 4 to 9
    const num2 = Math.floor(Math.random() * 6) + 3; // 3 to 8
    const answer = num1 * num2;
    return {
      num1,
      num2,
      operation: 'x',
      answer,
      questionKu: `${num1} × ${num2} دەکاتە چەند؟`,
    };
  }
}

export function verifyParentGateAnswer(expected: number, provided: number | string): boolean {
  if (provided === '' || provided === null || provided === undefined) return false;
  const parsed = Number(provided);
  if (isNaN(parsed)) return false;
  return parsed === expected;
}

/**
 * Unit tests for Parental Gate validation
 */
export function runParentGateTests(): { passed: boolean; message: string }[] {
  const challenge: MathChallenge = {
    num1: 14,
    num2: 12,
    operation: '+',
    answer: 26,
    questionKu: '14 + 12 دەکاتە چەند؟',
  };

  // Test 1: Correct number succeeds
  const t1 = {
    passed: verifyParentGateAnswer(challenge.answer, 26) === true,
    message: 'Correct numeric answer verifies successfully',
  };

  // Test 2: Correct string input succeeds
  const t2 = {
    passed: verifyParentGateAnswer(challenge.answer, '26') === true,
    message: 'Correct string answer parses and verifies',
  };

  // Test 3: Incorrect answer fails
  const t3 = {
    passed: verifyParentGateAnswer(challenge.answer, 25) === false,
    message: 'Incorrect answer is rejected safely',
  };

  // Test 4: Blank/gibberish fails
  const t4 = {
    passed: verifyParentGateAnswer(challenge.answer, 'abc') === false && verifyParentGateAnswer(challenge.answer, '') === false,
    message: 'Empty and non-numeric inputs are rejected safely',
  };

  return [t1, t2, t3, t4];
}
