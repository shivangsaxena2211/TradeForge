import type { NextAuthConfig } from "next-auth";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/markets",
  "/portfolio",
  "/orders",
  "/transactions",
  "/wallet",
  "/settings",
] as const;

const AUTH_ROUTES = ["/login", "/register"] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isAuthPath(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const pathname = nextUrl.pathname;

      if (isProtectedPath(pathname) && !isLoggedIn) {
        return false;
      }

      if (isLoggedIn && isAuthPath(pathname)) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.username = user.name;
        token.email = user.email;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.name =
          (token.username as string | undefined) ?? session.user.name;
        session.user.email =
          (token.email as string | undefined) ?? session.user.email;
      }

      return session;
    },
  },
};
