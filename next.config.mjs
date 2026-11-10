/** @type {import('next').NextConfig} */
const nextConfig = {
  // PGlite ships WASM + data files; keep it out of the server bundle.
  serverExternalPackages: ["@electric-sql/pglite"],
};
export default nextConfig;
