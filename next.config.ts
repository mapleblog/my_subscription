import type { NextConfig } from "next";
import { validateEnv } from "./src/lib/env-check";

// Validate environment variables during build
validateEnv();

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true,
};

export default nextConfig;
