import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';
import { auth } from '../config/auth';

export const authController = {
  async signUp(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    if (!body.email || !body.password || !body.full_name || !body.role) {
      return reply.code(400).send({ error: 'email, password, full_name, and role are required.' });
    }
    try {
      const result = await authService.signUp(body);
      return reply.code(201).send({
        message: 'Registration successful. Your account is pending admin approval.',
        userId: result.userId,
      });
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  },

  async signIn(req: FastifyRequest, reply: FastifyReply) {
    const { email, password } = req.body as any;
    try {
      const result = await authService.signIn(email, password);
      const s = result.session as { token: string; expiresAt: unknown };
      return reply.send({ user: result.user, session: { token: s.token, expiresAt: s.expiresAt } });
    } catch (err: any) {
      if (err.message === 'PENDING') return reply.code(403).send({ error: 'Your account is pending admin approval.' });
      if (err.message === 'REJECTED') return reply.code(403).send({ error: 'Your registration was not approved. Contact support.' });
      return reply.code(401).send({ error: 'Invalid email or password.' });
    }
  },

  async signOut(req: FastifyRequest, reply: FastifyReply) {
    await auth.api.signOut({ headers: req.headers as Record<string, string> });
    return reply.send({ success: true });
  },

  async getProfile(req: FastifyRequest, reply: FastifyReply) {
    return reply.send(req.user);
  },
};
