/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the dev server's files separate from production builds so running
  // `next build` cannot invalidate assets the local preview is still serving.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
