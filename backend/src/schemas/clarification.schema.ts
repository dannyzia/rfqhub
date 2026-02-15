import { z } from 'zod';

export const createQuestionSchema = z.object({
  questionText: z.string().min(10).max(2000),
  isPublic: z.boolean().default(false),
});

export const answerQuestionSchema = z.object({
  answerText: z.string().min(1).max(5000),
  createsAddendum: z.boolean().default(false),
});

export const questionIdSchema = z.object({
  questionId: z.string().uuid(),
});

export const questionFilterSchema = z.object({
  status: z.enum(['open', 'answered', 'closed']).optional(),
  isPublic: z.boolean().optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type AnswerQuestionInput = z.infer<typeof answerQuestionSchema>;
export type QuestionIdInput = z.infer<typeof questionIdSchema>;
export type QuestionFilterInput = z.infer<typeof questionFilterSchema>;
