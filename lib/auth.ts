// lib/auth.ts
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByEmail } from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log("Authorize called with credentials:", credentials);
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await getUserByEmail(credentials.email);
          console.log("User found:", user ? user.email : "Not found");
          if (!user) return null;

          // Demo: compare plaintext password (in production use bcrypt)
          const isValid = user.password === credentials.password.trim();
          console.log("Password valid:", isValid);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.displayName,
            role: user.role,
            membershipId: user.membershipId,
            isNewMember: user.isNewMember,
            firstBillUsed: user.firstBillUsed,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },


    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as Record<string, unknown>).role;
        token.membershipId = (user as unknown as Record<string, unknown>).membershipId;
        token.isNewMember = (user as unknown as Record<string, unknown>).isNewMember;
        token.firstBillUsed = (user as unknown as Record<string, unknown>).firstBillUsed;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.membershipId = token.membershipId as string | null;
        session.user.isNewMember = token.isNewMember as boolean;
        session.user.firstBillUsed = token.firstBillUsed as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'gaming-cafe-super-secret-key-change-in-prod',
};
