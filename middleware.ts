import { withAuth } from "next-auth/middleware";

export default withAuth({
  // Matches the pages that require authentication
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
