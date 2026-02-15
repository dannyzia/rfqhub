import { Request, Response, NextFunction } from 'express';
import { clarificationService } from '../services/clarification.service';
import type { CreateQuestionInput, AnswerQuestionInput } from '../schemas/clarification.schema';

export const clarificationController = {
  async createQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const input = req.body as CreateQuestionInput;
      const question = await clarificationService.createQuestion(tenderId, req.user!.orgId, input);
      res.status(201).json({ data: question });
    } catch (err) {
      next(err);
    }
  },

  async answerQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { questionId } = req.params;
      const input = req.body as AnswerQuestionInput;
      const answer = await clarificationService.answerQuestion(questionId, req.user!.id, req.user!.orgId, input);
      res.status(201).json({ data: answer });
    } catch (err) {
      next(err);
    }
  },

  async findByTenderId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const isVendor = req.user!.roles.includes('vendor') && !req.user!.roles.includes('buyer');
      const questions = await clarificationService.getQuestionsWithAnswers(
        tenderId,
        isVendor ? req.user!.orgId : undefined
      );
      res.status(200).json({ data: questions });
    } catch (err) {
      next(err);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { questionId } = req.params;
      const question = await clarificationService.findQuestionById(questionId);

      if (!question) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Question not found' } });
        return;
      }

      const answer = await clarificationService.findAnswerByQuestionId(questionId);
      res.status(200).json({ data: { ...question, answer: answer || undefined } });
    } catch (err) {
      next(err);
    }
  },

  async closeQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { questionId } = req.params;
      await clarificationService.closeQuestion(questionId, req.user!.orgId);
      res.status(200).json({ data: { message: 'Question closed' } });
    } catch (err) {
      next(err);
    }
  },
};
