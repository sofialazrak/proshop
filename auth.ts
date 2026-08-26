// import NextAuth from "next-auth";
// import { PrismaAdapter } from "@auth/prisma-adapter";
// import { prisma } from "@/db/prisma";
// import CredentialsProvider from "next-auth/providers/credentials";
// import { compareSync } from "bcrypt-ts-edge";
// import type { NextAuthConfig } from "next-auth";
// import { cookies } from "next/headers";
// import { NextResponse } from "next/server";

// export const config = {
//   pages: {
//     signIn: "/sign-in",
//     error: "sign-in",
//   },
//   session: {
//     strategy: "jwt",
//     maxAge: 30 * 24 * 60 * 60,
//   },
//   adapter: PrismaAdapter(prisma),
//   providers: [
//     CredentialsProvider({
//       credentials: {
//         email: { type: "email" },
//         password: { type: "password" },
//       },
//       async authorize(credentials) {
//         if (credentials == null) return null;

//         const user = await prisma.user.findFirst({
//           where: {
//             email: credentials.email as string,
//           },
//         });
//         if (user && user.password) {
//           const isMatch = compareSync(
//             credentials.password as string,
//             user.password,
//           );
//           if (isMatch) {
//             return {
//               id: user.id,
//               name: user.name,
//               email: user.email,
//               role: user.role,
//             };
//           }
//         }
//         return null;
//       },
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, user, trigger, session }: any) {
//       // Persist the OAuth access_token to the token right after signin
//       if (user) {
//         token.role = user.role;

//         // If user has no name then use first part of the email
//         if (user.name === "NO_NAME") {
//           token.name = user.email.split("@");
//         }

//         // Update database to reflect user name
//         await prisma.user.update({
//           where: { id: user.id },
//           data: { name: token.name },
//         });
//       }
//       return token;
//     },
//     async session({ session, user, trigger, token }: any) {
//       // Set the user ID from the token
//       session.user.id = token.sub;
//       session.user.role = token.role;
//       session.user.name = token.name;

//       // if there is an update set the user name
//       if (trigger === "update") {
//         session.user.name = user.name;
//       }

//       return session;
//     },
//     authorized({ request, auth }: any) {
//       // Check for session cart cookie
//       if (!request.cookies.get("sessionCartId")) {
//         // Generate new session cart id cookie
//         const sessionCartId = crypto.randomUUID();

//         // Clone request headers
//         const newRequestHeaders = new Headers(request.headers);

//         // Create new response and add new headers
//         const response = NextResponse.next({
//           headers: newRequestHeaders,
//         });

//         // Set newly generated sessionCartId in response cookies
//         response.cookies.set("sessionCartId", sessionCartId);

//         return response;
//       } else {
//         return true;
//       }
//     },
//   },
// } satisfies NextAuthConfig;

// export const { handlers, auth, signIn, signOut } = NextAuth(config);

// auth.ts

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/db/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import { compareSync } from "bcrypt-ts-edge";
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },

      async authorize(credentials) {
        if (!credentials) return null;

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user?.password) return null;

        const isMatch = compareSync(
          credentials.password as string,
          user.password,
        );

        if (!isMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;

        const name =
          user.name && user.name !== "NO_NAME"
            ? user.name
            : (user.email?.split("@")[0] ?? "NO_NAME");

        token.name = name;

        await prisma.user.update({
          where: { id: user.id },
          data: { name },
        });
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.role = token.role;
      session.user.name = token.name;

      return session;
    },
  },
});
