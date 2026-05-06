import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        url: "https://github.com/login/oauth/authorize",
        params: {
          scope: "read:user user:email repo",
          prompt: "consent",
        },
      },
    }),
    Credentials({
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.username === "admin" && credentials?.password === "admin123") {
          return { id: "1", name: "Admin", email: "admin@example.com" };
        }
        return null;
      }
    })
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        if (profile) {
           token.userId = String((profile as { id?: number })?.id ?? "");
           
           // Persist GitHub token to the "admin" user for persistence across logins
           if (account.provider === "github") {
              try {
                await prisma.user.upsert({
                  where: { username: "admin" },
                  update: { githubAccessToken: account.access_token },
                  create: { 
                    username: "admin", 
                    password: "password_not_needed", 
                    githubAccessToken: account.access_token 
                  }
                });
              } catch (e) {
                console.error("Failed to persist github token:", e);
              }
           }
        } else if (account.provider === "credentials") {
           token.userId = "1";
        }
      } else if (!token.accessToken) {
        // Subsequent hits: try to load from DB if missing in current session
        try {
          const dbUser = await prisma.user.findUnique({
             where: { username: "admin" }
          });
          if (dbUser?.githubAccessToken) {
            token.accessToken = dbUser.githubAccessToken;
          }
        } catch (e) {
          console.error("Failed to load persisted token:", e);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
      }
      (session as any).accessToken = token.accessToken as string;
      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 1 day
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});
