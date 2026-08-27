// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export default function middleware(request: NextRequest) {
//   const response = NextResponse.next();

//   if (!request.cookies.get("sessionCartId")) {
//     response.cookies.set("sessionCartId", crypto.randomUUID());
//   }

//   return response;
// }

// export const config = {
//   matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
// };

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// export const { auth: middleware } = NextAuth(authConfig);
export default NextAuth(authConfig).auth;
