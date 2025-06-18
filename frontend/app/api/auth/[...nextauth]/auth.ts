import { AuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import prisma from '@/lib/prisma';

// Custom adapter to set default role
const customPrismaAdapter = PrismaAdapter(prisma);

export const authOptions: AuthOptions = {
  adapter: {
    ...customPrismaAdapter,
    createUser: async (data: any) => {
      const user = await prisma.user.create({
        data: {
          ...data,
          role: 'FREE' // Set default role
        }
      });
      return user;
    }
  },
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
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 SignIn callback triggered:', { 
        userEmail: user.email, 
        userName: user.name,
        accountProvider: account?.provider 
      });

      if (!user.email) {
        console.log('❌ No email provided, sign-in failed');
        return false;
      }

      // Let PrismaAdapter handle user creation
      console.log('✅ Sign-in allowed, PrismaAdapter will handle user creation');
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('🔑 Session callback triggered:', { 
        sessionUser: session.user?.email,
        tokenId: token.id,
        tokenEmail: token.email 
      });
      
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.pickleyourspot.com' : undefined
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
}; 