import { withAuth } from "next-auth/middleware";

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET || 'gaming-cafe-super-secret-key-change-in-prod',
});

export const config = {
  matcher: [
    "/booking/:path*",
    "/my-bookings/:path*",
    "/membership/:path*",
    "/staff/:path*",
    "/accounting/:path*",
    "/manager/:path*",
    "/admin/:path*",
  ],
};
