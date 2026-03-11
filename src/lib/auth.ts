import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { normalizePhilippineMobile } from "@/lib/mobileNumber";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        mobileNumber: { label: "Mobile number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.mobileNumber || !credentials?.password) return null;

        const normalizedMobile = normalizePhilippineMobile(
          credentials.mobileNumber as string
        );
        if (!normalizedMobile) return null;

        const user = await prisma.user.findUnique({
          where: { mobileNumber: normalizedMobile },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!valid) return null;
        return { id: user.id, email: user.mobileNumber, name: user.businessName };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});
