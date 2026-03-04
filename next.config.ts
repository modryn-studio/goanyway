import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // reactCompiler requires babel-plugin-react-compiler — enable when installed
  // reactCompiler: true,
  // basePath is filled in by /init from the URL field in context.md.
  // Format: '/tools/your-slug'
  // Must match the source path in modryn-studio-v2's next.config.ts rewrites().
  basePath: '/tools/goanyway',
};

export default nextConfig;
