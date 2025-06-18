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
        accountProvider: account?.provider,
        providerAccountId: account?.providerAccountId
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
          console.log('👤 User exists:', existingUser.id, 'with', existingUser.accounts.length, 'linked accounts');
          
          // If user has no linked accounts, manually link this Google account
          if (existingUser.accounts.length === 0) {
            console.log('🔗 Manually linking Google account to existing user');
            try {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account?.type || 'oauth',
                  provider: account?.provider || 'google',
                  providerAccountId: account?.providerAccountId || '',
                  access_token: account?.access_token || null,
                  expires_at: account?.expires_at || null,
                  refresh_token: account?.refresh_token || null,
                  scope: account?.scope || null,
                  token_type: account?.token_type || null,
                  id_token: account?.id_token || null,
                  session_state: account?.session_state || null,
                }
              });
              console.log('✅ Successfully linked Google account to existing user');
            } catch (linkError) {
              console.error('❌ Error linking account:', linkError);
            }
            return true;
          }
          
          // Check if this Google account is already linked
          const hasGoogleAccount = existingUser.accounts.some(
            (acc: any) => acc.provider === 'google' && acc.providerAccountId === account?.providerAccountId
          );
          
          if (hasGoogleAccount) {
            console.log('✅ Google account already linked - allowing sign in');
            return true;
          }
          
          // If user has other accounts but not this Google account, allow linking
          console.log('⚠️ User has other accounts but not this Google account - allowing link');
          return true;
        } else {
          console.log('👤 Creating new user via adapter');
          return true;
        }
      } catch (error) {
        console.error('❌ Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user, account, trigger }) {
      console.log('🔄 JWT callback:', { 
        trigger,
        tokenEmail: token.email,
        hasUser: !!user,
        userData: user,
        currentToken: token
      });
      
      // If we have user data, update the token
      if (user) {
        console.log('👤 Setting user data in JWT token:', user.email);
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      
      // If we have a token but no user, ensure we have the basic data
      if (token.email && !token.id) {
        console.log('⚠️ Token has email but no ID, fetching user data');
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { id: true, name: true, email: true, image: true }
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.name = dbUser.name;
            token.picture = dbUser.image;
            console.log('✅ Updated token with user data from database');
          }
        } catch (error) {
          console.error('❌ Error fetching user data for token:', error);
        }
      }
      
      console.log('🔄 Final JWT token being returned:', token);
      return token;
    },
    async session({ session, token }) {
      console.log('🔑 Session callback triggered:', { 
        sessionUser: session.user?.email,
        tokenId: token.id,
        tokenEmail: token.email,
        hasToken: !!token.email,
        fullToken: token,
        fullSession: session
      });
      
      // Always set user data from token
      if (token.email) {
        console.log('👤 Setting session user data from token:', {
          id: token.id,
          email: token.email,
          name: token.name
        });
        
        // Create a new session object to avoid mutation issues
        const updatedSession = {
          ...session,
          user: {
            id: token.id as string,
            email: token.email as string,
            name: token.name as string,
            image: token.picture as string || null,
          }
        };
        
        console.log('✅ Session user data set:', updatedSession.user);
        console.log('🔑 Final session being returned:', updatedSession);
        return updatedSession;
      } else {
        console.log('⚠️ No token email found, returning original session');
        return session;
      }
    }
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
    signOut: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours instead of 30 days
  },
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
        domain: process.env.NODE_ENV === 'production' ? '.pickleyourspot.com' : undefined
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
}; 