import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/security"

type LoginAttemptRecord = {
  failedCount: number;
  lockUntil: number;
};

const authStore = globalThis as typeof globalThis & {
  __htgAuthAttemptStore?: Map<string, LoginAttemptRecord>;
};

if (!authStore.__htgAuthAttemptStore) {
  authStore.__htgAuthAttemptStore = new Map<string, LoginAttemptRecord>();
}

const LOGIN_LOCK_THRESHOLD = 5;
const LOGIN_LOCK_MS = 10 * 60 * 1000;

function getLoginAttemptKey(email: string, portal: string) {
  return `${email.toLowerCase()}:${portal}`;
}

function isLoginLocked(key: string) {
  const record = authStore.__htgAuthAttemptStore?.get(key);
  if (!record) return false;
  if (record.lockUntil <= Date.now()) {
    authStore.__htgAuthAttemptStore?.delete(key);
    return false;
  }
  return true;
}

function markLoginFailure(key: string) {
  const now = Date.now();
  const record = authStore.__htgAuthAttemptStore?.get(key) ?? { failedCount: 0, lockUntil: 0 };
  if (record.lockUntil > now) return;
  record.failedCount += 1;
  if (record.failedCount >= LOGIN_LOCK_THRESHOLD) {
    record.lockUntil = now + LOGIN_LOCK_MS;
    record.failedCount = 0;
  }
  authStore.__htgAuthAttemptStore?.set(key, record);
}

function clearLoginFailure(key: string) {
  authStore.__htgAuthAttemptStore?.delete(key);
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  jwt: {
    maxAge: 60 * 60 * 8,
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        portal: { label: "Portal", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const portal = credentials.portal === "admin" ? "admin" : credentials.portal === "judge" ? "judge" : "general";
        const attemptKey = getLoginAttemptKey(credentials.email, portal);
        if (isLoginLocked(attemptKey)) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        const passwordOk = !!user?.passwordHash && verifyPassword(user.passwordHash, credentials.password);
        if (user && passwordOk && user.isActive) {
          if (portal === "admin" && user.role !== "ADMIN") return null;
          if (portal === "judge" && user.role !== "JUDGE") return null;
          clearLoginFailure(attemptKey);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            portal
          }
        }
        markLoginFailure(attemptKey);
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.portal = user.portal ?? "general"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.portal = token.portal ?? "general"
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
  }
}
