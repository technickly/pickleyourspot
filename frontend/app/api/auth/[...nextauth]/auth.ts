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

      // Check if user exists and allow sign in
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true }
        });

        if (existingUser) {
          console.log('👤 User exists:', existingUser.id);
          // Check if this Google account is already linked
          const hasGoogleAccount = existingUser.accounts.some(
            (acc: any) => acc.provider === 'google' && acc.providerAccountId === account?.providerAccountId
          );
          
          if (!hasGoogleAccount && existingUser.accounts.length > 0) {
            console.log('⚠️ Account not linked - allowing link');
            // Allow linking new Google account to existing user
            return true;
          }
        } else {
          console.log('👤 Creating new user via adapter');
        }
        
        return true;
      } catch (error) {
        console.error('❌ Error in signIn callback:', error);
        return false;
      }
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
    signOut: '/',
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