// auth.config.ts

import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextResponse } from "next/server";

export default {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
    }),
  ],

  callbacks: {
    authorized({ request, auth }) {
      if (!request.cookies.get("sessionCartId")) {
        const sessionCartId = crypto.randomUUID();

        const response = NextResponse.next();

        response.cookies.set("sessionCartId", sessionCartId);

        return response;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
