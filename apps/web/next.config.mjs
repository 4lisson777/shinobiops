/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  // Enable standalone output for Docker deployments
  output: "standalone",
}

export default nextConfig
