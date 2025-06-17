import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/api/reservations/:path*",
    "/api/courts/:path*",
    "/api/messages/:path*",
    "/api/payment/:path*",
    "/dashboard/:path*",
    "/reservations/:path*",
  ],
}; 