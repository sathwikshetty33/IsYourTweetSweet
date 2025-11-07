// src/lib/auth.ts
import TwitterProvider from "next-auth/providers/twitter";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      authorization: {
        params: {
          scope: "tweet.read users.read offline.access",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/',
    error: '/', // Redirect to home on error
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : null;
        
        // Capture Twitter ID from profile
        if (profile?.data?.id) {
          token.twitterId = profile.data.id;
        } else if (profile?.id) {
          token.twitterId = profile.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.accessToken = token.accessToken;
      session.user.refreshToken = token.refreshToken;
      session.user.twitterId = token.twitterId;
      return session;
    },
  },
  debug: true, // Enable debug mode to see detailed errors
};