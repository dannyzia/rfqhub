import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";

export const authController = {
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = req.body;
      const result = await authService.register(input);
      res.status(201).json({
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body;
      const result = await authService.login(input);
      res.status(200).json({
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = req.body;
      const result = await authService.refreshToken(input);
      res.status(200).json({
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = req.body;
      await authService.forgotPassword(input);
      res.status(200).json({
        data: { message: "Password reset email sent" },
      });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = req.body;
      const result = await authService.resetPassword(input);
      res.status(200).json({
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken =
        req.body.refreshToken || req.headers.authorization?.split(" ")[1];
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.status(200).json({
        data: { message: "Logged out successfully" },
      });
    } catch (err) {
      next(err);
    }
  },

  async getMe(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            message: "Authentication required",
            code: "AUTHENTICATION_REQUIRED",
            statusCode: 401,
          },
        });
        return;
      }
      const user = await authService.getMe(req.user.id);
      res.status(200).json({ data: { user } });
    } catch (err) {
      next(err);
    }
  },
};
