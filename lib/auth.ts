import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // Request repo scope so we can list private + public repos
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],

  callbacks: {
    /**
     * Persist the OAuth access_token and GitHub user id into the JWT.
     * This runs exclusively on the server — never sent to the browser.
     */
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.userId = String((profile as { id?: number })?.id ?? "");
      }
      return token;
    },

    /**
     * Shape the session object — accessToken is stored here server-side
     * but is deliberately NOT serialised into the client-side session cookie.
     * Only id / name / email / image reach the browser.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
      }
      // Attach access token for server-side use (API routes / RSC)
      (session as unknown as { accessToken: string }).accessToken =
        token.accessToken as string;
      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 1 day
  },

  pages: {
    signIn: "/",
    error: "/",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
