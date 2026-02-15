import { Request, Response, NextFunction } from 'express';

export const testController = {
  async test(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ message: 'Test successful' });
    } catch (err) {
      next(err);
    }
  },
};
```
</tool_response>
