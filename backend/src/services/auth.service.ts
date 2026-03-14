import { db } from '../config/database';
import { profiles, organizations, orgMembers } from '../schema';
import { eq } from 'drizzle-orm';
import { auth } from '../config/auth';
import { auditService } from './audit.service';

export const authService = {
  async signUp(data: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    org_name?: string;
    org_type?: 'procuring_entity' | 'vendor';
  }) {
    const result = await auth.api.signUpEmail({
      body: { email: data.email, password: data.password, name: data.full_name },
    });

    if (!result?.user) throw new Error('Registration failed');

    await db.insert(profiles).values({
      id: result.user.id,
      full_name: data.full_name,
      email: data.email,
      role: data.role as any,
      status: 'pending',
    });

    if (data.org_name && data.org_type) {
      const [org] = await db.insert(organizations)
        .values({ name: data.org_name, type: data.org_type })
        .returning();

      if (org) {
        await db.update(profiles)
          .set({ org_id: org.id })
          .where(eq(profiles.id, result.user.id));

        await db.insert(orgMembers).values({
          org_id: org.id,
          user_id: result.user.id,
          role: data.role,
        });
      }
    }

    return { userId: result.user.id };
  },

  async signIn(email: string, password: string) {
    const result = await auth.api.signInEmail({
      body: { email, password },
    });

    const session = (result as { session?: unknown }).session;
    if (!session) throw new Error('Invalid credentials');

    const [profile] = await db.select().from(profiles)
      .where(eq(profiles.id, result.user.id))
      .limit(1);

    if (!profile) throw new Error('Profile not found');
    if (profile.status === 'pending') throw new Error('PENDING');
    if (profile.status === 'rejected') throw new Error('REJECTED');

    await db.update(profiles)
      .set({ last_login_at: new Date() })
      .where(eq(profiles.id, result.user.id));

    await auditService.log(result.user.id, profile.org_id, 'LOGIN', 'user', result.user.id, 'User logged in');

    return { user: profile, session };
  },

  async getProfileById(userId: string) {
    const [profile] = await db.select().from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    return profile ?? null;
  },
};
