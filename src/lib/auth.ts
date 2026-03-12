import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { normalizePhilippineMobile } from "@/lib/mobileNumber";

const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_WINDOW_MS = 15 * 60 * 1000;

type LoginAttemptState = {
  failures: number;
  blockedUntil: number;
};

const globalForAuthRateLimit = globalThis as unknown as {
  loginAttempts: Map<string, LoginAttemptState> | undefined;
};

const loginAttempts =
  globalForAuthRateLimit.loginAttempts ?? new Map<string, LoginAttemptState>();

if (process.env.NODE_ENV !== "production") {
  globalForAuthRateLimit.loginAttempts = loginAttempts;
}

function getClientIp(request: Request | undefined) {
  if (!request) return "unknown";
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

function getAttemptKey(mobileNumber: string, request: Request | undefined) {
  return `${mobileNumber}:${getClientIp(request)}`;
}

function isBlocked(key: string) {
  const state = loginAttempts.get(key);
  if (!state) return false;

  if (Date.now() >= state.blockedUntil) {
    loginAttempts.delete(key);
    return false;
  }

  return true;
}

function recordFailedAttempt(key: string) {
  const current = loginAttempts.get(key);
  const failures = (current?.failures ?? 0) + 1;

  loginAttempts.set(key, {
    failures,
    blockedUntil:
      failures >= MAX_FAILED_ATTEMPTS ? Date.now() + BLOCK_WINDOW_MS : 0,
  });
}

function clearAttemptState(key: string) {
  loginAttempts.delete(key);
}

// Compare against a known hash to reduce timing differences for invalid users.
const DUMMY_BCRYPT_HASH =
  "$2a$10$tgTJYGL7zWR3mL2q2qO5dOcgAiM9Q0OG6fN6fGfBFyfDG6jVQFh6e";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        mobileNumber: { label: "Mobile number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.mobileNumber || !credentials?.password) return null;

        const normalizedMobile = normalizePhilippineMobile(
          credentials.mobileNumber as string
        );
        if (!normalizedMobile) return null;

        const key = getAttemptKey(normalizedMobile, request);
        if (isBlocked(key)) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { mobileNumber: normalizedMobile },
          });
          if (!user) {
            await bcrypt.compare(credentials.password as string, DUMMY_BCRYPT_HASH);
            recordFailedAttempt(key);
            return null;
          }

          const valid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          if (!valid) {
            recordFailedAttempt(key);
            return null;
          }

          clearAttemptState(key);

          return {
            id: user.id,
            email: user.mobileNumber,
            name: user.businessName,
          };
        } catch (error) {
          console.error("Credentials authorize failed:", error);
          return null;
        }
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
