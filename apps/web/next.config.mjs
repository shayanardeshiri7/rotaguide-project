/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export: the site is all content, there is nothing to render
  // per-request, and it makes the deploy trivial.
  output: 'export',
  images: { unoptimized: true },
  // The shared token package ships untranspiled TS.
  transpilePackages: ['@rotaguide/ui'],
};

export default nextConfig;
