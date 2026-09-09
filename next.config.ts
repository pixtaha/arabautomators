import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // The CLI runner loses tsc stdout when detached on this VPS (Node 22),
    // while the compiler API performs the same full typecheck reliably.
    useTypeScriptCli: false,
  },
};

export default nextConfig;
