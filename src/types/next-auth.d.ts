import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      companyId: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    companyId: string;
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    companyId: string;
    role: string;
  }
}
