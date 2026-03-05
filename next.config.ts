import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // reactCompiler requires babel-plugin-react-compiler — enable when installed
  // reactCompiler: true,
  // Served under modrynstudio.com/tools/goanyway via rewrites in modryn-studio-v2.
  // The v2 rewrite destination must include this prefix for Next.js routing to resolve correctly.
  basePath: '/tools/goanyway',
};

export default nextConfig;
