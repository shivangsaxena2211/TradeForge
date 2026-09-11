import NextAuth from "next-auth";

import { authConfig } from "./auth.config";

const { auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
});

export default auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/markets/:path*",
    "/portfolio/:path*",
    "/orders/:path*",
    "/transactions/:path*",
    "/wallet/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
