import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import prisma from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email! },
          select: { id: true, role: true }
        });

        if (user) {
          session.user.id = user.id;
          session.user.role = user.role || 'USER';
        }
      }
      return session;
    },
    async signIn({ user }) {
      if (!user.email) return false;

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email }
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            image: user.image,
            role: 'FREE'
          }
        });
      }

      return true;
    }
  },
  pages: {
    signIn: '/',
  },
}; 