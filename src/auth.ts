import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/db';
import { employees } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [emp] = await db
          .select()
          .from(employees)
          .where(eq(employees.email, credentials.email as string));

        if (!emp?.passwordHash) return null;
        if (emp.status !== 'active') return null;

        const valid = await bcrypt.compare(credentials.password as string, emp.passwordHash);
        if (!valid) return null;

        return {
          id: emp.id,
          email: emp.email,
          name: emp.fullName,
          companyId: emp.companyId,
          role: emp.role,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.companyId = (user as { companyId: string }).companyId;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as { companyId: string }).companyId = token.companyId as string;
      (session.user as { role: string }).role = token.role as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
