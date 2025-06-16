import NextAuth from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import prisma from '@/lib/prisma';
import { Session } from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';
import type { Account, Profile } from 'next-auth';
import type { User } from '@prisma/client';

const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    signIn: async ({ user, account, profile }: { 
      user: User | AdapterUser; 
      account: Account | null; 
      profile?: Profile 
    }) => {
      if (!user.email) return false;
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { accounts: true }
      });

      // If user exists but doesn't have a Google account, allow linking
      if (existingUser && !existingUser.accounts.some((acc: Account) => acc.provider === 'google')) {
        return true;
      }

      // If user doesn't exist, allow sign in
      if (!existingUser) {
        return true;
      }

      // If user exists and has a Google account, allow sign in
      return existingUser.accounts.some((acc: Account) => acc.provider === 'google');
    },
    session: async ({ session, user }: { session: Session; user: AdapterUser }) => {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 