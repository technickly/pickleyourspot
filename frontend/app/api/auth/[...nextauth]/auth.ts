import { AuthOptions, DefaultSession, Account } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import prisma from '@/lib/prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      accessToken?: string;
    } & DefaultSession['user'];
  }

  interface Token {
    accessToken?: string;
  }
}

export const authOptions: AuthOptions = {
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  pages: {
    signIn: '/',
    error: '/',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      try {
        // Create or update user in database
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            image: user.image,
          },
          create: {
            email: user.email,
            name: user.name,
            image: user.image,
          },
        });
        return true;
      } catch (error) {
        console.error('Error saving user to database:', error);
        return false;
      }
    },
    async jwt({ token, account }: { token: any; account: Account | null }) {
      if (account?.access_token) {
        token.accessToken = account.access_token as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.accessToken = token.accessToken;
        
        // Add user ID to session
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email! },
          select: { id: true },
        });
        
        if (dbUser) {
          session.user.id = dbUser.id;
        }
      }
      return session;
    },
  },
}; 